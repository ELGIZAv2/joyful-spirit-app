// @ts-nocheck — imported design from external repo; backend wiring deferred.
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Loader2, Zap, Search, Eye, Sparkles, AlertTriangle, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Scores { performance: number; seo: number; accessibility: number; best_practices: number; }
interface Issue { id: string; title: string; description: string; score: number | null; }
interface Result {
  url: string;
  scores: Scores;
  top_issues: Issue[];
  summary: string;
  fix_prompt: string;
}

const colorFor = (score: number) => {
  if (score >= 90) return { stroke: "hsl(142 71% 45%)", text: "text-emerald-500" };
  if (score >= 50) return { stroke: "hsl(38 92% 50%)", text: "text-amber-500" };
  return { stroke: "hsl(0 84% 60%)", text: "text-red-500" };
};

function Dial({ score, label, icon }: { score: number | null; label: string; icon: React.ReactNode }) {
  const s = score ?? 0;
  const r = 38;
  const c = 2 * Math.PI * r;
  const offset = c - (s / 100) * c;
  const col = colorFor(s);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-[100px] h-[100px]">
        <svg width="100" height="100" className="-rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(var(--foreground) / 0.08)" strokeWidth="7" />
          <circle
            cx="50" cy="50" r={r} fill="none" stroke={col.stroke} strokeWidth="7"
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={score === null ? c : offset}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${col.text}`}>{score === null ? "–" : s}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
    </div>
  );
}

export default function MegsyPrSpeedPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const runAudit = async () => {
    if (!projectId) return;
    setRunning(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("speed-audit", {
        body: { project_id: projectId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResult(data as Result);
    } catch (e) {
      toast.error((e as Error).message || "Test failed");
    } finally {
      setRunning(false);
    }
  };

  const fixWithAI = async () => {
    if (!result || !projectId) return;
    const prompt = result.fix_prompt;
    try {
      const { saveProjectDraft } = await import("@/lib/projectDrafts");
      await saveProjectDraft(projectId, prompt);
      sessionStorage.setItem(`autosend:${projectId}`, "1");
    } catch { /* noop */ }
    navigate(`/build/${projectId}/chat?prompt=${encodeURIComponent(prompt)}&autosend=1`);
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <button
        onClick={() => navigate(`/build/${projectId}`)}
        aria-label="Back"
        className="fixed top-4 left-4 z-50 w-11 h-11 rounded-full grid place-items-center backdrop-blur-2xl backdrop-saturate-150 border border-foreground/10 shadow-[0_4px_16px_-6px_rgba(0,0,0,0.18)] dark:shadow-[0_4px_16px_-6px_rgba(0,0,0,0.6)] transition"
        style={{ backgroundColor: "color-mix(in oklab, hsl(var(--background)) 55%, transparent)" }}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex-1 px-4 pt-20 pb-8 overflow-y-auto">
        <div className="mb-6 text-center">
          <h1 className="text-[22px] font-bold tracking-tight">Speed & SEO</h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed whitespace-pre-line">
            A full audit of your site's performance, search-engine readiness, and accessibility — with instant results {"\n"}
          </p>
        </div>
        {/* Dials */}
        <div
          className="rounded-3xl backdrop-blur-2xl backdrop-saturate-150 border border-foreground/10 p-5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)]"
          style={{ backgroundColor: "color-mix(in oklab, hsl(var(--background)) 55%, transparent)" }}
        >
          <div className="grid grid-cols-3 gap-2">
            <Dial
              score={result?.scores.performance ?? null}
              label="Speed"
              icon={<Zap className="w-3 h-3" />}
            />
            <Dial
              score={result?.scores.seo ?? null}
              label="SEO"
              icon={<Search className="w-3 h-3" />}
            />
            <Dial
              score={result?.scores.accessibility ?? null}
              label="Accessibility"
              icon={<Eye className="w-3 h-3" />}
            />
          </div>
          {result && (
            <div className="mt-4 pt-4 border-t border-foreground/[0.06] flex items-center justify-between text-[12px]">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5" />
                Best Practices
              </div>
              <span className={`font-bold ${colorFor(result.scores.best_practices).text}`}>
                {result.scores.best_practices}/100
              </span>
            </div>
          )}
          {result && (
            <a
              href={result.url}
              target="_blank"
              rel="noreferrer"
              className="block mt-3 text-center text-[11px] text-muted-foreground truncate"
            >
              {result.url.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>

        {/* Action: Start test */}
        <button
          disabled={running}
          onClick={runAudit}
          className="mt-5 w-full h-12 rounded-2xl backdrop-blur-2xl backdrop-saturate-150 border border-foreground/10 text-foreground font-semibold text-[15px] disabled:opacity-60 flex items-center justify-center gap-2 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)] transition"
          style={{ backgroundColor: "color-mix(in oklab, hsl(var(--foreground)) 8%, transparent)" }}
        >
          {running ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Testing… (may take 30 seconds)
            </>
          ) : result ? (
            "Retest"
          ) : (
            "Start test"
          )}
        </button>

        {/* Summary */}
        {result?.summary && (
          <div
            className="mt-5 rounded-2xl backdrop-blur-2xl backdrop-saturate-150 border border-foreground/10 p-4 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)]"
            style={{ backgroundColor: "color-mix(in oklab, hsl(var(--background)) 55%, transparent)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[13px] font-semibold">AI summary</span>
            </div>
            <p className="text-[14px] leading-relaxed text-foreground/85" dir="auto">
              {result.summary}
            </p>
          </div>
        )}

        {/* Top issues */}
        {result && result.top_issues.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="text-[13px] font-semibold">Top issues</span>
            </div>
            <ul className="space-y-2">
              {result.top_issues.map((i) => (
                <li
                  key={i.id}
                  className="rounded-xl backdrop-blur-2xl backdrop-saturate-150 border border-foreground/10 p-3 shadow-[0_2px_12px_-6px_rgba(0,0,0,0.12)] dark:shadow-[0_2px_12px_-6px_rgba(0,0,0,0.45)]"
                  style={{ backgroundColor: "color-mix(in oklab, hsl(var(--background)) 55%, transparent)" }}
                >
                  <div className="text-[13px] font-semibold mb-1" dir="auto">{i.title}</div>
                  <div className="text-[11.5px] text-muted-foreground leading-relaxed" dir="auto">
                    {i.description}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Fix with AI */}
        {result?.fix_prompt && (
          <button
            onClick={fixWithAI}
            className="mt-5 w-full h-12 rounded-2xl backdrop-blur-2xl backdrop-saturate-150 border border-primary/20 text-primary font-semibold text-[15px] flex items-center justify-center gap-2 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)] transition"
            style={{ backgroundColor: "color-mix(in oklab, hsl(var(--primary)) 18%, transparent)" }}
          >
            <Sparkles className="w-4 h-4" />
            Fix with AI
          </button>
        )}

      </div>
    </div>
  );
}
