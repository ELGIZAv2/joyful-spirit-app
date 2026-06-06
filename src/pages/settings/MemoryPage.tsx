// Memory — Persistent Memory (Letta) only.
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Trash2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/settings/DesktopSettingsLayout";
import { BackIcon } from "@/components/settings/SettingsIcons";
import { Switch } from "@/components/ui/switch";
import { goBackOr } from "@/lib/navigation";

interface LettaCoreBlock { id?: string; label: string; value: string; limit?: number }
interface LettaPassage { id: string; text: string; created_at?: string }
interface LettaState {
  initialized: boolean;
  enabled: boolean;
  core: LettaCoreBlock[];
  archival: LettaPassage[];
}

const MemoryPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Letta persistent memory state
  const [letta, setLetta] = useState<LettaState | null>(null);
  const [lettaLoading, setLettaLoading] = useState(true);
  const [lettaBusy, setLettaBusy] = useState(false);
  const [deletingPassageId, setDeletingPassageId] = useState<string | null>(null);

  useEffect(() => { loadLetta(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const lettaCall = async (action: string, method: string, body?: any, extraQuery?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const qs = `?action=${action}${extraQuery ? `&${extraQuery}` : ""}`;
    const res = await fetch(
      `${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/letta${qs}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      }
    );
    const text = await res.text();
    const parsed = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(parsed?.error || `HTTP ${res.status}`);
    return parsed;
  };

  const loadLetta = async () => {
    setLettaLoading(true);
    try {
      const data = await lettaCall("list", "GET");
      setLetta(data as LettaState);
    } catch (e) {
      console.error("Failed to load Letta memory:", e);
      setLetta({ initialized: false, enabled: false, core: [], archival: [] });
    } finally {
      setLettaLoading(false);
    }
  };

  const handleInitLetta = async () => {
    setLettaBusy(true);
    try {
      await lettaCall("init", "POST", {});
      toast.success("Persistent memory activated");
      await loadLetta();
    } catch (e: any) {
      toast.error(e?.message || "Failed to activate memory");
    } finally {
      setLettaBusy(false);
    }
  };

  const handleToggleLetta = async (enabled: boolean) => {
    setLettaBusy(true);
    try {
      await lettaCall("toggle", "PATCH", { enabled });
      setLetta((s) => s ? { ...s, enabled } : s);
      toast.success(enabled ? "Memory enabled" : "Memory paused");
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setLettaBusy(false);
    }
  };

  const handleDeletePassage = async (id: string) => {
    setDeletingPassageId(id);
    try {
      await lettaCall("passage", "DELETE", undefined, `passage_id=${encodeURIComponent(id)}`);
      setLetta((s) => s ? { ...s, archival: s.archival.filter((p) => p.id !== id) } : s);
      toast.success("Memory removed");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete");
    } finally {
      setDeletingPassageId(null);
    }
  };

  const handleResetLetta = async () => {
    if (!confirm("Reset persistent memory? The AI will forget everything it learned about you.")) return;
    setLettaBusy(true);
    try {
      await lettaCall("reset", "DELETE");
      toast.success("Memory reset");
      setLetta({ initialized: false, enabled: false, core: [], archival: [] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to reset");
    } finally {
      setLettaBusy(false);
    }
  };

  

  const Body = () => (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
      {/* ── Unified Persistent Memory hero card ───────────────────────── */}
      <section className="mb-8 p-5 rounded-3xl bg-card/60 border border-border">
        <div className="flex items-start justify-end mb-4">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-300">Beta</span>
        </div>


        <h2 className="text-lg font-medium text-foreground mb-2">Persistent Memory</h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-5">
          Important details Megsy learns about you are stored privately to personalize your experience over time.
        </p>

        {lettaLoading ? (
          <div className="flex justify-center py-2">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : !letta?.initialized ? (
          <button
            onClick={handleInitLetta}
            disabled={lettaBusy}
            className="w-full py-3 px-4 bg-foreground text-background font-semibold rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {lettaBusy && <Loader2 className="w-4 h-4 animate-spin" />}
            Activate persistent memory
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${letta.enabled ? "bg-emerald-400" : "bg-muted-foreground/40"}`} />
                <p className="text-sm text-foreground">{letta.enabled ? "Active" : "Paused"}</p>
              </div>
              <Switch checked={letta.enabled} onCheckedChange={handleToggleLetta} disabled={lettaBusy} />
            </div>

            {letta.core.length > 0 && (
              <div className="space-y-2">
                {letta.core.map((b, i) => (
                  <div key={b.id || i} className="rounded-xl bg-muted/40 px-3 py-2.5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 mb-1">{b.label}</p>
                    <p className="text-[13px] text-foreground leading-relaxed whitespace-pre-wrap">{b.value || <span className="text-muted-foreground italic">empty</span>}</p>
                  </div>
                ))}
              </div>
            )}

            {letta.archival.length > 0 && (
              <div className="rounded-2xl border border-border divide-y divide-border">
                {letta.archival.map((p) => (
                  <div key={p.id} className="flex items-start justify-between gap-2 px-3 py-2.5 group">
                    <p className="text-[13px] text-foreground/90 leading-relaxed flex-1">{p.text}</p>
                    <button
                      onClick={() => handleDeletePassage(p.id)}
                      disabled={deletingPassageId === p.id}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                      aria-label="Delete"
                    >
                      {deletingPassageId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleResetLetta}
              disabled={lettaBusy}
              className="text-[11px] font-medium text-destructive/80 hover:text-destructive transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" /> Reset persistent memory
            </button>
          </div>
        )}
      </section>

    </motion.div>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="Memory" subtitle="Your personalized AI memory">
        <Body />
      </DesktopSettingsLayout>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="max-w-2xl mx-auto px-5 pb-16">
        <div className="flex items-center gap-3 py-4">
          <button onClick={() => goBackOr(navigate, "/settings")} className="w-9 h-9 grid place-items-center rounded-xl text-foreground/70 hover:bg-muted/50 transition-colors" aria-label="Back">
            <BackIcon className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-foreground">Memory</h1>
        </div>
        <Body />
      </div>
    </div>
  );
};

export default MemoryPage;
