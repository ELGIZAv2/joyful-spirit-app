// Zod schema validation for slide deck data — kills LLM hallucinations and
// guarantees the renderer receives well-formed slides. Uses Deno-compatible
// npm:zod with safe parsing (never throws).
import { z } from "https://esm.sh/zod@3.23.8";

const slideBase = z.object({
  type: z.string().optional(),
  layout: z.string().optional(),
  variant: z.string().optional(),
  accent: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  kicker: z.string().optional(),
  body: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  steps: z.array(z.object({ title: z.string(), desc: z.string().optional() })).optional(),
  events: z.array(z.object({ date: z.string(), title: z.string(), desc: z.string().optional() })).optional(),
  stats: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  left_title: z.string().optional(),
  right_title: z.string().optional(),
  left_bullets: z.array(z.string()).optional(),
  right_bullets: z.array(z.string()).optional(),
  big_value: z.string().optional(),
  big_label: z.string().optional(),
  image: z.string().optional(),
  images: z.array(z.string()).optional(),
  image_query: z.string().optional(),
  image_queries: z.array(z.string()).optional(),
  quote: z.string().optional(),
  attribution: z.string().optional(),
  focus: z.string().optional(),
  cta: z.string().optional(),
}).passthrough();

export const outlineSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  language: z.string().optional(),
  slides: z.array(slideBase).min(1),
});

export const expandSchema = z.object({
  slides: z.array(slideBase).min(1),
});

export const brandKitSchema = z.object({
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{3,8}$/).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{3,8}$/).optional(),
  fontFamily: z.string().max(80).optional(),
}).optional();

export type BrandKit = z.infer<typeof brandKitSchema>;

/** Safe parse — returns the parsed value or null. Never throws. */
export function safeParseOutline(raw: unknown) {
  const r = outlineSchema.safeParse(raw);
  return r.success ? r.data : null;
}
export function safeParseExpand(raw: unknown) {
  const r = expandSchema.safeParse(raw);
  return r.success ? r.data : null;
}
export function safeParseBrandKit(raw: unknown) {
  const r = brandKitSchema.safeParse(raw);
  return r.success ? r.data : undefined;
}

/** Heuristic — does this deck have repetition or density issues worth a
    review-pass LLM call? Returns false to skip the critic and save credits. */
export function deckNeedsCritic(slides: Array<{ title?: string; bullets?: string[]; layout?: string }>): boolean {
  if (slides.length < 6) return false;
  const titles = slides.map(s => (s.title || "").toLowerCase().trim()).filter(Boolean);
  // Duplicate titles
  const titleSet = new Set(titles);
  if (titleSet.size < titles.length) return true;
  // Bullet duplication across consecutive slides
  for (let i = 1; i < slides.length; i++) {
    const a = (slides[i - 1].bullets || []).map(b => b.toLowerCase().slice(0, 40));
    const b = (slides[i].bullets || []).map(b => b.toLowerCase().slice(0, 40));
    if (a.length && b.length) {
      const overlap = a.filter(x => b.includes(x)).length;
      if (overlap >= 2) return true;
    }
  }
  // Same layout 3x in a row (post-processor should prevent, but double-check)
  for (let i = 2; i < slides.length; i++) {
    if (slides[i].layout && slides[i].layout === slides[i - 1].layout && slides[i].layout === slides[i - 2].layout) {
      return true;
    }
  }
  return false;
}
