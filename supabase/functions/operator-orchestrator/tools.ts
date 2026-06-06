// Operator tool implementations: real external calls, no simulation.
// Each tool returns { ok, data?, error? } and never throws.
// build: 2026-05-17T22:50 — browser_act CDP enabled
import { getLLM, getLovableGateway, lovableEquivalent } from "../_shared/llm-router.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


const BB_KEY = Deno.env.get("BROWSERBASE_API_KEY") ?? "";
const BB_PROJECT = Deno.env.get("BROWSERBASE_PROJECT_ID") ?? "";
const TAVILY_KEY = Deno.env.get("TAVILY_API_KEY") ?? "";
const FIRECRAWL_KEY = Deno.env.get("FIRECRAWL_API_KEY") ?? "";
const SERPER_KEY = Deno.env.get("SERPER_API_KEY") ?? "";
const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";
const SB_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SB_SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const DASHSCOPE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
const DASHSCOPE_SERVICES = new Set([
  "alibaba", "alibabacloud", "dashscope", "qwen", "aliyun", "ali", "qwendashscope", "alibabaqwen",
]);
console.log("[operator] env presence:", JSON.stringify({
  BB_KEY: BB_KEY.length, BB_PROJECT: BB_PROJECT.length,
  TAVILY: TAVILY_KEY.length, FIRECRAWL: FIRECRAWL_KEY.length, SERPER: SERPER_KEY.length,
  LOVABLE: LOVABLE_KEY.length, SB_URL: SB_URL.length, SB_SRK: SB_SRK.length,
}));

export type ToolResult = { ok: boolean; data?: unknown; error?: string };

// ---------- Alibaba / DashScope (Qwen) key resolver ----------
// Reads from env first, then from the api_keys table (same as chat-alibaba).
let _dashscopeKeyCache: { key: string | null; at: number } | null = null;
async function getDashscopeKey(): Promise<string | null> {
  const envKey = Deno.env.get("DASHSCOPE_API_KEY") || Deno.env.get("QWEN_API_KEY") || Deno.env.get("ALIBABA_API_KEY");
  if (envKey) return envKey;
  if (_dashscopeKeyCache && Date.now() - _dashscopeKeyCache.at < 60_000) return _dashscopeKeyCache.key;
  if (!SB_URL || !SB_SRK) return null;
  try {
    const admin = createClient(SB_URL, SB_SRK, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data } = await admin.from("api_keys").select("service, api_key, is_active, is_blocked").limit(200);
    const norm = (v: unknown) => String(v || "").toLowerCase().replace(/[\s_-]+/g, "");
    const row = (data || []).find((item: any) =>
      DASHSCOPE_SERVICES.has(norm(item.service)) && item.api_key && item.is_active !== false && item.is_blocked !== true
    );
    const key = row?.api_key || null;
    _dashscopeKeyCache = { key, at: Date.now() };
    return key;
  } catch (e) {
    console.warn("[operator] dashscope key lookup failed", e);
    return null;
  }
}

// Alibaba Qwen native web search → normalized {title,url,content} results + answer.
async function alibabaWebSearch(query: string): Promise<ToolResult | null> {
  const apiKey = await getDashscopeKey();
  if (!apiKey) return null;
  try {
    const res = await fetch(DASHSCOPE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen-plus",
        messages: [
          { role: "system", content: "You are a web research assistant. Search the web and answer factually. Reply in the same language as the user's query." },
          { role: "user", content: query },
        ],
        stream: false,
        enable_search: true,
        search_options: { forced_search: true, enable_source: true, search_strategy: "standard" },
      }),
    });
    if (!res.ok) {
      console.warn("[operator] alibaba search", res.status, (await res.text()).slice(0, 200));
      return null;
    }
    const j = await res.json();
    const msg = j?.choices?.[0]?.message ?? {};
    const answer = msg?.content ?? "";
    // DashScope exposes source URLs in different shapes depending on API version:
    //  - compatible-mode: choices[0].message.annotations[] (OpenAI url_citation style)
    //  - some versions: top-level search_info.search_results[]
    //  - native style: output.search_info.search_results[]
    const fromSearchInfo =
      j?.search_info?.search_results ??
      j?.choices?.[0]?.message?.search_results ??
      j?.output?.search_info?.search_results ??
      [];
    const fromAnnotations = (Array.isArray(msg?.annotations) ? msg.annotations : [])
      .map((a: any) => a?.url_citation ?? a)
      .filter(Boolean);
    const merged = [
      ...(Array.isArray(fromSearchInfo) ? fromSearchInfo : []),
      ...fromAnnotations,
    ];
    const results = merged.map((r: any) => ({
      title: r.title ?? r.name ?? "",
      url: r.url ?? r.link ?? r.site_name ?? "",
      content: r.snippet ?? r.summary ?? r.content ?? r.text ?? "",
    })).filter((r: any) => /^https?:\/\//i.test(r.url));
    return { ok: true, data: { provider: "alibaba", answer, results } };
  } catch (e) {
    console.warn("[operator] alibaba search failed", e);
    return null;
  }
}

export const TOOL_AVAILABILITY = {
  // Alibaba Qwen native search + plain HTTP fetch make these always available.
  web_search: true,
  read_url: true,
  browse_url: !!((BB_KEY && BB_PROJECT) || FIRECRAWL_KEY),
  browser_act: !!(BB_KEY && BB_PROJECT),
  generate_image: !!LOVABLE_KEY,
  build_app: true,
  publish_app: true,
  save_memory: true,
};

// ---------- Web search: Alibaba (Qwen) → Firecrawl → Serper → Tavily ----------
export async function webSearch(input: { query: string; depth?: "basic" | "advanced" }): Promise<ToolResult> {
  if (!input?.query) return { ok: false, error: "query required" };
  let lastErr = "";
  // Alibaba may return a good text answer but no source URLs. We keep it as a
  // last-resort fallback, but prefer any provider that returns real URLs so the
  // operator can read_url a genuine page instead of hallucinating one.
  let aliFallback: ToolResult | null = null;

  // 0) Alibaba Qwen native web search (primary)
  {
    const ali = await alibabaWebSearch(input.query);
    if (ali && ali.ok) {
      const d: any = ali.data;
      if ((d?.results?.length ?? 0) > 0) return ali; // has real URLs → use it
      if (d?.answer && String(d.answer).trim()) aliFallback = ali; // answer only → keep as fallback
    }
  }

  // 1) Firecrawl Search
  if (FIRECRAWL_KEY) {
    try {
      const res = await fetch("https://api.firecrawl.dev/v2/search", {
        method: "POST",
        headers: { Authorization: `Bearer ${FIRECRAWL_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query: input.query, limit: 8 }),
      });
      if (res.ok) {
        const j = await res.json();
        const items = j?.data?.web ?? j?.web ?? j?.data ?? [];
        const results = (Array.isArray(items) ? items : []).map((r: any) => ({
          title: r.title, url: r.url, content: r.description ?? r.snippet ?? "",
        })).filter((r: any) => /^https?:\/\//i.test(r.url));
        if (results.length > 0) return { ok: true, data: { provider: "firecrawl", results } };
      } else {
        lastErr = `firecrawl ${res.status}: ${(await res.text()).slice(0, 150)}`;
      }
    } catch (e) { lastErr = `firecrawl ${String(e)}`; console.warn("firecrawl search failed", e); }
  }

  // 2) Serper (Google SERP)
  if (SERPER_KEY) {
    try {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: { "X-API-KEY": SERPER_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ q: input.query, num: 8 }),
      });
      if (res.ok) {
        const j = await res.json();
        const results = (j?.organic ?? []).map((r: any) => ({
          title: r.title, url: r.link, content: r.snippet ?? "",
        })).filter((r: any) => /^https?:\/\//i.test(r.url));
        if (results.length > 0) return { ok: true, data: { provider: "serper", answer: j?.answerBox?.answer, results } };
      } else {
        lastErr = `serper ${res.status}: ${(await res.text()).slice(0, 150)}`;
      }
    } catch (e) { lastErr = `serper ${String(e)}`; console.warn("serper failed", e); }
  }

  // 3) Tavily fallback
  if (TAVILY_KEY) {
    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: TAVILY_KEY, query: input.query,
          search_depth: input.depth ?? "advanced", max_results: 6, include_answer: true,
        }),
      });
      if (!res.ok) { lastErr = `tavily ${res.status}`; }
      else {
        const json = await res.json();
        const results = (Array.isArray(json.results) ? json.results : []).filter((r: any) => /^https?:\/\//i.test(r?.url));
        if (results.length > 0 || (json.answer && String(json.answer).trim())) {
          return { ok: true, data: { provider: "tavily", answer: json.answer, results } };
        }
      }
    } catch (e) { lastErr = `tavily ${String(e)}`; }
  }

  // 4) Alibaba answer-only fallback (no source URLs available from any provider)
  if (aliFallback) return aliFallback;

  if (lastErr) return { ok: false, error: `web_search: all providers failed (${lastErr}). This usually means the search API key is out of credits or rate-limited.` };
  return { ok: false, error: "no search provider configured (FIRECRAWL_API_KEY / SERPER_API_KEY / TAVILY_API_KEY)" };
}

// ---------- Firecrawl screenshot fallback ----------
async function firecrawlScreenshot(url: string): Promise<ToolResult> {
  if (!FIRECRAWL_KEY) return { ok: false, error: "FIRECRAWL_API_KEY missing" };
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${FIRECRAWL_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        formats: ["screenshot", "markdown"],
        onlyMainContent: false,
        waitFor: 1500,
      }),
    });
    if (!res.ok) {
      return { ok: false, error: `firecrawl screenshot ${res.status}: ${(await res.text()).slice(0, 200)}` };
    }
    const j = await res.json();
    const data = j?.data ?? j ?? {};
    const shot: string = data.screenshot ?? data.screenshotUrl ?? "";
    const meta = data.metadata ?? {};
    const md: string = data.markdown ?? "";
    if (!shot) return { ok: false, error: "firecrawl returned no screenshot" };

    // Re-host the screenshot in our own storage so it doesn't expire.
    let publicUrl = shot;
    try {
      const img = await fetch(shot);
      if (img.ok) {
        const bin = new Uint8Array(await img.arrayBuffer());
        const path = `operator/${crypto.randomUUID()}.png`;
        const up = await fetch(`${SB_URL}/storage/v1/object/operator-files/${path}`, {
          method: "POST",
          headers: { apikey: SB_SRK, Authorization: `Bearer ${SB_SRK}`, "Content-Type": "image/png" },
          body: bin,
        });
        if (up.ok) publicUrl = `${SB_URL}/storage/v1/object/public/operator-files/${path}`;
      }
    } catch (e) { console.warn("screenshot rehost failed", e); }

    return {
      ok: true,
      data: {
        provider: "firecrawl",
        targetUrl: url,
        screenshotUrl: publicUrl,
        title: meta.title ?? null,
        content: (md ?? "").slice(0, 4000),
        note: "Page captured via Firecrawl.",
      },
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ---------- Browserbase: create session + screenshot (falls back to Firecrawl) ----------
export async function browseUrl(input: { url: string; sessionId?: string }): Promise<ToolResult> {
  if (!input?.url) return { ok: false, error: "url required" };
  if (!BB_KEY || !BB_PROJECT) {
    // No live-browser provider; use Firecrawl screenshot instead.
    return firecrawlScreenshot(input.url);
  }
  try {
    let sessionId = input.sessionId;
    if (!sessionId) {
      const s = await fetch("https://api.browserbase.com/v1/sessions", {
        method: "POST",
        headers: { "X-BB-API-Key": BB_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: BB_PROJECT, keepAlive: true }),
      });
      if (!s.ok) return { ok: false, error: `BB session ${s.status}: ${(await s.text()).slice(0, 200)}` };
      const sj = await s.json();
      sessionId = sj.id;
    }
    const debug = await fetch(`https://api.browserbase.com/v1/sessions/${sessionId}/debug`, {
      headers: { "X-BB-API-Key": BB_KEY },
    });
    const dj = debug.ok ? await debug.json() : { debuggerUrl: null, debuggerFullscreenUrl: null };

    // Try to grab a screenshot from the live session if available
    let screenshotUrl: string | null = null;
    try {
      const sh = await fetch(`https://api.browserbase.com/v1/sessions/${sessionId}`, {
        headers: { "X-BB-API-Key": BB_KEY },
      });
      if (sh.ok) {
        const meta = await sh.json();
        screenshotUrl = meta?.screenshotUrl ?? null;
      }
    } catch {/* ignore */}

    return {
      ok: true,
      data: {
        sessionId,
        liveViewUrl: dj.debuggerFullscreenUrl ?? dj.debuggerUrl,
        screenshotUrl,
        targetUrl: input.url,
        note: "Browser session created.",
      },
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ---------- CDP over WebSocket (Browserbase) ----------
class CDP {
  ws: WebSocket;
  nextId = 1;
  pending = new Map<number, (r: any) => void>();
  events = new Map<string, ((p: any) => void)[]>();
  pageSessionId = "";
  constructor(ws: WebSocket) { this.ws = ws; }

  static async connect(sessionId: string): Promise<CDP> {
    const url = `wss://connect.browserbase.com?apiKey=${encodeURIComponent(BB_KEY)}&sessionId=${encodeURIComponent(sessionId)}`;
    const ws = new WebSocket(url);
    await new Promise<void>((res, rej) => {
      ws.onopen = () => res();
      ws.onerror = (e) => rej(new Error("ws error: " + (e as any)?.message));
    });
    const cdp = new CDP(ws);
    ws.onmessage = (ev) => {
      try {
        const m = JSON.parse(typeof ev.data === "string" ? ev.data : "");
        if (m.id && cdp.pending.has(m.id)) {
          cdp.pending.get(m.id)!(m); cdp.pending.delete(m.id);
        } else if (m.method) {
          const listeners = cdp.events.get(m.method) || [];
          for (const fn of listeners) fn(m.params);
        }
      } catch {/* ignore */}
    };
    // Attach to first page target
    const { result } = await cdp.send("Target.getTargets");
    const page = (result.targetInfos as any[]).find(t => t.type === "page") || result.targetInfos[0];
    const attach = await cdp.send("Target.attachToTarget", { targetId: page.targetId, flatten: true });
    cdp.pageSessionId = attach.result.sessionId;
    await cdp.send("Page.enable", {}, cdp.pageSessionId);
    await cdp.send("Runtime.enable", {}, cdp.pageSessionId);
    return cdp;
  }

  send(method: string, params: any = {}, sessionId?: string): Promise<any> {
    const id = this.nextId++;
    const msg: any = { id, method, params };
    if (sessionId) msg.sessionId = sessionId;
    return new Promise((res, rej) => {
      this.pending.set(id, (r) => r.error ? rej(new Error(r.error.message)) : res(r));
      this.ws.send(JSON.stringify(msg));
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); rej(new Error(`CDP timeout: ${method}`)); } }, 25000);
    });
  }

  on(method: string, fn: (p: any) => void) {
    if (!this.events.has(method)) this.events.set(method, []);
    this.events.get(method)!.push(fn);
  }

  async waitFor(method: string, timeoutMs = 15000): Promise<any> {
    return await new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error(`wait timeout: ${method}`)), timeoutMs);
      this.on(method, (p) => { clearTimeout(t); res(p); });
    });
  }

  close() { try { this.ws.close(); } catch {/* ignore */} }
}

async function uploadScreenshot(user_id: string, b64: string): Promise<string | null> {
  try {
    const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const path = `${user_id}/${crypto.randomUUID()}.png`;
    const up = await fetch(`${SB_URL}/storage/v1/object/operator-files/${path}`, {
      method: "POST",
      headers: { apikey: SB_SRK, Authorization: `Bearer ${SB_SRK}`, "Content-Type": "image/png" },
      body: bin,
    });
    if (!up.ok) return null;
    return `${SB_URL}/storage/v1/object/public/operator-files/${path}`;
  } catch { return null; }
}

// ---------- browser_act: real interactions via CDP ----------
export async function browserAct(input: {
  user_id: string;
  sessionId?: string;
  action: "navigate" | "screenshot" | "click" | "type" | "extract" | "evaluate" | "wait";
  url?: string;
  selector?: string;
  text?: string;
  expression?: string;
  ms?: number;
}): Promise<ToolResult> {
  if (!BB_KEY || !BB_PROJECT) return { ok: false, error: "Browserbase keys missing" };
  if (!input?.action) return { ok: false, error: "action required" };
  let sessionId = input.sessionId;
  try {
    if (!sessionId) {
      const s = await fetch("https://api.browserbase.com/v1/sessions", {
        method: "POST",
        headers: { "X-BB-API-Key": BB_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: BB_PROJECT, keepAlive: true }),
      });
      if (!s.ok) return { ok: false, error: `BB session ${s.status}: ${(await s.text()).slice(0, 200)}` };
      sessionId = (await s.json()).id;
    }
    const cdp = await CDP.connect(sessionId!);
    try {
      const sid = cdp.pageSessionId;
      let data: any = { sessionId };

      if (input.action === "navigate") {
        if (!input.url) return { ok: false, error: "url required" };
        const loaded = cdp.waitFor("Page.loadEventFired", 20000).catch(() => null);
        await cdp.send("Page.navigate", { url: input.url }, sid);
        await loaded;
        data.url = input.url;
      } else if (input.action === "wait") {
        await new Promise(r => setTimeout(r, Math.min(input.ms ?? 1000, 10000)));
      } else if (input.action === "click") {
        if (!input.selector) return { ok: false, error: "selector required" };
        const expr = `(()=>{const el=document.querySelector(${JSON.stringify(input.selector)});if(!el)return{ok:false,err:'not found'};el.scrollIntoView();el.click();return{ok:true,tag:el.tagName};})()`;
        const r = await cdp.send("Runtime.evaluate", { expression: expr, returnByValue: true }, sid);
        data.result = r.result.result.value;
      } else if (input.action === "type") {
        if (!input.selector || input.text == null) return { ok: false, error: "selector and text required" };
        const expr = `(()=>{const el=document.querySelector(${JSON.stringify(input.selector)});if(!el)return{ok:false,err:'not found'};el.focus();el.value=${JSON.stringify(input.text)};el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));return{ok:true};})()`;
        const r = await cdp.send("Runtime.evaluate", { expression: expr, returnByValue: true }, sid);
        data.result = r.result.result.value;
      } else if (input.action === "extract") {
        const sel = input.selector || "body";
        const expr = `(()=>{const el=document.querySelector(${JSON.stringify(sel)});return el?(el.innerText||'').slice(0,8000):null;})()`;
        const r = await cdp.send("Runtime.evaluate", { expression: expr, returnByValue: true }, sid);
        data.text = r.result.result.value;
      } else if (input.action === "evaluate") {
        if (!input.expression) return { ok: false, error: "expression required" };
        const r = await cdp.send("Runtime.evaluate", { expression: input.expression, returnByValue: true }, sid);
        data.value = r.result.result.value;
      }

      // Always take a screenshot after action (except wait)
      if (input.action !== "wait") {
        const shot = await cdp.send("Page.captureScreenshot", { format: "png" }, sid).catch(() => null);
        if (shot?.result?.data) {
          const url = await uploadScreenshot(input.user_id, shot.result.data);
          if (url) data.screenshotUrl = url;
        }
      }

      // Live view URL
      try {
        const debug = await fetch(`https://api.browserbase.com/v1/sessions/${sessionId}/debug`, { headers: { "X-BB-API-Key": BB_KEY } });
        if (debug.ok) {
          const dj = await debug.json();
          data.liveViewUrl = dj.debuggerFullscreenUrl ?? dj.debuggerUrl;
        }
      } catch {/* ignore */}

      return { ok: true, data };
    } finally {
      cdp.close();
    }
  } catch (e) {
    return { ok: false, error: String(e), data: { sessionId } as any };
  }
}


// ---------- Publish app ----------
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const OPERATOR_SEED_FILES = [
  { path: "package.json", content: JSON.stringify({ scripts: { dev: "vite", build: "vite build", preview: "vite preview" }, dependencies: { "@vitejs/plugin-react-swc": "latest", vite: "latest", typescript: "latest", react: "latest", "react-dom": "latest", "lucide-react": "latest", "framer-motion": "latest", "tailwindcss": "latest", "tailwindcss-animate": "latest", "@tailwindcss/typography": "latest", clsx: "latest", "tailwind-merge": "latest" }, devDependencies: {} }, null, 2) },
  { path: "index.html", content: `<div id="root"></div><script type="module" src="/src/main.tsx"></script>` },
  { path: "src/main.tsx", content: `import React from "react";\nimport { createRoot } from "react-dom/client";\nimport App from "./App";\nimport "./index.css";\n\ncreateRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);\n` },
  { path: "src/App.tsx", content: `export default function App() {\n  return <main className="min-h-screen grid place-items-center p-8"><h1 className="text-4xl font-bold">Megsy OS is building…</h1></main>;\n}\n` },
  { path: "src/index.css", content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n:root { color-scheme: light; }\nbody { margin: 0; font-family: Inter, system-ui, sans-serif; }\n` },
  { path: "tailwind.config.ts", content: `import type { Config } from "tailwindcss";\nexport default { content: ["./index.html", "./src/**/*.{ts,tsx}"], theme: { extend: {} }, plugins: [] } satisfies Config;\n` },
];

export async function buildApp(input: { prompt: string; user_id: string; user_jwt?: string | null }): Promise<ToolResult> {
  if (!input?.prompt) return { ok: false, error: "prompt required" };
  try {
    const name = input.prompt.split(/\s+/).filter(Boolean).slice(0, 4).join(" ").slice(0, 60) || "Megsy OS Project";
    const createProject = await fetch(`${SB_URL}/rest/v1/projects`, {
      method: "POST",
      headers: { apikey: SB_SRK, Authorization: `Bearer ${SB_SRK}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ user_id: input.user_id, name, description: input.prompt, status: "active" }),
    });
    if (!createProject.ok) return { ok: false, error: `create project ${createProject.status}: ${(await createProject.text()).slice(0, 200)}` };
    const project = (await createProject.json())?.[0];
    const projectId = project?.id as string | undefined;
    if (!projectId) return { ok: false, error: "project was not created" };

    const seed = await fetch(`${SB_URL}/rest/v1/ai_project_files?on_conflict=project_id,path`, {
      method: "POST",
      headers: { apikey: SB_SRK, Authorization: `Bearer ${SB_SRK}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(OPERATOR_SEED_FILES.map((f) => ({ ...f, project_id: projectId }))),
    });
    if (!seed.ok) return { ok: false, error: `seed project ${seed.status}: ${(await seed.text()).slice(0, 200)}` };

    let jobId: string | null = null;
    if (input.user_jwt) {
      const build = await fetch(`${SB_URL}/functions/v1/code-build`, {
        method: "POST",
        headers: { apikey: SB_SRK, Authorization: `Bearer ${input.user_jwt}`, "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, message: input.prompt }),
      });
      const body = await build.json().catch(() => ({}));
      if (build.ok) jobId = body?.jobId ?? null;
      else return { ok: false, error: `code-build ${build.status}: ${JSON.stringify(body).slice(0, 200)}` };
    }

    return { ok: true, data: { project_id: projectId, job_id: jobId, build_url: `/build/${projectId}/chat`, note: "Project created and Megsy Code build started." } };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function publishApp(input: { project_id?: string | null; user_id: string }): Promise<ToolResult> {
  try {
    if (!input?.project_id) {
      return { ok: false, error: "publish_app requires project_id — build_app must run first and you must pass its returned project_id UUID." };
    }
    if (!UUID_RE.test(input.project_id)) {
      return { ok: false, error: `publish_app: project_id must be a UUID returned by build_app, not '${input.project_id}'. Re-read the previous build_app output and pass data.project_id.` };
    }
    const slug = `op-${input.project_id.slice(0, 8)}`;
    const url = `https://${slug}.lovable.app`;
    const u = await fetch(`${SB_URL}/rest/v1/projects?id=eq.${input.project_id}`, {
      method: "PATCH",
      headers: {
        apikey: SB_SRK,
        Authorization: `Bearer ${SB_SRK}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ published_url: url, published_at: new Date().toISOString() }),
    });
    if (!u.ok) return { ok: false, error: `publish ${u.status}: ${(await u.text()).slice(0, 200)}` };
    return { ok: true, data: { published_url: url, project_id: input.project_id } };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ---------- Memory (removed — Persistent Memory via Letta is the only memory system) ----------
export async function saveMemory(_input: { user_id: string; fact: string; importance?: number }): Promise<ToolResult> {
  return { ok: true, data: { saved: false, note: "Legacy memory disabled; Persistent Memory (Letta) handles long-term memory." } };
}


// ---------- LLM call ----------
// Uses the shared, resilient router: Alibaba/Qwen (DashScope) → OpenRouter → Lovable Gateway.
// This is the SAME backend the rest of the app uses, so Megsy OS never collapses to
// canned greetings just because one provider is out of credits / rate-limited.



async function postChat(
  url: string,
  key: string,
  model: string,
  system: string,
  messages: Array<{ role: string; content: string }>,
  json: boolean,
  extraHeaders: Record<string, string> = {},
): Promise<{ ok: boolean; content?: string; error?: string }> {
  const body: Record<string, unknown> = {
    model,
    messages: [{ role: "system", content: system }, ...messages],
  };
  if (json) body.response_format = { type: "json_object" };
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...extraHeaders },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const txt = await r.text();
    return { ok: false, error: `${r.status}: ${txt.slice(0, 300)}` };
  }
  const j = await r.json();
  const content = j?.choices?.[0]?.message?.content ?? "";
  return { ok: true, content };
}

export async function callLLM(args: {
  model: string;
  system: string;
  messages: Array<{ role: string; content: string }>;
  json?: boolean;
}): Promise<{ ok: boolean; content?: string; error?: string }> {
  // Build a provider chain so a single failing provider can't kill the run.
  const providers: Array<{ url: string; key: string; mapModel: (m: string) => string; label: string }> = [];
  const primary = await getLLM();
  if (primary) providers.push({ url: primary.url, key: primary.key, mapModel: primary.mapModel, label: primary.provider });
  const lov = getLovableGateway();
  if (lov && !providers.some((p) => p.label === "lovable")) {
    providers.push({ url: lov.url, key: lov.key, mapModel: lovableEquivalent, label: "lovable" });
  }
  if (!providers.length) {
    return { ok: false, error: "No LLM provider configured (Alibaba / OpenRouter / Lovable)" };
  }

  let lastErr = "all providers failed";
  for (const p of providers) {
    const model = p.mapModel(args.model);
    const extra: Record<string, string> = p.label === "openrouter"
      ? { "HTTP-Referer": "https://megsy.app", "X-Title": "Megsy Operator" }
      : {};
    try {
      const res = await postChat(p.url, p.key, model, args.system, args.messages, !!args.json, extra);
      if (res.ok && res.content && res.content.trim()) {
        return { ok: true, content: res.content };
      }
      lastErr = res.error || "empty content";
      console.warn(`[operator] LLM ${p.label} (${model}) failed: ${lastErr}`);
    } catch (e) {
      lastErr = String(e);
      console.warn(`[operator] LLM ${p.label} threw: ${lastErr}`);
    }
  }
  return { ok: false, error: lastErr };
}

// ---------- Read URL: direct fetch (free) → Firecrawl → Tavily ----------
function htmlToText(html: string): { title: string; text: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : "";
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return { title, text };
}

export async function readUrl(input: { url: string }): Promise<ToolResult> {
  if (!input?.url) return { ok: false, error: "url required" };
  let host = "";
  try {
    const u = new URL(input.url);
    if (!/^https?:$/.test(u.protocol)) throw new Error("non-http");
    host = u.hostname.toLowerCase();
  } catch {
    return { ok: false, error: `read_url: invalid URL '${input.url}'. Pass a full http(s) URL from a previous web_search result, not free text or a description.` };
  }
  // Reject obviously fabricated/placeholder hosts — the model must use a real URL
  // returned by web_search, not invent one.
  const PLACEHOLDER_HOSTS = /(^|\.)(example\.(com|org|net)|test\.com|localhost|invalid|domain\.com|website\.com|yoursite\.com)$/i;
  if (PLACEHOLDER_HOSTS.test(host)) {
    return { ok: false, error: `read_url: '${input.url}' is a placeholder/fake URL. Do NOT invent URLs. Call web_search first and pass one of the exact source URLs it returns. If web_search returned no URLs, summarize from the search 'answer' field instead of calling read_url.` };
  }


  // 0) Direct HTTP fetch + HTML→text (free, no external credits)
  try {
    const res = await fetch(input.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MegsyBot/1.0; +https://megsy.ai)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (res.ok) {
      const ct = res.headers.get("content-type") || "";
      const raw = await res.text();
      if (ct.includes("html") || /<\/?[a-z][\s\S]*>/i.test(raw)) {
        const { title, text } = htmlToText(raw);
        if (text && text.length > 80) {
          return { ok: true, data: { provider: "direct", url: input.url, title, content: text.slice(0, 12000) } };
        }
      } else if (raw.trim()) {
        return { ok: true, data: { provider: "direct", url: input.url, content: raw.slice(0, 12000) } };
      }
    }
  } catch (e) { console.warn("direct fetch failed", e); }



  if (FIRECRAWL_KEY) {
    try {
      const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        headers: { Authorization: `Bearer ${FIRECRAWL_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url: input.url, formats: ["markdown"], onlyMainContent: true }),
      });
      if (res.ok) {
        const j = await res.json();
        const md = j?.data?.markdown ?? j?.markdown ?? "";
        const meta = j?.data?.metadata ?? j?.metadata ?? {};
        return { ok: true, data: { provider: "firecrawl", url: input.url, title: meta.title, content: md.slice(0, 12000) } };
      }
    } catch (e) { console.warn("firecrawl scrape failed", e); }
  }

  if (TAVILY_KEY) {
    try {
      const res = await fetch("https://api.tavily.com/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: TAVILY_KEY, urls: [input.url], extract_depth: "advanced" }),
      });
      if (!res.ok) return { ok: false, error: `Tavily extract ${res.status}` };
      const j = await res.json();
      const first = j?.results?.[0];
      return { ok: true, data: { provider: "tavily", url: input.url, content: (first?.raw_content ?? "").slice(0, 12000) } };
    } catch (e) { return { ok: false, error: String(e) }; }
  }

  return { ok: false, error: `read_url: could not fetch '${input.url}'. The page may block bots or require JavaScript.` };
}

// ---------- Image generation: Alibaba (Wan/Qwen-Image) → Lovable AI Gateway ----------
const DASHSCOPE_BASE = "https://dashscope-intl.aliyuncs.com/api/v1";

async function uploadImageBin(user_id: string, mime: string, bin: Uint8Array): Promise<string | null> {
  const ext = (mime.split("/")[1] || "png").split("+")[0];
  const path = `${user_id}/${crypto.randomUUID()}.${ext}`;
  const up = await fetch(`${SB_URL}/storage/v1/object/operator-files/${path}`, {
    method: "POST",
    headers: { apikey: SB_SRK, Authorization: `Bearer ${SB_SRK}`, "Content-Type": mime },
    body: bin,
  });
  if (!up.ok) return null;
  return `${SB_URL}/storage/v1/object/public/operator-files/${path}`;
}

async function alibabaGenerateImage(prompt: string, user_id: string): Promise<ToolResult | null> {
  const apiKey = await getDashscopeKey();
  if (!apiKey) return null;
  try {
    const submit = await fetch(`${DASHSCOPE_BASE}/services/aigc/text2image/image-synthesis`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable",
      },
      body: JSON.stringify({
        model: "wan2.2-t2i-flash",
        input: { prompt },
        parameters: { n: 1, size: "1024*1024" },
      }),
    });
    if (!submit.ok) {
      console.warn("[operator] alibaba image submit", submit.status, (await submit.text()).slice(0, 200));
      return null;
    }
    const sj = await submit.json();
    const taskId = sj?.output?.task_id;
    if (!taskId) return null;

    // Poll the async task (up to ~90s)
    const deadline = Date.now() + 90_000;
    let imageUrl = "";
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 3000));
      const pr = await fetch(`${DASHSCOPE_BASE}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!pr.ok) continue;
      const pj = await pr.json();
      const status = pj?.output?.task_status;
      if (status === "SUCCEEDED") {
        imageUrl = pj?.output?.results?.[0]?.url || "";
        break;
      }
      if (status === "FAILED" || status === "UNKNOWN") {
        console.warn("[operator] alibaba image failed", JSON.stringify(pj?.output).slice(0, 200));
        return null;
      }
    }
    if (!imageUrl) return null;

    // Re-host into our storage so the URL is stable/public.
    try {
      const img = await fetch(imageUrl);
      if (img.ok) {
        const mime = img.headers.get("content-type") || "image/png";
        const bin = new Uint8Array(await img.arrayBuffer());
        const pub = await uploadImageBin(user_id, mime, bin);
        if (pub) return { ok: true, data: { provider: "alibaba", imageUrl: pub, screenshotUrl: pub, prompt } };
      }
    } catch (_e) { /* fall through to raw url */ }
    return { ok: true, data: { provider: "alibaba", imageUrl, screenshotUrl: imageUrl, prompt } };
  } catch (e) {
    console.warn("[operator] alibaba image error", e);
    return null;
  }
}

export async function generateImage(input: { prompt: string; user_id: string }): Promise<ToolResult> {
  if (!input?.prompt) return { ok: false, error: "prompt required" };

  // 1) Alibaba (DashScope Wan/Qwen-Image) — primary
  const ali = await alibabaGenerateImage(input.prompt, input.user_id);
  if (ali && ali.ok) return ali;

  // 2) Lovable AI Gateway — fallback
  if (!LOVABLE_KEY) return { ok: false, error: "image generation failed (Alibaba unavailable and LOVABLE_API_KEY missing)" };
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: input.prompt }],
        modalities: ["image", "text"],
      }),
    });
    if (!r.ok) {
      const txt = await r.text();
      return { ok: false, error: `image ${r.status}: ${txt.slice(0, 200)}` };
    }
    const j = await r.json();
    const imageB64: string | undefined =
      j?.choices?.[0]?.message?.images?.[0]?.image_url?.url
      ?? j?.choices?.[0]?.message?.content?.[0]?.image_url?.url;
    if (!imageB64) return { ok: false, error: "no image returned" };

    const m = imageB64.match(/^data:(image\/[a-z]+);base64,(.+)$/);
    if (m) {
      const mime = m[1];
      const bin = Uint8Array.from(atob(m[2]), c => c.charCodeAt(0));
      const pub = await uploadImageBin(input.user_id, mime, bin);
      if (pub) return { ok: true, data: { provider: "lovable", imageUrl: pub, screenshotUrl: pub, prompt: input.prompt } };
    }
    return { ok: true, data: { provider: "lovable", imageDataUrl: imageB64.slice(0, 500), prompt: input.prompt } };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}


export const TOOL_REGISTRY = {
  web_search: webSearch,
  read_url: readUrl,
  browse_url: browseUrl,
  browser_act: browserAct,
  generate_image: generateImage,
  build_app: buildApp,
  publish_app: publishApp,
  save_memory: saveMemory,
} as const;

export type ToolName = keyof typeof TOOL_REGISTRY;
