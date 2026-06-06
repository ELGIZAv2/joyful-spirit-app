import { generateBuilderSchema, uploadArtifact } from "./aiSchema";
import type { BuilderResult, RoadmapSchema } from "./types";

const PALETTE = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

/** Render a horizontal SVG roadmap, return as a downloadable .svg + HTML preview. */
export async function buildRoadmap(topic: string, brief?: unknown): Promise<BuilderResult> {
  const schema = await generateBuilderSchema<RoadmapSchema>("roadmap", topic, { brief });
  if (!schema || !schema.phases?.length) {
    return { title: topic, summary: "Roadmap generation failed. Please try again." };
  }

  const phaseW = 320;
  const phaseGap = 40;
  const totalW = Math.max(1200, schema.phases.length * (phaseW + phaseGap));
  const totalH = 720;

  const phasesSvg = schema.phases.map((p, i) => {
    const x = 60 + i * (phaseW + phaseGap);
    const color = PALETTE[i % PALETTE.length];
    const items = (p.items || []).slice(0, 6);
    return `
      <g transform="translate(${x},120)">
        <rect width="${phaseW}" height="540" rx="22" fill="white" stroke="${color}" stroke-width="2" opacity="0.95" />
        <rect width="${phaseW}" height="68" rx="22" fill="${color}" />
        <text x="24" y="32" font-family="Inter, sans-serif" font-size="13" fill="rgba(255,255,255,0.85)" font-weight="600" letter-spacing="2">${escapeXml((p.period || "").toUpperCase())}</text>
        <text x="24" y="56" font-family="Inter, sans-serif" font-size="20" fill="white" font-weight="700">${escapeXml(p.name)}</text>
        ${p.goal ? `<text x="24" y="100" font-family="Inter, sans-serif" font-size="12" fill="#475569"><tspan>Goal:</tspan> <tspan font-weight="600" fill="#0f172a">${escapeXml(p.goal.slice(0, 56))}</tspan></text>` : ""}
        ${items.map((it, k) => `
          <g transform="translate(24,${130 + k * 58})">
            <circle cx="8" cy="8" r="6" fill="${color}" />
            <text x="22" y="13" font-family="Inter, sans-serif" font-size="13" fill="#1e293b">${escapeXml(it.slice(0, 42))}</text>
          </g>
        `).join("")}
      </g>
    `;
  }).join("");

  const arrows = schema.phases.slice(0, -1).map((_, i) => {
    const x1 = 60 + i * (phaseW + phaseGap) + phaseW;
    const x2 = x1 + phaseGap;
    const y = 120 + 540 / 2;
    return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#cbd5e1" stroke-width="3" stroke-dasharray="6 6" />`;
  }).join("");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f8fafc"/>
      <stop offset="1" stop-color="#eef2ff"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)" />
  <text x="60" y="60" font-family="Inter, sans-serif" font-size="32" font-weight="800" fill="#0f172a">${escapeXml(schema.title)}</text>
  ${schema.horizon ? `<text x="60" y="92" font-family="Inter, sans-serif" font-size="14" fill="#64748b">${escapeXml(schema.horizon)}</text>` : ""}
  ${arrows}
  ${phasesSvg}
</svg>`;

  const blob = new Blob([svg], { type: "image/svg+xml" });
  const safe = (schema.title || "roadmap").replace(/[^a-z0-9-_ ]/gi, "_").slice(0, 50);
  const url = await uploadArtifact(blob, `${safe}.svg`);

  const previewHtml = `<div style="background:#f1f5f9;padding:24px;overflow:auto;">${svg}</div>`;

  return {
    title: schema.title,
    summary: `Your roadmap "${schema.title}" is ready with ${schema.phases.length} phases.`,
    downloadUrl: url ?? undefined,
    previewHtml,
    mimeType: "image/svg+xml",
  };
}

function escapeXml(s: string): string {
  return (s || "").replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c] as string));
}
