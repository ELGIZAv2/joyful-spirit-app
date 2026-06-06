import { Document, Page, Text, View, StyleSheet, Image, pdf, Font } from "@react-pdf/renderer";
import type { ReactElement } from "react";

// Try to register a clean Google sans font for Latin scripts.
try {
  Font.register({
    family: "Inter",
    fonts: [
      { src: "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.ttf", fontWeight: 400 },
      { src: "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7SUc.ttf", fontWeight: 700 },
    ],
  });
} catch { /* font registration is best-effort */ }

// Register an Arabic-capable font so non-Latin scripts render instead of producing blank pages.
try {
  Font.register({
    family: "NotoArabic",
    fonts: [
      { src: "https://fonts.gstatic.com/s/notonaskharabic/v33/RrQ5bpV-9Dd1b1OAGA6M9PkyDuVBePeKNaxcsss0Y7bwvc5krK0z9_Mnuw.ttf", fontWeight: 400 },
      { src: "https://fonts.gstatic.com/s/notonaskharabic/v33/RrQ5bpV-9Dd1b1OAGA6M9PkyDuVBePeKNaxcsss0Y7bwvc5krK0zw_QnvA.ttf", fontWeight: 700 },
    ],
  });
} catch { /* font registration is best-effort */ }

const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
export const hasArabic = (s?: string | null) => !!s && ARABIC_RE.test(s);
export const pickFont = (s?: string | null) => (hasArabic(s) ? "NotoArabic" : "Helvetica");

export const palette = {
  ink: "#0f172a",
  body: "#1e293b",
  muted: "#64748b",
  line: "#e2e8f0",
  bgSoft: "#f8fafc",
  primary: "#4f46e5",
  accent: "#06b6d4",
  white: "#ffffff",
  navy: "#0a2540",
  gold: "#c9a55c",
};

export const baseStyles = StyleSheet.create({
  page: { padding: 56, fontFamily: "Helvetica", color: palette.body, fontSize: 11, lineHeight: 1.55 },
  h1: { fontSize: 28, fontWeight: 700, color: palette.ink, marginBottom: 8 },
  h2: { fontSize: 16, fontWeight: 700, color: palette.ink, marginTop: 18, marginBottom: 8 },
  h3: { fontSize: 12, fontWeight: 700, color: palette.ink, marginTop: 12, marginBottom: 4 },
  p: { fontSize: 11, color: palette.body, marginBottom: 6 },
  small: { fontSize: 9, color: palette.muted },
  divider: { borderBottomWidth: 1, borderBottomColor: palette.line, marginVertical: 10 },
  pill: { fontSize: 9, color: palette.muted, padding: "2 6", borderWidth: 0.5, borderColor: palette.line, borderRadius: 8, marginRight: 4 },
  cover: { backgroundColor: palette.ink, color: palette.white, padding: 64, justifyContent: "center", height: "100%" },
  coverTitle: { fontSize: 36, fontWeight: 700, color: palette.white, marginBottom: 12 },
  coverSub: { fontSize: 14, color: "#cbd5e1" },
});

/** Render a React-PDF Document into a Blob. */
export async function pdfToBlob(doc: ReactElement): Promise<Blob> {
  const instance = pdf(doc);
  return await instance.toBlob();
}

/** Convert a remote image URL into a data URL for embedding. */
export async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch { return null; }
}

export { Document, Page, Text, View, Image };
