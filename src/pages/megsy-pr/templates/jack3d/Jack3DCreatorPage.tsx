// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";

/* ────────────────────────── Reusable ────────────────────────── */

function FadeIn({
  children,
  delay = 0,
  duration = 0.7,
  x = 0,
  y = 30,
  as: As = "div",
  className,
  style,
}: any) {
  const Comp = motion(As as any);
  return (
    <Comp
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "50px", amount: 0 }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
      style={style}
    >
      {children}
    </Comp>
  );
}

function Magnet({
  children,
  padding = 150,
  strength = 3,
  activeTransition = "transform 0.3s ease-out",
  inactiveTransition = "transform 0.6s ease-in-out",
  className,
  style,
}: any) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("translate3d(0,0,0)");
  const [trans, setTrans] = useState(inactiveTransition);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const inside =
        Math.abs(dx) < rect.width / 2 + padding &&
        Math.abs(dy) < rect.height / 2 + padding;
      if (inside) {
        setTrans(activeTransition);
        setTransform(`translate3d(${dx / strength}px, ${dy / strength}px, 0)`);
      } else {
        setTrans(inactiveTransition);
        setTransform("translate3d(0,0,0)");
      }
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, [padding, strength, activeTransition, inactiveTransition]);

  return (
    <div ref={ref} className={className} style={{ ...style, transform, transition: trans, willChange: "transform" }}>
      {children}
    </div>
  );
}

function ContactButton({ label = "Contact Me" }: { label?: string }) {
  return (
    <button
      className="rounded-full text-white font-medium uppercase tracking-widest px-8 py-3 sm:px-10 sm:py-3.5 md:px-12 md:py-4 text-xs sm:text-sm md:text-base"
      style={{
        background:
          "linear-gradient(123deg, #18011F 7%, #B600A8 37%, #7621B0 72%, #BE4C00 100%)",
        boxShadow:
          "0px 4px 4px rgba(181, 1, 167, 0.25), 4px 4px 12px #7721B1 inset",
        outline: "2px solid white",
        outlineOffset: "-3px",
      }}
    >
      {label}
    </button>
  );
}

function LiveProjectButton() {
  return (
    <button className="rounded-full border-2 border-[#D7E2EA] text-[#D7E2EA] font-medium uppercase tracking-widest px-8 py-3 sm:px-10 sm:py-3.5 text-sm sm:text-base hover:bg-[#D7E2EA]/10 transition">
      Live Project
    </button>
  );
}

/* ────────────────────────── Animated text ────────────────────────── */

function AnimatedText({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.8", "end 0.2"],
  });

  const chars = Array.from(text);
  const [progress, setProgress] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setProgress(v));

  return (
    <p
      ref={ref}
      className="font-medium text-center leading-relaxed mx-auto"
      style={{
        color: "#D7E2EA",
        maxWidth: 560,
        fontSize: "clamp(1rem, 2vw, 1.35rem)",
      }}
    >
      {chars.map((c, i) => {
        const charProg = i / chars.length;
        const opacity = progress > charProg ? 1 : 0.2;
        return (
          <span
            key={i}
            style={{ opacity, transition: "opacity 0.3s" }}
          >
            {c}
          </span>
        );
      })}
    </p>
  );
}

/* ────────────────────────── Sections ────────────────────────── */

function Navbar() {
  const links = ["About", "Price", "Projects", "Contact"];
  return (
    <FadeIn y={-20} delay={0}>
      <nav className="flex justify-between items-center px-6 md:px-10 pt-6 md:pt-8">
        {links.map((l) => (
          <a
            key={l}
            href={`#${l.toLowerCase()}`}
            className="font-medium uppercase tracking-wider text-sm md:text-lg lg:text-[1.4rem] transition-opacity duration-200 hover:opacity-70"
            style={{ color: "#D7E2EA" }}
          >
            {l}
          </a>
        ))}
      </nav>
    </FadeIn>
  );
}

function HeroSection() {
  return (
    <section className="h-screen flex flex-col relative" style={{ overflowX: "clip" }}>
      <Navbar />

      <div className="overflow-hidden mt-6 sm:mt-4 md:-mt-5">
        <FadeIn y={40} delay={0.15} className="px-6 md:px-10">
          <h1 className="hero-heading font-black uppercase tracking-tight leading-none whitespace-nowrap w-full text-[14vw] sm:text-[15vw] md:text-[16vw] lg:text-[17.5vw]">
            Hi, i&apos;m jack
          </h1>
        </FadeIn>
      </div>

      <div className="flex justify-between items-end px-6 md:px-10 pb-7 sm:pb-8 md:pb-10 mt-auto">
        <FadeIn y={20} delay={0.35}>
          <p
            className="font-light uppercase tracking-wide leading-snug max-w-[160px] sm:max-w-[220px] md:max-w-[260px]"
            style={{ color: "#D7E2EA", fontSize: "clamp(0.75rem, 1.4vw, 1.5rem)" }}
          >
            a 3d creator driven by crafting striking and unforgettable projects
          </p>
        </FadeIn>
        <FadeIn y={20} delay={0.5}>
          <ContactButton />
        </FadeIn>
      </div>

      <FadeIn
        y={30}
        delay={0.6}
        className="absolute left-1/2 -translate-x-1/2 z-10 top-1/2 -translate-y-1/2 sm:top-auto sm:translate-y-0 sm:bottom-0 w-[280px] sm:w-[360px] md:w-[440px] lg:w-[520px]"
      >
        <Magnet padding={150} strength={3}>
          <img
            src="https://shrug-person-78902957.figma.site/_components/v2/d24c01ad3a56fc65e942a1f501eb73db42d7cf9a/Rectangle_40443.81459862.png"
            alt="Jack 3D portrait"
            className="w-full h-auto block"
          />
        </Magnet>
      </FadeIn>
    </section>
  );
}

const MARQUEE_IMAGES = [
  "https://motionsites.ai/assets/hero-space-voyage-preview-eECLH3Yc.gif",
  "https://motionsites.ai/assets/hero-codenest-preview-Cgppc2qV.gif",
  "https://motionsites.ai/assets/hero-vex-ventures-preview-BczMFIiw.gif",
  "https://motionsites.ai/assets/hero-stellar-ai-v2-preview-DjvxjG3C.gif",
  "https://motionsites.ai/assets/hero-asme-preview-B_nGDnTP.gif",
  "https://motionsites.ai/assets/hero-transform-data-preview-Cx5OU29N.gif",
  "https://motionsites.ai/assets/hero-vitara-preview-Cjz2QYyU.gif",
  "https://motionsites.ai/assets/hero-terra-preview-BFjrCr7T.gif",
  "https://motionsites.ai/assets/hero-skyelite-preview-DHaZIgUv.gif",
  "https://motionsites.ai/assets/hero-aethera-preview-DknSlcTa.gif",
  "https://motionsites.ai/assets/hero-designpro-preview-D8c5_een.gif",
  "https://motionsites.ai/assets/hero-stellar-ai-preview-D3HL6bw1.gif",
  "https://motionsites.ai/assets/hero-xportfolio-preview-D4A8maiC.gif",
  "https://motionsites.ai/assets/hero-orbit-web3-preview-BXt4OttD.gif",
  "https://motionsites.ai/assets/hero-nexora-preview-cx5HmUgo.gif",
  "https://motionsites.ai/assets/hero-evr-ventures-preview-DZxeVFEX.gif",
  "https://motionsites.ai/assets/hero-planet-orbit-preview-DWAP8Z1P.gif",
  "https://motionsites.ai/assets/hero-new-era-preview-CocuDUm9.gif",
  "https://motionsites.ai/assets/hero-wealth-preview-B70idl_u.gif",
  "https://motionsites.ai/assets/hero-luminex-preview-CxOP7ce6.gif",
  "https://motionsites.ai/assets/hero-celestia-preview-0yO3jXO8.gif",
];

function MarqueeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const o = (window.scrollY - top + window.innerHeight) * 0.3;
      setOffset(o);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const row1 = MARQUEE_IMAGES.slice(0, 11);
  const row2 = MARQUEE_IMAGES.slice(11);
  const triple = (arr: string[]) => [...arr, ...arr, ...arr];

  const Tile = ({ src }: { src: string }) => (
    <img
      src={src}
      alt=""
      loading="lazy"
      className="rounded-2xl object-cover shrink-0"
      style={{ width: 420, height: 270 }}
    />
  );

  return (
    <section
      ref={sectionRef}
      className="pt-24 sm:pt-32 md:pt-40 pb-10 overflow-hidden"
      style={{ background: "#0C0C0C" }}
    >
      <div className="flex flex-col gap-3">
        <div
          className="flex gap-3"
          style={{ transform: `translateX(${offset - 200}px)`, willChange: "transform" }}
        >
          {triple(row1).map((s, i) => <Tile key={`r1-${i}`} src={s} />)}
        </div>
        <div
          className="flex gap-3"
          style={{ transform: `translateX(${-(offset - 200)}px)`, willChange: "transform" }}
        >
          {triple(row2).map((s, i) => <Tile key={`r2-${i}`} src={s} />)}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section
      id="about"
      className="min-h-screen flex flex-col items-center justify-center relative px-5 sm:px-8 md:px-10 py-20"
    >
      <FadeIn x={-80} y={0} delay={0.1} duration={0.9} className="absolute top-[4%] left-[1%] sm:left-[2%] md:left-[4%]">
        <img
          src="https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/moon_icon.11395d36.png"
          alt=""
          className="w-[120px] sm:w-[160px] md:w-[210px]"
        />
      </FadeIn>
      <FadeIn x={80} y={0} delay={0.15} duration={0.9} className="absolute top-[4%] right-[1%] sm:right-[2%] md:right-[4%]">
        <img
          src="https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/lego_icon-1.703bb594.png"
          alt=""
          className="w-[120px] sm:w-[160px] md:w-[210px]"
        />
      </FadeIn>
      <FadeIn x={-80} y={0} delay={0.25} duration={0.9} className="absolute bottom-[8%] left-[3%] sm:left-[6%] md:left-[10%]">
        <img
          src="https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/p59_1.4659672e.png"
          alt=""
          className="w-[100px] sm:w-[140px] md:w-[180px]"
        />
      </FadeIn>
      <FadeIn x={80} y={0} delay={0.3} duration={0.9} className="absolute bottom-[8%] right-[3%] sm:right-[6%] md:right-[10%]">
        <img
          src="https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/Group_134-1.2e04f3ce.png"
          alt=""
          className="w-[130px] sm:w-[170px] md:w-[220px]"
        />
      </FadeIn>

      <div className="flex flex-col items-center gap-10 sm:gap-14 md:gap-16 relative z-10">
        <FadeIn y={40} delay={0}>
          <h2
            className="hero-heading font-black uppercase leading-none tracking-tight text-center"
            style={{ fontSize: "clamp(3rem, 12vw, 160px)" }}
          >
            About me
          </h2>
        </FadeIn>

        <AnimatedText text="With more than five years of experience in design, i focus on branding, web design, and user experience, i truly enjoy working with businesses that aim to stand out and present their best image. Let's build something incredible together!" />
      </div>

      <div className="mt-16 sm:mt-20 md:mt-24 relative z-10">
        <ContactButton />
      </div>
    </section>
  );
}

const SERVICES = [
  { n: "01", t: "3D Modeling", d: "Creation of detailed objects, characters, or environments tailored to specific client needs, ideal for games, products, and visualizations." },
  { n: "02", t: "Rendering", d: "High-quality, photorealistic renders that showcase designs with custom lighting, textures, and materials to bring concepts to life." },
  { n: "03", t: "Motion Design", d: "Dynamic animations and motion graphics that add energy and storytelling to brands, products, and digital experiences." },
  { n: "04", t: "Branding", d: "Crafting cohesive visual identities — from logos to full brand systems — that communicate a clear and memorable presence." },
  { n: "05", t: "Web Design", d: "Designing clean, modern, and conversion-focused websites with attention to layout, typography, and user experience." },
];

function ServicesSection() {
  return (
    <section
      className="px-5 sm:px-8 md:px-10 py-20 sm:py-24 md:py-32 rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px]"
      style={{ background: "#FFFFFF" }}
    >
      <h2
        className="font-black uppercase text-center mb-16 sm:mb-20 md:mb-28"
        style={{ color: "#0C0C0C", fontSize: "clamp(3rem, 12vw, 160px)" }}
      >
        Services
      </h2>

      <div className="max-w-5xl mx-auto">
        {SERVICES.map((s, i) => (
          <FadeIn key={s.n} delay={i * 0.1}>
            <div
              className="flex items-start gap-6 md:gap-10 py-8 sm:py-10 md:py-12"
              style={{ borderTop: "1px solid rgba(12, 12, 12, 0.15)", ...(i === SERVICES.length - 1 ? { borderBottom: "1px solid rgba(12,12,12,0.15)" } : {}) }}
            >
              <span
                className="font-black shrink-0"
                style={{ color: "#0C0C0C", fontSize: "clamp(3rem, 10vw, 140px)", lineHeight: 1 }}
              >
                {s.n}
              </span>
              <div className="flex-1 flex flex-col gap-3 md:gap-5">
                <h3
                  className="font-medium uppercase"
                  style={{ color: "#0C0C0C", fontSize: "clamp(1rem, 2.2vw, 2.1rem)", lineHeight: 1.1 }}
                >
                  {s.t}
                </h3>
                <p
                  className="font-light leading-relaxed max-w-2xl"
                  style={{ color: "#0C0C0C", opacity: 0.6, fontSize: "clamp(0.85rem, 1.6vw, 1.25rem)" }}
                >
                  {s.d}
                </p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

const PROJECTS = [
  {
    n: "01",
    category: "Client",
    name: "Nextlevel Studio",
    col1: [
      "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055344_5eff02e0-87a5-41ce-b64f-eb08da8f33db.png&w=1280&q=85",
      "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055431_11d841fd-8b41-46a5-82e4-b04f2407a7d8.png&w=1280&q=85",
    ],
    col2: "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055451_e317bf2d-28d4-48cc-86b0-6f72f25b6327.png&w=1280&q=85",
  },
  {
    n: "02",
    category: "Personal",
    name: "Aura Brand Identity",
    col1: [
      "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055654_911201c5-36d9-4bc6-bac7-331adfce159f.png&w=1280&q=85",
      "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055723_5ceda0b8-d9c2-4665-b2e3-83ba19ba76d1.png&w=1280&q=85",
    ],
    col2: "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055753_adc5dcbd-a8e6-49c0-b43a-9b030d835cea.png&w=1280&q=85",
  },
  {
    n: "03",
    category: "Client",
    name: "Solaris Digital",
    col1: [
      "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055759_963cfb0b-4bd1-4b0f-9d0a-09bd6cf95b2f.png&w=1280&q=85",
      "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_060108_438f781a-9846-4dcc-89ab-c4e6cb830f5b.png&w=1280&q=85",
    ],
    col2: "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055818_9d062121-ad7e-46b9-999a-1a6a692ef1ee.png&w=1280&q=85",
  },
];

function ProjectCard({ p, i, total, progress }: any) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "start start"],
  });
  const targetScale = 1 - (total - 1 - i) * 0.03;
  const scale = useTransform(scrollYProgress, [0, 1], [1, targetScale]);

  return (
    <div ref={cardRef} className="h-[85vh] flex items-start justify-center sticky" style={{ top: `${i * 28}px` }}>
      <motion.div
        style={{ scale, top: `${i * 28}px` }}
        className="sticky top-24 md:top-32 w-full rounded-[40px] sm:rounded-[50px] md:rounded-[60px] border-2 border-[#D7E2EA] p-4 sm:p-6 md:p-8"
      >
        <div className="bg-[#0C0C0C] rounded-[32px] sm:rounded-[42px] md:rounded-[52px]">
          <div className="flex flex-wrap items-center justify-between gap-4 px-2 sm:px-4 pt-2 pb-6 md:pb-8">
            <div className="flex items-end gap-4 md:gap-6">
              <span
                className="font-black"
                style={{ color: "#D7E2EA", fontSize: "clamp(3rem, 10vw, 140px)", lineHeight: 0.9 }}
              >
                {p.n}
              </span>
              <div className="flex flex-col gap-1">
                <span
                  className="font-light uppercase tracking-widest"
                  style={{ color: "#D7E2EA", opacity: 0.6, fontSize: "clamp(0.7rem, 1vw, 0.95rem)" }}
                >
                  {p.category}
                </span>
                <span
                  className="font-medium uppercase"
                  style={{ color: "#D7E2EA", fontSize: "clamp(1.1rem, 2.2vw, 2.1rem)", lineHeight: 1 }}
                >
                  {p.name}
                </span>
              </div>
            </div>
            <LiveProjectButton />
          </div>

          <div className="grid grid-cols-5 gap-3 md:gap-4 px-2 sm:px-4 pb-2">
            <div className="col-span-2 flex flex-col gap-3 md:gap-4">
              <img
                src={p.col1[0]}
                alt=""
                className="w-full object-cover rounded-[40px] sm:rounded-[50px] md:rounded-[60px]"
                style={{ height: "clamp(130px, 16vw, 230px)" }}
              />
              <img
                src={p.col1[1]}
                alt=""
                className="w-full object-cover rounded-[40px] sm:rounded-[50px] md:rounded-[60px]"
                style={{ height: "clamp(160px, 22vw, 340px)" }}
              />
            </div>
            <div className="col-span-3">
              <img
                src={p.col2}
                alt=""
                className="w-full h-full object-cover rounded-[40px] sm:rounded-[50px] md:rounded-[60px]"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ProjectsSection() {
  return (
    <section
      id="projects"
      className="-mt-10 sm:-mt-12 md:-mt-14 z-10 relative rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px] pt-20 sm:pt-28 md:pt-32 px-5 sm:px-8 md:px-10 pb-40"
      style={{ background: "#0C0C0C" }}
    >
      <h2
        className="hero-heading font-black uppercase leading-none tracking-tight text-center mb-16 md:mb-24"
        style={{ fontSize: "clamp(3rem, 12vw, 160px)" }}
      >
        Project
      </h2>
      <div className="max-w-7xl mx-auto">
        {PROJECTS.map((p, i) => (
          <ProjectCard key={p.n} p={p} i={i} total={PROJECTS.length} />
        ))}
      </div>
    </section>
  );
}

/* ────────────────────────── Page ────────────────────────── */

export default function Jack3DCreatorPage() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Jack — 3D Creator";

    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href =
      "https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800;900&display=swap";
    document.head.appendChild(fontLink);

    const style = document.createElement("style");
    style.setAttribute("data-jack-3d", "1");
    style.textContent = `
      .jack-3d-root, .jack-3d-root * { box-sizing: border-box; }
      .jack-3d-root { font-family: 'Kanit', sans-serif; background: #0C0C0C; color: #D7E2EA; }
      .jack-3d-root .hero-heading {
        background: linear-gradient(180deg, #646973 0%, #BBCCD7 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        color: transparent;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.title = prevTitle;
      fontLink.remove();
      style.remove();
    };
  }, []);

  return (
    <div className="jack-3d-root min-h-screen" style={{ background: "#0C0C0C", overflowX: "clip" }}>
      <HeroSection />
      <MarqueeSection />
      <AboutSection />
      <ServicesSection />
      <ProjectsSection />
    </div>
  );
}
