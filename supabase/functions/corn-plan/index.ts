// Megsy Corn — CEO planning edge function
// Uses Lovable AI Gateway to produce a structured plan for the user's goal.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `أنت CEO Agent في نظام Megsy Corn. مهمتك تستلم هدف المستخدم وترجع خطة منظّمة JSON فقط (بدون أي نص آخر) بالشكل ده بالظبط:

{
  "summary": "ملخص سطر واحد للهدف بالعربية",
  "deliverables": ["قائمة بالمخرجات المتوقعة (3 إلى 6 عناصر)"],
  "agents": [
    { "key": "ceo", "name": "CEO Agent", "role": "تخطيط وتنسيق" },
    { "key": "web", "name": "Web Builder", "role": "بناء الموقع" },
    { "key": "designer", "name": "Designer", "role": "لوجو وبانر وصور" },
    { "key": "marketer", "name": "Marketer", "role": "خطة ماركتينج 30 يوم" },
    { "key": "researcher", "name": "Researcher", "role": "أبحاث السوق" },
    { "key": "qa", "name": "QA", "role": "اختبار الجودة" }
  ],
  "timeline": "تقدير زمني مختصر",
  "next_steps": ["خطوات التنفيذ بترتيب أول 4 إلى 6 خطوات"]
}

اختر الوكلاء المناسبين للمهمة فقط (مش لازم كلهم). رجّع JSON صالح فقط بدون شرح.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) {
      return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const goal = String(body?.goal ?? "").trim();
    const runId = body?.runId as string | undefined;

    if (!goal || goal.length < 3) {
      return new Response(JSON.stringify({ error: "goal is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call OpenRouter
    const aiResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: goal },
        ],
        response_format: { type: "json_object" },
      }),
    });


    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits in Lovable settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Planning failed", detail: t }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const raw = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let plan: any;
    try { plan = JSON.parse(raw); } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      plan = m ? JSON.parse(m[0]) : { summary: goal, deliverables: [], agents: [], timeline: "", next_steps: [] };
    }

    // Upsert run
    let savedRun;
    if (runId) {
      const { data, error } = await supabase
        .from("corn_runs")
        .update({ goal, plan, status: "awaiting_approval" })
        .eq("id", runId).eq("user_id", userId)
        .select().single();
      if (error) throw error;
      savedRun = data;
    } else {
      const { data, error } = await supabase
        .from("corn_runs")
        .insert({ user_id: userId, goal, plan, status: "awaiting_approval" })
        .select().single();
      if (error) throw error;
      savedRun = data;
    }

    return new Response(JSON.stringify({ run: savedRun, plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("corn-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
