import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PaymentMethods } from "@/components/branding/PaymentMethods";


const footerLinks = {
  Create: [
    { label: "AI Chat", href: "/chat" },
    { label: "Image Generation", href: "/images" },
    { label: "Video Generation", href: "/videos" },
    { label: "Megsy PR", href: "/build" },
  ],
  Product: [
    { label: "Pricing", href: "/pricing" },
    { label: "Enterprise", href: "/enterprise" },
    { label: "About", href: "/about" },
  ],
  Resources: [
    { label: "Blog", href: "/blog" },
    { label: "All-in-one vs Stack", href: "/blog/all-in-one-ai-platform-vs-multiple-subscriptions" },
    { label: "Prompt Writing Guide", href: "/blog/how-to-write-prompts-for-ai-image-generation" },
    { label: "AI Video 2026", href: "/blog/ai-video-generation-2026-state-of-the-art" },
  ],
  Compare: [
    { label: "Megsy vs ChatGPT", href: "/vs/chatgpt" },
    { label: "Megsy vs Midjourney", href: "/vs/midjourney" },
    { label: "Megsy vs Lovable", href: "/vs/lovable" },
  ],
  Company: [
    { label: "Security", href: "/security" },
    { label: "Support", href: "/support" },
    { label: "Contact", href: "/contact" },
    { label: "Egypt 🇪🇬", href: "/egypt" },
  ],
  Legal: [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Refund Policy", href: "/refund" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Content Policy", href: "/policies/content" },
    { label: "AI Disclaimer", href: "/legal/ai-disclaimer" },
  ],
  Trust: [
    { label: "Trust & Compliance", href: "/trust" },
    { label: "DMCA / Copyright", href: "/legal/dmca" },
    { label: "Data Processing (DPA)", href: "/legal/dpa" },
    { label: "Affiliate Terms", href: "/legal/affiliate" },
    { label: "Security", href: "/.well-known/security.txt", external: true as const },
  ],
};

const socialLinks = [
  {
    label: "X",
    href: "https://x.com/megsyai",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/megsyai",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
];

const LandingFooter = () => {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-white/[0.06] bg-black">
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-16">
        {/* Top: Social icons row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex items-center gap-5 md:mb-14 md:gap-6"
        >
          {socialLinks.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="text-white/40 transition-colors hover:text-white"
            >
              {s.icon}
            </a>
          ))}
        </motion.div>

        {/* Main grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:grid-cols-9"
        >
          {/* Brand column */}
          <div className="col-span-2">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="text-lg font-bold text-white">Megsy</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-white/25">
              The all-in-one AI creative platform. Chat, generate images & videos, create apps, and deploy — all powered by 80+ AI models in one unified interface.
            </p>
            <div className="mt-6 max-w-xs text-[11px] leading-relaxed text-white/30">
              <p>
                <a href="mailto:support@megsyai.com" className="text-white/55 hover:text-white">
                  support@megsyai.com
                </a>
              </p>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links], colIdx) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 + colIdx * 0.08 }}
            >
              <h4 className="mb-5 text-sm font-bold text-white">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-white/30 transition-colors hover:text-white/60"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <a
                        href={link.href}
                        onClick={(e) => {
                          if (link.href.startsWith("/")) {
                            e.preventDefault();
                            navigate(link.href);
                          }
                        }}
                        className="text-sm text-white/30 transition-colors hover:text-white/60"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Giant brand name */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-16 overflow-hidden"
        >
          <h2 id="anchor-footer-megsy" className="font-display text-[18vw] font-black uppercase leading-[0.85] tracking-tighter text-purple-500/20 md:text-[12vw]">
            MEGSY
          </h2>
        </motion.div>

        {/* Payment methods + Dodo Payments */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="theme-fixed mt-12 flex flex-col items-center gap-5 border-t border-white/[0.06] pt-10"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/40">
            Secure Payments
          </p>
          <PaymentMethods variant="dark" />

        </motion.div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-6 md:flex-row"
        >
          <div className="flex flex-wrap items-center gap-4 text-xs text-white/20">
            <a href="/terms" onClick={(e) => { e.preventDefault(); navigate("/terms"); }} className="hover:text-white/40 transition-colors">Terms</a>
            <span>|</span>
            <a href="/privacy" onClick={(e) => { e.preventDefault(); navigate("/privacy"); }} className="hover:text-white/40 transition-colors">Privacy</a>
            <span>|</span>
            <a href="/refund" onClick={(e) => { e.preventDefault(); navigate("/refund"); }} className="hover:text-white/40 transition-colors">Refund</a>
            <span>|</span>
            <a href="/acceptable-use" onClick={(e) => { e.preventDefault(); navigate("/acceptable-use"); }} className="hover:text-white/40 transition-colors">Acceptable Use</a>
            <span>|</span>
            <a href="/cookies" onClick={(e) => { e.preventDefault(); navigate("/cookies"); }} className="hover:text-white/40 transition-colors">Cookies</a>
          </div>
          <p className="text-xs text-white/20">© 2026 Megsy AI. All Rights Reserved.</p>
        </motion.div>
      </div>
    </footer>
  );
};

export default LandingFooter;
