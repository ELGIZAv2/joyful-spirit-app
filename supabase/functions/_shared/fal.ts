// Shared fal.ai client for edge functions.
// Uses the queue API so we can support long-running video generations.

const FAL_KEY = Deno.env.get("FAL_KEY") || Deno.env.get("FAL_API_KEY") || "";

export class FalError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

/**
 * Submit a job to fal.ai queue, poll until completion, return the final result JSON.
 * modelId: e.g. "fal-ai/flux-pro/v1.1-ultra" or "fal-ai/veo3"
 */
export async function falRun<T = any>(
  modelId: string,
  payload: Record<string, unknown>,
  opts: { maxWaitMs?: number; pollIntervalMs?: number } = {},
): Promise<T> {
  if (!FAL_KEY) throw new FalError("FAL_KEY is not configured on the server", 500);

  const maxWaitMs = opts.maxWaitMs ?? 5 * 60 * 1000; // 5 min
  const pollIntervalMs = opts.pollIntervalMs ?? 2000;

  // 1. Submit to queue
  const submitRes = await fetch(`https://queue.fal.run/${modelId}`, {
    method: "POST",
    headers: {
      "Authorization": `Key ${FAL_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!submitRes.ok) {
    const text = await submitRes.text();
    throw new FalError(`fal submit failed (${submitRes.status}): ${text}`, submitRes.status);
  }

  const submitJson = await submitRes.json();
  const statusUrl: string | undefined = submitJson.status_url;
  const responseUrl: string | undefined = submitJson.response_url;
  if (!statusUrl || !responseUrl) {
    // Some sync models return the result inline
    return submitJson as T;
  }

  // 2. Poll
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const statusRes = await fetch(statusUrl, {
      headers: { "Authorization": `Key ${FAL_KEY}` },
    });
    if (!statusRes.ok) {
      const text = await statusRes.text();
      throw new FalError(`fal status poll failed (${statusRes.status}): ${text}`, statusRes.status);
    }
    const statusJson = await statusRes.json();
    const status = statusJson.status;
    if (status === "COMPLETED") {
      const resultRes = await fetch(responseUrl, {
        headers: { "Authorization": `Key ${FAL_KEY}` },
      });
      if (!resultRes.ok) {
        const text = await resultRes.text();
        throw new FalError(`fal result fetch failed (${resultRes.status}): ${text}`, resultRes.status);
      }
      return (await resultRes.json()) as T;
    }
    if (status === "FAILED" || status === "CANCELLED" || status === "ERROR") {
      throw new FalError(`fal job ${status}: ${JSON.stringify(statusJson)}`, 502);
    }
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }
  throw new FalError("fal job timed out", 504);
}

/** Extract image URLs from a fal result in a tolerant way. */
export function extractImageUrls(result: any): string[] {
  if (!result) return [];
  const urls: string[] = [];
  if (Array.isArray(result.images)) {
    for (const i of result.images) {
      if (typeof i === "string") urls.push(i);
      else if (i?.url) urls.push(i.url);
    }
  }
  if (result.image?.url) urls.push(result.image.url);
  if (typeof result.image === "string") urls.push(result.image);
  if (Array.isArray(result.output)) {
    for (const i of result.output) {
      if (typeof i === "string") urls.push(i);
      else if (i?.url) urls.push(i.url);
    }
  }
  return urls;
}

/** Extract a video URL from a fal result in a tolerant way. */
export function extractVideoUrl(result: any): string | null {
  if (!result) return null;
  if (result.video?.url) return result.video.url;
  if (typeof result.video === "string") return result.video;
  if (Array.isArray(result.videos) && result.videos[0]) {
    const v = result.videos[0];
    return typeof v === "string" ? v : v?.url ?? null;
  }
  if (result.url && typeof result.url === "string") return result.url;
  if (Array.isArray(result.output) && result.output[0]) {
    const v = result.output[0];
    return typeof v === "string" ? v : v?.url ?? null;
  }
  return null;
}
