import * as XLSX from "xlsx";
import { generateBuilderSchema, uploadArtifact } from "./aiSchema";
import type { BuilderResult, SpreadsheetSchema } from "./types";

/** Build a real .xlsx via SheetJS with optional totals row. */
export async function buildSpreadsheet(topic: string, brief?: unknown): Promise<BuilderResult> {
  const schema = await generateBuilderSchema<SpreadsheetSchema>("spreadsheet", topic, { brief });
  if (!schema || !schema.columns?.length) {
    return { title: topic, summary: "Spreadsheet generation failed. Please try again." };
  }

  const aoa: (string | number | null)[][] = [];
  aoa.push(schema.columns);
  for (const row of schema.rows || []) aoa.push(row);

  // Add a totals row using SUM formulas where columns are numeric.
  if (schema.totals_row && (schema.rows?.length ?? 0) > 0) {
    const totals: (string | number | null)[] = schema.columns.map((_, ci) => {
      const colHasNumbers = (schema.rows || []).some(r => typeof r?.[ci] === "number");
      if (!colHasNumbers) return ci === 0 ? "Total" : null;
      const colLetter = XLSX.utils.encode_col(ci);
      const firstRow = 2; // header is row 1
      const lastRow = (schema.rows?.length ?? 0) + 1;
      return { f: `SUM(${colLetter}${firstRow}:${colLetter}${lastRow})` } as any;
    });
    aoa.push(totals);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  // Auto width based on content length.
  ws["!cols"] = schema.columns.map((c, ci) => {
    const lens = [String(c).length, ...(schema.rows || []).map(r => String(r?.[ci] ?? "").length)];
    return { wch: Math.min(40, Math.max(10, Math.max(...lens) + 2)) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, (schema.sheet_name || "Sheet1").slice(0, 30));
  const arrayBuffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  const blob = new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const safe = (schema.sheet_name || "spreadsheet").replace(/[^a-z0-9-_ ]/gi, "_").slice(0, 50);
  const url = await uploadArtifact(blob, `${safe}.xlsx`, "spreadsheets");

  // Lightweight HTML preview (first 50 rows).
  const previewHtml = `
    <div style="font-family:Inter,system-ui,sans-serif;padding:24px;overflow:auto;">
      <h2 style="margin:0 0 16px;font-size:20px;">${escapeHtml(schema.sheet_name || "Sheet")}</h2>
      <table style="border-collapse:collapse;width:100%;font-size:13px;">
        <thead><tr>${schema.columns.map(c => `<th style="text-align:left;padding:8px 12px;border-bottom:2px solid #0f172a;background:#f8fafc;">${escapeHtml(String(c))}</th>`).join("")}</tr></thead>
        <tbody>
          ${(schema.rows || []).slice(0, 50).map(r => `
            <tr>${r.map(cell => `<td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${escapeHtml(String(cell ?? ""))}</td>`).join("")}</tr>
          `).join("")}
        </tbody>
      </table>
      ${(schema.rows?.length ?? 0) > 50 ? `<p style="color:#64748b;margin-top:12px;">+ ${(schema.rows!.length - 50)} more rows in the file</p>` : ""}
    </div>
  `;

  return {
    title: schema.sheet_name || "Spreadsheet",
    summary: `Your spreadsheet "${schema.sheet_name}" is ready with ${schema.columns.length} columns and ${schema.rows?.length ?? 0} rows.`,
    downloadUrl: url ?? undefined,
    previewHtml,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}

function escapeHtml(s: string): string {
  return (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
