// Runware API client (image generation).
// Docs: https://docs.runware.ai/

export interface RunwareImageRequest {
  positivePrompt: string;
  model: string;          // e.g. "openai:gpt-image-2", "runware:101@1"
  numberResults?: number;
  width?: number;
  height?: number;
  steps?: number;
  CFGScale?: number;
  seed?: number;
  outputType?: "URL" | "base64Data";
  outputFormat?: "PNG" | "JPG" | "WEBP";
  referenceImages?: string[];
}

export class RunwareError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
  }
}

const API_URL = "https://api.runware.ai/v1";

export async function runwareImage(req: RunwareImageRequest): Promise<string[]> {
  const apiKey = Deno.env.get("RUNWARE_API_KEY");
  if (!apiKey) throw new RunwareError("RUNWARE_API_KEY is not configured", 500);

  const taskUUID = crypto.randomUUID();
  const payload = [
    {
      taskType: "imageInference",
      taskUUID,
      positivePrompt: req.positivePrompt,
      model: req.model,
      numberResults: req.numberResults ?? 1,
      width: req.width ?? 1024,
      height: req.height ?? 1024,
      outputType: req.outputType ?? "URL",
      outputFormat: req.outputFormat ?? "PNG",
      ...(req.steps ? { steps: req.steps } : {}),
      ...(req.CFGScale ? { CFGScale: req.CFGScale } : {}),
      ...(req.seed !== undefined ? { seed: req.seed } : {}),
      ...(req.referenceImages?.length ? { referenceImages: req.referenceImages } : {}),
    },
  ];

  const resp = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new RunwareError(`Runware ${resp.status}: ${txt}`, resp.status);
  }
  const data = await resp.json();
  const items = (data?.data ?? []) as Array<{ imageURL?: string }>;
  const urls = items.map((i) => i.imageURL).filter(Boolean) as string[];
  if (!urls.length) throw new RunwareError("No images returned from Runware", 502);
  return urls;
}
