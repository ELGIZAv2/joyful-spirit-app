// Theme packs — single source of truth for slide visual identity.
// Each theme = palette + typography + spacing + radius + shadow + accent shape.
// Used by the renderer to apply consistent tokens across all slides.

export type ThemeId =
  | "apple-keynote"
  | "linear"
  | "stripe"
  | "vercel"
  | "notion"
  | "editorial"
  | "brutalist"
  | "glassmorphism"
  | "dark-luxury"
  | "pastel-minimal"
  | "ios-clean"
  | "megsy-landing";

export interface ThemeTokens {
  id: ThemeId;
  name: string;
  description: string;
  /** Foundational colors — all HSL strings without `hsl()` wrapper. */
  palette: {
    bg: string;
    surface: string;
    fg: string;
    muted: string;
    primary: string;
    accent: string;
    border: string;
  };
  typography: {
    headingFamily: string;
    bodyFamily: string;
    /** tightness of heading letter-spacing, -0.05em (display) → 0 */
    headingTracking: string;
  };
  spacing: {
    /** Base padding for slide content in px (at 1920×1080 canvas). */
    padding: number;
    gap: number;
  };
  radius: {
    /** Base radius in px applied to cards/badges. */
    card: number;
    badge: number;
  };
  shadow: {
    card: string;
    soft: string;
  };
  accentShape: "none" | "blob" | "grid" | "dots" | "gradient" | "stripe";
  mood: "light" | "dark";
}

export const THEMES: Record<ThemeId, ThemeTokens> = {
  "apple-keynote": {
    id: "apple-keynote",
    name: "Apple Keynote",
    description: "Clean, premium, generous whitespace.",
    palette: { bg: "0 0% 100%", surface: "0 0% 98%", fg: "240 6% 10%", muted: "240 4% 46%", primary: "211 100% 50%", accent: "16 100% 60%", border: "240 6% 90%" },
    typography: { headingFamily: '"SF Pro Display", "Inter", system-ui, sans-serif', bodyFamily: '"SF Pro Text", "Inter", system-ui, sans-serif', headingTracking: "-0.035em" },
    spacing: { padding: 96, gap: 32 },
    radius: { card: 24, badge: 999 },
    shadow: { card: "0 1px 3px hsl(240 6% 10% / 0.04), 0 8px 24px hsl(240 6% 10% / 0.06)", soft: "0 1px 2px hsl(240 6% 10% / 0.04)" },
    accentShape: "none",
    mood: "light",
  },
  linear: {
    id: "linear",
    name: "Linear",
    description: "Sharp, minimal, dark engineering aesthetic.",
    palette: { bg: "240 10% 4%", surface: "240 8% 8%", fg: "240 6% 96%", muted: "240 4% 60%", primary: "245 80% 65%", accent: "315 75% 65%", border: "240 6% 16%" },
    typography: { headingFamily: '"Inter Display", "Inter", system-ui, sans-serif', bodyFamily: '"Inter", system-ui, sans-serif', headingTracking: "-0.04em" },
    spacing: { padding: 88, gap: 28 },
    radius: { card: 12, badge: 8 },
    shadow: { card: "0 0 0 1px hsl(240 6% 16%), 0 12px 32px hsl(0 0% 0% / 0.4)", soft: "0 0 0 1px hsl(240 6% 16%)" },
    accentShape: "grid",
    mood: "dark",
  },
  stripe: {
    id: "stripe",
    name: "Stripe",
    description: "Confident, gradient, financial-grade polish.",
    palette: { bg: "210 60% 98%", surface: "0 0% 100%", fg: "222 47% 11%", muted: "215 16% 47%", primary: "243 75% 59%", accent: "171 77% 41%", border: "214 32% 91%" },
    typography: { headingFamily: '"Sohne", "Inter Display", system-ui, sans-serif', bodyFamily: '"Sohne", "Inter", system-ui, sans-serif', headingTracking: "-0.03em" },
    spacing: { padding: 96, gap: 32 },
    radius: { card: 16, badge: 8 },
    shadow: { card: "0 2px 4px hsl(222 47% 11% / 0.04), 0 12px 32px hsl(243 75% 59% / 0.08)", soft: "0 1px 3px hsl(222 47% 11% / 0.06)" },
    accentShape: "gradient",
    mood: "light",
  },
  vercel: {
    id: "vercel",
    name: "Vercel",
    description: "Mono, geometric, high-contrast black & white.",
    palette: { bg: "0 0% 100%", surface: "0 0% 100%", fg: "0 0% 4%", muted: "0 0% 45%", primary: "0 0% 9%", accent: "0 0% 9%", border: "0 0% 90%" },
    typography: { headingFamily: '"Geist", "Inter Display", system-ui, sans-serif', bodyFamily: '"Geist", "Inter", system-ui, sans-serif', headingTracking: "-0.045em" },
    spacing: { padding: 80, gap: 24 },
    radius: { card: 8, badge: 6 },
    shadow: { card: "0 0 0 1px hsl(0 0% 90%)", soft: "none" },
    accentShape: "none",
    mood: "light",
  },
  notion: {
    id: "notion",
    name: "Notion",
    description: "Warm, document-like, friendly serif accents.",
    palette: { bg: "37 30% 98%", surface: "0 0% 100%", fg: "30 6% 15%", muted: "30 4% 45%", primary: "20 65% 50%", accent: "200 50% 45%", border: "30 10% 88%" },
    typography: { headingFamily: '"GT Walsheim", "Inter", system-ui, sans-serif', bodyFamily: '"Inter", system-ui, sans-serif', headingTracking: "-0.025em" },
    spacing: { padding: 88, gap: 28 },
    radius: { card: 6, badge: 4 },
    shadow: { card: "0 1px 2px hsl(30 6% 15% / 0.04)", soft: "none" },
    accentShape: "none",
    mood: "light",
  },
  editorial: {
    id: "editorial",
    name: "Editorial Magazine",
    description: "Serif headlines, generous columns, print luxury.",
    palette: { bg: "40 30% 96%", surface: "0 0% 100%", fg: "20 10% 12%", muted: "20 8% 42%", primary: "10 70% 45%", accent: "20 10% 12%", border: "30 15% 86%" },
    typography: { headingFamily: '"Playfair Display", "Cormorant Garamond", Georgia, serif', bodyFamily: '"Inter", "Helvetica Neue", system-ui, sans-serif', headingTracking: "-0.02em" },
    spacing: { padding: 104, gap: 36 },
    radius: { card: 0, badge: 0 },
    shadow: { card: "none", soft: "none" },
    accentShape: "stripe",
    mood: "light",
  },
  brutalist: {
    id: "brutalist",
    name: "Brutalist",
    description: "Raw blocks, thick borders, unapologetic.",
    palette: { bg: "55 80% 92%", surface: "0 0% 100%", fg: "0 0% 0%", muted: "0 0% 30%", primary: "0 100% 50%", accent: "240 100% 50%", border: "0 0% 0%" },
    typography: { headingFamily: '"Space Grotesk", "Archivo Black", system-ui, sans-serif', bodyFamily: '"Space Mono", "JetBrains Mono", monospace', headingTracking: "-0.03em" },
    spacing: { padding: 72, gap: 20 },
    radius: { card: 0, badge: 0 },
    shadow: { card: "6px 6px 0 0 hsl(0 0% 0%)", soft: "3px 3px 0 0 hsl(0 0% 0%)" },
    accentShape: "stripe",
    mood: "light",
  },
  glassmorphism: {
    id: "glassmorphism",
    name: "Glassmorphism",
    description: "Frosted glass on gradient mesh.",
    palette: { bg: "240 50% 8%", surface: "240 30% 20%", fg: "0 0% 98%", muted: "240 10% 70%", primary: "260 80% 70%", accent: "190 90% 60%", border: "240 30% 35%" },
    typography: { headingFamily: '"Sora", "Inter Display", system-ui, sans-serif', bodyFamily: '"Inter", system-ui, sans-serif', headingTracking: "-0.035em" },
    spacing: { padding: 96, gap: 32 },
    radius: { card: 28, badge: 999 },
    shadow: { card: "0 0 0 1px hsl(0 0% 100% / 0.08), 0 24px 60px hsl(240 50% 4% / 0.5)", soft: "0 0 0 1px hsl(0 0% 100% / 0.08)" },
    accentShape: "blob",
    mood: "dark",
  },
  "dark-luxury": {
    id: "dark-luxury",
    name: "Dark Luxury",
    description: "Black background, gold serif, editorial.",
    palette: { bg: "0 0% 4%", surface: "0 0% 8%", fg: "40 30% 92%", muted: "40 10% 60%", primary: "42 65% 55%", accent: "42 80% 70%", border: "40 10% 18%" },
    typography: { headingFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif', bodyFamily: '"Inter", system-ui, sans-serif', headingTracking: "-0.015em" },
    spacing: { padding: 104, gap: 36 },
    radius: { card: 4, badge: 999 },
    shadow: { card: "0 0 0 1px hsl(42 65% 55% / 0.15)", soft: "none" },
    accentShape: "stripe",
    mood: "dark",
  },
  "pastel-minimal": {
    id: "pastel-minimal",
    name: "Pastel Minimal",
    description: "Soft pastels, airy whitespace, friendly.",
    palette: { bg: "320 60% 98%", surface: "0 0% 100%", fg: "260 25% 18%", muted: "260 10% 55%", primary: "330 75% 70%", accent: "200 70% 70%", border: "320 30% 92%" },
    typography: { headingFamily: '"DM Sans", "Inter", system-ui, sans-serif', bodyFamily: '"DM Sans", "Inter", system-ui, sans-serif', headingTracking: "-0.03em" },
    spacing: { padding: 96, gap: 32 },
    radius: { card: 20, badge: 999 },
    shadow: { card: "0 4px 16px hsl(330 75% 70% / 0.12)", soft: "0 2px 8px hsl(330 75% 70% / 0.1)" },
    accentShape: "blob",
    mood: "light",
  },
  "ios-clean": {
    id: "ios-clean",
    name: "iOS Clean",
    description: "Apple-system iOS aesthetic — soft, rounded, system colors.",
    palette: { bg: "0 0% 100%", surface: "210 20% 98%", fg: "240 6% 10%", muted: "240 4% 46%", primary: "211 100% 50%", accent: "142 71% 45%", border: "240 10% 92%" },
    typography: { headingFamily: '"SF Pro Display", -apple-system, "Inter", system-ui, sans-serif', bodyFamily: '"SF Pro Text", -apple-system, "Inter", system-ui, sans-serif', headingTracking: "-0.03em" },
    spacing: { padding: 88, gap: 28 },
    radius: { card: 20, badge: 999 },
    shadow: { card: "0 1px 2px hsl(240 6% 10% / 0.04), 0 8px 24px hsl(240 6% 10% / 0.06)", soft: "0 1px 2px hsl(240 6% 10% / 0.04)" },
    accentShape: "none",
    mood: "light",
  },
  "megsy-landing": {
    id: "megsy-landing",
    name: "Megsy Landing",
    description: "Megsy hero gradient, bold display, landing-page DNA.",
    palette: { bg: "240 60% 4%", surface: "240 40% 10%", fg: "0 0% 98%", muted: "240 10% 70%", primary: "217 91% 60%", accent: "330 81% 60%", border: "240 30% 20%" },
    typography: { headingFamily: '"Sora", "Inter Display", system-ui, sans-serif', bodyFamily: '"Inter", system-ui, sans-serif', headingTracking: "-0.045em" },
    spacing: { padding: 96, gap: 32 },
    radius: { card: 20, badge: 999 },
    shadow: { card: "0 0 0 1px hsl(240 30% 20%), 0 20px 60px hsl(217 91% 60% / 0.15)", soft: "0 0 0 1px hsl(240 30% 20%)" },
    accentShape: "gradient",
    mood: "dark",
  },
};

export const THEME_LIST = Object.values(THEMES);

export function getTheme(id?: string | null): ThemeTokens {
  if (id && id in THEMES) return THEMES[id as ThemeId];
  return THEMES["apple-keynote"];
}

/** CSS variable map for a theme — inject into a wrapper element's style. */
export function themeCssVars(theme: ThemeTokens): Record<string, string> {
  const p = theme.palette;
  return {
    "--slide-bg": p.bg,
    "--slide-surface": p.surface,
    "--slide-fg": p.fg,
    "--slide-muted": p.muted,
    "--slide-primary": p.primary,
    "--slide-accent": p.accent,
    "--slide-border": p.border,
    "--slide-heading-family": theme.typography.headingFamily,
    "--slide-body-family": theme.typography.bodyFamily,
    "--slide-heading-tracking": theme.typography.headingTracking,
    "--slide-pad": `${theme.spacing.padding}px`,
    "--slide-gap": `${theme.spacing.gap}px`,
    "--slide-radius-card": `${theme.radius.card}px`,
    "--slide-radius-badge": `${theme.radius.badge}px`,
    "--slide-shadow-card": theme.shadow.card,
    "--slide-shadow-soft": theme.shadow.soft,
  };
}
