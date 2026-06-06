import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const BodySchema = z.object({ redirect_to: z.string().url().optional() })

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
function callbackUrl(_req: Request) {
  return `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/oauth-supabase-connect`
}

function env(name: string, fallback?: string) {
  return (Deno.env.get(name) || (fallback ? Deno.env.get(fallback) : '') || '').trim()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const userId = await requireUser(req)
    const clientId = env('SUPA_OAUTH_CLIENT_ID', 'SUPABASE_OAUTH_CLIENT_ID')
    if (!clientId) return json({ error: 'Supabase OAuth client id is not configured' }, 400)
    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400)
    const state = crypto.randomUUID()
    const service = createClient(SUPABASE_URL, SERVICE_KEY)
    const { error } = await service.from('supabase_oauth_states').insert({ state, user_id: userId, redirect_to: parsed.data.redirect_to })
    if (error) throw error
    const params = new URLSearchParams({ client_id: clientId, redirect_uri: callbackUrl(req), response_type: 'code', state })
    return json({ authorize_url: `https://api.supabase.com/v1/oauth/authorize?${params}`, callback_url: callbackUrl(req) })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Supabase OAuth failed'
    return json({ error: msg }, msg === 'Unauthorized' ? 401 : 500)
  }
})