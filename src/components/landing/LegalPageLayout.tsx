import { motion } from "framer-motion";
import { useEffect } from "react";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import SEOHead from "@/components/common/SEOHead";

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  list?: string[];
}

export type HeroVariant = "lake" | "nature" | "team" | "portrait" | "cairo" | "engineer";

interface LegalPageLayoutProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: LegalSection[];
  seoTitle: string;
  seoDescription: string;
  canonicalPath: string;
  heroVariant?: HeroVariant;
}

const LegalPageLayout = ({
  eyebrow,
  title,
  subtitle,
  lastUpdated,
  sections,
  seoTitle,
  seoDescription,
  canonicalPath,
  heroVariant: _heroVariant = "lake",
}: LegalPageLayoutProps) => {
  void _heroVariant;
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;
    let destroy: (() => void) | undefined;
    const start = async () => {
      const { default: Lenis } = await import("lenis");
      const lenis = new Lenis({
        duration: 1.6,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      let rafId = 0;
      const raf = (time: number) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
      destroy = () => {
        cancelAnimationFrame(rafId);
        lenis.destroy();
      };
    };
    const idle = (window as any).requestIdleCallback;
    const handle = idle ? idle(start, { timeout: 1500 }) : setTimeout(start, 400);
    return () => {
      if (idle && (window as any).cancelIdleCallback) (window as any).cancelIdleCallback(handle);
      else clearTimeout(handle as any);
      destroy?.();
    };
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SEOHead title={seoTitle} description={seoDescription} path={canonicalPath} />
      <LandingNavbar />

      {/* HERO — landing style */}
      <section className="relative overflow-hidden bg-background pb-10 pt-32 text-center md:pt-44">
        <div className="mx-auto w-full max-w-4xl px-4">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground"
          >
            {eyebrow}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="font-display text-[9vw] uppercase leading-[0.95] tracking-tight text-foreground md:text-[5.5vw]"
          >
            {title}
          </motion.h1>
        </div>
      </section>

      {/* INTRO */}
      <section className="relative pb-12 pt-12 md:pb-20 md:pt-16">
        <div className="mx-auto max-w-3xl px-6">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg leading-relaxed text-white/65 md:text-xl"
          >
            {subtitle}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-8 inline-block border-l-2 border-white/20 pl-4 text-xs font-mono text-white/45"
          >
            Last updated: {lastUpdated}
            <br />
            Megsy for Digital Platforms & E-Commerce Development LLC
            <br />
            58 El-Hegaz St., Amoun Tower, Unit 84, Floor 8, Sheraton Al-Matar,
            <br />
            Al-Nozha District, Cairo Governorate, Arab Republic of Egypt
            <br />
            CR 248691 · Tax 774034785
          </motion.p>
        </div>
      </section>



      {/* SECTIONS */}
      <section className="relative pb-32">
        <div className="mx-auto max-w-3xl px-6">
          <div className="space-y-20 md:space-y-28">
            {sections.map((section, idx) => (
              <motion.article
                key={idx}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <div className="mb-6 flex items-baseline gap-4 border-b border-white/[0.06] pb-4">
                  <span className="font-mono text-sm text-white/30">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
                    {section.heading}
                  </h2>
                </div>
                {section.paragraphs?.map((p, pi) => (
                  <p
                    key={pi}
                    className="mb-5 text-[15px] leading-relaxed text-white/65 md:text-base"
                  >
                    {p}
                  </p>
                ))}
                {section.list && (
                  <ul className="mt-4 space-y-3 border-l border-white/[0.08] pl-5">
                    {section.list.map((item, li) => (
                      <li key={li} className="text-[15px] leading-relaxed text-white/55">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.article>
            ))}
          </div>

          {/* Contact block */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mt-28 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 md:p-12"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/35">
              Questions?
            </p>
            <h3 className="mt-4 font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
              Reach our legal & support team
            </h3>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/55">
              For any inquiry about this policy, account requests, refunds, or data
              protection rights, contact us at the address below. We respond within 5
              business days.
            </p>
            <div className="mt-8 grid gap-6 border-t border-white/[0.06] pt-8 text-sm md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/35">Email</p>
                <a
                  href="mailto:support@megsyai.com"
                  className="mt-1 block font-mono text-white/80 hover:text-white"
                >
                  support@megsyai.com
                </a>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-white/35">Legal entity</p>
                <p className="mt-1 text-white/75">
                  Megsy for Digital Platforms & E-Commerce Development LLC
                </p>
                <p className="mt-1 text-xs text-white/55">
                  58 El-Hegaz St., Amoun Tower, Unit 84, Floor 8,<br />
                  Sheraton Al-Matar, Al-Nozha, Cairo, Egypt
                </p>
                <p className="mt-1 font-mono text-xs text-white/45">
                  CR 248691 · Tax 774034785
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default LegalPageLayout;
