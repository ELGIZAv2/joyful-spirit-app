import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import SEOHead from "@/components/common/SEOHead";
import founderHamza from "@/assets/about-founder-hamza.webp";
import founderAbdalla from "@/assets/about-founder-abdalla.webp";
import heroCairo from "@/assets/about-cairo.webp";

const founders = [
  {
    name: "Hamza Hassan",
    role: "Co-Founder",
    img: founderAbdalla,
    bio: "Drives product, design and the obsessive details. Believes great AI should disappear into the work.",
    rotate: -4,
    y: 20,
  },
  {
    name: "Abdalla Mohamed",
    role: "Co-Founder",
    img: founderHamza,
    bio: "Leads engineering and infrastructure. Obsessed with making complex systems feel calm.",
    rotate: 4,
    y: 0,
  },
];

// Real platform features (from the product itself)
const features = [
  { n: "01", title: "AI Chat", sub: "Megsy V1", desc: "Conversational AI with web search, deep research and file upload — built on top of 36+ underlying engines." },
  { n: "02", title: "Image Generation", sub: "Megsy Imagine", desc: "Text-to-image and image-to-image with multiple models, aspect ratios from 1:1 to 21:9, up to 4K." },
  { n: "03", title: "Video Generation", sub: "Megsy Video", desc: "Text-to-video and image-to-video. Durations from 5 to 10 seconds, with audio support." },
  { n: "04", title: "Code Builder", sub: "Apps & Web", desc: "Describe what you want and Megsy builds and deploys a working web app inside a sandbox." },
  { n: "05", title: "File Analysis", sub: "Documents & Data", desc: "Upload PDFs, images and documents — Megsy reads, extracts and answers questions about them." },
];

const values = [
  { title: "Built for creators", desc: "Every tool is designed around people who actually ship — not benchmarks." },
  { title: "Honest by default", desc: "One transparent credit, clear pricing, no hidden lock-ins." },
  { title: "Made in Egypt", desc: "Designed and built in Cairo. Serving creators in any language they write in." },
  { title: "Your work is yours", desc: "We never train on your private projects. Delete your account and data any time from settings." },
];

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div data-theme="dark" className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SEOHead
        title="About Megsy AI — One Workspace for Chat, Image, Video & Code"
        description="Megsy AI is an all-in-one creative platform unifying chat, image, video, code and file analysis behind one workspace and one credit. Built in Cairo by two founders."
        path="/about"
      />
      <LandingNavbar />

      {/* HERO — landing style */}
      <section className="relative flex flex-col items-center overflow-hidden bg-background pb-10 pt-32 md:min-h-screen md:pt-44">
        <div className="relative z-30 mx-auto w-full px-4 text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground"
          >
            About Megsy AI
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="font-display text-[9vw] uppercase leading-[0.95] tracking-tight text-foreground md:text-[5.5vw]"
          >
            Two founders.{" "}
            <span className="text-primary">One creative workspace.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-4 max-w-2xl px-2 text-[13px] leading-snug text-muted-foreground md:mt-6 md:text-lg"
          >
            Chat, image, video, code and file analysis — built into a single workspace,
            priced in a single credit. Designed and built in Cairo.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row md:mt-8 md:gap-4"
          >
            <button
              onClick={() => navigate("/auth")}
              className="group relative overflow-hidden rounded-full p-[2px] transition-transform hover:scale-[1.03]"
              style={{
                background:
                  "conic-gradient(from var(--angle, 0deg), #c0c0c0, #ffffff, #8a8a8a, #ffffff, #c0c0c0)",
                animation: "silver-spin 4s linear infinite",
              }}
            >
              <span className="relative block rounded-full bg-black px-8 py-3 text-sm font-semibold text-white md:px-10 md:py-4 md:text-base">
                Start using Megsy
              </span>
            </button>
            <button
              onClick={() => navigate("/contact")}
              className="rounded-full border border-border/40 bg-white/5 px-8 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-white/10 md:px-10 md:py-4 md:text-base"
            >
              Talk to us
            </button>
          </motion.div>
        </div>

        {/* Founder portrait fan */}
        <div className="relative z-0 mt-10 flex w-full max-w-[1100px] items-end justify-center gap-4 px-4 pb-4 md:mt-14 md:gap-8">
          {founders.map((f, i) => (
            <motion.div
              key={f.name}
              initial={{ opacity: 0, y: 100, rotate: f.rotate }}
              animate={{ opacity: 1, y: f.y, rotate: f.rotate }}
              transition={{ duration: 0.8, delay: 0.5 + i * 0.15, ease: "easeOut" }}
              className="relative w-[44%] overflow-hidden rounded-2xl border border-border/30 shadow-2xl md:w-[26%]"
              style={{ aspectRatio: "3/4" }}
            >
              <img
                src={f.img}
                alt={f.name}
                loading="eager"
                width={1024}
                height={1365}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 md:p-5">
                <p className="font-display text-sm font-bold text-white md:text-base">
                  {f.name}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/70 md:text-xs">
                  {f.role}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* INTRO */}
      <section className="border-t border-border/30 py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl items-start gap-12 px-6 md:grid-cols-12 md:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="md:col-span-5"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Why we built it
            </p>
            <h2 className="mt-4 font-display text-4xl uppercase leading-[0.95] tracking-tight text-foreground md:text-5xl">
              Too many tabs.{" "}
              <span className="text-primary">Too many subscriptions.</span>
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="space-y-5 text-base leading-relaxed text-muted-foreground md:col-span-7 md:text-lg"
          >
            <p>
              Every new AI model arrives in its own tab, with its own pricing and its own
              quirks. Creators end up spending more time switching apps than actually making
              things.
            </p>
            <p>
              So we built Megsy: one workspace where chat, images, video, code and files all
              live together — running on the best engines available, priced in a single
              credit (MC).
            </p>
            <p>
              We are two founders, working from Cairo, building the tool we wished existed.
              Small enough to answer every email. Honest enough to tell you what each feature
              actually costs.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FOUNDERS — editorial cards */}
      <section className="border-t border-border/30 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-14 max-w-3xl"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              The founders
            </p>
            <h2 className="mt-4 font-display text-4xl uppercase leading-[0.95] tracking-tight text-foreground md:text-6xl">
              The two builders <span className="text-primary">behind Megsy.</span>
            </h2>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 md:gap-10">
            {founders.map((f, i) => (
              <motion.div
                key={f.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.1 }}
                className="overflow-hidden rounded-3xl border border-border/30 bg-white/[0.02]"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={f.img}
                    alt={f.name}
                    loading="lazy"
                    width={1024}
                    height={1280}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
                <div className="p-7 md:p-9">
                  <h3 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                    {f.name}
                  </h3>
                  <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                    {f.role}
                  </p>
                  <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                    {f.bio}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES — real product */}
      <section className="border-y border-border/30 py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-16 max-w-3xl"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              The platform
            </p>
            <h2 className="mt-4 font-display text-4xl uppercase leading-[0.95] tracking-tight text-foreground md:text-6xl">
              Five tools. <span className="text-primary">One workspace.</span>
            </h2>
            <p className="mt-5 text-base text-muted-foreground md:text-lg">
              Every feature in Megsy runs on the same workspace and the same credit. No more
              juggling subscriptions across half a dozen tools.
            </p>
          </motion.div>

          <div className="grid gap-px overflow-hidden rounded-3xl border border-border/30 bg-border/40 md:grid-cols-2">
            {features.map((d, i) => (
              <motion.div
                key={d.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                className="bg-background p-8 transition-colors hover:bg-white/[0.02] md:p-10"
              >
                <p className="font-mono text-xs text-primary">{d.n}</p>
                <h3 className="mt-3 font-display text-xl font-bold text-foreground md:text-2xl">
                  {d.title}
                </h3>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  {d.sub}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
                  {d.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CAIRO BAND */}
      <section className="relative h-[60vh] min-h-[420px] w-full overflow-hidden">
        <img
          src={heroCairo}
          alt="Cairo at golden hour"
          loading="lazy"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/30" />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9 }}
              className="max-w-2xl"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/80">
                Built in Cairo
              </p>
              <h2 className="mt-4 font-display text-4xl uppercase leading-[0.95] tracking-tight text-white md:text-6xl">
                Independent. <span className="text-primary">Indie. Honest.</span>
              </h2>
              <p className="mt-6 max-w-xl text-base text-white/80 md:text-lg">
                We are not backed by a giant. We are two founders writing every line and
                answering every message — building the tool we needed ourselves.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="border-b border-border/30 py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-16 max-w-3xl"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              What we believe
            </p>
            <h2 className="mt-4 font-display text-4xl uppercase leading-[0.95] tracking-tight text-foreground md:text-6xl">
              Four quiet <span className="text-primary">principles.</span>
            </h2>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 md:gap-12">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="border-l-2 border-primary/40 pl-6"
              >
                <h3 className="font-display text-xl font-bold text-foreground md:text-2xl">
                  {v.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                  {v.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA — landing style */}
      <section className="relative overflow-hidden px-4 py-24 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="font-display text-[9vw] uppercase leading-[0.95] tracking-tight text-foreground md:text-[5vw]"
          >
            Try Megsy{" "}
            <span className="text-primary">for yourself.</span>
          </motion.h2>
          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
            One workspace. One credit. Five tools. Built in Cairo, made for the world.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row md:gap-4">
            <button
              onClick={() => navigate("/auth?mode=signup")}
              className="group relative overflow-hidden rounded-full p-[2px] transition-transform hover:scale-[1.03]"
              style={{
                background:
                  "conic-gradient(from var(--angle, 0deg), #c0c0c0, #ffffff, #8a8a8a, #ffffff, #c0c0c0)",
                animation: "silver-spin 4s linear infinite",
              }}
            >
              <span className="relative block rounded-full bg-black px-10 py-4 text-base font-semibold text-white">
                Get started
              </span>
            </button>
            <button
              onClick={() => navigate("/contact")}
              className="rounded-full border border-border/40 bg-white/5 px-10 py-4 text-base font-semibold text-foreground transition-colors hover:bg-white/10"
            >
              Talk to us
            </button>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default AboutPage;
