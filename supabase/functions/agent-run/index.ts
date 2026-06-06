// agent-run — تشغيل وكيل Megsy: Qwen + tools (E2B sandbox + web)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DASHSCOPE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";

async function getDashscopeKey(supabase: any): Promise<string | null> {
  const env = Deno.env.get("DASHSCOPE_API_KEY") || Deno.env.get("QWEN_API_KEY") || Deno.env.get("ALIBABA_API_KEY");
  if (env) return env;
  const { data } = await supabase.from("api_keys").select("api_key, service, is_active, is_blocked").limit(100);
  const row = (data || []).find((r: any) => {
    const s = String(r.service || "").toLowerCase().replace(/[\s_-]+/g, "");
    return ["alibaba", "alibabacloud", "dashscope", "qwen", "aliyun", "qwendashscope"].includes(s)
      && r.api_key && r.is_active !== false && r.is_blocked !== true;
  });
  return row?.api_key || null;
}

// ============ TOOLS ============
const TOOL_DEFS: Record<string, any> = {
  "sandbox.exec": {
    type: "function",
    function: {
      name: "sandbox_exec",
      description: "Execute a shell command in a Linux sandbox (E2B). Returns stdout/stderr.",
      parameters: {
        type: "object",
        properties: { command: { type: "string", description: "Shell command to run" } },
        required: ["command"],
      },
    },
  },
  "sandbox.write_file": {
    type: "function",
    function: {
      name: "sandbox_write_file",
      description: "Write text content to a file in the sandbox.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Absolute file path, e.g. /home/user/script.py" },
          content: { type: "string", description: "File contents" },
        },
        required: ["path", "content"],
      },
    },
  },
  "sandbox.read_file": {
    type: "function",
    function: {
      name: "sandbox_read_file",
      description: "Read a file from the sandbox.",
      parameters: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
      },
    },
  },
  "sandbox.apply_edit": {
    type: "function",
    function: {
      name: "sandbox_apply_edit",
      description: "Apply a code edit to an existing file using Morph Fast Apply. Pass the file path and a natural-language instruction or unified diff describing the change. Much faster and more accurate than rewriting the whole file.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Absolute file path in the sandbox" },
          instruction: { type: "string", description: "Edit instruction or diff to apply" },
        },
        required: ["path", "instruction"],
      },
    },
  },
  "web.search": {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web with Firecrawl. Returns top results with title, url, snippet.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" }, num: { type: "number", default: 5 } },
        required: ["query"],
      },
    },
  },
  "web.fetch": {
    type: "function",
    function: {
      name: "web_fetch",
      description: "Fetch a URL and return clean Markdown content (Firecrawl scrape).",
      parameters: {
        type: "object",
        properties: { url: { type: "string" } },
        required: ["url"],
      },
    },
  },
  "web.map": {
    type: "function",
    function: {
      name: "web_map",
      description: "Discover all URLs on a website (Firecrawl map). Useful before crawling docs.",
      parameters: {
        type: "object",
        properties: { url: { type: "string" }, search: { type: "string" }, limit: { type: "number", default: 50 } },
        required: ["url"],
      },
    },
  },
  "browser.act": {
    type: "function",
    function: {
      name: "browser_act",
      description: "Control a real cloud browser (Browserbase). Actions: navigate (url), screenshot, extract (selector?), click (selector), type (selector,text).",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["navigate", "screenshot", "extract", "click", "type"] },
          url: { type: "string" },
          selector: { type: "string" },
          text: { type: "string" },
        },
        required: ["action"],
      },
    },
  },
  "sandbox.expose_port": {
    type: "function",
    function: {
      name: "sandbox_expose_port",
      description: "Get a public HTTPS URL for a port running inside the E2B sandbox (e.g. dev server on 3000, 5173, 8000). Use this to share a live preview of the app you built. Also auto-saves the URL to the session so the UI shows it as a live iframe.",
      parameters: {
        type: "object",
        properties: { port: { type: "number", description: "Port number, e.g. 3000 or 5173" } },
        required: ["port"],
      },
    },
  },
  "deploy.freestyle": {
    type: "function",
    function: {
      name: "deploy_freestyle",
      description: "Deploy the current sandbox project to Freestyle.sh — an agent-native hosting platform with permanent URL. Builds and serves Node/static apps. Returns the live URL.",
      parameters: {
        type: "object",
        properties: {
          source_dir: { type: "string", description: "Absolute sandbox path of project to deploy (e.g. /home/user/app)" },
          entrypoint: { type: "string", description: "Entry command, e.g. 'npm start' or 'node server.js'", default: "npm start" },
          domain: { type: "string", description: "Optional subdomain (otherwise auto-generated)" },
        },
        required: ["source_dir"],
      },
    },
  },
  "memory.remember": {
    type: "function",
    function: {
      name: "memory_remember",
      description: "Save a long-term memory (Mem0) about the user/project for future sessions.",
      parameters: {
        type: "object",
        properties: { fact: { type: "string" } },
        required: ["fact"],
      },
    },
  },
  "memory.recall": {
    type: "function",
    function: {
      name: "memory_recall",
      description: "Recall relevant long-term memories (Mem0) about the user/project.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
};

// ============ E2B SANDBOX ============
async function e2bRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const key = Deno.env.get("E2B_API_KEY");
  if (!key) throw new Error("E2B_API_KEY not configured");
  return fetch(`https://api.e2b.dev${path}`, {
    ...init,
    headers: {
      "X-API-Key": key,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

async function ensureSandbox(supabase: any, sessionId: string): Promise<string> {
  const { data: session } = await supabase
    .from("agent_sessions")
    .select("sandbox_id, sandbox_status")
    .eq("id", sessionId)
    .single();

  if (session?.sandbox_id && session.sandbox_status === "running") {
    return session.sandbox_id;
  }

  // Create new sandbox (base template — 1 hour timeout for long agent runs)
  const r = await e2bRequest("/sandboxes", {
    method: "POST",
    body: JSON.stringify({ templateID: "base", timeout: 3600, autoPause: true }),
  });
  if (!r.ok) throw new Error(`E2B create failed: ${r.status}`);
  const data = await r.json();
  const sandboxId = data.sandboxID || data.sandboxId || data.id;

  await supabase
    .from("agent_sessions")
    .update({ sandbox_id: sandboxId, sandbox_status: "running" })
    .eq("id", sessionId);

  return sandboxId;
}

// ============ CDP (Chrome DevTools Protocol) for Browserbase ============
async function runCdpAction(wsUrl: string, args: any): Promise<any> {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map<number, (v: any) => void>();

  await new Promise<void>((res, rej) => {
    ws.onopen = () => res();
    ws.onerror = () => rej(new Error("ws open failed"));
    setTimeout(() => rej(new Error("ws open timeout")), 10000);
  });

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const cb = pending.get(msg.id)!;
        pending.delete(msg.id);
        cb(msg);
      }
    } catch {}
  };

  const send = (method: string, params: any = {}, sessionId?: string) =>
    new Promise<any>((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, (m) => (m.error ? reject(new Error(m.error.message)) : resolve(m.result)));
      const payload: any = { id: mid, method, params };
      if (sessionId) payload.sessionId = sessionId;
      ws.send(JSON.stringify(payload));
      setTimeout(() => {
        if (pending.has(mid)) { pending.delete(mid); reject(new Error(`timeout ${method}`)); }
      }, 30000);
    });

  try {
    const { targetInfos } = await send("Target.getTargets");
    let pageTarget = targetInfos.find((t: any) => t.type === "page");
    if (!pageTarget) {
      const created = await send("Target.createTarget", { url: "about:blank" });
      pageTarget = { targetId: created.targetId };
    }
    const { sessionId: sid } = await send("Target.attachToTarget", { targetId: pageTarget.targetId, flatten: true });
    await send("Page.enable", {}, sid);
    await send("Runtime.enable", {}, sid);

    const action = args.action;
    if (action === "navigate") {
      await send("Page.navigate", { url: args.url }, sid);
      await new Promise((r) => setTimeout(r, 1500));
      const title = await send("Runtime.evaluate", { expression: "document.title", returnByValue: true }, sid);
      return { action, url: args.url, title: title.result?.value };
    }
    if (action === "screenshot") {
      const shot = await send("Page.captureScreenshot", { format: "png" }, sid);
      return { action, screenshot_base64: String(shot.data || "").slice(0, 200000) };
    }
    if (action === "extract") {
      const expr = args.selector
        ? `Array.from(document.querySelectorAll(${JSON.stringify(args.selector)})).slice(0,20).map(e=>e.innerText).join('\\n---\\n')`
        : `document.body.innerText.slice(0,8000)`;
      const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true }, sid);
      return { action, text: r.result?.value };
    }
    if (action === "click") {
      const expr = `(()=>{const el=document.querySelector(${JSON.stringify(args.selector)});if(!el)return'not found';el.click();return'ok';})()`;
      const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true }, sid);
      return { action, selector: args.selector, result: r.result?.value };
    }
    if (action === "type") {
      const expr = `(()=>{const el=document.querySelector(${JSON.stringify(args.selector)});if(!el)return'not found';el.focus();el.value=${JSON.stringify(args.text || "")};el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));return'ok';})()`;
      const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true }, sid);
      return { action, selector: args.selector, result: r.result?.value };
    }
    return { error: `unknown action: ${action}` };
  } finally {
    try { ws.close(); } catch {}
  }
}

async function execTool(
  supabase: any,
  sessionId: string,
  toolName: string,
  args: any,
): Promise<string> {
  try {
    if (toolName === "sandbox_exec") {
      const sandboxId = await ensureSandbox(supabase, sessionId);
      const r = await e2bRequest(`/sandboxes/${sandboxId}/processes`, {
        method: "POST",
        body: JSON.stringify({ cmd: "bash", args: ["-c", args.command || ""], envVars: {} }),
      });
      const data = await r.json().catch(() => ({}));
      return JSON.stringify({
        stdout: String(data.stdout || data.output || "").slice(0, 4000),
        stderr: String(data.stderr || "").slice(0, 2000),
        exit_code: data.exitCode ?? data.exit_code ?? 0,
      });
    }

    if (toolName === "sandbox_write_file") {
      const sandboxId = await ensureSandbox(supabase, sessionId);
      const form = new FormData();
      form.append("file", new Blob([args.content || ""]), "upload.txt");
      const r = await fetch(
        `https://api.e2b.dev/sandboxes/${sandboxId}/files?path=${encodeURIComponent(args.path)}`,
        {
          method: "POST",
          headers: { "X-API-Key": Deno.env.get("E2B_API_KEY")! },
          body: form,
        },
      );
      return JSON.stringify({ ok: r.ok, path: args.path });
    }

    if (toolName === "sandbox_read_file") {
      const sandboxId = await ensureSandbox(supabase, sessionId);
      const r = await fetch(
        `https://api.e2b.dev/sandboxes/${sandboxId}/files?path=${encodeURIComponent(args.path)}`,
        { headers: { "X-API-Key": Deno.env.get("E2B_API_KEY")! } },
      );
      const text = await r.text();
      return JSON.stringify({ content: text.slice(0, 8000) });
    }

    if (toolName === "sandbox_apply_edit") {
      const morphKey = Deno.env.get("MORPH_API_KEY");
      if (!morphKey) return JSON.stringify({ error: "MORPH_API_KEY not configured" });
      const sandboxId = await ensureSandbox(supabase, sessionId);
      // Read current
      const cur = await fetch(`https://api.e2b.dev/sandboxes/${sandboxId}/files?path=${encodeURIComponent(args.path)}`,
        { headers: { "X-API-Key": Deno.env.get("E2B_API_KEY")! } });
      const original = await cur.text();
      // Call Morph Fast Apply
      const mr = await fetch("https://api.morphllm.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${morphKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "morph-v3-large",
          messages: [{
            role: "user",
            content: `<instruction>${args.instruction}</instruction>\n<code>${original}</code>\n<update>${args.instruction}</update>`,
          }],
        }),
      });
      const mj = await mr.json();
      const updated = mj.choices?.[0]?.message?.content || "";
      if (!updated) return JSON.stringify({ error: "Morph returned empty", detail: JSON.stringify(mj).slice(0, 400) });
      // Write back
      const form = new FormData();
      form.append("file", new Blob([updated]), "upload.txt");
      await fetch(`https://api.e2b.dev/sandboxes/${sandboxId}/files?path=${encodeURIComponent(args.path)}`,
        { method: "POST", headers: { "X-API-Key": Deno.env.get("E2B_API_KEY")! }, body: form });
      return JSON.stringify({ ok: true, path: args.path, bytes: updated.length });
    }

    if (toolName === "web_search") {
      const fcKey = Deno.env.get("FIRECRAWL_API_KEY");
      if (!fcKey) return JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" });
      const r = await fetch("https://api.firecrawl.dev/v2/search", {
        method: "POST",
        headers: { Authorization: `Bearer ${fcKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query: args.query, limit: args.num || 5 }),
      });
      const data = await r.json();
      const results = (data.data || data.web?.results || data.results || []);
      return JSON.stringify({
        results: results.slice(0, 5).map((x: any) => ({
          title: x.title, url: x.url, snippet: (x.description || x.snippet || "").slice(0, 200),
        })),
      });
    }

    if (toolName === "web_fetch") {
      const fcKey = Deno.env.get("FIRECRAWL_API_KEY");
      if (!fcKey) return JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" });
      const r = await fetch("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        headers: { Authorization: `Bearer ${fcKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url: args.url, formats: ["markdown"], onlyMainContent: true }),
      });
      const data = await r.json();
      const md = data.markdown || data.data?.markdown || "";
      return JSON.stringify({ url: args.url, markdown: String(md).slice(0, 8000) });
    }

    if (toolName === "web_map") {
      const fcKey = Deno.env.get("FIRECRAWL_API_KEY");
      if (!fcKey) return JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" });
      const r = await fetch("https://api.firecrawl.dev/v2/map", {
        method: "POST",
        headers: { Authorization: `Bearer ${fcKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url: args.url, search: args.search, limit: args.limit || 50 }),
      });
      const data = await r.json();
      return JSON.stringify({ links: (data.links || data.data?.links || []).slice(0, 50) });
    }

    if (toolName === "browser_act") {
      const bbKey = Deno.env.get("BROWSERBASE_API_KEY");
      const bbProj = Deno.env.get("BROWSERBASE_PROJECT_ID");
      if (!bbKey || !bbProj) return JSON.stringify({ error: "Browserbase not configured (need BROWSERBASE_API_KEY + BROWSERBASE_PROJECT_ID)" });

      const { data: sess } = await supabase.from("agent_sessions").select("metadata").eq("id", sessionId).single();
      let bbSessionId: string | undefined = sess?.metadata?.browserbase_session_id;
      if (!bbSessionId) {
        const cr = await fetch("https://api.browserbase.com/v1/sessions", {
          method: "POST",
          headers: { "X-BB-API-Key": bbKey, "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: bbProj, keepAlive: true }),
        });
        const cj = await cr.json();
        bbSessionId = cj.id;
        const nextMeta = { ...(sess?.metadata || {}), browserbase_session_id: bbSessionId };
        await supabase.from("agent_sessions").update({ metadata: nextMeta }).eq("id", sessionId);
      }

      const dr = await fetch(`https://api.browserbase.com/v1/sessions/${bbSessionId}/debug`, {
        headers: { "X-BB-API-Key": bbKey },
      });
      const dj = await dr.json().catch(() => ({}));
      const debugUrl: string | undefined = dj.debuggerFullscreenUrl || dj.debuggerUrl;
      const wsUrl: string | undefined = dj.wsUrl;
      if (!wsUrl) return JSON.stringify({ error: "no CDP wsUrl from Browserbase", debug: dj });

      try {
        const result = await runCdpAction(wsUrl, args);
        return JSON.stringify({ ok: true, session_id: bbSessionId, debugger_url: debugUrl, ...result });
      } catch (e) {
        return JSON.stringify({ error: `CDP: ${(e as Error).message}`, debugger_url: debugUrl });
      }
    }

    if (toolName === "sandbox_expose_port") {
      const sandboxId = await ensureSandbox(supabase, sessionId);
      const port = Number(args.port || 3000);
      // E2B public URL pattern: https://<port>-<sandboxId>.e2b.app
      const url = `https://${port}-${sandboxId}.e2b.app`;
      // Save to session metadata so UI can render iframe
      const { data: sess } = await supabase.from("agent_sessions").select("metadata").eq("id", sessionId).single();
      const nextMeta = { ...(sess?.metadata || {}), preview_url: url, preview_port: port };
      await supabase.from("agent_sessions").update({ metadata: nextMeta }).eq("id", sessionId);
      return JSON.stringify({ ok: true, url, port, note: "Live preview is now visible in the UI. Make sure your dev server binds to 0.0.0.0 not 127.0.0.1." });
    }

    if (toolName === "deploy_freestyle") {
      const fsKey = Deno.env.get("FREESTYLE_API_KEY");
      if (!fsKey) return JSON.stringify({ error: "FREESTYLE_API_KEY not configured. Add it in Supabase secrets to enable agent-native deploys." });
      const sandboxId = await ensureSandbox(supabase, sessionId);
      // Tar the source dir inside sandbox and POST to Freestyle deploy API
      const tarCmd = `cd ${args.source_dir} && tar -czf /tmp/deploy.tar.gz --exclude=node_modules --exclude=.git . && base64 /tmp/deploy.tar.gz`;
      const execR = await e2bRequest(`/sandboxes/${sandboxId}/processes`, {
        method: "POST",
        body: JSON.stringify({ cmd: "bash", args: ["-c", tarCmd], envVars: {} }),
      });
      const execData = await execR.json().catch(() => ({}));
      const tarB64 = String(execData.stdout || "").trim();
      if (!tarB64) return JSON.stringify({ error: "failed to package source", details: execData });

      const dr = await fetch("https://api.freestyle.sh/web/v1/deploy", {
        method: "POST",
        headers: { Authorization: `Bearer ${fsKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          source: { kind: "tar_gz_base64", data: tarB64 },
          config: { entrypoint: args.entrypoint || "npm start", domain: args.domain },
        }),
      });
      const dj = await dr.json().catch(() => ({}));
      if (!dr.ok) return JSON.stringify({ error: `Freestyle deploy failed (${dr.status})`, details: dj });

      const deployUrl = dj.url || dj.domain || dj.deploymentUrl;
      const { data: sess } = await supabase.from("agent_sessions").select("metadata").eq("id", sessionId).single();
      const nextMeta = { ...(sess?.metadata || {}), deploy_url: deployUrl, deploy_id: dj.id };
      await supabase.from("agent_sessions").update({ metadata: nextMeta }).eq("id", sessionId);
      return JSON.stringify({ ok: true, url: deployUrl, deploy_id: dj.id });
    }


    if (toolName === "memory_remember") {
      const mKey = Deno.env.get("MEM0_API_KEY");
      if (!mKey) return JSON.stringify({ error: "MEM0_API_KEY not configured" });
      const r = await fetch("https://api.mem0.ai/v1/memories/", {
        method: "POST",
        headers: { Authorization: `Token ${mKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: args.fact }],
          user_id: `megsy_${sessionId.slice(0, 8)}`,
        }),
      });
      const j = await r.json().catch(() => ({}));
      return JSON.stringify({ ok: r.ok, saved: args.fact, id: j.id });
    }

    if (toolName === "memory_recall") {
      const mKey = Deno.env.get("MEM0_API_KEY");
      if (!mKey) return JSON.stringify({ error: "MEM0_API_KEY not configured" });
      const r = await fetch(`https://api.mem0.ai/v1/memories/search/?query=${encodeURIComponent(args.query)}&user_id=megsy_${sessionId.slice(0, 8)}`, {
        headers: { Authorization: `Token ${mKey}` },
      });
      const j = await r.json().catch(() => ({}));
      return JSON.stringify({ memories: (j.results || j || []).slice(0, 5) });
    }

    return JSON.stringify({ error: `unknown tool: ${toolName}` });
  } catch (e) {
    return JSON.stringify({ error: (e as Error).message });
  }
}

// ============ MAIN ============
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const body = await req.json();

    // ---- Public actions (no auth) — seed-squads is idempotent setup
    if (body?.action === "seed-squads") {
      return await handleSeedSquads(admin);
    }

    // ---- Authenticated actions ----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    if (body?.action === "squad-run") {
      return await handleSquadRun({ admin, supabase, userId, body });
    }

    const { session_id, agent_slug, user_message } = body as {
      session_id: string; agent_slug: string; user_message: string;
    };

    if (!session_id || !agent_slug || !user_message) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load agent config
    const { data: agent } = await admin
      .from("agents_catalog")
      .select("*")
      .eq("slug", agent_slug)
      .single();
    if (!agent) {
      return new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify session ownership
    const { data: session } = await admin
      .from("agent_sessions")
      .select("id, user_id")
      .eq("id", session_id)
      .single();
    if (!session || session.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load message history
    const { data: history } = await admin
      .from("agent_messages")
      .select("role, content, tool_calls, tool_results")
      .eq("session_id", session_id)
      .order("created_at", { ascending: true })
      .limit(40);

    // Save user message
    await admin.from("agent_messages").insert({
      session_id, user_id: userId, role: "user", content: user_message,
    });

    // Build OpenAI-format messages
    const messages: any[] = [
      { role: "system", content: agent.system_prompt },
      ...((history || []).map((m: any) => ({ role: m.role, content: m.content || "" }))),
      { role: "user", content: user_message },
    ];

    // Build tools
    const enabledTools = (agent.default_tools as string[]) || [];
    const tools = enabledTools.map((t) => TOOL_DEFS[t]).filter(Boolean);

    const apiKey = await getDashscopeKey(admin);
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "DashScope key not configured" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Agent loop (max 6 turns)
    let finalContent = "";
    const allToolCalls: any[] = [];
    const allToolResults: any[] = [];

    for (let turn = 0; turn < 6; turn++) {
      const reqBody: any = {
        model: agent.model || "qwen-plus",
        messages,
        temperature: 0.7,
        stream: false,
      };
      if (tools.length > 0) reqBody.tools = tools;

      const r = await fetch(DASHSCOPE_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      });
      if (!r.ok) {
        const err = await r.text();
        console.error("[agent-run] qwen error", r.status, err);
        return new Response(JSON.stringify({ error: `Qwen ${r.status}`, detail: err.slice(0, 500) }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await r.json();
      const msg = data.choices?.[0]?.message;
      if (!msg) break;

      // If no tool calls, finalize
      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        finalContent = msg.content || "";
        break;
      }

      // Push assistant message with tool calls into history
      messages.push({
        role: "assistant",
        content: msg.content || "",
        tool_calls: msg.tool_calls,
      });

      // Execute each tool
      for (const tc of msg.tool_calls) {
        const args = (() => { try { return JSON.parse(tc.function.arguments || "{}"); } catch { return {}; } })();
        const result = await execTool(admin, session_id, tc.function.name, args);
        allToolCalls.push({ name: tc.function.name, args, id: tc.id });
        allToolResults.push({ id: tc.id, result });
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: result,
        });
      }
    }

    // Save assistant message
    await admin.from("agent_messages").insert({
      session_id,
      user_id: userId,
      role: "assistant",
      content: finalContent,
      tool_calls: allToolCalls.length ? allToolCalls : null,
      tool_results: allToolResults.length ? allToolResults : null,
    });

    // Bump session
    await admin
      .from("agent_sessions")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", session_id);

    return new Response(JSON.stringify({
      content: finalContent,
      tool_calls: allToolCalls,
      tool_results: allToolResults,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[agent-run]", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ================================================================
// ============ MERGED SQUAD ACTIONS (seed + run) =================
// ================================================================
const SQUAD_MEMBERS = [
  { slug: "sq-architect", name: "Architect", name_ar: "المهندس المعماري",
    description: "Plans architecture, picks the stack, breaks work into tasks.",
    description_ar: "يخطط ويختار الـ stack ويقسم المهام.",
    category: "squad-members", icon: "Compass", color: "#8b5cf6", model: "qwen-max",
    system_prompt: `You are a senior software architect. Given a project request, produce: 1) a concise architecture (folders, services, data model), 2) the exact stack, 3) a numbered task list ready to delegate. Default stack: React + Vite + Tailwind + shadcn frontend, Node/Express + Supabase backend. Create /home/user/project/ARCHITECTURE.md as your deliverable.`,
    default_tools: ["sandbox.exec", "sandbox.write_file", "sandbox.read_file", "web.search"],
    is_active: true, is_featured: true, credits_per_message: 3 },
  { slug: "sq-backend", name: "Backend Engineer", name_ar: "مهندس Backend",
    description: "Implements APIs, DB, integrations.",
    description_ar: "ينفّذ الـ APIs والـ DB والتكاملات.",
    category: "squad-members", icon: "Server", color: "#0ea5e9", model: "qwen3-coder-plus",
    system_prompt: `You are a senior backend engineer (Node.js + Express + Supabase). Implement REST APIs, database migrations, auth flows, integrations. Always work inside /home/user/project. Clean idiomatic TypeScript. Use sandbox to scaffold files, install with npm, run smoke tests. Report endpoints produced.`,
    default_tools: ["sandbox.exec", "sandbox.write_file", "sandbox.read_file", "sandbox.apply_edit"],
    is_active: true, is_featured: true, credits_per_message: 2 },
  { slug: "sq-frontend", name: "Frontend Engineer", name_ar: "مهندس Frontend",
    description: "Implements UI in React/Vite/Tailwind/shadcn.",
    description_ar: "ينفّذ الواجهات.",
    category: "squad-members", icon: "Code2", color: "#06b6d4", model: "qwen3-coder-plus",
    system_prompt: `You are a senior frontend engineer (React 18 + Vite + TS + Tailwind + shadcn/ui). Implement pages, components, routing, data fetching with TanStack Query. Work inside /home/user/project. Use sandbox_apply_edit for incremental changes. Match the ui-designer specs.`,
    default_tools: ["sandbox.exec", "sandbox.write_file", "sandbox.read_file", "sandbox.apply_edit"],
    is_active: true, is_featured: true, credits_per_message: 2 },
  { slug: "sq-ui", name: "UI Designer", name_ar: "مصمم UI",
    description: "Design tokens, component specs, Tailwind tokens.",
    description_ar: "ينتج توكنات التصميم.",
    category: "squad-members", icon: "Palette", color: "#ec4899", model: "qwen-max",
    system_prompt: `You are a senior product designer. Produce design tokens (HSL palette, type scale, spacing, radius), component specs, and concrete Tailwind classes/CSS variables. Write /home/user/project/DESIGN.md plus tailwind.config.js + index.css token files. Be bold and specific — avoid generic gradients.`,
    default_tools: ["sandbox.write_file", "sandbox.read_file", "web.search"],
    is_active: true, is_featured: true, credits_per_message: 2 },
  { slug: "sq-devops", name: "DevOps Engineer", name_ar: "مهندس DevOps",
    description: "Installs deps, runs builds, configures deployment.",
    description_ar: "يثبّت الـ deps ويعمل build وينشر.",
    category: "squad-members", icon: "Wrench", color: "#10b981", model: "qwen3-coder-plus",
    system_prompt: `You are a DevOps engineer. Set up package.json, install dependencies, run builds, fix build errors, configure env, prepare deploy artifacts. Use the sandbox shell extensively.\n\nLIVE PREVIEW: When starting any dev server (Vite, Next, Express), ALWAYS bind to host 0.0.0.0 — not 127.0.0.1 — otherwise the public preview URL will not work. Examples: \`npm run dev -- --host 0.0.0.0 --port 5173\`, \`next dev -H 0.0.0.0 -p 3000\`, \`app.listen(3000, "0.0.0.0")\`. Run with \`&\` then call sandbox_expose_port(<port>) immediately so the live preview iframe shows up in the UI.\n\nDEPLOY: When the build is green, call deploy_freestyle(source_dir, entrypoint) for a permanent URL.`,
    default_tools: ["sandbox.exec", "sandbox.write_file", "sandbox.read_file", "sandbox.expose_port", "deploy.freestyle"],
    is_active: true, is_featured: true, credits_per_message: 2 },
  { slug: "sq-qa", name: "QA Engineer", name_ar: "مهندس الجوده",
    description: "Writes and runs tests, validates the build.",
    description_ar: "يكتب الاختبارات ويتحقق من البناء.",
    category: "squad-members", icon: "TestTube", color: "#f59e0b", model: "qwen3-coder-plus",
    system_prompt: `You are a QA engineer. Write smoke tests (vitest/playwright when appropriate), run the test suite, hit the dev server with curl to validate endpoints, report concrete pass/fail evidence. Never claim success without running something. Report failures back so backend/frontend can fix them.`,
    default_tools: ["sandbox.exec", "sandbox.write_file", "sandbox.read_file"],
    is_active: true, is_featured: true, credits_per_message: 2 },
];
const SQUADS = [{
  name: "Full-Stack Web Builder",
  description: "A 6-agent squad that designs, builds, tests and ships a full-stack web app from a single prompt.",
  agent_slugs: ["sq-architect", "sq-ui", "sq-backend", "sq-frontend", "sq-devops", "sq-qa"],
  orchestrator_prompt: `You are the lead engineer orchestrating a 6-person squad to build a complete web application.
Workflow: 1) delegate to sq-architect for ARCHITECTURE.md and a task list, 2) delegate to sq-ui for DESIGN.md and token files, 3) delegate to sq-backend then sq-frontend in slices, 4) delegate to sq-devops to install, build AND start the dev server bound to 0.0.0.0 then call sandbox_expose_port so the user sees a live preview, 5) delegate to sq-qa to validate against the live URL. Re-delegate to fix failures. Optionally call deploy_freestyle for a permanent URL. Working dir: /home/user/project. Finish with a clear summary including the live preview URL.`,
  is_public: true,
  metadata: { orchestrator_model: "qwen-max" },
}];

async function handleSeedSquads(admin: any): Promise<Response> {
  try {
    const { error: e1 } = await admin.from("agents_catalog").upsert(SQUAD_MEMBERS, { onConflict: "slug" });
    if (e1) throw new Error(`members: ${e1.message}`);
    const { data: existing } = await admin.from("agent_squads").select("id,name").is("user_id", null);
    const byName = new Map((existing || []).map((x: any) => [x.name, x.id]));
    let inserted = 0, updated = 0;
    for (const s of SQUADS) {
      const id = byName.get(s.name);
      if (id) {
        const { error } = await admin.from("agent_squads").update({ ...s, user_id: null }).eq("id", id);
        if (error) throw new Error(`squad update: ${error.message}`);
        updated++;
      } else {
        const { error } = await admin.from("agent_squads").insert({ ...s, user_id: null });
        if (error) throw new Error(`squad insert: ${error.message}`);
        inserted++;
      }
    }
    return new Response(JSON.stringify({ ok: true, members: SQUAD_MEMBERS.length, squads_inserted: inserted, squads_updated: updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

// ============ Squad orchestrator ============
const ORCH_MAX_TURNS = 30;
const MEMBER_MAX_TURNS = 12;
async function callQwen(model: string, messages: any[], tools?: any[]) {
  const k = Deno.env.get("DASHSCOPE_API_KEY") || Deno.env.get("QWEN_API_KEY") || Deno.env.get("ALIBABA_API_KEY");
  if (!k) throw new Error("DASHSCOPE_API_KEY not configured");
  const body: any = { model, messages, temperature: 0.6, stream: false };
  if (tools && tools.length) body.tools = tools;
  const r = await fetch(DASHSCOPE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Qwen ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return (await r.json()).choices?.[0]?.message;
}

const MEMBER_TOOLS_LIST = ["sandbox.exec","sandbox.write_file","sandbox.read_file","sandbox.apply_edit","sandbox.expose_port","deploy.freestyle","web.search","web.fetch","browser.act","memory.remember","memory.recall"];

async function runSquadMember(opts: { admin: any; sessionId: string; userId: string; supabase: any; agent: any; assignment: string; }): Promise<{ report: string; turns: number }> {
  const { admin, sessionId, userId, supabase, agent, assignment } = opts;
  const tools = MEMBER_TOOLS_LIST.map((t) => TOOL_DEFS[t]).filter(Boolean);
  tools.push({ type: "function", function: { name: "report_back", description: "Finish your assignment and return a concise report to the orchestrator.", parameters: { type: "object", properties: { summary: { type: "string" }, files_produced: { type: "array", items: { type: "string" } } }, required: ["summary"] } } });
  const sysPrompt = `${agent.system_prompt}\n\nYou are working as part of a squad. The orchestrator delegated this task to you:\n---\n${assignment}\n---\nUse your tools to complete the work in the shared sandbox. When done, call report_back with a concise summary.`;
  const messages: any[] = [{ role: "system", content: sysPrompt }, { role: "user", content: assignment }];
  let report = "";
  for (let turn = 0; turn < MEMBER_MAX_TURNS; turn++) {
    const msg = await callQwen(agent.model || "qwen-plus", messages, tools);
    if (!msg) break;
    if (!msg.tool_calls || msg.tool_calls.length === 0) { report = msg.content || ""; break; }
    messages.push({ role: "assistant", content: msg.content || "", tool_calls: msg.tool_calls });
    for (const tc of msg.tool_calls) {
      let args: any = {}; try { args = JSON.parse(tc.function.arguments || "{}"); } catch {}
      if (tc.function.name === "report_back") {
        await admin.from("agent_messages").insert({ session_id: sessionId, user_id: userId, role: "assistant", content: args.summary || "", metadata: { agent_role: agent.slug, files: args.files_produced || [] } });
        return { report: args.summary || "", turns: turn + 1 };
      }
      const result = await execTool(admin, sessionId, tc.function.name, args);
      messages.push({ role: "tool", tool_call_id: tc.id, content: result });
    }
  }
  if (report) await admin.from("agent_messages").insert({ session_id: sessionId, user_id: userId, role: "assistant", content: report, metadata: { agent_role: agent.slug, truncated: true } });
  return { report: report || "(no final report)", turns: MEMBER_MAX_TURNS };
}

const ORCH_TOOLS = [
  { type: "function", function: { name: "delegate_to", description: "Delegate a task to one of the squad members. Returns their report when done.", parameters: { type: "object", properties: { agent_slug: { type: "string" }, task: { type: "string" } }, required: ["agent_slug", "task"] } } },
  { type: "function", function: { name: "finish", description: "Mark the whole squad mission as done.", parameters: { type: "object", properties: { summary: { type: "string" } }, required: ["summary"] } } },
];

async function handleSquadRun(opts: { admin: any; supabase: any; userId: string; body: any }): Promise<Response> {
  const { admin, supabase, userId, body } = opts;
  try {
    const { squad_id, task, session_id } = body;
    if (!squad_id || !task) {
      return new Response(JSON.stringify({ error: "squad_id and task required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: squad } = await admin.from("agent_squads").select("*").eq("id", squad_id).single();
    if (!squad) return new Response(JSON.stringify({ error: "Squad not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const slugs: string[] = squad.agent_slugs || [];
    const { data: members } = await admin.from("agents_catalog").select("slug,name,system_prompt,model").in("slug", slugs);
    const memberMap = new Map<string, any>((members || []).map((m: any) => [m.slug, m]));

    let sessionId = session_id;
    if (!sessionId) {
      const { data: ns } = await admin.from("agent_sessions").insert({
        user_id: userId, agent_slug: `squad:${squad_id}`, title: String(task).slice(0, 80),
        status: "running", metadata: { squad_id, squad_name: squad.name },
      }).select("id").single();
      sessionId = ns!.id;
    }
    await admin.from("agent_messages").insert({ session_id: sessionId, user_id: userId, role: "user", content: task, metadata: { agent_role: "user" } });

    const sandboxId = await ensureSandbox(admin, sessionId);
    const memberList = (members || []).map((m: any) => `- ${m.slug}: ${m.name}`).join("\n");
    const orchSys = `${squad.orchestrator_prompt || "You are the squad orchestrator."}\n\nSquad members you can delegate to:\n${memberList}\n\nAll members share the same Linux sandbox (E2B) and a working directory at /home/user/project.\nPlan the work, call delegate_to for each step, then call finish with the final summary.\nBe concise. Delegate one task at a time, observe the report, then decide the next step.`;
    const messages: any[] = [
      { role: "system", content: orchSys },
      { role: "user", content: `Mission: ${task}\n\nWorking dir: /home/user/project\nSandbox: ${sandboxId}` },
    ];
    let finalSummary = ""; const trace: any[] = [];
    for (let turn = 0; turn < ORCH_MAX_TURNS; turn++) {
      const msg = await callQwen(squad.metadata?.orchestrator_model || "qwen-max", messages, ORCH_TOOLS);
      if (!msg) break;
      if (!msg.tool_calls || msg.tool_calls.length === 0) { finalSummary = msg.content || ""; break; }
      messages.push({ role: "assistant", content: msg.content || "", tool_calls: msg.tool_calls });
      for (const tc of msg.tool_calls) {
        let args: any = {}; try { args = JSON.parse(tc.function.arguments || "{}"); } catch {}
        if (tc.function.name === "finish") {
          finalSummary = args.summary || "";
          messages.push({ role: "tool", tool_call_id: tc.id, content: "ok" });
          turn = ORCH_MAX_TURNS; break;
        }
        if (tc.function.name === "delegate_to") {
          const agent = memberMap.get(args.agent_slug);
          if (!agent) { messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify({ error: `unknown agent: ${args.agent_slug}` }) }); continue; }
          await admin.from("agent_messages").insert({ session_id: sessionId, user_id: userId, role: "assistant", content: `→ Delegating to **${agent.name}** (\`${agent.slug}\`):\n\n${args.task}`, metadata: { agent_role: "orchestrator", delegated_to: agent.slug } });
          const { report, turns } = await runSquadMember({ admin, sessionId, userId, supabase, agent, assignment: args.task });
          trace.push({ agent: agent.slug, turns });
          messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify({ agent: agent.slug, report: report.slice(0, 4000) }) });
        }
      }
    }
    await admin.from("agent_messages").insert({ session_id: sessionId, user_id: userId, role: "assistant", content: finalSummary || "(mission ended without explicit summary)", metadata: { agent_role: "orchestrator", final: true, trace } });
    await admin.from("agent_sessions").update({ status: "completed", last_message_at: new Date().toISOString(), ended_at: new Date().toISOString() }).eq("id", sessionId);
    return new Response(JSON.stringify({ session_id: sessionId, summary: finalSummary, trace }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[squad-run]", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
}
