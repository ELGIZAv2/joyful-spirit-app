// e2b-data-analysis: run pandas/numpy/matplotlib data analysis on an uploaded dataset.
// Body: { code, dataset?: { name, contentBase64 }, datasets?: [...], timeout_sec?, conversation_id? }
// The user's code receives uploaded files at /tmp/<name>. Charts are auto-collected.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};
import { runInSandbox } from "../_shared/e2b.ts";
import { serviceClient, getUserId, uploadFiles } from "../_shared/e2b-storage.ts";

const PREAMBLE = `
import subprocess, sys
subprocess.run([sys.executable, "-m", "pip", "install", "-q",
  "pandas", "numpy", "matplotlib", "openpyxl"], check=True)
import pandas as pd, numpy as np, matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const userId = await getUserId(req);
    if (!userId) return json(401, { error: "auth_required" });

    const body = await req.json().catch(() => null);
    if (!body?.code || typeof body.code !== "string") {
      return json(400, { error: "code is required" });
    }

    const inputFiles: Array<{ path: string; contentBase64: string }> = [];
    const datasets = body.datasets ?? (body.dataset ? [body.dataset] : []);
    for (const d of datasets) {
      if (!d?.name || !d?.contentBase64) continue;
      const safe = String(d.name).replace(/[^\w.\-]/g, "_");
      inputFiles.push({ path: `/tmp/${safe}`, contentBase64: d.contentBase64 });
    }

    const timeoutSec = Math.min(Math.max(Number(body.timeout_sec) || 180, 10), 300);

    const supabase = serviceClient();
    const { data: execRow, error: insErr } = await supabase
      .from("e2b_executions").insert({
        user_id: userId,
        conversation_id: body.conversation_id ?? null,
        kind: "data_analysis",
        language: "python",
        status: "running",
        input: { code: body.code, dataset_names: datasets.map((d: any) => d?.name) },
      }).select("id").single();
    if (insErr || !execRow) return json(500, { error: "failed to create execution" });

    try {
      const result = await runInSandbox({
        code: `${PREAMBLE}\n${body.code}`,
        language: "python",
        inputFiles,
        outputFiles: body.output_files,
        timeoutSec,
      });

      const uploaded = await uploadFiles(supabase, userId, execRow.id, result.files);

      await supabase.from("e2b_executions").update({
        status: result.error ? "failed" : "succeeded",
        stdout: result.stdout, stderr: result.stderr,
        error: result.error ?? null, files: uploaded,
        result: { results: result.results },
        duration_ms: result.duration_ms,
      }).eq("id", execRow.id);

      return json(200, {
        execution_id: execRow.id,
        stdout: result.stdout,
        stderr: result.stderr,
        error: result.error,
        results: result.results,
        files: uploaded,
        duration_ms: result.duration_ms,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await supabase.from("e2b_executions").update({ status: "failed", error: msg }).eq("id", execRow.id);
      return json(500, { execution_id: execRow.id, error: msg });
    }
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : String(e) });
  }
});
