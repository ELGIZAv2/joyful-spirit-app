import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUp, Check, Sparkles, ChevronRight, Globe } from "lucide-react";
import { Helmet } from "react-helmet-async";
import {
  SERVICE_LANDINGS,
  getLandingBySlug,
  type ServiceLanding,
} from "@/data/serviceLandings";
import LandingNavbar from "@/components/landing/LandingNavbar";
const LandingFooter = lazy(() => import("@/components/landing/LandingFooter"));

const SITE_URL = "https://megsyai.com";

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-foreground/10 bg-background/40 backdrop-blur-xl">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-start"
      >
        <span className="font-semibold text-foreground">{q}</span>
        <ChevronRight
          className={`w-4 h-4 opacity-60 transition-transform ${open ? "rotate-90" : ""} rtl:rotate-180`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 text-[14.5px] text-muted-foreground leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

export default function ServiceLandingPage() {
  // Support nested slugs (e.g. /l/ar/build-ai-apps, /l/models/nano-banana-pro)
  const params = useParams();
  const location = useLocation();
  // react-router gives us params; we rebuild the full slug from the wildcard
  const wildcard = (params["*"] as string | undefined) ?? params.slug ?? "";
  // When mounted on locale-prefixed aliases like /pt/<slug>, prepend the locale
  // so we match the stored slug "pt/<slug>".
  const fullSlug = useMemo(() => {
    const m = location.pathname.match(/^\/(ar|es|fr|de|pt)\//);
    if (m && !wildcard.startsWith(`${m[1]}/`)) return `${m[1]}/${wildcard}`;
    return wildcard;
  }, [location.pathname, wildcard]);
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");

  const landing = useMemo<ServiceLanding | undefined>(
    () => getLandingBySlug(fullSlug),
    [fullSlug],
  );

  useEffect(() => {
    if (!landing) return;
    document.documentElement.lang = landing.locale;
    document.documentElement.dir = landing.dir ?? "ltr";
  }, [landing]);

  if (!landing) {
    return <Navigate to="/" replace />;
  }

  const canonical = `${SITE_URL}/l/${landing.slug}`;
  const isRTL = landing.dir === "rtl";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = landing.primaryCta.href;
    const url = prompt.trim()
      ? `${target}${target.includes("?") ? "&" : "?"}prompt=${encodeURIComponent(prompt.trim())}`
      : target;
    navigate(url);
  };

  // JSON-LD
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: landing.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const productLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: landing.title.split(" — ")[0],
    description: landing.description,
    applicationCategory: "AIApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  // Related landings (same category, different slug)
  const related = SERVICE_LANDINGS.filter(
    (l) => l.category === landing.category && l.slug !== landing.slug,
  ).slice(0, 6);

  return (
    <>
      <Helmet>
        <html lang={landing.locale} dir={landing.dir ?? "ltr"} />
        <title>{landing.title}</title>
        <meta name="description" content={landing.description} />
        {landing.keywords && <meta name="keywords" content={landing.keywords} />}
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <meta property="og:title" content={landing.title} />
        <meta property="og:description" content={landing.description} />
        <meta property="og:site_name" content="Megsy AI" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={landing.title} />
        <meta name="twitter:description" content={landing.description} />
        <script type="application/ld+json">{JSON.stringify(productLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
      </Helmet>

      <div
        className="min-h-[100dvh] w-full bg-white dark:bg-[#0A0A0A] text-foreground overflow-x-hidden"
        dir={landing.dir ?? "ltr"}
      >
        {/* Ambient background (dark mode) */}
        <div className="hidden dark:block pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-1/2 -start-1/2 w-[120vw] h-[120vh] rounded-full bg-purple-500/10 blur-[120px]" />
          <div className="absolute -bottom-1/2 -end-1/2 w-[100vw] h-[100vh] rounded-full bg-pink-500/10 blur-[120px]" />
        </div>

        {/* Real landing navbar — identical to homepage */}
        <LandingNavbar />


        {/* Hero */}
        <main className="px-4 md:px-8 pt-12 md:pt-24 pb-16">
          <div className="max-w-[920px] mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-foreground/10 bg-background/40 backdrop-blur-xl text-[12px] font-medium text-muted-foreground"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              {landing.eyebrow}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 text-[40px] md:text-[68px] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground"
            >
              {landing.heading}{" "}
              <span
                className="inline-block italic font-normal text-purple-400"
                style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: "1.15em",
                  lineHeight: 1,
                }}
              >
                {landing.headingAccent}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-5 max-w-[680px] mx-auto text-[16px] md:text-[18px] text-muted-foreground leading-relaxed"
            >
              {landing.subhead}
            </motion.p>

            {/* Composer-style input */}
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-10 max-w-[720px] mx-auto"
            >
              <div className="flex items-center gap-2 p-2 rounded-3xl border border-foreground/10 bg-background/60 backdrop-blur-2xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)]">
                <input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={landing.placeholder}
                  className="flex-1 h-12 px-4 bg-transparent outline-none text-[15px] placeholder:text-muted-foreground"
                  aria-label="Prompt"
                />
                <button
                  type="submit"
                  className="h-12 w-12 rounded-2xl bg-foreground text-background grid place-items-center hover:opacity-90 transition shrink-0"
                  aria-label="Submit"
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(landing.primaryCta.href)}
                  className="h-10 px-5 rounded-full bg-purple-500 text-white text-sm font-semibold hover:bg-purple-600 transition"
                >
                  {landing.primaryCta.label}
                </button>
                {landing.secondaryCta && (
                  <button
                    type="button"
                    onClick={() => navigate(landing.secondaryCta!.href)}
                    className="h-10 px-5 rounded-full border border-foreground/15 text-sm font-medium hover:bg-foreground/5 transition"
                  >
                    {landing.secondaryCta.label}
                  </button>
                )}
              </div>
            </motion.form>

            {landing.highlights && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                {landing.highlights.map((h) => (
                  <span
                    key={h}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-foreground/10 bg-background/40 text-[12.5px] text-muted-foreground"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    {h}
                  </span>
                ))}
              </div>
            )}

            {landing.trustNote && (
              <p className="mt-6 text-xs text-muted-foreground">{landing.trustNote}</p>
            )}
          </div>

          {/* Features */}
          <section className="mt-24 max-w-[1100px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {landing.features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="p-6 md:p-8 rounded-3xl border border-foreground/10 bg-background/40 backdrop-blur-xl"
                >
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    {f.title}
                  </h2>
                  <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">
                    {f.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Models */}
          {landing.models && landing.models.length > 0 && (
            <section className="mt-24 max-w-[1100px] mx-auto">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">
                {isRTL ? "النماذج المدعومة" : "Models inside"}
              </h2>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {landing.models.map((m) => (
                  <div
                    key={m.name}
                    className="p-5 rounded-2xl border border-foreground/10 bg-background/40 backdrop-blur-xl"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-[15px] text-foreground">
                        {m.name}
                      </h3>
                      {m.tag && (
                        <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground border border-foreground/10 rounded-full px-2 py-0.5">
                          {m.tag}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-[13.5px] text-muted-foreground leading-relaxed">
                      {m.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* FAQ */}
          <section className="mt-24 max-w-[820px] mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">
              {isRTL ? "أسئلة شائعة" : "Frequently asked"}
            </h2>
            <div className="mt-8 space-y-3">
              {landing.faqs.map((f) => (
                <FAQItem key={f.q} q={f.q} a={f.a} />
              ))}
            </div>
          </section>

          {/* CTA band */}
          <section className="mt-24 max-w-[920px] mx-auto">
            <div className="p-10 md:p-14 rounded-[32px] border border-foreground/10 bg-gradient-to-br from-purple-500/15 via-pink-500/10 to-transparent backdrop-blur-2xl text-center">
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
                {landing.heading}{" "}
                <span
                  className="italic font-normal text-purple-400"
                  style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                >
                  {landing.headingAccent}
                </span>
              </h2>
              <p className="mt-4 text-muted-foreground max-w-[520px] mx-auto">
                {landing.subhead}
              </p>
              <button
                onClick={() => navigate(landing.primaryCta.href)}
                className="mt-8 h-12 px-7 rounded-full bg-foreground text-background font-semibold hover:opacity-90 transition"
              >
                {landing.primaryCta.label}
              </button>
            </div>
          </section>

          {/* Related */}
          {related.length > 0 && (
            <section className="mt-24 max-w-[1100px] mx-auto">
              <h2 className="text-xl font-semibold text-foreground/80">
                {isRTL ? "صفحات ذات صلة" : "Related pages"}
              </h2>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {related.map((r) => (
                  <a
                    key={r.slug}
                    href={`/l/${r.slug}`}
                    className="group p-4 rounded-2xl border border-foreground/10 bg-background/40 backdrop-blur-xl hover:border-foreground/25 transition"
                  >
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                      <Globe className="w-3 h-3" /> {r.locale}
                    </div>
                    <div className="mt-1.5 font-semibold text-foreground group-hover:text-purple-400 transition">
                      {r.title}
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Real landing footer — identical to homepage */}
        <Suspense fallback={null}>
          <LandingFooter />
        </Suspense>

      </div>
    </>
  );
}
