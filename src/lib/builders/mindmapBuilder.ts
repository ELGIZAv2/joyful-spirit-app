import { generateBuilderSchema, uploadArtifact } from "./aiSchema";
import type { BuilderResult, MindmapSchema } from "./types";

const COLORS = ["#6366f1", "#ec4899", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6"];

/** Radial mind-map rendered as SVG. Branches arranged around the center. */
export async function buildMindmap(topic: string, brief?: unknown): Promise<BuilderResult> {
  const schema = await generateBuilderSchema<MindmapSchema>("mindmap", topic, { brief });
  if (!schema || !schema.branches?.length) {
    return { title: topic, summary: "Mindmap generation failed. Please try again." };
  }

  const W = 1400, H = 1000;
  const cx = W / 2, cy = H / 2;
  const branchRadius = 360;
  const childRadius = 180;

  const branchEls = schema.branches.map((b, i) => {
    const angle = (i / schema.branches.length) * Math.PI * 2;
    const bx = cx + Math.cos(angle) * branchRadius;
    const by = cy + Math.sin(angle) * branchRadius;
    const color = COLORS[i % COLORS.length];

    const children = (b.children || []).slice(0, 6);
    const childEls = children.map((c, k) => {
      const childAngle = angle + ((k / Math.max(1, children.length - 1)) - 0.5) * 0.9;
      const ccx = bx + Math.cos(childAngle) * childRadius;
      const ccy = by + Math.sin(childAngle) * childRadius;
      return `
        <line x1="${bx}" y1="${by}" x2="${ccx}" y2="${ccy}" stroke="${color}" stroke-width="1.5" opacity="0.5" />
        <g transform="translate(${ccx - 70},${ccy - 16})">
          <rect width="140" height="32" rx="16" fill="white" stroke="${color}" stroke-width="1.5" />
          <text x="70" y="20" font-family="Inter, sans-serif" font-size="11" text-anchor="middle" fill="#1e293b">${escapeXml(c.slice(0, 22))}</text>
        </g>
      `;
    }).join("");

    return `
      <line x1="${cx}" y1="${cy}" x2="${bx}" y2="${by}" stroke="${color}" stroke-width="3" />
      <g transform="translate(${bx - 90},${by - 24})">
        <rect width="180" height="48" rx="24" fill="${color}" />
        <text x="90" y="30" font-family="Inter, sans-serif" font-size="14" font-weight="700" text-anchor="middle" fill="white">${escapeXml(b.label.slice(0, 24))}</text>
      </g>
      ${childEls}
    `;
  }).join("");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <radialGradient id="bg">
      <stop offset="0" stop-color="#fafafa"/>
      <stop offset="1" stop-color="#e2e8f0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)" />
  ${branchEls}
  <g transform="translate(${cx - 130},${cy - 50})">
    <rect width="260" height="100" rx="50" fill="#0f172a" />
    <text x="130" y="58" font-family="Inter, sans-serif" font-size="20" font-weight="800" text-anchor="middle" fill="white">${escapeXml((schema.central_idea || "").slice(0, 22))}</text>
  </g>
</svg>`;

  const blob = new Blob([svg], { type: "image/svg+xml" });
  const safe = (schema.central_idea || "mindmap").replace(/[^a-z0-9-_ ]/gi, "_").slice(0, 50);
  const url = await uploadArtifact(blob, `${safe}-mindmap.svg`);

  const previewHtml = `<div style="background:#0f172a;padding:24px;display:flex;justify-content:center;">${svg}</div>`;

  return {
    title: schema.central_idea,
    summary: `Your mindmap on "${schema.central_idea}" is ready (${schema.branches.length} branches).`,
    downloadUrl: url ?? undefined,
    previewHtml,
    mimeType: "image/svg+xml",
  };
}

function escapeXml(s: string): string {
  return (s || "").replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c] as string));
}
