// slides-api — Unified public API for all slide operations.
//
// One endpoint, action-based routing. Designed to be called from an external
// website using a shared API key (header: x-api-key).
//
// Actions (POST body { action, ...params }):
//   - list_templates                       -> [{ template_id, name, description, ... }]
//   - get_template      { template_id }    -> template row + images
//   - generate          { topic, language?, slide_count?, template_id?, style?, user_id? }
//                                          -> SSE stream (forwarded from chat-slides-stream)
//   - export_pptx       { deck, filename? }-> { url } (forwarded from slides-export-pptx)
//   - list_projects     { user_id }        -> [project]
//   - get_project       { id }             -> project
//   - save_project      { project }        -> { id }
//   - delete_project    { id }             -> { ok: true }
//
// Auth: header `x-api-key: <SLIDES_API_KEY>` is required for every action.
// CORS: open (`*`) so external browsers can call it.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const API_KEY = Deno.env.get("SLIDES_API_KEY") ?? "";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(message: string, status = 400, extra: Record<string, unknown> = {}) {
  return json({ error: message, ...extra }, status);
}

async function forwardToFunction(name: string, body: unknown, extraHeaders: Record<string, string> = {}) {
  return await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_ROLE}`,
      apikey: ANON_KEY,
      ...extraHeaders,
    },
    body: JSON.stringify(body ?? {}),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Health check
  if (req.method === "GET") {
    return json({
      ok: true,
      service: "slides-api",
      actions: [
        "list_templates",
        "get_template",
        "generate",
        "export_pptx",
        "list_projects",
        "get_project",
        "save_project",
        "delete_project",
      ],
    });
  }

  if (req.method !== "POST") return err("Method not allowed", 405);

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return err("Invalid JSON body");
  }

  const action = String(payload.action ?? "").trim();
  if (!action) return err("Missing `action` field");

  // Internal actions called from the Lovable app via supabase.functions.invoke
  // (already gated by the project anon `apikey` header at the platform level).
  const INTERNAL_ACTIONS = new Set(["images_generate", "images_start", "images_status", "images_pdf"]);

  if (!INTERNAL_ACTIONS.has(action)) {
    // API key gate for external website callers
    if (!API_KEY) return err("Server is missing SLIDES_API_KEY secret", 500);
    const provided = req.headers.get("x-api-key") ?? "";
    if (provided !== API_KEY) return err("Unauthorized: invalid x-api-key", 401);
  }

  try {
    switch (action) {
      // ───── 2slides.com — image-designed slide deck (PDF) ─────
      case "images_pdf": {
        // CORS-friendly proxy for the generated PDF so pdfjs can render previews.
        const target = String(payload.url ?? "").trim();
        if (!target.startsWith("https://")) return err("Invalid `url`");
        const upstream = await fetch(target);
        if (!upstream.ok || !upstream.body) return err(`Upstream ${upstream.status}`, 502);
        return new Response(upstream.body, {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": upstream.headers.get("content-type") ?? "application/pdf",
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
      case "images_start":
      case "images_status":
      case "images_generate": {
        const TWOSLIDES_KEY = Deno.env.get("TWOSLIDES_API_KEY") ?? "";
        if (!TWOSLIDES_KEY) return err("Missing TWOSLIDES_API_KEY", 500);
        const BASE = "https://2slides.com/api/v1";
        const callTs = async (path: string, init: RequestInit) => {
          const r = await fetch(`${BASE}${path}`, {
            ...init,
            headers: {
              ...(init.headers || {}),
              Authorization: `Bearer ${TWOSLIDES_KEY}`,
              "Content-Type": "application/json",
            },
          });
          const text = await r.text();
          let j: any; try { j = JSON.parse(text); } catch { j = { raw: text }; }
          if (!r.ok) throw new Error(`${path}: ${j?.error || j?.message || `HTTP ${r.status}`}`);
          return j;
        };

        if (action === "images_status") {
          const jobId = String(payload.jobId ?? payload.job_id ?? "").trim();
          if (!jobId) return err("Missing `jobId`");
          const status = await callTs(`/jobs/${jobId}`, { method: "GET" });
          const d = status?.data ?? {};
          return json({
            status: d.status,
            url: d.downloadUrl,
            slideCount: d.slidePageCount,
            message: d.message,
            progress: d.progress,
          });
        }

        // images_start (and legacy images_generate just starts)
        const topic = String(payload.topic ?? "").trim();
        if (!topic || topic.length < 4) return err("Missing or too short `topic`");
        const slideCountReq = Number(payload.slide_count);
        const page = Number.isFinite(slideCountReq) && slideCountReq > 0 && slideCountReq <= 100
          ? Math.floor(slideCountReq) : 0;

        // Auto-detect language from topic (Arabic script → Arabic).
        const hasArabic = /[\u0600-\u06FF]/.test(topic);
        const responseLanguage = (typeof payload.language === "string" && payload.language && payload.language !== "Auto")
          ? payload.language
          : (hasArabic ? "Arabic" : "Auto");

        // Build a strong, deck-wide design-style brief so EVERY slide image in
        // this request uses the same palette, typography and visual identity.
        // The user asked us to author this on our side and keep it consistent
        // for all slides in one request to preserve context.
        const PALETTES = [
          { name: "Midnight Indigo", bg: "#0F172A", surface: "#1E293B", primary: "#6366F1", accent: "#E0E7FF", text: "#F8FAFC" },
          { name: "Warm Editorial",  bg: "#FAF7F2", surface: "#FFFFFF", primary: "#1F2937", accent: "#C2410C", text: "#111827" },
          { name: "Emerald Prestige",bg: "#064E3B", surface: "#0D7A5F", primary: "#C9A84C", accent: "#F5F0E0", text: "#ECFDF5" },
          { name: "Noir & Gold",     bg: "#0D0D0D", surface: "#1A1A1A", primary: "#C9A84C", accent: "#F0D78C", text: "#FAFAF7" },
          { name: "Cloud Minimal",   bg: "#FAFBFC", surface: "#FFFFFF", primary: "#3B82F6", accent: "#0F172A", text: "#0F172A" },
        ];
        const pick = PALETTES[Math.floor(Math.random() * PALETTES.length)];
        const designStyle = typeof payload.design_style === "string" && payload.design_style.trim()
          ? payload.design_style
          : [
              `Cohesive editorial deck — every slide MUST share the EXACT SAME visual identity (do not change palette or fonts between slides).`,
              `Palette "${pick.name}": background ${pick.bg}, surface ${pick.surface}, primary ${pick.primary}, accent ${pick.accent}, text ${pick.text}.`,
              `Typography: one bold sans-serif display for headlines, one clean sans-serif for body. Generous whitespace, strong hierarchy, large numerals.`,
              `Layout: full-bleed image accents, subtle geometric shapes, consistent margins and grid across all slides.`,
              `Imagery: photographic or abstract graphics tinted to match the palette. Maintain the same illustration style for every slide.`,
              hasArabic ? `Right-to-left aware. Use elegant Arabic typography (e.g. Tajawal / IBM Plex Sans Arabic).` : ``,
            ].filter(Boolean).join(" ");

        const start = await callTs("/slides/create-pdf-slides", {
          method: "POST",
          body: JSON.stringify({
            userInput: topic,
            designStyle,
            responseLanguage,
            page,
            contentDetail: "standard",
            mode: "async",
          }),
        });
        const jobId = start?.data?.jobId;
        if (!jobId) throw new Error("No jobId returned from 2slides");
        return json({ jobId, title: topic.slice(0, 80) });
      }

      // ───── Templates ─────
      case "list_templates": {
        const { data, error } = await admin
          .from("slide_templates")
          .select("template_id, name, description, template_engine, component_name, is_active")
          .eq("is_active", true)
          .order("name");
        if (error) throw error;
        return json({ templates: data ?? [] });
      }

      case "get_template": {
        const template_id = String(payload.template_id ?? "");
        if (!template_id) return err("Missing `template_id`");
        const [tpl, imgs] = await Promise.all([
          admin.from("slide_templates").select("*").eq("template_id", template_id).maybeSingle(),
          admin
            .from("template_images")
            .select("image_url, display_order")
            .eq("template_id", template_id)
            .order("display_order"),
        ]);
        if (tpl.error) throw tpl.error;
        if (!tpl.data) return err("Template not found", 404);
        return json({ template: tpl.data, images: imgs.data ?? [] });
      }

      // ───── Generation (SSE pass-through) ─────
      case "generate": {
        const upstream = await forwardToFunction("chat-slides-stream", {
          topic: payload.topic,
          language: payload.language,
          slide_count: payload.slide_count,
          template_id: payload.template_id,
          style: payload.style,
          user_id: payload.user_id,
          ...payload,
        });
        return new Response(upstream.body, {
          status: upstream.status,
          headers: {
            ...corsHeaders,
            "Content-Type": upstream.headers.get("content-type") ?? "text/event-stream",
            "Cache-Control": "no-cache",
          },
        });
      }

      // ───── Export to PPTX ─────
      case "export_pptx": {
        if (!payload.deck) return err("Missing `deck`");
        const upstream = await forwardToFunction("slides-export-pptx", {
          deck: payload.deck,
          filename: payload.filename,
          conversation_id: payload.conversation_id,
        });
        const text = await upstream.text();
        return new Response(text, {
          status: upstream.status,
          headers: {
            ...corsHeaders,
            "Content-Type": upstream.headers.get("content-type") ?? "application/json",
          },
        });
      }

      // ───── Projects CRUD ─────
      case "list_projects": {
        const user_id = String(payload.user_id ?? "");
        if (!user_id) return err("Missing `user_id`");
        const { data, error } = await admin
          .from("slide_projects")
          .select("id, title, topic, style, template_id, slide_count, status, pptx_url, created_at, updated_at")
          .eq("user_id", user_id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return json({ projects: data ?? [] });
      }

      case "get_project": {
        const id = String(payload.id ?? "");
        if (!id) return err("Missing `id`");
        const { data, error } = await admin
          .from("slide_projects")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        if (error) throw error;
        if (!data) return err("Project not found", 404);
        return json({ project: data });
      }

      case "save_project": {
        const p = (payload.project ?? {}) as Record<string, unknown>;
        if (!p.user_id) return err("Missing `project.user_id`");
        const row = {
          id: p.id,
          user_id: p.user_id,
          title: p.title ?? "Untitled",
          topic: p.topic ?? null,
          style: p.style ?? null,
          template_id: p.template_id ?? null,
          slide_count: p.slide_count ?? null,
          status: p.status ?? "draft",
          pptx_url: p.pptx_url ?? null,
          slides_data: p.slides_data ?? null,
          updated_at: new Date().toISOString(),
        };
        const { data, error } = await admin
          .from("slide_projects")
          .upsert(row, { onConflict: "id" })
          .select("id")
          .single();
        if (error) throw error;
        return json({ id: data.id });
      }

      case "delete_project": {
        const id = String(payload.id ?? "");
        if (!id) return err("Missing `id`");
        const { error } = await admin.from("slide_projects").delete().eq("id", id);
        if (error) throw error;
        return json({ ok: true });
      }

      default:
        return err(`Unknown action: ${action}`, 400);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[slides-api]", action, msg);
    return err(msg, 500);
  }
});
