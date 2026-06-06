// Lightweight in-memory response cache (per edge instance).
// Keys: hash(user_id + tier + normalized_question). TTL: 10 min. Max 500 entries (LRU-ish).

interface Entry { value: string; expiry: number; hits: number; }
const STORE = new Map<string, Entry>();
const TTL_MS = 10 * 60 * 1000;
const MAX = 500;

function normalize(q: string): string {
  return q.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 500);
}

async function hash(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function cacheKey(userId: string | null, tier: string, question: string): Promise<string> {
  return await hash(`${userId || "anon"}::${tier}::${normalize(question)}`);
}

export function cacheGet(key: string): string | null {
  const e = STORE.get(key);
  if (!e) return null;
  if (Date.now() > e.expiry) { STORE.delete(key); return null; }
  e.hits++;
  // refresh LRU order
  STORE.delete(key); STORE.set(key, e);
  return e.value;
}

export function cacheSet(key: string, value: string): void {
  if (!value || value.length > 8000) return; // skip huge responses
  if (STORE.size >= MAX) {
    const firstKey = STORE.keys().next().value;
    if (firstKey) STORE.delete(firstKey);
  }
  STORE.set(key, { value, expiry: Date.now() + TTL_MS, hits: 0 });
}

export function shouldCache(question: string, hasTools: boolean, isStreaming: boolean): boolean {
  if (hasTools || isStreaming) return false;
  if (!question || question.length < 8 || question.length > 400) return false;
  // Only cache informational/factual questions, not personal/time-sensitive ones
  if (/الان|الآن|اليوم|now|today|current|latest|recent|أخبار|news/i.test(question)) return false;
  return true;
}
