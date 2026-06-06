import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ChatMessage from "@/components/chat/ChatMessage";

interface Message {
  role: "user" | "assistant";
  content: string;
  images?: string[];
}

const SharedChatPage = () => {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!shareId) return;
    (async () => {
      const { data: conv } = await supabase
        .from("conversations")
        .select("id, title, is_shared, created_at")
        .eq("share_id", shareId)
        .eq("is_shared", true)
        .single();

      if (!conv) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setTitle(conv.title);
      setCreatedAt(conv.created_at);

      const { data: msgs } = await supabase
        .from("messages")
        .select("role, content, images")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: true });

      if (msgs) {
        setMessages(msgs.map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          images: m.images || undefined,
        })));
      }
      setLoading(false);
    })();
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <h2 className="text-xl font-bold text-foreground">Chat not found</h2>
          <p className="text-sm text-muted-foreground">This shared chat doesn't exist or has been made private.</p>
          <button onClick={() => navigate("/")} className="px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white text-sm font-semibold hover:opacity-95 transition">
            Go to Megsy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/75 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-3xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate("/")}
            className="font-display text-xl font-black uppercase tracking-tight text-foreground"
          >
            MEGSY
          </button>
          <button
            onClick={() => navigate("/auth")}
            className="px-4 py-1.5 rounded-full bg-foreground text-background text-[13px] font-semibold hover:opacity-90 transition"
          >
            Join Megsy
          </button>
        </div>
      </header>

      {/* Conversation */}
      <main className="flex-1 w-full">
        <div className="max-w-3xl mx-auto px-4 md:px-6 pt-8 pb-10">
          {/* Title block */}
          <div className="mb-8 pb-6 border-b border-border/40">
            <h1 className="text-[26px] md:text-[32px] font-bold tracking-tight text-foreground leading-tight">{title || "Shared chat"}</h1>
          </div>

          {/* Messages */}
          <div className="space-y-2">
            {messages.map((msg, i) => (
              <ChatMessage key={i} role={msg.role} content={msg.content} images={msg.images} />
            ))}
          </div>

          {/* End divider */}
          <div className="mt-10 flex items-center gap-3 text-[11px] text-muted-foreground/70 uppercase tracking-[0.18em]">
            <div className="flex-1 h-px bg-border/50" />
            End of conversation
            <div className="flex-1 h-px bg-border/50" />
          </div>
        </div>

        {/* CTA banner */}
        <section className="px-4 md:px-6 pb-16">
          <div className="max-w-3xl mx-auto relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-purple-600/10 via-background to-fuchsia-500/10 px-6 py-10 md:px-10 md:py-14 text-center">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full bg-purple-500/20 blur-[120px] pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-foreground/5 border border-border/50 text-[11px] font-medium text-foreground/80 mb-4">
                Powered by Megsy AI
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Start your own conversation
              </h2>
              <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-md mx-auto">
                Get answers, build, research, and create — all in one place. Free to start.
              </p>
              <button
                onClick={() => navigate("/auth")}
                className="mt-6 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white text-sm font-semibold hover:opacity-95 transition"
              >
                Join Megsy free
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SharedChatPage;
