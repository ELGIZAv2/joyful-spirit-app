// Ultra Image Agent — Serper + Firecrawl + Pexels with OpenRouter vision ranking.
//
// Pipeline per slide:
//   1. AI extracts 5 SPECIFIC queries that PRESERVE proper nouns
//      (people/places/brands). Translates Arabic names → English.
//   2. Parallel search across Serper Images, Firecrawl Search (images),
//      and Pexels. Up to 25 candidates.
//   3. OpenRouter compares thumbnails vs slide context and
//      picks the BEST match (rejecting generic stock when a named subject exists).
//   4. Validates winner with a HEAD request before returning.

import { getLLM, ROUTER_MODELS } from "../_shared/llm-router.ts";

const SERPER_API_KEY = Deno.env.get("SERPER_API_KEY");
const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
const PEXELS_API_KEY = Deno.env.get("PEXELS_API_KEY");

type Candidate = {
  url: string;
  source: string;
  title?: string;
  width?: number;
  height?: number;
};

const TIMEOUT_MS = 8000;
const AI_TIMEOUT_MS = 9000;

// (3) Domain blacklist — low-quality / watermarked / thumbnail-only sources
const BAD_DOMAINS = [
  "pinterest.", "alamy.com", "gettyimages.", "shutterstock.com",
  "istockphoto.com", "dreamstime.com", "123rf.com", "depositphotos.com",
  "lookaside.fbsbx", "encrypted-tbn", "lookaside.instagram",
];
const BAD_URL_HINTS = ["watermark", "thumb", "thumbnail", "/preview/", "comp/", "/sample/"];

function isBadUrl(u: string): boolean {
  const low = u.toLowerCase();
  if (BAD_DOMAINS.some(d => low.includes(d))) return true;
  if (BAD_URL_HINTS.some(h => low.includes(h))) return true;
  return false;
}

// (6) Arabic → English proper-noun dictionary (extend as needed)
const NAME_DICT: Record<string, string> = {
  "محمد صلاح": "Mohamed Salah",
  "السيسي": "Abdel Fattah el-Sisi",
  "عبد الفتاح السيسي": "Abdel Fattah el-Sisi",
  "جمال عبد الناصر": "Gamal Abdel Nasser",
  "أم كلثوم": "Umm Kulthum",
  "ام كلثوم": "Umm Kulthum",
  "نجيب محفوظ": "Naguib Mahfouz",
  "عمرو دياب": "Amr Diab",
  "ستيف جوبز": "Steve Jobs",
  "ايلون ماسك": "Elon Musk",
  "إيلون ماسك": "Elon Musk",
  "القاهرة": "Cairo",
  "الإسكندرية": "Alexandria",
  "الاسكندرية": "Alexandria",
  "الأهرامات": "Pyramids of Giza",
  "الاهرامات": "Pyramids of Giza",
  "الأقصر": "Luxor",
  "اسوان": "Aswan",
  "أسوان": "Aswan",
  "ليفربول": "Liverpool",
  "ريال مدريد": "Real Madrid",
  "برشلونة": "Barcelona",
  "الزمالك": "Zamalek SC",
  "الأهلي": "Al Ahly",
};
function translateProperNouns(q: string): string {
  let out = q;
  for (const [ar, en] of Object.entries(NAME_DICT)) {
    if (out.includes(ar)) out = out.split(ar).join(en);
  }
  return out;
}

// (2) Per-request in-memory cache for search results
const searchCache = new Map<string, Candidate[]>();
function cacheKey(source: string, q: string): string { return `${source}::${q.toLowerCase()}`; }

async function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_MS): Promise<T | null> {
  return await Promise.race([
    p,
    new Promise<null>(res => setTimeout(() => res(null), ms)),
  ]).catch(() => null);
}

async function fetchWithAbort(url: string, init: RequestInit, ms = TIMEOUT_MS): Promise<Response> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctl.signal });
  } finally {
    clearTimeout(t);
  }
}

// ─── Sources ────────────────────────────────────────────────
function applyQualityFilters(list: Candidate[]): Candidate[] {
  return list
    .filter(c => c.url.startsWith("https://") && !c.url.endsWith(".svg"))
    .filter(c => !isBadUrl(c.url))
    .filter(c => !(c.width && c.height && (c.width < 500 || c.height < 350)));
}

async function searchSerper(q: string): Promise<Candidate[]> {
  if (!SERPER_API_KEY) return [];
  const query = translateProperNouns((q || "").trim().replace(/\s+/g, " ")).slice(0, 100);
  if (!query) return [];
  const ck = cacheKey("serper", query);
  if (searchCache.has(ck)) return searchCache.get(ck)!;
  try {
    const r = await fetchWithAbort("https://google.serper.dev/images", {
      method: "POST",
      headers: { "X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, num: 20 }),
    });
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      console.warn("[serper]", r.status, body.slice(0, 200));
      searchCache.set(ck, []);
      return [];
    }
    const d = await r.json();
    const list = (d?.images || []) as Array<{ imageUrl?: string; title?: string; imageWidth?: number; imageHeight?: number }>;
    const out = applyQualityFilters(list
      .filter(it => it.imageUrl?.startsWith("https://"))
      .map(it => ({ url: it.imageUrl!, source: "serper", title: it.title, width: it.imageWidth, height: it.imageHeight })));
    searchCache.set(ck, out);
    return out;
  } catch (e) { console.warn("[serper] err", e); return []; }
}

async function searchFirecrawl(q: string): Promise<Candidate[]> {
  if (!FIRECRAWL_API_KEY) return [];
  const query = translateProperNouns(q || "").slice(0, 100);
  if (!query) return [];
  const ck = cacheKey("firecrawl", query);
  if (searchCache.has(ck)) return searchCache.get(ck)!;
  try {
    const r = await fetchWithAbort("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit: 15, sources: ["images"] }),
    });
    if (!r.ok) { console.warn("[firecrawl]", r.status); searchCache.set(ck, []); return []; }
    const d = await r.json();
    const list = (d?.data?.images || d?.images || []) as Array<{ imageUrl?: string; url?: string; title?: string; imageWidth?: number; imageHeight?: number }>;
    const out = applyQualityFilters(list
      .map(it => ({
        url: (it.imageUrl || it.url || "") as string,
        source: "firecrawl",
        title: it.title,
        width: it.imageWidth,
        height: it.imageHeight,
      })));
    searchCache.set(ck, out);
    return out;
  } catch (e) { console.warn("[firecrawl] err", e); return []; }
}

async function searchPexels(q: string, orientation: "landscape" | "portrait" | "square" = "landscape"): Promise<Candidate[]> {
  if (!PEXELS_API_KEY) return [];
  const query = translateProperNouns(q || "").slice(0, 100);
  if (!query) return [];
  const ck = cacheKey(`pexels:${orientation}`, query);
  if (searchCache.has(ck)) return searchCache.get(ck)!;
  try {
    const url = new URL("https://api.pexels.com/v1/search");
    url.searchParams.set("query", query);
    url.searchParams.set("per_page", "15");
    url.searchParams.set("orientation", orientation);
    const r = await fetchWithAbort(url.toString(), { headers: { Authorization: PEXELS_API_KEY } });
    if (!r.ok) { searchCache.set(ck, []); return []; }
    const d = await r.json();
    const list = (d?.photos || []) as Array<{ src?: { large2x?: string; large?: string; original?: string }; alt?: string; width?: number; height?: number }>;
    const out = applyQualityFilters(list
      .map(p => ({
        url: (p.src?.large2x || p.src?.large || p.src?.original || "") as string,
        source: "pexels",
        title: p.alt,
        width: p.width,
        height: p.height,
      })));
    searchCache.set(ck, out);
    return out;
  } catch { return []; }
}

// (10) Free / keyless sources — Openverse + Wikipedia
async function searchOpenverse(q: string): Promise<Candidate[]> {
  const query = translateProperNouns(q || "").slice(0, 100);
  if (!query) return [];
  const ck = cacheKey("openverse", query);
  if (searchCache.has(ck)) return searchCache.get(ck)!;
  try {
    const url = new URL("https://api.openverse.org/v1/images/");
    url.searchParams.set("q", query);
    url.searchParams.set("page_size", "8");
    url.searchParams.set("mature", "false");
    const r = await fetchWithAbort(url.toString(), {
      headers: { "User-Agent": "MegsyAI-Slides/1.0" },
    });
    if (!r.ok) { searchCache.set(ck, []); return []; }
    const d = await r.json();
    const list = (d?.results || []) as Array<{ url?: string; title?: string; width?: number; height?: number }>;
    const out = applyQualityFilters(list
      .map(it => ({ url: it.url || "", source: "openverse", title: it.title, width: it.width, height: it.height })));
    searchCache.set(ck, out);
    return out;
  } catch { return []; }
}

async function searchWikipedia(q: string): Promise<Candidate[]> {
  const query = translateProperNouns(q || "").slice(0, 80);
  if (!query) return [];
  const ck = cacheKey("wiki", query);
  if (searchCache.has(ck)) return searchCache.get(ck)!;
  try {
    const url = new URL("https://en.wikipedia.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");
    url.searchParams.set("generator", "search");
    url.searchParams.set("gsrsearch", query);
    url.searchParams.set("gsrlimit", "3");
    url.searchParams.set("prop", "pageimages");
    url.searchParams.set("piprop", "original");
    url.searchParams.set("pilicense", "any");
    const r = await fetchWithAbort(url.toString(), {});
    if (!r.ok) { searchCache.set(ck, []); return []; }
    const d = await r.json();
    const pages = d?.query?.pages || {};
    const out: Candidate[] = [];
    for (const p of Object.values(pages) as Array<{ original?: { source?: string; width?: number; height?: number }; title?: string }>) {
      const src = p?.original?.source;
      if (src && src.startsWith("https://")) {
        out.push({ url: src, source: "wikipedia", title: p.title, width: p.original?.width, height: p.original?.height });
      }
    }
    const filtered = applyQualityFilters(out);
    searchCache.set(ck, filtered);
    return filtered;
  } catch { return []; }
}

/** Map a slide layout to ideal photo orientation. */
function orientationForLayout(layout?: string, type?: string): "landscape" | "portrait" | "square" {
  const l = (layout || "").toLowerCase();
  const t = (type || "").toLowerCase();
  if (t === "cover" || l === "image-full" || l === "hero" || l === "cover" || l.includes("full")) return "landscape";
  if (l === "split-left" || l === "split-right" || l === "split" || l.includes("portrait")) return "portrait";
  if (l === "gallery" || l === "grid" || l === "mosaic" || l.includes("card")) return "square";
  return "landscape";
}

/** Filter candidates by aspect-ratio fit so landscape slides don't get portrait shots. */
function filterByAspect(list: Candidate[], orientation: "landscape" | "portrait" | "square"): Candidate[] {
  const ok = list.filter(c => {
    if (!c.width || !c.height) return true;
    const ratio = c.width / c.height;
    if (orientation === "landscape") return ratio >= 1.2;
    if (orientation === "portrait")  return ratio <= 0.85;
    return ratio >= 0.8 && ratio <= 1.25;
  });
  return ok.length >= 3 ? ok : list;
}

// ─── AI helpers ─────────────────────────────────────────────
async function aiJSON<T>(messages: Array<{ role: string; content: unknown }>, model = ROUTER_MODELS.slidesVision): Promise<T | null> {
  const router = await getLLM();
  if (!router) return null;
  try {
    const r = await fetchWithAbort(router.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${router.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: router.mapModel(model || ROUTER_MODELS.slidesVision), messages, response_format: { type: "json_object" } }),
    }, AI_TIMEOUT_MS);
    if (!r.ok) { console.warn("[aiJSON]", r.status); return null; }
    const d = await r.json();
    const txt = d?.choices?.[0]?.message?.content as string | undefined;
    if (!txt) return null;
    try { return JSON.parse(txt) as T; } catch {
      const m = txt.match(/\{[\s\S]*\}/);
      return m ? JSON.parse(m[0]) as T : null;
    }
  } catch (e) { console.warn("[aiJSON] err", e); return null; }
}

// ─── Stage 1: query generation ──────────────────────────────
type SlideCtx = { title?: string; subtitle?: string; body?: string; focus?: string; image_query?: string; type?: string; layout?: string };

async function generateQueries(slide: SlideCtx, topic: string): Promise<{ queries: string[]; subject: string }> {
  const ctx = [slide.title, slide.subtitle, slide.focus, slide.body?.slice(0, 500)]
    .filter(Boolean).join(" — ");

  const sys = `You are an image search expert. Given a slide context, produce 5 SPECIFIC English image-search queries.

CRITICAL RULES:
1. PRESERVE proper nouns — names of people, places, brands, products, events, teams.
2. If the deck topic or slide mentions a SPECIFIC PERSON (e.g. "محمد صلاح" → "Mohamed Salah", "ستيف جوبز" → "Steve Jobs"), EVERY query MUST include that person's full English name. NEVER replace a named person with a generic role like "a football player" or "a CEO" — that produces wrong images.
3. Translate Arabic / other-script names to their standard English spelling.
4. Vary the angle but keep the subject anchored:
   - Query 1: subject + main context (e.g. "Mohamed Salah Liverpool celebration")
   - Query 2: subject + specific moment/achievement (e.g. "Mohamed Salah Champions League goal")
   - Query 3: subject + portrait/close-up (e.g. "Mohamed Salah portrait Egypt")
   - Query 4: subject + scene/environment (e.g. "Mohamed Salah Anfield stadium")
   - Query 5: subject + alternate angle (e.g. "Mohamed Salah training")
5. If NO named subject exists, produce concrete visual queries about the slide's actual topic — never generic stock-photo phrases unless that IS the topic.
6. 3-7 words per query. English only. No punctuation, no quotes.

Return JSON: { "subject": "<main named English subject, or empty string>", "queries": ["q1","q2","q3","q4","q5"] }`;

  const user = `Deck topic: ${topic}\nSlide title: ${slide.title || ""}\nSlide focus: ${slide.focus || ""}\nSlide details: ${ctx}\nOriginal query hint: ${slide.image_query || ""}`;

  const out = await aiJSON<{ subject?: string; queries?: string[] }>([
    { role: "system", content: sys }, { role: "user", content: user },
  ]);

  const qs = (out?.queries || [])
    .map(q => (q || "").trim().replace(/["']/g, "").replace(/\s+/g, " "))
    .filter(q => q.length >= 3 && q.length <= 120);

  if (qs.length >= 2) return { queries: qs.slice(0, 5), subject: (out?.subject || "").trim() };

  const base = (slide.image_query || slide.title || topic).trim();
  return { queries: base ? [base] : [], subject: "" };
}

// ─── Stage 2: gather candidates (FREE sources first, paid as fallback) ──
async function gatherCandidates(queries: string[], orientation: "landscape" | "portrait" | "square" = "landscape"): Promise<Candidate[]> {
  // Round 1: free + Pexels (free key) — usually enough
  const freeTasks: Array<Promise<Candidate[] | null>> = [];
  for (const q of queries) {
    freeTasks.push(withTimeout(searchPexels(q, orientation)));
    freeTasks.push(withTimeout(searchOpenverse(q)));
    freeTasks.push(withTimeout(searchWikipedia(q)));
  }
  const freeResults = await Promise.all(freeTasks);
  let all: Candidate[] = [];
  for (const r of freeResults) if (r) all.push(...r);

  // If free sources didn't give us enough, fall back to paid Serper + Firecrawl
  if (all.length < 6) {
    const paidTasks: Array<Promise<Candidate[] | null>> = [];
    for (const q of queries) {
      paidTasks.push(withTimeout(searchSerper(q)));
      paidTasks.push(withTimeout(searchFirecrawl(q)));
    }
    const paidResults = await Promise.all(paidTasks);
    for (const r of paidResults) if (r) all.push(...r);
  }

  const seen = new Set<string>();
  const dedup = all.filter(c => {
    if (seen.has(c.url)) return false;
    seen.add(c.url);
    return true;
  });

  // Interleave by source for diversity
  const bySource: Record<string, Candidate[]> = {};
  for (const c of dedup) (bySource[c.source] ||= []).push(c);
  const order = ["pexels", "wikipedia", "openverse", "serper", "firecrawl"];
  const out: Candidate[] = [];
  let added = true;
  while (added && out.length < 25) {
    added = false;
    for (const s of order) {
      const arr = bySource[s];
      if (arr?.length) {
        out.push(arr.shift()!);
        added = true;
        if (out.length >= 25) break;
      }
    }
  }
  return out;
}

// ─── Stage 3: validate URL reachability ─────────────────────
async function isReachable(url: string): Promise<boolean> {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 4000);
    const r = await fetch(url, { method: "HEAD", signal: ctl.signal, redirect: "follow" });
    clearTimeout(t);
    if (!r.ok) return false;
    const ct = r.headers.get("content-type") || "";
    return ct.startsWith("image/");
  } catch {
    return false;
  }
}

// ─── Stage 4: vision-based selection ────────────────────────
async function pickBestWithVision(slide: SlideCtx, topic: string, subject: string, candidates: Candidate[]): Promise<number> {
  if (candidates.length === 0) return 0;
  if (candidates.length === 1) return 0;

  // Cap candidates sent to the vision model — sending 25 image URLs in one call
  // routinely returns 413 (payload too large). 10 is plenty for ranking.
  // Quality-first: send more candidates to vision for a better pick.
  const VISION_CAP = 16;
  const limited = candidates.slice(0, VISION_CAP);

  const ctx = [slide.title, slide.subtitle, slide.focus, slide.body?.slice(0, 300)]
    .filter(Boolean).join(" — ");

  const subjectRule = subject
    ? `\n\nCRITICAL: This slide is specifically about "${subject}". REJECT any image that does NOT clearly show "${subject}" — generic photos of the same category (e.g. random football players when the subject is Mohamed Salah) are WRONG. Only pick an image where "${subject}" is recognisable.`
    : "";

  const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    { type: "text", text:
`Deck topic: ${topic}
Slide context: ${ctx}${subjectRule}

Below are ${limited.length} candidate images (indices 0 to ${limited.length - 1}).
Pick the SINGLE image that best fits this slide.
Reject: text-heavy infographics, watermarks, logos, low-quality stock, off-topic shots, screenshots of websites${subject ? `, photos that do NOT show ${subject}` : ""}.
Prefer: high-quality real photographs with the correct subject and strong composition.
Return JSON: { "best_index": <number>, "reason": "<10 words max>" }` },
  ];
  for (const c of limited) content.push({ type: "image_url", image_url: { url: c.url } });

  const out = await aiJSON<{ best_index?: number; reason?: string }>([
    { role: "user", content: content as unknown as string },
  ], ROUTER_MODELS.slidesVision);

  console.log("[vision] picked", out?.best_index, "reason:", out?.reason);
  const idx = Number(out?.best_index ?? 0);
  if (!Number.isFinite(idx) || idx < 0 || idx >= limited.length) return 0;
  return idx;
}

// ─── Public orchestrator ────────────────────────────────────
export async function smartImage(
  slide: SlideCtx,
  topic: string,
  usedUrls?: Set<string>,
): Promise<string | null> {
  try {
    // Stage 1: AI-generated specific search queries (preserves proper nouns).
    const { queries: aiQueries, subject } = await generateQueries(slide, topic);
    const baseQuery = (slide.image_query || slide.title || topic || "").trim();
    const queries = Array.from(new Set([...(aiQueries || []), baseQuery].filter(Boolean))).slice(0, 5);
    if (queries.length === 0) return null;
    console.log("[smartImage] subject:", subject, "queries:", queries);

    const orientation = orientationForLayout(slide.layout, slide.type);
    const candidates = await gatherCandidates(queries, orientation);
    console.log(`[smartImage] gathered ${candidates.length} candidates`);
    if (candidates.length === 0) return null;

    // Drop already-used URLs (dedup across the whole deck) before validation.
    const fresh = usedUrls && usedUrls.size > 0
      ? candidates.filter(c => !usedUrls.has(c.url))
      : candidates;
    const aspectFiltered = filterByAspect(fresh.length >= 3 ? fresh : candidates, orientation);
    const workingSet = aspectFiltered;

    // Validate top 15 in parallel; drop unreachable.
    const top = workingSet.slice(0, 15);
    const reach = await Promise.all(top.map(c => withTimeout(isReachable(c.url), 4500)));
    const valid = top.filter((_, i) => reach[i] === true);
    const pool = valid.length >= 3 ? valid : top;

    // Stage 3: vision ranking to pick the BEST match (not random first hit).
    const bestIdx = await pickBestWithVision(slide, topic, subject, pool.slice(0, 8));
    const picked = pool[bestIdx]?.url || pool[0]?.url || null;
    if (picked && usedUrls) usedUrls.add(picked);
    return picked;
  } catch (e) {
    console.warn("[smartImage] failed", e);
    return null;
  }
}

// Lightweight variant for gallery sub-images (free-first)
export async function quickImage(query: string, usedUrls?: Set<string>): Promise<string | null> {
  const q = (query || "").trim();
  if (!q) return null;
  const [pex, ov, wiki] = await Promise.all([
    withTimeout(searchPexels(q)),
    withTimeout(searchOpenverse(q)),
    withTimeout(searchWikipedia(q)),
  ]);
  let all = [...(pex || []), ...(ov || []), ...(wiki || [])];
  if (all.length < 2) {
    const [serp, fire] = await Promise.all([
      withTimeout(searchSerper(q)),
      withTimeout(searchFirecrawl(q)),
    ]);
    all = [...all, ...(serp || []), ...(fire || [])];
  }
  const pick = all.find(c => !usedUrls || !usedUrls.has(c.url))?.url || all[0]?.url || null;
  if (pick && usedUrls) usedUrls.add(pick);
  return pick;
}
