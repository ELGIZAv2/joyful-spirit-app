// PII redaction + profanity/jailbreak filtering

const PII_PATTERNS: Array<{ name: string; re: RegExp; replacement: string }> = [
  { name: "email", re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, replacement: "[EMAIL]" },
  { name: "phone_intl", re: /\+\d{1,3}[\s-]?\(?\d{1,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/g, replacement: "[PHONE]" },
  { name: "credit_card", re: /\b(?:\d[ -]*?){13,16}\b/g, replacement: "[CARD]" },
  { name: "ssn_us", re: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: "[SSN]" },
  { name: "ipv4", re: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, replacement: "[IP]" },
  { name: "saudi_id", re: /\b[12]\d{9}\b/g, replacement: "[ID]" },
  { name: "api_key_like", re: /\b(?:sk|pk|key)[_-][A-Za-z0-9]{20,}\b/gi, replacement: "[API_KEY]" },
];

export function redactPII(text: string): { redacted: string; found: string[] } {
  if (!text) return { redacted: "", found: [] };
  const found: string[] = [];
  let out = text;
  for (const { name, re, replacement } of PII_PATTERNS) {
    if (re.test(out)) {
      found.push(name);
      out = out.replace(re, replacement);
    }
  }
  return { redacted: out, found };
}

// Common jailbreak/prompt-injection patterns
const JAILBREAK_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /disregard\s+(all\s+)?prior/i,
  /you\s+are\s+now\s+(DAN|jailbroken|unrestricted)/i,
  /pretend\s+you\s+have\s+no\s+rules/i,
  /system\s*:\s*you\s+are/i,
  /\[\[ADMIN\]\]/i,
  /override\s+your\s+(safety|instructions|guidelines)/i,
];

export function detectJailbreak(text: string): boolean {
  if (!text) return false;
  return JAILBREAK_PATTERNS.some((re) => re.test(text));
}

const PROFANITY_AR = ["كس", "زب", "نيك", "شرموط", "عرص"];
const PROFANITY_EN = ["fuck", "shit", "bitch", "asshole", "cunt"];

export function softProfanityCheck(text: string): { hasProfanity: boolean; severity: "none" | "mild" | "high" } {
  if (!text) return { hasProfanity: false, severity: "none" };
  const lower = text.toLowerCase();
  const arHits = PROFANITY_AR.filter((w) => text.includes(w)).length;
  const enHits = PROFANITY_EN.filter((w) => lower.includes(w)).length;
  const total = arHits + enHits;
  if (total === 0) return { hasProfanity: false, severity: "none" };
  return { hasProfanity: true, severity: total > 2 ? "high" : "mild" };
}
