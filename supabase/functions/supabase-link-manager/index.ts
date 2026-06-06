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

const BodySchema = z.object({
  action: z.enum(['status', 'list_projects', 'list_orgs', 'create_project', 'link_project', 'unlink_project', 'disconnect']),
  project_id: z.string().uuid().optional(),
  ref: z.string().min(1).max(128).optional(),
  name: z.string().min(1).max(255).optional(),
  organization_id: z.string().min(1).max(128).optional(),
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function requireUser(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized')
  const token = authHeader.replace('Bearer ', '')
  const supabase = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } })
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user?.id) throw new Error('Unauthorized')
  return data.user.id
}

async function apiKeyFromDb(patterns: string[]) {
  const service = createClient(SUPABASE_URL, SERVICE_KEY)
  for (const pattern of patterns) {
    const { data } = await service
      .from('api_keys')
      .select('api_key,service')
      .ilike('service', pattern)
      .eq('is_active', true)
      .eq('is_blocked', false)
      .limit(1)
    if (data?.[0]?.api_key) return data[0].api_key as string
  }
  return undefined
}

async function getManagementToken() {
  return Deno.env.get('SUPABASE_MANAGEMENT_TOKEN')
    || Deno.env.get('SUPABASE_ACCESS_TOKEN')
    || Deno.env.get('SUPABASE_TOKEN')
    || await apiKeyFromDb(['%supabase%management%', '%management%', '%supabase%'])
}

async function getUserSupabaseConnection(userId: string) {
  const service = createClient(SUPABASE_URL, SERVICE_KEY)
  const { data } = await service
    .from('user_supabase_connections')
    .select('access_token,refresh_token,expires_at')
    .eq('user_id', userId)
    .maybeSingle()
  return data as { access_token: string; refresh_token: string; expires_at: string } | null
}

async function refreshUserSupabaseToken(userId: string, refreshToken: string) {
  const clientId = (Deno.env.get('SUPA_OAUTH_CLIENT_ID') || Deno.env.get('SUPABASE_OAUTH_CLIENT_ID') || '').trim()
  const clientSecret = (Deno.env.get('SUPA_OAUTH_CLIENT_SECRET') || Deno.env.get('SUPABASE_OAUTH_CLIENT_SECRET') || '').trim()
  if (!clientId || !clientSecret) return undefined

  const params = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken })
  const res = await fetch('https://api.supabase.com/v1/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Supabase OAuth refresh failed [${res.status}]: ${text}`)
  const token = JSON.parse(text)
  const expiresAt = new Date(Date.now() + Number(token.expires_in || 3600) * 1000).toISOString()
  const service = createClient(SUPABASE_URL, SERVICE_KEY)
  await service
    .from('user_supabase_connections')
    .update({
      access_token: token.access_token,
      refresh_token: token.refresh_token || refreshToken,
      expires_at: expiresAt,
      scope: token.scope,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
  return token.access_token as string
}

async function getSupabaseAccessToken(userId?: string) {
  if (userId) {
    const connection = await getUserSupabaseConnection(userId)
    if (connection?.access_token) {
      const expires = Date.parse(connection.expires_at)
      if (Number.isFinite(expires) && expires < Date.now() + 60_000 && connection.refresh_token) {
        return await refreshUserSupabaseToken(userId, connection.refresh_token)
      }
      return connection.access_token
    }
  }
  return await getManagementToken()
}

async function supabaseManagement(path: string, init: RequestInit = {}, userId?: string) {
  const token = await getSupabaseAccessToken(userId)
  if (!token) throw new Error('Supabase Management token is not configured in backend')
  const res = await fetch(`https://api.supabase.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) throw new Error(`Supabase API failed [${res.status}]: ${text}`)
  return data
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const userId = await requireUser(req)
    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400)
    const body = parsed.data
    const token = await getSupabaseAccessToken(userId)

    if (body.action === 'status') return json({ connected: !!token, mode: token ? 'oauth_or_backend_token' : 'missing_token' })
    if (!token) return json({ error: 'Supabase Management token is not configured in backend', connected: false }, 400)

    if (body.action === 'list_projects') {
      const projects = await supabaseManagement('/projects', {}, userId)
      return json({ connected: true, projects: (projects || []).map((p: any) => ({
        id: p.id,
        ref: p.id,
        name: p.name,
        region: p.region,
        organization_id: p.organization_id,
        status: p.status,
      })) })
    }

    if (body.action === 'list_orgs') {
      const orgs = await supabaseManagement('/organizations', {}, userId)
      return json({ connected: true, orgs: (orgs || []).map((o: any) => ({ id: o.id, name: o.name })) })
    }

    if (body.action === 'create_project') {
      if (!body.name || !body.organization_id) return json({ error: 'name and organization_id are required' }, 400)
      const project = await supabaseManagement('/projects', {
        method: 'POST',
        body: JSON.stringify({ name: body.name, organization_id: body.organization_id, region: 'us-east-1' }),
      }, userId)
      return json({ ok: true, project: { id: project.id, ref: project.id, name: project.name, region: project.region, organization_id: project.organization_id } })
    }

    const service = createClient(SUPABASE_URL, SERVICE_KEY)

    if (body.action === 'link_project') {
      if (!body.project_id || !body.ref || !body.name) return json({ error: 'project_id, ref and name are required' }, 400)
      const url = `https://${body.ref}.supabase.co`
      let anonKey: string | null = null
      try {
        const keys = await supabaseManagement(`/projects/${body.ref}/api-keys`, {}, userId)
        const anon = Array.isArray(keys) ? keys.find((k: any) => String(k.name || '').toLowerCase().includes('anon')) : null
        anonKey = anon?.api_key || null
      } catch (_) { /* optional */ }
      const { error } = await service
        .from('projects')
        .update({
          linked_supabase_project_ref: body.ref,
          linked_supabase_project_name: body.name,
          linked_supabase_url: url,
          linked_supabase_anon_key: anonKey,
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.project_id)
        .eq('user_id', userId)
      if (error) throw error
      return json({ ok: true, project_ref: body.ref, url })
    }

    if (body.action === 'unlink_project') {
      if (!body.project_id) return json({ error: 'project_id is required' }, 400)
      const { error } = await service
        .from('projects')
        .update({
          linked_supabase_project_ref: null,
          linked_supabase_project_name: null,
          linked_supabase_url: null,
          linked_supabase_anon_key: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.project_id)
        .eq('user_id', userId)
      if (error) throw error
      return json({ ok: true })
    }

    if (body.action === 'disconnect') {
      await service.from('user_supabase_connections').delete().eq('user_id', userId)
      return json({ ok: true, connected: false })
    }

    return json({ ok: true, connected: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Request failed'
    return json({ error: msg }, msg === 'Unauthorized' ? 401 : 500)
  }
})
