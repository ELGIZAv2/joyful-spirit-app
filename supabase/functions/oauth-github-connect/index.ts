import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const StartSchema = z.object({ redirect_to: z.string().url().optional() })
const ExchangeSchema = z.object({ code: z.string().min(1), state: z.string().min(1) })

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

async function requireUser(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized')
  const token = authHeader.replace('Bearer ', '')
  const sb = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } })
  const { data, error } = await sb.auth.getUser(token)
  if (error || !data?.user?.id) throw new Error('Unauthorized')
  return data.user.id
}

function edgeCallbackUrl(_req: Request) {
  return `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/oauth-github-connect`
}

function frontendCallbackUrl(req: Request) {
  const origin = req.headers.get('origin') || new URL(req.url).origin
  return `${origin}/auth/callback/github`
}

function env(name: string, fallback?: string) {
  return (Deno.env.get(name) || (fallback ? Deno.env.get(fallback) : '') || '').trim()
}

function callbackHtml(redirectTo: string | null | undefined, ok: boolean, message: string, login?: string) {
  const fallback = redirectTo || '/settings/integrations'
  const targetOrigin = fallback.startsWith('http') ? new URL(fallback).origin : '*'
  return new Response(`<!doctype html><html><body><script>
    const payload = ${JSON.stringify({ type: 'github-oauth', ok, message, login })};
    if (window.opener) { window.opener.postMessage(payload, ${JSON.stringify(targetOrigin)}); window.close(); }
    else { window.location.href = ${JSON.stringify(fallback)}; }
  </script></body></html>`, { headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const action = new URL(req.url).searchParams.get('action') || 'start'
    const clientId = env('GITHUB_OAUTH_CLIENT_ID')
    const clientSecret = env('GITHUB_OAUTH_CLIENT_SECRET')
    if (!clientId || !clientSecret) return json({ error: 'GitHub OAuth keys are not configured' }, 400)
    const service = createClient(SUPABASE_URL, SERVICE_KEY)

    if (req.method === 'GET') {
      const url = new URL(req.url)
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      if (!code || !state) return callbackHtml(undefined, false, 'Missing GitHub callback parameters')
      const { data: saved } = await service.from('github_oauth_states').select('user_id,redirect_to').eq('state', state).maybeSingle()
      if (!saved) return callbackHtml(undefined, false, 'Invalid OAuth state')
      await service.from('github_oauth_states').delete().eq('state', state)
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: edgeCallbackUrl(req), state }),
      })
      const token = await tokenRes.json()
      if (!tokenRes.ok || token.error || !token.access_token) return callbackHtml(saved.redirect_to, false, token.error_description || token.error || 'GitHub token exchange failed')
      const userRes = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${token.access_token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' } })
      const ghUser = await userRes.json()
      if (!userRes.ok) return callbackHtml(saved.redirect_to, false, 'Could not read GitHub account')
      const { error } = await service.from('user_github_connections').upsert({ user_id: saved.user_id, access_token: token.access_token, github_login: ghUser.login, github_id: ghUser.id, avatar_url: ghUser.avatar_url, scope: token.scope, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      if (error) throw error
      return callbackHtml(saved.redirect_to, true, 'GitHub connected', ghUser.login)
    }

    const userId = await requireUser(req)

    if (action === 'start') {
      const body = StartSchema.safeParse(await req.json().catch(() => ({})))
      if (!body.success) return json({ error: body.error.flatten().fieldErrors }, 400)
      const state = crypto.randomUUID()
      const { error } = await service.from('github_oauth_states').insert({ state, user_id: userId, redirect_to: body.data.redirect_to })
      if (error) throw error
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: edgeCallbackUrl(req),
        scope: 'repo read:user user:email',
        state,
      })
      return json({ authorize_url: `https://github.com/login/oauth/authorize?${params}`, callback_url: edgeCallbackUrl(req) })
    }

    if (action !== 'exchange') return json({ error: 'Invalid action' }, 400)
    const parsed = ExchangeSchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400)
    const { code, state } = parsed.data
    const { data: saved } = await service.from('github_oauth_states').select('state').eq('state', state).eq('user_id', userId).maybeSingle()
    if (!saved) return json({ error: 'Invalid OAuth state' }, 400)
    await service.from('github_oauth_states').delete().eq('state', state)

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: frontendCallbackUrl(req), state }),
    })
    const token = await tokenRes.json()
    if (!tokenRes.ok || token.error || !token.access_token) return json({ error: token.error_description || token.error || 'GitHub token exchange failed' }, 400)

    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token.access_token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    })
    const ghUser = await userRes.json()
    if (!userRes.ok) return json({ error: 'Could not read GitHub account' }, 400)

    const { error } = await service.from('user_github_connections').upsert({
      user_id: userId,
      access_token: token.access_token,
      github_login: ghUser.login,
      github_id: ghUser.id,
      avatar_url: ghUser.avatar_url,
      scope: token.scope,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    if (error) throw error
    return json({ ok: true, login: ghUser.login })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'GitHub OAuth failed'
    return json({ error: msg }, msg === 'Unauthorized' ? 401 : 500)
  }
})