// supabase/functions/code-build/index.ts
// Background-job code builder for the MegsyPr Workspace.
// - POST inserts a `background_jobs` row (kind=code_build) and returns { jobId }
// - The agent loop runs in the background, writing progress/events to that row.
// Reads/writes the `projects` + `ai_project_files` + `ai_project_messages` tables.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { spendCreditsServer, creditErrorResponse } from "../_shared/credits.ts";

const LOVABLE_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

const SYSTEM_PROMPT = `You are Megsy Code, an AI that builds React + Vite + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion web apps.

You edit project files via tool calls. Always:
- Write idiomatic, production-quality TSX
- Default to Tailwind utility classes (no inline styles unless necessary)
- Support RTL when content is Arabic
- Keep components small and composable
- Use lucide-react for icons, framer-motion for animation
- Entry file is src/App.tsx and renders a default export

When the user asks for changes, plan briefly then call tools to write files. After editing, return a short summary of what changed in the SAME language the user wrote in (English, Arabic, French, etc.). Never wrap code in markdown fences in tool arguments.`;

const TOOLS = [
  { type: "function", function: { name: "write_file", description: "Create or overwrite a file.", parameters: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } }, required: ["path", "content"] } } },
  { type: "function", function: { name: "read_file", description: "Read a file.", parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } } },
  { type: "function", function: { name: "list_files", description: "List all file paths.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "delete_file", description: "Delete a file.", parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } } },
];

function admin() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

async function userFromRequest(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data } = await sb.auth.getUser();
  return data.user;
}

type ToolResult = Record<string, unknown>;

async function executeTool(sb: ReturnType<typeof admin>, projectId: string, userId: string, name: string, args: Record<string, unknown>): Promise<{ result: ToolResult; event?: Record<string, unknown> }> {
  if (name === "list_files") {
    const { data } = await sb.from("ai_project_files").select("path").eq("project_id", projectId);
    return { result: { files: (data ?? []).map((r: { path: string }) => r.path) } };
  }
  if (name === "read_file") {
    const path = String(args.path || "");
    const { data } = await sb.from("ai_project_files").select("content").eq("project_id", projectId).eq("path", path).maybeSingle();
    if (!data) return { result: { error: "not_found" } };
    return { result: { path, content: (data as { content: string }).content } };
  }
  if (name === "write_file") {
    const path = String(args.path || "");
    const content = String(args.content ?? "");
    if (!path) return { result: { error: "path_required" } };
    const { data: existing } = await sb.from("ai_project_files").select("id").eq("project_id", projectId).eq("path", path).maybeSingle();
    const action = existing ? "update" : "create";
    const { error } = await sb.from("ai_project_files").upsert({ project_id: projectId, path, content }, { onConflict: "project_id,path" });
    if (error) return { result: { error: error.message } };
    return { result: { ok: true, path, bytes: content.length }, event: { type: "file", action, path } };
  }
  if (name === "delete_file") {
    const path = String(args.path || "");
    await sb.from("ai_project_files").delete().eq("project_id", projectId).eq("path", path);
    return { result: { ok: true }, event: { type: "file", action: "delete", path } };
  }
  return { result: { error: "unknown_tool" } };
}

async function updateJob(sb: ReturnType<typeof admin>, jobId: string, patch: Record<string, unknown>) {
  await sb.from("background_jobs").update({
    ...patch,
    last_heartbeat_at: new Date().toISOString(),
  }).eq("id", jobId);
}

async function runAgent(jobId: string, projectId: string, userId: string, userMessage: string) {
  const sb = admin();
  const events: Record<string, unknown>[] = [];
  let streamText = "";

  const pushEvent = async (ev: Record<string, unknown>) => {
    events.push(ev);
    await updateJob(sb, jobId, { meta: { events } });
  };

  try {
    // Persist user message
    await sb.from("ai_project_messages").insert({ project_id: projectId, role: "user", content: userMessage });

    // Load file index
    const { data: filesList } = await sb.from("ai_project_files").select("path").eq("project_id", projectId);
    const fileIndex = (filesList ?? []).map((r: { path: string }) => r.path).join("\n") || "(empty project)";

    // Load history
    const { data: history } = await sb
      .from("ai_project_messages")
      .select("role, content, metadata")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true })
      .limit(30);

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");

    type Msg = { role: string; content: string | null; tool_calls?: unknown; tool_call_id?: string; name?: string };
    const messages: Msg[] = [
      { role: "system", content: `${SYSTEM_PROMPT}\n\nCurrent project files:\n${fileIndex}` },
    ];
    for (const m of history ?? []) {
      const meta = (m.metadata ?? {}) as { tool_calls?: unknown; tool_results?: { tool_call_id?: string; name?: string; result?: unknown } };
      if (m.role === "assistant" && meta.tool_calls) {
        messages.push({ role: "assistant", content: m.content || null, tool_calls: meta.tool_calls });
      } else if (m.role === "tool" && meta.tool_results) {
        messages.push({ role: "tool", content: JSON.stringify(meta.tool_results.result ?? {}), tool_call_id: meta.tool_results.tool_call_id, name: meta.tool_results.name });
      } else if (m.content) {
        messages.push({ role: m.role, content: m.content });
      }
    }

    await updateJob(sb, jobId, { status: "running", status_text: "جاري التحليل…", phase: "thinking", progress: 5 });
    await pushEvent({ type: "step", text: "thinking" });

    const MAX_STEPS = 12;
    let finalText = "";

    for (let step = 0; step < MAX_STEPS; step++) {
      const r = await fetch(LOVABLE_GATEWAY_URL, {
        method: "POST",
        headers: { "Lovable-API-Key": lovableKey, "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, messages, tools: TOOLS, tool_choice: "auto" }),
      });
      if (r.status === 429) throw new Error("Rate limit exceeded — try again shortly.");
      if (r.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
      if (!r.ok) {
        const t = await r.text();
        throw new Error(`LLM error ${r.status}: ${t.slice(0, 300)}`);
      }
      const j = await r.json();
      const choice = j.choices?.[0];
      const msg = choice?.message;
      if (!msg) break;
      const toolCalls = msg.tool_calls as Array<{ id: string; function: { name: string; arguments: string } }> | undefined;
      messages.push({ role: "assistant", content: msg.content ?? null, tool_calls: toolCalls });

      if (toolCalls && toolCalls.length) {
        await sb.from("ai_project_messages").insert({
          project_id: projectId, role: "assistant",
          content: msg.content || "", metadata: { tool_calls: toolCalls },
        });
        for (const tc of toolCalls) {
          let args: Record<string, unknown> = {};
          try { args = JSON.parse(tc.function?.arguments || "{}"); } catch { /* ignore */ }
          const { result, event } = await executeTool(sb, projectId, userId, tc.function?.name, args);
          if (event) await pushEvent(event);
          messages.push({ role: "tool", content: JSON.stringify(result), tool_call_id: tc.id, name: tc.function?.name });
          await sb.from("ai_project_messages").insert({
            project_id: projectId, role: "tool", content: "",
            metadata: { tool_results: { tool_call_id: tc.id, name: tc.function?.name, args, result } },
          });
        }
        await updateJob(sb, jobId, { progress: Math.min(90, 10 + step * 8), status_text: `step ${step + 1}` });
        continue;
      }

      finalText = msg.content || "Done.";
      streamText = finalText;
      await sb.from("ai_project_messages").insert({ project_id: projectId, role: "assistant", content: finalText });
      break;
    }

    await sb.from("projects").update({ updated_at: new Date().toISOString() }).eq("id", projectId);
    await updateJob(sb, jobId, {
      status: "done", progress: 100, phase: "done", status_text: "Done",
      stream_text: streamText, meta: { events },
      finished_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[code-build] error", e);
    await updateJob(sb, jobId, {
      status: "error", error: (e as Error).message,
      meta: { events }, finished_at: new Date().toISOString(),
    });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await userFromRequest(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "auth_required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const body = await req.json();
    const projectId = String(body.projectId || body.project_id || "");
    const userMessage = String(body.message || "").trim();
    if (!projectId || !userMessage) {
      return new Response(JSON.stringify({ error: "projectId and message required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const sb = admin();
    const { data: project } = await sb.from("projects").select("id, user_id").eq("id", projectId).maybeSingle();
    if (!project || (project as { user_id: string }).user_id !== user.id) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    // Server-side credit enforcement (build agent run)
    const spend = await spendCreditsServer(user.id, 3, "code_build", "Code agent build run");
    if (!spend.ok) return creditErrorResponse(spend, corsHeaders);
    const { data: job, error: jobErr } = await sb.from("background_jobs").insert({
      user_id: user.id, kind: "code_build", status: "queued", progress: 0,
      status_text: "في الانتظار…", input: { projectId, message: userMessage }, meta: { events: [] }, stream_text: "",
    }).select("id").single();
    if (jobErr || !job) throw new Error(jobErr?.message || "failed to create job");
    const jobId = (job as { id: string }).id;
    // @ts-ignore EdgeRuntime is provided by Supabase Edge Runtime
    EdgeRuntime.waitUntil(runAgent(jobId, projectId, user.id, userMessage));
    return new Response(JSON.stringify({ jobId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[code-build] handler error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
