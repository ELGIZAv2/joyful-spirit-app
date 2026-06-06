// Megsy Operator: Orchestrator edge function
// Triage: chat (direct reply) vs task (CEO->COO->CTO->Executor loop).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { TOOL_REGISTRY, TOOL_AVAILABILITY, callLLM, type ToolName } from "./tools.ts";
import { getAuthUser, isInternalCaller } from "../_shared/auth.ts";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SB_URL, SB_SRK, { auth: { persistSession: false } });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_STEPS = 50;
const TICK_BUDGET_MS = 110_000;

const TRIAGE_MODEL = "google/gemini-2.5-flash";
const CEO_MODEL = "google/gemini-2.5-pro";
const COO_MODEL = "google/gemini-2.5-flash";
const CTO_MODEL = "google/gemini-2.5-flash";
const CHAT_MODEL = "google/gemini-2.5-flash";

// Language consistency: every user-visible agent output MUST be written in the
// exact same language AND dialect the user used in their goal — regardless of the
// language of search results, fetched pages, or tool outputs (which may be in any
// language). Never switch to the language of the sources.
const LANG_RULE = `\n\nقاعدة اللغة (إلزامية): اكتب ردّك بالكامل بنفس لغة ولهجة المستخدم في "الهدف" من أول حرف لآخر حرف (مصري→مصري، خليجي→خليجي، إنجليزي→إنجليزي...). تجاهل لغة نتائج البحث أو الصفحات أو الأدوات — حتى لو كانت بالصينية أو الإنجليزية، ترجم ولخّص دائماً بلغة المستخدم. لا تخلط لغتين ولا تكتب أي جملة بلغة المصدر ولا تعلّق على تبديل اللغة إطلاقاً.\nLANGUAGE RULE (MANDATORY): Write the ENTIRE answer in the SAME language and dialect as the user's goal, from the first character. Translate source/tool content into the user's language. Never mix languages and never comment about language switching.`;

const toolDescriptions: Record<string, string> = {
  web_search: "web_search { query, depth? } — بحث الويب",
  read_url: "read_url { url } — يقرأ محتوى صفحة كاملة كنص نظيف",
  browse_url: "browse_url { url } — افتح URL في متصفح سحابي حقيقي (للعرض المباشر فقط، بدون تفاعل)",
  browser_act: `browser_act { action, url?, selector?, text?, expression?, ms? } — تحكم حقيقي بالمتصفح:
    action="navigate" + url → افتح صفحة
    action="click" + selector → اضغط عنصر (CSS selector)
    action="type" + selector + text → اكتب في حقل
    action="extract" + selector? → استخرج نص الصفحة/العنصر
    action="evaluate" + expression → نفّذ JavaScript وأرجع القيمة
    action="screenshot" → التقط لقطة شاشة
    action="wait" + ms → انتظر (max 10000)
  (الجلسة تُعاد للاستخدام تلقائياً عبر sessionId)`,
  generate_image: "generate_image { prompt } — يولّد صورة ويحفظها كملف",
  build_app: "build_app { prompt } — ينشئ مشروع تطبيق جديد ويبدأ بناءه داخل Megsy Code",
  publish_app: "publish_app { project_id } — ينشر التطبيق",
  save_memory: "save_memory { fact, importance? } — يحفظ معلومة في ذاكرة المستخدم",
};

const availableToolEntries = Object.entries(TOOL_AVAILABILITY).filter(([_, v]) => v);
const availableToolsList = availableToolEntries.map(([k]) => k).join(", ");
console.log("[operator] TOOL_AVAILABILITY:", JSON.stringify(TOOL_AVAILABILITY));

const TOOLS_SPEC = `
الأدوات المتاحة حاليًا: ${availableToolsList}
${availableToolEntries.map(([k]) => `- ${toolDescriptions[k]}`).join("\n")}
`;

async function logMsg(run_id: string, agent: string, content: string, metadata: Record<string, unknown> = {}) {
  await admin.from("operator_agent_messages").insert({ run_id, agent, role: "assistant", content, metadata });
}

async function setRun(run_id: string, patch: Record<string, unknown>) {
  const { error } = await admin
    .from("operator_runs")
    .update({ ...patch, last_tick_at: new Date().toISOString() })
    .eq("id", run_id)
    .select("id")
    .maybeSingle();
  if (error) console.error("[operator] setRun failed", run_id, JSON.stringify(patch), error.message);
}

function safeJson<T = unknown>(s: string): T | null {
  try {
    const m = s.match(/\{[\s\S]*\}/);
    return JSON.parse(m ? m[0] : s) as T;
  } catch { return null; }
}

// ---------- Triage ----------
async function triage(goal: string): Promise<"chat" | "task"> {
  const sys = `أنت موزّع طلبات داخل Megsy Operator. صنّف رسالة المستخدم:
- "chat": إذا كانت سؤال/تحية/استفسار/طلب معلومات/سؤال عن قدراتك ولا تتطلب تنفيذ مهام خارجية أو بناء تطبيق.
- "task": إذا طلب تنفيذ مهمة فعلية (بناء تطبيق، بحث ونشر، تصفح موقع، إجراء متعدد الخطوات).
أرجع JSON فقط: { "mode": "chat" | "task", "reason": "سبب قصير" }`;
  const r = await callLLM({
    model: TRIAGE_MODEL, system: sys,
    messages: [{ role: "user", content: goal }],
    json: true,
  });
  const p = safeJson<{ mode: string }>(r.content ?? "");
  return p?.mode === "task" ? "task" : "chat";
}

async function runChatReply(run_id: string, goal: string, memory: string[]): Promise<string> {
  await setRun(run_id, { current_phase: "chat", mode: "chat" });
  const sys = `You are Megsy OS — a smart, friendly AI assistant. ALWAYS reply in the EXACT same language and dialect the user wrote in (Egyptian Arabic → Egyptian Arabic, Gulf Arabic → Gulf Arabic, English → English, etc.). Be concise and clear. Do not call tools here. Explain your capabilities if asked:
- Building and deploying real apps
- Web search & browsing
- Generating images, reports, strategies
- Saving user memories & preferences
User memory context: ${memory.join(" | ") || "none"}`;
  const r = await callLLM({
    model: CHAT_MODEL, system: sys,
    messages: [{ role: "user", content: goal }],
  });
  if (!r.ok || !r.content?.trim()) {
    console.error("[operator] chat reply failed:", r.error);
    const errMsg = "تعذّر الوصول لمحرك الذكاء الآن، حاول بعد لحظات.";
    await logMsg(run_id, "assistant", errMsg, { chat: true, error: r.error });
    await setRun(run_id, { status: "failed", current_phase: "done", chat_response: errMsg, error: r.error });
    return errMsg;
  }
  const reply = r.content;
  await logMsg(run_id, "assistant", reply, { chat: true });
  await setRun(run_id, { status: "done", current_phase: "done", chat_response: reply });
  return reply;

}

// ---------- Dynamic Agents ----------
async function loadDynamicAgents(user_id: string) {
  const { data } = await admin.from("operator_dynamic_agents")
    .select("key,label,description,system_prompt,color").eq("user_id", user_id);
  return data || [];
}

async function maybeSpawnDynamicAgent(run_id: string, user_id: string, goal: string, existingKeys: string[]) {
  const sys = `أنت مدير وكلاء داخل Megsy Operator. مهمتك تحديد لو الهدف يستفيد من وكيل متخصص جديد (مثل: marketing, designer, accountant, researcher).
الوكلاء الموجودون حالياً: ${existingKeys.join(", ") || "لا يوجد"}
أرجع JSON فقط:
- لو لازم وكيل جديد ومش موجود: { "spawn": true, "key": "marketing", "label": "وكيل الماركتينج", "description": "متخصص في حملات التسويق والمحتوى", "system_prompt": "أنت وكيل ماركتينج خبير...", "color": "#ec4899" }
- لو مش محتاج: { "spawn": false }`;
  const r = await callLLM({ model: CEO_MODEL, system: sys, messages: [{ role: "user", content: goal }], json: true });
  const p = safeJson<{ spawn: boolean; key?: string; label?: string; description?: string; system_prompt?: string; color?: string }>(r.content ?? "");
  if (!p?.spawn || !p.key || !p.label || !p.system_prompt) return null;
  const { data } = await admin.from("operator_dynamic_agents").insert({
    user_id, key: p.key, label: p.label, description: p.description,
    system_prompt: p.system_prompt, color: p.color || "#ec4899", spawned_from_run_id: run_id,
  }).select().single();
  if (data) {
    await logMsg(run_id, "system", `🆕 وُلِد وكيل جديد: ${p.label}`, { dynamic_agent: data });
    await admin.from("operator_audit_log").insert({
      user_id, run_id, agent: "system", action: "spawn_dynamic_agent", payload: { key: p.key, label: p.label },
    });
  }
  return data;
}

// ---------- CEO ----------
async function runCEO(run_id: string, goal: string, memory: string[], dynamicAgents: Array<{ label: string; description: string | null }>): Promise<string> {
  await setRun(run_id, { current_phase: "ceo" });
  const agentList = dynamicAgents.length
    ? `\nالوكلاء المتخصصون المتاحون: ${dynamicAgents.map(a => `${a.label} (${a.description || ""})`).join(" | ")}`
    : "";
  const sys = `أنت CEO. حدد الاستراتيجية باختصار (3-5 أسطر): الهدف، معايير النجاح، المخاطر. لا تذكر أدوات.${agentList}${LANG_RULE}`;
  const r = await callLLM({
    model: CEO_MODEL, system: sys,
    messages: [{ role: "user", content: `الهدف: ${goal}\nذاكرة: ${memory.join("\n") || "لا يوجد"}` }],
  });
  const strategy = r.content ?? "تنفيذ الهدف مباشرة.";
  await logMsg(run_id, "ceo", strategy);
  return strategy;
}

// ---------- COO ----------
async function runCOO(run_id: string, goal: string, strategy: string): Promise<Array<{ title: string; description: string }>> {
  await setRun(run_id, { current_phase: "coo" });
  const sys = `أنت COO. حوّل الاستراتيجية لخطة JSON: { "steps": [ { "title": "...", "description": "..." } ] }
- أقل عدد خطوات (3-8).
- كل خطوة تنفذ بأداة واحدة.
- عناوين ووصف الخطوات بنفس لغة المستخدم في الهدف.
${TOOLS_SPEC}`;
  const r = await callLLM({
    model: COO_MODEL, system: sys,
    messages: [{ role: "user", content: `الهدف: ${goal}\n\nالاستراتيجية:\n${strategy}` }],
    json: true,
  });
  const parsed = safeJson<{ steps: Array<{ title: string; description: string }> }>(r.content ?? "");
  const steps = parsed?.steps?.slice(0, MAX_STEPS) ?? [{ title: "تنفيذ الهدف", description: goal }];
  await logMsg(run_id, "coo", `خطة من ${steps.length} خطوات`, { steps });
  const rows = steps.map((s, i) => ({
    run_id, step_no: i + 1, agent: "executor",
    title: s.title, description: s.description, status: "pending",
  }));
  await admin.from("operator_steps").insert(rows);
  return steps;
}

// ---------- CTO ----------
async function runCTO(run_id: string, step: { id: string; title: string; description: string }, user_id: string, project_id: string | null) {
  await setRun(run_id, { current_phase: "cto" });
  const sys = `أنت CTO. اختر أداة من الأدوات المتاحة فقط وأعد JSON: { "tool": "...", "input": { ... } }
${TOOLS_SPEC}
ملاحظات:
- لا تختر أداة غير متاحة.
- publish_app ينشر مشروعاً موجوداً مسبقاً.
سياق: user_id="${user_id}", project_id=${project_id ? `"${project_id}"` : "null"}.`;
  const r = await callLLM({
    model: CTO_MODEL, system: sys,
    messages: [{ role: "user", content: `الخطوة: ${step.title}\n${step.description}` }],
    json: true,
  });
  const parsed = safeJson<{ tool: ToolName; input: Record<string, unknown> }>(r.content ?? "");
  await logMsg(run_id, "cto", `أداة: ${parsed?.tool ?? "غير محددة"}`, { input: parsed?.input });
  return parsed;
}

// ---------- Executor ----------
async function executeStep(run_id: string, step: any, user_id: string, user_jwt: string | null, project_id: string | null, deadline: number) {
  if (Date.now() > deadline) return { timeout: true };
  await admin.from("operator_steps").update({ status: "running", started_at: new Date().toISOString() }).eq("id", step.id);

  const plan = await runCTO(run_id, step, user_id, project_id);
  const toolName = plan?.tool as string | undefined;
  const inRegistry = !!toolName && (toolName in TOOL_REGISTRY);
  const isAvailable = !!toolName && !!TOOL_AVAILABILITY[toolName as keyof typeof TOOL_AVAILABILITY];
  if (!plan || !toolName || !inRegistry || !isAvailable) {
    const reason = !toolName ? "no tool chosen"
      : !inRegistry ? `not in registry (registry=${Object.keys(TOOL_REGISTRY).join(",")})`
      : `not available (availability=${JSON.stringify(TOOL_AVAILABILITY)})`;
    console.log(`[operator] rejected tool="${toolName}" reason=${reason}`);
    await admin.from("operator_steps").update({
      status: "failed", error: `أداة غير متاحة: ${toolName ?? "?"} — ${reason}`, finished_at: new Date().toISOString(),
    }).eq("id", step.id);
    return { failed: true };
  }

  const input: Record<string, unknown> = { ...plan.input, user_id };
  if (plan.tool === "build_app") {
    input.prompt = (input.prompt as string) || step.description || step.title;
    input.user_jwt = user_jwt;
  }
  if (plan.tool === "publish_app") {
    input.project_id = (input.project_id as string) ?? project_id;
  }
  if (plan.tool === "browse_url" || plan.tool === "browser_act") {
    const { data: rr } = await admin.from("operator_runs").select("browser_session_id").eq("id", run_id).single();
    if (rr?.browser_session_id) input.sessionId = rr.browser_session_id;
  }

  const fn = TOOL_REGISTRY[plan.tool] as (i: any) => Promise<any>;
  const result = await fn(input);

  await admin.from("operator_steps").update({
    tool: plan.tool, tool_input: input, tool_output: result,
    status: result.ok ? "done" : "failed",
    error: result.ok ? null : (result.error ?? "tool error"),
    finished_at: new Date().toISOString(),
  }).eq("id", step.id);

  if (result.ok && plan.tool === "publish_app") {
    const url = (result.data as any)?.published_url;
    if (url) await setRun(run_id, { published_url: url });
  }
  if (result.ok && plan.tool === "build_app") {
    const d = (result.data as any) ?? {};
    const patch: Record<string, unknown> = {};
    if (d.project_id) patch.project_id = d.project_id;
    if (Object.keys(patch).length) await setRun(run_id, patch);
  }
  if (result.ok && (plan.tool === "browse_url" || plan.tool === "browser_act")) {
    const d = (result.data as any) ?? {};
    const patch: Record<string, unknown> = {};
    if (d.sessionId) patch.browser_session_id = d.sessionId;
    if (d.liveViewUrl) patch.live_view_url = d.liveViewUrl;
    if (Object.keys(patch).length) await setRun(run_id, patch);
  }

  // Audit log
  await admin.from("operator_audit_log").insert({
    user_id, run_id, agent: "executor", action: `tool:${plan.tool}`,
    payload: { input: { ...input, user_jwt: undefined }, ok: result.ok },
    error: result.ok ? null : result.error,
  });

  if (result.ok) {
    const data = (result.data as any) ?? {};
    await admin.from("operator_artifacts").insert({
      run_id, step_id: step.id,
      kind: data.screenshotUrl ? "image" : plan.tool === "browse_url" ? "url" : "data",
      url: data.screenshotUrl ?? data.liveViewUrl ?? data.published_url ?? null,
      content: JSON.stringify(data).slice(0, 4000),
      metadata: { tool: plan.tool, step_title: step.title },
    });
  }

  return { failed: !result.ok };
}

// ---------- Main tick ----------
async function tick(run_id: string) {
  const deadline = Date.now() + TICK_BUDGET_MS;
  const { data: run } = await admin.from("operator_runs").select("*").eq("id", run_id).single();
  if (!run) return;
  if (run.status === "done" || run.status === "failed") return;

  await setRun(run_id, { status: "running" });

  // Legacy user_memories removed; persistent memory is handled by the letta function.
  const memory: string[] = [];

  // Triage if first tick
  if (!run.mode || run.mode === "task" && !run.current_phase) {
    const mode = await triage(run.goal);
    if (mode === "chat") {
      await runChatReply(run_id, run.goal, memory);
      return;
    }
    await setRun(run_id, { mode: "task" });
  }
  if (run.mode === "chat") return; // already handled

  // CEO + COO if no steps
  const { count } = await admin.from("operator_steps").select("*", { count: "exact", head: true }).eq("run_id", run_id);
  if (!count || count === 0) {
    // Load dynamic agents + maybe spawn a new one for this goal
    const { data: prefs } = await admin.from("operator_user_settings").select("allow_dynamic_agents").eq("user_id", run.user_id).maybeSingle();
    let dynAgents = await loadDynamicAgents(run.user_id);
    if (prefs?.allow_dynamic_agents !== false) {
      const spawned = await maybeSpawnDynamicAgent(run_id, run.user_id, run.goal, dynAgents.map((a: any) => a.key));
      if (spawned) dynAgents = [...dynAgents, spawned];
    }
    const strategy = await runCEO(run_id, run.goal, memory, dynAgents);
    await runCOO(run_id, run.goal, strategy);
  }

  // Execute pending
  while (Date.now() < deadline) {
    const { data: next } = await admin
      .from("operator_steps").select("*").eq("run_id", run_id).eq("status", "pending")
      .order("step_no", { ascending: true }).limit(1).maybeSingle();
    if (!next) break;
    await setRun(run_id, { current_phase: "executing" });
    const { data: freshRun } = await admin.from("operator_runs").select("project_id,user_jwt").eq("id", run_id).single();
    const r = await executeStep(run_id, next, run.user_id, freshRun?.user_jwt ?? null, freshRun?.project_id ?? null, deadline);
    if (r.timeout) break;
  }

  const { data: pending } = await admin
    .from("operator_steps").select("id").eq("run_id", run_id).eq("status", "pending").limit(1);
  if (!pending || pending.length === 0) {
    // A single recoverable tool failure (e.g. a redundant browse retry, or one
    // search provider being rate-limited) must NOT fail the whole run — the
    // agent typically recovers and still produces a useful result. Only mark the
    // run as failed when EVERY step failed, i.e. nothing succeeded at all.
    const { data: doneSteps } = await admin
      .from("operator_steps").select("id").eq("run_id", run_id).eq("status", "done").limit(1);
    const { data: failedSteps } = await admin
      .from("operator_steps").select("id").eq("run_id", run_id).eq("status", "failed").limit(1);
    const hadAnySuccess = !!(doneSteps && doneSteps.length > 0);
    const hadAnyFailure = !!(failedSteps && failedSteps.length > 0);
    const status = !hadAnySuccess && hadAnyFailure ? "failed" : "done";
    const { data: allSteps } = await admin
      .from("operator_steps").select("title,status,tool,error").eq("run_id", run_id).order("step_no");
    const summary = await callLLM({
      model: CEO_MODEL,
      system: `أنت CEO. اكتب تقرير نهائي قصير وواضح (3-5 أسطر) عن النتيجة، مع ذكر أهم المصادر لو وُجدت.${LANG_RULE}`,
      messages: [{ role: "user", content: `الهدف: ${run.goal}\n\nالخطوات:\n${JSON.stringify(allSteps, null, 2).slice(0, 3000)}` }],
    });
    await logMsg(run_id, "ceo", summary.content ?? "اكتمل التنفيذ.", { final: true });
    await setRun(run_id, { status, current_phase: "done", result: { summary: summary.content } });
    // Clear JWT after done
    await admin.from("operator_runs").update({ user_jwt: null }).eq("id", run_id);
    return;
  }

  fetch(`${SB_URL}/functions/v1/operator-orchestrator`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SB_SRK}` },
    body: JSON.stringify({ run_id }),
  }).catch(() => null);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const { run_id, goal, user_id, sync } = body ?? {};

    if (!run_id && goal) {
      // User-initiated new run: require authenticated caller, ignore body.user_id
      const authUser = await getAuthUser(req);
      if (!authUser) {
        return new Response(JSON.stringify({ error: "auth_required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (user_id && user_id !== authUser.id) {
        return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const auth = req.headers.get("authorization") || req.headers.get("Authorization");
      const userJwt = auth?.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null;
      const safeJwt = userJwt && userJwt !== SB_SRK ? userJwt : null;

      const { data: newRun, error } = await admin
        .from("operator_runs")
        .insert({ user_id: authUser.id, goal, status: "pending", user_jwt: safeJwt })
        .select().single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ run_id: newRun.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!run_id) {
      return new Response(JSON.stringify({ error: "run_id or goal required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // run_id-only path is for internal tick re-entry — require internal caller or run owner
    if (!isInternalCaller(req)) {
      const authUser = await getAuthUser(req);
      if (!authUser) {
        return new Response(JSON.stringify({ error: "auth_required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: runOwner } = await admin.from("operator_runs").select("user_id").eq("id", run_id).single();
      if (!runOwner || runOwner.user_id !== authUser.id) {
        return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    if (sync) await tick(run_id);
    else EdgeRuntime.waitUntil(tick(run_id));
    return new Response(JSON.stringify({ ok: true, run_id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
