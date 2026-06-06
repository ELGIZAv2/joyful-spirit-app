import { motion } from "framer-motion";
import type { Icon as PhIcon } from "@phosphor-icons/react";
import {
  PaintBrushHousehold as IcInpaint,
  TShirt as IcClothes,
  UserCircle as IcHeadshot,
  Smiley as IcFace,
  SelectionBackground as IcBg,
  Smiley as IcCartoon,
  Palette as IcColorize,
  MagicWand as IcRetouch,
  Eraser as IcRemove,
  PencilSimpleLine as IcSketch,
  Lightbulb as IcRelight,
  UserPlus as IcAvatar,
  FilmSlate as IcFilm,
  ShootingStar as IcHair,
  Cube as IcProduct,
  ShootingStar as IcLogo,
  ArrowsOutCardinal as IcPerspective,
  Microphone as IcLipsync,
  ArrowsOutSimple as IcUpscale,
  ClosedCaptioning as IcCaption,
  ArrowsHorizontal as IcExtend,
  Monitor as IcGreen,
  Copyright as IcWatermark,
  Sparkle as IcDenoise,
  PlayCircle as IcThumbnail,
  FilmStrip as IcStoryboard,
} from "@phosphor-icons/react";

/**
 * iOS 26-style tool icons.
 * Clean Phosphor duotone glyphs centered on a glassy squircle tile.
 */

export type ToolIconKey =
  | "inpaint" | "clothes" | "headshot" | "face-swap" | "bg-remove"
  | "cartoon" | "colorize" | "retouch" | "remove" | "sketch"
  | "relight" | "avatar" | "film" | "hair" | "product"
  | "logo" | "perspective" | "lipsync" | "upscale" | "caption"
  | "extend" | "green-screen" | "watermark" | "denoise" | "thumbnail"
  | "storyboard";



const ICON_MAP: Record<ToolIconKey, PhIcon> = {
  "inpaint": IcInpaint,
  "clothes": IcClothes,
  "headshot": IcHeadshot,
  "face-swap": IcFace,
  "bg-remove": IcBg,
  "cartoon": IcCartoon,
  "colorize": IcColorize,
  "retouch": IcRetouch,
  "remove": IcRemove,
  "sketch": IcSketch,
  "relight": IcRelight,
  "avatar": IcAvatar,
  "film": IcFilm,
  "hair": IcHair,
  "product": IcProduct,
  "logo": IcLogo,
  "perspective": IcPerspective,
  "lipsync": IcLipsync,
  "upscale": IcUpscale,
  "caption": IcCaption,
  "extend": IcExtend,
  "green-screen": IcGreen,
  "watermark": IcWatermark,
  "denoise": IcDenoise,
  "thumbnail": IcThumbnail,
  "storyboard": IcStoryboard,
};

// iOS 26-style gradient pairs (lighter, more refined than v1)
const TILE_GRADIENTS: string[] = [
  "linear-gradient(135deg,#7c8cff 0%,#5b6df0 100%)",     // indigo
  "linear-gradient(135deg,#ff8fb3 0%,#ff5e8a 100%)",     // pink
  "linear-gradient(135deg,#5ec8ff 0%,#3b82f6 100%)",     // blue
  "linear-gradient(135deg,#4ee0a8 0%,#10b981 100%)",     // emerald
  "linear-gradient(135deg,#ffb84d 0%,#f97316 100%)",     // orange
  "linear-gradient(135deg,#b794ff 0%,#8b5cf6 100%)",     // purple
  "linear-gradient(135deg,#5ee0e0 0%,#06b6d4 100%)",     // cyan
  "linear-gradient(135deg,#ff7a8a 0%,#e11d48 100%)",     // rose
];

export const IOSToolTile = ({
  iconKey,
  label,
  idx,
  onClick,
  fullWidth = false,
}: {
  iconKey: ToolIconKey;
  label: string;
  idx: number;
  onClick: () => void;
  fullWidth?: boolean;
}) => {
  const Icon = ICON_MAP[iconKey];
  const gradient = TILE_GRADIENTS[idx % TILE_GRADIENTS.length];

  return (
    <motion.button
      onClick={onClick}
      className={`group flex flex-col items-center gap-2 ${fullWidth ? "w-full" : "w-[78px] snap-start shrink-0"}`}
      variants={{
        hidden: { opacity: 0, y: 10, scale: 0.94 },
        show: {
          opacity: 1, y: 0, scale: 1,
          transition: { type: "spring", stiffness: 380, damping: 26 },
        },
      }}
      whileTap={{ scale: 0.9 }}
      whileHover={{ y: -3 }}
    >
      <motion.div
        className={`relative ${fullWidth ? "w-full aspect-square" : "w-[72px] h-[72px]"} overflow-hidden`}
        style={{
          background: gradient,
          // squircle (iOS continuous corners)
          borderRadius: "30%",
          boxShadow:
            "0 8px 20px -10px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.15)",
        }}
        animate={{ scale: [1, 1.015, 1] }}
        transition={{ duration: 4 + (idx % 3), repeat: Infinity, ease: "easeInOut", delay: idx * 0.12 }}
      >
        {/* Top glass highlight */}
        <div
          className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 100%)",
            borderRadius: "30% 30% 50% 50% / 30% 30% 30% 30%",
          }}
        />
        {/* Specular sweep */}
        <motion.div
          aria-hidden
          className="absolute -inset-y-2 -left-1/3 w-1/3 rotate-12 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
            filter: "blur(2px)",
          }}
          animate={{ x: ["-40%", "260%"] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: idx * 0.25, repeatDelay: 3 }}
        />
        {/* Icon */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-white"
          animate={{ y: [0, -1.5, 0] }}
          transition={{ duration: 3 + (idx % 4) * 0.2, repeat: Infinity, ease: "easeInOut", delay: idx * 0.1 }}
        >
          <Icon
            size={fullWidth ? 40 : 36}
            weight="duotone"
            color="white"
            style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.25))" }}
          />
        </motion.div>
      </motion.div>
      <span className="block text-[11px] font-medium text-foreground/75 text-center leading-tight line-clamp-1 w-full px-0.5">
        {label}
      </span>
    </motion.button>
  );
};

export const TOOL_ICON_MAP: Record<string, ToolIconKey> = {
  // images
  "inpaint": "inpaint",
  "clothes-changer": "clothes",
  "headshot": "headshot",
  "face-swap": "face-swap",
  "bg-remover": "bg-remove",
  "cartoon": "cartoon",
  "colorizer": "colorize",
  "retouching": "retouch",
  "remover": "remove",
  "sketch-to-image": "sketch",
  "relight": "relight",
  "character-swap": "face-swap",
  "storyboard": "storyboard",
  "hair-changer": "hair",
  "avatar-generator": "avatar",
  "product-photo": "product",
  "logo-generator": "logo",
  "perspective-correction": "perspective",
  // videos
  "swap-characters": "face-swap",
  "talking-photo": "avatar",
  "upscale": "upscale",
  "auto-caption": "caption",
  "lip-sync": "lipsync",
  "video-extender": "extend",
  "green-screen": "green-screen",
  "video-colorizer": "colorize",
  "video-watermark": "watermark",
  "video-bg-replacer": "bg-remove",
  "video-intro": "film",
  "video-denoise": "denoise",
  "thumbnail-generator": "thumbnail",
};
