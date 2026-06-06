// Parse uploaded files (PDF, DOCX, plain text) into model-readable text.
// Used by the chat upload handler so the model actually receives the content
// instead of binary garbage.

import * as pdfjs from "pdfjs-dist";
// Vite-friendly worker import
// @ts-ignore
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";

// Configure pdfjs worker once
try {
  (pdfjs as any).GlobalWorkerOptions.workerSrc = pdfWorker;
} catch { /* ignore */ }

const MAX_CHARS = 30_000; // safety cap so we don't blow the model context

function clip(text: string): string {
  const cleaned = text.replace(/\u0000/g, "").replace(/[ \t]+\n/g, "\n").trim();
  if (cleaned.length <= MAX_CHARS) return cleaned;
  return cleaned.slice(0, MAX_CHARS) + `\n\n[... Done File truncated at ${MAX_CHARS} characters ...]`;
}

async function parsePdf(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const doc = await (pdfjs as any).getDocument({ data: buf }).promise;
  const pages: string[] = [];
  const max = Math.min(doc.numPages, 50);
  for (let i = 1; i <= max; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((it: any) => it.str).join(" ");
    pages.push(`--- Page ${i} ---\n${text}`);
  }
  return clip(pages.join("\n\n"));
}

async function parseDocx(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
  return clip(value || "");
}

async function parsePlainText(file: File): Promise<string> {
  const txt = await file.text();
  return clip(txt);
}

export async function parseUploadedFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  try {
    if (name.endsWith(".pdf") || file.type === "application/pdf") {
      return await parsePdf(file);
    }
    if (
      name.endsWith(".docx") ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return await parseDocx(file);
    }
    // Legacy .doc — mammoth doesn't support it; fall through to text() which will be ugly
    if (name.endsWith(".doc")) {
      return `[Could not read legacy .doc file. Please save it as .docx or PDF.]`;
    }
    return await parsePlainText(file);
  } catch (e: any) {
    console.error("[parseUploadedFile] failed:", e);
    return `[Could not extract content from ${file.name}: ${e?.message || "unknown"}]`;
  }
}
