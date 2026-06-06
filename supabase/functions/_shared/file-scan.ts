// Validates uploaded files: magic bytes, size, malicious patterns.
const MAX_SIZES: Record<string, number> = {
  image: 20 * 1024 * 1024,
  video: 200 * 1024 * 1024,
  audio: 50 * 1024 * 1024,
  document: 25 * 1024 * 1024,
  text: 2 * 1024 * 1024,
  default: 20 * 1024 * 1024,
};

const MAGIC_SIGNATURES: Array<{ mime: string; kind: string; sig: number[]; offset?: number }> = [
  { mime: 'image/jpeg', kind: 'image', sig: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png', kind: 'image', sig: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { mime: 'image/gif', kind: 'image', sig: [0x47, 0x49, 0x46, 0x38] },
  { mime: 'image/webp', kind: 'image', sig: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // also check WEBP at offset 8
  { mime: 'image/bmp', kind: 'image', sig: [0x42, 0x4D] },
  { mime: 'application/pdf', kind: 'document', sig: [0x25, 0x50, 0x44, 0x46] },
  { mime: 'video/mp4', kind: 'video', sig: [0x66, 0x74, 0x79, 0x70], offset: 4 },
  { mime: 'video/webm', kind: 'video', sig: [0x1A, 0x45, 0xDF, 0xA3] },
  { mime: 'audio/mpeg', kind: 'audio', sig: [0x49, 0x44, 0x33] },
  { mime: 'audio/mp3', kind: 'audio', sig: [0xFF, 0xFB] },
  { mime: 'audio/wav', kind: 'audio', sig: [0x52, 0x49, 0x46, 0x46] },
  { mime: 'application/zip', kind: 'document', sig: [0x50, 0x4B, 0x03, 0x04] }, // also pptx/docx/xlsx
];

// Block these MIME types and extensions outright.
const DANGEROUS_EXT = /\.(exe|dll|bat|cmd|com|msi|scr|jar|app|bin|sh|ps1|vbs|vbe|js|mjs|cjs|wsf|hta|cpl|reg|ade|adp|chm|ins|isp|lib|lnk|mde|pif|scf|sct|shs)$/i;

const SUSPICIOUS_PATTERNS = [
  /X5O!P%@AP\[4\\PZX54\(P\^\)7CC\)7\}\$EICAR/, // EICAR
  /<script[\s>][\s\S]{0,4000}<\/script>/i,
  /javascript:\s*[a-z]/i,
  /onerror\s*=\s*["']?\s*[a-z]/i,
  /eval\s*\(\s*atob\s*\(/i,
  /document\.write\s*\(\s*unescape/i,
  /powershell\s+-(e|enc|encoded)/i,
  /base64,\s*[A-Za-z0-9+/]{4000,}/,
];

export interface ScanResult {
  ok: boolean;
  reason?: string;
  kind?: string;
  detectedMime?: string;
}

function matchSignature(bytes: Uint8Array, sig: number[], offset = 0): boolean {
  for (let i = 0; i < sig.length; i++) {
    if (bytes[offset + i] !== sig[i]) return false;
  }
  return true;
}

export function detectKind(bytes: Uint8Array): { mime: string; kind: string } | null {
  for (const s of MAGIC_SIGNATURES) {
    if (matchSignature(bytes, s.sig, s.offset || 0)) {
      if (s.mime === 'image/webp') {
        if (matchSignature(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
          return { mime: 'image/webp', kind: 'image' };
        }
        continue;
      }
      return { mime: s.mime, kind: s.kind };
    }
  }
  // try plain text
  const sample = bytes.subarray(0, 512);
  let printable = 0;
  for (const b of sample) {
    if (b === 9 || b === 10 || b === 13 || (b >= 32 && b <= 126)) printable++;
  }
  if (printable / Math.max(1, sample.length) > 0.85) {
    return { mime: 'text/plain', kind: 'text' };
  }
  return null;
}

export async function scanUpload(input: {
  bytes: Uint8Array;
  filename?: string;
  declaredMime?: string;
}): Promise<ScanResult> {
  const { bytes, filename = '', declaredMime = '' } = input;

  if (filename && DANGEROUS_EXT.test(filename)) {
    return { ok: false, reason: 'dangerous_extension' };
  }
  if (/(exe|x-msdownload|x-msi|x-sh|x-shellscript|x-bat)/i.test(declaredMime)) {
    return { ok: false, reason: 'dangerous_mime' };
  }

  const detected = detectKind(bytes);
  if (!detected) return { ok: false, reason: 'unknown_format' };

  const max = MAX_SIZES[detected.kind] || MAX_SIZES.default;
  if (bytes.byteLength > max) {
    return { ok: false, reason: 'too_large', kind: detected.kind };
  }

  // For text/SVG/HTML/PDF, scan ASCII portion for malicious patterns
  if (detected.kind === 'text' || detected.mime === 'application/pdf' || /svg/i.test(declaredMime)) {
    const head = new TextDecoder('utf-8', { fatal: false }).decode(bytes.subarray(0, Math.min(bytes.byteLength, 256 * 1024)));
    for (const pat of SUSPICIOUS_PATTERNS) {
      if (pat.test(head)) return { ok: false, reason: 'malicious_pattern', kind: detected.kind };
    }
  }

  // If declared as image but signature mismatches, reject (polyglot defense)
  if (declaredMime && declaredMime.startsWith('image/') && !detected.mime.startsWith('image/')) {
    return { ok: false, reason: 'mime_mismatch', detectedMime: detected.mime };
  }

  return { ok: true, kind: detected.kind, detectedMime: detected.mime };
}

const SCAN_MESSAGES: Record<string, Record<string, string>> = {
  dangerous_extension: {
    ar: 'تم رفض الملف: امتداد غير آمن.',
    en: 'File rejected: unsafe extension.',
  },
  dangerous_mime: {
    ar: 'تم رفض الملف: نوع غير مسموح.',
    en: 'File rejected: disallowed mime type.',
  },
  unknown_format: {
    ar: 'تعذّر التعرف على نوع الملف.',
    en: 'Could not recognize file type.',
  },
  too_large: {
    ar: 'الملف كبير جداً.',
    en: 'File is too large.',
  },
  malicious_pattern: {
    ar: 'تم رفض الملف: تم اكتشاف محتوى خبيث.',
    en: 'File rejected: malicious content detected.',
  },
  mime_mismatch: {
    ar: 'تم رفض الملف: عدم تطابق نوع الملف.',
    en: 'File rejected: declared type does not match content.',
  },
};

export function scanMessage(reason: string, locale: string): string {
  return SCAN_MESSAGES[reason]?.[locale] || SCAN_MESSAGES[reason]?.en || 'File rejected.';
}
