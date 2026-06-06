import React from "react";
import { motion } from "framer-motion";
import type { CSSProperties } from "react";

/**
 * Expressive animated SVG scenes — each one visually communicates its tool.
 * Built on a 64x64 grid. White-on-gradient for tile use.
 */

type IconProps = { className?: string; style?: CSSProperties };

const SVG = ({ children, className, style }: IconProps & { children: React.ReactNode }) => (
  <svg viewBox="0 0 64 64" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
    {children}
  </svg>
);

const loop = { repeat: Infinity, ease: "easeInOut" as const };

/* ─── Inpaint — brush fills a missing chunk in an image ─── */
export const BrushAnim = (p: IconProps) => (
  <SVG {...p}>
    <rect x="8" y="10" width="48" height="44" rx="4" fill="white" fillOpacity="0.95" />
    {/* missing hole */}
    <motion.rect x="22" y="22" width="20" height="20" rx="2" fill="#1f2937"
      animate={{ opacity: [1, 0, 1] }} transition={{ duration: 2.4, ...loop }}
    />
    {/* fill stripes appearing */}
    <motion.g animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2.4, ...loop }}>
      <rect x="22" y="22" width="20" height="20" rx="2" fill="white" />
    </motion.g>
    {/* brush */}
    <motion.g
      animate={{ x: [-6, 6, -6], y: [-4, 4, -4], rotate: [-20, -20, -20] }}
      transition={{ duration: 2.4, ...loop }}
      style={{ transformOrigin: "32px 32px" }}
    >
      <rect x="38" y="6" width="4" height="14" rx="1" fill="#fbbf24" />
      <path d="M36 18 L44 18 L42 26 L38 26 Z" fill="white" />
    </motion.g>
  </SVG>
);

/* ─── Clothes changer — shirt swapping color ─── */
export const ShirtAnim = (p: IconProps) => (
  <SVG {...p}>
    <motion.path
      d="M20 16 L26 12 L38 12 L44 16 L52 22 L46 30 L44 28 L44 52 L20 52 L20 28 L18 30 L12 22 Z"
      animate={{ fill: ["#ffffff", "#fde68a", "#a7f3d0", "#bfdbfe", "#ffffff"] }}
      transition={{ duration: 4, ...loop }}
    />
    <motion.circle cx="32" cy="22" r="2.5" fill="#1f2937"
      animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, ...loop }}
    />
  </SVG>
);

/* ─── Headshot — portrait in a frame with glow ─── */
export const PersonAnim = (p: IconProps) => (
  <SVG {...p}>
    <rect x="8" y="8" width="48" height="48" rx="6" fill="white" fillOpacity="0.18" />
    <rect x="8" y="8" width="48" height="48" rx="6" stroke="white" strokeWidth="2" />
    <motion.circle cx="32" cy="26" r="8" fill="white"
      animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, ...loop }}
      style={{ transformOrigin: "32px 26px" }}
    />
    <path d="M18 52 Q18 38 32 38 Q46 38 46 52 Z" fill="white" />
    <motion.circle cx="48" cy="14" r="3" fill="#fde047"
      animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.3, 1] }} transition={{ duration: 1.6, ...loop }}
      style={{ transformOrigin: "48px 14px" }}
    />
  </SVG>
);

/* ─── Face swap — two faces with arrows swapping ─── */
export const FaceSwapAnim = (p: IconProps) => (
  <SVG {...p}>
    <motion.g animate={{ x: [0, 22, 0] }} transition={{ duration: 2.6, ...loop }}>
      <circle cx="16" cy="22" r="9" fill="white" />
      <circle cx="13" cy="20" r="1.3" fill="#1f2937" />
      <circle cx="19" cy="20" r="1.3" fill="#1f2937" />
      <path d="M13 25 Q16 27 19 25" stroke="#1f2937" strokeWidth="1.4" strokeLinecap="round" />
    </motion.g>
    <motion.g animate={{ x: [0, -22, 0] }} transition={{ duration: 2.6, ...loop }}>
      <circle cx="48" cy="42" r="9" fill="white" fillOpacity="0.85" />
      <circle cx="45" cy="40" r="1.3" fill="#1f2937" />
      <circle cx="51" cy="40" r="1.3" fill="#1f2937" />
      <path d="M45 45 Q48 47 51 45" stroke="#1f2937" strokeWidth="1.4" strokeLinecap="round" />
    </motion.g>
    <motion.path d="M28 30 L36 30 M33 27 L36 30 L33 33" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
      animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.3, ...loop }}
    />
    <motion.path d="M36 38 L28 38 M31 35 L28 38 L31 41" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
      animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.3, ...loop, delay: 0.4 }}
    />
  </SVG>
);

/* ─── BG remover — subject stays, bg becomes checker ─── */
export const EraseAnim = (p: IconProps) => (
  <SVG {...p}>
    {/* checker bg */}
    {[0, 1, 2, 3, 4].map(r =>
      [0, 1, 2, 3, 4].map(c => (
        <motion.rect key={`${r}-${c}`} x={8 + c * 10} y={8 + r * 10} width="10" height="10"
          fill="white" fillOpacity={(r + c) % 2 === 0 ? 0.9 : 0.25}
          animate={{ opacity: [0, 1] }}
          transition={{ duration: 1.5, delay: (r + c) * 0.05, ...loop, repeatType: "reverse" }}
        />
      ))
    )}
    {/* subject silhouette on top */}
    <circle cx="32" cy="26" r="8" fill="#1f2937" />
    <path d="M18 54 Q18 38 32 38 Q46 38 46 54 Z" fill="#1f2937" />
  </SVG>
);

/* ─── Cartoon — photo→cartoon morph ─── */
export const MaskAnim = (p: IconProps) => (
  <SVG {...p}>
    <motion.circle cx="32" cy="32" r="22" fill="white"
      animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 2.4, ...loop }}
      style={{ transformOrigin: "32px 32px" }}
    />
    <motion.g animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, ...loop }} style={{ transformOrigin: "25px 28px" }}>
      <circle cx="25" cy="28" r="3" fill="#1f2937" />
      <circle cx="26" cy="27" r="1" fill="white" />
    </motion.g>
    <motion.g animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, ...loop }} style={{ transformOrigin: "39px 28px" }}>
      <circle cx="39" cy="28" r="3" fill="#1f2937" />
      <circle cx="40" cy="27" r="1" fill="white" />
    </motion.g>
    <motion.path
      animate={{ d: ["M24 40 Q32 44 40 40", "M24 38 Q32 48 40 38", "M24 40 Q32 44 40 40"] }}
      transition={{ duration: 2.4, ...loop }}
      stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" fill="none"
    />
  </SVG>
);

/* ─── Colorize — B&W photo gaining color ─── */
export const PaletteAnim = (p: IconProps) => (
  <SVG {...p}>
    <rect x="8" y="10" width="48" height="44" rx="4" fill="white" fillOpacity="0.2" />
    {/* mountains */}
    <motion.path d="M8 44 L20 28 L30 38 L40 22 L56 44 Z"
      animate={{ fill: ["#9ca3af", "#34d399", "#9ca3af"] }} transition={{ duration: 2.8, ...loop }}
    />
    <motion.circle cx="46" cy="22" r="5"
      animate={{ fill: ["#d1d5db", "#fbbf24", "#d1d5db"] }} transition={{ duration: 2.8, ...loop }}
    />
    <rect x="8" y="10" width="48" height="44" rx="4" stroke="white" strokeWidth="2" />
    {/* color brush sweep */}
    <motion.rect x="0" y="10" width="6" height="44" fill="white" fillOpacity="0.5"
      animate={{ x: [-6, 56] }} transition={{ duration: 2.8, ...loop }}
    />
  </SVG>
);

/* ─── Retouch — face with magic wand sparkles ─── */
export const SparkleAnim = (p: IconProps) => (
  <SVG {...p}>
    <circle cx="26" cy="34" r="14" fill="white" />
    <circle cx="22" cy="32" r="1.5" fill="#1f2937" />
    <circle cx="30" cy="32" r="1.5" fill="#1f2937" />
    <path d="M22 38 Q26 40 30 38" stroke="#1f2937" strokeWidth="1.5" strokeLinecap="round" />
    {/* wand */}
    <line x1="42" y1="36" x2="54" y2="14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    {[
      { cx: 50, cy: 18, d: 0 },
      { cx: 44, cy: 14, d: 0.3 },
      { cx: 56, cy: 22, d: 0.6 },
      { cx: 38, cy: 24, d: 0.9 },
    ].map((s, i) => (
      <motion.path key={i}
        d={`M${s.cx} ${s.cy - 3} L${s.cx + 1} ${s.cy - 1} L${s.cx + 3} ${s.cy} L${s.cx + 1} ${s.cy + 1} L${s.cx} ${s.cy + 3} L${s.cx - 1} ${s.cy + 1} L${s.cx - 3} ${s.cy} L${s.cx - 1} ${s.cy - 1} Z`}
        fill="#fde047"
        animate={{ scale: [0, 1.3, 0], rotate: [0, 180] }}
        transition={{ duration: 1.6, repeat: Infinity, delay: s.d, ease: "easeOut" }}
        style={{ transformOrigin: `${s.cx}px ${s.cy}px` }}
      />
    ))}
  </SVG>
);

/* ─── Remove object — eraser swipe over photo ─── */
export const ScissorsAnim = (p: IconProps) => (
  <SVG {...p}>
    <rect x="8" y="10" width="48" height="44" rx="4" fill="white" fillOpacity="0.95" />
    {/* object that disappears */}
    <motion.circle cx="32" cy="32" r="9" fill="#ef4444"
      animate={{ opacity: [1, 0, 1], scale: [1, 0.6, 1] }}
      transition={{ duration: 2.4, ...loop }}
      style={{ transformOrigin: "32px 32px" }}
    />
    {/* eraser */}
    <motion.g
      animate={{ x: [-24, 24, -24], rotate: [-15, -15, -15] }}
      transition={{ duration: 2.4, ...loop }}
    >
      <rect x="28" y="6" width="10" height="8" rx="1.5" fill="#fbbf24" />
      <rect x="28" y="14" width="10" height="6" rx="1" fill="white" />
    </motion.g>
  </SVG>
);

/* ─── Sketch — pencil drawing a line ─── */
export const PencilAnim = (p: IconProps) => (
  <SVG {...p}>
    <motion.path d="M10 50 Q22 32 32 42 T54 22"
      stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: [0, 1, 1, 0] }}
      transition={{ duration: 3, repeat: Infinity, times: [0, 0.6, 0.85, 1], ease: "easeInOut" }}
    />
    <motion.g
      animate={{
        x: [-18, -6, 4, 14, 22, 22],
        y: [12, -4, 4, -4, -14, -14],
        rotate: [40, 40, 40, 40, 40, 40],
      }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <rect x="30" y="30" width="6" height="22" rx="1" fill="white" />
      <path d="M30 30 L36 30 L33 23 Z" fill="#1f2937" />
      <rect x="30" y="48" width="6" height="3" fill="#f87171" />
    </motion.g>
  </SVG>
);

/* ─── Relight — face with sun moving around ─── */
export const BulbAnim = (p: IconProps) => (
  <SVG {...p}>
    <circle cx="32" cy="32" r="14" fill="white" />
    <motion.g
      animate={{ rotate: 360 }}
      transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      style={{ transformOrigin: "32px 32px" }}
    >
      <circle cx="32" cy="10" r="4" fill="#fde047" />
      <line x1="32" y1="2" x2="32" y2="6" stroke="#fde047" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="40" y1="10" x2="44" y2="6" stroke="#fde047" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="10" x2="20" y2="6" stroke="#fde047" strokeWidth="1.5" strokeLinecap="round" />
    </motion.g>
    {/* shadow side */}
    <motion.path d="M32 18 A14 14 0 0 1 32 46 Z" fill="#1f2937" fillOpacity="0.35"
      animate={{ rotate: 360 }}
      transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      style={{ transformOrigin: "32px 32px" }}
    />
  </SVG>
);

/* ─── Avatar generator — circle frame + character + plus badge ─── */
export const AvatarAnim = (p: IconProps) => (
  <SVG {...p}>
    <motion.circle cx="32" cy="32" r="22" stroke="white" strokeWidth="2" fill="none" strokeDasharray="4 4"
      animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      style={{ transformOrigin: "32px 32px" }}
    />
    <motion.g animate={{ y: [0, -2, 0] }} transition={{ duration: 1.8, ...loop }}>
      <circle cx="32" cy="26" r="8" fill="white" />
      <path d="M20 50 Q20 36 32 36 Q44 36 44 50 Z" fill="white" />
    </motion.g>
    <circle cx="50" cy="14" r="6" fill="#34d399" />
    <motion.path d="M47 14 L53 14 M50 11 L50 17" stroke="white" strokeWidth="1.8" strokeLinecap="round"
      animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.2, ...loop }}
      style={{ transformOrigin: "50px 14px" }}
    />
  </SVG>
);

/* ─── Video intro — clapperboard snapping ─── */
export const FilmAnim = (p: IconProps) => (
  <SVG {...p}>
    <rect x="8" y="26" width="48" height="28" rx="2" fill="white" />
    <motion.g style={{ transformOrigin: "10px 26px" }}
      animate={{ rotate: [0, -20, 0, 0, 0] }}
      transition={{ duration: 2.2, repeat: Infinity, times: [0, 0.15, 0.3, 0.95, 1] }}
    >
      <rect x="8" y="14" width="48" height="14" rx="2" fill="white" />
      <path d="M14 14 L20 28 M26 14 L32 28 M38 14 L44 28 M50 14 L56 28" stroke="#1f2937" strokeWidth="2" />
    </motion.g>
    <polygon points="28,34 28,48 42,41" fill="#1f2937" />
  </SVG>
);

/* ─── Hair changer — head with hair changing color ─── */
export const HairAnim = (p: IconProps) => (
  <SVG {...p}>
    <circle cx="32" cy="36" r="14" fill="white" />
    <motion.path d="M18 32 Q20 16 32 16 Q44 16 46 32 Q44 26 32 26 Q20 26 18 32 Z"
      animate={{ fill: ["#1f2937", "#dc2626", "#7c3aed", "#0891b2", "#1f2937"] }}
      transition={{ duration: 4, ...loop }}
    />
    <circle cx="27" cy="36" r="1.3" fill="#1f2937" />
    <circle cx="37" cy="36" r="1.3" fill="#1f2937" />
    <path d="M27 42 Q32 44 37 42" stroke="#1f2937" strokeWidth="1.4" strokeLinecap="round" />
  </SVG>
);

/* ─── Product photo — product on pedestal with spotlight ─── */
export const BoxAnim = (p: IconProps) => (
  <SVG {...p}>
    <motion.path d="M32 8 L20 24 L44 24 Z" fill="white" fillOpacity="0.2"
      animate={{ opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2, ...loop }}
    />
    <motion.g animate={{ y: [0, -2, 0] }} transition={{ duration: 2.2, ...loop }}>
      <path d="M32 18 L48 26 L48 42 L32 50 L16 42 L16 26 Z" fill="white" />
      <path d="M32 18 L48 26 L32 34 L16 26 Z" fill="white" fillOpacity="0.7" />
      <path d="M32 34 L48 26 L48 42 L32 50 Z" fill="white" fillOpacity="0.5" />
    </motion.g>
    <ellipse cx="32" cy="56" rx="18" ry="2" fill="white" fillOpacity="0.4" />
  </SVG>
);

/* ─── Logo — assembling geometric pieces ─── */
export const LogoAnim = (p: IconProps) => (
  <SVG {...p}>
    <motion.circle cx="24" cy="24" r="10" fill="white"
      animate={{ x: [-12, 0, 0, -12], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 3, repeat: Infinity, times: [0, 0.25, 0.75, 1] }}
    />
    <motion.rect x="30" y="30" width="20" height="20" rx="2" fill="white" fillOpacity="0.85"
      animate={{ x: [12, 0, 0, 12], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 3, repeat: Infinity, times: [0, 0.25, 0.75, 1] }}
    />
    <motion.path d="M40 8 L46 20 L34 20 Z" fill="white" fillOpacity="0.95"
      animate={{ y: [-12, 0, 0, -12], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 3, repeat: Infinity, times: [0, 0.25, 0.75, 1] }}
    />
  </SVG>
);

/* ─── Perspective — building tilting straight ─── */
export const PerspectiveAnim = (p: IconProps) => (
  <SVG {...p}>
    <motion.path
      animate={{ d: [
        "M16 18 L48 14 L52 50 L12 46 Z",
        "M14 12 L50 12 L50 52 L14 52 Z",
        "M16 18 L48 14 L52 50 L12 46 Z",
      ]}}
      transition={{ duration: 3, ...loop }}
      fill="white"
    />
    <motion.path
      animate={{ d: [
        "M22 22 L28 22 L28 28 L22 28 Z M36 24 L42 24 L42 30 L36 30 Z M22 34 L28 34 L28 40 L22 40 Z M36 36 L42 36 L42 42 L36 42 Z",
        "M22 20 L28 20 L28 26 L22 26 Z M36 20 L42 20 L42 26 L36 26 Z M22 32 L28 32 L28 38 L22 38 Z M36 32 L42 32 L42 38 L36 38 Z",
        "M22 22 L28 22 L28 28 L22 28 Z M36 24 L42 24 L42 30 L36 30 Z M22 34 L28 34 L28 40 L22 40 Z M36 36 L42 36 L42 42 L36 42 Z",
      ]}}
      transition={{ duration: 3, ...loop }}
      fill="#1f2937"
    />
  </SVG>
);

/* ─── Lip sync — face with talking mouth + sound waves ─── */
export const MicAnim = (p: IconProps) => (
  <SVG {...p}>
    <circle cx="24" cy="32" r="14" fill="white" />
    <circle cx="20" cy="30" r="1.5" fill="#1f2937" />
    <circle cx="28" cy="30" r="1.5" fill="#1f2937" />
    <motion.ellipse cx="24" cy="38" rx="4" ry="2" fill="#1f2937"
      animate={{ ry: [1, 3, 1, 2, 1] }} transition={{ duration: 1.2, ...loop }}
      style={{ transformOrigin: "24px 38px" }}
    />
    {[0, 1, 2].map(i => (
      <motion.path key={i}
        d={`M${42 + i * 4} ${28 - i * 2} Q${48 + i * 4} 32 ${42 + i * 4} ${36 + i * 2}`}
        stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
      />
    ))}
  </SVG>
);

/* ─── Upscale — small pixelated grows into sharp big ─── */
export const UpscaleAnim = (p: IconProps) => (
  <SVG {...p}>
    <rect x="8" y="8" width="16" height="16" rx="1" fill="white" fillOpacity="0.6" />
    <rect x="10" y="10" width="5" height="5" fill="#1f2937" />
    <rect x="17" y="10" width="5" height="5" fill="#1f2937" fillOpacity="0.5" />
    <rect x="10" y="17" width="5" height="5" fill="#1f2937" fillOpacity="0.3" />
    {/* arrow */}
    <motion.path d="M26 32 L36 32 M32 28 L36 32 L32 36"
      stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
      animate={{ x: [0, 3, 0] }} transition={{ duration: 1.6, ...loop }}
    />
    <motion.g animate={{ scale: [0.95, 1.05, 0.95] }} transition={{ duration: 2, ...loop }} style={{ transformOrigin: "48px 40px" }}>
      <rect x="38" y="30" width="22" height="22" rx="2" fill="white" />
      <circle cx="49" cy="41" r="5" fill="#1f2937" />
    </motion.g>
  </SVG>
);

/* ─── Caption — video frame with subtitle bar typing ─── */
export const CaptionAnim = (p: IconProps) => (
  <SVG {...p}>
    <rect x="8" y="10" width="48" height="36" rx="3" fill="white" fillOpacity="0.95" />
    <polygon points="26,20 26,32 38,26" fill="#1f2937" />
    {/* subtitle box */}
    <rect x="10" y="48" width="44" height="10" rx="2" fill="#1f2937" />
    <motion.rect x="14" y="52" width="36" height="2" fill="white"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: [0, 1, 1, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, times: [0, 0.5, 0.85, 1] }}
      style={{ transformOrigin: "14px 52px" }}
    />
  </SVG>
);

/* ─── Extend — image expanding outward ─── */
export const ExtendAnim = (p: IconProps) => (
  <SVG {...p}>
    <motion.rect
      animate={{ width: [20, 40, 20], x: [22, 12, 22] }}
      transition={{ duration: 2.6, ...loop }}
      y="22" height="20" rx="2" fill="white"
    />
    <motion.path d="M8 32 L4 32 M4 28 L0 32 L4 36"
      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
      animate={{ x: [4, 0, 4] }} transition={{ duration: 2.6, ...loop }}
    />
    <motion.path d="M56 32 L60 32 M60 28 L64 32 L60 36"
      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
      animate={{ x: [-4, 0, -4] }} transition={{ duration: 2.6, ...loop }}
    />
  </SVG>
);

/* ─── Green screen — person in front of green panel ─── */
export const GreenScreenAnim = (p: IconProps) => (
  <SVG {...p}>
    <motion.rect x="8" y="10" width="48" height="36" rx="3"
      animate={{ fill: ["#22c55e", "#86efac", "#22c55e"] }} transition={{ duration: 2, ...loop }}
    />
    <circle cx="32" cy="26" r="6" fill="white" />
    <path d="M22 46 Q22 34 32 34 Q42 34 42 46 Z" fill="white" />
    <rect x="20" y="50" width="24" height="3" rx="1.5" fill="white" />
  </SVG>
);

/* ─── Watermark — image with logo + remove X ─── */
export const WatermarkAnim = (p: IconProps) => (
  <SVG {...p}>
    <rect x="8" y="10" width="48" height="44" rx="3" fill="white" fillOpacity="0.95" />
    <path d="M8 44 L20 30 L30 38 L40 24 L56 44 Z" fill="#94a3b8" />
    <motion.g
      animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 2.4, ...loop }}
    >
      <circle cx="44" cy="44" r="8" fill="#1f2937" fillOpacity="0.55" />
      <path d="M40 40 L48 48 M48 40 L40 48" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </motion.g>
  </SVG>
);

/* ─── Denoise — noisy → clean ─── */
export const NoiseAnim = (p: IconProps) => (
  <SVG {...p}>
    <rect x="8" y="10" width="48" height="44" rx="3" fill="white" fillOpacity="0.9" />
    {Array.from({ length: 22 }).map((_, i) => {
      const x = 10 + (i * 11) % 44;
      const y = 12 + ((i * 17) % 40);
      return (
        <motion.rect key={i} x={x} y={y} width="2" height="2" fill="#1f2937"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: (i % 10) * 0.08 }}
        />
      );
    })}
    <motion.path d="M14 44 L24 32 L32 38 L42 26 L52 42"
      stroke="#1f2937" strokeWidth="2" strokeLinecap="round" fill="none"
      animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, ...loop }}
    />
  </SVG>
);

/* ─── Thumbnail — YouTube-style with play ─── */
export const ThumbAnim = (p: IconProps) => (
  <SVG {...p}>
    <rect x="6" y="14" width="52" height="36" rx="4" fill="white" />
    <motion.g animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.6, ...loop }} style={{ transformOrigin: "32px 32px" }}>
      <circle cx="32" cy="32" r="10" fill="#ef4444" />
      <polygon points="29,27 29,37 38,32" fill="white" />
    </motion.g>
  </SVG>
);

/* ─── Storyboard — frames sliding ─── */
export const StoryAnim = (p: IconProps) => (
  <SVG {...p}>
    {[8, 24, 40].map((x, i) => (
      <motion.g key={x} animate={{ y: [0, -3, 0] }} transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}>
        <rect x={x} y="20" width="14" height="24" rx="2" fill="white" />
        <circle cx={x + 7} cy="28" r="2" fill="#1f2937" />
        <rect x={x + 2} y="34" width="10" height="1.5" fill="#1f2937" />
        <rect x={x + 2} y="38" width="7" height="1.5" fill="#1f2937" />
      </motion.g>
    ))}
    <motion.path d="M22 32 L26 32 M38 32 L42 32" stroke="white" strokeWidth="1.5" strokeLinecap="round"
      animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.6, ...loop }}
    />
  </SVG>
);

export type AnimatedIconName =
  | "brush" | "shirt" | "person" | "faces" | "erase" | "mask"
  | "palette" | "sparkle" | "scissors" | "pencil" | "bulb" | "avatar"
  | "film" | "hair" | "box" | "logo" | "perspective" | "mic"
  | "upscale" | "caption" | "extend" | "green" | "watermark" | "noise"
  | "thumb" | "story";

export const ANIM_REGISTRY: Record<AnimatedIconName, (p: IconProps) => React.JSX.Element> = {
  brush: BrushAnim, shirt: ShirtAnim, person: PersonAnim, faces: FaceSwapAnim,
  erase: EraseAnim, mask: MaskAnim, palette: PaletteAnim, sparkle: SparkleAnim,
  scissors: ScissorsAnim, pencil: PencilAnim, bulb: BulbAnim, avatar: AvatarAnim,
  film: FilmAnim, hair: HairAnim, box: BoxAnim, logo: LogoAnim,
  perspective: PerspectiveAnim, mic: MicAnim, upscale: UpscaleAnim, caption: CaptionAnim,
  extend: ExtendAnim, green: GreenScreenAnim, watermark: WatermarkAnim, noise: NoiseAnim,
  thumb: ThumbAnim, story: StoryAnim,
};

export const TOOL_ANIM_MAP: Record<string, AnimatedIconName> = {
  // images
  "inpaint": "brush",
  "clothes-changer": "shirt",
  "headshot": "person",
  "face-swap": "faces",
  "bg-remover": "erase",
  "cartoon": "mask",
  "colorizer": "palette",
  "retouching": "sparkle",
  "remover": "scissors",
  "sketch-to-image": "pencil",
  "relight": "bulb",
  "character-swap": "faces",
  "storyboard": "story",
  "hair-changer": "hair",
  "avatar-generator": "avatar",
  "product-photo": "box",
  "logo-generator": "logo",
  "perspective-correction": "perspective",
  // videos
  "swap-characters": "faces",
  "talking-photo": "avatar",
  "upscale": "upscale",
  "auto-caption": "caption",
  "lip-sync": "mic",
  "video-extender": "extend",
  "green-screen": "green",
  "video-colorizer": "palette",
  "video-watermark": "watermark",
  "video-bg-replacer": "erase",
  "video-intro": "film",
  "video-denoise": "noise",
  "thumbnail-generator": "thumb",
};
