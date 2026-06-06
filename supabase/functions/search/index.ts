// Unified search edge function with smart routing.
// Replaces serper-search + firecrawl-proxy.
//
// Body:
//   {
//     query: string,
//     mode?: "auto" | "web" | "images" | "news" | "videos" | "scholar"
//           | "scrape" | "map" | "crawl" | "deep",
//     num?: number,
//     // mode-specific overrides:
//     url?: string,            // for scrape/map/crawl
//     scrape?: boolean,        // for web mode -> also fetch content via firecrawl
//     formats?: string[],      // scrape formats
//     payload?: any,           // raw passthrough (advanced)
//   }
//
// Smart router:
//   - auto: URL detected => scrape; otherwise => web
//   - web: Serper (fast/cheap), fallback Firecrawl /search
//   - web + scrape:true: Firecrawl /search (returns content)
//   - images / news / videos / scholar: Serper
//   - scrape / map / crawl: Firecrawl
//   - deep: Serper organic + Firecrawl scrape top results in parallel

import { withKeyRotation, hasUnlimitedPlan } from "../_shared/key-pool.ts";
import { getAuthUser } from "../_shared/auth.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SERPER_COST = 0.0003;
const FIRECRAWL_COST: Record<string, number> = {
  scrape: 0.001, search: 0.005, map: 0.001, crawl: 0.01,
};

const URL_RE = /^https?:\/\/\S+$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  let body: any = {};
  try { body = await req.json(); } catch { /* ignore */ }

  const query = String(body?.query ?? body?.q ?? "").trim();
  const url = body?.url ? String(body.url).trim() : "";
  let mode: string = String(body?.mode ?? "auto").toLowerCase();
  const num = Math.min(Math.max(Number(body?.num ?? 10), 1), 100);
  const wantScrape = !!body?.scrape;
  const formats: string[] = Array.isArray(body?.formats) ? body.formats : ["markdown"];

  // ── Smart routing ──
  if (mode === "auto") {
    if (url || URL_RE.test(query)) mode = "scrape";
    else mode = "web";
  }

  const user = await getAuthUser(req).catch(() => null);
  const unlimited = await hasUnlimitedPlan(user?.id);

  try {
    switch (mode) {
      case "web": {
        if (wantScrape) return json({ ok: true, unlimited, provider: "firecrawl", ...(await firecrawlSearch(query, num, formats)) });
        // Serper first, fallback Firecrawl
        try {
          return json({ ok: true, unlimited, provider: "serper", ...(await serper("search", query, num)) });
        } catch (_e) {
          return json({ ok: true, unlimited, provider: "firecrawl", fallback: true, ...(await firecrawlSearch(query, num, ["markdown"])) });
        }
      }
      case "images":
      case "news":
      case "videos":
        return json({ ok: true, unlimited, provider: "serper", ...(await serper(mode, query, num)) });
      case "scholar":
        return json({ ok: true, unlimited, provider: "serper", ...(await serper("scholar", query, num)) });
      case "scrape": {
        const target = url || query;
        if (!target) return json({ error: "missing url" }, 400);
        return json({ ok: true, unlimited, provider: "firecrawl", ...(await firecrawl("scrape", { url: target, formats, onlyMainContent: body?.onlyMainContent ?? true })) });
      }
      case "map": {
        const target = url || query;
        if (!target) return json({ error: "missing url" }, 400);
        return json({ ok: true, unlimited, provider: "firecrawl", ...(await firecrawl("map", { url: target, limit: num * 50, ...(body?.payload || {}) })) });
      }
      case "crawl": {
        const target = url || query;
        if (!target) return json({ error: "missing url" }, 400);
        return json({ ok: true, unlimited, provider: "firecrawl", ...(await firecrawl("crawl", { url: target, limit: num, ...(body?.payload || {}) })) });
      }
      case "deep": {
        if (!query) return json({ error: "missing query" }, 400);
        const [serperRes, firecrawlRes] = await Promise.allSettled([
          serper("search", query, num),
          firecrawlSearch(query, Math.min(num, 5), ["markdown"]),
        ]);
        return json({
          ok: true,
          unlimited,
          provider: "deep",
          serper: serperRes.status === "fulfilled" ? serperRes.value : { error: String((serperRes as any).reason) },
          firecrawl: firecrawlRes.status === "fulfilled" ? firecrawlRes.value : { error: String((firecrawlRes as any).reason) },
        });
      }
      default:
        return json({ error: `unknown mode: ${mode}` }, 400);
    }
  } catch (e: any) {
    return json({ error: e?.message ?? "search failed" }, 502);
  }
});

// ── Serper ──
async function serper(type: "search" | "images" | "news" | "videos" | "scholar", q: string, num: number) {
  const result = await withKeyRotation("serper", async (apiKey) => {
    const r = await fetch(`https://google.serper.dev/${type}`, {
      method: "POST",
      headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ q, num }),
    });
    const text = await r.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    return {
      ok: r.ok,
      status: r.status,
      data,
      errorText: r.ok ? undefined : (data?.message ?? text.slice(0, 200)),
      costUsd: r.ok ? SERPER_COST : 0,
    };
  });
  if (!result.ok) throw new Error(`serper ${type} failed: ${result.errorText}`);
  return result.data;
}

// ── Firecrawl ──
async function firecrawl(action: "scrape" | "search" | "map" | "crawl", payload: unknown) {
  const result = await withKeyRotation("firecrawl", async (apiKey) => {
    const r = await fetch(`https://api.firecrawl.dev/v2/${action}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await r.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    return {
      ok: r.ok,
      status: r.status,
      data,
      errorText: r.ok ? undefined : (data?.error ?? text.slice(0, 200)),
      costUsd: r.ok ? (FIRECRAWL_COST[action] ?? 0.001) : 0,
    };
  });
  if (!result.ok) throw new Error(`firecrawl ${action} failed: ${result.errorText}`);
  return result.data;
}

async function firecrawlSearch(query: string, limit: number, formats: string[]) {
  return await firecrawl("search", { query, limit, scrapeOptions: { formats } });
}

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
}
