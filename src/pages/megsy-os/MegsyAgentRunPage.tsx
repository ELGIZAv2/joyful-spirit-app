import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/common/SEOHead";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Send, Loader2, Terminal, Bot, User as UserIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Message = {
  id: string;
  role: string;
  content: string | null;
  tool_calls: any;
  tool_results: any;
  created_at: string;
};

type Agent = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  default_tools: string[];
};

export default function MegsyAgentRunPage() {
  const { slug, sessionId } = useParams<{ slug: string; sessionId: string }>();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!slug || !sessionId) return;
    (async () => {
      const [{ data: a }, { data: m }] = await Promise.all([
        supabase.from("agents_catalog").select("slug, name, description, icon, color, default_tools").eq("slug", slug).maybeSingle(),
        supabase.from("agent_messages").select("*").eq("session_id", sessionId).order("created_at"),
      ]);
      setAgent(a as any);
      setMessages((m || []) as any);
    })();
  }, [slug, sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    inputRef.current?.focus();
  }, [messages]);

  const send = async () => {
    if (!input.trim() || !sessionId || !slug || sending) return;
    const userMsg = input.trim();
    setInput("");
    setSending(true);
    const optimisticId = `tmp-${Date.now()}`;
    setMessages((prev) => [...prev, {
      id: optimisticId, role: "user", content: userMsg,
      tool_calls: null, tool_results: null, created_at: new Date().toISOString(),
    }]);

    try {
      const { data, error } = await supabase.functions.invoke("agent-run", {
        body: { session_id: sessionId, agent_slug: slug, user_message: userMsg },
      });
      if (error) throw error;
      // Reload full message list (server saved both user + assistant)
      const { data: m } = await supabase
        .from("agent_messages").select("*").eq("session_id", sessionId).order("created_at");
      setMessages((m || []) as any);
    } catch (e: any) {
      toast.error(e.message || "Agent failed");
      setMessages((prev) => prev.filter((x) => x.id !== optimisticId));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <SEOHead title={`${agent?.name || "Agent"} — Megsy Agents`} description={agent?.description || "Megsy AI agent workspace"} path={`/megsy-os/agents/${slug}`} />

      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur px-4 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate("/megsy-os/agents")}
          className="p-2 rounded-xl hover:bg-muted transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
          <Bot className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-[15px] truncate">{agent?.name || "Loading…"}</h1>
          <p className="text-[11px] text-muted-foreground truncate">{agent?.description}</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-16 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 text-primary mx-auto flex items-center justify-center">
                <Bot className="w-7 h-7" />
              </div>
              <p className="text-sm text-muted-foreground">
                Start chatting with <span className="font-semibold text-foreground">{agent?.name}</span>
              </p>
              {(agent?.default_tools?.length ?? 0) > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  Tools: {agent?.default_tools.join(" · ")}
                </p>
              )}
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className="flex gap-3">
              <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${
                m.role === "user" ? "bg-muted" : "bg-primary/15 text-primary"
              }`}>
                {m.role === "user" ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                {m.role === "user" ? (
                  <div className="text-[14px] whitespace-pre-wrap break-words">{m.content}</div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-[14px]">
                    <ReactMarkdown>{m.content || ""}</ReactMarkdown>
                  </div>
                )}
                {Array.isArray(m.tool_calls) && m.tool_calls.length > 0 && (
                  <details className="rounded-lg border border-border/50 bg-muted/30 text-[12px]">
                    <summary className="px-3 py-1.5 cursor-pointer flex items-center gap-1.5 text-muted-foreground">
                      <Terminal className="w-3 h-3" />
                      {m.tool_calls.length} tool call{m.tool_calls.length > 1 ? "s" : ""}
                    </summary>
                    <div className="px-3 pb-2 space-y-1.5">
                      {m.tool_calls.map((tc: any, i: number) => (
                        <div key={i} className="font-mono text-[11px]">
                          <div className="text-primary">{tc.name}</div>
                          <pre className="text-muted-foreground whitespace-pre-wrap break-all">
                            {JSON.stringify(tc.args, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Thinking…
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-border/50 bg-card/30 backdrop-blur p-4 shrink-0">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && (typeof window === 'undefined' || window.innerWidth >= 768)) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={`Message ${agent?.name || "agent"}…`}
            rows={1}
            className="resize-none rounded-xl min-h-[44px] max-h-32"
            disabled={sending}
          />
          <Button
            onClick={send}
            disabled={!input.trim() || sending}
            size="icon"
            className="rounded-xl h-11 w-11 shrink-0"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
