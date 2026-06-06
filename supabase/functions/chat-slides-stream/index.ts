// Streaming slides generation with live narrative.
// Tells the user — in their own language — what it's doing as it does it,
// then streams a final React deck JSON.
//
// SSE events:
//   data: {"type":"narrate","delta":"..."}
//   data: {"type":"phase","name":"search|outline|content|images|finalize"}
//   data: {"type":"deck","deck":{...}}
//   data: {"type":"error","message":"..."}
//   data: [DONE]

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { smartImage, quickImage } from "./imageAgent.ts";
import { postProcessDeck, pickThemeForTopic, planDeckShape } from "./deckPostProcessor.ts";
import { safeParseOutline, safeParseExpand, safeParseBrandKit, deckNeedsCritic, type BrandKit } from "./schemas.ts";
import { createJob, runInBackground, JobWriter } from "../_shared/jobs.ts";
import { getAuthUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Active HTML templates — frontend renders these via /public/templates/{slug}/index.html.
// Keep this list in sync with src/lib/slidesTemplates.ts. Old templates were removed;
// defaulting to them makes generated decks ignore the selected template.
const REACT_TEMPLATES = new Set(["digital-oasis", "ocean-flow", "seasonal-scroll", "vanta-atelier", "aquara-water", "landscape-language", "valence-blobs", "synthra-builder", "kami-notebook", "spidey-web", "yash-folio", "storm-to-calm", "folio-scatter", "axiom-vector", "prisma-creative-studio"]);

// Standard-tier requests are routed to the `plusai-presentation` edge function
// (Plus AI Presentations API → real .pptx). This streaming pipeline only handles
// the rich premium React-deck templates listed in REACT_TEMPLATES above.

const PALETTES: Record<string, { primary: string; accent: string; bg: string; fg: string }> = {
  "digital-oasis":          { primary: "#000000", accent: "#e6f578", bg: "#000000", fg: "#e8ece4" },
  "ocean-flow":             { primary: "#1565d8", accent: "#4fc3f7", bg: "#1565d8", fg: "#ffffffee" },
  "seasonal-scroll":        { primary: "#c8dbbe", accent: "#1a1a1a", bg: "#fafafa", fg: "#1a1a1a" },
  "vanta-atelier":          { primary: "#0e0e0e", accent: "#c4a882", bg: "#0e0e0e", fg: "#e8e4de" },
  "aquara-water":           { primary: "#0a0e17", accent: "#78b4ff", bg: "#0a0e17", fg: "#e8edf5" },
  "landscape-language":     { primary: "#1a1714", accent: "#8a7355", bg: "#F5F0E8", fg: "#1a1714" },
  "valence-blobs":          { primary: "#000000", accent: "#ec4899", bg: "#d4d4d8", fg: "#0a0a0a" },
  "synthra-builder":        { primary: "#111111", accent: "#111111", bg: "#fafafa", fg: "#111111" },
  "kami-notebook":          { primary: "#a89070", accent: "#8b7355", bg: "#09090b", fg: "#f5f0e8" },
  "spidey-web":             { primary: "#E23636", accent: "#2563eb", bg: "#0A0A0A", fg: "#f5f5f5" },
  "yash-folio":             { primary: "#d94f7a", accent: "#8b5cf6", bg: "#0e0e10", fg: "#f0ece6" },
  "storm-to-calm":          { primary: "#8ca0ff", accent: "#bfd4ff", bg: "#0a0a12", fg: "#e8edf5" },
  "folio-scatter":          { primary: "#111111", accent: "#8a8478", bg: "#fafaf8", fg: "#111111" },
  "axiom-vector":           { primary: "#7c3aed", accent: "#3b82f6", bg: "#ffffff", fg: "#0a0a0a" },
  "premium-vanta-atelier":   { primary: "#c9a84c", accent: "#f0d78c", bg: "#0a0a0a", fg: "#f5f0e0" },
  "premium-verdana-3d":      { primary: "#a8d63b", accent: "#5a8a5c", bg: "#0a0e08", fg: "#e8ece4" },
  "premium-iphone-aura":     { primary: "#7C9AFF", accent: "#FFB07C", bg: "#000000", fg: "#f5f5f7" },
  "premium-landscape-napa":  { primary: "#1a1714", accent: "#8a7355", bg: "#F5F0E8", fg: "#1a1714" },
  "premium-yash-graphic":    { primary: "#d94f7a", accent: "#8b5cf6", bg: "#0e0e10", fg: "#f0ece6" },
  "premium-doc-scriptforge": { primary: "#ffffff", accent: "#888888", bg: "#000000", fg: "#ffffff" },
  "premium-ocean-flow":      { primary: "#5cbdb9", accent: "#2d8a9e", bg: "#001f3f", fg: "#e8f0f8" },
  "premium-splash-genesis":  { primary: "#10b981", accent: "#73ffb8", bg: "#06070d", fg: "#e8f0e8" },
  "premium-ice-fashion":     { primary: "#e0e7ff", accent: "#a5f3fc", bg: "#000000", fg: "#ffffff" },
  "premium-seasonal-flow":   { primary: "#1a1a1a", accent: "#8a8478", bg: "#fafafa", fg: "#1a1a1a" },
  "premium-bold-3d-typo":    { primary: "#f5f5f5", accent: "#a3a3a3", bg: "#0a0a0a", fg: "#f5f5f5" },
  "premium-blobs-landing":   { primary: "#a78bfa", accent: "#f0abfc", bg: "#0e0b1f", fg: "#f8f7ff" },
  "premium-tech-consulting": { primary: "#e8edf3", accent: "#7aa7d9", bg: "#0f1b3d", fg: "#e8edf3" },
  "premium-cosmetic-laundry":{ primary: "#c45c7c", accent: "#e8a3b8", bg: "#f8e8ee", fg: "#3a1a25" },
  "premium-forma-sofa":      { primary: "#8b7355", accent: "#c9b099", bg: "#f0ebe3", fg: "#2a2018" },
  "premium-baresol":         { primary: "#7d9b76", accent: "#a8c0a0", bg: "#f5f0e8", fg: "#243024" },
  "premium-robotic-tech":    { primary: "#22d3ee", accent: "#67e8f9", bg: "#06070d", fg: "#e8f7fb" },
  "premium-ai-video-gen":    { primary: "#ec4899", accent: "#a78bfa", bg: "#0a0a1a", fg: "#f8f7ff" },
  "premium-silent-wealth":   { primary: "#0d0d0d", accent: "#6b6b6b", bg: "#f5f3ee", fg: "#0d0d0d" },
  "premium-aiventraq":       { primary: "#10b981", accent: "#34d399", bg: "#06070d", fg: "#e8f7ee" },
  "premium-megsy":           { primary: "#3b82f6", accent: "#ec4899", bg: "#08070d", fg: "#f8fafc" },
  "premium-glass-pitch":     { primary: "#3b82f6", accent: "#a855f7", bg: "#070b1f", fg: "#f8fafc" },
  "premium-cinema-3d":       { primary: "#06b6d4", accent: "#f43f5e", bg: "#000814", fg: "#ffffff" },
  "premium-ios":             { primary: "#7c9aff", accent: "#34d399", bg: "#030712", fg: "#f8fafc" },
  "premium-sketch":          { primary: "#1f1b16", accent: "#b7791f", bg: "#f8f5ee", fg: "#1a1714" },
  "premium-3d":              { primary: "#a78bfa", accent: "#67e8f9", bg: "#070713", fg: "#ffffff" },
  "premium-neon":            { primary: "#22d3ee", accent: "#ec4899", bg: "#050816", fg: "#f0f9ff" },
  "premium-brutalist":       { primary: "#0d0d0d", accent: "#fde047", bg: "#f5f3ee", fg: "#0d0d0d" },
  "premium-cinematic":       { primary: "#5cbdb9", accent: "#99f6e4", bg: "#001f3f", fg: "#e8f0f8" },
  "premium-mono":            { primary: "#e5e5e5", accent: "#a3a3a3", bg: "#0a0a0a", fg: "#fafafa" },
  "premium-pastel":          { primary: "#f8c8d8", accent: "#c9e4ca", bg: "#fbf3f0", fg: "#5b4a52" },
  "premium-editorial":       { primary: "#1a1714", accent: "#8a7355", bg: "#f3eee5", fg: "#1a1714" },
  "premium-terminal":        { primary: "#22c55e", accent: "#86efac", bg: "#020a05", fg: "#dcfce7" },
  "premium-vapor":           { primary: "#ec4899", accent: "#f0abfc", bg: "#1e1b4b", fg: "#fef3c7" },
  "premium-blueprint":       { primary: "#bfdbfe", accent: "#3b82f6", bg: "#0b2545", fg: "#eff6ff" },
  "premium-organic":         { primary: "#7d9b76", accent: "#c2956b", bg: "#efe9dd", fg: "#3a3528" },
};

const SERPER_API_KEY = Deno.env.get("SERPER_API_KEY");
const PEXELS_API_KEY = Deno.env.get("PEXELS_API_KEY");
const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SLIDES_JOB_BUDGET_MS = 125_000;
const AI_JSON_TIMEOUT_MS = 22_000;
const AI_JSON_MAX_ATTEMPTS = 1;
const NARRATIVE_TIMEOUT_MS = 5_000;
const ENABLE_BLOCKING_SMART_IMAGES = true;

console.log("[chat-slides-stream] image keys present:",
  { serper: !!SERPER_API_KEY, firecrawl: !!FIRECRAWL_API_KEY, pexels: !!PEXELS_API_KEY });

/* ────────────────────────────────────────────────────────── */
/* Slides AI helpers — deepseek/deepseek-v4-flash via OpenRouter only. */
/* ────────────────────────────────────────────────────────── */

import { getLLM, ROUTER_MODELS } from "../_shared/llm-router.ts";

async function aiJson<T = unknown>(messages: Array<{ role: string; content: string }>, model?: string): Promise<T | null> {
  const router = await getLLM();
  const chosen = router ? router.mapModel(model || ROUTER_MODELS.slides) : (model || ROUTER_MODELS.slides);
  const chain = router ? [{ url: router.url, key: router.key, model: chosen }] : [];
  if (!chain.length) throw new Error("No LLM provider configured");

  for (const target of chain) {
    for (let attempt = 0; attempt < AI_JSON_MAX_ATTEMPTS; attempt++) {
      const ctl = new AbortController();
      const timeout = setTimeout(() => ctl.abort(), AI_JSON_TIMEOUT_MS);
      let r: Response;
      try {
        r = await fetch(target.url, {
          method: "POST",
          headers: { Authorization: `Bearer ${target.key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: target.model,
            messages: [
              { role: "system", content: "Return raw JSON only. No markdown fences. No prose." },
              ...messages,
            ],
            response_format: { type: "json_object" },
          }),
          signal: ctl.signal,
        });
      } catch (e) {
        clearTimeout(timeout);
        console.warn("aiJson timeout/error", target.model, (e as Error)?.message || e);
        break;
      }
      clearTimeout(timeout);
      if (r.ok) {
        const d = await r.json();
        const text = d?.choices?.[0]?.message?.content as string | undefined;
        if (!text) return null;
        try { return JSON.parse(text) as T; } catch {
          const m = text.match(/\{[\s\S]*\}/);
          if (m) try { return JSON.parse(m[0]) as T; } catch { /* */ }
          return null;
        }
      }
      if (r.status !== 429 && r.status < 500) {
        console.warn("aiJson failed", target.url, r.status, (await r.text().catch(() => "")).slice(0, 200));
        break; // try next target
      }
      const wait = 800 * Math.pow(2, attempt) + Math.random() * 400;
      console.warn(`aiJson ${r.status}, retry in ${Math.round(wait)}ms (attempt ${attempt + 1})`);
      await new Promise((res) => setTimeout(res, wait));
    }
  }
  console.warn("aiJson giving up after all targets");
  return null;
}

async function streamNarrative(
  systemPrompt: string,
  userPrompt: string,
  send: (delta: string) => void,
  signal?: AbortSignal,
  model?: string,
): Promise<string> {
  const router = await getLLM();
  const target = router ? { url: router.url, key: router.key, model: router.mapModel(model || ROUTER_MODELS.slidesNarrate) } : null;
  if (!target) throw new Error("No LLM provider configured");
  const ctl = new AbortController();
  const timeout = setTimeout(() => ctl.abort(), NARRATIVE_TIMEOUT_MS);
  if (signal) signal.addEventListener("abort", () => ctl.abort(), { once: true });
  try {
    const r = await fetch(target.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${target.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: target.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
      signal: ctl.signal,
    });
    if (!r.ok || !r.body) {
      console.warn("streamNarrative failed", r.status);
      return "";
    }
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let full = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf("\n")) !== -1) {
        let line = buf.slice(0, nl);
        buf = buf.slice(nl + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") return full;
        try {
          const parsed = JSON.parse(data);
          const c = parsed?.choices?.[0]?.delta?.content as string | undefined;
          if (c) { full += c; send(c); }
        } catch { /* partial */ }
      }
    }
    return full;
  } catch (e) {
    console.warn("streamNarrative timeout/error", (e as Error)?.message || e);
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

/* ────────────────────────────────────────────────────────── */
/* Web search + image search                                  */
/* ────────────────────────────────────────────────────────── */

async function serperSearch(q: string): Promise<Array<{ title: string; snippet: string; link: string }>> {
  const query = (q || "").trim().replace(/\s+/g, " ").slice(0, 150);
  if (!query) return [];

  // Single trusted source: Wikipedia. Use the MediaWiki search API to find the
  // most relevant article, then return its title + extract + canonical URL.
  try {
    const search = new URL("https://en.wikipedia.org/w/api.php");
    search.searchParams.set("action", "query");
    search.searchParams.set("format", "json");
    search.searchParams.set("origin", "*");
    search.searchParams.set("generator", "search");
    search.searchParams.set("gsrsearch", query);
    search.searchParams.set("gsrlimit", "5");
    search.searchParams.set("prop", "extracts|info");
    search.searchParams.set("exintro", "1");
    search.searchParams.set("explaintext", "1");
    search.searchParams.set("inprop", "url");
    const r = await fetch(search.toString());
    if (r.ok) {
      const d = await r.json();
      const pages = d?.query?.pages || {};
      const mapped = Object.values(pages)
        .map((p: any) => ({
          title: p?.title || "",
          snippet: (p?.extract || "").slice(0, 600),
          link: p?.fullurl || (p?.title ? `https://en.wikipedia.org/wiki/${encodeURIComponent(String(p.title).replace(/\s+/g, "_"))}` : ""),
        }))
        .filter((x) => x.link && x.snippet);
      if (mapped.length) {
        console.log("[wikipedia search] returned", mapped.length);
        return mapped;
      }
    } else {
      console.warn("[wikipedia search]", r.status);
    }
  } catch (e) {
    console.warn("[wikipedia search] error", (e as Error).message);
  }

  return [];
}

/** Scrape top N links via Firecrawl to obtain real article text (markdown). */
async function firecrawlEnrich(links: string[], maxPages = 6): Promise<string> {
  if (!FIRECRAWL_API_KEY || !links.length) return "";
  const targets = links.filter(Boolean).slice(0, maxPages);
  const ctlTimeout = (ms: number) => {
    const c = new AbortController();
    setTimeout(() => c.abort(), ms);
    return c;
  };
  const results = await Promise.all(targets.map(async (url) => {
    try {
      const c = ctlTimeout(9000);
      const r = await fetch("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true, timeout: 8000 }),
        signal: c.signal,
      });
      if (!r.ok) return "";
      const d = await r.json();
      const md = (d?.data?.markdown || d?.markdown || "") as string;
      return md.slice(0, 3500);
    } catch { return ""; }
  }));
  return results.filter(Boolean).map((t, i) => `# Source ${i + 1}: ${targets[i]}\n${t}`).join("\n\n---\n\n");
}

async function serperImage(q: string): Promise<string | null> {
  if (!SERPER_API_KEY) return null;
  const query = (q || "").trim().replace(/\s+/g, " ").slice(0, 100);
  if (!query) return null;
  try {
    const r = await fetch("https://google.serper.dev/images", {
      method: "POST",
      headers: { "X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, num: 5 }),
    });
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      console.warn("[serperImage]", r.status, body.slice(0, 200));
      return null;
    }
    const d = await r.json();
    const list = d?.images;
    if (!Array.isArray(list)) return null;
    const ok = list.find((it: { imageUrl?: string; imageWidth?: number }) =>
      it?.imageUrl && it.imageUrl.startsWith("https://") && (it.imageWidth ?? 800) >= 600
    );
    return ok?.imageUrl ?? list[0]?.imageUrl ?? null;
  } catch { return null; }
}

async function pexelsImage(q: string): Promise<string | null> {
  if (!PEXELS_API_KEY) return null;
  try {
    const url = new URL("https://api.pexels.com/v1/search");
    url.searchParams.set("query", q.slice(0, 100));
    url.searchParams.set("per_page", "1");
    url.searchParams.set("orientation", "landscape");
    const r = await fetch(url.toString(), { headers: { Authorization: PEXELS_API_KEY } });
    if (!r.ok) return null;
    const d = await r.json();
    const photo = d?.photos?.[0];
    return photo?.src?.large2x || photo?.src?.large || photo?.src?.original || null;
  } catch { return null; }
}

// ── Keyless fallbacks ──────────────────────────────────────
// Openverse: free, CC-licensed image search. No API key required.
async function openverseImage(q: string): Promise<string | null> {
  try {
    const url = new URL("https://api.openverse.org/v1/images/");
    url.searchParams.set("q", q.slice(0, 100));
    url.searchParams.set("page_size", "5");
    url.searchParams.set("license_type", "all");
    url.searchParams.set("mature", "false");
    const r = await fetch(url.toString(), {
      headers: { "User-Agent": "MegsyAI-Slides/1.0 (https://megsy.ai)" },
    });
    if (!r.ok) return null;
    const d = await r.json();
    const list = d?.results;
    if (!Array.isArray(list)) return null;
    const ok = list.find((it: { url?: string; width?: number }) =>
      it?.url && it.url.startsWith("https://") && (it.width ?? 800) >= 600
    );
    return ok?.url ?? list[0]?.url ?? null;
  } catch { return null; }
}

// Wikipedia: image of the top article matching the query (great for famous topics).
async function wikipediaImage(q: string): Promise<string | null> {
  try {
    const search = new URL("https://en.wikipedia.org/w/api.php");
    search.searchParams.set("action", "query");
    search.searchParams.set("format", "json");
    search.searchParams.set("origin", "*");
    search.searchParams.set("generator", "search");
    search.searchParams.set("gsrsearch", q.slice(0, 100));
    search.searchParams.set("gsrlimit", "1");
    search.searchParams.set("prop", "pageimages");
    search.searchParams.set("piprop", "original");
    search.searchParams.set("pilicense", "any");
    const r = await fetch(search.toString());
    if (!r.ok) return null;
    const d = await r.json();
    const pages = d?.query?.pages;
    if (!pages) return null;
    const first = Object.values(pages)[0] as { original?: { source?: string } } | undefined;
    return first?.original?.source ?? null;
  } catch { return null; }
}

function sanitizeQuery(q: string): string {
  return (q || "")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, " ")
    .replace(/[\u0600-\u06FF\u0750-\u077F\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/g, " ")
    .replace(/\s+/g, " ").trim();
}

async function findImage(q: string | undefined): Promise<string | null> {
  if (!q) return null;
  const cleaned = sanitizeQuery(q);
  if (!cleaned) return null;
  const tries = [cleaned, cleaned.split(/\s+/).slice(0, 3).join(" ")]
    .filter((x, i, arr) => x && arr.indexOf(x) === i);
  for (const t of tries) {
    // Real-search only — no random Flickr fallback. Empty image is fine; renderer
    // gracefully falls back to layout-without-image.
    const u =
      (await serperImage(t)) ||
      (await pexelsImage(t)) ||
      (await openverseImage(t)) ||
      (await wikipediaImage(t));
    if (u) return u;
  }
  return null;
}

/* ────────────────────────────────────────────────────────── */
/* Deck pipeline (outline → deep content → images)            */
/* ────────────────────────────────────────────────────────── */

type RawSlide = Record<string, unknown> & { type?: string; title?: string; body?: string; bullets?: string[] };

async function buildOutline(topic: string, content: string, language: string, longInputMode: boolean, requestedCount?: number, brandKit?: BrandKit): Promise<{ title?: string; subtitle?: string; language?: string; slides: RawSlide[] }> {
  const lengthRule = requestedCount && requestedCount > 0
    ? `The user EXPLICITLY requested EXACTLY ${requestedCount} slides. You MUST output exactly ${requestedCount} slides — no more, no less. First MUST be "cover", last MUST be "closing".`
    : longInputMode
      ? "The user provided substantial reference material — produce 18-35 slides that fully cover it, splitting major themes into dedicated sections."
      : "Decide optimal slide count based on topic depth: 8 for simple, 12-18 for standard, 20-30 for deep/complex topics, up to 50 for very rich subjects. Min 8, max 50.";

  const sectionRule = requestedCount && requestedCount >= 20
    ? `- Insert a "section" every 5-7 slides; include multiple "stats" and "quote" slides spread throughout.`
    : `- Insert a "section" every 4-6 slides; include at least one "stats" and one "quote" if length >= 10.`;

  const sys = `You are an AWWWARDS-level presentation designer. Output ONLY a JSON object — no markdown.
You must DESIGN this deck specifically for THIS topic — never reuse the same structure twice. Mix layouts freely, like a real magazine art director would.

Schema:
{
  "title": "deck title (in user language)",
  "subtitle": "short subtitle",
  "language": "ar|en|fr|...",
  "slides": [
    {"type":"cover","title":"...","subtitle":"...","image_query":"3-5 ENGLISH visual keywords"},
    {"type":"section","title":"section name","kicker":"01","image_query":"english keywords"},
    {"type":"content","layout":"<pick one from the 40 layout list>","variant":"<pick one of: default|glass|outline|filled|gradient|neon|paper|mono>","accent":"<pick one of: none|top|left|corner|underline|side-bar>","title":"slide title","image_query":"english keywords","focus":"1 sentence describing what this slide explores in depth"},
    {"type":"quote","focus":"who and on which sub-topic"},
    {"type":"stats","title":"...","focus":"what kind of stats"},
    {"type":"closing","title":"Thank You","subtitle":"...","cta":"..."}
  ]
}

Template contract:
- The renderer owns the template background, 3D scene, color atmosphere, and font family. Do NOT try to change those.
- You are free to vary slide structure, hierarchy, density, and composition using layout/variant/accent fields.
- Treat the template as an art direction, not a rigid screenshot: preserve its background/fonts while making each slide design feel custom to the topic.

Available layouts (100 — pick the BEST fit per slide, mix freely):
TEXT+IMAGE: "split-right" "split-left" "image-full" "image-top" "image-bottom" "image-side-card" "focus-image" "magazine-cover" "diagonal-split" "polaroid" "hero-image-right" "hero-image-left" "image-card-overlay" "image-quote-overlay" "split-image-stack" "split-image-bleed" "image-with-stats" "image-with-caption" "image-strip-top" "image-strip-bottom"
TEXT-ONLY: "centered" "centered-narrow" "left-aligned-hero" "right-aligned-hero" "definition" "manifesto" "poster-typo" "pull-quote" "callout" "oversized-title" "title-with-rule" "centered-eyebrow" "asymmetric-title" "split-title-body" "framed-title" "stacked-statement" "drop-cap-paragraph" "dialogue-block" "indented-statement"
GRID/COLUMNS: "two-col" "three-col" "four-col" "bento" "masonry-cards" "pillars" "icon-grid" "ribbon-cards" "asymmetric-bento" "vertical-cards" "horizontal-strips" "two-col-divided" "three-col-numbered" "feature-grid-2x2" "feature-grid-3x2" "card-list" "kanban-cols" "tiled-grid"
COMPARE/CONTRAST: "comparison" "before-after" "vs-split" "table-compare" "pros-cons" "side-by-side-cards" "old-vs-new" "matrix-2x2" "competitor-table"
DATA/IMPACT: "big-number" "stat-cluster" "stat-circles" "kpi-strip" "stat-hero" "stat-row" "stat-pair" "stat-grid-4" "metric-card" "trend-callout" "percentage-bar" "ranking-list"
NARRATIVE: "process" "timeline" "timeline-horizontal" "numbered-list" "step-vertical" "story-rows" "milestone-row" "roadmap" "phases" "swim-lanes" "decision-tree" "flow-arrows" "story-chapters"
MEDIA: "gallery" "image-grid-2" "image-grid-4" "carousel-strip" "image-mosaic-3" "image-mosaic-5" "image-quote-pair" "image-stats-pair" "image-grid-6"

Visual variants (apply via "variant" — changes card surface, borders, shadows):
- "default": clean, no boxes
- "glass": frosted glass cards with blur
- "outline": thin outlined cards, no fill
- "filled": solid muted-color cards
- "gradient": cards with subtle accent gradient
- "neon": glowing accent borders
- "paper": warm paper card with subtle shadow
- "mono": monochrome inverted block

Accent placement (apply via "accent"):
- "none": no decoration
- "top": thin accent bar above title
- "left": vertical accent bar on the left of content
- "corner": accent shape in a corner
- "underline": underline beneath the title
- "side-bar": full-height accent bar on one side of section

Rules:
- ${lengthRule}
- First slide MUST be "cover", last MUST be "closing".
${sectionRule}
 - VARY aggressively (STRICT, AUTO-ENFORCED — violations are overwritten post-generation):
   * NEVER reuse the same layout id within ANY rolling window of 4 consecutive content slides.
   * NEVER use two layouts from the same composition family back-to-back. Families: split-image, image-hero, image-stack, image-card, editorial, centered-text, hero-text, definition, statement, quote, columns, bento, cards, compare, table, hero-stat, stat-grid, stat-strip, process, timeline, gallery.
   * NEVER same variant twice in a row. NEVER same accent twice in a row.
   * Across a 10-slide deck, USE AT LEAST 8 DISTINCT layout ids AND AT LEAST 6 DISTINCT families AND AT LEAST 5 DISTINCT variants.
 - SLIDE-TYPE MIX (CRITICAL — prevents the deck from feeling monotonous): For every 8 content slides you MUST include AT LEAST: 1 "quote", 1 "stats" (or content slide with layout="big-number"), 1 slide with layout="comparison" OR "before-after" OR "vs-split", 1 with layout="timeline" OR "process", 1 with layout="callout" OR "manifesto" OR "pull-quote" (text-only hero), 1 with layout="gallery" OR "image-grid-2" OR "image-grid-4", AND at most 3 bullets/grid-card slides total. Bullet-grid layouts (bento, two-col, three-col, four-col, icon-grid, ribbon-cards, pillars) must NEVER exceed 40% of the deck — they all look visually similar.
 - CONTENT DIVERSITY (CRITICAL): Each slide MUST tackle a DISTINCT angle of the topic. Plan the deck as a JOURNEY: hook → definition → history/context → key players → how it works → numbers/stats → real case study → comparison/alternatives → risks/myths → regional or cultural lens → future outlook → actionable takeaways → closing. No two slides may repeat the same idea or rephrase the same point. Titles must NOT share the same noun phrase.
- For "comparison","before-after","vs-split","table-compare" include "left_title","right_title","left_bullets":[…],"right_bullets":[…].
- For "process","step-vertical","numbered-list" include "steps":[{"title":"…","desc":"…"}] (3-6 items).
- For "timeline","timeline-horizontal","story-rows" include "events":[{"date":"…","title":"…","desc":"…"}] (3-7 items).
- For "gallery","image-grid-2","image-grid-4","carousel-strip","masonry-cards" include "image_queries":["…","…","…"] (2-4 english queries).
- For "big-number","stat-cluster" include "big_value" and "big_label".
- For "stat-circles","kpi-strip" include "stats":[{label,value}] (3-6 items).
- For "callout","manifesto","pull-quote","poster-typo","definition" include only "title" + short "subtitle"; no image needed.
- For "four-col","icon-grid","ribbon-cards","pillars","bento" include "bullets" with 4-6 items used as card text.
- "image_query" MUST be 3-5 visual ENGLISH keywords. NO arabic/other scripts, NO punctuation.
- PROMISE-KEEPING: If a slide title implies a list ("best works", "أفضل أعماله", "top X", "أبرز", "أمثلة", "famous Y"), the slide MUST carry "bullets" (4-8 concrete named items) OR "steps" with the actual list. Never title a slide as a list and leave items empty.
- IMAGES: NEVER use generic "image_query" like "abstract", "background", "concept". Use 3-6 SPECIFIC English keywords tied to the slide's named subject (person, place, brand, product, event) so a real photo can be found.
- LANGUAGE & DIALECT (HIGHEST PRIORITY — STRICT, NON-NEGOTIABLE): The "Language hint" provided in the user message is AUTHORITATIVE. You MUST write ALL textual fields (title, subtitle, body, bullets, steps, events, quotes, kickers, big_label, stats labels) in EXACTLY that language and in the SAME dialect/register the user wrote their topic in. NEVER switch languages. If hint = "en" → output English only (no Arabic, no other scripts). If hint = "ar" → mirror the user's Arabic dialect exactly (Egyptian/مصري, Khaleeji/خليجي, Levantine/شامي, Maghrebi/دارجة, Iraqi, MSA — never default to MSA if user wrote in dialect). Same rule for every other language. The proper-noun subject of the deck (e.g. "ronaldo", "Tokyo") does NOT override the language hint. Only "image_query" stays English.`;
  const brandLine = brandKit ? `\nBrand kit: ${JSON.stringify(brandKit)} — keep tone aligned (logo, primary ${brandKit.primaryColor || ""}, accent ${brandKit.accentColor || ""}, font ${brandKit.fontFamily || ""}).` : "";
  const user = `Language hint: ${language}\nTopic: ${topic}${brandLine}\n${content ? `Reference / user-provided material:\n${content.slice(0, 8000)}` : ""}`;
  const raw = await aiJson<unknown>([
    { role: "system", content: sys }, { role: "user", content: user },
  ], ROUTER_MODELS.slidesOutline);
  const out = safeParseOutline(raw);
  if (!out) {
    console.warn("[outline] schema validation failed", raw && typeof raw === "object" ? Object.keys(raw as object).slice(0, 5) : raw);
    // Skeleton fallback so the user never sees a 2-slide stub when AI fails.
    const target = requestedCount && requestedCount > 0 ? requestedCount : 8;
    const skeleton: RawSlide[] = [{ type: "cover", title: topic, image_query: "abstract" }];
    for (let i = 1; i < target - 1; i++) {
      skeleton.push({ type: "content", title: `${topic} — ${i}`, image_query: "abstract concept" });
    }
    skeleton.push({ type: "closing", title: "Thank You" });
    return { title: topic, language, slides: skeleton };
  }
  // Hard cap at 50 to prevent runaway costs
  const slides = out.slides.slice(0, 50) as RawSlide[];
  return { title: out.title, subtitle: out.subtitle, language: out.language || language, slides };
}

async function expandDeep(outline: { language?: string; slides: RawSlide[] }, topic: string, content: string, brandKit?: BrandKit): Promise<RawSlide[]> {
  const language = outline.language || "auto";
  const sys = `You are a senior research writer expanding a MAGAZINE-GRADE PRESENTATION outline.
Output ONLY a JSON object. Preserve EVERY field from the input outline (especially "type", "layout", "image_query", "steps", "events", "left_bullets", "right_bullets", "image_queries", "big_value", "big_label", "left_title", "right_title"). Expand textual fields with dense, specific content.

Per slide return (in addition to all outline fields, kept intact):
- "title": short, punchy, max 8 words.
- "kicker": 1-3 word UPPERCASE label (e.g. "01 · OVERVIEW").
- "subtitle": one strong sentence (10-20 words).
- "body": for content/section — 140-180 words of dense, specific, NON-OBVIOUS facts. Cite people, products, places, dates, numbers, mechanisms, examples. SKIP body for layout="big-number","callout","gallery","process","timeline","comparison".
- "bullets": for content with layout in [split-right,split-left,image-top,centered,two-col] — 6-8 bullets, each 12-22 words, EACH bullet a different angle (mechanism, example, number, contrast, risk, history, future). Skip for other layouts.
- For layout="two-col" also fill "left_bullets" + "right_bullets" (5-7 each) if not already present.
- For layout="comparison" fill "left_title","right_title","left_bullets","right_bullets" (5-7 each, each 10-18 words).
- For layout="process" fill "steps":[{title,desc}] with 4-6 entries, desc 20-35 words.
- For layout="timeline" fill "events":[{date,title,desc}] with 4-7 entries, desc 20-35 words.
- For layout="big-number" fill "big_value" (short like "87%","$2.4B","12×") and "big_label" (3-8 words), plus "body" 90-140 words explaining WHY the number matters.
- For layout="callout" provide ONLY "title" (8-15 words, manifesto-style) + short "subtitle".
- For layout="gallery" fill "image_queries":["…","…","…"] (3-4 english queries) + short "subtitle" caption.
- "stats": for stats slides — 4-6 {label,value} pairs, each a DIFFERENT metric.
- "quote": for quote slides — 18-35 word memorable quote. "attribution": plausible person+role.

Hard rules:
- LANGUAGE & DIALECT (HIGHEST PRIORITY — STRICT, NON-NEGOTIABLE): Output language hint = ${language}. This hint is AUTHORITATIVE — you MUST write ALL textual fields in EXACTLY that language and dialect. NEVER switch languages. If hint = "en" → English only (no Arabic, no other scripts whatsoever). If hint = "ar" → mirror the user's Arabic dialect exactly (Egyptian/مصري, Khaleeji/خليجي, Levantine/شامي, Maghrebi/دارجة, Iraqi, Sudanese, Yemeni, MSA/فصحى) — never default to MSA if user wrote in dialect. Same for every other world language. A proper-noun subject (person/place/brand) does NOT override the language hint.
- Preserve the selected template's visual DNA: do not request different backgrounds, fonts, or color palettes; use layout/variant/accent only to vary composition and slide design.
- ABSOLUTELY NO emojis, no pictographic icons, no decorative symbols (no 🎯 ✨ 📊 💡 🚀 ◈ ⬡ ◉ ★ → ✓ etc.) in ANY textual field. Pure text only. Numbers and standard punctuation only.
- Use the reference material as ground truth; expand with widely-known facts when sparse.
- NEVER produce empty required fields. NEVER write filler ("important", "very useful", "many benefits"). NEVER repeat ideas across slides.
- Each slide MUST cover a DISTINCT sub-topic / angle. Before writing, mentally list the angles already used and pick a new one (definition, history, mechanism, players, numbers, case study, risks, comparison, future, action steps, myths, regional context, economics, ethics, tooling).
- Bullets and body must NOT duplicate each other — bullets = scannable specifics, body = narrative depth.
- Minimum density: a content slide must contain at LEAST 180 words total across its fields.
- PROMISE-KEEPING (CRITICAL): If a slide title, subtitle, or body mentions a list ("best works", "أفضل أعماله", "top examples", "أبرز كذا", "أهم كذا", "أمثلة", "قائمة", "famous songs", "key projects", "main achievements", numbered/counted things), you MUST actually deliver that list inside the SAME slide as concrete named items in "bullets" or "steps" (real titles, dates, places, numbers — never vague phrases like "many works" or "various examples"). Never promise a list and leave it out.
- IMAGES: Every content/section/cover/stats/process slide MUST have a meaningful "image_query" (3-6 specific English visual keywords tied to the slide's named subject). Never leave it generic like "abstract" — use the actual person/place/thing being discussed so the image agent finds a real photo.
Return JSON: { "slides": [...] } in SAME ORDER as outline.`;
  const brandLine = brandKit ? `\nBrand kit: ${JSON.stringify(brandKit)} — keep tone, vocabulary, and named references aligned to this brand identity.` : "";
  const user = `Topic: ${topic}${brandLine}\nOutline:\n${JSON.stringify({ slides: outline.slides }, null, 2)}\n${content ? `Reference material:\n${content.slice(0, 10000)}` : ""}`;
  const raw = await aiJson<unknown>([
    { role: "system", content: sys }, { role: "user", content: user },
  ], ROUTER_MODELS.slidesExpand);
  const out = safeParseExpand(raw);
  if (out && out.slides.length > 0) {
    return outline.slides.map((o, i) => {
      const deep = (out.slides[i] || {}) as RawSlide;
      // Don't let empty strings from the AI overwrite outline titles/content.
      const clean = Object.fromEntries(
        Object.entries(deep).filter(([, v]) => v !== "" && v !== null && v !== undefined)
      );
      return { ...o, ...clean, image_query: (deep.image_query as string) || (o.image_query as string) };
    });
  }
  console.warn("[expand] schema validation failed, keeping outline");
  return outline.slides;
}

/* ────────────────────────────────────────────────────────── */
/* Detect Arabic / language for narrative voice               */
/* ────────────────────────────────────────────────────────── */

/** Detect language hint from user text. Returns a short label used to steer the AI.
 *  Falls back to "auto" so the AI mirrors whatever language the topic itself uses. */
function detectLanguage(s: string): string {
  const t = s || "";
  if (/[\u0600-\u06FF]/.test(t)) return "ar";
  if (/[\u4E00-\u9FFF]/.test(t)) return "zh";
  if (/[\u3040-\u30FF]/.test(t)) return "ja";
  if (/[\uAC00-\uD7AF]/.test(t)) return "ko";
  if (/[\u0400-\u04FF]/.test(t)) return "ru";
  if (/[\u0900-\u097F]/.test(t)) return "hi";
  if (/[\u0590-\u05FF]/.test(t)) return "he";
  if (/[\u0E00-\u0E7F]/.test(t)) return "th";
  if (/[ñáéíóúü¿¡]/i.test(t)) return "es";
  if (/[àâçéèêëîïôûùüÿœæ]/i.test(t)) return "fr";
  if (/[äöüß]/i.test(t)) return "de";
  if (/[ãõáàâéêíóôõú]/i.test(t)) return "pt";
  if (/[ığşçöü]/i.test(t)) return "tr";
  return "en";
}

/* Parse explicit slide count requests from the user's prompt.
   Examples (AR): "اعمل 30 شريحة", "٢٥ شريحه", "خليها 40 سلايد"
   Examples (EN): "make 25 slides", "30-slide deck", "I want 20 slides" */
function parseRequestedCount(s: string): number | undefined {
  if (!s) return undefined;
  // Normalize Arabic-Indic digits to ASCII, and strip hamza variants so
  // "شرائح" / "شرايح" / "شريحة" / "شرحة" all match the same pattern.
  const normalized = s
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    .replace(/[\u0623\u0625\u0622]/g, "\u0627")  // ا variants
    .replace(/[\u0626\u0624]/g, "")               // ئ ؤ → drop
    .replace(/[\u064B-\u0652]/g, "");             // diacritics
  // Matches: 5 slides, 5-slide, 5 شريحة, ٥ شرائح, 25 سلايد, 30 سلايدز
  const re = /(\d{1,3})\s*[-\s]?\s*(slides?|سلايد(?:ز|ات)?|شر[اي]{0,2}ح(?:ة|ه|ات)?)/i;
  const m = normalized.match(re);
  if (!m) return undefined;
  const n = parseInt(m[1], 10);
  if (!Number.isFinite(n) || n < 3) return undefined;
  return Math.min(50, Math.max(3, n));
}

function baseLayoutId(layout?: unknown): string {
  return String(layout || "").toLowerCase().split("--")[0];
}

function words(value: unknown): number {
  return typeof value === "string" ? value.trim().split(/\s+/).filter(Boolean).length : 0;
}

function detailedStrings(value: unknown, minWords = 7): string[] {
  return Array.isArray(value)
    ? value.filter((x): x is string => typeof x === "string" && words(x) >= minWords)
    : [];
}

function detailedObjects(value: unknown, minDescWords = 8): unknown[] {
  return Array.isArray(value)
    ? value.filter((x) => {
      if (!x || typeof x !== "object") return false;
      const item = x as Record<string, unknown>;
      return words(item.title) >= 1 && (words(item.desc) >= minDescWords || words(item.label) >= 1 || words(item.value) >= 1);
    })
    : [];
}

function mergeTextItems(existing: unknown, fallback: string[], min = 4): string[] {
  const current = Array.isArray(existing)
    ? existing.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : [];
  const seen = new Set<string>();
  const merged = [...current, ...fallback]
    .map((x) => x.trim())
    .filter((x) => {
      const key = x.toLowerCase().replace(/\s+/g, " ");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return merged.slice(0, Math.max(min, 6));
}

function hasRichSlideContent(s: Record<string, unknown>): boolean {
  const type = String(s.type || "");
  if (type === "cover" || type === "closing") return true;
  const layout = baseLayoutId(s.layout);
  const bodyWords = words(s.body);
  const subtitleWords = words(s.subtitle);
  const bulletCount = detailedStrings(s.bullets).length;
  const leftCount = detailedStrings(s.left_bullets).length;
  const rightCount = detailedStrings(s.right_bullets).length;
  const stepCount = detailedObjects(s.steps).length;
  const eventCount = detailedObjects(s.events).length;
  const statCount = Array.isArray(s.stats) ? s.stats.length : 0;

  if (type === "quote" || s.quote) return words(s.quote) >= 10 || subtitleWords >= 14;
  if (type === "section") return bodyWords >= 45 || (subtitleWords >= 14 && bulletCount >= 3);
  if (["stat-cluster", "stat-circles", "kpi-strip", "big-number"].includes(layout) || type === "stats") {
    return statCount >= 3 || (!!s.big_value && words(s.big_label) >= 2 && bodyWords >= 25);
  }
  if (["process", "step-vertical", "numbered-list"].includes(layout)) return stepCount >= 4;
  if (["timeline", "timeline-horizontal", "story-rows"].includes(layout)) return eventCount >= 4;
  if (["comparison", "vs-split", "before-after", "table-compare"].includes(layout)) return leftCount >= 4 && rightCount >= 4;
  return bodyWords >= 55 || bulletCount >= 4 || (bodyWords >= 35 && bulletCount >= 2);
}

function fallbackContent(title: string, subject: string, idx: number, ar: boolean) {
  const arAngles = ["الخلفية", "التحول", "الأمثلة", "الأثر", "المقارنة", "المستقبل"];
  const enAngles = ["Context", "Shift", "Examples", "Impact", "Contrast", "Future"];
  const angle = (ar ? arAngles : enAngles)[idx % 6];
  const subtitle = ar
    ? `${angle} هنا يوضح ${title} كجزء مستقل من قصة ${subject}، مع تفاصيل عملية لا تكرر باقي الشرائح.`
    : `${angle} explains ${title} as a distinct part of ${subject}, with practical detail instead of repeating nearby slides.`;
  const bullets = ar ? [
    `${angle}: يضع ${title} داخل سياقه الصحيح حتى يفهم المتلقي سبب ظهوره في العرض.`,
    `تفصيل ملموس: يربط الفكرة باسم أو مثال أو نتيجة يمكن تحويلها إلى نقاش واضح.`,
    `زاوية مختلفة: يوضح ما الذي يميز هذا المحور عن بقية محاور ${subject}.`,
    `الأثر المباشر: يشرح كيف يغير هذا الجانب فهم الجمهور للموضوع أو قراره بعد العرض.`,
    `نقطة تذكّر: يحول العنوان من عبارة عامة إلى رسالة قابلة للشرح والمقارنة.`,
  ] : [
    `${angle}: places ${title} in the right context so the audience understands why it belongs here.`,
    `Concrete detail: links the idea to a name, example, result, or observable signal.`,
    `Different angle: shows what separates this point from the rest of ${subject}.`,
    `Direct impact: explains how this detail changes the audience's understanding or decision.`,
    `Memorable takeaway: turns the headline into a point that can be explained and compared.`,
  ];
  const body = ar
    ? `تركز هذه الشريحة على ${title} من زاوية ${angle} داخل موضوع ${subject}. بدل الاكتفاء بعنوان قصير، تعرض الفكرة كسلسلة واضحة: ما الخلفية التي صنعتها، ما المثال أو التفصيل الذي يثبتها، وما النتيجة التي تجعلها مهمة للجمهور. هذا يمنح الشريحة دوراً مستقلاً داخل السرد، ويجعلها مختلفة عن الشرائح السابقة واللاحقة، خصوصاً عندما يحتاج العرض إلى محتوى متماسك وغني لا يعتمد على عبارات عامة أو تكرار نفس المعنى.`
    : `This slide focuses on ${title} through the lens of ${angle} inside ${subject}. Instead of leaving the page as a short headline, it frames the idea as a clear chain: the background behind it, the example or detail that proves it, and the outcome that makes it matter to the audience. That gives the slide its own job in the narrative and keeps it distinct from surrounding slides, especially when the deck needs coherent, substantial content rather than generic repetition.`;
  return { subtitle, bullets, body };
}

function guaranteeMinimumSlideContent(slides: Array<Record<string, unknown>>, subject: string, lang: string): Array<Record<string, unknown>> {
  const ar = lang.startsWith("ar") || /[\u0600-\u06FF]/.test(subject);
  return slides.map((s, idx) => {
    if (hasRichSlideContent(s)) return s;
    const title = String(s.title || subject || (ar ? "المحور" : "Key point"));
    const layout = baseLayoutId(s.layout);
    const fallback = fallbackContent(title, subject, idx, ar);

    if (words(s.subtitle) < 10) s.subtitle = fallback.subtitle;

    if (["stat-cluster", "stat-circles", "kpi-strip", "big-number"].includes(layout) || s.type === "stats") {
      const stats = Array.isArray(s.stats) ? s.stats : [];
      if (stats.length < 3) {
        s.stats = ar
          ? [{ label: "محور", value: String(idx + 1).padStart(2, "0") }, { label: "نقاط داعمة", value: "5" }, { label: "رسالة واضحة", value: "100%" }]
          : [{ label: "Angle", value: String(idx + 1).padStart(2, "0") }, { label: "Support points", value: "5" }, { label: "Clear message", value: "100%" }];
      }
      if (words(s.body) < 25) s.body = fallback.body;
      return s;
    }

    if (["process", "step-vertical", "numbered-list"].includes(layout)) {
      const current = Array.isArray(s.steps) ? s.steps : [];
      if (current.length < 4) {
        const labels = ar ? ["الخلفية", "التفصيل", "الأثر", "الخلاصة"] : ["Context", "Detail", "Impact", "Takeaway"];
        s.steps = labels.map((stepTitle, i) => ({ title: stepTitle, desc: fallback.bullets[i] }));
      }
      return s;
    }

    if (["timeline", "timeline-horizontal", "story-rows"].includes(layout)) {
      const current = Array.isArray(s.events) ? s.events : [];
      if (current.length < 4) {
        const labels = ar ? ["البداية", "النقطة الفاصلة", "الانتشار", "الأثر"] : ["Start", "Turning point", "Reach", "Impact"];
        s.events = labels.map((eventTitle, i) => ({ date: String(idx + i + 1).padStart(2, "0"), title: eventTitle, desc: fallback.bullets[i] }));
      }
      return s;
    }

    if (["comparison", "vs-split", "before-after", "table-compare"].includes(layout)) {
      s.left_title ||= ar ? "الجانب الأول" : "First side";
      s.right_title ||= ar ? "الجانب الثاني" : "Second side";
      if (detailedStrings(s.left_bullets).length < 4) s.left_bullets = mergeTextItems(s.left_bullets, fallback.bullets.slice(0, 4), 4);
      if (detailedStrings(s.right_bullets).length < 4) s.right_bullets = mergeTextItems(s.right_bullets, fallback.bullets.slice(1), 4);
      return s;
    }

    if (words(s.body) < 55) s.body = fallback.body;
    if (detailedStrings(s.bullets).length < 4) s.bullets = mergeTextItems(s.bullets, fallback.bullets, 4);
    if (words(s.subtitle) < 10) s.subtitle = fallback.subtitle;
    return s;
  });
}

/**
 * Composition families — must mirror src/lib/slides/layouts.ts.
 * Used by the variety enforcer to prevent two visually-similar layouts from
 * appearing within a short window even when their layout ids differ.
 */
const LAYOUT_FAMILY: Record<string, string> = {
  "split-right": "split-image", "split-left": "split-image", "diagonal-split": "split-image",
  "hero-image-right": "split-image", "hero-image-left": "split-image",
  "split-image-stack": "split-image", "split-image-bleed": "split-image",
  "image-full": "image-hero", "focus-image": "image-hero",
  "image-card-overlay": "image-hero", "image-quote-overlay": "image-hero",
  "image-top": "image-stack", "image-bottom": "image-stack",
  "image-strip-top": "image-stack", "image-strip-bottom": "image-stack",
  "image-side-card": "image-card", "polaroid": "image-card",
  "image-with-stats": "image-card", "image-with-caption": "image-card",
  "magazine-cover": "editorial",
  "centered": "centered-text", "centered-narrow": "centered-text",
  "centered-eyebrow": "centered-text", "drop-cap-paragraph": "centered-text",
  "left-aligned-hero": "hero-text", "right-aligned-hero": "hero-text",
  "title-with-rule": "hero-text", "asymmetric-title": "hero-text",
  "split-title-body": "hero-text", "indented-statement": "hero-text",
  "definition": "definition",
  "manifesto": "statement", "poster-typo": "statement", "callout": "statement",
  "oversized-title": "statement", "framed-title": "statement", "stacked-statement": "statement",
  "pull-quote": "quote", "dialogue-block": "quote",
  "two-col": "columns", "three-col": "columns", "four-col": "columns",
  "two-col-divided": "columns", "three-col-numbered": "columns", "kanban-cols": "columns",
  "bento": "bento", "masonry-cards": "bento",
  "asymmetric-bento": "bento", "feature-grid-2x2": "bento", "feature-grid-3x2": "bento",
  "pillars": "cards", "icon-grid": "cards", "ribbon-cards": "cards",
  "vertical-cards": "cards", "horizontal-strips": "cards",
  "card-list": "cards", "tiled-grid": "cards",
  "comparison": "compare", "before-after": "compare", "vs-split": "compare",
  "pros-cons": "compare", "side-by-side-cards": "compare", "old-vs-new": "compare",
  "table-compare": "table", "matrix-2x2": "table", "competitor-table": "table",
  "big-number": "hero-stat", "stat-hero": "hero-stat", "trend-callout": "hero-stat",
  "stat-cluster": "stat-grid", "stat-circles": "stat-grid",
  "stat-pair": "stat-grid", "stat-grid-4": "stat-grid",
  "metric-card": "stat-grid", "ranking-list": "stat-grid",
  "kpi-strip": "stat-strip", "stat-row": "stat-strip", "percentage-bar": "stat-strip",
  "process": "process", "step-vertical": "process", "numbered-list": "process",
  "phases": "process", "decision-tree": "process", "flow-arrows": "process",
  "timeline": "timeline", "timeline-horizontal": "timeline", "story-rows": "timeline",
  "milestone-row": "timeline", "roadmap": "timeline",
  "swim-lanes": "timeline", "story-chapters": "timeline",
  "gallery": "gallery", "image-grid-2": "gallery", "image-grid-4": "gallery",
  "carousel-strip": "gallery", "image-mosaic-3": "gallery", "image-mosaic-5": "gallery",
  "image-quote-pair": "gallery", "image-stats-pair": "gallery", "image-grid-6": "gallery",
};

function layoutFamily(layout: string): string {
  return LAYOUT_FAMILY[layout] ?? layout ?? "unknown";
}

/**
 * Variety cycles per template — each cycle covers a wide cross-section of
 * families so consecutive picks naturally vary in composition. The enforcer
 * uses the cycle only as a fallback when the AI-picked layout would repeat.
 */
const VARIETY_CYCLES: Record<string, string[]> = {
  "digital-oasis":   ["split-right","bento","stat-hero","timeline-horizontal","pull-quote","two-col","feature-grid-2x2","step-vertical","comparison","centered","image-mosaic-3","big-number","story-chapters","pillars","oversized-title"],
  "ocean-flow":      ["focus-image","kpi-strip","split-image-bleed","manifesto","pros-cons","story-rows","stat-grid-4","gallery","centered-eyebrow","ranking-list","image-quote-overlay","numbered-list","matrix-2x2","horizontal-strips","framed-title"],
  "seasonal-scroll": ["magazine-cover","drop-cap-paragraph","image-grid-4","timeline","stat-pair","split-left","callout","feature-grid-3x2","vs-split","gallery","centered-narrow","phases","trend-callout","tiled-grid","title-with-rule"],
  "vanta-atelier":   ["editorial","split-image-stack","big-number","dialogue-block","matrix-2x2","timeline","ranking-list","image-with-stats","stacked-statement","competitor-table","story-rows","pull-quote","gallery","two-col-divided","stat-circles"],
  "default":         ["split-right","bento","big-number","timeline-horizontal","pull-quote","two-col","comparison","step-vertical","pillars","centered","image-grid-2","stat-cluster","story-rows","feature-grid-2x2","manifesto","matrix-2x2","gallery","oversized-title","kanban-cols","phases"],
};

const VARIANT_CYCLE = ["default", "glass", "outline", "filled", "gradient", "neon", "paper", "mono"];
const ACCENT_CYCLE  = ["none", "top", "left", "corner", "underline", "side-bar"];

/**
 * Enforce visual variety across ALL templates:
 *  1. No layout id may repeat inside a 4-slide rolling window.
 *  2. No composition FAMILY may repeat inside a 2-slide rolling window.
 *  3. variant and accent rotate so consecutive slides never share both.
 * When a repeat is detected, the next candidate is pulled from the template's
 * variety cycle, skipping anything already in either window.
 */
function enforceLayoutVariety(slides: Array<Record<string, unknown>>, tplId: string): Array<Record<string, unknown>> {
  const cycle = VARIETY_CYCLES[tplId] ?? VARIETY_CYCLES.default;
  const layoutWindow: string[] = [];
  const familyWindow: string[] = [];
  let lastVariant = "";
  let lastAccent = "";

  const pickFromCycle = (idx: number): string => {
    for (let off = 0; off < cycle.length; off++) {
      const cand = cycle[(idx + off) % cycle.length];
      if (layoutWindow.includes(cand)) continue;
      if (familyWindow.includes(layoutFamily(cand))) continue;
      return cand;
    }
    return cycle[idx % cycle.length];
  };

  return slides.map((s, idx) => {
    const type = String(s.type || "content").toLowerCase();
    if (type === "cover" || type === "closing" || type === "quote") return s;

    const current = baseLayoutId(s.layout);
    const currentFamily = current ? layoutFamily(current) : "";

    const repeatsLayout = current && layoutWindow.includes(current);
    const repeatsFamily = currentFamily && familyWindow.includes(currentFamily);

    const picked = (!current || repeatsLayout || repeatsFamily) ? pickFromCycle(idx) : current;
    s.layout = picked;

    layoutWindow.push(picked);
    if (layoutWindow.length > 4) layoutWindow.shift();
    familyWindow.push(layoutFamily(picked));
    if (familyWindow.length > 2) familyWindow.shift();

    // variant + accent rotation: pick the next one in the cycle that isn't
    // identical to the previous slide's pair.
    let variant = String(s.variant || "");
    if (!variant || variant === lastVariant) variant = VARIANT_CYCLE[idx % VARIANT_CYCLE.length];
    if (variant === lastVariant) variant = VARIANT_CYCLE[(idx + 1) % VARIANT_CYCLE.length];
    s.variant = variant;
    lastVariant = variant;

    let accent = String(s.accent || "");
    if (!accent || accent === lastAccent) accent = ACCENT_CYCLE[idx % ACCENT_CYCLE.length];
    if (accent === lastAccent) accent = ACCENT_CYCLE[(idx + 1) % ACCENT_CYCLE.length];
    s.accent = accent;
    lastAccent = accent;

    return s;
  });
}

/** Back-compat alias — old call sites kept working. */
const enforceDigitalOasisVariety = enforceLayoutVariety;

/* ────────────────────────────────────────────────────────── */
/* Server                                                     */
/* ────────────────────────────────────────────────────────── */

type SlidesEmit = (event: Record<string, unknown>) => void | Promise<void>;

class SlidesDeadlineError extends Error {
  constructor() { super("Slides generation exceeded the safe time limit"); }
}

async function withBudgetTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return await Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]).catch(() => null);
}

function ensureDeckHasImmediateImages(deck: { slides?: unknown }, subject: string): void {
  const slides = Array.isArray((deck as { slides?: unknown[] }).slides) ? (deck as { slides: Array<Record<string, unknown>> }).slides : [];
  slides.forEach((slide, index) => {
    if (!slide || typeof slide !== "object") return;
    const s = slide as Record<string, unknown>;
    if (!s.image && !Array.isArray(s.images)) {
      const title = String(s.title || subject || "Slide").slice(0, 90);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#050505"/><stop offset="0.55" stop-color="#111820"/><stop offset="1" stop-color="#e6f578"/></linearGradient></defs><rect width="1600" height="1000" fill="url(#g)"/><circle cx="1240" cy="250" r="180" fill="#e6f578" opacity=".22"/><circle cx="220" cy="780" r="240" fill="#ffffff" opacity=".08"/><text x="120" y="840" fill="#e8ece4" font-size="64" font-family="Arial, sans-serif" opacity=".82">${title.replace(/[<&>]/g, "")}</text></svg>`;
      s.image = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }
  });
}

async function runSlidesPipeline(opts: {
  topic: string;
  tplId: string;
  requestedTemplateId: string;
  palette: unknown;
  isLongInput: boolean;
  subject: string;
  referenceMaterial: string;
  lang: string;
  requestedCount?: number;
  audience?: string;
  durationMin?: number;
  brandKit?: BrandKit;
  userId?: string;
  emit: SlidesEmit;
}): Promise<{ deck: Record<string, unknown> }> {
  const { topic, tplId, requestedTemplateId, palette, isLongInput, subject, referenceMaterial, lang, requestedCount, audience, durationMin, brandKit, userId, emit } = opts;
  const deadlineAt = Date.now() + SLIDES_JOB_BUDGET_MS;
  const timeRemaining = () => deadlineAt - Date.now();
  const ensureBudget = () => {
    if (Date.now() > deadlineAt) throw new SlidesDeadlineError();
  };
  const send = (event: Record<string, unknown>) => { void emit(event); };
  const sendNarrate = (delta: string) => send({ type: "narrate", delta });

  // Language-agnostic narration helper — always mirrors the user's language.
  const narrate = async (instruction: string, payload = "") => {
    const sys = `You are a friendly assistant building a presentation. STRICT RULE: write ONLY in the user's language (language hint = "${lang}"). Never switch languages. If hint = "en" write English only; if hint = "ar" mirror the user's Arabic dialect exactly; same for every other language. No markdown, no bullets, no emojis. Keep it natural and human.

Instruction: ${instruction}`;
    ensureBudget();
    await streamNarrative(sys, payload, sendNarrate, undefined, ROUTER_MODELS.slidesNarrate);
    sendNarrate("\n\n");
  };

  send({ type: "phase", name: "search" });
  await narrate(`Write ONE short conversational sentence saying you'll start researching the topic.`, `Topic: ${subject}`);

  const searchResults = isLongInput ? [] : await withBudgetTimeout(serperSearch(subject), Math.min(12_000, Math.max(1_000, timeRemaining() - 5_000))) || [];

  // Firecrawl scrape top 3 links for richer corpus (only when not using user material).
  send({ type: "phase", name: "findings" });
  ensureBudget();
  const scrapeCorpus = isLongInput ? "" : await withBudgetTimeout(firecrawlEnrich(searchResults.map(r => r.link), 3), Math.min(15_000, Math.max(1_000, timeRemaining() - 5_000))) || "";
  if (scrapeCorpus) console.log(`[slides] firecrawl enriched corpus +${scrapeCorpus.length} chars`);

  const findingsContext = isLongInput
    ? `The user provided their own material (${topic.length} chars). Say you'll use it as the foundation and analyze it carefully.`
    : searchResults.length
      ? `Search results:\n${searchResults.map((r, i) => `${i + 1}. ${r.title} — ${r.snippet}`).join("\n")}`
      : `No external results — rely on what you already know about "${subject}".`;
  await narrate(`Write 3-5 flowing sentences (no bullets, no markdown) sharing the most interesting facts you just discovered. Start with an enthusiastic word.`, findingsContext);

  send({ type: "phase", name: "outline" });
  await narrate(`Write ONE short sentence saying you'll dig deeper and start structuring the deck.`, `Subject: ${subject}`);

  const searchCorpus = searchResults.map(r => `${r.title}\n${r.snippet}`).join("\n\n");
  const corpus = referenceMaterial || [searchCorpus, scrapeCorpus].filter(Boolean).join("\n\n");
  ensureBudget();
  const outline = await buildOutline(subject, corpus, lang, isLongInput, requestedCount, brandKit);

  send({ type: "phase", name: "content" });
  await narrate(`Write ONE short enthusiastic sentence saying you'll start writing every slide in depth.`, `${outline.slides.length} slides about ${subject}`);

  ensureBudget();
  const rawDeep = await expandDeep(outline, subject, corpus, brandKit);

  // Deterministic post-processor: enforces layout intelligence (anti-repeat,
  // content-to-layout matching), word budgets, density caps, deck balance,
  // and auto-splits overflow risks into Part 1/2. Zero LLM calls — saves credits.
  let deepSlides = postProcessDeck(rawDeep as Record<string, unknown>[], subject) as typeof rawDeep;

  // (8) Citation grounding — attach source URLs to slides when we scraped from web.
  const sources = searchResults.slice(0, 5).map(r => ({ title: r.title, url: r.link }));
  if (sources.length) {
    (deepSlides as Array<Record<string, unknown>>).forEach((s, i) => {
      if (s.type === "cover" || s.type === "closing" || s.type === "quote") return;
      // Round-robin assign sources as a footer hint the renderer can show
      const src = sources[i % sources.length];
      if (src && !s.source_url) s.source_url = src.url;
    });
  }

  // Hard-enforce explicit slide count requested by user (post-processor may
  // auto-split overflowing slides which inflates the count beyond what the
  // user asked for). Keep cover first + closing last.
  if (requestedCount && requestedCount >= 3 && deepSlides.length !== requestedCount) {
    const cover = deepSlides.find(s => s.type === "cover") || deepSlides[0];
    const closing = [...deepSlides].reverse().find(s => s.type === "closing") || deepSlides[deepSlides.length - 1];
    const middle = deepSlides.filter(s => s !== cover && s !== closing);
    const needMiddle = requestedCount - 2;
    let nextMiddle: typeof middle;
    if (middle.length >= needMiddle) {
      nextMiddle = middle.slice(0, needMiddle);
    } else {
      nextMiddle = [...middle];
      const fallback = middle[middle.length - 1] || { type: "content", title: subject } as typeof middle[number];
      while (nextMiddle.length < needMiddle) {
        nextMiddle.push({ ...fallback, title: `${(fallback as { title?: string }).title || subject} — ${nextMiddle.length + 1}` } as typeof fallback);
      }
    }
    deepSlides = [cover, ...nextMiddle, closing] as typeof deepSlides;
    console.log(`[slides] enforced exact count=${requestedCount} (was ${rawDeep.length})`);
  }

  send({ type: "phase", name: "images" });
  await narrate(`Write ONE short sentence saying you're hand-picking visuals for each slide now.`);

  if (ENABLE_BLOCKING_SMART_IMAGES && timeRemaining() > 25_000) {
    const slidesNeedingImage = deepSlides.filter(s => {
      const layout = (s.layout as string) || "";
      const textOnly = ["callout","manifesto","pull-quote","poster-typo","definition","quote"].includes(layout) || s.type === "quote";
      return !textOnly;
    });
    const usedUrls = new Set<string>();
    await Promise.all(slidesNeedingImage.map(async (s) => {
      try {
        if (!s.image) {
          const url = await withBudgetTimeout(smartImage(s as Parameters<typeof smartImage>[0], subject, usedUrls), 8_000);
          if (url) (s as { image?: string }).image = url;
        } else {
          usedUrls.add(s.image as string);
        }
      } catch (e) { console.warn("[smartImage slide]", e); }
    }));
  }

  const emptyIndices = (deepSlides as Array<Record<string, unknown>>)
    .map((s, i) => (!hasRichSlideContent(s) ? i : -1))
    .filter((i) => i >= 0);

  if (emptyIndices.length > 0) {
    console.log(`[fill] ${emptyIndices.length} empty content slides — running fill pass`);
    try {
      ensureBudget();
      const fillTargets = emptyIndices.map((i) => {
        const s = deepSlides[i] as Record<string, unknown>;
        return {
          i,
          type: s.type,
          layout: s.layout,
          title: s.title,
          subtitle: s.subtitle,
          focus: (s as { focus?: string }).focus,
        };
      });
      const fillSys = `You are filling in BLANK presentation slides. Each input slide has only a title (and maybe subtitle/focus) — you must invent rich, specific content for it that fits the title and the deck's subject.

For EACH slide, produce concrete content:
- "subtitle": one sharp sentence (10-22 words) that adds NEW information, not a rewording of the title.
- "bullets": 4-6 bullets, each 10-22 words, each a DIFFERENT angle (a fact, a number, an example, a person/place, a contrast, a consequence). Use real named entities when possible.
- "body": 90-160 words of dense, specific prose — facts, examples, dates, names. NO filler ("important", "very useful", "many things"). Only include "body" if the layout is NOT one of: callout, manifesto, pull-quote, poster-typo, big-number, stat-cluster, stat-circles, kpi-strip, gallery, image-grid-2, image-grid-4, process, timeline, comparison.
- For layout in [stat-cluster, stat-circles, kpi-strip, big-number]: also include "stats":[{label,value}] with 3-5 entries OR "big_value"+"big_label".
- For layout in [process, step-vertical, numbered-list]: include "steps":[{title,desc}] 4-6 entries.
- For layout in [timeline, timeline-horizontal, story-rows]: include "events":[{date,title,desc}] 4-6 entries.
- For layout in [comparison, vs-split, before-after, table-compare]: include "left_title","right_title","left_bullets","right_bullets" (4-6 each).

HARD RULES:
- Language & dialect MUST match the slide titles EXACTLY (Egyptian Arabic stays Egyptian, MSA stays MSA, etc.). Detect from the titles.
- NO emojis. NO decorative symbols. Numbers and standard punctuation only.
- Every slide must cover a DIFFERENT angle of the deck subject — do not repeat ideas across slides.
- Be specific: cite real names, dates, places, songs, films, numbers — whatever fits the topic. Avoid generic phrasing.

Return JSON: { "fills": [{ "i": <index>, "subtitle"?, "bullets"?, "body"?, "stats"?, "big_value"?, "big_label"?, "steps"?, "events"?, "left_title"?, "right_title"?, "left_bullets"?, "right_bullets"? }] } — one entry per input slide, same "i" indices.`;
      const fillUser = `Deck subject: ${subject}\nDeck language hint: ${outline.language || lang}\nBlank slides to fill:\n${JSON.stringify(fillTargets, null, 1).slice(0, 14000)}${corpus ? `\n\nReference material:\n${corpus.slice(0, 6000)}` : ""}`;
      const fill = await withBudgetTimeout(aiJson<{ fills?: Array<Record<string, unknown> & { i?: number }> }>([
        { role: "system", content: fillSys }, { role: "user", content: fillUser },
      ], ROUTER_MODELS.slidesExpand), Math.min(18_000, Math.max(3_000, timeRemaining() - 5_000)));
      const fills = Array.isArray(fill?.fills) ? fill!.fills! : [];
      console.log(`[fill] applied ${fills.length} slide fills`);
      for (const f of fills) {
        const idx = Number(f.i);
        if (!Number.isFinite(idx) || idx < 0 || idx >= deepSlides.length) continue;
        const tgt = deepSlides[idx] as Record<string, unknown>;
        const keys = ["subtitle", "body", "bullets", "stats", "big_value", "big_label", "steps", "events", "left_title", "right_title", "left_bullets", "right_bullets"];
        for (const k of keys) {
          const v = (f as Record<string, unknown>)[k];
          if (v === undefined || v === null || v === "") continue;
          if (Array.isArray(v) && v.length === 0) continue;
          tgt[k] = v;
        }
      }
      // Re-run the post-processor over filled slides so newly-filled content
      // gets a layout that actually shows its bullets/body (the prior pass had
      // picked a text-only layout because the slide was empty).
      deepSlides = postProcessDeck(deepSlides as Record<string, unknown>[], subject) as typeof deepSlides;
    } catch (e) { console.warn("[fill] failed", e); }
  }

  // Final deterministic safety net: no non-edge slide is allowed to ship with
  // title-only content, even if an LLM response is sparse or malformed.
  deepSlides = postProcessDeck(
    guaranteeMinimumSlideContent(deepSlides as Array<Record<string, unknown>>, subject, outline.language || lang),
    subject,
  ) as typeof deepSlides;
  deepSlides = guaranteeMinimumSlideContent(deepSlides as Array<Record<string, unknown>>, subject, outline.language || lang) as typeof deepSlides;
  deepSlides = enforceDigitalOasisVariety(deepSlides as Array<Record<string, unknown>>, tplId) as typeof deepSlides;

  // Quality-first: always run the critic pass (no skip gate). The extra LLM
  // call costs a few seconds but catches repetition, off-topic slides, and
  // weak bullets that the structural checker misses.
  const shouldCritique = timeRemaining() > 45_000;
  if (shouldCritique) {
    send({ type: "phase", name: "review" });
    await narrate(`Write ONE short sentence saying you're reviewing the whole deck for quality and to avoid repetition.`);
  }

  if (shouldCritique) try {
    const reviewInput = deepSlides.map((s, i) => ({
      i,
      type: s.type,
      layout: (s as { layout?: string }).layout,
      title: s.title,
      subtitle: (s as { subtitle?: string }).subtitle,
      bullets: (s as { bullets?: string[] }).bullets?.slice(0, 4),
      has_image: !!(s as { image?: string }).image,
    }));
    const reviewSys = `You are a senior editor reviewing a presentation deck. Be RUTHLESS. Find every real problem:
- Two slides with similar titles or repetitive bullet points (merge or rewrite)
- Slides whose title/content is off-topic vs the deck subject
- Bullets that just rephrase the title or are generic filler
- Weak/vague subtitles that don't add information
- Bullets that should be sharper, more specific, or include a concrete number/fact

Return JSON: { "fixes": [{ "i": <slide index>, "title"?: "improved title", "bullets"?: ["improved bullets"], "subtitle"?: "improved subtitle" }] }
Include every slide that can be meaningfully improved. Empty fixes array is fine only if the deck is genuinely flawless. Keep the user's language and dialect exactly. Up to 20 fixes.`;
    const reviewUser = `Deck subject: ${subject}\nLanguage: ${lang}\nSlides:\n${JSON.stringify(reviewInput, null, 1).slice(0, 16000)}`;
    const review = await withBudgetTimeout(aiJson<{ fixes?: Array<{ i?: number; title?: string; bullets?: string[]; subtitle?: string }> }>([
      { role: "system", content: reviewSys }, { role: "user", content: reviewUser },
    ], ROUTER_MODELS.slidesCritic), Math.min(18_000, Math.max(3_000, timeRemaining() - 8_000)));
    const fixes = Array.isArray(review?.fixes) ? review!.fixes! : [];
    console.log(`[review pass 1] applying ${fixes.length} fixes`);
    for (const f of fixes) {
      const idx = Number(f.i);
      if (!Number.isFinite(idx) || idx < 0 || idx >= deepSlides.length) continue;
      const tgt = deepSlides[idx] as Record<string, unknown>;
      if (typeof f.title === "string" && f.title.trim()) tgt.title = f.title.trim();
      if (typeof f.subtitle === "string" && f.subtitle.trim()) tgt.subtitle = f.subtitle.trim();
      if (Array.isArray(f.bullets) && f.bullets.length) {
        tgt.bullets = f.bullets.filter(b => typeof b === "string" && b.trim()).slice(0, 7);
      }
    }

    // Pass 2 — final polish: re-review the deck AFTER fixes were applied.
    // Catches issues introduced/missed in pass 1 and tightens phrasing.
    ensureBudget();
    const polishInput = deepSlides.map((s, i) => ({
      i, type: s.type, layout: (s as { layout?: string }).layout,
      title: s.title, subtitle: (s as { subtitle?: string }).subtitle,
      bullets: (s as { bullets?: string[] }).bullets?.slice(0, 4),
    }));
    const polishSys = `You are doing the FINAL polish pass on a presentation deck. The first edit pass already ran — now perfect what remains.
Focus on:
- Any title/bullet that is still vague, generic, or could be more specific
- Verbal repetition across slides (same opener words, same sentence structure)
- Bullets missing a concrete fact, number, example, or sharp verb
- Inconsistent tone or formality between slides

Return JSON: { "fixes": [{ "i": <index>, "title"?, "bullets"?, "subtitle"? }] }
Empty fixes only if every slide is genuinely publication-ready. Keep user's language/dialect exactly. Up to 15 fixes.`;
    const polishUser = `Deck subject: ${subject}\nLanguage: ${lang}\nSlides:\n${JSON.stringify(polishInput, null, 1).slice(0, 16000)}`;
    const polish = timeRemaining() > 25_000 ? await withBudgetTimeout(aiJson<{ fixes?: Array<{ i?: number; title?: string; bullets?: string[]; subtitle?: string }> }>([
      { role: "system", content: polishSys }, { role: "user", content: polishUser },
    ], ROUTER_MODELS.slidesCritic), Math.min(14_000, Math.max(3_000, timeRemaining() - 8_000))) : null;
    const polishFixes = Array.isArray(polish?.fixes) ? polish!.fixes! : [];
    console.log(`[review pass 2 / polish] applying ${polishFixes.length} fixes`);
    for (const f of polishFixes) {
      const idx = Number(f.i);
      if (!Number.isFinite(idx) || idx < 0 || idx >= deepSlides.length) continue;
      const tgt = deepSlides[idx] as Record<string, unknown>;
      if (typeof f.title === "string" && f.title.trim()) tgt.title = f.title.trim();
      if (typeof f.subtitle === "string" && f.subtitle.trim()) tgt.subtitle = f.subtitle.trim();
      if (Array.isArray(f.bullets) && f.bullets.length) {
        tgt.bullets = f.bullets.filter(b => typeof b === "string" && b.trim()).slice(0, 7);
      }
    }
  } catch (e) { console.warn("[review] failed", e); }

  deepSlides = guaranteeMinimumSlideContent(deepSlides as Array<Record<string, unknown>>, subject, outline.language || lang) as typeof deepSlides;
  deepSlides = enforceDigitalOasisVariety(deepSlides as Array<Record<string, unknown>>, tplId) as typeof deepSlides;
  const weakAfterGuarantee = (deepSlides as Array<Record<string, unknown>>).filter((s) => !hasRichSlideContent(s)).length;
  if (weakAfterGuarantee > 0) console.warn(`[quality] ${weakAfterGuarantee} slides still weak after final guarantee`);

  send({ type: "phase", name: "finalize" });
  if (timeRemaining() > 6_000) {
    await narrate(`Write ONE cheerful closing sentence telling the user the deck is ready. Mention there are ${deepSlides.length} slides.`, subject);
  } else {
    sendNarrate(lang.startsWith("ar") ? `العرض جاهز وفيه ${deepSlides.length} شريحة.\n\n` : `The deck is ready with ${deepSlides.length} slides.\n\n`);
  }

  const themeId = pickThemeForTopic(subject, outline.language || lang);
  // Auto-extract duration/audience from the prompt when caller didn't pass them.
  const autoDuration = (() => {
    if (durationMin) return durationMin;
    const m = topic.match(/(\d{1,3})\s*(?:min|minute|minutes|دقيقة|دقائق|د)/i);
    if (m) { const n = parseInt(m[1], 10); if (n >= 2 && n <= 180) return n; }
    return undefined;
  })();
  const autoAudience = (() => {
    if (audience) return audience;
    const t = topic.toLowerCase();
    if (/investor|vc|pitch|مستثمر/.test(t)) return "investors";
    if (/student|class|lecture|طلاب|طالب|محاضرة|درس/.test(t)) return "students";
    if (/team|standup|internal|فريق|اجتماع/.test(t)) return "team";
    if (/customer|client|sales|عميل|مبيعات/.test(t)) return "customers";
    return undefined;
  })();
  const deckShape = planDeckShape({ requested: requestedCount, durationMin: autoDuration, audience: autoAudience });
  const deck = {
    title: outline.title || subject,
    subtitle: (outline as { subtitle?: string }).subtitle,
    language: outline.language || lang,
    templateId: requestedTemplateId || tplId,
    htmlSlug: tplId,
    theme: themeId,
    densityHint: deckShape.density,
    audience: autoAudience || null,
    durationMin: autoDuration || null,
    brandKit: brandKit || null,
    palette,
    slides: deepSlides,
  };
  ensureDeckHasImmediateImages(deck, subject);
  send({ type: "deck", deck });

  if (userId && SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await sb.rpc("spend_credits_auto", {
        p_user_id: userId, p_amount: 2,
        p_action_type: "slides_chat", p_description: "Slides via chat",
      });
    } catch (e) { console.warn("credit deduction failed", e); }
  }

  return { deck };
}

// ────────────────────────────────────────────────────────────────────────────
// Plus AI Presentations API branch (standard tier).
// Triggered when caller passes `provider: "plusai"`. Creates a background job,
// calls Plus AI, polls until done, uploads PPTX to the public `presentations`
// bucket, and writes `{ standardSlides: { ... } }` to job.output for the client.
// Docs: https://guide.plusai.com/ai-for-presentations/presentations-api
// ────────────────────────────────────────────────────────────────────────────

const PLUS_API_BASE = "https://api.plusdocs.com/r/v0";
const PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

async function plusCreatePresentation(prompt: string, opts: { language?: string; numberOfSlides?: number }) {
  const apiKey = Deno.env.get("PLUSAI_API_KEY");
  if (!apiKey) throw new Error("Missing PLUSAI_API_KEY secret");
  const body: Record<string, unknown> = { prompt };
  if (opts.language) body.language = opts.language;
  if (opts.numberOfSlides) body.numberOfSlides = opts.numberOfSlides;
  const resp = await fetch(`${PLUS_API_BASE}/presentation`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`Plus AI create failed (${resp.status}): ${t.slice(0, 400)}`);
  }
  return await resp.json() as { pollingUrl: string; status: string };
}

async function plusPollPresentation(pollingUrl: string) {
  const apiKey = Deno.env.get("PLUSAI_API_KEY")!;
  const resp = await fetch(pollingUrl, { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`Plus AI poll failed (${resp.status}): ${t.slice(0, 400)}`);
  }
  return await resp.json() as {
    status: "PROCESSING" | "GENERATED" | "FAILED";
    url: string | null;
    slides: string[] | null;
  };
}

async function runPlusAIJob(
  writer: JobWriter,
  userId: string,
  payload: {
    topic: string;
    language?: string;
    numberOfSlides?: number;
    stylePrompt?: string;
    templateName?: string;
    templateColors?: [string, string];
  },
) {
  await writer.start({ phase: "create", status_text: "جاري إرسال الطلب…" });
  await writer.setProgress(5, "create");

  // Auto-detect language from topic so Arabic prompts always produce Arabic decks.
  const detectedLang = detectLanguage(payload.topic);
  const language = payload.language || detectedLang;

  // Bigger by default — user wants substantial decks, not tiny 8-slide stubs.
  // Plus AI cap is 30. Use 25 as the comfortable default.
  const numberOfSlides = Math.min(30, Math.max(8, payload.numberOfSlides || 25));

  // Force real stock photography (search-based) over AI-generated illustrations.
  const imageRule =
    "IMAGE RULES: Use ONLY real stock photographs from web/photo libraries (search-based, photojournalistic). " +
    "Do NOT use AI-generated illustrations, 3D renders, cartoon graphics, or synthetic art. " +
    "Every slide should feature an authentic photo relevant to the topic.";

  const langRule = language === "en"
    ? ""
    : `LANGUAGE: Write ALL slide content — titles, bullets, captions, speaker notes — strictly in ${language === "ar" ? "Arabic (العربية)" : language}. Do NOT translate to English under any circumstance.`;

  const stylePrefix = [payload.stylePrompt || "", imageRule, langRule].filter(Boolean).join("\n\n").trim();
  const fullPrompt = stylePrefix ? `${stylePrefix}\n\nTopic: ${payload.topic}` : payload.topic;

  const created = await plusCreatePresentation(fullPrompt, {
    language,
    numberOfSlides,
  });
  await writer.setProgress(15, "polling");
  await writer.setStatusText("جاري توليد الشرائح بواسطة Plus AI…");

  let final: { url: string; slides: string[] } | null = null;
  for (let i = 0; i < 60; i++) {
    if (await writer.isCanceled()) throw new Error("Canceled by user");
    await new Promise((r) => setTimeout(r, 5000));
    const row = await plusPollPresentation(created.pollingUrl);
    if (row.status === "GENERATED" && row.url) {
      final = { url: row.url, slides: row.slides || [] };
      break;
    }
    if (row.status === "FAILED") throw new Error("Plus AI marked the presentation as FAILED");
    const pct = 15 + Math.min(70, Math.round((i / 60) * 70));
    await writer.setProgress(pct, "polling");
  }
  if (!final) throw new Error("Timed out waiting for Plus AI presentation");

  await writer.setProgress(88, "upload");
  await writer.setStatusText("جاري رفع الملف…");

  const pptxResp = await fetch(final.url);
  if (!pptxResp.ok) throw new Error(`Failed downloading PPTX (${pptxResp.status})`);
  const bytes = new Uint8Array(await pptxResp.arrayBuffer());

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY!);
  const path = `${userId}/${writer.id}.pptx`;
  const { error: upErr } = await sb.storage.from("presentations").upload(path, bytes, {
    contentType: PPTX_MIME, upsert: true,
  });
  if (upErr) throw new Error(`Storage upload failed: ${upErr.message}`);
  const { data: pub } = sb.storage.from("presentations").getPublicUrl(path);

  const title = (final.slides[0] || payload.topic || "Presentation").slice(0, 120);
  await writer.setProgress(100, "done");
  await writer.complete({
    standardSlides: {
      title,
      templateName: payload.templateName || "Standard (Plus AI)",
      url: pub.publicUrl,
      colors: (payload.templateColors || ["#0a0a0a", "#5b8def"]) as [string, string],
      slides: final.slides,
      slideCount: final.slides.length,
      provider: "plusai",
    },
  });
}

/* ───────────────────────────────────────────────────────────────────
 * Merged endpoint: slides-message (action: "message").
 * Generates the short plan/summary chat blurb for a deck.
 * Kept here so it shares the same deployment slot as chat-slides-stream.
 * ─────────────────────────────────────────────────────────────────── */
async function handleSlidesMessage(body: Record<string, unknown>): Promise<Response> {
  const mode = String(body?.mode ?? "plan");
  const topic = String(body?.topic ?? "");
  const kind = String(body?.kind ?? "slides");
  const slideCount = body?.slideCount as number | undefined;
  const title = String(body?.title ?? "");

  const router = await getLLM();
  if (!router) {
    return new Response(JSON.stringify({ error: "no LLM provider configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const kindLabel = kind === "slides-images" ? "image-designed slides deck (PDF)" : "slides deck";

  const sys = mode === "plan"
    ? `You are the presenter, talking to the user in chat right BEFORE you start building their ${kindLabel}.
Write a SHORT, natural message describing your plan for this exact deck.
HARD RULES:
- Reply in EXACTLY the same language and dialect as the user's request below. Mirror Arabic dialects precisely (Egyptian, Khaleeji, Shami, Maghrebi, Iraqi, MSA, etc.).
- Be SPECIFIC to this topic: mention the angle you'll take, the key sections / story arc you're considering, or what you'll emphasize. Never use generic filler.
- Write with full freedom in length, structure, and tone — no fixed template, no required phrasing. Could be 2 sentences, could be a short paragraph, could be a tiny list. Up to you.
- Do NOT mention buttons, downloads, PDF, share, or preview — the UI handles those.
- Plain text only. No code fences.`
    : `You are the presenter, talking to the user in chat right AFTER you finished building their ${kindLabel}.
Write a SHORT, natural summary of what you actually produced.
HARD RULES:
- Reply in EXACTLY the same language and dialect as the user's request below. Mirror Arabic dialects precisely.
- Be SPECIFIC to this deck: mention the angle you took, the highlights, or what the user should pay attention to. Never use generic "your slides are ready".
- Write with full freedom — no fixed template, no required phrasing. Length, tone, and structure are up to you.
- Do NOT mention buttons, downloads, PDF, share, or preview — the UI shows those.
- Plain text only. No code fences.`;

  const user = `USER REQUEST:\n${topic}\n\nDECK TITLE: ${title || "(unset)"}\nDECK KIND: ${kindLabel}${
    slideCount ? `\nSLIDE COUNT: ${slideCount}` : ""
  }`;

  const res = await fetch(router.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${router.key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: router.mapModel(ROUTER_MODELS.slides),
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      temperature: 0.85,
      max_tokens: 260,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return new Response(JSON.stringify({ error: `gateway ${res.status}`, detail: text }), {
      status: res.status === 429 || res.status === 402 ? res.status : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const data = await res.json();
  const message = String(data?.choices?.[0]?.message?.content ?? "").trim();
  return new Response(JSON.stringify({ message }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

  const authUser = await getAuthUser(req);
  if (!authUser) {
    return new Response(JSON.stringify({ error: "auth_required" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const body = await req.json().catch(() => ({}));
  // Merged sub-endpoint: short plan/summary message (was slides-message).
  if (body?.action === "message") return await handleSlidesMessage(body);
  const { topic, templateId, background } = body;
  const conversationId = typeof body.conversation_id === "string" ? body.conversation_id : null;
  const messageId = typeof body.message_id === "string" ? body.message_id : null;
  const userId = authUser.id;
  if (!topic || typeof topic !== "string") {
    return new Response(JSON.stringify({ error: "topic is required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Plus AI branch (standard tier) — short-circuit the React-deck pipeline ──
  if (body.provider === "plusai" && userId) {
    const plusJobId = await createJob({
      userId,
      kind: "slides",
      input: { topic, templateId: typeof templateId === "string" ? templateId : "standard-professional", provider: "plusai" },
      meta: { provider: "plusai" },
      conversationId,
      messageId,
    });
    const tColors = Array.isArray(body.templateColors) && body.templateColors.length === 2
      ? [String(body.templateColors[0]), String(body.templateColors[1])] as [string, string]
      : undefined;
    runInBackground(plusJobId, async (writer) => {
      await runPlusAIJob(writer, userId, {
        topic,
        language: typeof body.language === "string" ? body.language : undefined,
        numberOfSlides: Number.isFinite(body.numberOfSlides) ? Number(body.numberOfSlides) : undefined,
        stylePrompt: typeof body.stylePrompt === "string" ? body.stylePrompt : undefined,
        templateName: typeof body.templateName === "string" ? body.templateName : undefined,
        templateColors: tColors,
      });
    });
    return new Response(JSON.stringify({ jobId: plusJobId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const rawId = typeof templateId === "string" ? templateId : "";
  const requestedTemplateId = REACT_TEMPLATES.has(rawId) ? rawId : "digital-oasis";
  const tplId = requestedTemplateId;
  const palette = PALETTES[tplId];

  const isLongInput = topic.trim().length >= 400;
  const subject = isLongInput
    ? topic.split(/\n|[.!؟?]/)[0].trim().slice(0, 120) || topic.slice(0, 120)
    : topic.trim();
  const referenceMaterial = isLongInput ? topic : "";
  const lang = detectLanguage(topic);
  const requestedCount = parseRequestedCount(topic);
  const audience = typeof body.audience === "string" ? body.audience.slice(0, 60) : undefined;
  const durationMin = Number.isFinite(body.durationMin) ? Number(body.durationMin) : undefined;
  const brandKit = safeParseBrandKit(body.brandKit);

  // ── Background mode: return jobId immediately, run pipeline on server ──
  if (background === true && userId) {
    const jobId = await createJob({
      userId,
      kind: "slides",
      input: { topic, templateId: requestedTemplateId || tplId },
      meta: { templateId: requestedTemplateId || tplId, narrative: "", events: [] },
      conversationId,
      messageId,
    });
    runInBackground(jobId, async (writer: JobWriter) => {
      const events: Array<Record<string, unknown>> = [];
      let lastMetaFlush = 0;
      const flushEvents = async (force = false) => {
        const now = Date.now();
        if (force || now - lastMetaFlush >= 700) {
          lastMetaFlush = now;
          await writer.setMeta({ templateId: requestedTemplateId || tplId, events });
        }
      };
      const emit: SlidesEmit = async (event) => {
        if (event.type === "narrate" && typeof event.delta === "string") {
          await writer.appendStream(event.delta);
          return;
        }
        if (event.type === "phase") {
          await writer.setProgress(0, String(event.name ?? ""));
        }
        events.push({ ...event, ts: Date.now() });
        await flushEvents();
      };
      await writer.start({ phase: "search", status_text: "Researching..." });
      const { deck } = await runSlidesPipeline({
        topic, tplId, requestedTemplateId, palette, isLongInput, subject, referenceMaterial, lang, requestedCount, audience, durationMin, brandKit, userId, emit,
      });
      await flushEvents(true);
      await writer.complete({ deck });
    });
    return new Response(JSON.stringify({ jobId }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        const emit: SlidesEmit = (event) => {
          controller.enqueue(enc.encode(`data: ${JSON.stringify(event)}\n\n`));
        };
        await runSlidesPipeline({
          topic, tplId, requestedTemplateId, palette, isLongInput, subject, referenceMaterial, lang, requestedCount, audience, durationMin, brandKit, userId, emit,
        });
        controller.enqueue(enc.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        console.error("chat-slides-stream error", err);
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: "error", message: err instanceof Error ? err.message : "Unknown error" })}\n\n`));
        controller.enqueue(enc.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
});
