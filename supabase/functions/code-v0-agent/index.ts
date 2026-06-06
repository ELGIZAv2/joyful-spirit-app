// supabase/functions/code-v0-agent/index.ts
// Long-running v0 generations (up to ~15 min) handled by:
//   1. Streaming response to client for live UX.
//   2. Background processing via EdgeRuntime.waitUntil — survives client
//      disconnect / browser refresh.
//   3. Incremental persistence of assistant text, files and tasks into DB
//      so a reconnecting client (or Realtime subscriber) sees live state.
//   4. code-v0-poll cron acts as a safety net for runs that exceed the
//      edge function wall-clock.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { pickV0Key, blockV0Key, shouldBlockOnStatus } from "../_shared/v0-keys.ts";
import { spendCreditsServer, creditErrorResponse } from "../_shared/credits.ts";

const V0_BASE = "https://api.v0.dev/v1";

const TIER_MAP: Record<string, string> = {
  lite: "v0-mini",
  smart: "v0-auto",
  pro: "v0-pro",
  "pro-turbo": "v0-max-fast",
  max: "v0-max",
};
function resolveModelId(tier: string | undefined): string {
  if (!tier) return TIER_MAP.smart;
  return TIER_MAP[tier] ?? TIER_MAP.smart;
}

type V0File = { name: string; content: string; locked?: boolean };
type V0Chat = {
  id: string;
  webUrl?: string;
  demoUrl?: string;
  projectId?: string;
  latestVersion?: { id?: string; status?: string; demoUrl?: string; files?: V0File[] };
  messages?: Array<{ role?: string; content?: string }>;
  content?: string;
};

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}
async function userFromRequest(req: Request) {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
  const { data } = await sb.auth.getUser();
  return data.user;
}

async function v0Json<T = unknown>(
  path: string,
  key: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${V0_BASE}${path}`, {
    method: init.method ?? "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  let json: unknown = {};
  try { json = JSON.parse(text); } catch { /* keep text */ }
  if (!res.ok) {
    const j = json as { error?: { message?: string } | string };
    const msg = (typeof j.error === "object" && j.error?.message)
      || (typeof j.error === "string" ? j.error : null)
      || text.slice(0, 300)
      || `v0 ${res.status}`;
    throw new Error(`v0_api_${res.status}: ${msg}`);
  }
  return json as T;
}

async function v0Stream(path: string, key: string, body: unknown): Promise<Response> {
  const res = await fetch(`${V0_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`v0_stream_${res.status}: ${text.slice(0, 300)}`);
  }
  if (!res.body) throw new Error("v0_stream_no_body");
  return res;
}

// deno-lint-ignore no-explicit-any
declare const EdgeRuntime: any;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  try {
    const user = await userFromRequest(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "auth_required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { projectId, message, modelTier } = body;
    const tableName: "code_projects" | "projects" =
      body.table === "projects" ? "projects" : "code_projects";
    const ownerCol = tableName === "projects" ? "user_id" : "owner_id";
    if (!projectId || !message) {
      return new Response(JSON.stringify({ error: "projectId and message required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pickedKey = await pickV0Key();
    if (!pickedKey) {
      return new Response(JSON.stringify({ error: "all_v0_keys_exhausted", message: "كل مفاتيح v0 وصلت لحد 7 رسائل/24 ساعة. جرّب بعد قليل." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const v0Key = pickedKey.api_key;
    const v0KeyId = pickedKey.id;

    const sb = admin();
    const { data: projectRaw, error: projErr } = await sb.from(tableName)
      .select(`id, ${ownerCol}, name, v0_chat_id, v0_project_id, model_tier`)
      .eq("id", projectId).maybeSingle();
    if (projErr) {
      return new Response(JSON.stringify({ error: "project_lookup_failed", detail: projErr.message, table: tableName }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!projectRaw) {
      return new Response(JSON.stringify({ error: "project_not_found", projectId, table: tableName }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const project = projectRaw as Record<string, unknown> & {
      id: string; name?: string; v0_chat_id?: string | null; v0_project_id?: string | null; model_tier?: string | null;
    };
    const ownerId = project[ownerCol] as string | undefined;
    if (ownerId !== user.id) {
      return new Response(JSON.stringify({ error: "forbidden", reason: "not_owner" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tier = modelTier || project.model_tier || "smart";

    // Server-side credit enforcement (v0 is the most expensive — varies by tier)
    const cost = tier === "pro" ? 10 : tier === "lite" ? 3 : 6;
    const spend = await spendCreditsServer(user.id, cost, `code_v0:${tier}`, `v0 generation (${tier})`);
    if (!spend.ok) return creditErrorResponse(spend, corsHeaders);

    const modelId = resolveModelId(tier);
    if (modelTier && modelTier !== project.model_tier) {
      await sb.from(tableName).update({ model_tier: modelTier }).eq("id", projectId);
    }

    let v0ProjectId: string | null = project.v0_project_id ?? null;
    let v0ChatId: string | null = project.v0_chat_id ?? null;

    const messagesTable = tableName === "projects" ? "ai_project_messages" : "code_messages";
    const filesTable = tableName === "projects" ? "ai_project_files" : "code_project_files";

    // Persist user message + create run + placeholder assistant row
    await sb.from(messagesTable).insert({
      project_id: projectId, role: "user", content: message,
    });

    const { data: runRow } = await sb.from("code_agent_runs").insert({
      project_id: projectId,
      user_id: user.id,
      user_prompt: message,
      status: "running",
      table_name: tableName,
      v0_chat_id: v0ChatId,
    }).select("id").maybeSingle();
    const runId = runRow?.id as string;

    const { data: asstRow } = await sb.from(messagesTable).insert({
      project_id: projectId, role: "assistant", content: "",
    }).select("id").maybeSingle();
    const assistantMessageId = asstRow?.id as string;
    if (runId && assistantMessageId) {
      await sb.from("code_agent_runs")
        .update({ assistant_message_id: assistantMessageId })
        .eq("id", runId);
    }

    // Shared state between SSE stream and waitUntil background processor
    const state = {
      assistantText: "",
      lastPersistAt: 0,
      finalChatId: v0ChatId as string | null,
      finalDemoUrl: null as string | null,
      finalVersionId: null as string | null,
      seenFiles: new Map<string, string>(),
      tasksByExternal: new Map<string, string>(), // external_id -> id
      taskSequence: 0,
      closed: false,
    };

    const persistAssistant = async (force = false) => {
      const now = Date.now();
      if (!force && now - state.lastPersistAt < 1500) return;
      state.lastPersistAt = now;
      if (!assistantMessageId) return;
      await sb.from(messagesTable)
        .update({ content: state.assistantText })
        .eq("id", assistantMessageId);
    };

    const upsertTask = async (
      args: { externalId?: string; title: string; status?: string; detail?: string },
    ) => {
      if (!runId) return;
      const status = args.status || "running";
      const externalId = args.externalId ?? `task-${++state.taskSequence}`;
      const existing = state.tasksByExternal.get(externalId);
      if (existing) {
        await sb.from("code_v0_tasks").update({
          status, title: args.title, detail: args.detail ?? null,
        }).eq("id", existing);
      } else {
        const { data } = await sb.from("code_v0_tasks").insert({
          run_id: runId,
          project_id: projectId,
          external_id: externalId,
          title: args.title,
          status,
          detail: args.detail ?? null,
          sequence: state.taskSequence++,
        }).select("id").maybeSingle();
        if (data?.id) state.tasksByExternal.set(externalId, data.id as string);
      }
    };

    // SSE response stream
    const sseStream = new ReadableStream({
      start(controller) {
        const send = (event: string, data: unknown) => {
          if (state.closed) return;
          try {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          } catch { /* client gone */ }
        };
        const heartbeat = setInterval(() => send("ping", { t: Date.now() }), 15_000);

        const closeStream = () => {
          if (state.closed) return;
          state.closed = true;
          clearInterval(heartbeat);
          try { controller.close(); } catch { /* */ }
        };

        // -------- Background processing (survives client disconnect) --------
        const work = (async () => {
          send("run", { runId });
          send("model", { tier, modelId });

          try {
            if (!v0ProjectId) {
              send("status", { text: "Creating v0 project…" });
              try {
                const proj = await v0Json<{ id: string }>(
                  "/projects",
                  v0Key,
                  { body: { name: project.name || `megsy-${projectId.slice(0, 8)}`, description: `Megsy code project ${projectId}` } },
                );
                v0ProjectId = proj.id;
                await sb.from(tableName).update({ v0_project_id: v0ProjectId }).eq("id", projectId);
                send("project", { v0ProjectId });
              } catch (e) {
                console.warn("[code-v0-agent] project create failed", (e as Error).message);
              }
            }

            send("status", { text: "v0 is generating…" });

            let v0Res: Response;
            if (v0ChatId) {
              v0Res = await v0Stream(
                `/chats/${encodeURIComponent(v0ChatId)}/messages`,
                v0Key,
                {
                  message,
                  responseMode: "experimental_stream",
                  modelConfiguration: { modelId },
                },
              );
            } else {
              v0Res = await v0Stream("/chats", v0Key, {
                message,
                chatPrivacy: "private",
                responseMode: "experimental_stream",
                modelConfiguration: { modelId },
                ...(v0ProjectId ? { projectId: v0ProjectId } : {}),
              });
            }

            const reader = v0Res.body!.getReader();
            let buf = "";

            const asString = (v: unknown): string => (typeof v === "string" ? v : "");
            const extractText = (data: Record<string, unknown>): string => {
              const direct = asString(data.delta) || asString(data.text);
              if (direct) return direct;
              const c = data.content;
              if (typeof c === "string") return c;
              if (Array.isArray(c)) {
                // v0 often returns content as [{type:"text", text:"..."}]
                return c.map((p) => (p && typeof p === "object" && typeof (p as { text?: unknown }).text === "string"
                  ? (p as { text: string }).text : "")).join("");
              }
              return "";
            };

            // Recursively search nested data for a key (depth-limited).
            const deepFind = (obj: unknown, keys: string[], depth = 0): string | null => {
              if (!obj || depth > 4 || typeof obj !== "object") return null;
              for (const k of keys) {
                const v = (obj as Record<string, unknown>)[k];
                if (typeof v === "string" && v) return v;
              }
              for (const v of Object.values(obj as Record<string, unknown>)) {
                if (v && typeof v === "object") {
                  const found = deepFind(v, keys, depth + 1);
                  if (found) return found;
                }
              }
              return null;
            };

            const handleV0Event = async (event: string, dataStr: string) => {
              let data: Record<string, unknown> = {};
              try { data = JSON.parse(dataStr); } catch { /* ignore */ }

              const possibleChatId =
                deepFind(data, ["chatId", "chat_id"]) ||
                ((event === "chat" || event === "init" || event === "chat_created" || event === "chat_init")
                  ? (typeof data.id === "string" ? data.id : null)
                  : null);
              if (possibleChatId && possibleChatId !== state.finalChatId) {
                state.finalChatId = possibleChatId;
                if (runId) {
                  await sb.from("code_agent_runs")
                    .update({ v0_chat_id: state.finalChatId })
                    .eq("id", runId);
                }
                if (!v0ChatId) {
                  await sb.from(tableName)
                    .update({ v0_chat_id: state.finalChatId })
                    .eq("id", projectId);
                }
                send("chat_created", { chatId: state.finalChatId, webUrl: data.webUrl });
              }

              const possibleDemo = deepFind(data, ["demoUrl", "demo_url", "previewUrl", "preview_url"]);
              if (possibleDemo && possibleDemo !== state.finalDemoUrl) {
                state.finalDemoUrl = possibleDemo;
                send("preview", { url: state.finalDemoUrl });
              }
              const possibleVersion = deepFind(data, ["versionId", "version_id"]);
              if (possibleVersion) state.finalVersionId = possibleVersion;

              // DELTA — append text
              if (event === "message_delta" || event === "delta" || event === "text") {
                const text = extractText(data);
                if (text) {
                  state.assistantText += text;
                  send("delta", { text });
                  await persistAssistant();
                }
              }
              // SNAPSHOT — replace, don't append
              else if (event === "message" || event === "message_completed" || event === "message_snapshot") {
                const text = extractText(data);
                if (text) {
                  state.assistantText = text;
                  await persistAssistant(true);
                }
              }

              const file = (data.file as { name?: string; content?: string }) || (data as { name?: string; content?: string });
              if (file && typeof file.name === "string" && typeof file.content === "string" && (event === "file" || event === "file_update" || event === "file_created")) {
                state.seenFiles.set(file.name, file.content);
                send("file", { path: file.name, content: file.content });
                await sb.from(filesTable).upsert(
                  { project_id: projectId, path: file.name, content: file.content },
                  { onConflict: "project_id,path" },
                );
              }

              const version = data.version as { id?: string; files?: V0File[] } | undefined;
              if (version) {
                if (typeof version.id === "string") state.finalVersionId = version.id;
                if (Array.isArray(version.files)) {
                  for (const f of version.files) {
                    if (f?.name && typeof f.content === "string") {
                      state.seenFiles.set(f.name, f.content);
                      send("file", { path: f.name, content: f.content });
                      await sb.from(filesTable).upsert(
                        { project_id: projectId, path: f.name, content: f.content },
                        { onConflict: "project_id,path" },
                      );
                    }
                  }
                }
              }

              // Task / tool / thinking events — persist for live display
              if (/^(task|tool)/i.test(event) || event === "thinking" || event === "step") {
                const title =
                  asString(data.title) ||
                  asString(data.name) ||
                  asString(data.label) ||
                  (typeof data.tool === "string" ? `Running ${data.tool}` : "") ||
                  (event === "thinking" ? "Thinking…" : "Working…");
                const status =
                  /completed|done|finished/i.test(event) ? "done" :
                  /failed|error/i.test(event) ? "error" :
                  asString(data.status) || "running";
                await upsertTask({
                  externalId: asString(data.id) || asString(data.taskId) || `${event}-${state.taskSequence}`,
                  title,
                  status,
                  detail: asString(data.detail) || asString(data.description) || undefined,
                });
                send(event, data);
              }

              if (event === "status") {
                send(event, data);
              }

              // Log unhandled events so we can iterate on the schema
              if (
                event !== "message_delta" && event !== "delta" && event !== "text" &&
                event !== "message" && event !== "message_completed" && event !== "message_snapshot" &&
                event !== "file" && event !== "file_update" && event !== "file_created" &&
                event !== "status" && event !== "chat" && event !== "init" && event !== "chat_created" && event !== "chat_init" &&
                !/^(task|tool)/i.test(event) && event !== "thinking" && event !== "step" &&
                event !== "ping"
              ) {
                console.log("[code-v0-agent] unhandled v0 event", event, dataStr.slice(0, 200));
              }
            };

            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              buf += decoder.decode(value, { stream: true });
              const blocks = buf.split("\n\n");
              buf = blocks.pop() || "";
              for (const block of blocks) {
                if (!block.trim()) continue;
                let event = "message";
                let dataStr = "";
                for (const ln of block.split("\n")) {
                  if (ln.startsWith("event:")) event = ln.slice(6).trim();
                  else if (ln.startsWith("data:")) dataStr += ln.slice(5).trim();
                }
                if (dataStr) await handleV0Event(event, dataStr);
              }
            }

            // Fallback: if no chat id seen in the stream, list chats and pick the newest for this project.
            if (!state.finalChatId) {
              try {
                const list = await v0Json<{ data?: Array<{ id: string; projectId?: string; createdAt?: string }> }>(
                  v0ProjectId ? `/chats?projectId=${encodeURIComponent(v0ProjectId)}&limit=5` : `/chats?limit=5`,
                  v0Key,
                  { method: "GET" },
                );
                const candidates = (list.data || []).filter((c) =>
                  !v0ProjectId || c.projectId === v0ProjectId
                );
                candidates.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
                const pick = candidates[0];
                if (pick?.id) {
                  state.finalChatId = pick.id;
                  if (runId) {
                    await sb.from("code_agent_runs")
                      .update({ v0_chat_id: state.finalChatId })
                      .eq("id", runId);
                  }
                  await sb.from(tableName)
                    .update({ v0_chat_id: state.finalChatId })
                    .eq("id", projectId);
                  send("chat_created", { chatId: state.finalChatId });
                }
              } catch (e) {
                console.warn("[code-v0-agent] chats list fallback failed", (e as Error).message);
              }
            }

            // Final fetch to be sure
            if (state.finalChatId) {
              try {
                const final = await v0Json<V0Chat>(`/chats/${encodeURIComponent(state.finalChatId)}`, v0Key, { method: "GET" });
                const version = final.latestVersion;
                if (version?.id) state.finalVersionId = version.id;
                if (version?.demoUrl) state.finalDemoUrl = version.demoUrl;
                else if (final.demoUrl) state.finalDemoUrl = final.demoUrl;
                if (Array.isArray(version?.files)) {
                  for (const f of version!.files!) {
                    if (f?.name && typeof f.content === "string" && !state.seenFiles.has(f.name)) {
                      state.seenFiles.set(f.name, f.content);
                      send("file", { path: f.name, content: f.content });
                      await sb.from(filesTable).upsert(
                        { project_id: projectId, path: f.name, content: f.content },
                        { onConflict: "project_id,path" },
                      );
                    }
                  }
                }
                if (!state.assistantText) {
                  const last = final.messages?.findLast?.((m) => m.role === "assistant")?.content
                    || final.content || "";
                  state.assistantText = last;
                  if (last) send("delta", { text: last });
                }
              } catch (e) {
                console.warn("[code-v0-agent] final fetch failed", (e as Error).message);
              }
            }

            const updates: Record<string, unknown> = {};
            if (state.finalChatId && state.finalChatId !== v0ChatId) updates.v0_chat_id = state.finalChatId;
            if (state.finalVersionId) updates.v0_latest_version_id = state.finalVersionId;
            if (state.finalDemoUrl) updates.preview_url = state.finalDemoUrl;
            if (Object.keys(updates).length) {
              await sb.from(tableName).update(updates).eq("id", projectId);
            }
            if (state.finalDemoUrl) send("preview", { url: state.finalDemoUrl });

            // Mark any still-running tasks done
            if (runId) {
              await sb.from("code_v0_tasks")
                .update({ status: "done" })
                .eq("run_id", runId)
                .neq("status", "done");
            }

            const finalMsg = state.assistantText.trim()
              || (state.seenFiles.size ? `تم تحديث ${state.seenFiles.size} ملف. البريفيو شغّال.` : "تم تنفيذ الطلب.");
            state.assistantText = finalMsg;
            await persistAssistant(true);

            if (runId) {
              await sb.from("code_agent_runs").update({
                status: "done",
                finished_at: new Date().toISOString(),
                preview_url: state.finalDemoUrl ?? null,
                v0_version_id: state.finalVersionId ?? null,
                last_poll_at: new Date().toISOString(),
              }).eq("id", runId);
            }

            send("done", {
              files: Array.from(state.seenFiles.keys()),
              previewUrl: state.finalDemoUrl,
              versionId: state.finalVersionId,
              summary: finalMsg,
            });
          } catch (e) {
            const msg = (e as Error).message;
            console.error("[code-v0-agent]", msg);
            const statusMatch = msg.match(/v0_api_(\d{3})/);
            const status = statusMatch ? Number(statusMatch[1]) : 0;
            if (shouldBlockOnStatus(status)) {
              await blockV0Key(v0KeyId, msg);
            }
            if (assistantMessageId) {
              await sb.from(messagesTable)
                .update({ content: `حصل خطأ من v0: ${msg}` })
                .eq("id", assistantMessageId);
            }
            if (runId) {
              await sb.from("code_agent_runs").update({
                status: "error", error: msg, finished_at: new Date().toISOString(),
              }).eq("id", runId);
            }
            send("error", { message: msg });
          } finally {
            closeStream();
          }
        })();

        // Keep background work alive even if the client disconnects.
        try {
          if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
            EdgeRuntime.waitUntil(work);
          }
        } catch { /* ignore */ }
      },
    });

    return new Response(sseStream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    console.error("[code-v0-agent] fatal", (e as Error).message);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
