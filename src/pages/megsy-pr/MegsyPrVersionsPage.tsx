// @ts-nocheck — imported design from external repo; backend wiring deferred.
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Loader2, RotateCcw, GitCommit, Trash2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Snapshot {
  id: string;
  label: string | null;
  file_count: number | null;
  total_bytes: number | null;
  created_at: string;
}

const fmtBytes = (b?: number | null) => {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
};

const fmtTime = (s: string) => {
  try {
    return new Date(s).toLocaleString("ar-EG", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
  } catch { return s; }
};

const truncate = (s: string, n = 80) =>
  s.length > n ? s.slice(0, n).trim() + "…" : s;

export default function MegsyPrVersionsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [items, setItems] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_project_snapshots")
      .select("id, label, file_count, total_bytes, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) toast.error(error.message);
    else setItems((data ?? []) as Snapshot[]);
    setLoading(false);
  };

  useEffect(() => { load();   }, [projectId]);

  const restore = async (snap: Snapshot) => {
    if (!projectId) return;
    setBusyId(snap.id);
    try {
      // 1. Take a safety snapshot of the CURRENT state so the user can undo the restore
      const { data: current } = await supabase
        .from("ai_project_files")
        .select("path, content")
        .eq("project_id", projectId);
      if ((current ?? []).length) {
        await supabase.from("ai_project_snapshots").insert({
          project_id: projectId,
          label: `↶ Before restoring to: ${truncate(snap.label || "version", 60)}`,
          files: current as any,
          file_count: current!.length,
          total_bytes: (current ?? []).reduce(
            (a, f: any) => a + ((f.content as string)?.length || 0), 0,
          ),
        } as any);
      }

      // 2. Load the snapshot files
      const { data: snapData, error: snapErr } = await supabase
        .from("ai_project_snapshots")
        .select("files")
        .eq("id", snap.id)
        .single();
      if (snapErr) throw snapErr;
      const files = (snapData?.files as Array<{ path: string; content: string }>) ?? [];

      // 3. Wipe + rewrite project files
      const { error: delErr } = await supabase
        .from("ai_project_files").delete().eq("project_id", projectId);
      if (delErr) throw delErr;
      if (files.length) {
        // Insert in chunks to avoid payload limits
        const chunkSize = 50;
        for (let i = 0; i < files.length; i += chunkSize) {
          const rows = files.slice(i, i + chunkSize).map((f) => ({
            project_id: projectId, path: f.path, content: f.content,
          }));
          const { error: insErr } = await supabase
            .from("ai_project_files").insert(rows);
          if (insErr) throw insErr;
        }
      }

      toast.success("Restored successfully ✓");
      setConfirmId(null);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (snap: Snapshot) => {
    if (!confirm("Delete this version permanently?")) return;
    setBusyId(snap.id);
    try {
      const { error } = await supabase
        .from("ai_project_snapshots").delete().eq("id", snap.id);
      if (error) throw error;
      toast.success("Deleted");
      setItems((s) => s.filter((x) => x.id !== snap.id));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="px-4 pt-4 pb-3 flex items-center gap-3">
        <button
          onClick={() => navigate(`/build/${projectId}`)}
          className="w-10 h-10 rounded-full grid place-items-center bg-foreground/[0.04] hover:bg-foreground/[0.08]"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 text-center">
          <div className="font-semibold text-[15px]">Versions</div>
          <div className="text-[11px] text-muted-foreground">Restore any previous version of the project</div>
        </div>
        <div className="w-10" />
      </header>

      <div className="h-px bg-foreground/[0.06]" />

      <div className="flex-1 px-4 pt-4 pb-8 overflow-y-auto">
        {loading ? (
          <div className="py-16 grid place-items-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No saved versions yet
          </div>
        ) : (
          <ul className="space-y-2.5">
            {items.map((snap, idx) => {
              const isLatest = idx === 0;
              const isConfirm = confirmId === snap.id;
              const isBusy = busyId === snap.id;
              return (
                <li
                  key={snap.id}
                  className="rounded-2xl border border-foreground/[0.08] bg-foreground/[0.02] p-3.5"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-foreground/[0.05] grid place-items-center shrink-0">
                      <GitCommit className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-[14px] truncate" dir="auto">
                          {truncate(snap.label || "version", 60)}
                        </div>
                        {isLatest && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-semibold shrink-0">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>{fmtTime(snap.created_at)}</span>
                        <span>·</span>
                        <span>{snap.file_count ?? 0} files</span>
                        {snap.total_bytes ? <><span>·</span><span>{fmtBytes(snap.total_bytes)}</span></> : null}
                      </div>
                    </div>
                  </div>

                  {!isLatest && (
                    <div className="mt-3 flex items-center gap-2">
                      {isConfirm ? (
                        <>
                          <button
                            disabled={isBusy}
                            onClick={() => restore(snap)}
                            className="flex-1 h-9 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
                          >
                            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Confirm restore
                          </button>
                          <button
                            disabled={isBusy}
                            onClick={() => setConfirmId(null)}
                            className="px-3 h-9 rounded-xl bg-foreground/[0.05] text-[13px] font-medium"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setConfirmId(snap.id)}
                            className="flex-1 h-9 rounded-xl bg-foreground/[0.05] hover:bg-foreground/[0.08] text-[13px] font-semibold flex items-center justify-center gap-1.5"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Restore to this version
                          </button>
                          <button
                            disabled={isBusy}
                            onClick={() => remove(snap)}
                            className="w-9 h-9 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive grid place-items-center"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <p className="text-[11px] text-muted-foreground/80 text-center mt-6 leading-relaxed px-4">
          When you restore, the current state is automatically saved as a new version, so you can undo the restore at any time.
        </p>
      </div>
    </div>
  );
}
