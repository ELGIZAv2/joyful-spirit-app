import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, FileCode, Loader2, RefreshCw, Send, Settings, Sparkles, Trash2, Globe, Cloud } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import type { ProjectFile } from "@/lib/codeRuntime";
import { toast } from "sonner";
import { AgentLiveTimeline } from "@/components/code/AgentLiveTimeline";
import { CodeProjectSettings } from "@/components/code/CodeProjectSettings";

type ModelTier = "lite" | "smart" | "pro" | "pro-turbo";
type Project = { id: string; name: string; entry_file: string; owner_id: string; initial_prompt: string | null; preview_url?: string | null; published_url?: string | null; model_tier?: ModelTier | null; instructions?: string | null; v0_chat_id?: string | null };

const TIER_OPTIONS: { value: ModelTier; label: string; hint: string }[] = [
  { value: "lite", label: "Megsy Lite", hint: "Fastest & cheapest" },
  { value: "smart", label: "Megsy Smart", hint: "Balanced default" },
  { value: "pro", label: "Megsy Pro", hint: "High quality" },
  { value: "pro-turbo", label: "Megsy Pro Turbo", hint: "Quality & speed" },
];
type Message = { id: string; role: string; content: string | null; created_at: string };


export default function CodeWorkspacePage() {
  const { projectId = "" } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"preview" | "files">("preview");
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [sandbox, setSandbox] = useState<{ preview_url: string | null; status: string } | null>(null);
  const [bootingSandbox, setBootingSandbox] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [modelTier, setModelTier] = useState<ModelTier>("smart");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [liveActivity, setLiveActivity] = useState<Array<{ kind: string; text: string; t: number }>>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const autoSentRef = useRef(false);

  // Load project + files + messages + sandbox row
  const reload = useCallback(async () => {
    const [{ data: p }, { data: f }, { data: m }, { data: s }] = await Promise.all([
      supabase.from("code_projects").select("id,name,entry_file,owner_id,initial_prompt,preview_url,published_url,model_tier,instructions,v0_chat_id").eq("id", projectId).maybeSingle(),
      supabase.from("code_project_files").select("path,content").eq("project_id", projectId).order("path"),
      supabase.from("code_messages").select("id,role,content,created_at").eq("project_id", projectId).order("created_at").limit(200),
      supabase.from("code_project_sandboxes").select("preview_url,status").eq("project_id", projectId).maybeSingle(),
    ]);
    if (!p) {
      toast.error("Project not found");
      navigate("/code");
      return;
    }
    setProject(p as Project);
    if ((p as Project).model_tier) setModelTier((p as Project).model_tier as ModelTier);
    setFiles((f ?? []) as ProjectFile[]);
    setMessages((m ?? []).filter((x) => x.role !== "tool") as Message[]);
    setSandbox(s as { preview_url: string | null; status: string } | null);
    setLoading(false);
  }, [projectId, navigate]);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    // Use 'auto' (not smooth) to avoid jank during heavy streaming
    chatEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [messages.length]);

  const previewUrl = project?.preview_url || null;

  const bootSandbox = useCallback(async () => {
    setBootingSandbox(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const res = await fetch(`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/cloudflare-sandbox`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "sync", projectId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.message || j.error || "boot_failed");
      toast.success("Preview environment ready");
      await reload();
    } catch (e: any) {
      toast.error(e.message || "Failed to start preview environment");
    } finally {
      setBootingSandbox(false);
    }
  }, [projectId, reload]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setInput("");
    setSending(true);
    setTab("preview");
    const tempId = `tmp-${Date.now()}`;
    const assistantTempId = `tmp-asst-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, role: "user", content: trimmed, created_at: new Date().toISOString() },
      { id: assistantTempId, role: "assistant", content: "", created_at: new Date().toISOString() },
    ]);
    let assistantBuffer = "";
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const res = await fetch(`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/code-v0-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ projectId, message: trimmed, modelTier }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `agent_error_${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let editedCount = 0;

      // Throttle assistant updates with rAF so we don't re-render on every SSE chunk
      let rafScheduled = false;
      const updateAssistant = () => {
        if (rafScheduled) return;
        rafScheduled = true;
        requestAnimationFrame(() => {
          rafScheduled = false;
          let text = assistantBuffer.replace(/```[\s\S]*?```/g, "");
          const lastOpen = text.lastIndexOf("```");
          if (lastOpen !== -1) text = text.slice(0, lastOpen);
          const display = text.trim();
          setMessages((prev) => prev.map((m) => m.id === assistantTempId ? { ...m, content: display } : m));
        });
      };

      const handleEvent = (event: string, dataStr: string) => {
        let data: any = {};
        try { data = JSON.parse(dataStr); } catch { return; }
        if (event === "run" && data.runId) setCurrentRunId(data.runId);
        else if (event === "delta" && typeof data.text === "string") {
          assistantBuffer += data.text;
          updateAssistant();
        } else if (event === "preview" && data.url) {
          setProject((p) => p ? { ...p, preview_url: data.url } : p);
          setPreviewKey((k) => k + 1);
        } else if (event === "file" && data.path) {
          editedCount += 1;
          // Immutable update — never mutate previous array (was breaking React reconciliation)
          setFiles((prev) => {
            const filtered = prev.filter((f) => f.path !== data.path);
            return [...filtered, { path: data.path, content: data.content }].sort((a, b) => a.path.localeCompare(b.path));
          });
        } else if (event === "status" && data.text) {
          setLiveActivity((prev) => [...prev.slice(-20), { kind: "status", text: data.text, t: Date.now() }]);
        } else if (event === "tool_use") {
          const name = data.name || data.tool || "tool";
          const arg = data.input ? ` · ${JSON.stringify(data.input).slice(0, 60)}` : "";
          setLiveActivity((prev) => [...prev.slice(-20), { kind: "tool", text: `${name}${arg}`, t: Date.now() }]);
        } else if (event === "thinking" && (data.text || data.delta)) {
          setLiveActivity((prev) => [...prev.slice(-20), { kind: "thinking", text: String(data.text || data.delta).slice(0, 140), t: Date.now() }]);
        } else if (event === "model" && data.tier) {
          setLiveActivity((prev) => [...prev.slice(-20), { kind: "model", text: `Model: ${data.tier}`, t: Date.now() }]);
        } else if (event === "chat_created" && data.chatId) {
          setLiveActivity((prev) => [...prev.slice(-20), { kind: "v0", text: `v0 chat: ${String(data.chatId).slice(0, 10)}…`, t: Date.now() }]);
        } else if (event === "done") {
          if (editedCount) {
            toast.success(`Updated ${editedCount} file(s)`);
            try { import("@/lib/ahaTracker").then((m) => m.triggerAha("code")); } catch { /* noop */ }
          }
          setLiveActivity([]);
          reload();
        } else if (event === "error") {
          toast.error(data.message || "agent error");
          setLiveActivity([]);
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const blocks = buf.split("\n\n");
        buf = blocks.pop() || "";
        for (const block of blocks) {
          const lines = block.split("\n");
          let event = "message";
          let data = "";
          for (const ln of lines) {
            if (ln.startsWith("event:")) event = ln.slice(6).trim();
            else if (ln.startsWith("data:")) data += ln.slice(5).trim();
          }
          if (data) handleEvent(event, data);
        }
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "An error occurred during build");
    } finally {
      setSending(false);
    }
  }, [projectId, sending, reload]);


  // Auto-send initial prompt once
  useEffect(() => {
    if (!loading && project && params.get("autosend") === "1" && project.initial_prompt && !autoSentRef.current) {
      autoSentRef.current = true;
      const np = new URLSearchParams(params);
      np.delete("autosend");
      setParams(np, { replace: true });
      sendMessage(project.initial_prompt);
    }
  }, [loading, project, params, setParams, sendMessage]);

  const [publishing, setPublishing] = useState(false);
  const publish = useCallback(async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const res = await fetch(`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/cloudflare-deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ project_id: projectId, source: "code" }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "publish_failed");
      toast.success("Published!");
      window.open(j.url, "_blank");
      await reload();
    } catch (e: any) {
      toast.error(e.message || "Publish failed");
    } finally {
      setPublishing(false);
    }
  }, [projectId, publishing, reload]);

  const deleteProject = async () => {
    if (!confirm("Delete this project permanently?")) return;
    await supabase.from("code_projects").delete().eq("id", projectId);
    toast.success("Deleted");
    navigate("/code");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-[#050505] text-white flex flex-col overflow-hidden">
      <Helmet><title>{project?.name} · Megsy Code</title></Helmet>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Playfair Display', serif; }
        .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
      `}</style>

      {/* Top bar */}
      <header className="border-b border-white/10 px-3 md:px-4 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/code" className="text-white/50 hover:text-white shrink-0"><ArrowLeft className="w-4 h-4" /></Link>
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0"><div className="w-3 h-3 bg-black rotate-45" /></div>
          <div className="min-w-0">
            <div className="font-display text-sm md:text-base font-bold truncate">{project?.name}</div>
            <div className="text-[10px] text-white/40 font-mono truncate">{project?.id.slice(0, 8)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPreviewKey((k) => k + 1)} className="text-xs text-white/60 hover:text-white inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-white/10 hover:border-white/30">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={() => setSettingsOpen(true)} className="text-xs text-white/60 hover:text-white inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-white/10 hover:border-white/30">
            <Settings className="w-3.5 h-3.5" /> Settings
          </button>
          <button onClick={publish} disabled={publishing} className="text-xs text-black bg-white inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold hover:bg-white/90 disabled:opacity-50">
            {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />} {publishing ? "Publishing…" : project?.published_url ? "Republish" : "Publish"}
          </button>
          {project?.published_url && (
            <a href={project.published_url} target="_blank" rel="noreferrer" className="text-xs text-white/60 hover:text-white inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-white/10 hover:border-white/30">
              <Cloud className="w-3.5 h-3.5" /> Live
            </a>
          )}
          <button onClick={deleteProject} className="text-white/40 hover:text-red-400 p-1.5"><Trash2 className="w-4 h-4" /></button>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex min-h-0 flex-col md:flex-row">
        {/* Chat */}
        <aside className="w-full md:w-[380px] border-l border-white/10 flex flex-col min-h-0 max-h-[50vh] md:max-h-none">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-white/40 text-sm py-10">
                <Sparkles className="w-5 h-5 mx-auto mb-3 text-white/30" />
                Describe what you want to build or change.
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "flex justify-start" : "flex justify-end"}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user" ? "bg-white text-black" : "bg-[#111] border border-white/10 text-white/90"
                }`}>{m.content}</div>
              </div>
            ))}
            {currentRunId && <AgentLiveTimeline runId={currentRunId} />}
            {sending && liveActivity.length > 0 && (
              <div className="flex justify-end">
                <div className="max-w-[90%] bg-[#0d0d0d] border border-white/10 rounded-xl px-3 py-2 space-y-1">
                  {liveActivity.slice(-6).map((e, i) => (
                    <div key={`${e.t}-${i}`} className="flex items-center gap-2 text-[11px] text-white/60">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        e.kind === "tool" ? "bg-emerald-400" :
                        e.kind === "thinking" ? "bg-amber-400" :
                        e.kind === "v0" ? "bg-sky-400" :
                        e.kind === "model" ? "bg-violet-400" : "bg-white/40"
                      }`} />
                      <span className="font-mono truncate">{e.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {sending && (
              <div className="flex justify-end">
                <div className="bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-sm text-white/60 inline-flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Squad is working…
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="border-t border-white/10 p-3 flex-shrink-0 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-white/40">
              <label className="font-mono uppercase tracking-wider">Model</label>
              <select
                value={modelTier}
                onChange={(e) => setModelTier(e.target.value as ModelTier)}
                disabled={sending}
                className="bg-[#111] border border-white/10 rounded-md px-2 py-1 text-[11px] text-white/80 focus:outline-none focus:border-white/30 disabled:opacity-50"
              >
                {TIER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-[#111]">{o.label} — {o.hint}</option>
                ))}
              </select>
            </div>
            <div className="bg-[#111] border border-white/10 rounded-xl p-2 flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && (typeof window === 'undefined' || window.innerWidth >= 768)) { e.preventDefault(); sendMessage(input); }
                }}
                placeholder="Request a change or a new feature…"
                className="flex-1 bg-transparent text-sm resize-none focus:outline-none placeholder:text-white/30 h-16 max-h-32"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={sending || !input.trim()}
                className="bg-white text-black rounded-lg p-2 disabled:opacity-30 active:scale-95"
              ><Send className="w-4 h-4 -scale-x-100" /></button>
            </div>
          </div>
        </aside>


        {/* Preview / Files */}
        <section className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
          <div className="flex border-b border-white/10 flex-shrink-0">
            <button onClick={() => setTab("preview")} className={`px-4 py-2 text-xs font-medium ${tab === "preview" ? "text-white border-b border-white" : "text-white/40 hover:text-white/70"}`}>Preview</button>
            <button onClick={() => setTab("files")} className={`px-4 py-2 text-xs font-medium ${tab === "files" ? "text-white border-b border-white" : "text-white/40 hover:text-white/70"}`}>Files ({files.length})</button>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            {tab === "preview" ? (
              previewUrl ? (
                <iframe
                  key={`${previewKey}-${previewUrl}`}
                  title="preview"
                  sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin allow-downloads"
                  src={previewUrl}
                  className="w-full h-full bg-white"
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-6 gap-4 text-white/70">
                  <Cloud className="w-10 h-10 text-white/30" />
                  <div className="text-sm max-w-sm">
                    {sending ? "v0 يبني المشروع الآن… البريفيو هيظهر فور جاهزيته." : "لا توجد ملفات بعد — اطلب من الوكيل بناء أول إصدار من المشروع."}
                  </div>
                </div>
              )
            ) : (
              <div className="h-full flex">
                <div className="w-56 border-l border-white/10 overflow-y-auto">
                  {files.map((f) => (
                    <button
                      key={f.path}
                      onClick={() => setActiveFile(f.path)}
                      className={`w-full text-left px-3 py-2 text-xs font-mono truncate flex items-center gap-2 ${
                        activeFile === f.path ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
                      }`}
                    >
                      <FileCode className="w-3 h-3 shrink-0" /> {f.path}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-auto bg-[#050505]">
                  <pre className="p-4 text-xs font-mono text-white/80 leading-relaxed whitespace-pre-wrap" dir="ltr">
                    {activeFile ? files.find((f) => f.path === activeFile)?.content : "Select a file from the list"}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
      <CodeProjectSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        projectId={projectId}
        initialInstructions={project?.instructions ?? ""}
        canDeploy={!!project?.v0_chat_id}
        onAfterRestore={() => { reload(); setPreviewKey((k) => k + 1); }}
        onAfterDeploy={(url) => setProject((p) => p ? { ...p, published_url: url } : p)}
      />
    </div>
  );
}
