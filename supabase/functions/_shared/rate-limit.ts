// Smart, silent rate limiting. Returns 429 only when the user exceeds limits.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export interface RateLimitOptions {
  perMinute?: number;
  perHour?: number;
  blockSeconds?: number;
}

const DEFAULT_BUCKETS: Record<string, RateLimitOptions> = {
  chat: { perMinute: 30, perHour: 500, blockSeconds: 60 },
  generate_image: { perMinute: 10, perHour: 200, blockSeconds: 120 },
  generate_video: { perMinute: 4, perHour: 60, blockSeconds: 180 },
  leonardo: { perMinute: 10, perHour: 300, blockSeconds: 120 },
  serper: { perMinute: 30, perHour: 600, blockSeconds: 60 },
  firecrawl: { perMinute: 20, perHour: 400, blockSeconds: 60 },
  e2b: { perMinute: 6, perHour: 100, blockSeconds: 120 },
  scan_upload: { perMinute: 30, perHour: 400, blockSeconds: 60 },
  telegram_input: { perMinute: 20, perHour: 200, blockSeconds: 60 },
  default: { perMinute: 30, perHour: 500, blockSeconds: 60 },
};

async function hashIp(ip: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getClientIp(req: Request): string | null {
  return req.headers.get('cf-connecting-ip')
    || (req.headers.get('x-forwarded-for') || '').split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || null;
}

export async function checkRateLimit(
  req: Request,
  bucket: string,
  userId: string | null,
  opts?: RateLimitOptions,
): Promise<{ allowed: true } | { allowed: false; retryAfter: number; reason: string }> {
  const cfg = { ...DEFAULT_BUCKETS.default, ...(DEFAULT_BUCKETS[bucket] || {}), ...(opts || {}) };
  let ipHash: string | null = null;
  if (!userId) {
    const ip = getClientIp(req);
    if (ip) ipHash = await hashIp(ip);
  }
  try {
    const { data, error } = await admin.rpc('check_rate_limit', {
      p_user_id: userId,
      p_ip_hash: ipHash,
      p_bucket: bucket,
      p_per_minute: cfg.perMinute,
      p_per_hour: cfg.perHour,
      p_block_seconds: cfg.blockSeconds,
    });
    if (error) return { allowed: true } as const; // fail-open, do not break service
    if (data?.allowed === false) {
      return { allowed: false, retryAfter: data.retry_after || cfg.blockSeconds!, reason: data.reason || 'rate_limited' };
    }
    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

const RATE_LIMIT_MESSAGES: Record<string, string> = {
  ar: 'لقد تجاوزت الحد المسموح. يرجى المحاولة بعد قليل.',
  en: 'You have exceeded the request limit. Please try again shortly.',
  es: 'Has superado el límite de solicitudes. Inténtalo de nuevo en breve.',
  fr: 'Vous avez dépassé la limite de requêtes. Réessayez dans un instant.',
  de: 'Sie haben das Anfragelimit überschritten. Bitte versuchen Sie es gleich erneut.',
  pt: 'Limite de solicitações excedido. Tente novamente em breve.',
  it: 'Hai superato il limite di richieste. Riprova tra poco.',
  tr: 'İstek sınırını aştın. Lütfen biraz sonra tekrar dene.',
  ru: 'Вы превысили лимит запросов. Повторите попытку позже.',
  ja: 'リクエストの上限を超えました。しばらくしてから再試行してください。',
  ko: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
  zh: '已超出请求限制，请稍后再试。',
  hi: 'आपने अनुरोध की सीमा पार कर दी है। कृपया कुछ देर बाद पुनः प्रयास करें।',
  id: 'Anda telah melampaui batas permintaan. Coba lagi sebentar.',
  nl: 'Je hebt de aanvraaglimiet overschreden. Probeer het zo opnieuw.',
};

export function rateLimitResponse(retryAfter: number, locale: string, extraHeaders: Record<string, string> = {}): Response {
  const msg = RATE_LIMIT_MESSAGES[locale] || RATE_LIMIT_MESSAGES.en;
  return new Response(JSON.stringify({ error: 'rate_limited', message: msg, retry_after: retryAfter }), {
    status: 429,
    headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfter), ...extraHeaders },
  });
}
