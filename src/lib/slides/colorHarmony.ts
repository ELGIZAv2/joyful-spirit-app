// HSL color-math utilities — derive a full palette from a single seed color.
// Returns space-separated HSL triplets (no `hsl()` wrapper) to match the
// project's CSS variable convention (e.g. "211 100% 50%").

export type HSL = { h: number; s: number; l: number };

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function hexToHsl(hex: string): HSL {
  const h = hex.replace("#", "");
  const norm = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(norm.slice(0, 2), 16) / 255;
  const g = parseInt(norm.slice(2, 4), 16) / 255;
  const b = parseInt(norm.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  let hue = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hue = (b - r) / d + 2; break;
      case b: hue = (r - g) / d + 4; break;
    }
    hue *= 60;
  }
  return { h: Math.round(hue), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslString({ h, s, l }: HSL): string {
  return `${h} ${s}% ${l}%`;
}

/** Produce a harmonious palette (primary, accent, bg, surface, fg, muted, border)
    from a single seed hex. Uses analogous + complementary HSL math. */
export function harmoniousPalette(seedHex: string, mood: "light" | "dark" = "light") {
  const seed = hexToHsl(seedHex);
  const accentHue = (seed.h + 180) % 360; // complementary
  const isDark = mood === "dark";

  return {
    primary: hslString({ h: seed.h, s: clamp(seed.s, 55, 90), l: isDark ? 65 : 50 }),
    accent: hslString({ h: accentHue, s: clamp(seed.s, 50, 80), l: isDark ? 70 : 55 }),
    bg: isDark
      ? hslString({ h: seed.h, s: 30, l: 6 })
      : hslString({ h: seed.h, s: 20, l: 98 }),
    surface: isDark
      ? hslString({ h: seed.h, s: 25, l: 12 })
      : hslString({ h: seed.h, s: 10, l: 100 }),
    fg: isDark
      ? hslString({ h: seed.h, s: 10, l: 96 })
      : hslString({ h: seed.h, s: 15, l: 10 }),
    muted: isDark
      ? hslString({ h: seed.h, s: 8, l: 60 })
      : hslString({ h: seed.h, s: 8, l: 46 }),
    border: isDark
      ? hslString({ h: seed.h, s: 15, l: 20 })
      : hslString({ h: seed.h, s: 15, l: 90 }),
  };
}
