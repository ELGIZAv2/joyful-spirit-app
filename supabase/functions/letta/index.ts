// Letta persistent memory — unified endpoint.
// Routes by ?action= query param:
//   POST  ?action=init   — create or fetch user agent
//   POST  ?action=chat   — send message to agent
//   GET   ?action=list   — list core + archival memory
//   PATCH ?action=toggle — enable/disable
//   DELETE ?action=passage&passage_id=... — delete one passage
//   DELETE ?action=reset — delete agent entirely
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const LETTA_API_KEY = Deno.env.get('LETTA_API_KEY');
const LETTA_BASE = 'https://api.letta.com/v1';

async function auth(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return { error: 'Unauthorized', status: 401 };
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const token = authHeader.replace('Bearer ', '');
  const { data: claims, error } = await supabase.auth.getClaims(token);
  if (error || !claims?.claims) return { error: 'Unauthorized', status: 401 };
  return {
    supabase,
    userId: claims.claims.sub as string,
    userEmail: (claims.claims.email as string) || 'user',
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!LETTA_API_KEY) return json({ error: 'LETTA_API_KEY not configured' }, 500);

    const a = await auth(req);
    if ('error' in a) return json({ error: a.error }, a.status);
    const { supabase, userId, userEmail } = a;

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || (req.method === 'GET' ? 'list' : '');
    const lettaHeaders = { 'Authorization': `Bearer ${LETTA_API_KEY}` };

    // Fetch existing mapping
    const { data: row } = await supabase
      .from('letta_user_agents')
      .select('letta_agent_id, enabled')
      .eq('user_id', userId)
      .maybeSingle();

    // ── INIT ────────────────────────────────────────────────
    if (action === 'init' && req.method === 'POST') {
      if (row?.letta_agent_id) {
        return json({ agent_id: row.letta_agent_id, enabled: row.enabled, created: false });
      }
      const res = await fetch(`${LETTA_BASE}/agents`, {
        method: 'POST',
        headers: { ...lettaHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `megsy-${userId.slice(0, 8)}`,
          memory_blocks: [
            { label: 'human', value: `The user's account email is ${userEmail}. Learn about them over time.`, limit: 2000 },
            { label: 'persona', value: 'I am Megsy, a warm and helpful AI companion. I remember details about the user across conversations and use them to personalize responses.', limit: 2000 },
          ],
          model: 'openai/gpt-4o-mini',
          embedding: 'openai/text-embedding-3-small',
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        console.error('Letta create failed:', res.status, t);
        return json({ error: 'Failed to create Letta agent', details: t }, 502);
      }
      const agent = await res.json();
      await supabase.from('letta_user_agents')
        .insert({ user_id: userId, letta_agent_id: agent.id, enabled: true });
      return json({ agent_id: agent.id, enabled: true, created: true });
    }

    // ── CHAT ────────────────────────────────────────────────
    if (action === 'chat' && req.method === 'POST') {
      if (!row?.letta_agent_id) return json({ error: 'No agent. Call init first.' }, 404);
      if (!row.enabled) return json({ error: 'Memory disabled' }, 403);
      const body = await req.json().catch(() => ({}));
      const message = typeof body?.message === 'string' ? body.message.trim() : '';
      if (!message || message.length > 8000) return json({ error: 'Invalid message (1-8000 chars)' }, 400);
      const res = await fetch(`${LETTA_BASE}/agents/${row.letta_agent_id}/messages`, {
        method: 'POST',
        headers: { ...lettaHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: message }] }),
      });
      if (!res.ok) {
        const t = await res.text();
        return json({ error: 'Letta API error', details: t }, 502);
      }
      const data = await res.json();
      const messages = (data?.messages || data || []) as any[];
      let reply = '';
      for (const m of messages) {
        if (m?.message_type === 'assistant_message' && typeof m.content === 'string') reply += m.content;
      }
      return json({ reply: reply || '...', raw: messages });
    }

    // ── LIST ────────────────────────────────────────────────
    if ((action === 'list' || action === '') && req.method === 'GET') {
      if (!row?.letta_agent_id) {
        return json({ initialized: false, enabled: false, core: [], archival: [] });
      }
      const [coreRes, archRes] = await Promise.all([
        fetch(`${LETTA_BASE}/agents/${row.letta_agent_id}/core-memory/blocks`, { headers: lettaHeaders }),
        fetch(`${LETTA_BASE}/agents/${row.letta_agent_id}/archival-memory`, { headers: lettaHeaders }),
      ]);
      const core = coreRes.ok ? await coreRes.json() : [];
      const archival = archRes.ok ? await archRes.json() : [];
      return json({
        initialized: true,
        enabled: row.enabled,
        agent_id: row.letta_agent_id,
        core: Array.isArray(core) ? core : (core?.blocks || []),
        archival: Array.isArray(archival) ? archival : (archival?.passages || []),
      });
    }

    // ── TOGGLE ──────────────────────────────────────────────
    if (action === 'toggle' && req.method === 'PATCH') {
      const body = await req.json().catch(() => ({}));
      const enabled = !!body?.enabled;
      const { error } = await supabase.from('letta_user_agents')
        .update({ enabled }).eq('user_id', userId);
      if (error) throw error;
      return json({ success: true, enabled });
    }

    // ── DELETE PASSAGE / RESET ──────────────────────────────
    if (req.method === 'DELETE') {
      if (!row?.letta_agent_id) return json({ error: 'No agent' }, 404);
      if (action === 'reset') {
        await fetch(`${LETTA_BASE}/agents/${row.letta_agent_id}`, { method: 'DELETE', headers: lettaHeaders });
        await supabase.from('letta_user_agents').delete().eq('user_id', userId);
        return json({ success: true, reset: true });
      }
      const passageId = url.searchParams.get('passage_id');
      if (!passageId) return json({ error: 'passage_id required' }, 400);
      const res = await fetch(`${LETTA_BASE}/agents/${row.letta_agent_id}/archival-memory/${passageId}`, {
        method: 'DELETE', headers: lettaHeaders,
      });
      if (!res.ok) {
        const t = await res.text();
        return json({ error: 'Letta delete failed', details: t }, 502);
      }
      return json({ success: true });
    }

    return json({ error: 'Unknown action', action, method: req.method }, 400);
  } catch (e) {
    console.error('letta error:', e);
    return json({ error: String(e) }, 500);
  }
});
