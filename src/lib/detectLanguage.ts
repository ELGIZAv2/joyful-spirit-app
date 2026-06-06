/** Quick client-side language detection from sample text. Returns a BCP-47-ish hint. */
export function detectLanguage(text: string): string {
  const t = (text || "").trim();
  if (!t) return navigator.language?.split("-")[0] || "en";

  // Script-based heuristics — fast and good-enough.
  if (/[\u0600-\u06FF\u0750-\u077F]/.test(t)) return "ar";
  if (/[\u4E00-\u9FFF]/.test(t)) return "zh";
  if (/[\u3040-\u30FF]/.test(t)) return "ja";
  if (/[\uAC00-\uD7AF]/.test(t)) return "ko";
  if (/[\u0400-\u04FF]/.test(t)) return "ru";
  if (/[\u0590-\u05FF]/.test(t)) return "he";
  if (/[\u0E00-\u0E7F]/.test(t)) return "th";
  if (/[\u0900-\u097F]/.test(t)) return "hi";
  if (/[\u0980-\u09FF]/.test(t)) return "bn";
  if (/[\u0A00-\u0A7F]/.test(t)) return "pa";

  // Latin-script European hints.
  const lower = t.toLowerCase();
  if (/\b(le|la|les|une|des|avec|pour|bonjour|merci)\b/.test(lower)) return "fr";
  if (/\b(el|la|los|las|una|gracias|hola|por favor)\b/.test(lower)) return "es";
  if (/\b(der|die|das|und|nicht|bitte|danke)\b/.test(lower)) return "de";
  if (/\b(il|la|gli|sono|grazie|ciao|prego)\b/.test(lower)) return "it";
  if (/\b(o|os|as|não|obrigado|olá)\b/.test(lower)) return "pt";

  return "en";
}
