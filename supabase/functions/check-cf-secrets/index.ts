import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const token = Deno.env.get('CLOUDFLARE_API_TOKEN')!
  const account = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')!

  const h = { Authorization: `Bearer ${token}` }

  // 1. verify token
  const verify = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', { headers: h })
    .then(r => r.json())

  // 2. list Pages projects on the account
  const pages = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects`,
    { headers: h },
  ).then(r => r.json())

  return new Response(
    JSON.stringify({
      verify,
      pagesProjectsCount: pages?.result?.length ?? 0,
      pagesProjects: (pages?.result ?? []).map((p: any) => ({
        name: p.name,
        subdomain: p.subdomain,
        domains: p.domains,
      })),
      pagesError: pages?.errors,
    }, null, 2),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
