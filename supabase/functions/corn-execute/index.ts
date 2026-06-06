// Megsy Corn — execute approved plan in the background.
// Spawns agents, simulates parallel work, writes progress events to corn_events.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// @ts-ignore
const waitUntil = (p: Promise<unknown>) => (globalThis as any).EdgeRuntime?.waitUntil?.(p) ?? p;

const AGENT_SCRIPTS: Record<string, { steps: string[]; result: any }> = {
  ceo: {
    steps: ["تنسيق المهام بين الوكلاء", "مراجعة المخرجات", "تجميع التقرير النهائي"],
    result: { type: "report", text: "تم تنسيق العمل بنجاح." },
  },
  web: {
    steps: ["تحضير قالب الموقع", "إنشاء الصفحات الأساسية", "نشر نسخة Preview"],
    result: { type: "link", title: "Preview الموقع", url: "https://preview.megsy.app/demo" },
  },
  designer: {
    steps: ["استخراج هوية البراند", "تصميم اللوجو", "إنشاء البانر وصور السوشيال"],
    result: { type: "asset", title: "هوية البراند", count: 6 },
  },
  marketer: {
    steps: ["تحليل الجمهور", "بناء خطة 30 يوم", "كتابة الكابشنز"],
    result: { type: "doc", title: "خطة ماركتينج 30 يوم.pdf" },
  },
  researcher: {
    steps: ["جمع بيانات المنافسين", "تحليل الاتجاهات", "تجميع التقرير"],
    result: { type: "doc", title: "تقرير السوق.pdf" },
  },
  qa: {
    steps: ["فحص الروابط", "اختبار الواجهة", "تقرير الجودة النهائي"],
    result: { type: "report", text: "كل الاختبارات نجحت ✓" },
  },
};

async function runAgent(supabase: any, runId: string, agentId: string, key: string) {
  const script = AGENT_SCRIPTS[key] ?? AGENT_SCRIPTS.ceo;
  await supabase.from("corn_agents").update({
    status: "running", started_at: new Date().toISOString(), current_task: script.steps[0], progress: 5,
  }).eq("id", agentId);
  await supabase.from("corn_events").insert({
    run_id: runId, agent_id: agentId, kind: "started", payload: { task: script.steps[0] },
  });

  for (let i = 0; i < script.steps.length; i++) {
    await new Promise((r) => setTimeout(r, 2500 + Math.random() * 2000));
    const progress = Math.round(((i + 1) / script.steps.length) * 95);
    const task = script.steps[i];
    await supabase.from("corn_agents").update({ progress, current_task: task }).eq("id", agentId);
    await supabase.from("corn_events").insert({
      run_id: runId, agent_id: agentId, kind: "progress", payload: { task, progress },
    });
  }

  await supabase.from("corn_agents").update({
    status: "done", progress: 100, completed_at: new Date().toISOString(), result: script.result, current_task: "تم",
  }).eq("id", agentId);
  await supabase.from("corn_events").insert({
    run_id: runId, agent_id: agentId, kind: "completed", payload: script.result,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const { runId } = await req.json();
    if (!runId) {
      return new Response(JSON.stringify({ error: "runId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: run, error: rErr } = await admin.from("corn_runs").select("*").eq("id", runId).eq("user_id", userId).maybeSingle();
    if (rErr || !run) {
      return new Response(JSON.stringify({ error: "Run not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const plan = run.plan || {};
    const planAgents = Array.isArray(plan.agents) && plan.agents.length > 0
      ? plan.agents
      : [
          { key: "ceo", name: "CEO Agent", role: "تنسيق" },
          { key: "web", name: "Web Builder", role: "موقع" },
          { key: "designer", name: "Designer", role: "تصميم" },
        ];

    // Create agent rows
    const inserts = planAgents.map((a: any) => ({
      run_id: runId,
      agent_key: a.key || "ceo",
      name: a.name || "Agent",
      role: a.role || "",
      status: "pending",
      progress: 0,
    }));
    const { data: agentRows, error: aErr } = await admin.from("corn_agents").insert(inserts).select();
    if (aErr) throw aErr;

    await admin.from("corn_runs").update({ status: "running", approved_at: new Date().toISOString() }).eq("id", runId);
    await admin.from("corn_events").insert({ run_id: runId, kind: "run_started", payload: { agents: agentRows.length } });

    // Run all agents in parallel in background
    waitUntil(
      Promise.all(agentRows.map((row: any) => runAgent(admin, runId, row.id, row.agent_key))).then(async () => {
        await admin.from("corn_runs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", runId);
        await admin.from("corn_events").insert({ run_id: runId, kind: "run_completed", payload: {} });
      }).catch(async (e) => {
        console.error("agent run failed:", e);
        await admin.from("corn_runs").update({ status: "failed" }).eq("id", runId);
      })
    );

    return new Response(JSON.stringify({ ok: true, agents: agentRows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("corn-execute error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
