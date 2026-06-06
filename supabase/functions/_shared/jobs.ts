// Shared background-job runner backed by public.background_jobs.
// All long-running edge functions write progress here so the client can
// resume via Realtime even after disconnect.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export type JobKind = "chat" | "docs" | "slides" | "deep_research" | "image" | "video";
export type JobStatus = "queued" | "running" | "needs_input" | "done" | "error" | "canceled";

export interface JobRow {
  id: string;
  user_id: string;
  kind: JobKind;
  status: JobStatus;
  phase: string | null;
  progress: number;
  status_text: string | null;
  input: any;
  output: any;
  stream_text: string;
  meta: any;
  clarify: any;
  error: string | null;
  conversation_id: string | null;
  message_id: string | null;
}

const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export function admin(): SupabaseClient {
  return createClient(SUPA_URL, SERVICE_KEY, { auth: { persistSession: false } });
}

export async function createJob(args: {
  userId: string;
  kind: JobKind;
  input: any;
  conversationId?: string | null;
  messageId?: string | null;
  meta?: any;
}): Promise<string> {
  const sb = admin();
  const { data, error } = await sb
    .from("background_jobs")
    .insert({
      user_id: args.userId,
      kind: args.kind,
      status: "queued",
      input: args.input ?? {},
      meta: args.meta ?? {},
      conversation_id: args.conversationId ?? null,
      message_id: args.messageId ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(`createJob: ${error.message}`);
  return data!.id as string;
}

export class JobWriter {
  private sb: SupabaseClient;
  private buf = "";
  private lastFlush = 0;
  private streamLen = 0;
  private closed = false;

  constructor(public id: string) {
    this.sb = admin();
  }

  /** Mark queued -> running, fire any initial fields. */
  async start(extra: Partial<{ phase: string; status_text: string; meta: any }> = {}): Promise<void> {
    await this.sb.from("background_jobs").update({
      status: "running",
      last_heartbeat_at: new Date().toISOString(),
      ...extra,
    }).eq("id", this.id);
  }

  async setStatusText(text: string): Promise<void> {
    if (this.closed) return;
    await this.flushStream(true);
    await this.sb.from("background_jobs").update({
      status_text: text,
      last_heartbeat_at: new Date().toISOString(),
    }).eq("id", this.id);
  }

  async setProgress(progress: number, phase?: string): Promise<void> {
    if (this.closed) return;
    await this.sb.from("background_jobs").update({
      progress: Math.max(0, Math.min(100, Math.round(progress))),
      ...(phase ? { phase } : {}),
      last_heartbeat_at: new Date().toISOString(),
    }).eq("id", this.id);
  }

  async setMeta(meta: any): Promise<void> {
    if (this.closed) return;
    await this.sb.from("background_jobs").update({
      meta,
      last_heartbeat_at: new Date().toISOString(),
    }).eq("id", this.id);
  }

  async setOutput(output: any): Promise<void> {
    if (this.closed) return;
    await this.sb.from("background_jobs").update({
      output,
      last_heartbeat_at: new Date().toISOString(),
    }).eq("id", this.id);
  }

  /** Append a delta to stream_text. Throttled by 800ms or 2KB. */
  async appendStream(chunk: string): Promise<void> {
    if (this.closed) return;
    if (!chunk) return;
    this.buf += chunk;
    const now = Date.now();
    if (this.buf.length >= 2048 || now - this.lastFlush >= 800) {
      await this.flushStream();
    }
  }

  async flushStream(heartbeat = false): Promise<void> {
    if (this.closed) return;
    if (!this.buf.length && !heartbeat) return;
    if (!this.buf.length) {
      await this.sb.from("background_jobs").update({
        last_heartbeat_at: new Date().toISOString(),
      }).eq("id", this.id);
      return;
    }
    // Read current length, append. (Two writers shouldn't race on same job.)
    this.streamLen += this.buf.length;
    const chunk = this.buf;
    this.buf = "";
    this.lastFlush = Date.now();
    const { data } = await this.sb
      .from("background_jobs")
      .select("stream_text")
      .eq("id", this.id)
      .single();
    const next = ((data?.stream_text as string) || "") + chunk;
    await this.sb.from("background_jobs").update({
      stream_text: next,
      last_heartbeat_at: new Date().toISOString(),
    }).eq("id", this.id);
  }

  /** Check if user requested cancellation. */
  async isCanceled(): Promise<boolean> {
    const { data } = await this.sb
      .from("background_jobs")
      .select("status")
      .eq("id", this.id)
      .single();
    return data?.status === "canceled";
  }

  async throwIfCanceled(): Promise<void> {
    if (await this.isCanceled()) {
      this.closed = true;
      throw new Error("canceled");
    }
  }

  async needsInput(clarify: any): Promise<void> {
    await this.flushStream(true);
    if (this.closed) return;
    this.closed = true;
    await this.sb.from("background_jobs").update({
      status: "needs_input",
      clarify,
      progress: 100,
      finished_at: new Date().toISOString(),
    }).eq("id", this.id);
  }

  async complete(output?: any): Promise<void> {
    await this.flushStream(true);
    if (this.closed) return;
    if (await this.isCanceled()) {
      this.closed = true;
      return;
    }
    this.closed = true;
    const patch: any = {
      status: "done",
      progress: 100,
      finished_at: new Date().toISOString(),
    };
    if (output !== undefined) patch.output = output;
    await this.sb.from("background_jobs").update(patch).eq("id", this.id);
  }

  async fail(message: string): Promise<void> {
    try { await this.flushStream(true); } catch { /* ignore */ }
    if (this.closed) return;
    this.closed = true;
    await this.sb.from("background_jobs").update({
      status: "error",
      error: String(message).slice(0, 4000),
      status_text: "Stopped",
      progress: 100,
      finished_at: new Date().toISOString(),
    }).eq("id", this.id);
  }
}

/** Run fn in background even after the HTTP response is closed. */
export function runInBackground(jobId: string, fn: (writer: JobWriter) => Promise<void>): void {
  const writer = new JobWriter(jobId);
  const task = (async () => {
    try {
      await fn(writer);
      // Safety: if fn forgot to terminate, mark done.
      await writer.complete();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await writer.fail(msg);
    }
  })();
  // @ts-ignore EdgeRuntime is provided by Supabase
  if (typeof EdgeRuntime !== "undefined" && (EdgeRuntime as any).waitUntil) {
    // @ts-ignore
    (EdgeRuntime as any).waitUntil(task);
  } else {
    // Fallback: detach
    task.catch(() => {});
  }
}
