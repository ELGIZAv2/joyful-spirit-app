// Server-side deck post-processor — runs after expandDeep and before review.
// Zero LLM calls. Enforces layout intelligence, anti-repetition, word budgets,
// and deck balance entirely with deterministic rules. Saves credits.

type Slide = Record<string, unknown> & {
  type?: string;
  layout?: string;
  title?: string;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  steps?: unknown[];
  events?: unknown[];
  stats?: unknown[];
  left_bullets?: string[];
  right_bullets?: string[];
  big_value?: string;
  big_label?: string;
  image?: string;
  images?: string[];
  image_queries?: string[];
  quote?: string;
  attribution?: string;
};

const TEXT_ONLY_LAYOUTS = new Set([
  "callout", "manifesto", "pull-quote", "poster-typo", "definition",
  "centered-narrow", "left-aligned-hero", "right-aligned-hero", "centered",
  "two-col", "three-col", "four-col", "pillars", "icon-grid", "ribbon-cards",
  "comparison", "before-after", "vs-split", "table-compare",
  "big-number", "stat-cluster", "stat-circles", "kpi-strip",
  "process", "timeline", "timeline-horizontal", "numbered-list", "step-vertical",
]);

const IMAGE_LAYOUTS = [
  "split-right", "split-left", "image-full", "image-top", "image-bottom",
  "image-side-card", "focus-image", "magazine-cover", "diagonal-split", "polaroid",
];

const TEXT_LAYOUT_FALLBACKS = [
  "centered", "left-aligned-hero", "right-aligned-hero", "centered-narrow",
  "callout", "manifesto", "poster-typo",
];

// (1) Deterministic seed shuffle — same topic gives same layout choices,
// different topics get different but consistent picks.
function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h >>> 0;
}
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const rand = seededRandom(seed);
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// (9) Variant suffix dimensions — MUST match src/lib/slides/layouts.ts so the
// renderer's parseVariant() applies the correct styling tokens. Format the
// layout id as `base--accent-align-density-ornament` and the frontend will
// pick up accent color, alignment, density, and ornament class.
const ACCENT_NAMES = [
  "indigo", "violet", "rose", "amber", "emerald", "teal", "cyan", "sky",
  "fuchsia", "lime", "orange", "slate", "stone", "gold", "ruby", "mint",
];
const ALIGN_NAMES = ["left", "center", "right"];
const DENSITY_NAMES = ["airy", "balanced", "dense"];
const ORNAMENT_NAMES = [
  "plain", "ribbon", "grid", "dots", "gradient", "frame",
  "corner-mark", "side-bar", "rule",
];

/** Word count (handles RTL + LTR via simple whitespace split). */
function wc(s?: string): number {
  if (!s) return 0;
  return s.trim().split(/\s+/).filter(Boolean).length;
}

/** Trim a string to N words at a sensible sentence boundary. */
function trimWords(s: string, max: number): string {
  const words = s.trim().split(/\s+/);
  if (words.length <= max) return s;
  // Try to cut at a sentence terminator within max+5 words.
  const slice = words.slice(0, max + 5).join(" ");
  const sentenceMatch = slice.match(/^(.+?[.!?؟])\s/);
  if (sentenceMatch && wc(sentenceMatch[1]) <= max + 2) return sentenceMatch[1];
  return words.slice(0, max).join(" ") + "…";
}

/** Determine the slide's content shape from its filled fields. */
function detectContentShape(s: Slide): {
  contentType: string;
  bulletsCount: number;
  bodyWords: number;
  statsCount: number;
  hasImage: boolean;
} {
  const bulletsCount = Array.isArray(s.bullets) ? s.bullets.length : 0;
  const bodyWords = wc(s.body);
  const statsCount = Array.isArray(s.stats) ? s.stats.length : 0;
  const hasImage = !!s.image || (Array.isArray(s.images) && s.images.length > 0);

  if (s.type === "cover") return { contentType: "title", bulletsCount, bodyWords, statsCount, hasImage };
  if (s.type === "section") return { contentType: "section", bulletsCount, bodyWords, statsCount, hasImage };
  if (s.type === "closing") return { contentType: "title", bulletsCount, bodyWords, statsCount, hasImage };
  if (s.type === "quote" || s.quote) return { contentType: "quote", bulletsCount, bodyWords, statsCount, hasImage };
  if (statsCount >= 3 || s.big_value) return { contentType: "stats", bulletsCount, bodyWords, statsCount, hasImage };
  if (Array.isArray(s.steps) && s.steps.length >= 2) return { contentType: "process", bulletsCount, bodyWords, statsCount, hasImage };
  if (Array.isArray(s.events) && s.events.length >= 2) return { contentType: "timeline", bulletsCount, bodyWords, statsCount, hasImage };
  if ((Array.isArray(s.left_bullets) && s.left_bullets.length) || (Array.isArray(s.right_bullets) && s.right_bullets.length)) {
    return { contentType: "comparison", bulletsCount, bodyWords, statsCount, hasImage };
  }
  if (Array.isArray(s.image_queries) && s.image_queries.length >= 2) {
    return { contentType: "gallery", bulletsCount, bodyWords, statsCount, hasImage };
  }
  if (hasImage && (bulletsCount > 0 || bodyWords > 0)) {
    return { contentType: "text+image", bulletsCount, bodyWords, statsCount, hasImage };
  }
  if (bulletsCount >= 3) return { contentType: "bullets", bulletsCount, bodyWords, statsCount, hasImage };
  return { contentType: "text", bulletsCount, bodyWords, statsCount, hasImage };
}

/** Map content shape → preferred layout list (first match wins). */
const SHAPE_TO_LAYOUTS: Record<string, string[]> = {
  title:       ["magazine-cover", "left-aligned-hero", "centered", "poster-typo"],
  section:     ["poster-typo", "magazine-cover", "manifesto", "centered"],
  quote:       ["pull-quote", "manifesto", "callout"],
  stats:       ["stat-cluster", "big-number", "stat-circles", "kpi-strip"],
  process:     ["process", "step-vertical", "numbered-list"],
  timeline:    ["timeline", "timeline-horizontal", "story-rows"],
  comparison:  ["comparison", "vs-split", "before-after", "table-compare"],
  gallery:     ["image-grid-4", "image-grid-2", "gallery", "carousel-strip", "masonry-cards"],
  "text+image":["split-right", "split-left", "image-side-card", "image-top", "focus-image", "diagonal-split"],
  bullets:    ["three-col", "two-col", "four-col", "bento", "pillars", "icon-grid", "ribbon-cards", "numbered-list"],
  text:        ["centered", "left-aligned-hero", "centered-narrow", "callout", "definition"],
};

/** Pick the best layout for the slide, avoiding recent repeats.
 *  Uses a seeded shuffle of candidates so the same topic stays consistent
 *  but different topics produce different orderings. */
function pickLayout(s: Slide, shape: ReturnType<typeof detectContentShape>, recent: string[], seed: number): string {
  const baseCandidates = SHAPE_TO_LAYOUTS[shape.contentType] ?? SHAPE_TO_LAYOUTS.text;
  const candidates = seededShuffle(baseCandidates, seed + recent.length);
  const recentSet = new Set(recent.slice(-2));
  if (s.layout && candidates.includes(s.layout) && !recentSet.has(s.layout)) {
    return s.layout;
  }
  for (const c of candidates) {
    if (!recentSet.has(c)) return c;
  }
  return candidates[0];
}

/** Enforce per-element word budgets and density caps. */
function applyBudgets(s: Slide): void {
  // Titles: never ellipsize cover/section/closing (they're the deck identity).
  // For other slides only trim if absurdly long (>14 words), and trim cleanly
  // without an ellipsis so proper nouns / names stay intact.
  const isEdgeTitle = s.type === "cover" || s.type === "section" || s.type === "closing";
  if (typeof s.title === "string" && !isEdgeTitle && wc(s.title) > 14) {
    const trimmed = trimWords(s.title, 12);
    s.title = trimmed.replace(/…\s*$/u, "").trim();
  }
  if (typeof s.subtitle === "string" && wc(s.subtitle) > 28) s.subtitle = trimWords(s.subtitle, 25);

  if (Array.isArray(s.bullets)) {
    s.bullets = s.bullets
      .filter((b): b is string => typeof b === "string" && b.trim().length > 0)
      .map((b) => (wc(b) > 14 ? trimWords(b, 12) : b))
      .slice(0, 7);
  }
  if (typeof s.body === "string" && wc(s.body) > 220) {
    s.body = trimWords(s.body, 200);
  }
  if (typeof s.quote === "string" && wc(s.quote) > 40) {
    s.quote = trimWords(s.quote, 35);
  }

  // Per-layout density caps
  const layout = s.layout as string | undefined;
  if (layout) {
    if (["callout", "manifesto", "poster-typo"].includes(layout)) {
      delete s.body;
      delete s.bullets;
    }
    if (["pull-quote"].includes(layout)) {
      delete s.bullets;
      delete s.body;
    }
    if (["big-number", "stat-circles", "kpi-strip"].includes(layout)) {
      delete s.bullets;
    }
    if (layout === "image-full" || layout === "focus-image" || layout === "magazine-cover") {
      delete s.bullets;
      if (typeof s.body === "string" && wc(s.body) > 50) s.body = trimWords(s.body, 40);
    }
    // Multi-column layouts: hard-cap bullets so they fit cleanly
    if (Array.isArray(s.bullets)) {
      if (layout === "four-col" && s.bullets.length > 4) s.bullets = s.bullets.slice(0, 4);
      if (layout === "three-col" && s.bullets.length > 6) s.bullets = s.bullets.slice(0, 6);
      if (layout === "pillars" && s.bullets.length > 4) s.bullets = s.bullets.slice(0, 4);
      if (layout === "ribbon-cards" && s.bullets.length > 4) s.bullets = s.bullets.slice(0, 4);
    }
  }
}

/** Ensure first slide is cover and last is closing. */
function balanceDeck(slides: Slide[]): Slide[] {
  if (slides.length === 0) return slides;
  if (slides[0].type !== "cover") slides[0].type = "cover";
  if (slides[slides.length - 1].type !== "closing") slides[slides.length - 1].type = "closing";
  return slides;
}

/** Estimate render "weight" of a slide. >100 = overflow risk. */
function estimateWeight(s: Slide): number {
  let w = 0;
  if (typeof s.title === "string") w += Math.min(wc(s.title), 12) * 2;
  if (typeof s.subtitle === "string") w += Math.min(wc(s.subtitle), 25);
  if (typeof s.body === "string") w += Math.min(wc(s.body), 250) * 0.6;
  if (Array.isArray(s.bullets)) w += s.bullets.reduce((a, b) => a + Math.min(wc(b), 16) * 1.5, 0);
  if (Array.isArray(s.steps)) w += s.steps.length * 14;
  if (Array.isArray(s.events)) w += s.events.length * 16;
  if (Array.isArray(s.stats)) w += s.stats.length * 10;
  return Math.round(w);
}

/** Split an over-stuffed slide into Part 1/N. Only splits slides whose
    primary content is bullets/body — never quote/stats/title/closing. */
function maybeSplit(s: Slide): Slide[] {
  if (!s || s.type === "cover" || s.type === "closing" || s.type === "quote") return [s];
  const layout = s.layout as string | undefined;
  if (layout && ["pull-quote", "manifesto", "callout", "poster-typo", "big-number"].includes(layout)) return [s];

  const weight = estimateWeight(s);
  if (weight <= 120) return [s];

  const bullets = Array.isArray(s.bullets) ? s.bullets : [];
  // Split bullets across two slides if there are >5.
  if (bullets.length >= 6) {
    const half = Math.ceil(bullets.length / 2);
    const a: Slide = { ...s, bullets: bullets.slice(0, half), title: `${s.title ?? ""} — 1/2`.trim() };
    const b: Slide = { ...s, bullets: bullets.slice(half), title: `${s.title ?? ""} — 2/2`.trim() };
    delete (b as Slide).image; // avoid duplicate image
    return [a, b];
  }
  // Split long body at paragraph boundary.
  if (typeof s.body === "string" && wc(s.body) > 180) {
    const sentences = s.body.split(/(?<=[.!?؟])\s+/);
    const mid = Math.ceil(sentences.length / 2);
    const a: Slide = { ...s, body: sentences.slice(0, mid).join(" "), title: `${s.title ?? ""} — 1/2`.trim() };
    const b: Slide = { ...s, body: sentences.slice(mid).join(" "), title: `${s.title ?? ""} — 2/2`.trim() };
    delete (b as Slide).image;
    return [a, b];
  }
  return [s];
}

/** Token set for Jaccard similarity (used to dedupe near-duplicate titles). */
function tokens(s?: string): Set<string> {
  if (!s) return new Set();
  return new Set(
    s.toLowerCase()
      .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
      .split(/\s+/)
      .filter(w => w.length > 2),
  );
}
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const uni = a.size + b.size - inter;
  return uni === 0 ? 0 : inter / uni;
}

/** (4) Drop near-duplicate slides whose titles are >70% similar to an earlier slide. */
function dedupSimilar(slides: Slide[]): Slide[] {
  if (slides.length <= 3) return slides;
  const kept: Slide[] = [];
  const titleSets: Set<string>[] = [];
  for (let i = 0; i < slides.length; i++) {
    const s = slides[i];
    const isEdge = i === 0 || i === slides.length - 1;
    const ts = tokens(s.title);
    let dup = false;
    if (!isEdge && ts.size > 0) {
      for (const prev of titleSets) {
        if (jaccard(ts, prev) > 0.7) { dup = true; break; }
      }
    }
    if (!dup) { kept.push(s); titleSets.push(ts); }
  }
  if (kept.length < slides.length) {
    console.log(`[postProcess] deduped ${slides.length - kept.length} near-duplicate slides`);
  }
  return kept;
}

/** Estimate text density of a slide to pick the right density token. */
function slideDensity(s: Slide): "airy" | "balanced" | "dense" {
  const total =
    wc(s.title as string) + wc(s.subtitle as string) + wc(s.body as string) +
    (Array.isArray(s.bullets) ? s.bullets.reduce((acc, b) => acc + wc(b), 0) : 0);
  if (total <= 18) return "airy";
  if (total >= 55) return "dense";
  return "balanced";
}

/** (9) Compose a variant suffix onto each slide's layout so the renderer
 *  picks up real styling (accent color, alignment, density, ornament).
 *  Format must stay in sync with parseVariant() in SlidesDeckCard.tsx and
 *  generateLayouts() in src/lib/slides/layouts.ts. */
function rotateVariants(slides: Slide[], seed: number): void {
  const accents = seededShuffle(ACCENT_NAMES, seed);
  const ornaments = seededShuffle(ORNAMENT_NAMES, seed ^ 0x9E3779B1);
  let lastAccent = "";
  let lastOrnament = "";
  for (let i = 0; i < slides.length; i++) {
    const s = slides[i];
    const base = (s.layout || "centered").toString().split("--")[0];
    // Cover slides get a wider, centered, ornament-rich treatment.
    const isHero = s.type === "cover" || base === "magazine-cover" || s.type === "closing";

    let accent = accents[i % accents.length];
    if (accent === lastAccent) accent = accents[(i + 3) % accents.length];
    let ornament = isHero
      ? (ornaments.find((o) => o !== "plain") || "ribbon")
      : ornaments[i % ornaments.length];
    if (ornament === lastOrnament) ornament = ornaments[(i + 5) % ornaments.length];

    const align: string = isHero ? "center" : ALIGN_NAMES[(i + (seed & 1)) % ALIGN_NAMES.length];
    const density = slideDensity(s);

    s.layout = `${base}--${accent}-${align}-${density}-${ornament}`;
    // Keep legacy fields for back-compat; renderer ignores them now.
    (s as { variant?: string }).variant = s.layout;
    (s as { accent?: string }).accent = accent;

    lastAccent = accent;
    lastOrnament = ornament;
  }
}

/** Main entry: run rules across the deck.
 *  @param topicSeedStr — used to seed deterministic shuffles (same topic, same picks). */
export function postProcessDeck(slides: Slide[], topicSeedStr = ""): Slide[] {
  if (!Array.isArray(slides) || slides.length === 0) return slides;
  const seed = hashString(topicSeedStr || (slides[0]?.title as string) || "deck");
  balanceDeck(slides);

  // Pass 0 — drop near-duplicate slides (Jaccard > 0.7 on titles)
  slides = dedupSimilar(slides);
  balanceDeck(slides);

  // Pass 1 — layout assignment + word budgets per slide
  const recentLayouts: string[] = [];
  for (const s of slides) {
    const shape = detectContentShape(s);
    const chosen = pickLayout(s, shape, recentLayouts, seed);
    s.layout = chosen;
    recentLayouts.push(chosen);
    if (recentLayouts.length > 4) recentLayouts.shift();

    if (IMAGE_LAYOUTS.includes(chosen) && !s.image && !(Array.isArray(s.images) && s.images.length)) {
      const fallback = TEXT_LAYOUT_FALLBACKS.find((l) => !recentLayouts.slice(-2, -1).includes(l)) || "centered";
      s.layout = fallback;
      recentLayouts[recentLayouts.length - 1] = fallback;
    }
    applyBudgets(s);
  }

  // Pass 2 — auto-split overflow risks (only middle slides; cover/closing untouched).
  const final: Slide[] = [];
  for (let i = 0; i < slides.length; i++) {
    const s = slides[i];
    const isEdge = i === 0 || i === slides.length - 1;
    if (isEdge) { final.push(s); continue; }
    const parts = maybeSplit(s);
    final.push(...parts);
  }

  // Pass 3 — re-run anti-repetition only (budgets already applied) after splits
  const recent2: string[] = [];
  for (const s of final) {
    const layout = s.layout as string | undefined;
    if (layout && recent2.slice(-2).includes(layout)) {
      const shape = detectContentShape(s);
      const alts = seededShuffle(SHAPE_TO_LAYOUTS[shape.contentType] ?? SHAPE_TO_LAYOUTS.text, seed + recent2.length);
      const alt = alts.find((a) => !recent2.slice(-2).includes(a));
      if (alt) s.layout = alt;
    }
    recent2.push(s.layout as string);
    if (recent2.length > 4) recent2.shift();
  }

  // Pass 4 — variant + accent rotation for visual diversity
  rotateVariants(final, seed);

  return final;
}

/** Pick a theme id from the topic + language. Pure heuristic — no LLM. */
export function pickThemeForTopic(topic: string, language: string): string {
  const t = (topic || "").toLowerCase();
  const ar = language === "ar";
  // crude keyword routing
  if (/\b(finance|invest|bank|stock|crypto|fintech|profit|revenue|valuation|earnings|market)\b/.test(t)) return "stripe";
  if (/\b(engineer|developer|api|saas|product|infra|backend|software|code|cloud|devops|platform)\b/.test(t)) return "linear";
  if (/\b(apple|ios|iphone|mac|keynote|design system|ux|ui|sf pro)\b/.test(t)) return "apple-keynote";
  if (/\b(ai|gpt|llm|ml|model|neural|automation|agent)\b/.test(t)) return "megsy-landing";
  if (/\b(fashion|magazine|editorial|art|culture|cinema|film|poetry|literature)\b/.test(t)) return "editorial";
  if (/\b(luxury|gold|premium|exclusive|boutique|haute|estate|villa)\b/.test(t)) return "dark-luxury";
  if (/\b(kids|child|baby|cute|fun|happy|spring|pastel|bakery|gift)\b/.test(t)) return "pastel-minimal";
  if (/\b(notion|doc|note|research|study|knowledge|wiki)\b/.test(t)) return "notion";
  if (/\b(brutal|raw|punk|protest|street|graffiti)\b/.test(t)) return "brutalist";
  if (/\b(glass|crystal|aurora|nebula|cosmic|space|future)\b/.test(t)) return "glassmorphism";
  // language-aware defaults
  if (ar) return "megsy-landing";
  return "apple-keynote";
}

/** Map audience/duration → recommended slide count + density hint. */
export function planDeckShape(opts: { audience?: string; durationMin?: number; requested?: number }): {
  slideCount: number;
  density: "light" | "medium" | "dense";
} {
  if (opts.requested && opts.requested > 0) {
    return { slideCount: opts.requested, density: opts.requested > 25 ? "dense" : opts.requested > 14 ? "medium" : "light" };
  }
  const dur = opts.durationMin ?? 0;
  if (dur > 0) {
    // ~1 slide per minute for short, 1 per 1.2 min for long
    const count = dur <= 10 ? Math.max(5, dur) : Math.round(dur / 1.2);
    return { slideCount: Math.min(50, count), density: dur > 20 ? "dense" : "medium" };
  }
  return { slideCount: 12, density: "medium" };
}

