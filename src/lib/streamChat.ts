import { startJob, subscribeJob, resumeJob } from "@/lib/jobs/client";
import { getAnonFingerprint } from "@/lib/anonFingerprint";

export const GUEST_QUOTA_ERROR = "GUEST_QUOTA_EXCEEDED";

type MsgContent = string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
type Msg = { role: "user" | "assistant"; content: MsgContent };

type BrowserPayload = {
  currentUrl?: string;
  liveUrl?: string;
  screenshotUrl?: string;
  currentStep?: string;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-alibaba`;

// Lightweight session-token cache so we don't hit auth/v1/user on every send.
// The access_token in supabase-js is already cached in localStorage; we just
// memoize the synchronous read for a few seconds to avoid the network call.
let _cachedToken: { token: string; exp: number } | null = null;
async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (_cachedToken && _cachedToken.exp > now + 5_000) return _cachedToken.token;
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const expSec = data.session?.expires_at || 0;
    if (token) {
      _cachedToken = { token, exp: expSec ? expSec * 1000 : now + 60_000 };
      return token;
    }
  } catch { /* ignore */ }
  return import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
}

export async function streamChat({
  messages,
  model,
  tier,
  searchEnabled,
  deepResearch,
  chatMode,
  user_id,
  conversation_id,
  computerUseEnabled,
  activeAgent,
  selectedModel,
  activeSkill,
  availableSkills,
  background,
  onJobStart,
  onDelta,
  onDone,
  onError,
  onImages,
  onProducts,
  onStatus,
  onBrowser,
  onEvent,
  signal,
}: {
  messages: Msg[];
  model?: string;
  tier?: "lite" | "pro" | "max";
  searchEnabled?: boolean;
  deepResearch?: boolean;
  chatMode?: string;
  user_id?: string;
  conversation_id?: string;
  computerUseEnabled?: boolean;
  activeAgent?: string;
  selectedModel?: { id: string; cost: number };
  activeSkill?: { id?: string; name: string; instructions: string; enabled_tools?: string[]; preferred_model?: string | null } | null;
  availableSkills?: Array<{ id?: string; name: string; description: string; triggers?: string[]; source?: string }>;
  /** When true, run on the server as a background job that survives the user closing the tab. */
  background?: boolean;
  /** Called as soon as the background jobId is known so the caller can persist it for resume. */
  onJobStart?: (jobId: string) => void;
  onDelta: (deltaText: string) => void;
  onDone: () => void;
  onError?: (error: string) => void;
  onImages?: (images: string[]) => void;
  onProducts?: (products: any[]) => void;
  onStatus?: (status: string) => void;
  onBrowser?: (browser: BrowserPayload) => void;
  onEvent?: (payload: { event: string; [k: string]: any }) => void;
  signal?: AbortSignal;
}) {
  // ── Background job mode ─────────────────────────────────────────────────
  // Server creates a background_jobs row and streams progress into it. We
  // subscribe via Realtime; closing the tab no longer interrupts the answer.
  if (background) {
    try {
      const { jobId } = await startJob("chat", {
        messages, model, tier, searchEnabled, deepResearch, chatMode,
        user_id, conversation_id, computerUseEnabled, activeAgent,
        selectedModel, activeSkill, availableSkills,
        background: true,
      });
      onJobStart?.(jobId);
      const seenEvents = new Set<string>();
      let unsub: (() => void) | null = null;
      let settled = false;
      unsub = subscribeJob(jobId, {
        onStatus: (t) => onStatus?.(t),
        onDelta: (chunk) => onDelta(chunk),
        onMeta: (meta) => {
          if (Array.isArray(meta?.images)) onImages?.(meta.images);
          if (Array.isArray(meta?.products)) onProducts?.(meta.products);
          if (meta?.browser) onBrowser?.(meta.browser);
          if (Array.isArray(meta?.events)) {
            for (const ev of meta.events) {
              const key = JSON.stringify(ev);
              if (seenEvents.has(key)) continue;
              seenEvents.add(key);
              onEvent?.(ev);
            }
          }
        },
        onDone: () => { if (settled) return; settled = true; try { unsub?.(); } catch {} onDone(); },
        onError: (m) => { if (settled) return; settled = true; try { unsub?.(); } catch {} onError?.(m); onDone(); },
      });
      if (signal) {
        signal.addEventListener("abort", () => {
          if (settled) return;
          settled = true;
          try { unsub?.(); } catch {}
          onDone();
        }, { once: true });
      }
      return;
    } catch (e: any) {
      onError?.(e?.message || "Background job failed to start.");
      onDone();
      return;
    }
  }

  try {
    let completed = false;
    const authToken = await getAccessToken();
    const fingerprint = getAnonFingerprint();
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${authToken}`,
        "x-anon-fingerprint": fingerprint,
      },
      body: JSON.stringify({ messages, model, tier, searchEnabled, deepResearch, chatMode, user_id, conversation_id, computerUseEnabled, activeAgent, selectedModel, activeSkill, availableSkills }),
      signal,
    });

    if (resp.status === 429) {
      onError?.("Rate limit exceeded. Please wait a moment and try again.");
      onDone();
      return;
    }
    if (resp.status === 403) {
      // Guest-quota or auth-required errors come back as JSON with a code.
      const errBody = await resp.json().catch(() => ({} as any));
      if (errBody?.code === "guest_quota_exceeded" || errBody?.code === "auth_required") {
        onError?.(GUEST_QUOTA_ERROR);
        onDone();
        return;
      }
      onError?.(errBody?.error || "Access denied.");
      onDone();
      return;
    }
    if (resp.status === 401) {
      onError?.(GUEST_QUOTA_ERROR);
      onDone();
      return;
    }
    if (resp.status === 402) {
      onError?.("Insufficient balance. Please top up to continue.");
      onDone();
      return;
    }
    if (resp.status === 503) {
      onError?.("Alibaba/DashScope key is not configured for chat.");
      onDone();
      return;
    }
    if (!resp.ok || !resp.body) {
      const errorText = await resp.text().catch(() => "");
      const msg = errorText || (resp.status >= 500
        ? "Alibaba/DashScope request failed before streaming."
        : "Chat request failed.");
      onError?.(msg);
      onDone();
      return;
    }


    const handlePayload = (parsed: any) => {
      if (parsed.error) {
        onError?.(String(parsed.error));
        return;
      }
      if (parsed.event && typeof parsed.event === "string") onEvent?.(parsed);
      if (parsed.status && typeof parsed.status === "string") onStatus?.(parsed.status);
      if (parsed.images && Array.isArray(parsed.images)) onImages?.(parsed.images);
      if (parsed.products && Array.isArray(parsed.products)) onProducts?.(parsed.products);
      if (parsed.browser && typeof parsed.browser === "object") onBrowser?.(parsed.browser);
      const content = parsed.choices?.[0]?.delta?.content as string | undefined;
      if (content) onDelta(content);
    };

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    // Idle timeout: if NO bytes arrive within this window we treat the
    // connection as dead and surface a friendly retry message instead of an
    // infinite spinner. Heartbeats from the server (`: keep-alive ...`) keep
    // this alive even during long tool flows. Deep Research jobs do many
    // long-running steps (search → fetch → synthesize) and often take 1-3
    // minutes between visible deltas, so we use a much larger window for them.
    const IDLE_TIMEOUT_MS = deepResearch ? 240_000 : 60_000;
    const idleAbort = new AbortController();
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    const resetIdle = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => idleAbort.abort(), IDLE_TIMEOUT_MS);
    };
    resetIdle();

    try {
      while (!streamDone) {
        const readPromise = reader.read();
        const idlePromise = new Promise<never>((_, reject) => {
          idleAbort.signal.addEventListener(
            "abort",
            () => reject(new Error("IDLE_TIMEOUT")),
            { once: true },
          );
        });
        const { done, value } = await Promise.race([readPromise, idlePromise]);
        if (done) break;
        resetIdle();
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            completed = true;
            streamDone = true;
            break;
          }

          try {
            handlePayload(JSON.parse(jsonStr));
          } catch {
            continue;
          }
        }
      }
    } finally {
      if (idleTimer) clearTimeout(idleTimer);
    }

    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") {
          completed = true;
          continue;
        }
        try {
          handlePayload(JSON.parse(jsonStr));
        } catch {
          continue;
        }
      }
    }

    if (!completed && deepResearch) {
      onError?.("Deep Research stopped before the report finished. Please try again.");
      return;
    }
    onDone();
  } catch (e: any) {
    if (e?.name === "AbortError") {
      onDone();
      return;
    }
    if (e?.message === "IDLE_TIMEOUT") {
      onError?.("Alibaba/DashScope took too long to start streaming.");
      onDone();
      return;
    }
    console.error("Stream error:", e);
    const isNetworkError = !navigator.onLine || e?.message?.includes("Failed to fetch") || e?.message?.includes("NetworkError") || e?.message?.includes("ERR_NETWORK");
    if (isNetworkError) {
      onError?.("Connection error. Please check your internet and try again.");
    } else {
      onError?.("Something went wrong. Please try again.");
    }
    onDone();
  }
}
