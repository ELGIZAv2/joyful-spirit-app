// Sends workspace-related notifications (invites, etc.) via Resend.
// Auth: caller must be a workspace admin/owner. Validates server-side.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "Megsy <noreply@megsyai.com>";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function validEmail(s: unknown): s is string {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length < 255;
}

function validUrl(s: unknown): s is string {
  if (typeof s !== "string" || s.length > 2048) return false;
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return { ok: false, error: "resend_not_configured" };
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    return { ok: false, error: `resend_${r.status}`, detail: t.slice(0, 200) };
  }
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  try {
    const auth = req.headers.get("Authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "");
    if (!token) return json(401, { error: "unauthorized" });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) return json(401, { error: "unauthorized" });
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const type = typeof body?.type === "string" ? body.type : "";
    const workspace_id = typeof body?.workspace_id === "string" ? body.workspace_id : "";
    const workspace_name = typeof body?.workspace_name === "string" ? body.workspace_name.slice(0, 120) : "Workspace";
    const to = body?.to;
    const link = body?.link;

    const IN_APP_TYPES = new Set(["task_assigned", "task_comment", "task_mentioned", "member_added"]);
    if (type !== "invite" && !IN_APP_TYPES.has(type)) return json(400, { error: "invalid_type" });
    if (!workspace_id) return json(400, { error: "workspace_id_required" });
    if (type === "invite") {
      if (!validEmail(to)) return json(400, { error: "invalid_email" });
      if (!validUrl(link)) return json(400, { error: "invalid_link" });
    }

    // Auth check: caller must own or admin the workspace.
    const { data: ws } = await admin
      .from("workspaces")
      .select("id, owner_id, name")
      .eq("id", workspace_id)
      .maybeSingle();
    if (!ws) return json(404, { error: "workspace_not_found" });

    let isAdmin = ws.owner_id === userId;
    let isMember = isAdmin;
    if (!isAdmin) {
      const { data: mem } = await admin
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspace_id)
        .eq("user_id", userId)
        .maybeSingle();
      isAdmin = mem?.role === "admin";
      isMember = !!mem;
    }
    // Invites require admin; in-app workspace notifications only require membership.
    if (type === "invite" && !isAdmin) return json(403, { error: "forbidden" });
    if (IN_APP_TYPES.has(type) && !isMember) return json(403, { error: "forbidden" });

    if (IN_APP_TYPES.has(type)) {
      const target = typeof body?.assignee_id === "string" ? body.assignee_id
        : typeof body?.user_id === "string" ? body.user_id : "";
      if (!target) return json(400, { error: "target_user_required" });
      if (target === userId) return json(200, { ok: true, skipped: "self" });
      // Target must be a workspace member.
      const { data: tm } = await admin
        .from("workspace_members")
        .select("user_id")
        .eq("workspace_id", workspace_id)
        .eq("user_id", target)
        .maybeSingle();
      if (!tm) return json(403, { error: "target_not_member" });

      const safeTitle = String(body?.title ?? "").slice(0, 200);
      const wsName = ws.name || workspace_name;
      const titleMap: Record<string, string> = {
        task_assigned: `New task in ${wsName}`,
        task_comment: `New comment in ${wsName}`,
        task_mentioned: `You were mentioned in ${wsName}`,
        member_added: `Added to ${wsName}`,
      };
      const messageMap: Record<string, string> = {
        task_assigned: safeTitle ? `Assigned: ${safeTitle}` : "You have a new task",
        task_comment: safeTitle ? `On: ${safeTitle}` : "New comment on a task",
        task_mentioned: safeTitle ? `In: ${safeTitle}` : "You were mentioned",
        member_added: `You've been added to ${wsName}`,
      };
      const { error: nerr } = await admin.from("notifications").insert({
        user_id: target,
        type,
        title: titleMap[type],
        message: messageMap[type],
        read: false,
        metadata: { workspace_id, task_title: safeTitle },
      });
      if (nerr) return json(500, { error: "notify_failed", detail: nerr.message });
      return json(200, { ok: true });
    }

    const safeName = escapeHtml(workspace_name || ws.name || "Workspace");
    const safeLink = escapeHtml(link);
    const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#111">
        <h1 style="font-size:20px;margin:0 0 12px">You're invited to ${safeName}</h1>
        <p style="font-size:14px;color:#555;margin:0 0 24px">Click the button below to join the workspace and start collaborating.</p>
        <p style="margin:0 0 24px">
          <a href="${safeLink}" style="background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;display:inline-block;font-size:14px">Accept invite</a>
        </p>
        <p style="font-size:12px;color:#888;margin:0">Or open this link: <br><a href="${safeLink}" style="color:#555;word-break:break-all">${safeLink}</a></p>
      </div>`;

    const result = await sendEmail(to, `You're invited to ${workspace_name}`, html);
    if (!result.ok) return json(502, result);
    return json(200, { ok: true });
  } catch (e) {
    return json(500, { error: "internal_error", message: String((e as Error)?.message ?? e) });
  }
});
