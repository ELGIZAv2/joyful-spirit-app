// Deep Research background-job client helper with plan-approval flow.
import { supabase } from "@/integrations/supabase/client";

export type ResearchJobStatus =
  | "queued"
  | "planning"
  | "awaiting_approval"
  | "searching"
  | "synthesizing"
  | "succeeded"
  | "failed"
  | "cancelled";

export interface ResearchSource {
  title: string;
  url: string;
  snippet?: string;
  query?: string;
}

export interface ResearchJob {
  id: string;
  user_id: string;
  conversation_id: string | null;
  query: string;
  language: string | null;
  status: ResearchJobStatus;
  progress: number;
  stage: string | null;
  plan: string[];
  plan_goal: string | null;
  plan_intro: string | null;
  plan_ready: string | null;
  awaiting_approval: boolean;
  needs_images: boolean;
  steps: Array<Record<string, unknown>>;
  sources: ResearchSource[];
  unused_sources: ResearchSource[];
  images: string[];
  report: string | null;
  thinking: string | null;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  created_at: string;
  updated_at: string;
}

interface StartCommon {
  query: string;
  language?: string | null;
  conversationId?: string | null;
  depth?: "lite" | "medium" | "max";
}

/** Plan-only: returns jobId once plan is being drafted; subscribe for the plan. */
export async function planResearchJob(opts: StartCommon): Promise<string> {
  const { data, error } = await supabase.functions.invoke("deep-research-job", {
    body: { action: "plan", query: opts.query, language: opts.language ?? null, conversationId: opts.conversationId ?? null, depth: opts.depth ?? "medium" },
  });
  if (error) throw error;
  const jobId = (data as { jobId?: string })?.jobId;
  if (!jobId) throw new Error("No jobId returned");
  return jobId;
}

/** Legacy: plan + auto-run pipeline. */
export async function startResearchJob(opts: StartCommon): Promise<string> {
  const { data, error } = await supabase.functions.invoke("deep-research-job", {
    body: { action: "start", query: opts.query, language: opts.language ?? null, conversationId: opts.conversationId ?? null, depth: opts.depth ?? "medium" },
  });
  if (error) throw error;
  const jobId = (data as { jobId?: string })?.jobId;
  if (!jobId) throw new Error("No jobId returned");
  return jobId;
}

/** Approve a plan and kick off the full pipeline. */
export async function approveResearchPlan(jobId: string, editedSteps?: string[]): Promise<void> {
  const { error } = await supabase.functions.invoke("deep-research-job", {
    body: { action: "approve", jobId, editedSteps },
  });
  if (error) throw error;
}

/** Ask the AI to revise the plan from natural-language feedback. */
export async function updateResearchPlan(jobId: string, feedback: string): Promise<void> {
  const { error } = await supabase.functions.invoke("deep-research-job", {
    body: { action: "update_plan", jobId, feedback },
  });
  if (error) throw error;
}

export async function cancelResearchJob(jobId: string): Promise<void> {
  await supabase.functions.invoke("deep-research-job", { body: { action: "cancel", jobId } });
}

export async function tickResearchJob(jobId: string): Promise<void> {
  if (!jobId) return;
  try {
    await supabase.functions.invoke("deep-research-job", { body: { action: "tick", jobId } });
  } catch {
    /* best-effort watchdog ping */
  }
}

export async function getResearchJob(jobId: string): Promise<ResearchJob | null> {
  const { data, error } = await supabase.from("research_jobs").select("*").eq("id", jobId).maybeSingle();
  if (error) throw error;
  return (data as unknown as ResearchJob) ?? null;
}

export function subscribeToResearchJob(jobId: string, onUpdate: (job: ResearchJob) => void): () => void {
  // Unique channel name per subscription to avoid "cannot add callbacks after subscribe()"
  // when the same jobId is subscribed multiple times (e.g. effect re-runs).
  const channelName = `research_job_${jobId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const channel = supabase.channel(channelName).on(
    "postgres_changes",
    { event: "*", schema: "public", table: "research_jobs", filter: `id=eq.${jobId}` },
    (payload) => {
      const row = (payload.new ?? payload.old) as ResearchJob | undefined;
      if (row) onUpdate(row);
    },
  ).subscribe();
  getResearchJob(jobId).then((j) => j && onUpdate(j));
  return () => { supabase.removeChannel(channel); };
}

// Backward-compat: runResearchJob now uses legacy auto pipeline.
export interface StartOptions extends StartCommon {}
export async function runResearchJob(
  opts: StartOptions & { onProgress?: (job: ResearchJob) => void; signal?: AbortSignal },
): Promise<ResearchJob> {
  const jobId = await startResearchJob(opts);
  return new Promise<ResearchJob>((resolve, reject) => {
    let settled = false;
    const unsubscribe = subscribeToResearchJob(jobId, (job) => {
      opts.onProgress?.(job);
      if (settled) return;
      if (job.status === "succeeded" || job.status === "failed" || job.status === "cancelled") {
        settled = true;
        unsubscribe();
        if (job.status === "succeeded") resolve(job);
        else reject(new Error(job.error || `Research ${job.status}`));
      }
    });
    if (opts.signal) {
      opts.signal.addEventListener("abort", () => {
        if (settled) return;
        settled = true; unsubscribe();
        cancelResearchJob(jobId).catch(() => {});
        reject(new DOMException("Aborted", "AbortError"));
      });
    }
  });
}
