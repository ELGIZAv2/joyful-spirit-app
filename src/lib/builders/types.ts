// Shared types for the specialized file builders.

export type FileBuilderType =
  | "document"
  | "resume"
  | "report"
  | "spreadsheet"
  | "letter"
  | "roadmap"
  | "mindmap"
  | "timeline";

export interface BuilderResult {
  /** Friendly title shown in the chat summary. */
  title: string;
  /** One-paragraph plain-text description of what was built. */
  summary: string;
  /** Public/object URL of the produced artifact (PDF, XLSX, PNG, JSON, ...). */
  downloadUrl?: string;
  /** Optional inline HTML preview for the right-side panel. */
  previewHtml?: string;
  /** Optional in-browser blob URL for previewing PDF artifacts inline. */
  pdfPreviewUrl?: string;
  /** Mime type of the produced artifact. */
  mimeType?: string;
}

export interface DocumentSchema {
  title: string;
  subtitle?: string;
  sections: { heading: string; body: string }[];
  language?: string;
  hero_image_query?: string;
}

export interface ResumeSchema {
  name: string;
  headline?: string;
  contact?: { email?: string; phone?: string; location?: string; website?: string };
  summary?: string;
  experience?: { role: string; company: string; period?: string; bullets?: string[] }[];
  education?: { degree: string; school: string; period?: string }[];
  skills?: string[];
  languages?: string[];
  language?: string;
}

export interface ReportSchema {
  title: string;
  executive_summary?: string;
  kpis?: { label: string; value: string; delta?: string }[];
  sections?: { heading: string; body: string; chart?: ReportChart }[];
  language?: string;
}

export interface ReportChart {
  type: "bar" | "line" | "pie";
  title?: string;
  data: { name: string; value: number }[];
}

export interface SpreadsheetSchema {
  sheet_name: string;
  columns: string[];
  rows: (string | number | null)[][];
  totals_row?: boolean;
  language?: string;
}

export interface LetterSchema {
  sender?: { name?: string; address?: string; email?: string };
  recipient?: { name?: string; address?: string };
  date?: string;
  subject?: string;
  body: string;
  closing?: string;
  language?: string;
}

export interface RoadmapSchema {
  title: string;
  horizon?: string;
  phases: { name: string; period?: string; goal?: string; items?: string[] }[];
  language?: string;
}

export interface MindmapSchema {
  central_idea: string;
  branches: { label: string; children?: string[] }[];
  language?: string;
}

export interface TimelineSchema {
  title: string;
  orientation?: "vertical" | "horizontal";
  events: { date: string; title: string; description?: string }[];
  language?: string;
}

export type AnyBuilderSchema =
  | DocumentSchema
  | ResumeSchema
  | ReportSchema
  | SpreadsheetSchema
  | LetterSchema
  | RoadmapSchema
  | MindmapSchema
  | TimelineSchema;
