// Contact human support — submits to contact_submissions.
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { goBackOr } from "@/lib/navigation";
import { BackIcon, HumanSupportIcon } from "@/components/settings/SettingsIcons";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/settings/DesktopSettingsLayout";

export default function SettingsContactPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      setEmail(u.email || "");
      const meta = (u.user_metadata as any) || {};
      setName(meta.full_name || meta.name || u.email?.split("@")[0] || "");
    });
  }, []);

  const submit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in name, email and message");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("contact_submissions").insert({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim() || null,
      message: message.trim(),
      form_type: "support",
    });
    setSending(false);
    if (error) {
      toast.error("Failed to send. Please try again.");
      return;
    }
    toast.success("Message sent. We'll reply by email within 24h.");
    setSubject("");
    setMessage("");
  };

  const field = "w-full px-3.5 py-3 rounded-xl bg-muted/40 border border-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:bg-muted/60 focus:border-border transition-colors";

  const form = (
    <div className="max-w-2xl space-y-3">
      <div className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card mb-3">
        <div className="w-10 h-10 rounded-xl bg-muted grid place-items-center text-foreground">
          <HumanSupportIcon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Human support</p>
          <p className="text-[11px] text-muted-foreground">Replies within 24 hours</p>
        </div>
      </div>
      <div>
        <label className="text-[11.5px] text-muted-foreground mb-1.5 block">Your name</label>
        <input value={name} onChange={e => setName(e.target.value)} className={field} />
      </div>
      <div>
        <label className="text-[11.5px] text-muted-foreground mb-1.5 block">Your email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" className={field} />
      </div>
      <div>
        <label className="text-[11.5px] text-muted-foreground mb-1.5 block">Subject ​</label>
        <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Billing question" className={field} />
      </div>
      <div>
        <label className="text-[11.5px] text-muted-foreground mb-1.5 block">Message</label>
        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={6} placeholder="Describe your issue in detail…" className={`${field} resize-none`} />
      </div>
      <button
        onClick={submit}
        disabled={sending}
        className="w-full h-12 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
      >
        {sending && <Loader2 className="w-4 h-4 animate-spin" />}
        {sending ? "Sending…" : "Send message"}
      </button>
    </div>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="Contact our team" subtitle="A human will reply by email within 24 hours.">
        {form}
      </DesktopSettingsLayout>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="max-w-lg mx-auto px-5 pb-16">
        <div className="flex items-center gap-3 py-4">
          <button onClick={() => goBackOr(navigate, "/settings/support")} className="w-9 h-9 grid place-items-center rounded-xl text-foreground/70 hover:bg-muted/50 transition-colors">
            <BackIcon className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-foreground">Contact our team</h1>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card mb-6">
          <div className="w-10 h-10 rounded-xl bg-muted grid place-items-center text-foreground">
            <HumanSupportIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Human support</p>
            <p className="text-[11px] text-muted-foreground">Replies within 24 hours</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[11.5px] text-muted-foreground mb-1.5 block">Your name</label>
            <input value={name} onChange={e => setName(e.target.value)} className={field} />
          </div>
          <div>
            <label className="text-[11.5px] text-muted-foreground mb-1.5 block">Your email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" className={field} />
          </div>
          <div>
            <label className="text-[11.5px] text-muted-foreground mb-1.5 block">Subject ​</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Billing question" className={field} />
          </div>
          <div>
            <label className="text-[11.5px] text-muted-foreground mb-1.5 block">Message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={6} placeholder="Describe your issue in detail…" className={`${field} resize-none`} />
          </div>

          <button
            onClick={submit}
            disabled={sending}
            className="w-full h-12 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
          >
            {sending && <Loader2 className="w-4 h-4 animate-spin" />}
            {sending ? "Sending…" : "Send message"}
          </button>
        </div>
      </div>
    </div>
  );
}
