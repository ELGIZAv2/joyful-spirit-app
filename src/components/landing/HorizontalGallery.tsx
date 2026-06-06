import { motion } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ServiceItem = {
  src: string;
  label: string;
  desc: string;
};

const services: ServiceItem[] = [
  {
    src: "/showcase/service-image-gen.webp",
    label: "AI Image Generator",
    desc: "Create high-quality images from text or references. Explore styles, refine results, and maintain consistency across creative outputs.",
  },
  {
    src: "/showcase/service-video-gen.webp",
    label: "AI Video Generator",
    desc: "Create motion content from text or images. Animate stills, control pacing, and build short video sequences with clarity and intent.",
  },
  {
    src: "/showcase/service-upscaler.webp",
    label: "AI Image Upscaler",
    desc: "Enhance resolution and clarity without losing detail. Prepare images for print, large formats, and high-quality delivery.",
  },
  {
    src: "/showcase/service-editor.webp",
    label: "AI Image Editor",
    desc: "Edit any image with natural language. Swap elements, fix details, and restyle scenes without masks or layers.",
  },
  {
    src: "/showcase/service-social.webp",
    label: "AI Social Media Post Generator",
    desc: "Design content that looks consistent across every platform — so your brand always shows up sharp, clear, and recognizable.",
  },
  {
    src: "/showcase/service-style.webp",
    label: "Consistent Characters",
    desc: "Lock a character, style, or visual identity across every scene. Keep mood, palette, and tone cohesive across full campaigns.",
  },
  {
    src: "/showcase/service-canvas.webp",
    label: "Canvas Editor",
    desc: "Inpaint, outpaint, and restructure parts of an image with a prompt. Real-time canvas controls with instant previews.",
  },
  {
    src: "/showcase/service-bgremove.webp",
    label: "Background Remover",
    desc: "Pixel-perfect cutouts in one click. Isolate subjects, drop in new backdrops, and ship product or portrait assets in seconds.",
  },
  {
    src: "/showcase/service-audio.webp",
    label: "AI Voice & Audio",
    desc: "Generate voiceovers, soundtracks, and audio effects from a single prompt. Multilingual, expressive, studio-grade output.",
  },
];

const HorizontalGallery = () => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * 0.7 * dir, behavior: "smooth" });
  };

  return (
    <section style={{ backgroundColor: "#F5D90A" }} className="py-10 md:py-24 text-black overflow-hidden">
      <div className="mx-auto max-w-[1700px] px-5 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-8 md:mb-14 text-center"
        >
          <h2
            id="anchor-image-models"
            style={{ fontFamily: '"Dela Gothic One", sans-serif' }}
            className="uppercase tracking-tighter text-black leading-[0.85] text-[16vw] md:text-[15vw]"
          >
            EXPLORE
          </h2>
          <h3
            style={{ fontFamily: '"Dela Gothic One", sans-serif' }}
            className="uppercase tracking-tight text-black leading-[0.95] text-[5.5vw] md:text-[5vw] mt-2 md:mt-2"
          >
            MORE AI CREATIVE TOOLS
          </h3>
          <p className="mt-4 md:mt-6 mx-auto max-w-2xl text-[13px] md:text-base text-black/80 leading-snug">
            Megsy is more than an AI image platform. Work across image, video, design, and motion with tools built for modern creative production.
          </p>
        </motion.div>
      </div>


      {/* Full-bleed scroller — cards intersect with the page edges */}
      <div className="relative">
        {/* Left arrow — half-clipped, emerging from the left edge of the page */}
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollBy(-1)}
          className={`hidden md:flex absolute top-1/2 -translate-y-1/2 z-30 h-16 w-16 items-center justify-center rounded-full text-black transition-all duration-300 ${
            canLeft ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          style={{
            left: "-32px", // half off-screen
            background: "rgba(255,255,255,0.45)",
            backdropFilter: "blur(28px) saturate(180%)",
            WebkitBackdropFilter: "blur(28px) saturate(180%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.15)",
            border: "1px solid rgba(255,255,255,0.5)",
          }}
        >
          <ChevronLeft className="h-6 w-6 ml-4" strokeWidth={2.5} />
        </button>

        {/* Right arrow — half-clipped, emerging from the right edge of the page */}
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollBy(1)}
          className={`hidden md:flex absolute top-1/2 -translate-y-1/2 z-30 h-16 w-16 items-center justify-center rounded-full text-black transition-all duration-300 ${
            canRight ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          style={{
            right: "-32px",
            background: "rgba(255,255,255,0.45)",
            backdropFilter: "blur(28px) saturate(180%)",
            WebkitBackdropFilter: "blur(28px) saturate(180%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.15)",
            border: "1px solid rgba(255,255,255,0.5)",
          }}
        >
          <ChevronRight className="h-6 w-6 mr-4" strokeWidth={2.5} />
        </button>

        <div
          ref={scrollerRef}
          className="flex gap-5 md:gap-6 overflow-x-auto snap-x scrollbar-hide pb-4"
          style={{
            scrollBehavior: "smooth",
            paddingLeft: "5vw",
            paddingRight: "5vw",
            scrollPaddingLeft: "5vw",
            scrollPaddingRight: "5vw",
          }}
        >
          {services.map((item, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: Math.min(i, 5) * 0.05 }}
              className="group shrink-0 snap-start w-[78vw] sm:w-[55vw] md:w-[38vw] lg:w-[28vw] xl:w-[24vw]"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-md">
                <img
                  src={item.src}
                  alt={item.label}
                  loading="lazy"
                  width={1024}
                  height={1280}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>

              <h3
                style={{ fontFamily: '"Dela Gothic One", sans-serif' }}
                className="mt-5 text-xl md:text-2xl text-black leading-tight"
              >
                {item.label}
              </h3>
              <p className="mt-3 text-sm md:text-[15px] leading-relaxed text-black/80 line-clamp-3">
                {item.desc}
              </p>
              <button className="mt-5 inline-flex rounded-full bg-black px-6 py-2.5 text-xs md:text-sm font-bold text-white hover:bg-black/85 transition-colors">
                Learn more
              </button>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HorizontalGallery;
