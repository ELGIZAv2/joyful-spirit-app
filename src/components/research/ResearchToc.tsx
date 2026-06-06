import { useEffect, useMemo, useState } from "react";

interface TocItem { id: string; text: string; level: 2 | 3 }

function slugify(s: string): string {
  return s.toLowerCase().trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .slice(0, 80) || "section";
}

export function extractToc(markdown: string): TocItem[] {
  const items: TocItem[] = [];
  const seen = new Set<string>();
  for (const line of markdown.split("\n")) {
    const m = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!m) continue;
    const level = m[1].length as 2 | 3;
    const text = m[2].replace(/[*_`#]/g, "").trim();
    if (!text) continue;
    let id = slugify(text);
    let n = 1;
    while (seen.has(id)) id = `${slugify(text)}-${++n}`;
    seen.add(id);
    items.push({ id, text, level });
  }
  return items;
}

interface Props { markdown: string; isRtl: boolean }

const ResearchToc = ({ markdown, isRtl }: Props) => {
  const items = useMemo(() => extractToc(markdown), [markdown]);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    // Tag matching headings in the rendered article with ids so anchors work.
    const headings = document.querySelectorAll<HTMLElement>(
      "article h2, article h3, .prose h2, .prose h3"
    );
    let i = 0;
    headings.forEach((h) => {
      const txt = h.textContent?.trim();
      if (!txt) return;
      const item = items[i];
      if (item && txt.startsWith(item.text.slice(0, 20))) {
        h.id = item.id;
        i++;
      }
    });

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );
    items.forEach((it) => {
      const el = document.getElementById(it.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [items]);

  if (items.length < 3) return null;

  return (
    <nav
      className={`fixed top-24 ${isRtl ? "left-4" : "right-4"} z-20 hidden max-h-[70vh] w-60 overflow-y-auto rounded-2xl border border-foreground/10 bg-background/70 p-4 backdrop-blur-xl xl:block`}
      dir={isRtl ? "rtl" : "ltr"}
      aria-label="Table of contents"
    >
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/50">
        {isRtl ? "المحتويات" : "Contents"}
      </div>
      <ul className="space-y-1 text-sm">
        {items.map((it) => (
          <li key={it.id} className={it.level === 3 ? (isRtl ? "pr-3" : "pl-3") : ""}>
            <a
              href={`#${it.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(it.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`block truncate rounded px-2 py-1 transition ${
                active === it.id
                  ? "bg-foreground/10 text-foreground"
                  : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
              }`}
            >
              {it.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default ResearchToc;
