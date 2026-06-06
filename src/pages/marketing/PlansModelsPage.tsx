import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Check, Minus, Plus } from "lucide-react";
import SEOHead from "@/components/common/SEOHead";
import { API_MODELS, API_CATEGORIES } from "@/lib/apiModelsData";

// Leonardo-style 4-tier plan map
type Plan = { id: string; name: string; color: string; monthly: number; yearly: number; blurb: string; cta: string; bestOffer?: boolean };
const PLANS: Plan[] = [
  {
    id: "free",
    name: "FREE",
    color: "text-white",
    monthly: 0,
    yearly: 0,
    blurb: "Perfect for casual creators who want to explore AI",
    cta: "Start free",
  },
  {
    id: "essential",
    name: "ESSENTIAL",
    color: "text-yellow-400",
    monthly: 12,
    yearly: 10,
    blurb: "Best for daily hobbyists and enthusiasts",
    cta: "Subscribe",
  },
  {
    id: "premium",
    name: "PREMIUM",
    color: "text-emerald-400",
    monthly: 30,
    yearly: 25,
    blurb: "Best for semi-pros and active creators who need more output",
    cta: "Subscribe",
    bestOffer: true,
  },
  {
    id: "ultimate",
    name: "ULTIMATE",
    color: "text-rose-500",
    monthly: 60,
    yearly: 50,
    blurb: "Perfect for professional creators, small businesses and producers",
    cta: "Subscribe",
  },
];

type TabKey = "power" | "features" | "workflow";

const TAB_ROWS: Record<TabKey, Array<{ label: string; values: [string, string, string, string] }>> = {
  power: [
    { label: "Fast Tokens", values: ["150 / daily", "8,500 / monthly", "25,000 / monthly", "60,000 / monthly"] },
    { label: "Rollover Token Bank Capacity", values: ["—", "25,500", "75,000", "180,000"] },
    { label: "Top-up Tokens", values: ["—", "✓", "✓", "✓"] },
    { label: "Concurrent Generations Limit", values: ["—", "2", "3", "6"] },
    { label: "Generation Queue Limit", values: ["—", "5", "10", "20"] },
    { label: "Unlimited* Relaxed Image Generation", values: ["—", "—", "Selected models", "Selected models"] },
    { label: "Unlimited* Relaxed Video Generation", values: ["—", "—", "—", "Selected models"] },
    { label: "Relaxed Image Queue Limit", values: ["—", "—", "5", "5"] },
    { label: "Relaxed Video Queue Limit", values: ["—", "—", "—", "20"] },
    { label: "Blueprints Concurrency Limit", values: ["1", "2", "3", "6"] },
    { label: "Blueprints Queue Limit", values: ["5", "5", "10", "20"] },
  ],
  features: [
    { label: "Image Generation", values: ["✓", "✓", "Unlimited relaxed*", "Unlimited relaxed*"] },
    { label: "Video Generation", values: ["✓", "✓", "✓", "Unlimited relaxed*"] },
    { label: "Blueprints", values: ["Limited", "✓", "✓", "✓"] },
    { label: "Flow State", values: ["✓", "✓", "✓", "✓"] },
    { label: "Ultra Quality", values: ["Limited", "✓", "✓", "✓"] },
    { label: "Image Guidance Reference Limit", values: ["Limited", "6", "6", "6"] },
    { label: "Video Guidance Reference Limit", values: ["Limited", "✓", "✓", "✓"] },
    { label: "Realtime Canvas", values: ["Limited", "✓", "✓", "✓"] },
    { label: "Realtime Generation", values: ["Limited", "✓", "✓", "✓"] },
    { label: "Prompt Enhance", values: ["✓", "✓", "✓", "✓"] },
    { label: "Universal Upscaler", values: ["—", "✓", "✓", "✓"] },
    { label: "Style References", values: ["—", "✓", "✓", "✓"] },
    { label: "Character References", values: ["—", "✓", "✓", "✓"] },
    { label: "AI Avatars", values: ["—", "✓", "✓", "✓"] },
    { label: "Lipsync", values: ["—", "✓", "✓", "✓"] },
  ],
  workflow: [
    { label: "Private Mode", values: ["—", "—", "✓", "✓"] },
    { label: "Commercial Use", values: ["—", "✓", "✓", "✓"] },
    { label: "Asset Library", values: ["✓", "✓", "✓", "✓"] },
    { label: "Folders & Organization", values: ["Limited", "✓", "✓", "✓"] },
    { label: "Team Workspace", values: ["—", "—", "✓", "✓"] },
    { label: "API Access", values: ["—", "—", "—", "✓"] },
    { label: "Priority Queue", values: ["—", "—", "✓", "✓"] },
    { label: "Priority Support", values: ["—", "—", "✓", "✓"] },
    { label: "Dedicated Account Manager", values: ["—", "—", "—", "✓"] },
  ],
};

const FAQS = [
  {
    q: "How do models work?",
    a: "Every Megsy plan unlocks the full library of AI models. Each generation consumes Fast Tokens based on the model and settings you choose. Higher-tier plans get more monthly tokens and faster queues.",
  },
  {
    q: "Will I own the images I make?",
    a: "Yes. On any paid plan you own full commercial rights to anything you generate, including images, video and audio.",
  },
  {
    q: "Tokens and Token Rollover at Megsy",
    a: "Unused Fast Tokens roll over into your Token Bank up to your plan's cap, so a quiet month is never wasted.",
  },
  {
    q: "What happens if I run out of tokens in my paid plan?",
    a: "You can continue with Relaxed generations (where supported) or top up additional tokens at any time without changing plans.",
  },
  {
    q: "What is Token Rollover and how does it work?",
    a: "Each billing cycle, leftover Fast Tokens are added to your Token Bank, capped per plan. They are consumed after your monthly allocation.",
  },
  {
    q: 'How do the "Unlimited" Plans and "Relaxed Generation" work?',
    a: "On Premium and Ultimate, selected models run in a Relaxed queue with no per-generation token cost. Speed depends on demand.",
  },
  {
    q: "How does Unlimited Video Generation work?",
    a: "Ultimate unlocks relaxed unlimited video generation on supported models (Motion 1.0, 2.0, 2.0 Fast). Subject to fair-use queue concurrency.",
  },
  {
    q: "Why does video use more tokens?",
    a: "Video models render many frames per second. Each frame is roughly an image generation, so longer clips and higher resolutions cost proportionally more.",
  },
  {
    q: "Can I use my generated images for commercial projects?",
    a: "Yes, on any paid plan. Free is limited to personal, non-commercial use.",
  },
  {
    q: "Can I change my plan later?",
    a: "Anytime. Upgrades are prorated immediately and downgrades take effect at the next billing cycle.",
  },
  {
    q: "Does the pricing include tax?",
    a: "Prices are shown excluding tax. Applicable VAT/GST is added at checkout based on your country.",
  },
  {
    q: "Does Megsy have an API?",
    a: "Yes — Ultimate includes API access with webhooks and per-key analytics.",
  },
  {
    q: "Can I buy more tokens if I run out?",
    a: "Yes. Top-up tokens are available on all paid plans and never expire while your subscription is active.",
  },
];

const PlansModelsPage = () => {
  const navigate = useNavigate();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [tab, setTab] = useState<TabKey>("power");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <SEOHead
        title="Plans & Models — Megsy"
        description="Compare Megsy plans and every model included: chat, image, video, avatars and more."
        path="/plans-models"
      />
      <div data-theme="dark" className="min-h-screen bg-black text-white overflow-x-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-[13px] text-white/70 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <div className="font-black tracking-[-0.02em] text-lg md:text-xl">MEGSY.AI</div>
            <div className="w-12" />
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 md:px-8 pb-24">
          {/* Hero */}
          <section className="pt-10 md:pt-20 pb-10 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-black uppercase tracking-[-0.02em] leading-[0.95] text-[40px] sm:text-6xl md:text-7xl lg:text-[88px]"
            >
              Create across image,<br />video, design, and motion
            </motion.h1>
            <p className="mt-6 text-white/60 text-sm md:text-base">One subscription, all platforms</p>

            {/* Billing toggle */}
            <div className="mt-8 inline-flex items-center p-1.5 rounded-full bg-white/[0.04] border border-white/10">
              <button
                onClick={() => setBilling("yearly")}
                className={`relative px-5 py-2 rounded-full text-[13px] font-semibold transition-colors flex items-center gap-2 ${
                  billing === "yearly" ? "bg-white text-black" : "text-white/70 hover:text-white"
                }`}
              >
                Pay Yearly
                <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-black text-[10px] font-bold leading-none">
                  Up to 20% off
                </span>
              </button>
              <button
                onClick={() => setBilling("monthly")}
                className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-colors ${
                  billing === "monthly" ? "bg-white text-black" : "text-white/70 hover:text-white"
                }`}
              >
                Pay Monthly
              </button>
            </div>
          </section>

          {/* Plan cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map((plan) => {
              const price = billing === "yearly" ? plan.yearly : plan.monthly;
              return (
                <div
                  key={plan.id}
                  className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-7 flex flex-col text-center"
                >
                  {plan.bestOffer && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-md bg-emerald-400 text-black text-[11px] font-black uppercase tracking-wider">
                      Best Offer
                    </span>
                  )}
                  <h3 className={`font-black uppercase tracking-[-0.02em] text-3xl md:text-4xl ${plan.color}`}>
                    {plan.name}
                  </h3>
                  <div className="mt-6 flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-black tracking-tight">${price}</span>
                    <span className="text-white/60 text-sm">/month</span>
                  </div>
                  <p className="mt-1 text-white/40 text-xs">ex. tax.</p>
                  <button
                    onClick={() => navigate("/pricing")}
                    className="mt-6 w-full h-11 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white text-[14px] font-bold transition-colors"
                  >
                    {plan.cta}
                  </button>
                  <p className="mt-6 text-[12.5px] text-white/65 leading-snug">{plan.blurb}</p>
                </div>
              );
            })}
          </section>

          {/* Comparison Tabs */}
          <section className="mt-20 md:mt-28">
            <div className="flex items-center justify-center md:justify-start mb-6 overflow-x-auto">
              <div className="inline-flex items-center p-1.5 rounded-full bg-white/[0.04] border border-white/10">
                {([
                  ["power", "Generation Power"],
                  ["features", "Features"],
                  ["workflow", "Workflow"],
                ] as const).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setTab(k)}
                    className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors whitespace-nowrap ${
                      tab === k ? "bg-white text-black" : "text-white/70 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sticky header row with plan names */}
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <div className="min-w-[760px] md:min-w-0 px-4 md:px-0">
                <div className="grid grid-cols-[1.4fr_repeat(4,1fr)] items-end py-5 border-b border-white/10">
                  <div />
                  {PLANS.map((p) => (
                    <div key={p.id} className={`text-center font-black uppercase text-xl md:text-2xl tracking-[-0.02em] ${p.color}`}>
                      {p.name}
                    </div>
                  ))}
                </div>

                {TAB_ROWS[tab].map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-[1.4fr_repeat(4,1fr)] items-center py-5 border-b border-white/[0.06] text-[13px]"
                  >
                    <div className="text-white/85 font-medium pr-4">{row.label}</div>
                    {row.values.map((v, i) => (
                      <div key={i} className="text-center text-white/80 px-2 leading-snug">
                        {v}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-6 text-center text-white/50 text-[12.5px] max-w-3xl mx-auto px-4">
              * Unlimited relaxed generations apply only to image and video generation using selected models, depending on the plan. Concurrency and queuing may be slowed at peak times to ensure fair access for all users.
            </p>
          </section>

          {/* Models library */}
          <section className="mt-24 md:mt-32">
            <div className="text-center mb-10">
              <h2 className="font-black uppercase tracking-[-0.02em] text-4xl md:text-6xl">
                {API_MODELS.length}+ models.<br />All unlocked.
              </h2>
              <p className="mt-4 text-white/60 max-w-lg mx-auto">
                Every plan gives you access to the entire roster — only your monthly tokens differ.
              </p>
            </div>

            <div className="space-y-10">
              {API_CATEGORIES.map((cat) => {
                const models = API_MODELS.filter((m) => m.category === cat.id);
                if (!models.length) return null;
                return (
                  <div key={cat.id}>
                    <div className="flex items-baseline justify-between mb-3">
                      <h3 className="text-lg md:text-xl font-black uppercase tracking-tight">{cat.label}</h3>
                      <span className="text-[11px] uppercase tracking-widest text-white/40">{models.length} models</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {models.map((m) => (
                        <div
                          key={m.id}
                          className="rounded-xl p-4 bg-white/[0.03] border border-white/[0.06] hover:border-white/20 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="text-[14px] font-bold tracking-tight">{m.name}</h4>
                            <span className="shrink-0 px-2 py-0.5 rounded-full bg-white/[0.08] text-[10px] font-bold tabular-nums">
                              {m.credits} MC
                            </span>
                          </div>
                          <p className="mt-1.5 text-[12px] text-white/55 leading-snug line-clamp-2">{m.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Need help choosing */}
          <section className="mt-24 md:mt-32">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-rose-900 via-rose-800 to-rose-950 p-10 md:p-20 text-center">
              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_60%)]" />
              <div className="relative">
                <h2 className="font-black uppercase tracking-[-0.02em] text-4xl md:text-7xl leading-[0.95]">
                  Need help<br />choosing?
                </h2>
                <p className="mt-5 text-white/85 max-w-md mx-auto text-sm md:text-base">
                  If you're unsure which tier fits your creative needs, we're here to help. Contact support or explore our help resources for more detail.
                </p>
                <button
                  onClick={() => navigate("/contact")}
                  className="mt-7 h-11 px-7 rounded-full bg-white text-black text-[14px] font-bold hover:bg-white/90 transition-colors"
                >
                  Contact us
                </button>
              </div>
            </div>
          </section>

          {/* FAQs */}
          <section className="mt-24 md:mt-32">
            <h2 className="font-black uppercase tracking-[-0.04em] text-[80px] sm:text-[140px] md:text-[200px] leading-[0.85] text-indigo-500 break-words">
              FAQS
            </h2>

            <div className="mt-10 md:mt-14">
              {FAQS.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div key={i} className="border-b border-white/10">
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="w-full flex items-center justify-between gap-4 py-5 md:py-6 text-left"
                    >
                      <span className="text-base md:text-lg font-bold">{f.q}</span>
                      {open ? (
                        <Minus className="w-5 h-5 text-indigo-400 shrink-0" />
                      ) : (
                        <Plus className="w-5 h-5 text-indigo-400 shrink-0" />
                      )}
                    </button>
                    {open && (
                      <p className="pb-5 md:pb-6 pr-8 text-white/65 text-sm md:text-[15px] leading-relaxed">
                        {f.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default PlansModelsPage;
