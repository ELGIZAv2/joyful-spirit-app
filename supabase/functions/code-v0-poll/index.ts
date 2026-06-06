// supabase/functions/code-v0-poll/index.ts
// Safety net: polls v0 for any code_agent_runs that are still "running"
// after the streaming edge function has died (long jobs >> wall-clock).
// Runs every minute via pg_cron, and can also be called by the frontend
// on demand for a specific runId.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { pickV0Key } from "../_shared/v0-keys.ts";

const V0_BASE = "https://api.v0.dev/v1";

type V0File = { name: string; content: string; locked?: boolean };
type V0Chat = {
  id: string;
  demoUrl?: string;
  latestVersion?: { id?: string; status?: string; demoUrl?: string; files?: V0File[] };
  messages?: Array<{ role?: string; content?: string }>;
  content?: string;
  status?: string;
};

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function v0Get<T>(path: string, key: string): Promise<T> {
  const res = await fetch(`${V0_BASE}${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`v0_get_${res.status}: ${text.slice(0, 200)}`);
  return JSON.parse(text) as T;
}

async function syncRun(sb: ReturnType<typeof admin>, run: {
  id: string; project_id: string; v0_chat_id: string | null;
  table_name: string; assistant_message_id: string | null;
  started_at: string;
}): Promise<{ done: boolean; reason?: string }> {
  const ageMsNoChat = Date.now() - new Date(run.started_at).getTime();
  if (!run.v0_chat_id) {
    // No chat_id ever captured: if run is older than 5 min, mark as error.
    if (ageMsNoChat > 5 * 60 * 1000) {
      await sb.from("code_agent_runs").update({
        status: "error",
        error: "no_chat_id_timeout",
        finished_at: new Date().toISOString(),
        last_poll_at: new Date().toISOString(),
      }).eq("id", run.id);
      return { done: true, reason: "no_chat_id_timeout" };
    }
    return { done: false, reason: "no_chat_id" };
  }

  const picked = await pickV0Key();
  if (!picked) return { done: false, reason: "no_key" };


  const tableName = run.table_name === "projects" ? "projects" : "code_projects";
  const messagesTable = tableName === "projects" ? "ai_project_messages" : "code_messages";
  const filesTable = tableName === "projects" ? "ai_project_files" : "code_project_files";

  let chat: V0Chat;
  try {
    chat = await v0Get<V0Chat>(`/chats/${encodeURIComponent(run.v0_chat_id)}`, picked.api_key);
  } catch (e) {
    await sb.from("code_agent_runs")
      .update({ last_poll_at: new Date().toISOString() })
      .eq("id", run.id);
    return { done: false, reason: (e as Error).message };
  }

  const version = chat.latestVersion;
  const versionStatus = (version?.status || chat.status || "").toLowerCase();
  const previewUrl = version?.demoUrl || chat.demoUrl || null;

  // Sync files
  if (Array.isArray(version?.files)) {
    const rows = version!.files!
      .filter((f) => f?.name && typeof f.content === "string")
      .map((f) => ({ project_id: run.project_id, path: f.name, content: f.content }));
    if (rows.length) {
      await sb.from(filesTable).upsert(rows, { onConflict: "project_id,path" });
    }
  }

  // Sync assistant message
  const assistantText =
    chat.messages?.findLast?.((m) => m.role === "assistant")?.content
    || chat.content || "";
  if (assistantText && run.assistant_message_id) {
    await sb.from(messagesTable)
      .update({ content: assistantText })
      .eq("id", run.assistant_message_id);
  }

  // Project updates
  const projectUpdates: Record<string, unknown> = {};
  if (version?.id) projectUpdates.v0_latest_version_id = version.id;
  if (previewUrl) projectUpdates.preview_url = previewUrl;
  if (Object.keys(projectUpdates).length) {
    await sb.from(tableName).update(projectUpdates).eq("id", run.project_id);
  }

  const isDone =
    versionStatus === "completed" ||
    versionStatus === "ready" ||
    versionStatus === "succeeded" ||
    versionStatus === "done" ||
    versionStatus === "failed" ||
    versionStatus === "error";

  // Fail-safe: a run that's been running >20 min with no progress → mark done
  const ageMs = Date.now() - new Date(run.started_at).getTime();
  const stalled = ageMs > 20 * 60 * 1000;

  if (isDone || stalled) {
    const finalStatus = versionStatus === "failed" || versionStatus === "error"
      ? "error"
      : "done";
    await sb.from("code_agent_runs").update({
      status: finalStatus,
      finished_at: new Date().toISOString(),
      preview_url: previewUrl,
      v0_version_id: version?.id ?? null,
      last_poll_at: new Date().toISOString(),
      error: stalled && !isDone ? "stalled_timeout" : null,
    }).eq("id", run.id);
    await sb.from("code_v0_tasks")
      .update({ status: "done" })
      .eq("run_id", run.id)
      .neq("status", "done");
    return { done: true, reason: stalled && !isDone ? "stalled" : versionStatus };
  }

  await sb.from("code_agent_runs")
    .update({ last_poll_at: new Date().toISOString() })
    .eq("id", run.id);
  return { done: false, reason: versionStatus || "running" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const sb = admin();
    let runId: string | undefined;
    let refreshProjectId: string | undefined;
    let refreshTable: string | undefined;
    try {
      const body = await req.json();
      runId = body?.runId;
      refreshProjectId = body?.projectId;
      refreshTable = body?.table;
    } catch { /* no body = poll all */ }

    // --- On-demand: return a FRESH v0 demo URL for a project. v0 demo
    // tokens expire and the underlying sandbox auto-suspends, so the URL
    // stored at generation time often returns "connection refused". A
    // fresh fetch from /chats/:id returns a new tokenized URL that also
    // re-wakes the preview sandbox.
    if (refreshProjectId) {
      const tableName = refreshTable === "code_projects" ? "code_projects" : "projects";
      const ownerCol = tableName === "code_projects" ? "owner_id" : "user_id";
      const { data: project } = await sb
        .from(tableName)
        .select(`id, ${ownerCol}, v0_chat_id, preview_url`)
        .eq("id", refreshProjectId)
        .maybeSingle();
      if (!project) {
        return new Response(JSON.stringify({ url: null, refreshed: false, error: "not_found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // deno-lint-ignore no-explicit-any
      const chatId = (project as any).v0_chat_id as string | null;
      // deno-lint-ignore no-explicit-any
      const currentUrl = (project as any).preview_url as string | null;
      if (!chatId) {
        return new Response(JSON.stringify({ url: currentUrl, refreshed: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const picked = await pickV0Key();
      if (!picked) {
        return new Response(JSON.stringify({ url: currentUrl, refreshed: false, warning: "no_v0_key" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      try {
        const chat = await v0Get<V0Chat>(`/chats/${encodeURIComponent(chatId)}`, picked.api_key);
        const fresh = chat.latestVersion?.demoUrl || chat.demoUrl || null;
        if (fresh) {
          await sb.from(tableName).update({ preview_url: fresh }).eq("id", refreshProjectId);
          return new Response(JSON.stringify({ url: fresh, refreshed: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ url: currentUrl, refreshed: false, warning: "no_demo_url" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        return new Response(JSON.stringify({ url: currentUrl, refreshed: false, warning: (e as Error).message }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }


    let runs: Array<{
      id: string; project_id: string; v0_chat_id: string | null;
      table_name: string; assistant_message_id: string | null; started_at: string;
    }>;
    if (runId) {
      const { data } = await sb.from("code_agent_runs")
        .select("id, project_id, v0_chat_id, table_name, assistant_message_id, started_at")
        .eq("id", runId).maybeSingle();
      runs = data ? [data as typeof runs[number]] : [];
    } else {
      // Only poll runs that haven't been touched in the last 20s
      const cutoff = new Date(Date.now() - 20_000).toISOString();
      const { data } = await sb.from("code_agent_runs")
        .select("id, project_id, v0_chat_id, table_name, assistant_message_id, started_at")
        .eq("status", "running")
        .or(`last_poll_at.is.null,last_poll_at.lt.${cutoff}`)
        .limit(20);
      runs = (data ?? []) as typeof runs;
    }

    const results: Array<{ id: string; done: boolean; reason?: string }> = [];
    for (const r of runs) {
      try {
        const out = await syncRun(sb, r);
        results.push({ id: r.id, ...out });
      } catch (e) {
        results.push({ id: r.id, done: false, reason: (e as Error).message });
      }
    }

    return new Response(JSON.stringify({ polled: runs.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
