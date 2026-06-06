// Billing — luma/neutral redesign. Clean spacing, neutral surfaces, calm typography.
import { useState, useEffect } from "react";
import { ArrowLeft, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/settings/DesktopSettingsLayout";
import visaBg from "@/assets/visa-bg.webp";
import MegsyStar from "@/components/branding/MegsyStar";

const planTone = (plan: string) => {
  const p = plan.toLowerCase();
  if (p === "free") return "bg-white/10 text-white/80";
  if (p === "starter") return "bg-white/15 text-white";
  if (p === "pro") return "bg-white/20 text-white";
  if (p === "elite") return "bg-white/25 text-white";
  return "bg-white/30 text-white";
};

const BillingPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [credits, setCredits] = useState(0);
  const [plan, setPlan] = useState("Free");
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits, plan")
        .eq("id", user.id)
        .single();
      if (profile) {
        setCredits(Number(profile.credits) || 0);
        setPlan(profile.plan || "Free");
      }
      const { data: txns } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (txns) setTransactions(txns);
    };
    load();
  }, []);

  const totalSpent = transactions.filter(t => t.amount > 0).reduce((s, t) => s + Number(t.amount), 0);
  const totalEarned = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-xl mx-auto"
    >
      {/* Card */}
      <div className="relative w-full aspect-[1.7/1] rounded-3xl overflow-hidden shadow-xl ring-1 ring-white/5">
        <img src={visaBg} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-black/55" />
        <div className="relative z-10 flex flex-col justify-between h-full p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/55 text-[10px] uppercase tracking-[0.28em] font-medium">Balance</p>
              <p className="text-white text-[34px] font-black tracking-tight mt-1.5 leading-none">
                {credits.toLocaleString()}
                <span className="text-base font-normal text-white/55 ml-1.5">MC</span>
              </p>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm ${planTone(plan)}`}>
              {plan}
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-1.5 text-white">
              <MegsyStar className="w-4 h-4 opacity-90" />
              <span className="text-base font-bold tracking-wide">Megsy</span>
            </div>
            <div className="flex">
              <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm" />
              <div className="w-7 h-7 rounded-full bg-white/10 backdrop-blur-sm -ml-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => navigate("/pricing")}
          className="py-3 rounded-xl text-sm font-semibold bg-foreground text-background hover:opacity-90 transition-opacity"
        >
          Add MC
        </button>
        <button
          onClick={() => navigate("/settings/referrals")}
          className="py-3 rounded-xl text-sm font-medium text-foreground border border-border hover:bg-muted/40 transition-colors"
        >
          Earn MC
        </button>
      </div>

      {/* Stats */}
      <section>
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/70 mb-2 px-1">Overview</p>
        <div className="rounded-2xl border border-border bg-card divide-y divide-border">
          <Row label="MC left" value={credits.toLocaleString()} />
          <Row label="Total spent" value={totalSpent.toLocaleString()} />
          <Row label="Total earned" value={totalEarned.toLocaleString()} />
        </div>
      </section>

      {/* Transactions */}
      <section>
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/70">Recent activity</p>
          <p className="text-[11px] text-muted-foreground">{transactions.length} entries</p>
        </div>
        {transactions.length === 0 ? (
          <div className="text-center py-14 rounded-2xl border border-dashed border-border">
            <Clock className="w-7 h-7 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-foreground/80">No transactions yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Your MC history will appear here</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
            {transactions.map(tx => {
              const isDeduction = tx.amount > 0;
              return (
                <div key={tx.id} className="flex items-center gap-3 py-3.5 px-4">
                  <div className="w-9 h-9 rounded-xl bg-muted grid place-items-center shrink-0 text-foreground/70">
                    {isDeduction ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{tx.description || tx.action_type}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {isDeduction ? "-" : "+"}{Math.abs(tx.amount)} <span className="text-muted-foreground font-normal">MC</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </motion.div>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="Billing" subtitle="Manage your MC balance and view transaction history">
        {content}
      </DesktopSettingsLayout>
    );
  }

  return (
    <div className="h-[100dvh] bg-background overflow-y-auto">
      <div className="max-w-xl mx-auto pb-12 px-5">
        <div className="flex items-center gap-3 py-4">
          <button
            onClick={() => navigate("/settings")}
            className="w-9 h-9 grid place-items-center rounded-xl text-foreground/70 hover:bg-muted/50 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-foreground">Billing</h1>
        </div>
        <div className="pt-2">{content}</div>
      </div>
    </div>
  );
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="text-[13.5px] text-muted-foreground">{label}</span>
      <span className="text-[14px] font-semibold text-foreground tabular-nums">{value}</span>
    </div>
  );
}

export default BillingPage;
