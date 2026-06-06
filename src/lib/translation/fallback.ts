/**
 * Open-source translation fallback (Lingva → MyMemory).
 * Activated only when Google Translate widget fails to initialize.
 * Walks visible text nodes and translates them in batches.
 */

const ENDPOINTS = [
  // Lingva mirrors (no key, public CORS)
  (src: string, tgt: string, text: string) =>
    `https://lingva.ml/api/v1/${src}/${tgt}/${encodeURIComponent(text)}`,
  (src: string, tgt: string, text: string) =>
    `https://translate.plausibility.cloud/api/v1/${src}/${tgt}/${encodeURIComponent(text)}`,
  // MyMemory fallback
  (src: string, tgt: string, text: string) =>
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${src}|${tgt}`,
];

async function translateOne(src: string, tgt: string, text: string): Promise<string | null> {
  for (const make of ENDPOINTS) {
    try {
      const res = await fetch(make(src, tgt, text), { signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;
      const data = await res.json();
      const translated =
        data?.translation ||
        data?.responseData?.translatedText ||
        null;
      if (translated && typeof translated === "string") return translated;
    } catch {
      /* try next */
    }
  }
  return null;
}

const cache = new Map<string, string>();

function collectTextNodes(root: Node): Text[] {
  const out: Text[] = [];
  const skip = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA", "INPUT"]);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const t = n.nodeValue?.trim();
      if (!t || t.length < 2) return NodeFilter.FILTER_REJECT;
      const p = n.parentElement;
      if (!p || skip.has(p.tagName)) return NodeFilter.FILTER_REJECT;
      if (p.closest("[data-no-translate]")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n: Node | null;
  while ((n = walker.nextNode())) out.push(n as Text);
  return out;
}

let running = false;

export async function runFallbackTranslate(targetLang: string) {
  if (running || targetLang === "en") return;
  running = true;
  try {
    const nodes = collectTextNodes(document.body);
    // Limit to a reasonable batch to avoid hammering free APIs
    const batch = nodes.slice(0, 250);
    for (const node of batch) {
      const original = node.nodeValue!.trim();
      const key = `${targetLang}:${original}`;
      if (cache.has(key)) {
        node.nodeValue = cache.get(key)!;
        continue;
      }
      const translated = await translateOne("en", targetLang, original);
      if (translated) {
        cache.set(key, translated);
        node.nodeValue = translated;
      }
      // tiny gap to be polite
      await new Promise((r) => setTimeout(r, 40));
    }
  } finally {
    running = false;
  }
}
