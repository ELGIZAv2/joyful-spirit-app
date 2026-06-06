// supabase/functions/github-import/index.ts
// Stub — GitHub import not enabled in this build.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  return new Response(JSON.stringify({
    error: "GitHub import isn't configured yet. Connect a GitHub account first.",
  }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
