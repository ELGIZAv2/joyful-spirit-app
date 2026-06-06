// Parses ::learn cards (JSON blocks tagged "learn_card") out of an assistant message.
// Format expected from the AI:
//
// ```learn
// { "type": "mcq", "question": "...", "options": [...], "correct": 0, "explain": "..." }
// ```
//
// Multiple ```learn blocks per message are supported; surrounding text becomes
// regular markdown segments.

export type LearnCardType =
  | "mcq"
  | "multi"
  | "truefalse"
  | "explain"
  | "fill"
  | "match"
  | "checkin"
  | "mermaid"
  | "roadmap"
  | "exam_setup"
  | "exam_runner"
  | "photo_solve"
  | "onboarding";

export interface LearnCardData {
  type: LearnCardType;
  [k: string]: any;
}

export interface LearnSegment {
  kind: "text" | "card";
  text?: string;
  card?: LearnCardData;
}

const KNOWN_TYPES = new Set<string>([
  "mcq", "multi", "truefalse", "explain", "fill", "match",
  "checkin", "mermaid", "roadmap", "exam_setup", "exam_runner",
  "photo_solve", "onboarding",
]);

function tryParseCard(raw: string): LearnCardData | null {
  try {
    const obj = JSON.parse(raw.trim());
    if (!obj || typeof obj !== "object") return null;
    // Accept if type is a known learn type
    if (typeof obj.type === "string" && KNOWN_TYPES.has(obj.type)) {
      return obj as LearnCardData;
    }
    // Heuristic: an object with "options" array + ("question" or no other keys)
    // is treated as a checkin card (model sometimes emits options without "type")
    if (Array.isArray(obj.options) && obj.options.length > 0 && obj.options.every((o: any) => typeof o === "string")) {
      return { type: "checkin", question: obj.question, options: obj.options } as LearnCardData;
    }
    return null;
  } catch {
    return null;
  }
}

export function parseLearnSegments(content: string): LearnSegment[] {
  if (!content) return [];
  const segments: LearnSegment[] = [];

  // Match ```learn ... ```, ```learn_card ... ```, or ```json ... ``` (any fenced block)
  const fenceRe = /```(learn|learn_card|json)?\s*\n?([\s\S]*?)```/g;
  // Also detect bare top-level JSON-like blocks that contain "options" or "type"
  // We do fences first, then look for bare blocks in remaining text.

  let last = 0;
  let m: RegExpExecArray | null;
  const fenceRanges: Array<[number, number]> = [];
  while ((m = fenceRe.exec(content)) !== null) {
    if (m.index > last) {
      const t = content.slice(last, m.index);
      // Defer pushing — we'll re-scan text for bare JSON below
      pushTextWithBareCards(segments, t);
    }
    const tag = m[1];
    const body = m[2];
    const card = tryParseCard(body);
    if (card && (tag === "learn" || tag === "learn_card" || tag === "json")) {
      segments.push({ kind: "card", card });
    } else if (card && !tag) {
      // Untagged fence — only treat as card if parses cleanly to known type
      segments.push({ kind: "card", card });
    } else {
      segments.push({ kind: "text", text: m[0] });
    }
    fenceRanges.push([m.index, m.index + m[0].length]);
    last = m.index + m[0].length;
  }
  if (last < content.length) {
    pushTextWithBareCards(segments, content.slice(last));
  }
  if (segments.length === 0 && content.trim()) {
    segments.push({ kind: "text", text: content });
  }
  return segments;
}

// Find bare top-level JSON objects in a text chunk that look like learn cards
function pushTextWithBareCards(segments: LearnSegment[], text: string) {
  if (!text || !text.trim()) {
    if (text) segments.push({ kind: "text", text });
    return;
  }
  // Match balanced top-level { ... } blocks (single-line OR multi-line). We use
  // a simple scanner since regex can't balance braces.
  const out: Array<{ kind: "text" | "card"; value: any }> = [];
  let i = 0;
  let buf = "";
  while (i < text.length) {
    if (text[i] === "{") {
      // Try to find matching }
      let depth = 0;
      let j = i;
      let inStr = false;
      let esc = false;
      for (; j < text.length; j++) {
        const ch = text[j];
        if (inStr) {
          if (esc) { esc = false; continue; }
          if (ch === "\\") { esc = true; continue; }
          if (ch === '"') inStr = false;
          continue;
        }
        if (ch === '"') { inStr = true; continue; }
        if (ch === "{") depth++;
        else if (ch === "}") { depth--; if (depth === 0) { j++; break; } }
      }
      if (depth === 0 && j > i) {
        const candidate = text.slice(i, j);
        const card = tryParseCard(candidate);
        if (card) {
          if (buf) { out.push({ kind: "text", value: buf }); buf = ""; }
          out.push({ kind: "card", value: card });
          i = j;
          continue;
        }
      }
    }
    buf += text[i];
    i++;
  }
  if (buf) out.push({ kind: "text", value: buf });
  for (const seg of out) {
    if (seg.kind === "card") segments.push({ kind: "card", card: seg.value });
    else if (seg.value && String(seg.value).trim()) segments.push({ kind: "text", text: seg.value });
  }
}

export function hasLearnCards(content: string): boolean {
  if (/```(learn|learn_card)\s/.test(content)) return true;
  // Quick heuristic: contains a JSON-like { ... "options": [ ... ] }
  if (/\{[\s\S]*?"options"\s*:\s*\[[\s\S]*?\][\s\S]*?\}/.test(content)) return true;
  // ```json fenced with type matching known
  const m = content.match(/```json\s*\n?([\s\S]*?)```/);
  if (m) {
    try {
      const o = JSON.parse(m[1].trim());
      if (o && typeof o === "object" && KNOWN_TYPES.has(o.type)) return true;
    } catch { /* ignore */ }
  }
  return false;
}
