// Robust Markdown normalizer for Deep Research reports.
// Strategy: minimal touch. Don't break valid Markdown. Just clean leakage,
// strip inline images, normalize bullets, and ensure tables have separators.

const ARABIC_REGEX = /[\u0600-\u06FF]/;

export const normalizeResearchReport = (raw: string): string => {
  if (!raw) return "";

  let s = raw;

  // 0) Strip deep-research streaming/agent leakage that sometimes ends up saved.
  s = s
    .replace(/^Browser Agent Result for[^\n]*\n?/gim, "")
    .replace(/\{"status"\s*:\s*"[^"]+"\}/g, "")
    .replace(/^\s*===\s*Next Source\s*===\s*$/gim, "")
    .replace(/^\s*===\s*[A-Za-z ]+\s*===\s*$/gim, "")
    .replace(/^Source:\s*$/gim, "");

  // 1) Strip leakage / thinking / tool blocks
  s = s
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "")
    .replace(/<tool[\s\S]*?<\/tool>/gi, "");

  // 2) Strip inline images (handled by gallery)
  s = s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/<img\b[^>]*>/gi, "");

  // 3) Unify line endings + tabs + nbsp
  s = s
    .replace(/\r\n?/g, "\n")
    .replace(/\t/g, "    ")
    .replace(/\u00A0/g, " ");

  // 4) Strip bold wrappers from headings: "## **Title**" -> "## Title"
  s = s.replace(/^(#{1,6})\s*\*\*\s*([^\n]*?)\s*\*\*\s*$/gm, "$1 $2");

  // 5) Headings without space after # -> add space
  s = s.replace(/^(#{1,6})([^\s#])/gm, "$1 $2");

  // 6) Normalize unicode bullets to "- "
  s = s.replace(/^([ \t]*)[•●◦∙·▪▫■□–—](\s+)/gm, "$1- ");

  // 7) Ordered list items missing space
  s = s.replace(/^(\s*\d+\.)([^\s])/gm, "$1 $2");

  // 8) Ensure blank line BEFORE headings & blockquotes (NOT tables — would break them)
  s = s
    .replace(/([^\n])\n(#{1,6}\s)/g, "$1\n\n$2")
    .replace(/([^\n])\n(>\s)/g, "$1\n\n$2");

  // 8b) Ensure blank line before a table row, but only when previous line is plain text
  // (not another table row or separator)
  s = s.replace(
    /^([^\n|][^\n]*)\n(\|[^\n]+\|)\s*$/gm,
    (_m, prev: string, table: string) => {
      if (/^\s*$/.test(prev)) return _m;
      return `${prev}\n\n${table}`;
    },
  );

  // 9) Repair tables: ensure separator after header AND remove blank lines inside table
  const lines = s.split("\n");
  const isTableLine = (l: string) => /^\|.*\|\s*$/.test(l.trim());
  const isSepLine = (l: string) =>
    /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(l.trim());

  // Pass 1: drop blank lines between two table rows (GFM breaks otherwise)
  const compact: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const cur = lines[i];
    if (cur.trim() === "") {
      const prev = lines[i - 1] ?? "";
      // look ahead past additional blank lines
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === "") j++;
      const next = lines[j] ?? "";
      if (isTableLine(prev) && isTableLine(next)) continue;
    }
    compact.push(cur);
  }

  // Pass 2: insert separator row after header if missing
  const out: string[] = [];
  for (let i = 0; i < compact.length; i++) {
    const line = compact[i];
    out.push(line);
    if (isTableLine(line) && !isSepLine(line)) {
      const prev = compact[i - 1] ?? "";
      const next = compact[i + 1] ?? "";
      const prevIsTable = isTableLine(prev);
      const nextIsSep = isSepLine(next);
      if (!prevIsTable && !nextIsSep) {
        const cells = line.trim().split("|").filter((c) => c.length > 0);
        out.push("| " + Array(Math.max(cells.length, 2)).fill("---").join(" | ") + " |");
      }
    }
  }
  s = out.join("\n");

  // 10) Collapse 3+ blank lines to 2
  s = s.replace(/\n{3,}/g, "\n\n");

  // 11) Trim leading/trailing blank lines and stray horizontal rules at top
  s = s.replace(/^\s*(?:-{3,}\s*\n+)+/, "").trim();

  return s;
};

export const detectResearchReportDirection = (report: string) =>
  ARABIC_REGEX.test(report) ? "rtl" : "ltr";
