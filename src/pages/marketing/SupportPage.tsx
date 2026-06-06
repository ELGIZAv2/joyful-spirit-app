import { useState, useRef, useEffect } from "react";
import { ArrowUp, Loader2, Headphones, AlertCircle } from "lucide-react";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import SEOHead from "@/components/common/SEOHead";
import ChatMessage from "@/components/chat/ChatMessage";
import { supabase } from "@/integrations/supabase/client";

const SUPPORT_SYSTEM_PROMPT = `You are Megsy Support Agent — the official AI customer support assistant for Megsy AI (megsyai.com). You are friendly, professional, and knowledgeable about every aspect of the platform.

## About Megsy AI
- Megsy is an all-in-one AI creative platform offering: AI Chat, Image Generation, Video Generation, Code Builder, and File Analysis.
- 3 Megsy-branded models: Megsy V1 (Chat), Megsy Imagine (Image), Megsy Video (Video), powered by 36+ underlying AI engines.
- Credit-based pricing system (Megsy Credits / MC). Different actions cost different credits.
- Available at megsyai.com. Founded in 2026, based in Egypt.

## Platform Features
- **AI Chat**: Conversational AI with web search, deep research, file upload. Cost: 1 MC/message.
- **Image Generation**: Text-to-image & image-to-image with 19 models. Multiple aspect ratios (1:1 to 21:9), quality up to 4K. Cost: from 2 MC.
- **Video Generation**: Text-to-video & image-to-video with 17 models. Durations 5-10s, audio support. Cost: from 8 MC.
- **Code Builder**: Build & deploy web apps with AI. Uses Sprites.dev sandboxes. Cost: 3 MC/message.
- **File Analysis**: Upload PDFs, images, documents for AI analysis. Cost: 1 MC/file.
- **Studios**: Dedicated Image Studio and Video Studio for focused creation workflows.
- **Agents**: Image Agent and Video Agent for guided, expert assistance.

## Account & Settings
- Users sign up at /auth with email/password or Google OAuth.
- Profile settings at /settings/profile (display name, avatar).
- Billing at /settings/billing (view credits, transaction history).
- Referral program at /settings/referrals (earn 20% commission from referred users' activity).
- Language settings, notification preferences, integrations (Composio), customization (themes/accents).
- Two-factor authentication available.
- Users can change email, change password, delete account from settings.

## Pricing
- Free tier: 0 MC to start (users get credits through referrals or purchases).
- Credits can be purchased. Pricing is at /pricing.
- Different actions have different costs. Chat: 1 MC, Images: 2-8 MC, Videos: 8-20 MC, Code: 3 MC, Files: 1 MC.

## Legal
- Terms of Service: terms.megsyai.com
- Privacy Policy: privacy.megsyai.com
- Cookie Policy: /cookies on the main site
- GDPR, CCPA, and Egyptian Law 151/2020 compliant.

## Important Rules for You
1. NEVER add credits to any user's account or promise free credits.
2. NEVER grant premium plans, subscriptions, or any paid features.
3. NEVER modify any user data, account settings, or billing information.
4. For any questions about money, billing disputes, refunds, charges, or rights issues — tell the user you're escalating to the human support team and that they'll receive a response via email within 24 hours. Then include the tag [ESCALATE_FINANCIAL] in your response.
5. For technical issues, provide helpful troubleshooting steps.
6. If you don't know something, say so honestly and suggest contacting support@megsyai.com.
7. Always be helpful, concise, and professional. Respond in the same language the user writes in.
8. If asked about competitors or other AI platforms, stay professional and focus on Megsy's features.`;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SupportPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const assistantMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: "" };
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsStreaming(true);

    const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-alibaba`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: SUPPORT_SYSTEM_PROMPT }, ...history],
          model: "qwen-plus",
          isSupportChat: true,
        }),
      });

      if (!resp.ok || !resp.body) {
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1].content = "I'm sorry, I'm having trouble connecting right now. Please try again or email support@megsyai.com.";
          return copy;
        });
        setIsStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullResponse += content;
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1].content += content;
                return copy;
              });
            }
          } catch { break; }
        }
      }

      // Check for escalation tag
      if (fullResponse.includes("[ESCALATE_FINANCIAL]")) {
        // Remove the tag from displayed message
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1].content = copy[copy.length - 1].content.replace("[ESCALATE_FINANCIAL]", "").trim();
          return copy;
        });
        // Send escalation to backend
        try {
          await supabase.functions.invoke("send-email", {
            body: {
              to: "support@megsyai.com",
              template: "support_escalation",
              type: "system",
              variables: {
                user_message: trimmed,
                ai_response: fullResponse.replace("[ESCALATE_FINANCIAL]", ""),
                timestamp: new Date().toISOString(),
              },
            },
          });
        } catch {
          // Silent fail — the user already got their response
        }
      }
    } catch {
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1].content = "Connection error. Please check your internet and try again, or email support@megsyai.com.";
        return copy;
      });
    }

    setIsStreaming(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEOHead title="Support" description="Get instant help from Megsy AI's support chatbot. Available 24/7 to answer your questions about the platform." path="/support" />
      <LandingNavbar />

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 pt-20 pb-4">
        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
                <Headphones className="w-10 h-10 text-primary" />
              </div>
              <h1 className="font-display text-3xl font-black uppercase tracking-tight mb-2 sm:text-4xl">
                Support <span className="text-primary">Chat</span>
              </h1>
              <p className="text-sm text-muted-foreground max-w-md mb-8">
                I'm Megsy's AI support assistant. I know everything about the platform and I'm here to help 24/7. Ask me anything!
              </p>
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-card px-4 py-3 text-xs text-muted-foreground">
                <AlertCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>For billing disputes or rights issues, I'll escalate to our human team.</span>
              </div>
            </div>
          )}
          {messages.map(msg => (
            <ChatMessage
              key={msg.id}
              role={msg.role}
              content={msg.content}
              isStreaming={isStreaming && msg.id === messages[messages.length - 1]?.id && msg.role === "assistant"}
              isThinking={isStreaming && msg.role === "assistant" && !msg.content}
            />
          ))}
        </div>

        {/* Input */}
        <div className="pb-4 pt-2 border-t border-border">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && (typeof window === 'undefined' || window.innerWidth >= 768)) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask about features, billing, account issues, or anything about Megsy..."
              rows={1}
              className="flex-1 bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none resize-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50 max-h-32 selectable"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="shrink-0 w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 hover:bg-primary/90 transition-colors"
            >
              {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
            This is an AI assistant. For urgent issues, email{" "}
            <a href="mailto:support@megsyai.com" className="text-primary/50 hover:underline">support@megsyai.com</a>
          </p>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
};

export default SupportPage;
