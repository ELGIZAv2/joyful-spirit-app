import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

interface Props {
  userMessage: string;
  assistantReply: string;
  conversationId: string | null;
  messageId: string | null;
  onPick: (q: string) => void;
}

export function ChatFollowups({ userMessage, assistantReply, conversationId, messageId, onPick }: Props) {
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!assistantReply || assistantReply.length < 10) return;
    let cancelled = false;
    setLoading(true);
    setQuestions([]);
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("chat-followups", {
          body: {
            user_message: userMessage,
            assistant_reply: assistantReply.slice(0, 4000),
            conversation_id: conversationId,
            message_id: messageId,
          },
        });
        if (cancelled) return;
        if (error) {
          setQuestions([]);
        } else if (Array.isArray(data?.questions)) {
          setQuestions(data.questions.slice(0, 3));
        }
      } catch {
        if (!cancelled) setQuestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [assistantReply, userMessage, conversationId, messageId]);

  if (loading || questions.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {questions.map((q, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onPick(q)}
          className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-card/50 px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:border-primary/40 hover:bg-card hover:text-foreground"
        >
          <Sparkles className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
          {q}
        </button>
      ))}
    </div>
  );
}
