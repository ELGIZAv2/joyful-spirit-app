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
function frontendCallbackUrl(req: Request) {
  const origin = req.headers.get('origin') || new URL(req.url).origin
  return `${origin}/auth/callback/supabase`
}
function edgeCallbackUrl(_req: Request) {
  return `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/oauth-supabase-connect`
}
function callbackHtml(redirectTo: string | null | undefined, ok: boolean, message: string) {
  const fallback = redirectTo || '/settings/integrations'
  const targetOrigin = fallback.startsWith('http') ? new URL(fallback).origin : '*'
  return new Response(`<!doctype html><html><head><meta charset="utf-8"><title>Supabase OAuth</title></head><body><script>
    const payload = ${JSON.stringify({ type: 'supabase-oauth', ok, message })};
    if (window.opener) { window.opener.postMessage(payload, ${JSON.stringify(targetOrigin)}); window.close(); }
    else { window.location.href = ${JSON.stringify(fallback)}; }
  </script></body></html>`, { headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } })
}

function env(name: string, fallback?: string) {
  return (Deno.env.get(name) || (fallback ? Deno.env.get(fallback) : '') || '').trim()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const clientId = env('SUPA_OAUTH_CLIENT_ID', 'SUPABASE_OAUTH_CLIENT_ID')
    const clientSecret = env('SUPA_OAUTH_CLIENT_SECRET', 'SUPABASE_OAUTH_CLIENT_SECRET')
    if (!clientId || !clientSecret) return json({ error: 'Supabase OAuth keys are not configured' }, 400)
    const service = createClient(SUPABASE_URL, SERVICE_KEY)

    const url = new URL(req.url)
    const providerError = url.searchParams.get('error_description') || url.searchParams.get('error')
    if (req.method === 'GET' && providerError) return callbackHtml(undefined, false, providerError)
    let userId: string | undefined
    let code = url.searchParams.get('code') || ''
    let state = url.searchParams.get('state') || ''
    if (req.method !== 'GET') {
      userId = await requireUser(req)
      const parsed = ExchangeSchema.safeParse(await req.json().catch(() => ({})))
      if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400)
      code = parsed.data.code
      state = parsed.data.state
    }

    const { data: saved } = await service.from('supabase_oauth_states').select('user_id,redirect_to').eq('state', state).maybeSingle()
    if (!saved) return json({ error: 'Invalid OAuth state' }, 400)
    if (userId && saved.user_id !== userId) return json({ error: 'Invalid OAuth state' }, 400)
    await service.from('supabase_oauth_states').delete().eq('state', state)

    const res = await fetch('https://api.supabase.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: edgeCallbackUrl(req) }),
    })
    const text = await res.text()
    if (!res.ok) return req.method === 'GET' ? callbackHtml(saved.redirect_to, false, `Supabase token exchange failed [${res.status}]`) : json({ error: `Supabase token exchange failed [${res.status}]: ${text}` }, 400)
    const token = JSON.parse(text)
    const expiresAt = new Date(Date.now() + Number(token.expires_in || 3600) * 1000).toISOString()
    const { error } = await service.from('user_supabase_connections').upsert({
      user_id: saved.user_id,
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: expiresAt,
      scope: token.scope,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    if (error) throw error
    if (req.method === 'GET') return callbackHtml(saved.redirect_to, true, 'Supabase connected')
    return json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Supabase OAuth failed'
    return json({ error: msg }, msg === 'Unauthorized' ? 401 : 500)
  }
})