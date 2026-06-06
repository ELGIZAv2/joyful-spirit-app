// Shared types + helpers for research templates
import { useEffect, useState } from "react";

export interface ReportData {
  query: string;
  report: string;
  images: string[];
}

export interface TemplateProps {
  data: ReportData;
  cleanReport: string;
  isRtl: boolean;
  sources: string[];
  wordCount: number;
  readMins: number;
  reportEmpty: boolean;
}

export interface Section {
  heading: string;
  body: string;
}

// Split markdown by ## headings into editorial sections
export const splitIntoSections = (md: string): { intro: string; sections: Section[] } => {
  const lines = md.split("\n");
  const intro: string[] = [];
  const sections: Section[] = [];
  let current: Section | null = null;
  let started = false;
  for (const line of lines) {
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m && !line.startsWith("###")) {
      if (current) sections.push(current);
      current = { heading: m[1].trim(), body: "" };
      started = true;
      continue;
    }
    if (!started && /^#\s+/.test(line)) continue;
    if (current) current.body += line + "\n";
    else intro.push(line);
  }
  if (current) sections.push(current);
  return { intro: intro.join("\n").trim(), sections };
};

export const extractUrls = (md: string): string[] => {
  const urls = new Set<string>();
  const re = /https?:\/\/[^\s)\]<>"]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) {
    const u = m[0].replace(/[.,;:!?]+$/, "");
    if (urls.size < 18) urls.add(u);
  }
  return Array.from(urls);
};

export const hostname = (u: string) => {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; }
};

// Deterministic template id from a string seed
export const pickTemplateFromSeed = (seed: string, count: number): number => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % count;
};

// Top scroll progress bar
export const ScrollProgress = () => {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setP(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="fixed inset-x-0 top-0 z-40 h-[2px] bg-transparent">
      <div
        className="h-full bg-primary transition-[width] duration-150"
        style={{ width: `${p}%` }}
      />
    </div>
  );
};
