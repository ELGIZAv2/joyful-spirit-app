// Alibaba DashScope provider — Qwen-Image / Wan2.1 video.
// Async task pattern: submit → poll task_id.
// Uses a single DASHSCOPE_API_KEY from environment (no rotation).

function getKey(): string {
  const k = Deno.env.get("DASHSCOPE_API_KEY") || Deno.env.get("ALIBABA_API_KEY");
  if (!k) throw new AlibabaError("DASHSCOPE_API_KEY not configured", 500);
  return k;
}

const BASE = "https://dashscope.aliyuncs.com/api/v1";

export class AlibabaError extends Error {
  status: number;
  constructor(msg: string, status = 500) { super(msg); this.status = status; }
}

async function aFetch(path: string, init: RequestInit, apiKey: string, async_ = true): Promise<Response> {
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> || {}),
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (async_) headers["X-DashScope-Async"] = "enable";
  return fetch(`${BASE}${path}`, { ...init, headers });
}

async function pollTask(taskId: string, apiKey: string, maxWaitMs: number): Promise<any> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const r = await fetch(`${BASE}/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!r.ok) {
      const t = await r.text();
      throw new AlibabaError(`poll:${r.status}:${t}`, r.status);
    }
    const j = await r.json();
    const status = j?.output?.task_status;
    if (status === "SUCCEEDED") return j.output;
    if (status === "FAILED" || status === "UNKNOWN") {
      throw new AlibabaError(j?.output?.message || "task_failed", 502);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new AlibabaError("task_timeout", 504);
}

export interface AlibabaImageParams {
  prompt: string;
  model: string;          // "qwen-image-plus" | "wanx2.1-t2i-turbo" | "wanx2.1-t2i-plus"
  size?: string;          // "1024*1024"
  n?: number;
  seed?: number;
  negative_prompt?: string;
  refImageUrl?: string;   // for edit / image-to-image (qwen-image-edit)
  editMode?: string;
}

export async function alibabaGenerateImage(p: AlibabaImageParams): Promise<{ urls: string[]; taskId: string }> {
  const isEdit = !!p.refImageUrl;
  const path = isEdit
    ? "/services/aigc/image2image/image-synthesis"
    : "/services/aigc/text2image/image-synthesis";

  const input: Record<string, unknown> = { prompt: p.prompt };
  if (p.negative_prompt) input.negative_prompt = p.negative_prompt;
  if (isEdit) input.base_image_url = p.refImageUrl;

  const parameters: Record<string, unknown> = {
    n: Math.min(4, Math.max(1, p.n ?? 1)),
    size: p.size || "1024*1024",
  };
  if (p.seed !== undefined) parameters.seed = p.seed;
  if (p.editMode) parameters.function = p.editMode;

  const key = getKey();
  const submit = await aFetch(path, {
    method: "POST",
    body: JSON.stringify({ model: p.model, input, parameters }),
  }, key);
  if (!submit.ok) {
    const t = await submit.text();
    throw new AlibabaError(t, submit.status);
  }
  const j = await submit.json();
  const taskId = j?.output?.task_id;
  if (!taskId) throw new AlibabaError("no_task_id", 502);
  const out = await pollTask(taskId, key, 5 * 60 * 1000);
  const results = (out?.results || []) as any[];
  const urls = results.map((r: any) => r.url).filter(Boolean);
  return { urls, taskId };
}

export interface AlibabaVideoParams {
  prompt: string;
  model: string;          // "wanx2.1-t2v-turbo" | "wanx2.1-i2v-turbo" | "wanx2.1-i2v-plus"
  image_url?: string;     // i2v
  size?: string;          // "1280*720"
  duration?: number;
  seed?: number;
}

export async function alibabaGenerateVideo(p: AlibabaVideoParams): Promise<{ url: string; taskId: string }> {
  const isI2V = !!p.image_url;
  const path = isI2V
    ? "/services/aigc/video-generation/video-synthesis"
    : "/services/aigc/video-generation/video-synthesis";
  const input: Record<string, unknown> = { prompt: p.prompt };
  if (isI2V) input.img_url = p.image_url;
  const parameters: Record<string, unknown> = {};
  if (p.size) parameters.size = p.size;
  if (p.duration) parameters.duration = p.duration;
  if (p.seed !== undefined) parameters.seed = p.seed;

  const key = getKey();
  const submit = await aFetch(path, {
    method: "POST",
    body: JSON.stringify({ model: p.model, input, parameters }),
  }, key);
  if (!submit.ok) {
    const t = await submit.text();
    throw new AlibabaError(t, submit.status);
  }
  const j = await submit.json();
  const taskId = j?.output?.task_id;
  if (!taskId) throw new AlibabaError("no_task_id", 502);
  const out = await pollTask(taskId, key, 10 * 60 * 1000);
  const url = out?.video_url || out?.results?.[0]?.url;
  if (!url) throw new AlibabaError("no_video_url", 502);
  return { url, taskId };
}
