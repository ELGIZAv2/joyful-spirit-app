import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import SEOHead from "@/components/common/SEOHead";
import CachedMediaImage from "@/components/media/CachedMediaImage";
import { Button } from "@/components/ui/button";

type Tool = { id: string; name: string; route: string; desc: string };

const IMAGE_TOOLS: Tool[] = [
  { id: "inpaint", name: "Inpaint", route: "/images/tools/inpaint", desc: "Edit parts of an image" },
  { id: "clothes-changer", name: "Clothes", route: "/images/tools/clothes-changer", desc: "Change outfits instantly" },
  { id: "headshot", name: "Headshot", route: "/images/tools/headshot", desc: "Studio-quality portraits" },
  { id: "face-swap", name: "Face Magic", route: "/images/tools/face-swap", desc: "Swap faces in photos" },
  { id: "bg-remover", name: "BG Remove", route: "/images/tools/bg-remover", desc: "Clean background removal" },
  { id: "cartoon", name: "Cartoon", route: "/images/tools/cartoon", desc: "Cartoonify your photo" },
  { id: "colorizer", name: "Colorize", route: "/images/tools/colorizer", desc: "Color B&W photos" },
  { id: "retouching", name: "Retouch", route: "/images/tools/retouching", desc: "Polish & enhance" },
  { id: "remover", name: "Remove", route: "/images/tools/remover", desc: "Remove unwanted objects" },
  { id: "sketch-to-image", name: "Sketch", route: "/images/tools/sketch-to-image", desc: "Sketch to image" },
  { id: "relight", name: "Relight", route: "/images/tools/relight", desc: "Change lighting & mood" },
  { id: "character-swap", name: "Character", route: "/images/tools/character-swap", desc: "Swap characters" },
  { id: "storyboard", name: "Storyboard", route: "/images/tools/storyboard", desc: "Cinematic panels" },
  { id: "hair-changer", name: "Hair", route: "/images/tools/hair-changer", desc: "Try new hairstyles" },
  { id: "avatar-generator", name: "Avatar", route: "/images/tools/avatar-generator", desc: "Personal AI avatars" },
  { id: "product-photo", name: "Product", route: "/images/tools/product-photo", desc: "Pro product shots" },
  { id: "logo-generator", name: "Logo", route: "/images/tools/logo-generator", desc: "Design unique logos" },
  { id: "perspective-correction", name: "Perspective", route: "/images/tools/perspective-correction", desc: "Fix tilted angles" },
];

const VIDEO_TOOLS: Tool[] = [
  { id: "talking-photo", name: "Talking", route: "/videos/tools/talking-photo", desc: "Animate a photo" },
  { id: "upscale", name: "Upscale", route: "/videos/tools/upscale", desc: "Boost resolution" },
  { id: "auto-caption", name: "Caption", route: "/videos/tools/auto-caption", desc: "Auto subtitles" },
  { id: "lip-sync", name: "Voice Sync", route: "/videos/tools/lip-sync", desc: "Sync lip motion to your voice" },
  { id: "video-extender", name: "Extend", route: "/videos/tools/video-extender", desc: "Extend video length" },
  { id: "green-screen", name: "Green", route: "/videos/tools/green-screen", desc: "Pro green screen" },
  { id: "video-watermark", name: "Watermark", route: "/videos/tools/video-watermark", desc: "Add watermark" },
  { id: "video-intro", name: "Intro", route: "/videos/tools/video-intro", desc: "Cinematic intros" },
  { id: "thumbnail-generator", name: "Thumbnail", route: "/videos/tools/thumbnail-generator", desc: "Stunning thumbnails" },
];

const TOOL_IMAGES: Record<string, string> = Object.fromEntries(
  [...IMAGE_TOOLS, ...VIDEO_TOOLS].map((t) => [
    t.id,
    new URL(`@/assets/tool-cinema/${t.id}.jpg`, import.meta.url).href,
  ]),
);

export default function MediaToolsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isVideo = location.pathname.startsWith("/videos");
  const tools = isVideo ? VIDEO_TOOLS : IMAGE_TOOLS;
  const title = isVideo ? "Video tools" : "Image tools";
  const backTo = isVideo ? "/videos" : "/images";

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground">
      <SEOHead
        title={`${title} — Megsy`}
        description={`Browse all ${tools.length} ${isVideo ? "video" : "image"} AI tools.`}
        path={isVideo ? "/videos/tools" : "/images/tools"}
        noindex
      />

      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:px-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(backTo)} aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-base font-semibold tracking-tight md:text-lg">{title}</h1>
            <p className="text-xs text-muted-foreground">{tools.length} tools</p>
          </div>
        </div>
      </header>

      <main
        className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10"
        style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif" }}
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {tools.map((t, idx) => (
            <motion.button
              key={t.id}
              onClick={() => navigate(t.route)}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx, 12) * 0.02 }}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted text-left transition-transform hover:-translate-y-1"
            >
              <CachedMediaImage
                src={TOOL_IMAGES[t.id]}
                alt={t.name}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 md:p-4">
                <h4 className="text-white font-semibold tracking-tight text-sm md:text-base leading-tight">
                  {t.name}
                </h4>
                <p className="text-white/70 text-[11px] md:text-xs mt-0.5 line-clamp-1">
                  {t.desc}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  );
}
