import { generateBuilderSchema, uploadArtifact } from "./aiSchema";
import type { BuilderResult, TimelineSchema } from "./types";

const COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

export async function buildTimeline(topic: string, brief?: unknown): Promise<BuilderResult> {
  const schema = await generateBuilderSchema<TimelineSchema>("timeline", topic, { brief });
  if (!schema || !schema.events?.length) {
    return { title: topic, summary: "Timeline generation failed. Please try again." };
  }

  const W = 1100;
  const rowH = 110;
  const H = 160 + schema.events.length * rowH;

  const items = schema.events.map((e, i) => {
    const y = 160 + i * rowH;
    const color = COLORS[i % COLORS.length];
    return `
      <line x1="160" y1="${y - 20}" x2="160" y2="${y + 70}" stroke="#cbd5e1" stroke-width="2" />
      <circle cx="160" cy="${y + 24}" r="12" fill="${color}" />
      <circle cx="160" cy="${y + 24}" r="20" fill="${color}" opacity="0.2" />
      <text x="40" y="${y + 28}" font-family="Inter, sans-serif" font-size="13" font-weight="700" fill="#0f172a">${escapeXml(e.date)}</text>
      <g transform="translate(200,${y})">
        <rect width="${W - 240}" height="80" rx="14" fill="white" stroke="#e2e8f0" />
        <text x="20" y="32" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="#0f172a">${escapeXml(e.title)}</text>
        ${e.description ? `<text x="20" y="58" font-family="Inter, sans-serif" font-size="12" fill="#475569">${escapeXml(e.description.slice(0, 90))}</text>` : ""}
      </g>
    `;
  }).join("");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="100%" height="100%" fill="#f8fafc" />
  <text x="40" y="80" font-family="Inter, sans-serif" font-size="30" font-weight="800" fill="#0f172a">${escapeXml(schema.title)}</text>
  <text x="40" y="110" font-family="Inter, sans-serif" font-size="13" fill="#64748b">${schema.events.length} events</text>
  ${items}
</svg>`;

  const blob = new Blob([svg], { type: "image/svg+xml" });
  const safe = (schema.title || "timeline").replace(/[^a-z0-9-_ ]/gi, "_").slice(0, 50);
  const url = await uploadArtifact(blob, `${safe}-timeline.svg`);

  const previewHtml = `<div style="background:#f1f5f9;padding:24px;">${svg}</div>`;

  return {
    title: schema.title,
    summary: `Your timeline "${schema.title}" is ready with ${schema.events.length} events.`,
    downloadUrl: url ?? undefined,
    previewHtml,
    mimeType: "image/svg+xml",
  };
}

function escapeXml(s: string): string {
  return (s || "").replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c] as string));
}
