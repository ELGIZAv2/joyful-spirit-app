// supabase/functions/project-self-test/index.ts
// Quick static checks against ai_project_files.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "");
    if (!token) return new Response(JSON.stringify({ error: "auth_required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "auth_required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { projectId } = await req.json();
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: project } = await sb.from("projects").select("user_id").eq("id", projectId).maybeSingle();
    if (!project || (project as { user_id: string }).user_id !== user.id) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: files } = await sb.from("ai_project_files").select("path, content").eq("project_id", projectId);
    const list = (files ?? []) as Array<{ path: string; content: string }>;

    const issues: Array<{ level: "error" | "warn"; file?: string; message: string }> = [];
    const paths = new Set(list.map((f) => f.path));
    if (!paths.has("src/App.tsx") && !paths.has("src/App.jsx")) {
      issues.push({ level: "error", message: "Missing entry file: src/App.tsx" });
    }
    if (!paths.has("index.html")) {
      issues.push({ level: "warn", message: "index.html not found" });
    }
    if (!paths.has("package.json")) {
      issues.push({ level: "warn", message: "package.json not found" });
    }
    for (const f of list) {
      if (/```/.test(f.content || "")) issues.push({ level: "warn", file: f.path, message: "Markdown fences detected in source" });
    }
    const errors = issues.filter((i) => i.level === "error").length;
    const warnings = issues.filter((i) => i.level === "warn").length;
    return new Response(JSON.stringify({
      ok: errors === 0,
      fileCount: list.length,
      bundleOk: errors === 0,
      errors, warnings, issues,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
