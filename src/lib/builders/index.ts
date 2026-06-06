import { buildDocument } from "./documentBuilder";
import { buildResume } from "./resumeBuilder";
import { buildReport } from "./reportBuilder";
import { buildSpreadsheet } from "./spreadsheetBuilder";
import { buildLetter } from "./letterBuilder";
import { buildRoadmap } from "./roadmapBuilder";
import { buildMindmap } from "./mindmapBuilder";
import { buildTimeline } from "./timelineBuilder";
import type { BuilderResult, FileBuilderType } from "./types";

export type BuilderFn = (topic: string, brief?: unknown) => Promise<BuilderResult>;

export const BUILDERS: Record<FileBuilderType, BuilderFn> = {
  document: buildDocument,
  resume: buildResume,
  report: buildReport,
  spreadsheet: buildSpreadsheet,
  letter: buildLetter,
  roadmap: buildRoadmap,
  mindmap: buildMindmap,
  timeline: buildTimeline,
};

export function getBuilder(type: string): BuilderFn | null {
  return (BUILDERS as Record<string, BuilderFn>)[type] ?? null;
}

export type { BuilderResult, FileBuilderType };
