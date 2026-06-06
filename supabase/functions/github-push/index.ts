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
  action: z.enum(['status', 'push', 'disconnect']).optional(),
  project_id: z.string().uuid().optional(),
  project_name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  files: z.record(z.string()).optional(),
})

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

async function apiKeyFromDb(pattern: string) {
  const service = createClient(SUPABASE_URL, SERVICE_KEY)
  const { data } = await service
    .from('api_keys')
    .select('api_key,service')
    .ilike('service', pattern)
    .eq('is_active', true)
    .eq('is_blocked', false)
    .limit(1)
  return data?.[0]?.api_key as string | undefined
}

async function getUserGithubToken(userId?: string) {
  if (!userId) return undefined
  const service = createClient(SUPABASE_URL, SERVICE_KEY)
  const { data } = await service
    .from('user_github_connections')
    .select('access_token')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.access_token as string | undefined
}

async function getGithubToken(userId?: string) {
  return await getUserGithubToken(userId)
    || Deno.env.get('GITHUB_TOKEN')
    || Deno.env.get('GH_TOKEN')
    || Deno.env.get('GITHUB_PAT')
    || await apiKeyFromDb('%github%')
}

async function github(path: string, init: RequestInit = {}, userId?: string) {
  const token = await getGithubToken(userId)
  if (!token) throw new Error('GitHub token is not configured in backend')
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) throw new Error(`GitHub API failed [${res.status}]: ${text}`)
  return data
}

function repoName(name = 'megsy-app') {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'megsy-app'
}

function encodeBase64(text: string) {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.slice(i, i + 0x8000))
  return btoa(bin)
}

async function getExistingSha(owner: string, repo: string, path: string, userId?: string) {
  try {
    const data = await github(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replaceAll('%2F', '/')}`, {}, userId)
    return Array.isArray(data) ? undefined : data?.sha as string | undefined
  } catch (_) { return undefined }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const userId = await requireUser(req)
    const rawBody = await req.json().catch(() => ({}))

    // Status check first — never fail validation for a simple status ping.
    if (!rawBody || !rawBody.action || rawBody.action === 'status') {
      const token = await getGithubToken(userId)
      if (!token) return json({ connected: false, reason: 'missing_token' })
      try {
        const me = await github('/user', {}, userId)
        return json({ connected: true, login: me.login, avatar_url: me.avatar_url })
      } catch (e) {
        const service = createClient(SUPABASE_URL, SERVICE_KEY)
        await service.from('user_github_connections').delete().eq('user_id', userId)
        return json({ connected: false, reason: e instanceof Error ? e.message : 'invalid_token' })
      }
    }

    const parsed = BodySchema.safeParse(rawBody)
    if (!parsed.success) return json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, 400)
    const body = parsed.data



    if (body.action === 'disconnect') {
      const service = createClient(SUPABASE_URL, SERVICE_KEY)
      await service.from('user_github_connections').delete().eq('user_id', userId)
      return json({ ok: true, connected: false })
    }


    const me = await github('/user', {}, userId)


    const files = body.files || {}
    if (!Object.keys(files).length) return json({ error: 'No files to upload' }, 400)
    const service = createClient(SUPABASE_URL, SERVICE_KEY)
    let owner = me.login as string
    let repo = repoName(body.project_name)
    let htmlUrl = ''

    if (body.project_id) {
      const { data: project } = await service.from('projects').select('github_owner,github_repo,github_url').eq('id', body.project_id).eq('user_id', userId).maybeSingle()
      if (project?.github_owner && project?.github_repo) {
        owner = project.github_owner
        repo = project.github_repo
        htmlUrl = project.github_url || ''
      }
    }

    if (!htmlUrl) {
      let created: any = null
      for (let i = 0; i < 5; i++) {
        const candidate = i === 0 ? repo : `${repo}-${Date.now().toString(36).slice(-5)}`
        try {
          created = await github('/user/repos', {
            method: 'POST',
            body: JSON.stringify({ name: candidate, description: body.description || 'Built with Megsy AI', private: true, auto_init: true }),
          }, userId)
          repo = created.name
          htmlUrl = created.html_url
          break
        } catch (e) {
          if (!String(e).includes('already_exists') && !String(e).includes('422')) throw e
        }
      }
      if (!created && !htmlUrl) throw new Error('Could not create GitHub repository')
    }

    for (const [path, content] of Object.entries(files).slice(0, 250)) {
      const sha = await getExistingSha(owner, repo, path, userId)
      await github(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replaceAll('%2F', '/')}`, {
        method: 'PUT',
        body: JSON.stringify({ message: `Update ${path} from Megsy`, content: encodeBase64(content), branch: 'main', ...(sha ? { sha } : {}) }),
      }, userId)
    }

    if (body.project_id) {
      await service.from('projects').update({ github_owner: owner, github_repo: repo, github_url: htmlUrl, repo_url: htmlUrl, github_branch: 'main', updated_at: new Date().toISOString() }).eq('id', body.project_id).eq('user_id', userId)
    }

    return json({ ok: true, repo_url: htmlUrl, owner, repo })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Upload failed'
    return json({ error: msg }, msg === 'Unauthorized' ? 401 : 500)
  }
})
