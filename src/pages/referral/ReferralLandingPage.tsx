import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Gift, Zap, Shield, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import FancyButton from "@/components/branding/FancyButton";

interface RefInfo {
  displayName: string;
  avatarUrl: string | null;
}

const ReferralLandingPage = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [info, setInfo] = useState<RefInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    const clean = code.trim().toUpperCase().slice(0, 64);

    (async () => {
      try {
        const { data: codeRow } = await supabase
          .from("referral_codes")
          .select("user_id")
          .ilike("code", clean)
          .maybeSingle();

        if (codeRow?.user_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("id", codeRow.user_id)
            .maybeSingle();

          setInfo({
            displayName: profile?.display_name || "A friend",
            avatarUrl: profile?.avatar_url || null,
          });
        } else {
          setInfo({ displayName: "A friend", avatarUrl: null });
        }
      } catch {
        setInfo({ displayName: "A friend", avatarUrl: null });
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  const handleJoin = () => {
    if (code) navigate(`/ref/${code}`);
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          {/* Inviter card */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Personal Invitation
            </div>

            <div className="flex flex-col items-center gap-3">
              {info?.avatarUrl ? (
                <img
                  src={info.avatarUrl}
                  alt={info.displayName}
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-primary/20"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl font-bold text-primary">
                  {info?.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">You're invited by</p>
                <p className="font-display text-xl font-bold text-foreground">
                  {info?.displayName}
                </p>
              </div>
            </div>
          </div>

          {/* Hero */}
          <div className="text-center space-y-4">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Join Megsy AI today
            </h1>
            <p className="text-base text-muted-foreground max-w-md mx-auto">
              The all-in-one AI workspace — chat, image, video, code, and research, in one place.
            </p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: Gift, title: "Free to start", desc: "No credit card needed" },
              { icon: Zap, title: "All AI models", desc: "Chat, image, video, code" },
              { icon: Shield, title: "Private & secure", desc: "Your data, your control" },
            ].map((b) => (
              <div
                key={b.title}
                className="p-4 rounded-2xl bg-muted/20 border border-border/40 text-center"
              >
                <b.icon className="w-5 h-5 mx-auto mb-2 text-primary" />
                <p className="text-sm font-semibold text-foreground">{b.title}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{b.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <FancyButton onClick={handleJoin} className="w-full">
              <span className="inline-flex items-center justify-center gap-2">
                Accept Invitation
                <ArrowRight className="w-4 h-4" />
              </span>
            </FancyButton>
            <p className="text-[11px] text-muted-foreground text-center">
              Code: <span className="font-mono text-foreground">{code}</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReferralLandingPage;
