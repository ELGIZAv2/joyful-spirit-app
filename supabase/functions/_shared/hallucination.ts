// Hallucination guard: validates citations and flags suspicious claims.

const URL_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

export interface HallucinationReport {
  totalCitations: number;
  invalidCitations: string[];
  suspicious: boolean;
}

export function checkHallucinations(text: string): HallucinationReport {
  const invalid: string[] = [];
  let total = 0;
  let m: RegExpExecArray | null;
  while ((m = URL_RE.exec(text)) !== null) {
    total++;
    const url = m[2];
    try {
      const u = new URL(url);
      if (!u.hostname.includes(".") || u.hostname.length < 4) invalid.push(url);
      // Block obvious fake/example domains that are common AI hallucinations
      if (/^(example|test|fake|placeholder|sample)\./i.test(u.hostname)) invalid.push(url);
    } catch {
      invalid.push(url);
    }
  }
  return { totalCitations: total, invalidCitations: invalid, suspicious: invalid.length > 0 };
}

// Optional: verify URL is reachable (HEAD request, 2s timeout). Use sparingly.
export async function verifyUrlReachable(url: string, timeoutMs = 2000): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { method: "HEAD", signal: ctrl.signal, redirect: "follow" });
    clearTimeout(t);
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}
