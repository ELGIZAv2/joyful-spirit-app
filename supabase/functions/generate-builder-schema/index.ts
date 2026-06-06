// Generate structured JSON for the file builders (docs, resume, report, …).
// Called by src/lib/builders/aiSchema.ts via supabase.functions.invoke.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getRouter, ROUTER_MODELS, lovableEquivalent } from "../_shared/llm-router.ts";
import { getAuthUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = ROUTER_MODELS.docs; // deepseek/deepseek-v4-flash via OpenRouter

type FileType =
  | "document" | "resume" | "report" | "spreadsheet"
  | "letter" | "roadmap" | "mindmap" | "timeline";

const SCHEMA_HINTS: Record<FileType, string> = {
  document: `{"title":"string","subtitle":"string?","language":"string?","sections":[{"heading":"string","body":"string (2-5 paragraphs, may contain '- ' bullet lines)"}]}`,
  resume: `{"name":"string","headline":"string?","contact":{"email":"?","phone":"?","location":"?","website":"?"},"summary":"?","experience":[{"role":"","company":"","period":"?","bullets":["?"]}],"education":[{"degree":"","school":"","period":"?"}],"skills":["?"],"languages":["?"],"language":"?"}`,
  report: `{"title":"string","executive_summary":"?","kpis":[{"label":"","value":"","delta":"?"}],"sections":[{"heading":"","body":"","chart":{"type":"bar|line|pie","title":"?","data":[{"name":"","value":0}]}}],"language":"?"}`,
  spreadsheet: `{"sheet_name":"string","columns":["string"],"rows":[["string|number|null"]],"totals_row":"boolean?","language":"?"}`,
  letter: `{"sender":{"name":"?","address":"?","email":"?"},"recipient":{"name":"?","address":"?"},"date":"?","subject":"?","body":"string","closing":"?","language":"?"}`,
  roadmap: `{"title":"string","horizon":"?","phases":[{"name":"","period":"?","goal":"?","items":["?"]}],"language":"?"}`,
  mindmap: `{"central_idea":"string","branches":[{"label":"","children":["?"]}],"language":"?"}`,
  timeline: `{"title":"string","orientation":"vertical|horizontal?","events":[{"date":"","title":"","description":"?"}],"language":"?"}`,
};

function buildSystem(fileType: FileType, userLanguage?: string): string {
  const lang = userLanguage || "the same language as the user's prompt (Arabic if Arabic, English if English)";
  return [
    `You are an expert ${fileType} author.`,
    `Return STRICT JSON only (no markdown, no commentary) matching this shape:`,
    SCHEMA_HINTS[fileType],
    `Write in ${lang}. Make content substantive, complete, and ready-to-use.`,
    `Never include placeholders like "TBD" or "lorem ipsum".`,
  ].join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authUser = await getAuthUser(req);
  if (!authUser) {
    return new Response(JSON.stringify({ success: false, error: "unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }


  try {
    const body = await req.json().catch(() => ({}));
    const fileType = body.fileType as FileType;
    const topic = String(body.topic ?? "").slice(0, 4000);
    const brief = body.brief;
    const userLanguage = body.userLanguage as string | undefined;
    const extraText = body.extra?.text as string | undefined;

    if (!fileType || !SCHEMA_HINTS[fileType] || !topic) {
      return new Response(JSON.stringify({ success: false, error: "missing_params" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: "missing_api_key" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userParts: string[] = [`Topic / request:\n${topic}`];
    if (brief) {
      userParts.push(`Brief / instructions:\n${typeof brief === "string" ? brief : JSON.stringify(brief)}`);
    }
    if (extraText) userParts.push(`Additional context:\n${extraText}`);

    // Primary: OpenRouter (deepseek). Fallback: Lovable Gateway (gemini equivalent).
    const router = await getRouter();
    const target = router
      ? { url: router.url, key: router.key, model: MODEL }
      : { url: LOVABLE_URL, key: apiKey, model: lovableEquivalent(MODEL) };

    const aiRes = await fetch(target.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${target.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: target.model,
        messages: [
          { role: "system", content: buildSystem(fileType, userLanguage) },
          { role: "user", content: userParts.join("\n\n") },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("[builder-schema] gateway error:", aiRes.status, txt.slice(0, 500));
      return new Response(JSON.stringify({ success: false, error: "gateway_error", status: aiRes.status }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(JSON.stringify({ success: false, error: "empty_response" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let schema: unknown;
    try {
      schema = typeof content === "string" ? JSON.parse(content) : content;
    } catch {
      // Try to extract a JSON object substring
      const m = String(content).match(/\{[\s\S]*\}/);
      if (m) {
        try { schema = JSON.parse(m[0]); } catch { /* ignore */ }
      }
    }

    if (!schema || typeof schema !== "object") {
      return new Response(JSON.stringify({ success: false, error: "invalid_json" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, schema }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[builder-schema] exception:", e);
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
