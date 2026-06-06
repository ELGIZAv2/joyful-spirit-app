import { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import LandingNavbar from "@/components/landing/LandingNavbar";
import SEOHead from "@/components/common/SEOHead";
import { goBackOr } from "@/lib/navigation";

const LandingFooter = lazy(() => import("@/components/landing/LandingFooter"));

const SectionFallback = () => (
  <div className="min-h-[200px] w-full px-4 py-16 mx-auto max-w-7xl">
    <div className="h-8 w-48 rounded-md bg-foreground/[0.04] animate-pulse mb-6" />
  </div>
);

type Tier = "Free" | "Pro" | "Elite" | "Business";
const TIERS: Tier[] = ["Free", "Pro", "Elite", "Business"];

const TIER_META: Record<Tier, { price: string; subtitle: string }> = {
  Free:     { price: "$0",    subtitle: "Forever free" },
  Pro:      { price: "$25",   subtitle: "For creators" },
  Elite:    { price: "$50",   subtitle: "Most popular" },
  Business: { price: "$125",  subtitle: "For teams" },
};

type Media =
  | { kind: "image"; src: string; alt: string }
  | { kind: "video"; src: string; poster?: string };

interface ServiceDetail {
  name: string;
  tagline: string;
  description: string;
  highlights: string[];
  media: Media;
  values: Record<Tier, string | boolean>;
}

const SERVICES: ServiceDetail[] = [
  {
    name: "AI Chat",
    tagline: "Talk to Megsy AI in one place",
    description:
      "Chat with Megsy AI — our own model built for fast, accurate, multi-turn conversations. Keep your full history, switch reasoning modes, and never get rate-limited on paid plans.",
    highlights: [
      "Powered by Megsy's proprietary model",
      "Persistent conversation history",
      "Multi-turn context with no resets",
      "Free plan uses Megsy Lite",
    ],
    media: { kind: "image", src: "/api-showcase/showcase-1.webp", alt: "Megsy AI chat preview" },
    values: {
      Free: "Megsy Lite — unlimited",
      Pro: "Megsy AI — unlimited",
      Elite: "Megsy AI — unlimited",
      Business: "Megsy AI — unlimited",
    },
  },
  {
    name: "Image Generation",
    tagline: "Studio-quality images from a prompt",
    description:
      "Generate high-resolution images using the top image models. During your unlimited window (7 / 15 / 30 days depending on plan), generate as many as you want. Outside the window, generation uses MC credits.",
    highlights: [
      "Multiple image models in one tool",
      "HD / 4K resolution support",
      "Style presets & custom branding",
      "Bulk generation for campaigns",
    ],
    media: { kind: "image", src: "/api-showcase/image-gen-preview.webp", alt: "Image generation preview" },
    values: {
      Free: false,
      Pro: "Unlimited 7 days / month",
      Elite: "Unlimited 15 days / month",
      Business: "Unlimited all month",
    },
  },
  {
    name: "Video Generation",
    tagline: "AI video — credit-based on all plans",
    description:
      "Generate short videos from text or images. Always credit-based — each video consumes MC from your monthly balance. You're never charged extra; you only spend the credits already included in your plan.",
    highlights: [
      "Text-to-video and image-to-video",
      "Multiple quality presets",
      "Predictable credit cost per video",
      "No surprise overage charges",
    ],
    media: { kind: "video", src: "/api-showcase/video-gen-preview.mp4" },
    values: {
      Free: false,
      Pro: "100 MC included",
      Elite: "250 MC included",
      Business: "600 MC included",
    },
  },
  {
    name: "Slides & Presentations",
    tagline: "Full decks from a prompt — fully editable",
    description:
      "Describe your topic and get a complete presentation with structured slides, images, and speaker notes. Export to PowerPoint or PDF. Free users get 3 generations per day; paid plans unlock long unlimited windows.",
    highlights: [
      "Auto-generated structure & design",
      "Fully editable slide-by-slide",
      "Export to PPTX, PDF, Google Slides",
      "Brand-aware templates (Elite+)",
    ],
    media: { kind: "image", src: "/api-showcase/showcase-2.webp", alt: "Slides preview" },
    values: {
      Free: "3 / day",
      Pro: "Unlimited 7 days / month",
      Elite: "Unlimited 15 days / month",
      Business: "Unlimited all month",
    },
  },
  {
    name: "Docs & Deep Research",
    tagline: "Long-form documents and cited research",
    description:
      "Generate long, structured documents and run multi-source research with inline citations. Perfect for reports, articles, and proposals. Free plan gets 3 of each per day.",
    highlights: [
      "Multi-source web research with citations",
      "Long-form structured documents",
      "Export to DOCX, PDF, Markdown",
      "Custom output tone & length",
    ],
    media: { kind: "image", src: "/api-showcase/showcase-3.webp", alt: "Docs preview" },
    values: {
      Free: "3 / day each",
      Pro: "Unlimited 7 days / month",
      Elite: "Unlimited 15 days / month",
      Business: "Unlimited all month",
    },
  },
  {
    name: "Code Builder",
    tagline: "Build full apps in natural language",
    description:
      "Describe your app and Megsy writes, edits, and deploys it. One-click publishing, custom domains, and full GitHub sync. Unlimited during your plan window.",
    highlights: [
      "Generate full-stack apps & websites",
      "One-click deploy & custom domains",
      "GitHub sync & version control",
      "Live preview while you iterate",
    ],
    media: { kind: "video", src: "/api-showcase/video-1.mp4" },
    values: {
      Free: false,
      Pro: "Unlimited 7 days / month",
      Elite: "Unlimited 15 days / month",
      Business: "Unlimited all month",
    },
  },
  {
    name: "Megsy OS",
    tagline: "Your 24/7 autonomous agent",
    description:
      "Megsy OS runs tasks in the background — monitors projects, executes multi-step workflows, and finishes work while you're offline. Available on Pro and above.",
    highlights: [
      "Multi-step autonomous workflows",
      "Runs 24/7 in the background",
      "Connects across all Megsy tools",
      "Schedule recurring tasks",
    ],
    media: { kind: "video", src: "/api-showcase/video-3.mp4" },
    values: {
      Free: false,
      Pro: "Unlimited tasks",
      Elite: "Unlimited tasks",
      Business: "Unlimited tasks",
    },
  },
  {
    name: "Megsy Credits (MC)",
    tagline: "One credit pool for video & extras",
    description:
      "MC covers video generation and any usage beyond your unlimited windows. Credits reset monthly. No hidden charges — you only ever spend what's in your plan.",
    highlights: [
      "Single transparent currency",
      "Resets every billing cycle",
      "Covers video + overage usage",
      "Never charged beyond your plan",
    ],
    media: { kind: "image", src: "/api-showcase/showcase-4.webp", alt: "Credits preview" },
    values: {
      Free: "0 MC",
      Pro: "100 MC / month",
      Elite: "250 MC / month",
      Business: "600 MC / month",
    },
  },
  {
    name: "Team Workspace",
    tagline: "Collaborate on shared projects",
    description:
      "Shared workspace for your team — projects, chats, and files all in one place. Pro includes a team workspace; Business has unlimited seats with SSO.",
    highlights: [
      "Shared projects, files & history",
      "Role-based permissions",
      "Centralized billing",
      "SSO/SAML on Business",
    ],
    media: { kind: "video", src: "/api-showcase/video-4.mp4" },
    values: {
      Free: false,
      Pro: "Included",
      Elite: "Included",
      Business: "Unlimited seats + SSO",
    },
  },
  {
    name: "Priority Queue & Speed",
    tagline: "3× faster generations on Elite & Business",
    description:
      "Skip the standard queue and get 3× faster generation speeds on Elite and Business plans. Critical for teams working under tight deadlines.",
    highlights: [
      "3× faster on Elite & Business",
      "Skip standard queue",
      "Priority during high-traffic hours",
      "99.9% SLA on Business",
    ],
    media: { kind: "video", src: "/api-showcase/video-5.mp4" },
    values: {
      Free: false,
      Pro: "Standard speed",
      Elite: "3× priority",
      Business: "3× priority + SLA",
    },
  },
  {
    name: "Support",
    tagline: "From community to dedicated success",
    description:
      "Free users get community support. Pro gets priority email. Elite gets 24/7 chat. Business gets a dedicated success manager with white-glove onboarding.",
    highlights: [
      "Community on Free",
      "Priority email on Pro",
      "24/7 chat on Elite",
      "Dedicated manager on Business",
    ],
    media: { kind: "video", src: "/api-showcase/video-6.mp4" },
    values: {
      Free: "Community",
      Pro: "Priority email",
      Elite: "24/7 chat",
      Business: "Dedicated manager",
    },
  },
];

const renderCell = (value: string | boolean) => {
  if (value === true) return <span className="text-foreground font-bold">Included</span>;
  if (value === false) return <span className="text-muted-foreground/50">—</span>;
  return <span className="text-sm font-semibold text-foreground">{value}</span>;
};

const MediaBlock = ({ media }: { media: Media }) => (
  <div className="relative overflow-hidden rounded-[28px] border border-border bg-card aspect-[4/3] sm:aspect-[16/10] shadow-[0_40px_100px_-40px_hsl(var(--foreground)/0.35)]">
    {media.kind === "image" ? (
      <img
        src={media.src}
        alt={media.alt}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
      />
    ) : (
      <video
        src={media.src}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
      />
    )}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-foreground/5 rounded-[28px]"
    />
  </div>
);

const FeaturesGuidePage = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="Megsy Services — Everything explained | Megsy AI"
        description="A clean, in-depth walkthrough of every Megsy service with live previews and a side-by-side plan comparison."
        path="/features-guide"
      />
      <div data-theme="dark" className="min-h-screen overflow-x-hidden bg-background text-foreground">
        <LandingNavbar />

        <main id="main" className="pt-24 sm:pt-28">
          {/* Hero */}
          <section className="relative max-w-5xl mx-auto px-5 sm:px-8 pt-12 sm:pt-20 pb-16 sm:pb-24 text-center">
            <div
              aria-hidden
              className="absolute inset-x-0 -top-10 h-[55vh] -z-10 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 60% 50% at 50% 0%, hsl(var(--foreground) / 0.10), transparent 70%)",
              }}
            />

            <motion.button
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              onClick={() => goBackOr(navigate, "/pricing")}
              className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur-sm text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <span className="leading-none">←</span>
              <span>Back to pricing</span>
            </motion.button>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-[11px] font-bold tracking-[0.32em] uppercase text-muted-foreground/80 mb-6"
            >
              Megsy Services · Plan Comparison
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="font-black tracking-tight leading-[0.95] text-foreground"
              style={{ fontSize: "clamp(2.6rem, 8vw, 6rem)", letterSpacing: "-0.045em" }}
            >
              Everything Megsy
              <br />
              does, explained.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="mx-auto mt-7 max-w-xl text-muted-foreground"
              style={{ fontSize: "clamp(0.98rem, 1.4vw, 1.15rem)", lineHeight: 1.55 }}
            >
              Eleven services, four plans, one transparent system. Scroll through every
              tool with a live preview, then compare plans side by side.
            </motion.p>

            {/* Tier strip */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-10 inline-flex flex-wrap justify-center gap-1.5 p-1.5 rounded-full border border-border bg-card/50 backdrop-blur-sm"
            >
              {TIERS.map((t) => {
                const meta = TIER_META[t];
                return (
                  <div
                    key={t}
                    className="px-4 py-1.5 rounded-full text-[12px] sm:text-[13px] hover:bg-foreground/[0.04] transition-colors"
                  >
                    <span className="font-bold text-foreground">{t}</span>
                    <span className="text-muted-foreground/60 mx-1.5">·</span>
                    <span className="font-medium text-muted-foreground">{meta.price}</span>
                  </div>
                );
              })}
            </motion.div>
          </section>

          {/* Zigzag service sections */}
          <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-24 space-y-24 sm:space-y-32">
            {SERVICES.map((s, i) => {
              const reverse = i % 2 === 1;
              return (
                <motion.article
                  key={s.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.6 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center"
                >
                  <div className={`lg:col-span-5 ${reverse ? "lg:order-2 lg:col-start-8" : ""}`}>
                    <p className="text-[11px] font-bold tracking-[0.26em] uppercase text-muted-foreground/70 mb-4">
                      {String(i + 1).padStart(2, "0")} / {SERVICES.length.toString().padStart(2, "0")}
                    </p>
                    <h2
                      className="font-black tracking-tight text-foreground leading-[1.02]"
                      style={{ fontSize: "clamp(1.85rem, 3.6vw, 2.85rem)", letterSpacing: "-0.025em" }}
                    >
                      {s.name}
                    </h2>
                    <p className="mt-3 text-sm sm:text-[15px] font-semibold text-foreground/60">
                      {s.tagline}
                    </p>
                    <p className="mt-6 text-foreground/75 leading-relaxed text-[15px] sm:text-base max-w-md">
                      {s.description}
                    </p>

                    <ul className="mt-7 space-y-2">
                      {s.highlights.map((h) => (
                        <li
                          key={h}
                          className="flex items-baseline gap-3 text-sm text-foreground/80"
                        >
                          <span className="text-muted-foreground/40 select-none">—</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={`lg:col-span-7 ${reverse ? "lg:order-1 lg:col-start-1" : ""}`}>
                    <MediaBlock media={s.media} />
                  </div>
                </motion.article>
              );
            })}
          </section>

          {/* Full comparison table */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
            <div className="text-center mb-12">
              <p className="text-[11px] font-bold tracking-[0.28em] uppercase text-muted-foreground/70 mb-4">
                Full comparison
              </p>
              <h2
                className="font-black tracking-tight"
                style={{ fontSize: "clamp(1.85rem, 3.6vw, 2.85rem)", letterSpacing: "-0.025em" }}
              >
                All services, side by side.
              </h2>
            </div>

            <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-6 py-6 font-bold text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70 sticky left-0 bg-card/95 backdrop-blur-sm z-10 min-w-[220px]">
                        Service
                      </th>
                      {TIERS.map((t) => {
                        const meta = TIER_META[t];
                        return (
                          <th key={t} className="px-5 py-6 text-center min-w-[150px] border-l border-border/60">
                            <div className="font-black text-base text-foreground tracking-tight">{t}</div>
                            <div className="mt-1 text-[15px] font-bold text-foreground/85">
                              {meta.price}<span className="text-xs text-muted-foreground font-medium">/mo</span>
                            </div>
                            <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-muted-foreground/60 mt-1.5">
                              {meta.subtitle}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {SERVICES.map((s, i) => (
                      <tr
                        key={s.name}
                        className={`border-b border-border/60 last:border-0 transition-colors hover:bg-foreground/[0.025] ${
                          i % 2 === 1 ? "bg-foreground/[0.012]" : ""
                        }`}
                      >
                        <td className="px-6 py-5 sticky left-0 bg-card/95 backdrop-blur-sm z-10">
                          <div className="font-bold text-[15px] text-foreground tracking-tight">{s.name}</div>
                          <div className="text-xs text-muted-foreground/80 font-medium mt-1 max-w-[200px]">
                            {s.tagline}
                          </div>
                        </td>
                        {TIERS.map((t) => (
                          <td
                            key={t}
                            className="px-5 py-5 text-center align-middle border-l border-border/40"
                          >
                            {renderCell(s.values[t])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="mt-5 text-xs text-muted-foreground/70 text-center">
              Yearly plans get 2 months free + bonus MC. All prices in USD.
            </p>
          </section>

          {/* Final CTA */}
          <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-32 text-center">
            <h2
              className="font-black tracking-tight"
              style={{ fontSize: "clamp(2rem, 4.5vw, 3.25rem)", letterSpacing: "-0.03em" }}
            >
              Ready to pick your plan?
            </h2>
            <p className="mt-5 text-muted-foreground max-w-md mx-auto">
              Start free, no card required. Upgrade anytime as you grow.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => navigate("/pricing")}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-foreground text-background text-sm font-bold hover:opacity-90 transition-opacity"
              >
                Go to pricing
                <span className="leading-none">→</span>
              </button>
              <button
                onClick={() => goBackOr(navigate, "/")}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-border text-sm font-semibold text-foreground hover:bg-foreground/[0.04] transition-colors"
              >
                Back
              </button>
            </div>
          </section>
        </main>

        <Suspense fallback={<SectionFallback />}>
          <LandingFooter />
        </Suspense>
      </div>
    </>
  );
};

export default FeaturesGuidePage;

