// supabase/functions/code-agent/index.ts
// Megsy Code agent — runs the SAME 6-agent squad as megsy-os (Architect, UI, Backend,
// Frontend, DevOps, QA) but writes into the /code project's code_project_files table.
// All models are Alibaba Qwen via DASHSCOPE (qwen-max for orchestrator + design/architect,
// qwen3-coder-plus for coders).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { spendCreditsServer, creditErrorResponse } from "../_shared/credits.ts";

const DASHSCOPE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
const ORCH_MODEL = "qwen-max";

// ============ Squad specialists (mirror of megsy-os Full-Stack Web Builder) ============
type Specialist = { slug: string; name: string; model: string; system: string };
const SPECIALISTS: Record<string, Specialist> = {
  architect: {
    slug: "architect", name: "Architect", model: "qwen-max",
    system: `You are the Architect on a 6-person squad building a React+Vite+TS+Tailwind+shadcn+Framer Motion app. Read the existing file tree with list_files. Then write_file ARCHITECTURE.md containing: 1) folder/file tree to build, 2) data model, 3) numbered task list for backend/frontend/ui/devops/qa. Be concrete with file paths. Then stop.`,
  },
  ui: {
    slug: "ui", name: "UI Designer", model: "qwen-max",
    system: `You are the UI Designer. Produce a bold, specific theme matching the subject.

MANDATORY workflow:
1. fetch_shadcn_component for the primitives the project will need (e.g. "button","card","dialog","input","navigation-menu","sheet","tabs") and write_file them under src/components/ui/<name>.tsx using the returned source. Always include "button" and "card".
2. web_search "<subject> brand color palette site:dribbble.com OR site:behance.net" to pick an authentic palette — do NOT invent generic purple-on-white.
3. write_file src/index.css with: @import for 1-2 Google Fonts that match the vibe, full HSL token set (--background, --foreground, --primary, --primary-glow, --accent, --muted, --card, --border, --radius), custom gradients, dark mode tokens, body font, RTL support.
4. write_file tailwind.config.ts extending colors/fontFamily/boxShadow/backgroundImage from those tokens.
5. write_file src/lib/utils.ts with the standard cn() helper if missing.
6. write_file DESIGN.md describing palette names + hex, type scale, motion, and which shadcn components were installed.
Then stop.`,
  },
  backend: {
    slug: "backend", name: "Backend Engineer", model: "qwen3-coder-plus",
    system: `You are the Backend Engineer. If the project needs data/auth/integrations, write_file the supabase client helpers, hooks (src/hooks/use-*.ts), and any edge function stubs needed. If the project is pure static content (portfolio, bio site, landing), say "no backend needed" and stop without writing files. Use TanStack Query patterns.`,
  },
  frontend: {
    slug: "frontend", name: "Frontend Engineer", model: "qwen3-coder-plus",
    system: `You are the Frontend Engineer. Read ARCHITECTURE.md and DESIGN.md first (read_file).

When the subject needs facts, names, dates, quotes, or biography — call web_search first and embed real verified content (never invent). For any visual primitive you need that isn't in src/components/ui/ yet, call fetch_shadcn_component and write_file it.

Then build the WHOLE app: write_file src/App.tsx (BrowserRouter + Routes + default export), src/main.tsx if missing, src/pages/* for every route, src/components/* for Hero/About/Gallery/Quote/Stats/Footer/Nav etc. Every page must be content-rich — real paragraphs/lists/quotes about the actual subject in the user's language (Arabic dir="rtl" by default for Arabic prompts). Use framer-motion for entrance animations, lucide-react icons, the installed shadcn components, Tailwind classes only (no inline styles), semantic HTML. Minimum 6 files. Never ship one-line placeholder pages. Write COMPLETE file contents — no truncation, no markdown fences.`,
  },
  devops: {
    slug: "devops", name: "DevOps Engineer", model: "qwen3-coder-plus",
    system: `You are the DevOps Engineer. read_file package.json and verify all imports used by frontend files resolve to installed deps. If a needed dep is missing (framer-motion, react-router-dom, lucide-react, @tanstack/react-query, etc.) write_file an updated package.json adding it to dependencies. Verify src/main.tsx renders <App/> from ./App. Verify index.html links /src/main.tsx. Then stop.`,
  },
  qa: {
    slug: "qa", name: "QA Engineer", model: "qwen3-coder-plus",
    system: `You are the QA Engineer. list_files then read_file each page/component the frontend produced. Mentally trace imports — if any import path is wrong, missing component, or a page references a non-existent file, write_file the fix. Confirm every route in App.tsx has a corresponding page file. Confirm src/index.css tokens are used (not raw colors). Report a 3-line pass/fail summary, then stop.`,
  },
};

const ORCH_SYSTEM = `You are the Lead Engineer orchestrating a 6-person Qwen squad (Architect, UI Designer, Backend, Frontend, DevOps, QA) building a React+Vite+TS+Tailwind+shadcn app inside the user's /code project.

Workflow — call delegate_to_specialist in THIS order, one at a time, waiting for each report:
1. architect   — produce ARCHITECTURE.md + task list
2. ui          — produce DESIGN.md + src/index.css + tailwind.config.ts
3. backend     — only if data/auth/integrations are needed
4. frontend    — build all pages + components with REAL content
5. devops      — verify deps + entry files
6. qa          — verify imports/routes, fix any breakage

Rules:
- You do NOT write files yourself. You only delegate. Give each specialist a precise assignment that includes the user's original request and any context from earlier specialists.
- If qa reports failures, re-delegate to frontend or devops to fix, then re-run qa.
- Never skip ui or frontend.
- After qa passes, reply with a 2-4 line Arabic summary of what the squad built. Do NOT reply with text before the squad finishes.`;

const FILE_TOOLS = [
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Create or overwrite a file in the project.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "File path relative to project root, e.g. src/App.tsx" },
          content: { type: "string", description: "Full file contents." },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read the current contents of a file.",
      parameters: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_files",
      description: "List all file paths currently in the project.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_file",
      description: "Delete a file from the project.",
      parameters: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fetch_shadcn_component",
      description: "Fetch the official source code for a shadcn/ui component from the public registry. Returns ready-to-write TSX source for src/components/ui/<name>.tsx. Use exact slug like 'button','card','dialog','input','tabs','sheet','navigation-menu','accordion','badge','avatar','dropdown-menu','separator','tooltip','scroll-area','skeleton','sonner','toast','toggle','switch','progress','popover','calendar','command'.",
      parameters: {
        type: "object",
        properties: { name: { type: "string", description: "Component slug, e.g. 'button'" } },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for facts, biographies, brand info, palettes, references. Returns top results as title+snippet+url. Use whenever you need real-world content instead of inventing.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" }, max_results: { type: "number" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fetch_url",
      description: "Fetch a URL and return its readable text content (HTML stripped). Use to read docs, Wikipedia, articles you found via web_search.",
      parameters: {
        type: "object",
        properties: { url: { type: "string" } },
        required: ["url"],
      },
    },
  },
];

const ORCH_TOOLS = [
  {
    type: "function",
    function: {
      name: "delegate_to_specialist",
      description: "Hand off a sub-task to one of the squad specialists. Returns the specialist's report when done.",
      parameters: {
        type: "object",
        properties: {
          specialist: { type: "string", enum: ["architect", "ui", "backend", "frontend", "devops", "qa"] },
          assignment: { type: "string", description: "Precise task for the specialist. Include user's original request and any context from earlier specialists." },
        },
        required: ["specialist", "assignment"],
      },
    },
  },
];

async function callQwen(apiKey: string, model: string, messages: any[], tools?: any[]) {
  const body: any = { model, messages, temperature: 0.6, stream: false };
  if (tools && tools.length) { body.tools = tools; body.tool_choice = "auto"; }
  const r = await fetch(DASHSCOPE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Qwen ${r.status}: ${t.slice(0, 300)}`);
  }
  const j = await r.json();
  return j.choices?.[0]?.message;
}

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
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

async function executeTool(sb: ReturnType<typeof admin>, projectId: string, name: string, args: any) {
  if (name === "list_files") {
    const { data } = await sb.from("code_project_files").select("path").eq("project_id", projectId);
    return { files: (data ?? []).map((r) => r.path) };
  }
  if (name === "read_file") {
    const { data } = await sb
      .from("code_project_files")
      .select("content")
      .eq("project_id", projectId)
      .eq("path", args.path)
      .maybeSingle();
    if (!data) return { error: "not_found" };
    return { path: args.path, content: data.content };
  }
  if (name === "write_file") {
    const path = String(args.path || "");
    const content = String(args.content ?? "");
    if (!path) return { error: "path_required" };
    const { error } = await sb
      .from("code_project_files")
      .upsert({ project_id: projectId, path, content }, { onConflict: "project_id,path" });
    if (error) return { error: error.message };
    return { ok: true, path, bytes: content.length };
  }
  if (name === "delete_file") {
    await sb.from("code_project_files").delete().eq("project_id", projectId).eq("path", args.path);
    return { ok: true };
  }
  if (name === "fetch_shadcn_component") {
    const slug = String(args.name || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!slug) return { error: "name_required" };
    try {
      const r = await fetch(`https://ui.shadcn.com/r/styles/new-york/${slug}.json`);
      if (!r.ok) return { error: `not_found_${r.status}`, name: slug };
      const j = await r.json();
      const file = (j.files || [])[0];
      if (!file?.content) return { error: "no_content", name: slug };
      return {
        name: slug,
        suggested_path: `src/components/ui/${slug}.tsx`,
        content: file.content,
        dependencies: j.dependencies || [],
        registryDependencies: j.registryDependencies || [],
      };
    } catch (e) {
      return { error: `fetch_failed: ${(e as Error).message}` };
    }
  }
  if (name === "web_search") {
    const q = String(args.query || "").trim();
    if (!q) return { error: "query_required" };
    const max = Math.min(Number(args.max_results) || 5, 8);
    try {
      const r = await fetch(`https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; MegsyAgent/1.0)" },
      });
      const html = await r.text();
      const results: { title: string; url: string; snippet: string }[] = [];
      const re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(html)) && results.length < max) {
        const url = decodeURIComponent((m[1].match(/uddg=([^&]+)/)?.[1]) || m[1]);
        const title = m[2].replace(/<[^>]+>/g, "").trim();
        const snippet = m[3].replace(/<[^>]+>/g, "").trim();
        results.push({ title, url, snippet });
      }
      return { query: q, results };
    } catch (e) {
      return { error: `search_failed: ${(e as Error).message}` };
    }
  }
  if (name === "fetch_url") {
    const url = String(args.url || "");
    if (!/^https?:\/\//.test(url)) return { error: "invalid_url" };
    try {
      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; MegsyAgent/1.0)" } });
      const html = await r.text();
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 8000);
      return { url, text };
    } catch (e) {
      return { error: `fetch_failed: ${(e as Error).message}` };
    }
  }
  return { error: "unknown_tool" };
}

// ---- Live event broadcaster (writes to code_agent_events for Realtime UI) ----
function makeEmitter(sb: ReturnType<typeof admin>, runId: string) {
  return async (agent: string, type: string, payload: Record<string, unknown> = {}) => {
    try {
      await sb.from("code_agent_events").insert({
        run_id: runId, agent_name: agent, event_type: type, payload,
      });
    } catch (e) {
      console.error("[code-agent] emit failed", (e as Error).message);
    }
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await userFromRequest(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "auth_required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const projectId = String(body.projectId || "");
    const userMessage = String(body.message || "").trim();
    if (!projectId || !userMessage) {
      return new Response(JSON.stringify({ error: "projectId and message required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = admin();

    // Verify ownership
    const { data: project } = await sb
      .from("code_projects")
      .select("id, owner_id, name, initial_prompt")
      .eq("id", projectId)
      .maybeSingle();
    if (!project || project.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-side credit enforcement (squad run costs more than a single build)
    const spend = await spendCreditsServer(user.id, 5, "code_agent_squad", "Code squad run");
    if (!spend.ok) return creditErrorResponse(spend, corsHeaders);

    // Create a run row for the live multi-agent timeline
    const { data: runRow } = await sb.from("code_agent_runs").insert({
      project_id: projectId, user_id: user.id, user_prompt: userMessage, status: "running",
    }).select("id").maybeSingle();
    const runId = runRow?.id as string;
    const emit = makeEmitter(sb, runId);
    await emit("orchestrator", "run_started", { prompt: userMessage });

    // Persist user message
    await sb.from("code_messages").insert({
      project_id: projectId,
      role: "user",
      content: userMessage,
    });

    // Load history (last 30)
    const { data: history } = await sb
      .from("code_messages")
      .select("role, content, tool_calls, tool_results")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true })
      .limit(30);

    // Load file index for context
    const { data: filesList } = await sb
      .from("code_project_files")
      .select("path")
      .eq("project_id", projectId);
    const fileIndex = (filesList ?? []).map((r) => r.path).join("\n") || "(empty project)";

    const dashscopeKey = Deno.env.get("DASHSCOPE_API_KEY") || Deno.env.get("QWEN_API_KEY") || Deno.env.get("ALIBABA_API_KEY");
    if (!dashscopeKey) {
      return new Response(JSON.stringify({ error: "no_llm_key_configured", detail: "DASHSCOPE_API_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build OpenAI-compatible messages
    type Msg = { role: string; content: string | null; tool_calls?: any; tool_call_id?: string; name?: string };

    // Load user's "Megsy" skill — grouped by category
    const { data: megsyItems } = await sb
      .from("megsy_code_skills")
      .select("title, content, category")
      .eq("user_id", user.id)
      .eq("enabled", true)
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    const CAT_LABEL: Record<string, string> = {
      templates: "TEMPLATES", components: "COMPONENTS", assets: "ASSETS",
      design: "DESIGN.MD", skills: "SKILLS", landing: "LANDING",
      backgrounds: "BACKGROUNDS",
    };
    let megsyBlock = "";
    if (megsyItems && megsyItems.length) {
      const groups: Record<string, string[]> = {};
      for (const it of megsyItems as any[]) {
        const k = it.category || "skills";
        (groups[k] ||= []).push(`### ${it.title}\n${it.content}`);
      }
      const order = ["templates", "components", "assets", "design", "skills", "landing", "backgrounds"];
      const sections = order
        .filter((k) => groups[k]?.length)
        .map((k) => `## ${CAT_LABEL[k]}\n${groups[k].join("\n\n")}`)
        .join("\n\n");
      megsyBlock = `\n\n# مهارة ميغسي (Megsy Skill) — قواعد أساسية يجب اتباعها في كل رد:\n${sections}`;
    }

    const messages: Msg[] = [
      { role: "system", content: `${ORCH_SYSTEM}${megsyBlock}\n\nCurrent project files:\n${fileIndex}` },
    ];
    for (const m of history ?? []) {
      if (m.role === "assistant" && m.tool_calls) {
        messages.push({ role: "assistant", content: m.content || null, tool_calls: m.tool_calls as any });
      } else if (m.role === "tool" && m.tool_results) {
        const tr = m.tool_results as any;
        messages.push({ role: "tool", content: JSON.stringify(tr.result ?? {}), tool_call_id: tr.tool_call_id, name: tr.name });
      } else if (m.content) {
        messages.push({ role: m.role, content: m.content });
      }
    }

    const editedFiles = new Set<string>();

    // ---------- Specialist runner (nested Qwen loop with file tools) ----------
    const SPECIALIST_MAX_STEPS = 16;
    async function runSpecialist(slug: string, assignment: string): Promise<string> {
      const spec = SPECIALISTS[slug];
      if (!spec) return `(unknown specialist: ${slug})`;
      const sysHeader = `${spec.system}\n\nWorking project file tree:\n${fileIndex}\n\nUser's original request:\n${userMessage}`;
      const sMsgs: any[] = [
        { role: "system", content: sysHeader },
        { role: "user", content: assignment },
      ];
      await sb.from("code_messages").insert({
        project_id: projectId, role: "assistant",
        content: `→ delegating to **${spec.name}** (${spec.model})`,
        tool_calls: null,
      });
      await emit(spec.slug, "agent_started", { name: spec.name, model: spec.model, assignment });
      let lastText = "";
      for (let s = 0; s < SPECIALIST_MAX_STEPS; s++) {
        let msg: any;
        try { msg = await callQwen(dashscopeKey, spec.model, sMsgs, FILE_TOOLS); }
        catch (e) {
          await emit(spec.slug, "agent_error", { error: (e as Error).message });
          return `(specialist ${slug} error: ${(e as Error).message})`;
        }
        if (!msg) break;
        const tcs = msg.tool_calls as any[] | undefined;
        sMsgs.push({ role: "assistant", content: msg.content ?? null, tool_calls: tcs });
        if (msg.content) await emit(spec.slug, "thinking", { text: String(msg.content).slice(0, 500) });
        if (!tcs || !tcs.length) { lastText = msg.content || ""; break; }
        await sb.from("code_messages").insert({
          project_id: projectId, role: "assistant",
          content: msg.content || "", tool_calls: tcs,
        });
        for (const tc of tcs) {
          let args: any = {};
          try { args = JSON.parse(tc.function?.arguments || "{}"); } catch {}
          const toolName = tc.function?.name;
          await emit(spec.slug, "tool_call", { tool: toolName, path: args?.path });
          const result = await executeTool(sb, projectId, toolName, args);
          if ((toolName === "write_file" || toolName === "delete_file") && args.path) {
            editedFiles.add(String(args.path));
          }
          await emit(spec.slug, "tool_result", { tool: toolName, path: args?.path, ok: !result?.error, bytes: (result as any)?.bytes });
          sMsgs.push({ role: "tool", content: JSON.stringify(result), tool_call_id: tc.id, name: toolName });
          await sb.from("code_messages").insert({
            project_id: projectId, role: "tool", content: null,
            tool_results: { tool_call_id: tc.id, name: toolName, args, result, specialist: slug },
          });
        }
      }
      await emit(spec.slug, "agent_finished", { summary: lastText.slice(0, 300) });
      return lastText || `(${spec.name} finished)`;
    }

    // ---------- Orchestrator loop ----------
    const ORCH_MAX_STEPS = 20;
    let finalText = "";
    for (let step = 0; step < ORCH_MAX_STEPS; step++) {
      let msg: any;
      try { msg = await callQwen(dashscopeKey, ORCH_MODEL, messages, ORCH_TOOLS); }
      catch (e) {
        console.error("[code-agent] orch error", e);
        return new Response(JSON.stringify({ error: "llm_error", detail: (e as Error).message }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!msg) break;
      const toolCalls = msg.tool_calls as any[] | undefined;
      messages.push({ role: "assistant", content: msg.content ?? null, tool_calls: toolCalls });

      if (toolCalls && toolCalls.length) {
        await sb.from("code_messages").insert({
          project_id: projectId, role: "assistant",
          content: msg.content || "", tool_calls: toolCalls,
        });
        for (const tc of toolCalls) {
          let args: any = {};
          try { args = JSON.parse(tc.function?.arguments || "{}"); } catch {}
          let result: any;
          if (tc.function?.name === "delegate_to_specialist") {
            await emit("orchestrator", "delegate", { specialist: args.specialist, assignment: String(args.assignment || "").slice(0, 300) });
            const report = await runSpecialist(String(args.specialist || ""), String(args.assignment || ""));
            result = { specialist: args.specialist, report };
          } else {
            result = { error: "unknown_orchestrator_tool" };
          }
          messages.push({ role: "tool", content: JSON.stringify(result), tool_call_id: tc.id, name: tc.function?.name });
          await sb.from("code_messages").insert({
            project_id: projectId, role: "tool", content: null,
            tool_results: { tool_call_id: tc.id, name: tc.function?.name, args, result },
          });
        }
        continue;
      }

      finalText = msg.content || "تم.";
      await sb.from("code_messages").insert({
        project_id: projectId, role: "assistant", content: finalText,
      });
      await emit("orchestrator", "run_finished", { summary: finalText.slice(0, 500) });
      await sb.from("code_agent_runs").update({ status: "done", finished_at: new Date().toISOString() }).eq("id", runId);
      break;
    }

    // Bump project updated_at
    await sb.from("code_projects").update({ updated_at: new Date().toISOString() }).eq("id", projectId);

    // Sync edited files to the live Cloudflare sandbox (if configured)
    let previewUrl: string | null = null;
    if (Deno.env.get("CLOUDFLARE_MANAGER_URL") && editedFiles.size > 0) {
      try {
        const { data: rows } = await sb
          .from("code_project_files")
          .select("path, content")
          .in("path", Array.from(editedFiles))
          .eq("project_id", projectId);
        const syncRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/cloudflare-sandbox`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: req.headers.get("Authorization") ?? "",
          },
          body: JSON.stringify({ action: "sync", projectId, files: rows ?? [] }),
        });
        const sj = await syncRes.json().catch(() => ({}));
        previewUrl = sj.preview_url ?? null;
      } catch (e) {
        console.error("[code-agent] sandbox sync failed", e);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, runId, message: finalText, editedFiles: Array.from(editedFiles), previewUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[code-agent] error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
