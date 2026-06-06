// supabase/functions/build-agent/index.ts
// Lightweight helper: suggests a short project name from a prompt.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { action, prompt } = await req.json();
    if (action !== "suggest_name") {
      return new Response(JSON.stringify({ ok: false, error: "unknown_action" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key || !prompt) {
      const fallback = String(prompt || "").split(/\s+/).filter(Boolean).slice(0, 3).join(" ").slice(0, 40) || "Project";
      return new Response(JSON.stringify({ ok: true, data: { name: fallback } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const r = await fetch(GATEWAY, {
      method: "POST",
      headers: { "Lovable-API-Key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Suggest a short, friendly project name (2-4 words, no punctuation, no quotes). Return ONLY the name." },
          { role: "user", content: String(prompt).slice(0, 500) },
        ],
      }),
    });
    const j = await r.json();
    const name = String(j?.choices?.[0]?.message?.content ?? "").replace(/["'\n]/g, "").trim().slice(0, 40) || "Project";
    return new Response(JSON.stringify({ ok: true, data: { name } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
