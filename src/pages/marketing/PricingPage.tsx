import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Loader2, Info, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { invokeFunction } from "@/lib/supabaseFunction";
import GlowButton from "@/components/branding/GlowButton";
import { goBackOr } from "@/lib/navigation";
import { WORKSPACE_PRODUCT_MAP } from "@/lib/workspacePlans";
import SEOHead from "@/components/common/SEOHead";
import MegsyStar from "@/components/branding/MegsyStar";
import { PaymentMethods } from "@/components/branding/PaymentMethods";
import { DodoPaymentsBadge } from "@/components/branding/DodoPaymentsBadge";

type PlanTier = "starter" | "pro" | "elite" | "business";

const PRODUCT_MAP: Record<PlanTier, { monthly: string; yearly: string }> = WORKSPACE_PRODUCT_MAP;

interface PlanCardConfig {
  tier: PlanTier;
  name: string;
  label: string;
  bg: string;
  text: string;
  subText: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyCredits: string;
  yearlyCredits: string;
  features: string[];
  ctaBg: string;
  ctaText: string;
  ctaHover: string;
  bubbleColor: string;
  topBadge?: boolean;
  glow?: string;
}

const PLANS: PlanCardConfig[] = [
  {
    tier: "starter",
    name: "Free",
    label: "",
    bg: "#D1FAE5",
    text: "#1A1A1A",
    subText: "rgba(26,26,26,0.65)",
    monthlyPrice: 0,
    yearlyPrice: 0,
    monthlyCredits: "",
    yearlyCredits: "",
    features: [
      "Unlimited chat — Megsy Lite",
      "Slides — 3 generations / day",
      "Docs — 3 generations / day",
      "Deep Research — 3 generations / day",
      "Images — not included",
      "Code Builder — not included",
      "Video generation — not included",
      "Community support",
    ],
    ctaBg: "#000000",
    ctaText: "#FFFFFF",
    ctaHover: "#1f1f1f",
    bubbleColor: "rgba(255,255,255,0.7)",
  },
  {
    tier: "pro",
    name: "Pro",
    label: "",
    bg: "#2563EB",
    text: "#FFFFFF",
    subText: "rgba(255,255,255,0.78)",
    monthlyPrice: 25,
    yearlyPrice: 250,
    monthlyCredits: "100 MC / month",
    yearlyCredits: "Save $50 + 200 bonus MC",
    features: [
      "Unlimited chat — Megsy AI",
      "Images, Slides, Docs, Deep Research & Code Builder — unlimited 7 days / month",
      "Megsy OS autonomous tasks — unlimited",
      "Video generation — 100 MC included",
      "Team workspace included",
      "Priority email support",
    ],
    ctaBg: "#FFFFFF",
    ctaText: "#2563EB",
    ctaHover: "#f3f4f6",
    bubbleColor: "rgba(255,255,255,0.35)",
  },
  {
    tier: "elite",
    name: "Elite",
    label: "MOST POPULAR",
    bg: "#7C3AED",
    text: "#FFFFFF",
    subText: "rgba(255,255,255,0.82)",
    monthlyPrice: 50,
    yearlyPrice: 500,
    monthlyCredits: "250 MC / month",
    yearlyCredits: "Save $100 + 500 bonus MC",
    features: [
      "Unlimited chat — Megsy AI",
      "Images, Slides, Docs, Deep Research & Code Builder — unlimited 15 days / month",
      "Megsy OS autonomous tasks — unlimited",
      "Video generation — 250 MC included",
      "Priority queue — 3× faster generations",
      "Team workspace included",
      "Advanced presets & custom branding",
      "Analytics dashboard",
      "24/7 priority chat support",
    ],
    ctaBg: "#FFD700",
    ctaText: "#000000",
    ctaHover: "#ffdf33",
    bubbleColor: "rgba(255,215,0,0.35)",
    topBadge: true,
    glow: "0 0 60px rgba(124,58,237,0.55), 0 20px 50px -10px rgba(124,58,237,0.6)",
  },
  {
    tier: "business",
    name: "Business",
    label: "",
    bg: "#D97706",
    text: "#FFFFFF",
    subText: "rgba(255,255,255,0.82)",
    monthlyPrice: 125,
    yearlyPrice: 1250,
    monthlyCredits: "600 MC / month",
    yearlyCredits: "Save $250 + 1,200 bonus MC",
    features: [
      "Unlimited chat — Megsy AI",
      "Images, Slides, Docs, Deep Research & Code Builder — unlimited all month",
      "Megsy OS autonomous tasks — unlimited",
      "Unlimited team seats",
      "Video generation — 600 MC included",
      "Priority queue — 3× faster generations",
      "Advanced presets & custom branding",
      "Analytics dashboard",
      "SSO & SAML authentication",
      "Dedicated infrastructure",
      "99.9% SLA guarantee",
      "White-glove onboarding & success manager",
    ],
    ctaBg: "#FFFFFF",
    ctaText: "#D97706",
    ctaHover: "#FFF7ED",
    bubbleColor: "rgba(255,215,0,0.45)",
  },
];

const BUBBLES = Array.from({ length: 14 });

const ENTERPRISE_FEATURES: string[] = [
  "Custom MC Allocation",
  "Priority Megsy AI compute lane",
  "Dedicated Infrastructure",
  "SLA Guarantees",
  "Custom API Access & Integrations",
  "Enterprise Security (SOC2-ready, GDPR & Advanced Encryption)",
  "Data Privacy & Compliance",
  "Early access to new Megsy capabilities",
  "Advanced Analytics & Reporting",
  "Dedicated Account Manager",
  "24/7 Priority Support",
  "Priority Onboarding & Training",
  "Monthly Business Reviews",
  "Volume Discounts",
  "Custom Contract, Invoicing & Billing",
];

const SERVICES_GUIDE: { name: string; desc: string }[] = [
  {
    name: "Unlimited Chat",
    desc: "Talk to Megsy AI — our own model, with no daily caps. Free plan uses Megsy Lite.",
  },
  {
    name: "Image Generation",
    desc: "Generate unlimited high-quality images during your unlimited window (7/15/30 days depending on plan). Outside the window, uses MC credits.",
  },
  {
    name: "Slides & Presentations",
    desc: "Create complete slide decks from a prompt — fully editable, exportable to PPT/PDF. Free plan: 3 / day.",
  },
  {
    name: "Docs & Deep Research",
    desc: "Long-form documents and multi-source research reports with citations. Free plan: 3 of each per day.",
  },
  {
    name: "Code Builder",
    desc: "Build full apps and websites in natural language, with one-click deploy. Unlimited during your plan window.",
  },
  {
    name: "Video Generation",
    desc: "Credit-based on all plans. Each video consumes MC from your monthly balance — never charged extra.",
  },
  {
    name: "Megsy OS",
    desc: "Your autonomous 24/7 agent. Runs tasks, monitors projects, and executes multi-step work in the background. Unlimited on all paid plans.",
  },
  {
    name: "Megsy Credits (MC)",
    desc: "Credits cover video generation and any usage outside your unlimited windows. Credits reset at the start of each billing cycle.",
  },
  {
    name: "Team Workspace",
    desc: "Shared projects, files, and chats for your team. Pro+ includes seats; Business is unlimited.",
  },
  {
    name: "Priority Queue",
    desc: "Elite & Business get 3× faster generation speeds and skip the standard queue.",
  },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "Can I change or cancel my plan anytime?",
    a: "Yes. You can upgrade, downgrade, or cancel at any time from your billing settings. Upgrades take effect immediately; downgrades take effect at the end of the current billing cycle.",
  },
  {
    q: "What happens when I run out of Megsy Credits (MC)?",
    a: "Chat with Megsy AI is always unlimited and never uses MC. Images, Slides, Docs, Deep Research and Code Builder are unlimited inside your plan's window (7/15/30 days). MC are only consumed for video generation and any usage outside your unlimited window. You can top up MC anytime or wait for the next renewal.",
  },
  {
    q: "What's the difference between the 'unlimited window' and MC?",
    a: "Each paid plan gives you an unlimited window (7 days for Pro, 15 for Elite, all month for Business) where Images, Slides, Docs, Deep Research and Code Builder have no caps. Chat with Megsy AI is unlimited at all times. Video generation is always credit-based and uses your monthly MC balance.",
  },
  {
    q: "Do unused credits roll over?",
    a: "MC reset at the start of each billing cycle and don't roll over. Yearly plans get bonus MC upfront on top of saving 2 months on price.",
  },
  {
    q: "Do you offer refunds?",
    a: "See our Refund Policy in the footer for the latest terms and eligibility.",
  },
  {
    q: "Is my payment secure?",
    a: "All payments are processed by Dodo Payments with bank-grade encryption. We never store your card details on our servers.",
  },
  {
    q: "Do you offer team or enterprise plans?",
    a: "Yes. Business includes unlimited team seats. For custom MC allocation, SSO, SLA guarantees, or dedicated infrastructure, contact our sales team via the Enterprise card above.",
  },
];



const PricingPage = () => {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);
  const [loadingTier, setLoadingTier] = useState<PlanTier | null>(null);
  // Current plan on the user's primary workspace — used to toggle the Starter
  // card between "Start free trial" and "Subscribe now & end trial".
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: ws } = await supabase
        .from("workspaces")
        .select("plan")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!cancelled) setCurrentPlan(((ws as any)?.plan ?? null));
    })();
    return () => { cancelled = true; };
  }, []);

  const isStarterTrialActive = (currentPlan ?? "").toLowerCase() === "starter";

  const handleSubscribe = async (tier: PlanTier, opts: { trial?: boolean } = {}) => {
    // Hard double-click guard — block if ANY tier is already processing
    if (loadingTier) return;
    setLoadingTier(tier);

    const interval: "monthly" | "yearly" = isYearly ? "yearly" : "monthly";

    // Validate session and try to refresh if expired — prevents 502 from stale tokens
    let { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      session = refreshed.session;
    }
    if (!session?.access_token) {
      setLoadingTier(null);
      await supabase.auth.signOut().catch(() => {});
      toast.error("Please sign in again to continue.");
      navigate("/auth?redirect=/pricing");
      return;
    }

    try {
      // Server resolves the actual product_id from {tier, interval} — never trust
      // the client to choose which Dodo product to charge against.
      const { data, error } = await invokeFunction("dodo-checkout", {
        body: { tier, interval, trial: opts.trial === true },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) {
        // Auth issue → force re-login instead of showing a confusing gateway error
        const msg = (error as any)?.message?.toLowerCase?.() || "";
        if (msg.includes("unauthorized") || msg.includes("401") || msg.includes("jwt")) {
          await supabase.auth.signOut().catch(() => {});
          toast.error("Your session expired. Please sign in again.");
          navigate("/auth?redirect=/pricing");
          return;
        }
        throw error;
      }
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data?.error || "Checkout failed");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to open checkout. Please try again.");
      setLoadingTier(null);
    }
  };

  const handleStartEmpire = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    navigate(session ? "/chat" : "/auth?redirect=/chat");
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      <SEOHead
        title="Pricing — Megsy AI Plans & Credits"
        description="Simple plans for Megsy AI. Pay-as-you-go credits or monthly subscriptions for chat, images, video, slides and full-stack builds."
        path="/pricing"
      />
      {/* Bubble + utility CSS scoped to page */}
      <style>{`
        @keyframes pricing-bubble-rise {
          0%   { transform: translateY(0) scale(0.8); opacity: 0; }
          10%  { opacity: 0.9; }
          80%  { opacity: 0.6; }
          100% { transform: translateY(-180px) scale(1.1); opacity: 0; }
        }
        .pricing-bubble {
          position: absolute;
          border-radius: 9999px;
          pointer-events: none;
          will-change: transform, opacity;
          animation: pricing-bubble-rise 5s ease-in-out infinite;
        }
        @keyframes gold-pulse {
          0%, 100% { box-shadow: 0 0 24px rgba(255,215,0,0.55), 0 0 60px rgba(255,215,0,0.25); }
          50%      { box-shadow: 0 0 38px rgba(255,215,0,0.85), 0 0 90px rgba(255,215,0,0.45); }
        }
      `}</style>

      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-4 max-w-7xl mx-auto">
        <button
          onClick={() => goBackOr(navigate, "/")}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold tracking-tight">Pricing</h1>
      </div>

      {/* Exclusive personal discount card — 50% off + Unlimited */}

      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-8 sm:pt-14 pb-10 sm:pb-14 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="font-black tracking-tight leading-[1.05] text-foreground break-words"
          style={{ fontSize: "clamp(1.75rem, 6vw, 4.75rem)", letterSpacing: "-0.03em" }}
        >
          One AI Platform.
          <br />
          <span className="bg-gradient-to-r from-purple-600 via-fuchsia-500 to-amber-500 bg-clip-text text-transparent">
            Infinite Possibilities.
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mx-auto mt-5 max-w-2xl font-medium text-muted-foreground"
          style={{ fontSize: "clamp(0.95rem, 1.6vw, 1.125rem)" }}
        >
          Simple, transparent pricing. No hidden fees. Pay only for real usage across the entire AI ecosystem.
        </motion.p>

        {/* Toggle */}
        <div className="mt-8 inline-flex items-center gap-1 p-1 rounded-full bg-muted border border-border">
          <button
            onClick={() => setIsYearly(false)}
            className={`px-5 sm:px-7 py-2.5 rounded-full text-sm transition-all ${
              !isYearly
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground font-medium"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`inline-flex items-center gap-2 px-5 sm:px-7 py-2.5 rounded-full text-sm transition-all ${
              isYearly
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground font-medium"
            }`}
          >
            Yearly
          </button>
        </div>

        {/* Compare plans — pill link */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onClick={() => navigate("/features-guide")}
          className="group mt-7 mx-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-card hover:bg-foreground/[0.04] hover:border-foreground/30 transition-all text-sm font-semibold text-foreground"
        >
          Want to know more about Megsy's services?
          <span className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all">→</span>
        </motion.button>

      </section>

      {/* Plans grid */}
      <section id="plans-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 scroll-mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 items-stretch">
          {PLANS.map((p, i) => {
            const price = isYearly ? p.yearlyPrice : p.monthlyPrice;
            const credits = isYearly ? p.yearlyCredits : p.monthlyCredits;
            const isElite = p.tier === "elite";

            return (
              <motion.div
                key={p.tier}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.07 }}
                className={`relative rounded-[24px] flex flex-col ${
                  isElite ? "lg:-translate-y-3 z-10" : ""
                }`}
                style={{
                  background: p.bg,
                  color: p.text,
                  boxShadow: p.glow ?? "0 12px 40px -12px rgba(0,0,0,0.12)",
                  minHeight: 540,
                }}
              >
                {/* MOST POPULAR — clean centered tab above the card */}
                {p.topBadge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                    <div
                      className="px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.24em] text-foreground bg-background border border-foreground/20"
                      style={{
                        boxShadow: "0 8px 24px -8px rgba(0,0,0,0.25)",
                      }}
                    >
                      MOST POPULAR
                    </div>
                  </div>
                )}

                {/* Bubbles (small & subtle, clipped to card) */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[24px]">
                  {BUBBLES.map((_, b) => {
                    const size = 3 + ((b * 2) % 5); // 3px - 7px tiny bubbles
                    const left = (b * 13) % 95;
                    const delay = (b * 0.4) % 6;
                    return (
                      <span
                        key={b}
                        className="pricing-bubble"
                        style={{
                          width: size,
                          height: size,
                          left: `${left}%`,
                          bottom: `-${size}px`,
                          background: p.bubbleColor,
                          animationDelay: `${delay}s`,
                          animationDuration: `${5 + (b % 4)}s`,
                        }}
                      />
                    );
                  })}
                </div>

                {/* Content */}
                <div className="relative z-10 p-7 sm:p-8 flex flex-col flex-1">
                  {/* Label (glass frame) — Elite uses corner ribbon outside, so render placeholder here */}
                  {!p.topBadge && p.label ? (
                    <span
                      className="self-start inline-block text-[10px] sm:text-[11px] font-bold tracking-[0.18em] px-3 py-1 rounded-full mb-5 backdrop-blur-md"
                      style={{
                        background: p.tier === "starter" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.18)",
                        border: p.tier === "starter" ? "1px solid rgba(0,0,0,0.15)" : "1px solid rgba(255,255,255,0.35)",
                        color: p.text,
                      }}
                    >
                      {p.label}
                    </span>
                  ) : (
                    <span
                      className="self-start inline-block text-[10px] sm:text-[11px] font-bold tracking-[0.18em] px-3 py-1 rounded-full mb-5 opacity-0 pointer-events-none"
                      aria-hidden="true"
                    >
                      PLACEHOLDER
                    </span>
                  )}

                  {/* Plan name + price + credits — tidy grouped block */}
                  <div className="flex flex-col gap-1.5">
                    <h3
                      className="font-black leading-none"
                      style={{ fontSize: "clamp(1.25rem, 2vw, 1.5rem)", color: p.text }}
                    >
                      {p.name}
                    </h3>
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className="font-black leading-none"
                        style={{ fontSize: "clamp(2.25rem, 4.5vw, 3rem)" }}
                      >
                        ${price}
                      </span>
                      <span className="text-sm font-semibold" style={{ color: p.subText }}>
                        /{isYearly ? "year" : "month"}
                      </span>
                    </div>
                    {credits && (
                      <span
                        className="self-start inline-block text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-full mt-1"
                        style={{
                          background: p.tier === "starter" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.16)",
                          color: p.text,
                        }}
                      >
                        {credits}
                      </span>
                    )}
                  </div>




                  {/* CTA — hide on Free plan (no checkout needed) */}
                  {p.tier !== "starter" && (() => {
                    const order: PlanTier[] = ["starter", "pro", "elite", "business"];
                    const cur = (currentPlan ?? "starter").toLowerCase() as PlanTier;
                    const curIdx = order.indexOf(cur);
                    const thisIdx = order.indexOf(p.tier);
                    const isCurrent = curIdx === thisIdx;
                    const isLower = thisIdx < curIdx;
                    const label = isCurrent ? "Current plan" : isLower ? `Downgrade to ${p.name}` : `Get ${p.name}`;
                    return (
                      <GlowButton
                        variant={p.tier as "starter" | "pro" | "elite" | "business"}
                        onClick={() => handleSubscribe(p.tier)}
                        disabled={loadingTier !== null || isCurrent}
                        className="mt-6 w-full"
                      >
                        {loadingTier === p.tier ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          label
                        )}
                      </GlowButton>
                    );
                  })()}










                  {/* Features */}
                  <ul className="mt-6 flex-1 flex flex-col">
                    {p.features.map((f, idx) => {
                      const isUnlimited = /unlimited/i.test(f);
                      const isStarter = p.tier === "starter";
                      const dividerColor = isStarter
                        ? "rgba(0,0,0,0.08)"
                        : "rgba(255,255,255,0.14)";
                      return (
                        <li
                          key={f}
                          className="flex items-start gap-3 text-[13.5px] leading-snug py-3"
                          style={{
                            color: isUnlimited ? p.text : p.subText,
                            fontWeight: isUnlimited ? 700 : 500,
                            borderTop: idx === 0 ? "none" : `1px solid ${dividerColor}`,
                          }}
                        >
                          <span className="shrink-0 mt-0.5 inline-flex items-center justify-center">
                            {isUnlimited && !isStarter ? (
                              <MegsyStar className="w-3.5 h-3.5" />
                            ) : (
                              <Check
                                className="w-3 h-3"
                                style={{ color: isUnlimited && isStarter ? "#059669" : p.text }}
                                strokeWidth={3}
                              />
                            )}
                          </span>
                          <span className="flex-1">{f}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>

      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="text-center mb-10"
        >
          <h3
            className="font-black text-foreground leading-tight"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
          >
            Frequently asked questions
          </h3>
          <p className="mt-3 text-muted-foreground text-base">
            Everything you need to know before picking a plan.
          </p>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map((item, i) => (
            <motion.details
              key={item.q}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="group rounded-2xl border border-border bg-card overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-5 py-4 sm:px-6 sm:py-5 hover:bg-muted/40 transition-colors">
                <span className="font-semibold text-foreground text-sm sm:text-base">
                  {item.q}
                </span>
                <ChevronDown className="w-5 h-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-sm text-muted-foreground leading-relaxed">
                {item.a}
              </div>
            </motion.details>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Still have questions?{" "}
          <a href="mailto:support@megsyai.com" className="font-semibold text-foreground hover:underline">
            support@megsyai.com
          </a>
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="theme-fixed flex flex-col items-center gap-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground/70">Secure Payments</p>
            <PaymentMethods variant="light" />
            <DodoPaymentsBadge variant="light" className="mt-1" />
          </div>

          <div className="my-10 h-px w-full bg-border/60" />

          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-muted-foreground/70 order-2 sm:order-1">© 2026 Megsy AI. All Rights Reserved.</p>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground order-1 sm:order-2">
              <a href="/terms" onClick={(e) => { e.preventDefault(); navigate("/terms"); }} className="hover:text-foreground transition-colors">Terms of Service</a>
              <span className="text-border/80" aria-hidden>·</span>
              <a href="/privacy" onClick={(e) => { e.preventDefault(); navigate("/privacy"); }} className="hover:text-foreground transition-colors">Privacy Policy</a>
              <span className="text-border/80" aria-hidden>·</span>
              <a href="/refund" onClick={(e) => { e.preventDefault(); navigate("/refund"); }} className="hover:text-foreground transition-colors">Refund Policy</a>
              <span className="text-border/80" aria-hidden>·</span>
              <a href="/cookies" onClick={(e) => { e.preventDefault(); navigate("/cookies"); }} className="hover:text-foreground transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PricingPage;
