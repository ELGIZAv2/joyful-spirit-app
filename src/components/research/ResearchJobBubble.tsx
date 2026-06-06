import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { subscribeToResearchJob, approveResearchPlan, updateResearchPlan, tickResearchJob, type ResearchJob } from "@/lib/deepResearchJob";
import ResearchPlanCard from "@/components/research/ResearchPlanCard";
import DeepResearchCard from "@/components/chat/DeepResearchCard";
import { saveResearch } from "@/lib/researchPersistence";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  jobId: string;
  conversationId?: string | null;
  /** Index of this card in the conversation (for sessionKey). */
  turnIndex?: number;
}

const ResearchJobBubble = ({ jobId, conversationId, turnIndex = 0 }: Props) => {
  const [job, setJob] = useState<ResearchJob | null>(null);
  const [editing, setEditing] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [persisted, setPersisted] = useState(false);

  useEffect(() => {
    const unsub = subscribeToResearchJob(jobId, (j) => setJob(j));
    return () => unsub();
  }, [jobId]);

  useEffect(() => {
    if (!job || job.status !== "synthesizing") return;
    let stopped = false;
    const runTick = () => {
      const lastUpdate = new Date(job.updated_at).getTime();
      if (!stopped && !Number.isNaN(lastUpdate) && Date.now() - lastUpdate >= 45_000) {
        tickResearchJob(jobId).catch(() => {});
      }
    };
    runTick();
    const id = window.setInterval(runTick, 30_000);
    return () => {
      stopped = true;
      window.clearInterval(id);
    };
  }, [job, jobId]);

  // Persist final report to research_reports so the preview page can open it via sessionKey.
  useEffect(() => {
    if (!job || persisted) return;
    if (job.status !== "succeeded" || !job.report) return;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid || !conversationId) { setPersisted(true); return; }
      const sessionKey = `conv_${conversationId}_${turnIndex}`;
      await saveResearch(uid, {
        session_key: sessionKey,
        query: job.query,
        report: job.report,
        images: job.images || [],
        steps: job.steps || [],
      });
      // Persist used/unused/thinking too via direct update.
      const usedUrls = (job.sources || []).map((s) => s.url);
      await supabase.from("research_reports").update({
        used_sources: usedUrls.map((u) => ({ url: u })) as any,
        unused_sources: (job.unused_sources || []) as any,
        thinking: job.thinking,
        plan: job.plan as any,
      }).eq("user_id", uid).eq("session_key", sessionKey);
      setPersisted(true);
    })();
  }, [job, conversationId, turnIndex, persisted]);

  if (!job) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading research…
      </div>
    );
  }

  if (job.status === "failed") {
    return (
      <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-foreground/90">
        <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
        <div>{job.error || "Research failed."}</div>
      </div>
    );
  }

  if (job.status === "succeeded" && job.report) {
    const sessionKey = conversationId ? `conv_${conversationId}_${turnIndex}` : undefined;
    return (
      <DeepResearchCard
        query={job.query}
        report={job.report}
        images={job.images || []}
        sessionKey={sessionKey}
        createdAt={job.finished_at || job.created_at}
      />
    );
  }

  // Planning / awaiting approval
  if (job.status === "planning" || job.awaiting_approval || job.status === "awaiting_approval" as any) {
    const intro = job.plan_intro || "Drafting a research plan…";
    const ready = job.plan_ready || undefined;
    const planSteps = (job.plan as unknown as string[]) || [];

    const handleStart = async (editedSteps?: string[]) => {
      setBusy(true);
      try {
        await approveResearchPlan(jobId, editedSteps);
      } catch (e: any) {
        toast.error(e?.message || "Failed to start");
      } finally {
        setBusy(false);
      }
    };
    const handleSubmitEdit = async () => {
      if (!feedback.trim()) return;
      setBusy(true);
      try {
        await updateResearchPlan(jobId, feedback.trim());
        setEditing(false);
        setFeedback("");
      } catch (e: any) {
        toast.error(e?.message || "Failed to update plan");
      } finally {
        setBusy(false);
      }
    };

    return (
      <div className="space-y-3">
        {!ready && planSteps.length === 0 && (
          <p className="text-sm text-foreground/80 leading-relaxed">{intro}</p>
        )}
        {(ready || planSteps.length > 0) && (
          <ResearchPlanCard
            plan={{ goal: job.plan_goal || job.query, steps: planSteps }}
            intro={intro}
            ready={ready}
            awaitingApproval={job.awaiting_approval}
            onStart={handleStart}
            onEdit={() => setEditing(true)}
            loading={busy}
            editing={editing}
            feedback={feedback}
            onFeedbackChange={setFeedback}
            onSubmitEdit={handleSubmitEdit}
            onCancelEdit={() => { setEditing(false); setFeedback(""); }}
          />
        )}
      </div>
    );
  }

  // Running (searching / synthesizing)
  const title = (job.plan_goal || job.query || "").trim();
  const isRtl = /[\u0600-\u06FF\u0750-\u077F]/.test(title);
  const sourcesCount = Array.isArray(job.sources) ? job.sources.length : 0;

  // Determine current phase from stage text
  const stageText = (job.stage || "").toLowerCase();
  let phase: 0 | 1 | 2 = 0;
  if (/(writ|report|compos|synthes|تقرير|إنشاء|كتاب)/i.test(stageText)) phase = 2;
  else if (/(analy|reason|think|تحليل|نتائج)/i.test(stageText)) phase = 1;
  else phase = 0;

  const lines = [
    isRtl ? `جارٍ البحث في ${sourcesCount} مصدر…` : `Searching ${sourcesCount} sources…`,
    isRtl ? "جارٍ تحليل النتائج…" : "Analyzing results…",
    isRtl ? "جارٍ إنشاء تقرير كامل…" : "Writing the full report…",
  ];

  return (
    <div className="w-full max-w-[420px] rounded-3xl border border-border/40 bg-card/60 backdrop-blur-sm p-5" dir={isRtl ? "rtl" : "ltr"}>
      {title && (
        <h3 className="text-base font-semibold text-foreground leading-snug mb-3">
          {title}
        </h3>
      )}
      <ul className="space-y-2">
        {lines.map((line, i) => {
          const active = i === phase;
          const done = i < phase;
          return (
            <li
              key={i}
              className={`flex items-center gap-2.5 text-[13px] leading-relaxed transition-colors ${
                active ? "text-foreground" : done ? "text-foreground/45" : "text-foreground/35"
              }`}
            >
              <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${active ? "bg-foreground/80" : "bg-foreground/30"}`} />
              <span className="flex-1">{line}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ResearchJobBubble;
