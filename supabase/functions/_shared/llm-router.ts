// Shared helper: route AI calls to OpenRouter only.
// Key source: public.api_keys service=openrouter (preferred) or OpenRouter env secret.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_SERVICE_NAMES = ["openrouter", "open_router", "open router", "Open Router", "OPENROUTER"];

let cached: { url: string; key: string; expiry: number } | null = null;
const TTL_MS = 5 * 60_000;

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

/** Returns { url, key } for the best available LLM endpoint for OpenRouter-style models. */
export async function getRouter(): Promise<{ url: string; key: string } | null> {
  if (cached && Date.now() < cached.expiry) return { url: cached.url, key: cached.key };

  // Only use OpenRouter — agentrouter.org is blocked by Aliyun WAF and returns
  // HTML captcha pages instead of JSON, which breaks the AI SDK parser.
  try {
    const sb = admin();
    const { data } = await sb
      .from("api_keys")
      .select("service, api_key")
      .in("service", OPENROUTER_SERVICE_NAMES)
      .eq("is_active", true)
      .eq("is_blocked", false)
      .limit(1);
    if (data && data.length) {
      const or = data[0];
      cached = { url: OPENROUTER_URL, key: or.api_key, expiry: Date.now() + TTL_MS };
      return { url: OPENROUTER_URL, key: or.api_key };
    }
  } catch (e) {
    console.warn("[llm-router] getRouter db error:", (e as Error).message);
  }

  const env = Deno.env.get("OPENROUTER_API_KEY") || Deno.env.get("OPEN_ROUTER_API_KEY") || Deno.env.get("OPEN_ROUTER_KEY");
  if (env) {
    cached = { url: OPENROUTER_URL, key: env, expiry: Date.now() + TTL_MS };
    return { url: OPENROUTER_URL, key: env };
  }
  return null;
}

/** Default model assignments (centralized). OpenRouter slugs only.
 *  No Claude, no Lovable AI Gateway models. */
export const ROUTER_MODELS = {
  chat:          "google/gemini-2.5-flash",
  learning:      "google/gemini-2.5-flash",
  slides:        "google/gemini-2.5-flash",
  slidesOutline: "google/gemini-2.5-flash-lite",
  slidesExpand:  "google/gemini-2.5-flash",
  slidesCritic:  "google/gemini-2.5-flash",
  slidesVision:  "google/gemini-2.5-flash",
  slidesNarrate: "google/gemini-2.5-flash-lite",
  docs:          "google/gemini-2.5-flash",
  deepResearch:  "google/gemini-2.5-flash",
  // Strong, agentic coding model — purpose-built for tool calling & code edits.
  coding:        "qwen/qwen3-coder",
} as const;

/** Map an OpenRouter model id to the closest equivalent on the Lovable AI Gateway.
 *  Lovable Gateway only exposes a small whitelist (mostly Gemini Flash family),
 *  so any non-google model collapses to gemini-2.5-flash. */
export function lovableEquivalent(model: string): string {
  const m = (model || "").toLowerCase();
  if (m.includes("flash-lite")) return "google/gemini-2.5-flash-lite";
  if (m.includes("gemini-2.5-pro") || m.includes("/pro")) return "google/gemini-2.5-pro";
  if (m.includes("gemini") || m.includes("flash")) return "google/gemini-2.5-flash";
  // Fallback for anything else (claude/gpt/llama/etc.) — gateway only has Gemini.
  return "google/gemini-2.5-flash";
}

/** Map an OpenRouter model id to the closest Alibaba Qwen model (DashScope).
 *  DashScope serves an OpenAI-compatible endpoint and bills against the
 *  $200 Alibaba Cloud credit. We collapse to cheap qwen-turbo by default. */
export function dashscopeEquivalent(model: string): string {
  const m = (model || "").toLowerCase();
  if (m.includes("qwen-turbo") || m.includes("qwen-plus") || m.includes("qwen-max") || m.includes("qwen3-coder") || m.includes("qwen-vl")) {
    return model.includes("/") ? model.split("/").pop() || "qwen-plus" : model;
  }
  if (m.includes("flash-lite") || m.includes("lite") || m.includes("nano")) return "qwen-turbo";
  if (m.includes("pro") || m.includes("max") || m.includes("gpt-5") && !m.includes("mini") && !m.includes("nano")) return "qwen-max";
  if (m.includes("coder") || m.includes("code")) return "qwen3-coder-plus";
  if (m.includes("vl") || m.includes("vision") || m.includes("image")) return "qwen-vl-max";
  // Default: balanced model
  return "qwen-plus";
}

const DASHSCOPE_COMPATIBLE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
// Service-name aliases the Alibaba/Qwen key may be stored under in public.api_keys.
const DASHSCOPE_SERVICE_NAMES = [
  "alibaba", "alibaba cloud", "alibaba-cloud", "alibaba_cloud",
  "dashscope", "dash scope", "dash-scope", "dash_scope",
  "qwen", "aliyun", "ali", "qwen-dashscope", "qwen_dashscope", "alibaba-qwen",
];
const DASH_SERVICE_KEYS = new Set(DASHSCOPE_SERVICE_NAMES.map((name) => name.toLowerCase().replace(/[\s_-]+/g, "")));

let dashCached: { url: string; key: string; expiry: number } | null = null;

/** Returns DashScope (Alibaba) creds from env if set. */
export function getDashscope(): { url: string; key: string } | null {
  const key = Deno.env.get("DASHSCOPE_API_KEY") || Deno.env.get("QWEN_API_KEY") || Deno.env.get("ALIBABA_API_KEY");
  if (!key) return null;
  return { url: DASHSCOPE_COMPATIBLE_URL, key };
}

/** Returns DashScope (Alibaba) creds, preferring a key stored in public.api_keys
 *  (service = alibaba/dashscope/qwen/…), then falling back to env vars.
 *  This is the canonical resolver for chat — the Alibaba key lives in the DB. */
export async function getDashscopeKey(): Promise<{ url: string; key: string } | null> {
  if (dashCached && Date.now() < dashCached.expiry) return { url: dashCached.url, key: dashCached.key };
  try {
    const sb = admin();
    const { data } = await sb
      .from("api_keys")
      .select("service, api_key, is_active, is_blocked")
      .in("service", DASHSCOPE_SERVICE_NAMES)
      .limit(10);
    const row = (data || []).find((item) => {
      const serviceKey = String(item.service || "").toLowerCase().replace(/[\s_-]+/g, "");
      return DASH_SERVICE_KEYS.has(serviceKey) && item.is_active !== false && item.is_blocked !== true;
    });
    if (row?.api_key) {
      dashCached = { url: DASHSCOPE_COMPATIBLE_URL, key: row.api_key, expiry: Date.now() + TTL_MS };
      return { url: DASHSCOPE_COMPATIBLE_URL, key: row.api_key };
    }
  } catch (e) {
    console.warn("[llm-router] getDashscopeKey db error:", (e as Error).message);
  }
  return getDashscope();
}

/** Returns OpenRouter creds for Claude Code / Anthropic-compatible clients. */
export async function getOpenRouter(): Promise<{ url: string; key: string } | null> {
  return await getRouter();
}


/** Returns the Lovable AI Gateway endpoint + key (LOVABLE_API_KEY).
 *  This is the most reliable provider in Lovable-hosted projects: it is managed,
 *  billed via Lovable credits, and serves the google/gemini-* family used by
 *  ROUTER_MODELS. Used as a guaranteed fallback when OpenRouter is missing or
 *  failing so the chat never collapses to the "service busy" message. */
export function getLovableGateway(): { url: string; key: string } | null {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return null;
  return { url: "https://ai.gateway.lovable.dev/v1/chat/completions", key };
}

export type LLMProvider = "dashscope" | "openrouter" | "lovable";

export interface ResolvedLLM {
  url: string;
  key: string;
  provider: LLMProvider;
  /** Map an OpenRouter-style model slug to the right slug for this provider. */
  mapModel: (model: string) => string;
}

/** Unified resolver: prefer Alibaba (DashScope/Qwen), then OpenRouter, then the
 *  Lovable AI Gateway. Returns the endpoint, key and a model mapper so callers
 *  can keep passing OpenRouter-style slugs (e.g. ROUTER_MODELS.docs) and get the
 *  provider-correct model automatically. */
export async function getLLM(): Promise<ResolvedLLM | null> {
  const dash = await getDashscopeKey();
  if (dash) return { ...dash, provider: "dashscope", mapModel: dashscopeEquivalent };

  const or = await getRouter();
  if (or) return { ...or, provider: "openrouter", mapModel: (m: string) => m };

  const lov = getLovableGateway();
  if (lov) return { ...lov, provider: "lovable", mapModel: lovableEquivalent };

  return null;
}
