// Custom inline SVG icons — proprietary, no third-party icon libraries.
type Props = { className?: string; strokeWidth?: number };

const base = (className?: string) => `inline-block ${className || ""}`;

export const MenuIcon = ({ className, strokeWidth = 2 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
    <path d="M4 7h16M4 12h16M4 17h10" />
  </svg>
);

export const PlusIcon = ({ className, strokeWidth = 2 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const CloseIcon = ({ className, strokeWidth = 2 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const ChevronDownIcon = ({ className, strokeWidth = 2 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const ChevronRightIcon = ({ className, strokeWidth = 2 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const ArrowUpIcon = ({ className, strokeWidth = 2.4 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);

export const HeartIcon = ({ className, strokeWidth = 1.8 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.8 8.6a5 5 0 0 0-8.8-3.2A5 5 0 0 0 3.2 8.6c0 3.7 4.6 7.4 8.8 10.7 4.2-3.3 8.8-7 8.8-10.7z" />
  </svg>
);

// Bottom nav icons
export const GridHomeIcon = ({ className, strokeWidth = 2 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3.25" y="3.25" width="7.5" height="7.5" rx="2" />
    <rect x="13.25" y="3.25" width="7.5" height="7.5" rx="2" />
    <rect x="3.25" y="13.25" width="7.5" height="7.5" rx="2" />
    <rect x="13.25" y="13.25" width="7.5" height="7.5" rx="2" />
  </svg>
);

export const WandStudioIcon = ({ className, strokeWidth = 2 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 19.5L15 9" />
    <path d="M13.5 7.5L16.5 10.5" />
    <path d="M18 3l.9 2.1L21 6l-2.1.9L18 9l-.9-2.1L15 6l2.1-.9z" fill="currentColor" stroke="none" />
  </svg>
);

export const CompassIcon = ({ className, strokeWidth = 2 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M15.8 8.2l-2.2 5.6-5.6 2.2 2.2-5.6z" fill="currentColor" stroke="none" />
  </svg>
);

export const SettingsGearIcon = ({ className, strokeWidth = 1.6 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
    <path d="M19.6 13.6a7.7 7.7 0 0 0 0-3.2l1.8-1.4-1.9-3.3-2.2.7a7.7 7.7 0 0 0-2.8-1.6L14 2h-4l-.5 2.8a7.7 7.7 0 0 0-2.8 1.6l-2.2-.7L2.6 9l1.8 1.4a7.7 7.7 0 0 0 0 3.2L2.6 15l1.9 3.3 2.2-.7a7.7 7.7 0 0 0 2.8 1.6L10 22h4l.5-2.8a7.7 7.7 0 0 0 2.8-1.6l2.2.7L21.4 15l-1.8-1.4Z" />
  </svg>
);

// ---------- Tool icons (custom geometric SVGs) ----------
export const ToolBrushIcon = ({ className, strokeWidth = 1.7 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l4 4-3 3a3 3 0 0 1-4-4z" />
    <path d="M13 15l7-7a2.1 2.1 0 0 0-3-3l-7 7" />
  </svg>
);
export const ToolShirtIcon = ({ className, strokeWidth = 1.7 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7l4-3 2 2h4l2-2 4 3-2 4h-2v9H8v-9H6z" />
  </svg>
);
export const ToolPersonIcon = ({ className, strokeWidth = 1.7 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1-5 5-7 8-7s7 2 8 7" />
  </svg>
);
export const ToolFacesIcon = ({ className, strokeWidth = 1.7 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="10" r="4" />
    <circle cx="16" cy="13" r="4" />
    <path d="M5 21c0-2.5 2-4.5 4.5-4.5M14 21c0-2.5 2-4.5 4.5-4.5" />
  </svg>
);
export const ToolEraseIcon = ({ className, strokeWidth = 1.7 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 17l8-8 7 7-5 5H6z" />
    <path d="M14 6l4 4" />
  </svg>
);
export const ToolPaletteIcon = ({ className, strokeWidth = 1.7 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2-.5-1.2.4-2 1.5-2H17a4 4 0 0 0 4-4 8 8 0 0 0-9-10z" />
    <circle cx="7.5" cy="10.5" r="1" fill="currentColor" />
    <circle cx="11" cy="6.5" r="1" fill="currentColor" />
    <circle cx="16" cy="8" r="1" fill="currentColor" />
  </svg>
);
export const ToolSparklesIcon = ({ className, strokeWidth = 1.7 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4l1.6 4L18 9.5l-4.4 1.5L12 15l-1.6-4L6 9.5 10.4 8z" fill="currentColor" stroke="none" />
    <path d="M19 14l.7 1.6L21 16l-1.3.4L19 18l-.7-1.6L17 16l1.3-.4z" fill="currentColor" stroke="none" />
  </svg>
);
export const ToolScissorsIcon = ({ className, strokeWidth = 1.7 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M9 8l11 11M9 16L20 5" />
  </svg>
);
export const ToolPencilIcon = ({ className, strokeWidth = 1.7 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21l4-1 12-12-3-3L4 17z" />
    <path d="M14 6l3 3" />
  </svg>
);
export const ToolBulbIcon = ({ className, strokeWidth = 1.7 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 1.5 2 1.5 3h5c0-1 .5-2 1.5-3A6 6 0 0 0 12 3z" />
  </svg>
);
export const ToolMaskIcon = ({ className, strokeWidth = 1.7 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 8c0-2 4-4 8-4s8 2 8 4v4c0 5-4 8-8 8s-8-3-8-8z" />
    <circle cx="9" cy="11" r="1" fill="currentColor" />
    <circle cx="15" cy="11" r="1" fill="currentColor" />
  </svg>
);
export const ToolFilmIcon = ({ className, strokeWidth = 1.7 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" />
  </svg>
);
export const ToolHairIcon = ({ className, strokeWidth = 1.7 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 13c0-5 3-9 7-9s7 4 7 9v3c0 2-1 5-3 5s-2-2-2-4M9 17c0 2 0 4-2 4s-3-3-3-5z" />
  </svg>
);
export const ToolAvatarIcon = ({ className, strokeWidth = 1.7 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="10" r="3" />
    <path d="M6.5 18a6 6 0 0 1 11 0" />
  </svg>
);
export const ToolBoxIcon = ({ className, strokeWidth = 1.7 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7l9-4 9 4-9 4z" />
    <path d="M3 7v10l9 4V11M21 7v10l-9 4" />
  </svg>
);
export const ToolLogoIcon = ({ className, strokeWidth = 1.7 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12l3 3 5-6" />
  </svg>
);
export const ToolPerspectiveIcon = ({ className, strokeWidth = 1.7 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 6l14 2v10L5 20z" />
  </svg>
);
export const ToolMicIcon = ({ className, strokeWidth = 1.7 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="3" width="6" height="12" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
);
export const ToolUpscaleIcon = ({ className, strokeWidth = 1.7 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 10V4h6M20 14v6h-6M4 4l7 7M20 20l-7-7" />
  </svg>
);
export const ToolCaptionIcon = ({ className, strokeWidth = 1.7 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M7 14h4M13 14h4" />
  </svg>
);
export const ToolExtendIcon = ({ className, strokeWidth = 1.7 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6" width="14" height="12" rx="2" />
    <path d="M19 9v6M21 12h-2" />
  </svg>
);
export const ToolGreenScreenIcon = ({ className, strokeWidth = 1.7 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="14" rx="2" />
    <path d="M9 22h6M12 18v4" />
  </svg>
);
export const ToolWatermarkIcon = ({ className, strokeWidth = 1.7 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M7 17l4-8 3 5 2-3 2 4" />
  </svg>
);
export const ToolNoiseIcon = ({ className, strokeWidth = 1.7 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12c2-3 4 3 6 0s4-3 6 0 4 3 6 0" />
  </svg>
);
export const ToolThumbIcon = ({ className, strokeWidth = 1.7 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" />
  </svg>
);
export const ToolGridIcon = ({ className, strokeWidth = 1.7 }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.4" />
    <rect x="14" y="3" width="7" height="7" rx="1.4" />
    <rect x="3" y="14" width="7" height="7" rx="1.4" />
    <rect x="14" y="14" width="7" height="7" rx="1.4" />
  </svg>
);
