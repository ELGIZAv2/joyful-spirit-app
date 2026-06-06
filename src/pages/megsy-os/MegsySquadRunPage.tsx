import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/common/SEOHead";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Compass, Server, Code2, Palette, Wrench, TestTube, User, Bot, ExternalLink, Globe, Rocket } from "lucide-react";

const ROLE_META: Record<string, { icon: any; label: string; color: string }> = {
  "user": { icon: User, label: "You", color: "text-foreground" },
  "orchestrator": { icon: Bot, label: "Orchestrator", color: "text-primary" },
  "sq-architect": { icon: Compass, label: "Architect", color: "text-violet-500" },
  "sq-backend": { icon: Server, label: "Backend", color: "text-sky-500" },
  "sq-frontend": { icon: Code2, label: "Frontend", color: "text-cyan-500" },
  "sq-ui": { icon: Palette, label: "UI", color: "text-pink-500" },
  "sq-devops": { icon: Wrench, label: "DevOps", color: "text-emerald-500" },
  "sq-qa": { icon: TestTube, label: "QA", color: "text-amber-500" },
};

type Msg = {
  id: string;
  role: string;
  content: string;
  metadata: any;
  created_at: string;
};

export default function MegsySquadRunPage() {
  const { sessionId } = useParams<{ id: string; sessionId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [status, setStatus] = useState<string>("running");
  const [title, setTitle] = useState<string>("Squad run");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionId) return;
    let mounted = true;
    async function tick() {
      const [{ data: sess }, { data: msgs }] = await Promise.all([
        supabase.from("agent_sessions").select("status,title,metadata").eq("id", sessionId).single(),
        supabase.from("agent_messages").select("id,role,content,metadata,created_at").eq("session_id", sessionId).order("created_at"),
      ]);
      if (!mounted) return;
      if (sess) {
        setStatus(sess.status);
        setTitle(sess.title || "Squad run");
        setPreviewUrl((sess as any).metadata?.preview_url || null);
        setDeployUrl((sess as any).metadata?.deploy_url || null);
      }
      setMessages((msgs as any) || []);
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    tick();
    const id = setInterval(() => { if (status !== "completed") tick(); }, 3000);
    return () => { mounted = false; clearInterval(id); };
  }, [sessionId, status]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Squad Run — Megsy" description="Agent squad execution session." path={`/megsy-os/squads/run/${sessionId}`} />

      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="container max-w-4xl flex items-center justify-between py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate("/megsy-os/squads")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold truncate">{title}</h1>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                {status === "running" && <Loader2 className="h-3 w-3 animate-spin" />}
                {status}
              </p>
            </div>
          </div>
        </div>
      </header>

      {(previewUrl || deployUrl) && (
        <div className="border-b bg-muted/30">
          <div className="container max-w-4xl py-2 flex items-center gap-2 flex-wrap text-xs">
            {previewUrl && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-background border px-2 py-1">
                <Globe className="h-3 w-3 text-sky-500" />
                <span className="text-muted-foreground">Live:</span>
                <a href={previewUrl} target="_blank" rel="noreferrer" className="font-mono hover:underline">{previewUrl}</a>
                <button onClick={() => setShowPreview((v) => !v)} className="ml-1 text-muted-foreground hover:text-foreground">
                  {showPreview ? "Hide" : "Show"}
                </button>
              </span>
            )}
            {deployUrl && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-1">
                <Rocket className="h-3 w-3 text-emerald-600" />
                <span className="text-emerald-700 dark:text-emerald-400">Deployed:</span>
                <a href={deployUrl} target="_blank" rel="noreferrer" className="font-mono hover:underline">{deployUrl}</a>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </span>
            )}
          </div>
          {previewUrl && showPreview && (
            <div className="container max-w-4xl pb-3">
              <iframe
                src={previewUrl}
                className="w-full h-[420px] rounded-lg border bg-background"
                title="Live preview"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            </div>
          )}
        </div>
      )}

      <main className="container max-w-4xl py-6 space-y-3">
        {messages.length === 0 && (
          <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
            The squad is starting execution...
          </div>
        )}

        {messages.map((m) => {
          const role = m.metadata?.agent_role || (m.role === "user" ? "user" : "orchestrator");
          const meta = ROLE_META[role] || ROLE_META.orchestrator;
          const Icon = meta.icon;
          const isUser = role === "user";
          return (
            <article key={m.id} className={`rounded-xl border bg-card p-4 ${isUser ? "border-primary/30" : ""}`}>
              <header className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center justify-center h-6 w-6 rounded-md bg-muted ${meta.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className={`text-xs font-medium ${meta.color}`}>{meta.label}</span>
                {m.metadata?.delegated_to && (
                  <span className="text-[11px] text-muted-foreground">→ {m.metadata.delegated_to}</span>
                )}
                {m.metadata?.final && (
                  <span className="text-[10px] uppercase tracking-wide rounded bg-emerald-500/15 text-emerald-600 px-1.5 py-0.5">final</span>
                )}
                <span className="ms-auto text-[10px] text-muted-foreground">
                  {new Date(m.created_at).toLocaleTimeString()}
                </span>
              </header>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm">
                {m.content}
              </div>
              {m.metadata?.files?.length > 0 && (
                <div className="mt-3 pt-3 border-t flex flex-wrap gap-1.5">
                  {m.metadata.files.map((f: string) => (
                    <span key={f} className="text-[11px] rounded bg-muted px-2 py-0.5 font-mono">{f}</span>
                  ))}
                </div>
              )}
            </article>
          );
        })}
        <div ref={endRef} />
      </main>
    </div>
  );
}
