// supabase/functions/restore-version/index.ts
// Restore an ai_project_snapshots row into ai_project_files.
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

    const { projectId, versionId } = await req.json();
    if (!projectId || !versionId) {
      return new Response(JSON.stringify({ error: "projectId and versionId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: project } = await sb.from("projects").select("user_id").eq("id", projectId).maybeSingle();
    if (!project || (project as { user_id: string }).user_id !== user.id) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: snap, error: snapErr } = await sb
      .from("ai_project_snapshots")
      .select("files")
      .eq("id", versionId)
      .eq("project_id", projectId)
      .maybeSingle();
    if (snapErr || !snap) {
      return new Response(JSON.stringify({ error: "snapshot_not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const files = (snap as { files: Array<{ path: string; content: string }> }).files || [];

    // Replace all current files with the snapshot
    await sb.from("ai_project_files").delete().eq("project_id", projectId);
    if (files.length) {
      const rows = files.map((f) => ({ project_id: projectId, path: f.path, content: f.content ?? "" }));
      // Insert in chunks to avoid payload limits
      const CHUNK = 100;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const { error } = await sb.from("ai_project_files").insert(rows.slice(i, i + CHUNK));
        if (error) throw new Error(error.message);
      }
    }
    await sb.from("projects").update({ updated_at: new Date().toISOString() }).eq("id", projectId);

    return new Response(JSON.stringify({ ok: true, restored: files.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
