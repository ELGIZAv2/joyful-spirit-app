// Telegram bot webhook — receives media uploads from admins and stores them as
// templates in `showcase_items`. Reply `/trend` to a media message to toggle
// the trending flag (pinned to the top of the gallery).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ImageMagick, initializeImageMagick, MagickFormat } from "https://deno.land/x/imagemagick_deno@0.0.26/mod.ts";

let magickReady: Promise<void> | null = null;
function ensureMagick(): Promise<void> {
  if (!magickReady) magickReady = initializeImageMagick();
  return magickReady;
}

async function convertToWebp(bytes: Uint8Array): Promise<Uint8Array> {
  await ensureMagick();
  return await new Promise<Uint8Array>((resolve, reject) => {
    try {
      ImageMagick.read(bytes, (img) => {
        img.quality = 92;
        img.write(MagickFormat.Webp, (data) => resolve(new Uint8Array(data)));
      });
    } catch (e) { reject(e); }
  });
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const db = createClient(SUPABASE_URL, SERVICE_KEY);

async function tg(method: string, payload: Record<string, unknown>) {
  if (!BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN not set");
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return r.json();
}

const KEY_BUTTONS = {
  inline_keyboard: [
    [
      { text: "➕ Serper Key", callback_data: "addkey:serper" },
      { text: "➕ Firecrawl Key", callback_data: "addkey:firecrawl" },
    ],
    [{ text: "➕ Leonardo Key", callback_data: "addkey:leonardo" }],
  ],
};

async function getFileUrl(file_id: string): Promise<string | null> {
  const res = await tg("getFile", { file_id });
  const path = res?.result?.file_path;
  if (!path) return null;
  return `https://api.telegram.org/file/bot${BOT_TOKEN}/${path}`;
}

async function isAdmin(chat_id: number): Promise<boolean> {
  const { data } = await db
    .from("bot_admins")
    .select("id")
    .eq("telegram_chat_id", chat_id)
    .maybeSingle();
  return !!data;
}

async function reply(chat_id: number, text: string, reply_to?: number) {
  await tg("sendMessage", {
    chat_id,
    text,
    reply_to_message_id: reply_to,
    parse_mode: "HTML",
  });
}

// Shared secret for internal admin-notification calls (DB trigger + pg_cron).
const INTERNAL_SECRET = "mgs_notify_7K9pQ2rV4nL8wX3cF6tY1bN5jH0aZ_v1";
const ADMIN_CHAT_ID = "6657246146";

function safeEqual(a: string | null, b: string): boolean {
  if (!a || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function fmtMoney(cents: number): string { return `$${(cents / 100).toFixed(2)}`; }

async function handleAdminNotify(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({} as any));
  const action = body.action ?? "stats";
  try {
    if (action === "signup") {
      const { count: total } = await db.from("profiles").select("*", { count: "exact", head: true });
      const msg = [
        "🎉 <b>مستخدم جديد سجّل</b>",
        "",
        `👤 <b>الاسم:</b> ${body.name ?? "—"}`,
        `📧 <b>الإيميل:</b> <code>${body.email ?? "—"}</code>`,
        `🆔 <code>${body.user_id ?? "—"}</code>`,
        "",
        `📊 <b>إجمالي المستخدمين:</b> ${total ?? "?"}`,
      ].join("\n");
      await tg("sendMessage", { chat_id: ADMIN_CHAT_ID, text: msg, parse_mode: "HTML", disable_web_page_preview: true });
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "stats") {
      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [
        newUsers, totalUsers,
        newMessages, dayMessages,
        newImages, dayImages,
        newSubs, daySubs,
        hourPayments, dayPayments,
      ] = await Promise.all([
        db.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", since),
        db.from("profiles").select("*", { count: "exact", head: true }),
        db.from("messages").select("*", { count: "exact", head: true }).gte("created_at", since),
        db.from("messages").select("*", { count: "exact", head: true }).gte("created_at", dayAgo),
        db.from("generation_jobs").select("*", { count: "exact", head: true }).eq("job_type", "image").gte("created_at", since),
        db.from("generation_jobs").select("*", { count: "exact", head: true }).eq("job_type", "image").gte("created_at", dayAgo),
        db.from("subscriptions").select("*", { count: "exact", head: true }).gte("created_at", since),
        db.from("subscriptions").select("*", { count: "exact", head: true }).gte("created_at", dayAgo),
        db.from("subscriptions").select("amount_cents").gte("created_at", since),
        db.from("subscriptions").select("amount_cents").gte("created_at", dayAgo),
      ]);
      const sumCents = (rows: any) => (rows.data ?? []).reduce((a: number, r: any) => a + (r.amount_cents ?? 0), 0);
      const msg = [
        "📈 <b>تقرير الساعة</b>",
        `<i>${new Date().toISOString().replace("T", " ").slice(0, 16)} UTC</i>`,
        "",
        "👥 <b>المستخدمين</b>",
        `   • جدد آخر ساعة: <b>${newUsers.count ?? 0}</b>`,
        `   • إجمالي: <b>${totalUsers.count ?? 0}</b>`,
        "",
        "💬 <b>رسائل الشات</b>",
        `   • آخر ساعة: <b>${newMessages.count ?? 0}</b>`,
        `   • آخر 24 ساعة: <b>${dayMessages.count ?? 0}</b>`,
        "",
        "🎨 <b>توليد الصور</b>",
        `   • آخر ساعة: <b>${newImages.count ?? 0}</b>`,
        `   • آخر 24 ساعة: <b>${dayImages.count ?? 0}</b>`,
        "",
        "💰 <b>الاشتراكات والإيرادات</b>",
        `   • اشتراكات (ساعة): <b>${newSubs.count ?? 0}</b>`,
        `   • اشتراكات (24 ساعة): <b>${daySubs.count ?? 0}</b>`,
        `   • إيراد آخر ساعة: <b>${fmtMoney(sumCents(hourPayments))}</b>`,
        `   • إيراد آخر 24 ساعة: <b>${fmtMoney(sumCents(dayPayments))}</b>`,
      ].join("\n");
      await tg("sendMessage", { chat_id: ADMIN_CHAT_ID, text: msg, parse_mode: "HTML", disable_web_page_preview: true });
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("admin-notify error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  // Internal admin notification path (DB trigger + pg_cron) — must run before
  // parsing as a Telegram update so it doesn't pollute the webhook flow.
  if (safeEqual(req.headers.get("X-Internal-Secret"), INTERNAL_SECRET)) {
    return await handleAdminNotify(req);
  }

  let update: any;
  try { update = await req.json(); } catch { return new Response("bad json", { status: 400 }); }


  // ---- callback_query (inline button taps) ----
  if (update.callback_query) {
    const cq = update.callback_query;
    const cb_chat_id = cq.message?.chat?.id as number;
    const cb_data = String(cq.data ?? "");
    try { await tg("answerCallbackQuery", { callback_query_id: cq.id }); } catch { /* ignore */ }

    if (cb_chat_id && cb_data.startsWith("addkey:")) {
      const svc = cb_data.split(":")[1];
      if (!["serper", "firecrawl", "leonardo"].includes(svc)) {
        await reply(cb_chat_id, "Unknown service.");
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }
      if (!(await isAdmin(cb_chat_id))) {
        await reply(cb_chat_id, "⛔ Admins only.");
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }
      await db.from("bot_admin_pending").upsert({
        telegram_chat_id: cb_chat_id,
        awaiting_service: svc,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }, { onConflict: "telegram_chat_id" });
      await reply(cb_chat_id, `🔑 Send the <b>${svc}</b> API key now in a single message.\n(Expires in 10 minutes — send /cancel to abort.)`);
    }
    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
  }

  const message = update.message ?? update.edited_message ?? update.channel_post;
  const update_id = update.update_id as number;
  if (!message || typeof update_id !== "number") {
    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
  }

  // Idempotency
  const { error: dupErr } = await db
    .from("telegram_processed_updates")
    .insert({ update_id });
  if (dupErr && dupErr.code === "23505") {
    return new Response(JSON.stringify({ ok: true, duplicate: true }), { headers: corsHeaders });
  }

  const chat_id = message.chat?.id as number;
  const text = (message.text ?? message.caption ?? "").trim();

  try {
    // /start — info + inline buttons
    if (text.startsWith("/start")) {
      await tg("sendMessage", {
        chat_id,
        parse_mode: "HTML",
        text: [
          "👋 <b>Megsy Templates Bot</b>",
          "",
          `Your chat ID: <code>${chat_id}</code>`,
          "",
          "Admins can send a photo or video with a caption and it will be added to the Media Hub gallery.",
          "",
          "Commands:",
          "• <b>Send photo/video</b> + caption → adds template",
          "• <b>Reply /trend</b> to a media → pin to top",
          "• <b>Reply /untrend</b> → unpin",
          "• <b>Reply /delete</b> → remove template",
          "• <b>/claim</b> → claim admin (only if no admins exist)",
          "",
          "🔑 <b>API key pool</b> — tap a button to add a key (admins only):",
        ].join("\n"),
        reply_markup: KEY_BUTTONS,
      });
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // /claim — first user becomes admin
    if (text.startsWith("/claim")) {
      const { count } = await db.from("bot_admins").select("*", { count: "exact", head: true });
      if ((count ?? 0) === 0) {
        await db.from("bot_admins").insert({ telegram_chat_id: chat_id });
        await reply(chat_id, "✅ You are now the bot admin.");
      } else {
        await reply(chat_id, "❌ An admin already exists. Ask them to add you.");
      }
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    if (text === "/cancel") {
      await db.from("bot_admin_pending").delete().eq("telegram_chat_id", chat_id);
      await reply(chat_id, "Cancelled.");
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // /keys — show the inline buttons again
    if (text.startsWith("/keys")) {
      if (!(await isAdmin(chat_id))) {
        await reply(chat_id, "⛔ Admins only.");
      } else {
        await tg("sendMessage", {
          chat_id, parse_mode: "HTML",
          text: "🔑 Add an API key to the rotation pool ($5 credit cap per key):",
          reply_markup: KEY_BUTTONS,
        });
      }
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // Pending key input handler — must run BEFORE the admin gate would block a non-admin,
    // and BEFORE media handling so a pasted key isn't treated as a caption.
    {
      const { data: pending } = await db
        .from("bot_admin_pending")
        .select("awaiting_service, expires_at")
        .eq("telegram_chat_id", chat_id)
        .maybeSingle();
      if (pending && text && !text.startsWith("/")) {
        if (new Date(pending.expires_at).getTime() < Date.now()) {
          await db.from("bot_admin_pending").delete().eq("telegram_chat_id", chat_id);
          await reply(chat_id, "⏰ Expired. Tap the button again.");
          return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
        }
        if (!(await isAdmin(chat_id))) {
          await db.from("bot_admin_pending").delete().eq("telegram_chat_id", chat_id);
        } else {
          const svc = pending.awaiting_service;
          const { data: newId, error: addErr } = await db.rpc("admin_add_api_key", {
            p_service: svc,
            p_key: text,
            p_label: `${svc} (tg:${chat_id})`,
            p_credit_limit: 5,
          });
          await db.from("bot_admin_pending").delete().eq("telegram_chat_id", chat_id);
          // Delete the user's message so the raw key doesn't linger in chat history.
          try { await tg("deleteMessage", { chat_id, message_id: message.message_id }); } catch { /* ignore */ }
          if (addErr) {
            await reply(chat_id, `❌ Failed to add key: ${addErr.message}`);
          } else {
            await reply(chat_id, `✅ Added <b>${svc}</b> key (id <code>${newId}</code>) with $5 credit cap.`);
          }
          return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
        }
      }
    }

    const admin = await isAdmin(chat_id);
    if (!admin) {
      await reply(chat_id, `⛔ Not authorized. Your chat id: <code>${chat_id}</code>\nSend /claim if no admins exist.`);
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }


    // Reply commands on a media message
    const replied = message.reply_to_message;
    if (replied && (text === "/trend" || text === "/untrend" || text === "/delete")) {
      // Locate the showcase item by stored telegram message id
      const { data: item } = await db
        .from("showcase_items")
        .select("id, is_trending")
        .eq("source", `telegram:${chat_id}:${replied.message_id}`)
        .maybeSingle();
      if (!item) { await reply(chat_id, "Item not found.", message.message_id); return new Response("ok"); }

      if (text === "/delete") {
        await db.from("showcase_items").delete().eq("id", item.id);
        await reply(chat_id, "🗑️ Deleted.", message.message_id);
      } else {
        const next = text === "/trend";
        await db.from("showcase_items").update({
          is_trending: next,
          trending_at: next ? new Date().toISOString() : null,
        }).eq("id", item.id);
        await reply(chat_id, next ? "⭐ Pinned as Trending." : "Unpinned.", message.message_id);
      }
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // Media upload — photo or video
    let media_type: "image" | "video" | null = null;
    let file_id: string | null = null;
    let thumb_id: string | null = null;

    if (message.photo?.length) {
      media_type = "image";
      file_id = message.photo[message.photo.length - 1].file_id;
    } else if (message.video) {
      media_type = "video";
      file_id = message.video.file_id;
      thumb_id = message.video.thumb?.file_id ?? null;
    } else if (message.animation) {
      media_type = "video";
      file_id = message.animation.file_id;
      thumb_id = message.animation.thumb?.file_id ?? null;
    } else if (message.document?.mime_type?.startsWith("image/")) {
      media_type = "image";
      file_id = message.document.file_id;
    } else if (message.document?.mime_type?.startsWith("video/")) {
      media_type = "video";
      file_id = message.document.file_id;
      thumb_id = message.document.thumb?.file_id ?? null;
    }

    if (!media_type || !file_id) {
      await reply(chat_id, "Send a photo or video with a caption to add a template.");
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    const media_url = await getFileUrl(file_id);
    if (!media_url) {
      await reply(chat_id, "Could not download the file from Telegram.");
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }
    let thumbnail_url = thumb_id ? await getFileUrl(thumb_id) : null;

    // For images: download, convert to WebP, upload to Supabase Storage
    // For videos: download as-is and upload to Storage (Telegram URLs are not permanent)
    let final_media_url = media_url;
    if (media_type === "image") {
      try {
        const dl = await fetch(media_url);
        if (!dl.ok) throw new Error(`download failed ${dl.status}`);
        const inputBytes = new Uint8Array(await dl.arrayBuffer());
        const webpBytes = await convertToWebp(inputBytes);
        const path = `telegram/${chat_id}/${message.message_id}-${Date.now()}.webp`;
        const { error: upErr } = await db.storage
          .from("showcase-media")
          .upload(path, webpBytes, { contentType: "image/webp", upsert: true });
        if (upErr) throw upErr;
        const { data: pub } = db.storage.from("showcase-media").getPublicUrl(path);
        final_media_url = pub.publicUrl;
      } catch (e) {
        console.error("webp conversion failed, falling back to telegram url", e);
      }
    } else if (media_type === "video") {
      try {
        const dl = await fetch(media_url);
        if (!dl.ok) throw new Error(`download failed ${dl.status}`);
        const inputBytes = new Uint8Array(await dl.arrayBuffer());
        const ext = media_url.split(".").pop()?.toLowerCase() || "mp4";
        const safeExt = ["mp4", "webm", "mov", "m4v"].includes(ext) ? ext : "mp4";
        const contentType = safeExt === "webm" ? "video/webm" : "video/mp4";
        const path = `telegram/${chat_id}/${message.message_id}-${Date.now()}.${safeExt}`;
        const { error: upErr } = await db.storage
          .from("showcase-media")
          .upload(path, inputBytes, { contentType, upsert: true });
        if (upErr) throw upErr;
        const { data: pub } = db.storage.from("showcase-media").getPublicUrl(path);
        final_media_url = pub.publicUrl;
      } catch (e) {
        console.error("video upload failed, falling back to telegram url", e);
      }

      // Upload thumbnail too (as webp) so we have permanent thumb
      if (thumbnail_url) {
        try {
          const dl = await fetch(thumbnail_url);
          if (dl.ok) {
            const tbytes = new Uint8Array(await dl.arrayBuffer());
            const webpThumb = await convertToWebp(tbytes);
            const tpath = `telegram/${chat_id}/${message.message_id}-${Date.now()}-thumb.webp`;
            const { error: tErr } = await db.storage
              .from("showcase-media")
              .upload(tpath, webpThumb, { contentType: "image/webp", upsert: true });
            if (!tErr) {
              thumbnail_url = db.storage.from("showcase-media").getPublicUrl(tpath).data.publicUrl;
            }
          }
        } catch (e) {
          console.error("thumb upload failed", e);
        }
      }
    }

    // Parse caption: first line = category (optional, prefixed with #), rest = prompt
    const lines = text.split("\n").map((s) => s.trim()).filter(Boolean);
    let category: string | null = null;
    let prompt = text;
    if (lines[0]?.startsWith("#")) {
      category = lines[0].replace(/^#/, "").trim() || null;
      prompt = lines.slice(1).join("\n").trim();
    }

    const { error: insErr } = await db.from("showcase_items").insert({
      media_url: final_media_url,
      media_type,
      thumbnail_url,
      prompt: prompt || "Untitled",
      category: category || "All",
      model_id: "telegram",
      model_name: "Telegram Upload",
      aspect_ratio: "1:1",
      quality: "standard",
      display_order: 0,
      source: `telegram:${chat_id}:${message.message_id}`,
    });

    if (insErr) {
      await reply(chat_id, `❌ Failed: ${insErr.message}`, message.message_id);
    } else {
      await reply(chat_id, "✅ Template added. Reply /trend to pin it.", message.message_id);
    }
  } catch (e) {
    console.error("telegram-webhook error", e);
    try { await reply(chat_id, `Error: ${(e as Error).message}`); } catch {}
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
