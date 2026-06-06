// supabase/functions/code-v0-manage/index.ts
// Management operations for v0-backed code projects:
//   - get-versions:      list chat versions
//   - restore-version:   restore an older version (via "revert to vX" message)
//   - deploy:            create a real v0 deployment for the latest version
//   - save-instructions: update project-level instructions (.cursorrules-style)

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { pickV0Key, blockV0Key, shouldBlockOnStatus } from "../_shared/v0-keys.ts";

const V0_BASE = "https://api.v0.dev/v1";

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}
async function userFromRequest(req: Request) {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
  const { data } = await sb.auth.getUser();
  return data.user;
}

async function v0<T = unknown>(
  path: string,
  key: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${V0_BASE}${path}`, {
    method: init.method ?? "GET",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  let json: unknown = {};
  try { json = JSON.parse(text); } catch { /* keep text */ }
  if (!res.ok) {
    const j = json as { error?: { message?: string } | string };
    const msg = (typeof j.error === "object" && j.error?.message)
      || (typeof j.error === "string" ? j.error : null)
      || text.slice(0, 300)
      || `v0 ${res.status}`;
    throw new Error(`v0_${res.status}: ${msg}`);
  }
  return json as T;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const user = await userFromRequest(req);
    if (!user) return json({ error: "auth_required" }, 401);

    const picked = await pickV0Key();
    if (!picked) return json({ error: "all_v0_keys_exhausted" }, 429);
    const v0Key = picked.api_key;
    const v0KeyId = picked.id;

    // Helper: invoke v0() and auto-block this key on auth/quota errors so the
    // next request rotates to another one.
    const v0Safe = async <T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> => {
      try {
        return await v0<T>(path, v0Key, init);
      } catch (e) {
        const msg = (e as Error).message;
        const m = msg.match(/v0_(\d{3})/);
        const status = m ? Number(m[1]) : 0;
        if (shouldBlockOnStatus(status)) await blockV0Key(v0KeyId, msg);
        throw e;
      }
    };
    void v0Safe; // (kept available for future call sites)

    const body = await req.json().catch(() => ({}));
    const { action, projectId } = body as { action?: string; projectId?: string };
    if (!action || !projectId) return json({ error: "action and projectId required" }, 400);

    const sb = admin();
    const { data: project } = await sb.from("code_projects")
      .select("id, owner_id, name, v0_chat_id, v0_project_id, v0_latest_version_id, instructions")
      .eq("id", projectId).maybeSingle();
    if (!project || project.owner_id !== user.id) return json({ error: "forbidden" }, 403);

    // --------------- save-instructions ---------------
    if (action === "save-instructions") {
      const { instructions } = body as { instructions?: string };
      const text = (instructions || "").slice(0, 8000);
      await sb.from("code_projects").update({ instructions: text }).eq("id", projectId);
      // Mirror to v0 project if we have one (best-effort; ignore failures)
      if (project.v0_project_id) {
        try {
          await v0(`/projects/${encodeURIComponent(project.v0_project_id)}`, v0Key, {
            method: "PATCH",
            body: { instructions: text },
          });
        } catch (e) {
          console.warn("[code-v0-manage] v0 project patch failed:", (e as Error).message);
        }
      }
      return json({ ok: true });
    }

    // --------------- get-versions ---------------
    if (action === "get-versions") {
      if (!project.v0_chat_id) return json({ versions: [] });
      try {
        const data = await v0<{ data?: Array<{ id: string; status?: string; demoUrl?: string; createdAt?: string }>; versions?: unknown[] }>(
          `/chats/${encodeURIComponent(project.v0_chat_id)}/versions`,
          v0Key,
          { method: "GET" },
        );
        const versions = (data.data || data.versions || []) as Array<{ id: string; status?: string; demoUrl?: string; createdAt?: string }>;
        return json({ versions, currentVersionId: project.v0_latest_version_id });
      } catch (e) {
        return json({ error: (e as Error).message }, 500);
      }
    }

    // --------------- restore-version ---------------
    if (action === "restore-version") {
      const { versionId } = body as { versionId?: string };
      if (!versionId) return json({ error: "versionId required" }, 400);
      if (!project.v0_chat_id) return json({ error: "no_chat" }, 400);
      try {
        // v0 exposes a restore endpoint on chats
        const result = await v0<{ latestVersion?: { id?: string; demoUrl?: string } }>(
          `/chats/${encodeURIComponent(project.v0_chat_id)}/restore`,
          v0Key,
          { method: "POST", body: { versionId } },
        );
        const newVersion = result.latestVersion;
        const updates: Record<string, unknown> = { v0_latest_version_id: newVersion?.id ?? versionId };
        if (newVersion?.demoUrl) updates.preview_url = newVersion.demoUrl;
        await sb.from("code_projects").update(updates).eq("id", projectId);
        return json({ ok: true, previewUrl: newVersion?.demoUrl ?? null, versionId: newVersion?.id ?? versionId });
      } catch (e) {
        return json({ error: (e as Error).message }, 500);
      }
    }

    // --------------- deploy ---------------
    if (action === "deploy") {
      if (!project.v0_chat_id) return json({ error: "no_chat_yet" }, 400);
      if (!project.v0_project_id) return json({ error: "no_v0_project" }, 400);
      const versionId = (body as { versionId?: string }).versionId || project.v0_latest_version_id;
      if (!versionId) return json({ error: "no_version_to_deploy" }, 400);

      const { data: depRow } = await sb.from("code_project_deployments").insert({
        project_id: projectId,
        user_id: user.id,
        v0_chat_id: project.v0_chat_id,
        v0_version_id: versionId,
        status: "pending",
      }).select("id").maybeSingle();

      try {
        const result = await v0<{ id?: string; url?: string; inspectorUrl?: string; webUrl?: string; status?: string }>(
          `/deployments`,
          v0Key,
          {
            method: "POST",
            body: {
              projectId: project.v0_project_id,
              chatId: project.v0_chat_id,
              versionId,
            },
          },
        );
        const url = result.url || result.webUrl || null;
        await sb.from("code_project_deployments").update({
          v0_deployment_id: result.id ?? null,
          url,
          inspector_url: result.inspectorUrl ?? null,
          status: result.status ?? "succeeded",
        }).eq("id", depRow!.id);
        if (url) {
          await sb.from("code_projects").update({ published_url: url }).eq("id", projectId);
        }
        return json({ ok: true, url, deploymentId: result.id ?? null });
      } catch (e) {
        const msg = (e as Error).message;
        await sb.from("code_project_deployments").update({ status: "failed", error: msg }).eq("id", depRow!.id);
        return json({ error: msg }, 500);
      }
    }

    // --------------- connect-supabase ---------------
    // Pushes the current Supabase URL + anon key as project-level env variables on the
    // linked v0 project so generated code can call Supabase directly.
    if (action === "connect-supabase") {
      if (!project.v0_project_id) return json({ error: "no_v0_project" }, 400);
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
      const projectRef = supabaseUrl.match(/^https?:\/\/([^.]+)\./)?.[1] || "";
      if (!supabaseUrl || !anonKey) return json({ error: "supabase_env_missing" }, 500);

      const envVars = [
        { key: "VITE_SUPABASE_URL", value: supabaseUrl },
        { key: "VITE_SUPABASE_PUBLISHABLE_KEY", value: anonKey },
        { key: "VITE_SUPABASE_PROJECT_ID", value: projectRef },
        { key: "NEXT_PUBLIC_SUPABASE_URL", value: supabaseUrl },
        { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", value: anonKey },
      ];

      const results: Array<{ key: string; ok: boolean; error?: string }> = [];
      for (const v of envVars) {
        try {
          await v0(`/projects/${encodeURIComponent(project.v0_project_id)}/env-vars`, v0Key, {
            method: "POST",
            body: { key: v.key, value: v.value },
          });
          results.push({ key: v.key, ok: true });
        } catch (_e) {
          try {
            await v0(`/projects/${encodeURIComponent(project.v0_project_id)}/env-vars/${encodeURIComponent(v.key)}`, v0Key, {
              method: "PATCH",
              body: { value: v.value },
            });
            results.push({ key: v.key, ok: true });
          } catch (e2) {
            results.push({ key: v.key, ok: false, error: (e2 as Error).message });
          }
        }
      }
      const okCount = results.filter((r) => r.ok).length;
      return json({ ok: okCount > 0, results, count: okCount });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (e) {
    console.error("[code-v0-manage] fatal", (e as Error).message);
    return json({ error: (e as Error).message }, 500);
  }
});
