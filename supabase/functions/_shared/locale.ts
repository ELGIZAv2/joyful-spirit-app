// Detects the user's language/dialect so every reply is in their tongue.
export type Locale = string;

const SUPPORTED = ['ar','en','es','fr','de','pt','it','tr','ru','ja','ko','zh','hi','id','nl'];

export function detectLocale(req: Request, hints?: { userLocale?: string; sampleText?: string }): Locale {
  const candidate = (hints?.userLocale || '').toLowerCase().slice(0, 5);
  if (candidate) {
    const base = candidate.split(/[-_]/)[0];
    if (SUPPORTED.includes(base)) return base;
  }
  const text = (hints?.sampleText || '').slice(0, 500);
  if (text) {
    if (/[\u0600-\u06FF]/.test(text)) return 'ar';
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
    if (/[\u3040-\u30ff]/.test(text)) return 'ja';
    if (/[\uac00-\ud7af]/.test(text)) return 'ko';
    if (/[\u0900-\u097F]/.test(text)) return 'hi';
    if (/[\u0400-\u04FF]/.test(text)) return 'ru';
  }
  const accept = req.headers.get('accept-language') || '';
  const first = accept.split(',')[0]?.split(/[-_;]/)[0].toLowerCase();
  if (first && SUPPORTED.includes(first)) return first;
  return 'en';
}

// Detect Arabic dialect cues from text to feed into the LLM system prompt.
export function detectArabicDialect(text: string): string | null {
  if (!/[\u0600-\u06FF]/.test(text)) return null;
  const t = text.toLowerCase();
  if (/\b(ازاي|عايز|إزاي|كده|دلوقتي|بقالي|يلا|كويس)\b/.test(t)) return 'Egyptian';
  if (/\b(شلون|وايد|هسه|اشلونك|تره|ابي)\b/.test(t)) return 'Gulf';
  if (/\b(كيفك|هلق|شو|بدي|منيح|عنجد)\b/.test(t)) return 'Levantine';
  if (/\b(واش|بزاف|شحال|دابا|هاد)\b/.test(t)) return 'Maghrebi';
  return 'MSA';
}

export function languageInstruction(locale: Locale, sampleText = ''): string {
  const dialect = locale === 'ar' ? detectArabicDialect(sampleText) : null;
  const names: Record<string, string> = {
    ar: 'Arabic', en: 'English', es: 'Spanish', fr: 'French', de: 'German',
    pt: 'Portuguese', it: 'Italian', tr: 'Turkish', ru: 'Russian', ja: 'Japanese',
    ko: 'Korean', zh: 'Chinese', hi: 'Hindi', id: 'Indonesian', nl: 'Dutch',
  };
  const name = names[locale] || 'the user language';
  let line = `CRITICAL: Always reply in ${name}, matching the user's tone and vocabulary. Never switch languages unless explicitly asked.`;
  if (dialect && dialect !== 'MSA') {
    line += ` The user writes in the ${dialect} Arabic dialect — match it naturally; keep technical product names in English.`;
  } else if (locale === 'ar') {
    line += ` Use clear Modern Standard Arabic with light Egyptian flavor unless the user shows another dialect.`;
  }
  return line;
}
