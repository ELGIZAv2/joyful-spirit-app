import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { getRouter } from "../_shared/llm-router.ts";
import { buildToolsForApps, resolveRequest, type ToolDef } from "../_shared/pipedream-tools.ts";
import { proxyRequest } from "../_shared/pipedream-proxy.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DASHSCOPE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
const DASHSCOPE_SERVICES = new Set([
  "alibaba",
  "alibabacloud",
  "dashscope",
  "qwen",
  "aliyun",
  "ali",
  "qwendashscope",
  "alibabaqwen",
]);

type ChatMessage = {
  role?: string;
  content?: unknown;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeService(value: unknown) {
  return String(value || "").toLowerCase().replace(/[\s_-]+/g, "");
}

async function getDashscopeKey(): Promise<string | null> {
  const envKey = Deno.env.get("DASHSCOPE_API_KEY") || Deno.env.get("QWEN_API_KEY") || Deno.env.get("ALIBABA_API_KEY");
  if (envKey) return envKey;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) return null;

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin
    .from("api_keys")
    .select("service, api_key, is_active, is_blocked")
    .limit(200);

  if (error) {
    console.error("[chat-alibaba] api_keys lookup failed", error.message);
    return null;
  }

  const row = (data || []).find((item: any) => (
    DASHSCOPE_SERVICES.has(normalizeService(item.service)) &&
    item.api_key &&
    item.is_active !== false &&
    item.is_blocked !== true
  ));

  return row?.api_key || null;
}

function hasImage(messages: ChatMessage[]) {
  return messages.some((message) => Array.isArray(message.content) && message.content.some((part: any) => part?.type === "image_url" || part?.image_url));
}

function pickQwenModel(rawModel: unknown, tier: unknown, messages: ChatMessage[]) {
  if (hasImage(messages)) return "qwen-vl-max";
  const raw = String(rawModel || tier || "").toLowerCase();
  if (raw.includes("qwen-turbo")) return "qwen-turbo";
  if (raw.includes("qwen-plus")) return "qwen-plus";
  if (raw.includes("qwen-max")) return "qwen-max";
  if (raw.includes("qwen3-coder")) return raw.includes("/") ? raw.split("/").pop() || "qwen3-coder-plus" : raw;
  if (raw.includes("lite") || raw.includes("nano")) return "qwen-turbo";
  if (raw.includes("pro") || raw.includes("max")) return "qwen-max";
  return "qwen-plus";
}

function normalizeMessages(messages: ChatMessage[]) {
  return messages
    .filter((message) => ["system", "user", "assistant"].includes(String(message.role || "")))
    .map((message) => ({ role: message.role, content: message.content || "" }))
    .filter((message) => !(message.role === "assistant" && typeof message.content === "string" && !message.content.trim()));
}

function contentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part: any) => part?.text || part?.content || "")
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

function latestUserText(messages: ChatMessage[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "user") {
      const text = contentToText(messages[i].content).trim();
      if (text) return text;
    }
  }
  return messages.map((message) => contentToText(message.content)).join("\n").trim();
}

const EXTENDED_RESEARCH_SECTIONS = [
  { title: "Scope, thesis, and executive overview", focus: "define the topic precisely, explain why it matters, summarize the core thesis, and map the report's scope" },
  { title: "Definitions, background, and historical context", focus: "explain concepts, terminology, origin story, historical milestones, and context needed before analysis" },
  { title: "Current state and latest developments", focus: "cover recent developments, current facts, active debates, major news, and what changed recently" },
  { title: "Key actors, stakeholders, and institutional landscape", focus: "map people, organizations, countries, companies, communities, regulators, and other actors involved" },
  { title: "Evidence base and source-by-source findings", focus: "compare what the strongest sources say, identify agreements and contradictions, and quote concrete figures or claims" },
  { title: "Drivers, causes, mechanisms, and incentives", focus: "analyze why the situation exists, the forces behind it, incentives, constraints, and causal chains" },
  { title: "Data, metrics, numbers, and measurable indicators", focus: "collect statistics, estimates, dates, rankings, financials, adoption numbers, timelines, or measurable evidence" },
  { title: "Regional, sectoral, and comparative analysis", focus: "compare regions, markets, sectors, groups, alternatives, or historical analogies relevant to the topic" },
  { title: "Case studies and concrete examples", focus: "write detailed examples and mini-case-studies that make the topic specific instead of generic" },
  { title: "Benefits, opportunities, strengths, and upside scenarios", focus: "analyze positive outcomes, opportunities, strategic advantages, and best-case interpretations" },
  { title: "Risks, criticism, limitations, and counterarguments", focus: "analyze weaknesses, failure modes, controversies, opposing views, uncertainty, and source limitations" },
  { title: "Future outlook and scenario planning", focus: "project likely paths, alternative scenarios, early signals to watch, and second-order effects" },
  { title: "Practical implications and recommendations", focus: "turn the analysis into practical takeaways, decisions, recommendations, and action priorities" },
  { title: "Final synthesis, open questions, and sources", focus: "synthesize the whole report, identify unresolved questions, and finish with a detailed Sources section" },
];

function enqueueSse(controller: ReadableStreamDefaultController<Uint8Array>, payload: unknown) {
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
}

function enqueueText(controller: ReadableStreamDefaultController<Uint8Array>, content: string) {
  if (!content) return;
  enqueueSse(controller, { choices: [{ delta: { content } }] });
}

function enqueueDone(controller: ReadableStreamDefaultController<Uint8Array>) {
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
}

// Open-weight / open-source models served through OpenRouter. We rotate through
// several of these so each report section is written by a different model — this
// adds depth and diversity beyond a single Qwen pass. ":online" enables
// OpenRouter's built-in web search plugin so these models are also grounded.
const OPENROUTER_RESEARCH_MODELS = [
  "deepseek/deepseek-chat-v3.1",
  "qwen/qwen3-235b-a22b",
  "meta-llama/llama-3.3-70b-instruct",
  "deepseek/deepseek-r1",
  "mistralai/mistral-large",
];

type ResearchProvider =
  | { kind: "dashscope" }
  | { kind: "openrouter"; model: string };

function countWords(text: string): number {
  return (text.trim().match(/\S+/g) || []).length;
}

// Generic OpenAI-compatible SSE streamer. Streams content deltas to the client
// AND returns the full accumulated text so the caller can measure depth.
async function streamOpenAICompatible(
  url: string,
  apiKey: string,
  body: Record<string, unknown>,
  controller: ReadableStreamDefaultController<Uint8Array>,
  signal?: AbortSignal,
  extraHeaders?: Record<string, string>,
): Promise<string> {
  const upstream = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(extraHeaders || {}),
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!upstream.ok || !upstream.body) {
    const errorText = await upstream.text().catch(() => "");
    throw new Error(`Upstream error ${upstream.status}: ${errorText.slice(0, 500)}`);
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let collected = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "" || !line.startsWith("data:")) continue;

      const raw = line.replace(/^data:\s*/, "").trim();
      if (!raw || raw === "[DONE]") continue;
      try {
        const parsed = JSON.parse(raw);
        const content = parsed?.choices?.[0]?.delta?.content ?? parsed?.choices?.[0]?.message?.content ?? "";
        if (typeof content === "string" && content) {
          collected += content;
          enqueueText(controller, content);
        }
      } catch {
        continue;
      }
    }
  }
  return collected;
}

// Runs one writing turn against the chosen provider, returning the streamed text.
async function streamResearchTurn(
  provider: ResearchProvider,
  dashscopeKey: string,
  router: { url: string; key: string } | null,
  systemPrompt: string,
  userPrompt: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
  signal?: AbortSignal,
): Promise<string> {
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  if (provider.kind === "openrouter" && router) {
    return await streamOpenAICompatible(
      router.url,
      router.key,
      {
        model: provider.model.includes(":") ? provider.model : `${provider.model}:online`,
        stream: true,
        temperature: 0.4,
        max_tokens: 8000,
        messages,
      },
      controller,
      signal,
      { "HTTP-Referer": "https://megsy.ai", "X-Title": "Megsy Deep Research" },
    );
  }

  // DashScope / Qwen with native forced web search.
  return await streamOpenAICompatible(
    DASHSCOPE_URL,
    dashscopeKey,
    {
      model: "qwen-max",
      stream: true,
      temperature: 0.35,
      max_tokens: 8192,
      enable_search: true,
      search_options: { forced_search: true, enable_source: true, search_strategy: "pro" },
      messages,
    },
    controller,
    signal,
  );
}

function streamExtendedResearch(
  apiKey: string,
  router: { url: string; key: string } | null,
  messages: ChatMessage[],
  researchPrompt: string,
  signal?: AbortSignal,
) {
  const topic = latestUserText(messages) || "Deep Research";
  const conversationContext = messages
    .slice(-8)
    .map((message) => `${String(message.role || "user").toUpperCase()}: ${contentToText(message.content)}`)
    .join("\n\n")
    .slice(-18_000);
  const outline = EXTENDED_RESEARCH_SECTIONS.map((section, index) => `${index + 1}. ${section.title}: ${section.focus}`).join("\n");

  // Build the rotation pool: Qwen (native search) + every available open-source
  // model on OpenRouter. Each section is authored by the next provider in line.
  const pool: ResearchProvider[] = [{ kind: "dashscope" }];
  if (router) {
    for (const model of OPENROUTER_RESEARCH_MODELS) pool.push({ kind: "openrouter", model });
  }

  const MIN_SECTION_WORDS = 1600;

  return new Response(new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const sourcesLabel = router
          ? `${pool.length} open-source models (Qwen, DeepSeek, Llama, Mistral)`
          : "Qwen";
        enqueueSse(controller, { status: `Building a 40,000+ word deep research report with ${sourcesLabel}...` });

        for (let index = 0; index < EXTENDED_RESEARCH_SECTIONS.length; index++) {
          if (signal?.aborted) throw new Error("Request cancelled");
          const section = EXTENDED_RESEARCH_SECTIONS[index];
          const sectionNumber = index + 1;
          const provider = pool[index % pool.length];
          const providerLabel = provider.kind === "openrouter" ? provider.model.split("/").pop() : "qwen-max";

          enqueueSse(controller, { status: `Researching section ${sectionNumber}/${EXTENDED_RESEARCH_SECTIONS.length} (${providerLabel}): ${section.title}` });
          if (index > 0) enqueueText(controller, "\n\n---\n\n");

          const sectionPrompt = `Original research request:\n${topic}\n\nRecent conversation context:\n${conversationContext}\n\nFull report outline (${EXTENDED_RESEARCH_SECTIONS.length} sections):\n${outline}\n\nWrite section ${sectionNumber}/${EXTENDED_RESEARCH_SECTIONS.length}: "${section.title}".\nFocus only on: ${section.focus}.\n\nDepth requirements:\n- This is one part of a 40,000+ word report. Write this section as a long, standalone, deeply researched chapter.\n- Target 2,800-3,800 words for this section; do not summarize briefly.\n- Use H2/H3 headings, dense paragraphs, bullets, and tables where useful.\n- Include concrete names, dates, numbers, examples, and nuanced analysis.\n- Use web search and add inline citations like [1], [2] for factual claims.\n- Do NOT write the other sections. Do NOT end the whole report unless this is section ${EXTENDED_RESEARCH_SECTIONS.length}.\n- Match the user's exact language and dialect throughout.`;

          let sectionText = "";
          try {
            sectionText = await streamResearchTurn(provider, apiKey, router, researchPrompt, sectionPrompt, controller, signal);
          } catch (turnError) {
            console.error(`[deep-research] section ${sectionNumber} primary failed`, turnError);
            // Fallback to Qwen if an OpenRouter model fails mid-report.
            if (provider.kind === "openrouter") {
              sectionText = await streamResearchTurn({ kind: "dashscope" }, apiKey, router, researchPrompt, sectionPrompt, controller, signal);
            } else {
              throw turnError;
            }
          }

          // Continuation pass: if a section came back thin, have a DIFFERENT
          // open-source model continue it so we actually hit the target depth.
          if (countWords(sectionText) < MIN_SECTION_WORDS && !signal?.aborted) {
            const expander = pool.length > 1 ? pool[(index + 1) % pool.length] : pool[0];
            const expanderLabel = expander.kind === "openrouter" ? expander.model.split("/").pop() : "qwen-max";
            enqueueSse(controller, { status: `Deepening section ${sectionNumber} (${expanderLabel})...` });
            const continuationPrompt = `You are continuing section ${sectionNumber}/${EXTENDED_RESEARCH_SECTIONS.length}: "${section.title}" of a 40,000+ word report on:\n${topic}\n\nHere is what has been written so far for this section:\n"""\n${sectionText.slice(-6000)}\n"""\n\nContinue seamlessly from where it stopped. Do NOT repeat earlier content, do NOT restate the heading, and do NOT start the next section. Add at least 1,500 more words of NEW, deeper analysis on: ${section.focus}. Include extra concrete data, examples, names, numbers, tables, and inline citations [n]. Match the user's exact language and dialect.`;
            enqueueText(controller, "\n\n");
            try {
              await streamResearchTurn(expander, apiKey, router, researchPrompt, continuationPrompt, controller, signal);
            } catch (contError) {
              console.error(`[deep-research] section ${sectionNumber} continuation failed`, contError);
            }
          }
        }

        enqueueDone(controller);
      } catch (error) {
        console.error("[chat-alibaba/deep-research]", error);
        enqueueSse(controller, { error: (error as Error)?.message || "Deep Research failed" });
        enqueueDone(controller);
      } finally {
        controller.close();
      }
    },
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// ============= Tools-enabled chat loop =============
// When the user has connected Pipedream apps, we expose them as function tools.
// Qwen models on DashScope support OpenAI-style tool calling.
// We do the loop non-streaming (simpler & robust), then emit the final assistant
// content as SSE deltas so the existing chat client keeps working.
async function runWithTools(opts: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: ChatMessage[];
  tools: any[];
  toolDefByName: Map<string, ToolDef>;
  connectedAccounts: Array<{ app_slug: string; account_id: string; external_user_id: string | null }>;
  userId: string;
  signal?: AbortSignal;
}): Promise<Response> {
  const { apiKey, model, systemPrompt, messages, tools, toolDefByName, connectedAccounts, userId, signal } = opts;

  return new Response(new ReadableStream<Uint8Array>({
    async start(controller) {
      const convo: any[] = [
        { role: "system", content: systemPrompt },
        ...messages,
      ];

      try {
        for (let step = 0; step < 6; step++) {
          if (signal?.aborted) throw new Error("cancelled");

          const upstreamBody = {
            model,
            messages: convo,
            tools,
            tool_choice: "auto",
            stream: false,
            temperature: 0.4,
            max_tokens: 2048,
          };
          const r = await fetch(DASHSCOPE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify(upstreamBody),
          });
          if (!r.ok) {
            const txt = await r.text().catch(() => "");
            throw new Error(`upstream_${r.status}: ${txt.slice(0, 300)}`);
          }
          const data = await r.json();
          const choice = data?.choices?.[0];
          const msg = choice?.message;
          if (!msg) throw new Error("no_choice");

          const toolCalls = msg.tool_calls ?? [];
          if (toolCalls.length === 0) {
            // Final answer — stream content to client
            const finalText: string = typeof msg.content === "string"
              ? msg.content
              : Array.isArray(msg.content)
                ? msg.content.map((p: any) => p?.text || "").join("")
                : "";
            // Send in reasonable chunks so it feels streamed
            const chunkSize = 24;
            for (let i = 0; i < finalText.length; i += chunkSize) {
              if (signal?.aborted) break;
              enqueueText(controller, finalText.slice(i, i + chunkSize));
            }
            enqueueDone(controller);
            controller.close();
            return;
          }

          // Push assistant message with tool_calls into history
          convo.push({ role: "assistant", content: msg.content || "", tool_calls: toolCalls });

          // Execute each tool call via Pipedream Connect Proxy
          for (const tc of toolCalls) {
            const name = tc?.function?.name;
            const argsRaw = tc?.function?.arguments ?? "{}";
            let args: Record<string, any> = {};
            try { args = typeof argsRaw === "string" ? JSON.parse(argsRaw) : argsRaw; } catch { args = {}; }

            const def = toolDefByName.get(name);
            // Emit a tool_call SSE event for the UI
            enqueueSse(controller, { tool_event: { type: "tool_call", name, args } });

            let resultPayload: any;
            if (!def) {
              resultPayload = { error: `unknown_tool:${name}` };
            } else {
              const account = connectedAccounts.find((a) => a.app_slug === def.appSlug);
              if (!account) {
                resultPayload = { error: `not_connected:${def.appSlug}` };
              } else {
                try {
                  const req = resolveRequest(def, args);
                  const proxied = await proxyRequest({
                    externalUserId: account.external_user_id || userId,
                    accountId: account.account_id,
                    method: req.method,
                    url: req.url,
                    body: req.body,
                    headers: req.headers,
                  });
                  resultPayload = proxied;
                } catch (e) {
                  resultPayload = { error: e instanceof Error ? e.message : String(e) };
                }
              }
            }

            // Truncate large results before re-feeding into the model
            const resultStr = JSON.stringify(resultPayload).slice(0, 8000);
            convo.push({ role: "tool", tool_call_id: tc.id, name, content: resultStr });
            enqueueSse(controller, { tool_event: { type: "tool_result", name, ok: !resultPayload?.error, result: resultPayload } });
          }
        }
        // Fell out of loop — emit a sensible message
        enqueueText(controller, "\n\n(Stopped after maximum tool iterations.)");
        enqueueDone(controller);
        controller.close();
      } catch (err) {
        console.error("[chat-alibaba/tools]", err);
        enqueueSse(controller, { error: err instanceof Error ? err.message : String(err) });
        enqueueDone(controller);
        controller.close();
      }
    },
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function extractClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") || "";
  const first = xff.split(",")[0]?.trim();
  if (first) return first;
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";
}

serve(async (req) => {
  const corsHeadersWithFp = { ...corsHeaders, "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-anon-fingerprint" };
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeadersWithFp });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // --- Auth / Guest gating ---
  // Signed-in users: full access. Anonymous visitors get ONE free chat per
  // (ip + browser fingerprint), recorded in public.anonymous_chat_usage.
  const authHeader = req.headers.get("Authorization") ?? "";
  const anonFingerprint = (req.headers.get("x-anon-fingerprint") || "").trim();
  let authedUserId: string | null = null;
  let isGuest = false;

  const supabaseUrlEarly = Deno.env.get("SUPABASE_URL");
  const anonKeyEarly = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleEarly = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrlEarly || !anonKeyEarly || !serviceRoleEarly) {
    return json({ error: "Server misconfigured" }, 500);
  }

  // The publishable/anon JWT is sent on every browser request — treat it as guest.
  const tokenPart = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";
  const looksLikePublishable = tokenPart && tokenPart === anonKeyEarly;
  if (tokenPart && !looksLikePublishable) {
    try {
      const authClient = createClient(supabaseUrlEarly, anonKeyEarly, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: userData } = await authClient.auth.getUser();
      if (userData?.user?.id) authedUserId = userData.user.id;
    } catch {
      authedUserId = null;
    }
  }

  if (!authedUserId) {
    if (!anonFingerprint || anonFingerprint.length < 16 || anonFingerprint.length > 200) {
      return json({ error: "Sign in to continue", code: "auth_required" }, 401);
    }
    const ip = extractClientIp(req);
    const salt = Deno.env.get("GUEST_USAGE_SALT") || "megsy-guest-v1";
    const ipHash = await sha256Hex(`${salt}::ip::${ip}`);
    const fpHash = await sha256Hex(`${salt}::fp::${anonFingerprint}`);

    const admin = createClient(supabaseUrlEarly, serviceRoleEarly, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: existing, error: lookupErr } = await admin
      .from("anonymous_chat_usage")
      .select("id")
      .eq("ip_hash", ipHash)
      .eq("fingerprint_hash", fpHash)
      .maybeSingle();

    if (lookupErr) {
      console.error("[chat-alibaba] guest lookup failed", lookupErr.message);
      return json({ error: "Server error" }, 500);
    }
    if (existing) {
      return json({
        error: "You've used your free message. Create a free account to keep chatting.",
        code: "guest_quota_exceeded",
      }, 403);
    }

    const { error: insertErr } = await admin
      .from("anonymous_chat_usage")
      .insert({
        ip_hash: ipHash,
        fingerprint_hash: fpHash,
        user_agent: (req.headers.get("user-agent") || "").slice(0, 500),
      });
    if (insertErr) {
      const msg = String(insertErr.message || "").toLowerCase();
      if (msg.includes("duplicate") || msg.includes("unique")) {
        return json({
          error: "You've used your free message. Create a free account to keep chatting.",
          code: "guest_quota_exceeded",
        }, 403);
      }
      console.error("[chat-alibaba] guest insert failed", insertErr.message);
      return json({ error: "Server error" }, 500);
    }
    isGuest = true;
  }


  const body = await req.json().catch(() => null);

  // Guests can only do a basic chat — no voice transcription, no deep research, no tools.
  if (isGuest) {
    if (body?.action === "transcribe") {
      return json({ error: "Sign in to use voice transcription", code: "auth_required" }, 403);
    }
    if (body?.deepResearch === true) {
      return json({ error: "Sign in to use Deep Research", code: "auth_required" }, 403);
    }
  }

  // --- Action: transcribe (Qwen ASR) ---
  if (body && body.action === "transcribe") {
    const apiKey = await getDashscopeKey();
    if (!apiKey) return json({ error: "Alibaba/DashScope key is not configured" }, 503);
    const audio: string = body.audio || "";
    if (!audio) return json({ error: "Missing 'audio' (base64)" }, 400);
    const mime = String(body.mimeType || "").toLowerCase();
    let format = "wav";
    if (mime.includes("mp3") || mime.includes("mpeg")) format = "mp3";
    else if (mime.includes("mp4") || mime.includes("m4a") || mime.includes("aac")) format = "mp3";
    else if (mime.includes("ogg") || mime.includes("opus")) format = "ogg";
    else if (mime.includes("webm")) format = "webm";
    else if (mime.includes("wav")) format = "wav";
    const b64 = audio.includes(",") ? audio.split(",", 2)[1] : audio;
    const asrBody = {
      model: "qwen3-asr-flash",
      messages: [
        {
          role: "user",
          content: [
            { type: "input_audio", input_audio: { data: `data:audio/${format};base64,${b64}`, format } },
            { type: "text", text: body.language ? `Transcribe in ${body.language}.` : "Transcribe the audio verbatim. Output ONLY the transcript, no commentary." },
          ],
        },
      ],
    };
    const r = await fetch(DASHSCOPE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(asrBody),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error("[chat-alibaba/transcribe] upstream", r.status, JSON.stringify(data).slice(0, 400));
      return json({ error: data?.error?.message || "Transcription failed", details: data }, r.status);
    }
    const content = data?.choices?.[0]?.message?.content;
    let text = "";
    if (typeof content === "string") text = content;
    else if (Array.isArray(content)) text = content.map((p: any) => p?.text || "").join("");
    return json({ text: text.trim() });
  }

  const messages = Array.isArray(body?.messages) ? normalizeMessages(body.messages) : [];
  if (messages.length === 0) return json({ error: "messages are required" }, 400);

  const apiKey = await getDashscopeKey();
  if (!apiKey) return json({ error: "Alibaba/DashScope key is not configured" }, 503);

  const deepResearch = body?.deepResearch === true;

  const basePrompt = [
    "You are Megsy, an AI assistant by Megsy AI.",
    "Be helpful, accurate, and concise. Answer naturally without canned scripts.",
    "If a request cannot be answered, explain the concrete reason briefly.",
    "",
    "LANGUAGE & DIALECT MIRRORING (HIGHEST PRIORITY):",
    "- Reply in the EXACT same language AND dialect as the user's LAST message. Never switch languages on your own.",
    "- Keep the whole reply in one language — do not mix languages or scripts unless the user did.",
    "- Arabic dialects MUST be mirrored faithfully: Egyptian (مصري), Gulf (خليجي), Levantine (شامي), Maghrebi (مغربي/دارجة), Iraqi (عراقي), Sudanese (سوداني), and Modern Standard Arabic (فصحى). Never default to فصحى when the user wrote in a dialect.",
    "- Match the user's tone and register (formal vs casual) as well as their language.",
    "- Technical terms, code, and proper product names may stay in their original language (usually English).",
  ].join("\n");


  const researchPrompt = [
    "You are Megsy Deep Research, a meticulous senior research analyst.",
    "Produce a COMPREHENSIVE, in-depth research report — never a short summary.",
    "",
    "STRUCTURE (Markdown):",
    "- Start with a clear H1 title.",
    "- Write an introductory overview paragraph.",
    "- Use multiple H2/H3 sections covering background, key facts, analysis, different perspectives, timeline, impact, and notable details.",
    "- Use bullet lists and tables where they add clarity.",
    "- Be thorough and specific: include concrete dates, names, numbers, and facts. Avoid generic filler.",
    "- Add inline numeric citations like [1], [2] when you rely on web results.",
    "- End with a '## Sources' / '## المصادر' section listing the sources you used (title + link).",
    "",
    "LANGUAGE & DIALECT MIRRORING (HIGHEST PRIORITY):",
    "- Detect the EXACT language AND dialect of the user's topic and write the ENTIRE report in that same language and dialect.",
    "- Arabic dialects MUST be mirrored (Egyptian مصري, Gulf خليجي, Levantine شامي, Maghrebi مغربي, MSA فصحى). Never default to MSA if the user wrote in a dialect.",
    "- Aim for a long, detailed report (well beyond a few paragraphs).",
  ].join("\n");

  const systemPrompt = deepResearch ? researchPrompt : basePrompt;

  const chosenModel = deepResearch ? "qwen-max" : pickQwenModel(body?.model, body?.tier, messages);
  const searchEnabled = body?.searchEnabled === true || deepResearch;

  if (deepResearch) {
    // All-Alibaba mode: research is authored entirely by Qwen (qwen-max with
    // native web search). We intentionally do NOT use OpenRouter models here.
    return streamExtendedResearch(apiKey, null, messages, researchPrompt, req.signal);

  }

  // ===== Pipedream tools integration =====
  // Look up the user's connected apps and per-app enable/disable toggles, then
  // expose those apps as function tools to the LLM. Runs a tool-call loop
  // (non-streaming upstream) and emits results as SSE to the client.
  // authHeader already validated at the top of the request handler.

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  let toolsLoopAllowed = body?.useTools !== false; // opt-out flag
  let tools: any[] = [];
  let toolDefByName = new Map<string, ToolDef>();
  let userId: string | null = null;
  let connectedAccounts: Array<{ app_slug: string; account_id: string; external_user_id: string | null }> = [];

  if (toolsLoopAllowed && authHeader && supabaseUrl && anonKey && serviceRole) {
    try {
      const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
      const { data: u } = await userClient.auth.getUser();
      userId = u?.user?.id ?? null;
      if (userId) {
        const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
        const [{ data: accs }, { data: toggles }] = await Promise.all([
          admin.from("pipedream_accounts").select("app_slug, account_id, external_user_id, healthy").eq("user_id", userId),
          admin.from("pipedream_tool_settings").select("app_slug, enabled").eq("user_id", userId),
        ]);
        connectedAccounts = (accs ?? []).filter((a: any) => a.healthy !== false);
        const connectedSlugs = new Set(connectedAccounts.map((a) => a.app_slug));
        const disabledSlugs = new Set<string>(
          (toggles ?? []).filter((t: any) => t.enabled === false).map((t: any) => t.app_slug),
        );
        const built = buildToolsForApps(connectedSlugs, disabledSlugs);
        tools = built.tools;
        toolDefByName = built.defByName;
      }
    } catch (e) {
      console.warn("[chat-alibaba] tool discovery failed", e);
    }
  }

  if (tools.length > 0 && userId) {
    return runWithTools({
      apiKey,
      model: chosenModel,
      systemPrompt,
      messages,
      tools,
      toolDefByName,
      connectedAccounts,
      userId,
      signal: req.signal,
    });
  }



  const upstreamBody: Record<string, unknown> = {
    model: chosenModel,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    stream: true,
    temperature: deepResearch ? 0.4 : 0.6,
    max_tokens: deepResearch ? 8192 : 2048,
    // Built-in Alibaba web search (no extra infra; supported by qwen-plus/max/turbo).
    enable_search: searchEnabled,
    ...(searchEnabled
      ? {
          search_options: {
            // Force the model to actually run a web search and use the latest
            // results — without this Qwen often skips search and answers from
            // memory, producing the shallow reports we saw in deep research.
            forced_search: true,
            enable_source: true,
            search_strategy: deepResearch ? "pro" : "standard",
          },
        }
      : {}),
  };

  const upstream = await fetch(DASHSCOPE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(upstreamBody),
  }).catch((error) => {
    console.error("[chat-alibaba] fetch failed", error);
    return null;
  });

  if (!upstream) return json({ error: "Alibaba/DashScope request failed" }, 502);
  if (!upstream.ok || !upstream.body) {
    const errorText = await upstream.text().catch(() => "");
    console.error("[chat-alibaba] upstream error", upstream.status, errorText.slice(0, 500));
    return json({ error: `Alibaba/DashScope error ${upstream.status}: ${errorText.slice(0, 500)}` }, upstream.status === 429 ? 429 : 502);
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
});