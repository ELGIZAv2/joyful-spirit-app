// supabase/functions/bundle-preview-fast/index.ts
// Live-preview deploy: bundles the current project files with esbuild-wasm,
// uploads to a Cloudflare Pages *preview* deployment, and writes only
// `preview_url` on the project row. Same engine as cloudflare-deploy but:
//   - production: false (preview channel, doesn't promote to the prod alias)
//   - only updates preview_url (publish flow still owns published_url)
//
// Called automatically by the workspace after each agent run.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { bundleProject, type BuildFile } from "../_shared/cf-bundle/bundler.ts";
import { deployToPages, type PageFile } from "../_shared/cf-bundle/cf-pages.ts";
import {
  composeIndexHtml,
  guessContentType,
  projectNameFor,
  type DeploySettings,
} from "../_shared/cf-bundle/compose.ts";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "POST only" });

  const cfToken = Deno.env.get("CLOUDFLARE_API_TOKEN");
  const accountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
  if (!cfToken || !accountId) {
    return json(503, {
      error: "Preview isn't configured. Missing CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID.",
    });
  }

  // Auth.
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return json(401, { error: "Unauthorized" });
  const supaUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const svcKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const userClient = createClient(supaUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claims, error: claimsErr } = await userClient.auth.getClaims(
    authHeader.slice("Bearer ".length),
  );
  if (claimsErr || !claims?.claims?.sub) return json(401, { error: "Unauthorized" });
  const userId = claims.claims.sub as string;

  let body: { project_id?: string; settings?: DeploySettings } = {};
  try { body = await req.json(); } catch { return json(400, { error: "Bad JSON body" }); }
  const projectId = body.project_id;
  if (!projectId || !/^[0-9a-f-]{36}$/i.test(projectId)) {
    return json(400, { error: "Invalid project_id" });
  }
  const settings = body.settings || {};

  const admin = createClient(supaUrl, svcKey);

  const { data: project, error: pErr } = await admin
    .from("projects")
    .select("id, user_id, name")
    .eq("id", projectId)
    .single();
  if (pErr || !project) return json(404, { error: "Project not found" });
  if (project.user_id !== userId) return json(403, { error: "Forbidden" });

  // Pull project files (paginate; Supabase caps at 1000 rows).
  const files: BuildFile[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from("ai_project_files")
      .select("path, content")
      .eq("project_id", projectId)
      .range(from, from + PAGE - 1);
    if (error) return json(500, { error: `db: ${error.message}` });
    if (!data || data.length === 0) break;
    for (const r of data) files.push({ path: r.path as string, content: (r.content as string) ?? "" });
    if (data.length < PAGE) break;
  }
  if (files.length === 0) return json(400, { error: "Project has no files" });

  // Bundle.
  let js: string, css: string, warnings: string[];
  try {
    const result = await bundleProject(files);
    js = result.js; css = result.css; warnings = result.warnings;
  } catch (e) {
    return json(500, { error: `Bundle failed: ${(e as Error).message}` });
  }
  if (!js || js.length < 50) return json(500, { error: "Bundler produced empty output" });

  const html = composeIndexHtml({ settings, jsHref: "/app.js", cssHref: "/app.css" });

  const enc = new TextEncoder();
  const pageFiles: PageFile[] = [
    { path: "/index.html", content: enc.encode(html), contentType: "text/html; charset=utf-8" },
    { path: "/app.js", content: enc.encode(js), contentType: "application/javascript; charset=utf-8" },
    { path: "/app.css", content: enc.encode(css || "/* no css */"), contentType: "text/css; charset=utf-8" },
  ];
  for (const f of files) {
    if (!f.path.startsWith("public/")) continue;
    const rel = "/" + f.path.slice("public/".length);
    pageFiles.push({ path: rel, content: enc.encode(f.content), contentType: guessContentType(rel) });
  }

  const name = projectNameFor(projectId);
  let deploy;
  try {
    deploy = await deployToPages({
      apiToken: cfToken,
      accountId,
      projectName: name,
      files: pageFiles,
      production: false, // preview channel
    });
  } catch (e) {
    return json(500, { error: `Cloudflare preview deploy: ${(e as Error).message}` });
  }

  // Update only preview_url; publish owns published_url.
  await admin
    .from("projects")
    .update({ preview_url: deploy.url })
    .eq("id", projectId);

  return json(200, {
    ok: true,
    url: deploy.url,
    subdomain: deploy.subdomain,
    deploymentId: deploy.deploymentId,
    uploaded: deploy.uploaded,
    reused: deploy.reused,
    warnings,
  });
});
