// supabase/functions/index-project-files/index.ts
// Stub — vector indexing not yet enabled. Returns a no-op success so the UI button works.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { projectId } = await req.json();
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { count } = await sb.from("ai_project_files").select("id", { count: "exact", head: true }).eq("project_id", projectId);
    return new Response(JSON.stringify({ ok: true, indexed: count ?? 0, failed: 0, note: "vector_index_disabled" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
