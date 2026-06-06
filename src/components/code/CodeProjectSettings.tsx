import { useCallback, useEffect, useState } from "react";
import { Loader2, Rocket, History, FileText, X, ExternalLink, RotateCcw, Database, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type V0Version = { id: string; status?: string; demoUrl?: string; createdAt?: string };

type Props = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  initialInstructions: string;
  canDeploy: boolean;
  onAfterRestore?: () => void;
  onAfterDeploy?: (url: string) => void;
};

const FN_BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

async function call(action: string, body: Record<string, unknown>) {
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token;
  const res = await fetch(`${FN_BASE}/code-v0-manage`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action, ...body }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error || `${action}_failed`);
  return j;
}

export function CodeProjectSettings({ open, onClose, projectId, initialInstructions, canDeploy, onAfterRestore, onAfterDeploy }: Props) {
  const [tab, setTab] = useState<"instructions" | "deploy" | "versions" | "integrations">("instructions");
  const [instructions, setInstructions] = useState(initialInstructions);
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [versions, setVersions] = useState<V0Version[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [connectingSb, setConnectingSb] = useState(false);
  const [sbResult, setSbResult] = useState<{ count: number; results: Array<{ key: string; ok: boolean; error?: string }> } | null>(null);

  useEffect(() => { if (open) setInstructions(initialInstructions); }, [open, initialInstructions]);

  const loadVersions = useCallback(async () => {
    setLoadingVersions(true);
    try {
      const j = await call("get-versions", { projectId });
      setVersions(j.versions || []);
      setCurrentVersionId(j.currentVersionId || null);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoadingVersions(false); }
  }, [projectId]);

  useEffect(() => { if (open && tab === "versions") loadVersions(); }, [open, tab, loadVersions]);

  const saveInstructions = async () => {
    setSaving(true);
    try {
      await call("save-instructions", { projectId, instructions });
      toast.success("Instructions saved");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const deploy = async () => {
    setDeploying(true);
    try {
      const j = await call("deploy", { projectId });
      toast.success("Published!");
      if (j.url) {
        onAfterDeploy?.(j.url);
        window.open(j.url, "_blank");
      }
    } catch (e: any) { toast.error(e.message); }
    finally { setDeploying(false); }
  };

  const restore = async (versionId: string) => {
    if (!confirm("Restore this version?")) return;
    setRestoring(versionId);
    try {
      await call("restore-version", { projectId, versionId });
      toast.success("Restored");
      onAfterRestore?.();
      await loadVersions();
    } catch (e: any) { toast.error(e.message); }
    finally { setRestoring(null); }
  };

  const connectSupabase = async () => {
    setConnectingSb(true);
    setSbResult(null);
    try {
      const j = await call("connect-supabase", { projectId });
      setSbResult({ count: j.count || 0, results: j.results || [] });
      toast.success(`Supabase linked (${j.count} variables)`);
    } catch (e: any) { toast.error(e.message); }
    finally { setConnectingSb(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 flex-shrink-0">
          <div className="font-bold text-white">Project settings</div>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex border-b border-white/10 flex-shrink-0">
          {[
            { key: "instructions", icon: FileText, label: "Instructions" },
            { key: "deploy", icon: Rocket, label: "Deploy" },
            { key: "versions", icon: History, label: "Versions" },
            { key: "integrations", icon: Database, label: "Integrations" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`px-4 py-2.5 text-xs font-medium inline-flex items-center gap-2 ${
                tab === t.key ? "text-white border-b border-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {tab === "instructions" && (
            <div className="space-y-3">
              <div className="text-xs text-white/60 leading-relaxed">
                Persistent rules v0 follows on every request for this project (similar to <code className="text-white/80">.cursorrules</code>). Example: "Use Tailwind only", "No external libraries".
              </div>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Write the rules here…"
                className="w-full h-56 bg-[#111] border border-white/10 rounded-lg p-3 text-sm text-white/90 font-mono resize-none focus:outline-none focus:border-white/30"
                dir="auto"
                maxLength={8000}
              />
              <div className="flex items-center justify-between text-[10px] text-white/40">
                <span>{instructions.length}/8000</span>
                <button onClick={saveInstructions} disabled={saving} className="bg-white text-black text-xs font-bold px-4 py-1.5 rounded-md disabled:opacity-50 inline-flex items-center gap-1.5">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
                </button>
              </div>
            </div>
          )}

          {tab === "deploy" && (
            <div className="space-y-4">
              <div className="text-xs text-white/60 leading-relaxed">
                Deploy the current version to Vercel via v0. You'll get a stable production URL you can share.
              </div>
              {!canDeploy && (
                <div className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg p-3">
                  Send the first message and wait for the first build before deploying.
                </div>
              )}
              <button
                onClick={deploy}
                disabled={!canDeploy || deploying}
                className="w-full bg-white text-black font-bold py-3 rounded-lg disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {deploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                {deploying ? "Deploying…" : "Deploy current version"}
              </button>
            </div>
          )}

          {tab === "versions" && (
            <div className="space-y-2">
              {loadingVersions ? (
                <div className="text-center py-10 text-white/40"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
              ) : versions.length === 0 ? (
                <div className="text-center py-10 text-white/40 text-sm">No versions yet.</div>
              ) : (
                versions.map((v) => (
                  <div key={v.id} className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${
                    currentVersionId === v.id ? "bg-white/5 border-white/30" : "bg-[#111] border-white/10"
                  }`}>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-mono text-white/80 truncate">{v.id}</div>
                      <div className="text-[10px] text-white/40 mt-0.5">
                        {v.createdAt ? new Date(v.createdAt).toLocaleString() : "—"}
                        {currentVersionId === v.id && <span className="ml-2 text-emerald-400">• current</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {v.demoUrl && (
                        <a href={v.demoUrl} target="_blank" rel="noreferrer" className="text-white/60 hover:text-white p-1.5">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {currentVersionId !== v.id && (
                        <button
                          onClick={() => restore(v.id)}
                          disabled={!!restoring}
                          className="text-xs text-white/80 hover:text-white border border-white/10 hover:border-white/30 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {restoring === v.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "integrations" && (
            <div className="space-y-4">
              <div className="text-xs text-white/60 leading-relaxed">
                Automatically link the current Supabase project to the v0 project. Environment variables (URL + Anon Key) get injected so the generated code can talk to Supabase directly.
              </div>
              <div className="bg-[#111] border border-white/10 rounded-lg p-3 space-y-1.5 text-[11px] font-mono text-white/60">
                <div>• VITE_SUPABASE_URL</div>
                <div>• VITE_SUPABASE_PUBLISHABLE_KEY</div>
                <div>• VITE_SUPABASE_PROJECT_ID</div>
                <div>• NEXT_PUBLIC_SUPABASE_URL</div>
                <div>• NEXT_PUBLIC_SUPABASE_ANON_KEY</div>
              </div>
              <button
                onClick={connectSupabase}
                disabled={!canDeploy || connectingSb}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-lg disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {connectingSb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                {connectingSb ? "Linking…" : "Link Supabase to v0"}
              </button>
              {!canDeploy && (
                <div className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg p-3">
                  Send the first message and wait for the v0 project to be created first.
                </div>
              )}
              {sbResult && (
                <div className="space-y-1">
                  {sbResult.results.map((r) => (
                    <div key={r.key} className={`flex items-center gap-2 text-[11px] font-mono ${r.ok ? "text-emerald-400" : "text-red-400"}`}>
                      {r.ok ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {r.key}{r.error ? `: ${r.error.slice(0, 60)}` : ""}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
