// Deep Research background-job worker — plan-approval + multi-agent edition.
// Actions: start (legacy auto), plan, approve, update_plan, cancel.
//
// Flow:
//   plan       -> creates job, runs planner agent, sets awaiting_approval=true
//   update_plan-> regenerates plan from user feedback, still awaiting_approval
//   approve    -> runs the search + extract + multi-agent synthesis pipeline
//   start      -> legacy single-shot (used as fallback)
//
// Multi-agent synthesis: planner → image-decider → analyst → critic
// All agent outputs are AI-generated (intro/ready texts, plan goal, thinking).

import { createClient } from "npm:@supabase/supabase-js@2";
import { getLLM, ROUTER_MODELS } from "../_shared/llm-router.ts";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

// @ts-ignore Deno global in edge runtime
declare const EdgeRuntime: { waitUntil: (p: Promise<unknown>) => void };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERPER_API_KEY = Deno.env.get("SERPER_API_KEY");
const HB_API_KEY = Deno.env.get("HYPERBROWSER_API_KEY");
const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type JobPatch = Record<string, unknown>;

async function patchJob(jobId: string, patch: JobPatch) {
  await admin.from("research_jobs").update(patch).eq("id", jobId);
}

async function appendStep(jobId: string, step: Record<string, unknown>) {
  const { data } = await admin
    .from("research_jobs")
    .select("steps")
    .eq("id", jobId)
    .maybeSingle();
  const steps = Array.isArray((data as any)?.steps) ? (data as any).steps : [];
  steps.push({ at: new Date().toISOString(), ...step });
  await admin.from("research_jobs").update({ steps }).eq("id", jobId);
}

// ---- LLM helpers ----
async function llmJSON<T = unknown>(systemPrompt: string, userPrompt: string): Promise<T | null> {
  const router = await getLLM();
  if (!router) return null;
  try {
    const res = await fetch(router.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${router.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: router.mapModel(ROUTER_MODELS.deepResearch),
        messages: [
          { role: "system", content: systemPrompt + "\n\nRespond ONLY with valid JSON. No markdown, no code fences." },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
        response_format: { type: "json_object" },
      }),
    });
    const json = await res.json();
    const text: string = json?.choices?.[0]?.message?.content || "";
    const cleaned = text.replace(/^```json\s*|\s*```$/g, "").trim();
    return JSON.parse(cleaned) as T;
  } catch (e) {
    console.warn("[llmJSON] parse failed", e);
    return null;
  }
}

async function llmText(systemPrompt: string, userPrompt: string, temperature = 0.4): Promise<string> {
  const router = await getLLM();
  if (!router) return "";
  try {
    const res = await fetch(router.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${router.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: router.mapModel(ROUTER_MODELS.deepResearch),
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature,
        max_tokens: 8000,
      }),
    });
    const json = await res.json();
    return json?.choices?.[0]?.message?.content || "";
  } catch {
    return "";
  }
}

// ---- Planner agent: produces goal + 4-6 step plan + intro/ready text ----
type PlanShape = {
  goal: string;
  steps: string[];
  intro: string;
  ready: string;
  needs_images: boolean;
};

async function planAgent(
  query: string,
  language: string | null,
  feedback?: string,
  previousPlan?: PlanShape,
): Promise<PlanShape> {
  const sys = `You are a senior research planner. Given the user's research topic, produce a focused research plan.
LANGUAGE: detect the user's exact language and dialect (Arabic dialects must be preserved: Egyptian مصري, Khaleeji, Levantine, Maghrebi, MSA). Write EVERY field in that same language and dialect. Never default to MSA when user wrote in dialect. Language hint: ${language || "auto-detect"}.

Output JSON with these fields:
{
  "goal": "1-2 sentence headline describing the research objective (user's language)",
  "steps": ["4-6 concrete research steps as imperative phrases (user's language)"],
  "intro": "1 short sentence the assistant says BEFORE the plan card, like 'Let me draft a research plan for you' but in YOUR OWN WORDS and in the user's language. Must feel natural, not templated.",
  "ready": "1 short sentence the assistant says AFTER drafting, like 'Here is the plan — review or edit it' in YOUR OWN WORDS and in user's language.",
  "needs_images": true if the topic benefits from visual references (people, places, products, art, design, history); false for pure abstract/code/financial topics
}

Make every sentence sound human, varied, and tailored to THIS specific topic — never reuse generic phrasing.`;

  const usr = feedback && previousPlan
    ? `Original topic: ${query}\n\nPrevious plan:\n${JSON.stringify(previousPlan, null, 2)}\n\nUser's latest edit/request:\n"""${feedback}"""\n\nRegenerate the plan using the user's latest edit as the authoritative instruction. If the latest edit changes the topic completely, discard the old topic and make the new plan about the latest edit only. If it is a small adjustment, apply it to the old topic. The returned goal and steps must match the latest edit.`
    : `Research topic: ${query}\n\nDraft the plan now.`;

  const parsed = await llmJSON<PlanShape>(sys, usr);
  if (parsed && Array.isArray(parsed.steps) && parsed.steps.length > 0) {
    return {
      goal: String(parsed.goal || query).slice(0, 400),
      steps: parsed.steps.slice(0, 8).map(String),
      intro: String(parsed.intro || "").slice(0, 300),
      ready: String(parsed.ready || "").slice(0, 300),
      needs_images: parsed.needs_images !== false,
    };
  }
  // Fallback
  return {
    goal: query,
    steps: [query],
    intro: "",
    ready: "",
    needs_images: true,
  };
}

// ---- Serper search ----
type Source = { title: string; url: string; snippet?: string; query?: string };

function stripHtml(value: string): string {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function wikipediaSearch(q: string): Promise<{ organic: Source[]; images: string[] }> {
  const lang = /[\u0600-\u06FF\u0750-\u077F]/.test(q) ? "ar" : "en";
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=8&format=json`;
    const res = await fetch(url, { headers: { "User-Agent": "MegsyResearch/1.0" } });
    const json = await res.json();
    const organic: Source[] = (json?.query?.search || []).slice(0, 8).map((item: any) => {
      const title = String(item?.title || q);
      return {
        title,
        url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
        snippet: stripHtml(String(item?.snippet || "")),
        query: q,
      };
    });
    return { organic, images: [] };
  } catch {
    return { organic: [], images: [] };
  }
}

async function serperSearch(q: string, includeImages: boolean): Promise<{ organic: Source[]; images: string[] }> {
  if (!SERPER_API_KEY) return wikipediaSearch(q);
  try {
    const promises: Promise<any>[] = [
      fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: { "X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ q, num: 10 }),
      }).then((r) => r.json()),
    ];
    if (includeImages) {
      promises.push(
        fetch("https://google.serper.dev/images", {
          method: "POST",
          headers: { "X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ q, num: 6 }),
        }).then((r) => r.json()).catch(() => ({}))
      );
    }
    const [web, img] = await Promise.all(promises);
    const organic: Source[] = (web?.organic || []).slice(0, 8).map((o: any) => ({
      title: o.title, url: o.link, snippet: o.snippet, query: q,
    }));
    const images: string[] = includeImages
      ? (img?.images || []).slice(0, 6).map((i: any) => i.imageUrl).filter(Boolean)
      : [];
    if (organic.length === 0) return wikipediaSearch(q);
    return { organic, images };
  } catch {
    return wikipediaSearch(q);
  }
}

// ---- Page extraction ----
async function extractPage(url: string): Promise<string> {
  if (FIRECRAWL_API_KEY) {
    try {
      const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
      });
      const json = await res.json();
      return (json?.data?.markdown || "").slice(0, 8000);
    } catch { /* fall through */ }
  }
  if (HB_API_KEY) {
    try {
      const res = await fetch("https://app.hyperbrowser.ai/api/scrape", {
        method: "POST",
        headers: { "x-api-key": HB_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ url, outputFormat: ["markdown"], onlyMainContent: true }),
      });
      const json = await res.json();
      return (json?.data?.markdown || json?.markdown || "").slice(0, 8000);
    } catch { /* ignore */ }
  }
  try {
    const res = await fetch(url, { headers: { "User-Agent": "MegsyResearch/1.0" } });
    const html = await res.text();
    return stripHtml(html).slice(0, 8000);
  } catch {
    return "";
  }
}

// ---- Analyst agent: writes the report ----
async function analystAgent(
  query: string,
  language: string | null,
  sources: Source[],
  excerpts: { url: string; text: string }[],
): Promise<string> {
  const context = excerpts
    .filter((e) => e.text)
    .map((e, i) => `### Source ${i + 1}: ${e.url}\n${e.text}`)
    .join("\n\n---\n\n")
    .slice(0, 120_000);
  const sourceList = sources.map((s, i) => `[${i + 1}] ${s.title} — ${s.url}`).join("\n");

  // Phase 1: build a long outline (10-16 H2 sections, each with sub-bullets).
  type Outline = { sections: { heading: string; bullets: string[] }[] };
  const outline = await llmJSON<Outline>(
    `You are the lead editor of a long-form research report. Produce an EXHAUSTIVE outline.
Return JSON: { "sections": [{ "heading": "...", "bullets": ["...","..."] }, ...] }.
Requirements:
- 10 to 16 H2 sections covering background, key concepts, deep technical/strategic angles, comparisons, case studies, data/numbers, controversies, future outlook, practical takeaways.
- Each section has 4-7 specific bullets describing exactly what to cover.
- Avoid generic headings. Tailor every heading to the topic.
- Match the user's exact language AND dialect. Language hint: ${language || "auto-detect"}.`,
    `Topic: ${query}\n\nSource list:\n${sourceList}\n\nContext (truncated):\n${context.slice(0, 40_000)}`,
  );
  const sectionPlan = (outline?.sections || []).slice(0, 16).filter((s) => s?.heading);
  if (sectionPlan.length === 0) {
    return await llmText(
      `You are a meticulous research analyst. Write a VERY LONG, deeply detailed research report in Markdown (target 6000+ words).
- 10-14 H2 sections with sub-headings (###), bullet lists, and at least 2 real markdown tables.
- Inline numeric citations like [1], [2] mapping to the source list. Do NOT add a Sources section at the end.
- LANGUAGE: mirror the user's exact language AND dialect. Language hint: ${language || "auto-detect"}.
- Be specific and deep. No filler. No fabricated numbers.`,
      `Topic: ${query}\n\nSource list:\n${sourceList}\n\nExtracted context:\n${context}`,
      0.35,
    );
  }

  // Phase 2: write each section as a long, standalone deep-dive.
  const parts: string[] = [];
  for (let i = 0; i < sectionPlan.length; i++) {
    const sec = sectionPlan[i];
    const prior = parts.slice(-2).join("\n\n").slice(0, 4000);
    const body = await llmText(
      `You are writing ONE section of a very long-form research report.
Write 700-1100 words of dense, specific Markdown for the section heading provided.
Rules:
- Start the section with: ## ${sec.heading}
- Use ### sub-headings, tight bullets, and a markdown table if it helps comparison/numbers.
- Inline numeric citations like [1], [2] mapping to the provided source list (only cite when the fact comes from the context).
- Do NOT repeat content already written in prior sections.
- Do NOT write an intro/outro for the whole report — just the section.
- Do NOT write a Sources section. Do NOT invent numbers.
- Match the user's exact language and dialect. Language hint: ${language || "auto-detect"}.`,
      `Overall topic: ${query}\nSection ${i + 1} of ${sectionPlan.length}: ${sec.heading}\nKey points to cover:\n- ${sec.bullets.join("\n- ")}\n\nSource list:\n${sourceList}\n\nExtracted context:\n${context}\n\nRecently written (avoid repeating):\n${prior}`,
      0.35,
    );
    if (body && body.trim()) parts.push(body.trim());
  }
  return parts.join("\n\n");
}

// ---- Critic agent: writes the AI's internal thinking summary ----
async function criticAgent(
  query: string,
  language: string | null,
  report: string,
  usedCount: number,
  unusedCount: number,
): Promise<string> {
  return await llmText(
    `You are the AI's reflective critic. In 3-5 short paragraphs, write the assistant's INTERNAL THINKING about how it produced the report — what tradeoffs were made, which angles were prioritized, what was uncertain, why some sources were excluded. First-person voice. Match the user's exact language and dialect. Language hint: ${language || "auto-detect"}. Plain markdown, no headings.`,
    `Topic: ${query}\nUsed ${usedCount} sources, ignored ${unusedCount}.\n\nReport draft (truncated):\n${report.slice(0, 6000)}`,
    0.6,
  );
}

// ---- Pipeline (after approval) ----
async function runFullPipeline(jobId: string) {
  const startedAt = Date.now();
  try {
    const { data: job } = await admin.from("research_jobs").select("*").eq("id", jobId).maybeSingle();
    if (!job) return;
    const query: string = job.plan_goal || job.query;
    const language: string | null = job.language;
    const plan: string[] = Array.isArray(job.plan) ? job.plan : [];
    const needsImages: boolean = job.needs_images !== false;

    await patchJob(jobId, {
      status: "searching",
      awaiting_approval: false,
      progress: 15,
      stage: language === "ar" ? "جارٍ البحث في المصادر" : "Searching sources",
      started_at: new Date(startedAt).toISOString(),
    });

    const allSources: Source[] = [];
    const allImages: string[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < plan.length; i++) {
      const q = plan[i];
      const { organic, images } = await serperSearch(q, needsImages);
      for (const s of organic) {
        if (s.url && !seen.has(s.url)) { seen.add(s.url); allSources.push(s); }
      }
      for (const im of images) if (!allImages.includes(im)) allImages.push(im);

      await patchJob(jobId, {
        sources: allSources, images: allImages,
        progress: 15 + Math.round(((i + 1) / plan.length) * 35),
        stage: `${i + 1}/${plan.length}: ${q.slice(0, 60)}`,
      });
      await appendStep(jobId, { type: "search", query: q, results: organic.length });
    }

    // Extract top pages
    const TOP = Math.min(8, allSources.length);
    await patchJob(jobId, { stage: `Extracting ${TOP} pages` });
    const excerpts: { url: string; text: string }[] = [];
    const top = allSources.slice(0, TOP);
    const batchSize = 3;
    for (let i = 0; i < top.length; i += batchSize) {
      const batch = top.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(async (s) => ({ url: s.url, text: await extractPage(s.url) })));
      excerpts.push(...results);
      await patchJob(jobId, {
        progress: 50 + Math.round(((i + batch.length) / top.length) * 25),
        stage: `Extracted ${Math.min(i + batch.length, top.length)}/${top.length} pages`,
      });
    }

    // Mark unused sources (those without extracted text)
    const usedUrls = new Set(excerpts.filter((e) => e.text).map((e) => e.url));
    const unused = allSources.filter((s) => !usedUrls.has(s.url));

    await patchJob(jobId, { status: "synthesizing", progress: 80, stage: "Writing report" });

    const report = await analystAgent(query, language, allSources, excerpts);

    await patchJob(jobId, { progress: 92, stage: "Reflecting" });
    const thinking = await criticAgent(query, language, report, excerpts.filter((e) => e.text).length, unused.length);

    const finishedAt = Date.now();
    await patchJob(jobId, {
      status: "succeeded",
      progress: 100,
      stage: "Done",
      report,
      thinking,
      unused_sources: unused,
      finished_at: new Date(finishedAt).toISOString(),
      duration_ms: finishedAt - startedAt,
    });
    await appendStep(jobId, { type: "done", length: report.length });
  } catch (e) {
    const finishedAt = Date.now();
    await patchJob(jobId, {
      status: "failed",
      stage: "Failed",
      error: (e as Error)?.message || String(e),
      finished_at: new Date(finishedAt).toISOString(),
      duration_ms: finishedAt - startedAt,
    });
  }
}

// ---- Plan-only step ----
async function runPlanOnly(jobId: string, query: string, language: string | null, feedback?: string, previousPlan?: PlanShape) {
  try {
    await patchJob(jobId, { status: "planning", progress: 5, stage: "Drafting plan" });
    const plan = await planAgent(query, language, feedback, previousPlan);
    await patchJob(jobId, {
      status: "awaiting_approval",
      awaiting_approval: true,
      progress: 12,
      stage: "Awaiting approval",
      plan: plan.steps,
      plan_goal: plan.goal,
      plan_intro: plan.intro,
      plan_ready: plan.ready,
      needs_images: plan.needs_images,
    });
    await appendStep(jobId, { type: "plan", queries: plan.steps, goal: plan.goal });
  } catch (e) {
    await patchJob(jobId, { status: "failed", error: (e as Error).message });
  }
}

function wait(p: Promise<unknown>) {
  try { EdgeRuntime.waitUntil(p); } catch { void p; }
}

// ---- HTTP ----
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "auth_required" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: "invalid_token" }, 401);

    const body = await req.json().catch(() => ({}));
    const action = body?.action || "start";

    if (action === "cancel" && body?.jobId) {
      await admin.from("research_jobs")
        .update({ status: "cancelled", stage: "Cancelled", finished_at: new Date().toISOString() })
        .eq("id", body.jobId).eq("user_id", user.id);
      return json({ success: true });
    }

    // approve: continue an awaiting_approval job (optionally with edited plan)
    if (action === "approve" && body?.jobId) {
      const { data: job } = await admin.from("research_jobs").select("*").eq("id", body.jobId).eq("user_id", user.id).maybeSingle();
      if (!job) return json({ error: "not_found" }, 404);
      if (Array.isArray(body?.editedSteps) && body.editedSteps.length) {
        await patchJob(body.jobId, { plan: body.editedSteps.slice(0, 8).map(String) });
      }
      wait(runFullPipeline(body.jobId));
      return json({ success: true, jobId: body.jobId });
    }

    // update_plan: regenerate plan with user feedback
    if (action === "update_plan" && body?.jobId && body?.feedback) {
      const { data: job } = await admin.from("research_jobs").select("*").eq("id", body.jobId).eq("user_id", user.id).maybeSingle();
      if (!job) return json({ error: "not_found" }, 404);
      const previousPlan: PlanShape = {
        goal: job.plan_goal || job.query,
        steps: Array.isArray(job.plan) ? job.plan : [],
        intro: job.plan_intro || "",
        ready: job.plan_ready || "",
        needs_images: job.needs_images !== false,
      };
      wait(runPlanOnly(body.jobId, job.query, job.language, String(body.feedback), previousPlan));
      return json({ success: true, jobId: body.jobId });
    }

    // start / plan: create job
    const query: string = (body?.query || "").toString().trim();
    if (!query) return json({ error: "query_required" }, 400);

    const language: string | null = body?.language || null;
    const conversationId: string | null = body?.conversationId || null;
    const planOnly = action === "plan"; // if true, stop after planning

    const { data: inserted, error: insErr } = await admin.from("research_jobs").insert({
      user_id: user.id, conversation_id: conversationId, query, language,
      status: "queued", progress: 0, stage: "Queued",
    }).select("id").single();

    if (insErr || !inserted) return json({ error: insErr?.message || "insert_failed" }, 500);

    if (planOnly) {
      wait(runPlanOnly(inserted.id, query, language));
    } else {
      // Legacy: plan then auto-run full pipeline
      wait((async () => {
        await runPlanOnly(inserted.id, query, language);
        // immediately approve
        await patchJob(inserted.id, { awaiting_approval: false });
        await runFullPipeline(inserted.id);
      })());
    }

    return json({ jobId: inserted.id });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
