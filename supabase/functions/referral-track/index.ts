// Unified referral API — single edge function for all referral operations.
// Actions: track, stats, share, tier, shortlink, milestones, email-invite, payout
// Uses service role to bypass RLS; verifies user JWT for protected actions.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  const token = auth.replace(/^Bearer\s+/i, "");
  const { data } = await admin.auth.getUser(token);
  return data.user?.id ?? null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ───────────────────────── handlers ─────────────────────────

async function handleTrack(req: Request, body: Record<string, unknown>) {
  const rawCode = typeof body.code === "string" ? body.code : "";
  const code = rawCode.trim().toUpperCase().slice(0, 64);
  if (!code) return json({ error: "code required" }, 400);

  const action = (body.action as string) || "click";
  const utm_source = (body.utm_source as string) || null;
  const utm_medium = (body.utm_medium as string) || null;
  const utm_campaign = (body.utm_campaign as string) || null;
  const referer = (body.referer as string) || req.headers.get("referer");
  const landing_path = (body.landing_path as string) || null;
  const converted_user_id = (body.converted_user_id as string) || null;

  const { data: codeRow } = await admin
    .from("referral_codes").select("user_id, code").ilike("code", code).maybeSingle();
  const referrer_user_id = codeRow?.user_id || null;

  // Fraud check: don't credit self-referrals
  if (converted_user_id && referrer_user_id === converted_user_id) {
    return json({ ok: true, ignored: "self-referral" });
  }

  if (action === "convert" && converted_user_id) {
    const { data: existing } = await admin
      .from("referral_clicks").select("id").eq("code", code)
      .is("converted_user_id", null).order("created_at", { ascending: false }).limit(1);
    if (existing && existing.length > 0) {
      await admin.from("referral_clicks").update({
        converted_user_id, converted_at: new Date().toISOString(),
      }).eq("id", existing[0].id);
    } else {
      await admin.from("referral_clicks").insert({
        code, referrer_user_id, converted_user_id,
        converted_at: new Date().toISOString(),
        utm_source, utm_medium, utm_campaign, referer, landing_path,
      });
    }
    return json({ ok: true, action: "convert" });
  }

  // Default: record click + simple rate-limit per IP+code (1 click / 60s)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("cf-connecting-ip") || "";
  const country = req.headers.get("cf-ipcountry") || null;
  const user_agent = req.headers.get("user-agent") || null;
  const ip_hash = ip ? await sha256(ip + ":" + code) : null;

  if (ip_hash) {
    const since = new Date(Date.now() - 60_000).toISOString();
    const { data: recent } = await admin.from("referral_clicks")
      .select("id").eq("code", code).eq("ip_hash", ip_hash).gte("created_at", since).limit(1);
    if (recent && recent.length > 0) return json({ ok: true, deduped: true });
  }

  const { error } = await admin.from("referral_clicks").insert({
    code, referrer_user_id, ip_hash, user_agent, referer,
    utm_source, utm_medium, utm_campaign, country, landing_path,
  });
  if (error) throw error;
  return json({ ok: true, valid: !!referrer_user_id });
}

async function handleStats(userId: string) {
  // Parallel fetches
  const [clicksRes, refsRes, earnsRes, milesRes] = await Promise.all([
    admin.from("referral_clicks")
      .select("id, utm_source, utm_medium, utm_campaign, country, referer, converted_user_id, created_at")
      .eq("referrer_user_id", userId).order("created_at", { ascending: false }).limit(1000),
    admin.from("referrals").select("id, status, created_at").eq("referrer_id", userId),
    admin.from("referral_earnings").select("amount, available_at, created_at").eq("referrer_id", userId),
    admin.from("referral_milestones").select("milestone_key, achieved_at").eq("user_id", userId),
  ]);

  const clicks = clicksRes.data || [];
  const referrals = refsRes.data || [];
  const earnings = earnsRes.data || [];
  const milestones = milesRes.data || [];

  const totalClicks = clicks.length;
  const conversions = clicks.filter((c) => c.converted_user_id).length;
  const convRate = totalClicks > 0 ? Math.round((conversions / totalClicks) * 100) : 0;
  const totalEarned = earnings.reduce((s, e) => s + Number(e.amount), 0);
  const now = Date.now();
  const pendingEarnings = earnings
    .filter((e) => new Date(e.available_at).getTime() > now)
    .reduce((s, e) => s + Number(e.amount), 0);
  const availableEarnings = totalEarned - pendingEarnings;

  // Top sources
  const sourceMap = new Map<string, { clicks: number; conv: number }>();
  for (const c of clicks) {
    const src = c.utm_source || (c.referer ? new URL(c.referer).hostname.replace(/^www\./, "") : "direct");
    const e = sourceMap.get(src) || { clicks: 0, conv: 0 };
    e.clicks++; if (c.converted_user_id) e.conv++;
    sourceMap.set(src, e);
  }
  const topSources = Array.from(sourceMap.entries())
    .map(([source, v]) => ({ source, clicks: v.clicks, conversions: v.conv }))
    .sort((a, b) => b.clicks - a.clicks).slice(0, 5);

  // Country breakdown
  const countryMap = new Map<string, number>();
  for (const c of clicks) {
    const k = c.country || "??";
    countryMap.set(k, (countryMap.get(k) || 0) + 1);
  }
  const topCountries = Array.from(countryMap.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count).slice(0, 5);

  // Daily timeline (last 30 days)
  const days: Record<string, { clicks: number; conv: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 86400_000).toISOString().slice(0, 10);
    days[d] = { clicks: 0, conv: 0 };
  }
  for (const c of clicks) {
    const d = c.created_at.slice(0, 10);
    if (days[d]) { days[d].clicks++; if (c.converted_user_id) days[d].conv++; }
  }
  const timeline = Object.entries(days).map(([date, v]) => ({ date, ...v }));

  // Peak click hour
  const hours = new Array(24).fill(0);
  for (const c of clicks) hours[new Date(c.created_at).getUTCHours()]++;
  const peakHour = hours.indexOf(Math.max(...hours));

  // Streak (consecutive days with at least one click)
  let streak = 0;
  const clickDates = new Set(clicks.map((c) => c.created_at.slice(0, 10)));
  for (let i = 0; ; i++) {
    const d = new Date(now - i * 86400_000).toISOString().slice(0, 10);
    if (clickDates.has(d)) streak++; else break;
  }

  // Personal best day
  const bestDay = Object.entries(days).reduce(
    (best, [date, v]) => (v.clicks > best.clicks ? { date, clicks: v.clicks } : best),
    { date: "", clicks: 0 },
  );

  // Auto-award milestones
  const earned = new Set(milestones.map((m) => m.milestone_key));
  const toAward: string[] = [];
  if (referrals.length >= 1 && !earned.has("first_referral")) toAward.push("first_referral");
  if (referrals.length >= 10 && !earned.has("ten_referrals")) toAward.push("ten_referrals");
  if (totalEarned >= 10 && !earned.has("first_10_dollars")) toAward.push("first_10_dollars");
  if (totalEarned >= 100 && !earned.has("first_100_dollars")) toAward.push("first_100_dollars");
  if (streak >= 7 && !earned.has("week_streak")) toAward.push("week_streak");
  if (toAward.length > 0) {
    await admin.from("referral_milestones").insert(toAward.map((milestone_key) => ({ user_id: userId, milestone_key })));
    toAward.forEach((k) => milestones.push({ milestone_key: k, achieved_at: new Date().toISOString() }));
  }

  return json({
    totalClicks, conversions, convRate,
    totalEarned, availableEarnings, pendingEarnings,
    signups: referrals.length,
    topSources, topCountries, timeline,
    peakHour, streak, bestDay,
    milestones,
  });
}

async function handleTier(userId: string) {
  const { data } = await admin.rpc("get_user_referral_tier", { _user_id: userId });
  const row = (data && data[0]) || { tier_name: "Bronze", commission_rate: 0.2, conversions: 0 };
  // Hidden thresholds — do NOT return min_conversions or "next tier" info
  return json({
    tier_name: row.tier_name,
    commission_rate: Number(row.commission_rate),
  });
}

async function handleShare(userId: string, body: Record<string, unknown>) {
  const { data: codeRow } = await admin
    .from("referral_codes").select("code").eq("user_id", userId).maybeSingle();
  if (!codeRow) return json({ error: "no code" }, 404);

  const origin = (body.origin as string) || "https://megsyai.com";
  const url = `${origin}/ref/${codeRow.code}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&margin=10&data=${encodeURIComponent(url)}`;
  const msg = (body.message as string) || `Try Megsy AI with my invite — you get a bonus, I get a small reward.`;
  const text = encodeURIComponent(`${msg}\n${url}`);
  const subject = encodeURIComponent("You're invited to Megsy AI");

  return json({
    code: codeRow.code,
    url,
    qr_url: qrUrl,
    share: {
      whatsapp: `https://wa.me/?text=${text}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(msg)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      email: `mailto:?subject=${subject}&body=${text}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
  });
}

async function handleShortlink(userId: string, body: Record<string, unknown>) {
  const { data: codeRow } = await admin
    .from("referral_codes").select("code").eq("user_id", userId).maybeSingle();
  if (!codeRow) return json({ error: "no code" }, 404);

  // Generate slug from body or auto
  let slug = (body.slug as string)?.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32);
  if (!slug) slug = crypto.randomUUID().slice(0, 8);

  const { error } = await admin.from("referral_shortlinks").insert({
    slug, user_id: userId, code: codeRow.code,
    target_path: (body.target_path as string) || "/",
    utm_source: (body.utm_source as string) || null,
    utm_medium: (body.utm_medium as string) || null,
    utm_campaign: (body.utm_campaign as string) || null,
  });
  if (error) {
    if (error.code === "23505") return json({ error: "slug taken" }, 409);
    throw error;
  }
  return json({ ok: true, slug });
}

async function handleEmailInvite(userId: string, body: Record<string, unknown>) {
  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    return json({ error: "Email not configured" }, 503);
  }
  const emails = Array.isArray(body.emails) ? (body.emails as string[]).slice(0, 10) : [];
  if (emails.length === 0) return json({ error: "emails required" }, 400);

  const { data: codeRow } = await admin
    .from("referral_codes").select("code").eq("user_id", userId).maybeSingle();
  if (!codeRow) return json({ error: "no code" }, 404);

  const origin = (body.origin as string) || "https://megsyai.com";
  const url = `${origin}/ref/${codeRow.code}`;
  const html = `<div style="font-family:system-ui;padding:24px"><h2>You're invited to Megsy AI</h2>
    <p>Your friend invited you. Sign up using this link to claim your bonus:</p>
    <p><a href="${url}" style="background:#000;color:#fff;padding:12px 20px;text-decoration:none;border-radius:8px">Join Megsy AI</a></p>
    <p style="color:#888;font-size:12px">Or copy: ${url}</p></div>`;

  const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: "Megsy AI <onboarding@resend.dev>",
      to: emails, subject: "You're invited to Megsy AI", html,
    }),
  });
  const data = await res.json();
  return json({ ok: res.ok, result: data });
}

// ───────────────────────── router ─────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const op = (body.op as string) || "track";

    // Public ops (no auth required)
    if (op === "track") return await handleTrack(req, body);

    // Authed ops
    const userId = await getUserId(req);
    if (!userId) return json({ error: "unauthorized" }, 401);

    switch (op) {
      case "stats": return await handleStats(userId);
      case "tier": return await handleTier(userId);
      case "share": return await handleShare(userId, body);
      case "shortlink": return await handleShortlink(userId, body);
      case "email-invite": return await handleEmailInvite(userId, body);
      default: return json({ error: `unknown op: ${op}` }, 400);
    }
  } catch (e) {
    return json({ error: (e as Error).message || "failed" }, 500);
  }
});
