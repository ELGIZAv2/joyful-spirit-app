import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { TemplateProps, splitIntoSections, hostname } from "./templateUtils";
import SmartImage from "./SmartImage";

/**
 * Editorial reading template inspired by leerob.com and Vercel's open-source blog.
 * - Generous whitespace, serif headings + sans body
 * - Sticky table of contents on desktop
 * - Inline numbered citations, footnote-style sources
 * - 100% theme tokens (light/dark)
 */

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);

const md = {
  h1: ({ node: _n, ...p }: any) => (
    <h2 dir="auto" className="mt-8 mb-3 break-words font-display text-xl font-semibold tracking-tight text-foreground sm:mt-16 sm:mb-4 sm:text-4xl" {...p} />
  ),
  h2: ({ node: _n, ...p }: any) => (
    <h2 dir="auto" className="mt-8 mb-3 break-words font-display text-xl font-semibold tracking-tight text-foreground sm:mt-16 sm:mb-4 sm:text-4xl" {...p} />
  ),
  h3: ({ node: _n, ...p }: any) => (
    <h3 dir="auto" className="mt-6 mb-2 break-words font-display text-base font-semibold tracking-tight text-foreground sm:mt-10 sm:mb-3 sm:text-2xl" {...p} />
  ),
  p: ({ node: _n, ...p }: any) => (
    <p dir="auto" className="my-3 break-words text-[15px] leading-[1.8] text-foreground/85 sm:my-5 sm:text-[17px] sm:leading-[1.85]" {...p} />
  ),
  ul: ({ node: _n, ...p }: any) => (
    <ul dir="auto" className="my-4 space-y-1.5 ps-4 list-disc marker:text-muted-foreground sm:my-5 sm:space-y-2 sm:ps-5" {...p} />
  ),
  ol: ({ node: _n, ...p }: any) => (
    <ol dir="auto" className="my-4 space-y-1.5 ps-4 list-decimal marker:text-muted-foreground sm:my-5 sm:space-y-2 sm:ps-5" {...p} />
  ),
  li: ({ node: _n, ...p }: any) => (
    <li dir="auto" className="break-words text-[15px] leading-[1.75] text-foreground/85 sm:text-[17px] sm:leading-[1.8]" {...p} />
  ),
  blockquote: ({ node: _n, ...p }: any) => (
    <blockquote
      dir="auto"
      className="my-6 border-s-2 border-primary ps-4 font-display text-lg italic text-foreground/90 sm:my-8 sm:ps-5 sm:text-2xl"
      {...p}
    />
  ),
  table: ({ node: _n, ...p }: any) => (
    <div className="my-8 -mx-4 overflow-x-auto sm:mx-0">
      <div className="inline-block min-w-full align-middle px-4 sm:px-0">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table
            className="min-w-full border-collapse text-[14.5px] [&_tbody_tr]:border-t [&_tbody_tr]:border-border/60 [&_tbody_tr:nth-child(even)]:bg-muted/25 [&_tbody_tr:hover]:bg-muted/50 [&_tbody_tr]:transition-colors"
            {...p}
          />
        </div>
      </div>
    </div>
  ),
  thead: ({ node: _n, ...p }: any) => (
    <thead className="bg-muted/40" {...p} />
  ),
  tbody: ({ node: _n, ...p }: any) => (
    <tbody {...p} />
  ),
  tr: ({ node: _n, ...p }: any) => (
    <tr {...p} />
  ),
  th: ({ node: _n, ...p }: any) => (
    <th
      dir="auto"
      className="px-4 py-3 text-start text-[12px] font-semibold uppercase tracking-[0.08em] text-foreground/80 [&:not(:last-child)]:border-e [&:not(:last-child)]:border-border/60"
      {...p}
    />
  ),
  td: ({ node: _n, ...p }: any) => (
    <td
      dir="auto"
      className="px-4 py-3 align-top text-[14.5px] leading-[1.65] text-foreground/85 first:font-medium first:text-foreground [&:not(:last-child)]:border-e [&:not(:last-child)]:border-border/60"
      {...p}
    />
  ),
  hr: () => <hr className="my-12 border-border" />,
  code: ({ inline, className, children, ...p }: any) => {
    const text = String(children ?? "");
    // Newer react-markdown drops `inline` prop — detect inline by absence of
    // a language- className AND no embedded newlines.
    const isInline = inline ?? (!/^language-/.test(className || "") && !text.includes("\n"));
    if (isInline) {
      return (
        <code className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[0.88em] text-foreground/90" {...p}>
          {children}
        </code>
      );
    }
    return (
      <pre className="my-6 overflow-x-auto rounded-xl border border-border bg-muted/30 p-4">
        <code className={`font-mono text-[13.5px] leading-[1.65] text-foreground/90 ${className || ""}`} {...p}>
          {children}
        </code>
      </pre>
    );
  },
  img: () => null,
  a: ({ node: _n, href, children, ...p }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-primary underline decoration-primary/30 underline-offset-[3px] transition hover:decoration-primary"
      {...p}
    >
      {children}
    </a>
  ),
};

const ResearchArticleTemplate = ({
  data, cleanReport, isRtl, sources, wordCount, readMins, reportEmpty,
}: TemplateProps) => {
  const { intro, sections } = splitIntoSections(cleanReport);
  const dateText = new Date().toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  // Cap to 3 images max for deep research articles
  const limitedImages = (data.images || []).slice(0, 3);
  const cover = limitedImages[0];
  const inlineImages = limitedImages.slice(1);


  // Active section tracking for the TOC
  const tocItems = useMemo(
    () => sections.map((s, i) => ({ id: `${i}-${slugify(s.heading)}`, label: s.heading })),
    [sections],
  );
  const [activeId, setActiveId] = useState<string>("");
  useEffect(() => {
    if (tocItems.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    tocItems.forEach((t) => {
      const el = document.getElementById(t.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [tocItems]);

  return (
    <div className="bg-background text-foreground">
      <article className="mx-auto max-w-[1200px] px-3 sm:px-8 lg:px-12">
        {/* Header */}
        <header className="mx-auto max-w-[760px] pt-6 pb-6 sm:pt-20 sm:pb-14">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:text-xs">
            {isRtl ? "Deep research" : "Deep Research"}
          </div>
          <motion.h1
            dir="auto"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 break-words font-display text-[26px] leading-[1.2] font-semibold tracking-tight text-foreground sm:mt-4 sm:text-5xl sm:leading-tight md:text-6xl"
          >
            {data.query}
          </motion.h1>
        </header>

        {/* Cover image */}
        {cover && (
          <motion.figure
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mx-auto mb-8 max-w-[1100px] overflow-hidden rounded-xl sm:mb-16 sm:rounded-none"
          >
            <SmartImage src={cover} loading="eager" />
          </motion.figure>
        )}

        {/* Body + sticky TOC */}
        <div className="grid gap-8 lg:grid-cols-[1fr_220px] lg:gap-16">
          {/* Main column */}
          <div className="mx-auto w-full max-w-[720px] min-w-0 pb-12 sm:pb-20">
            {reportEmpty ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                {isRtl ? "Report is being prepared." : "Report is being prepared."}
              </div>
            ) : (
              <>
                {intro && (
                  <section
                    lang={isRtl ? "ar" : "en"}
                    dir={isRtl ? "rtl" : "ltr"}
                    className=""
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
                      {intro}
                    </ReactMarkdown>
                  </section>
                )}

                {sections.map((s, i) => {
                  const id = `${i}-${slugify(s.heading)}`;
                  const img = inlineImages[i];
                  return (
                    <section
                      key={id}
                      id={id}
                      lang={isRtl ? "ar" : "en"}
                      dir={isRtl ? "rtl" : "ltr"}
                      className="scroll-mt-24"
                    >
                      <div className="mt-10 mb-4 sm:mt-20 sm:mb-6">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-medium tabular-nums text-primary">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="h-px flex-1 bg-border" />
                        </div>
                        <h2
                          dir="auto"
                          className="mt-3 break-words font-display text-[22px] leading-[1.25] font-semibold tracking-tight text-foreground sm:text-[40px] sm:leading-[1.15]"
                        >
                          {s.heading}
                        </h2>
                      </div>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
                        {s.body}
                      </ReactMarkdown>
                      {img && (
                        <motion.figure
                          initial={{ opacity: 0, y: 16 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-80px" }}
                          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                          className="my-10 overflow-hidden"
                        >
                          <SmartImage src={img} loading="lazy" />
                        </motion.figure>
                      )}
                    </section>
                  );
                })}

                {/* Sources — footnote style */}
                {sources.length > 0 && (
                  <section className="mt-20 border-t border-border pt-10">
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-4 transition hover:border-primary/40 hover:bg-muted/30">
                        <div className="flex items-center gap-3">
                          <h2 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                            {isRtl ? "Sources" : "Sources"}
                          </h2>
                          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                            {sources.length}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground transition group-open:hidden">
                          {isRtl ? "View" : "Show"}
                        </span>
                        <span className="hidden text-xs font-medium text-muted-foreground group-open:inline">
                          {isRtl ? "Hide" : "Hide"}
                        </span>
                      </summary>
                      <ol className="mt-6 space-y-3 text-sm">
                        {sources.map((u, i) => (
                          <li key={u + i} className="flex gap-3 text-foreground/80">
                            <span className="w-6 shrink-0 text-muted-foreground tabular-nums">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <a
                              href={u}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group/link inline-flex min-w-0 items-center gap-1.5 break-all underline decoration-border underline-offset-[3px] transition hover:decoration-primary hover:text-primary"
                            >
                              <span className="truncate">{hostname(u)}</span>
                              <ExternalLink className="h-3 w-3 shrink-0 opacity-0 transition group-hover/link:opacity-100" />
                            </a>
                          </li>
                        ))}
                      </ol>
                    </details>
                  </section>
                )}
              </>
            )}
          </div>

          {/* Sticky TOC sidebar */}
          {tocItems.length > 0 && (
            <aside className="hidden lg:block">
              <nav className="sticky top-24">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {isRtl ? "Content" : "On this page"}
                </div>
                <ul className="mt-4 space-y-2.5 border-s border-border ps-4">
                  {tocItems.map((t) => {
                    const active = activeId === t.id;
                    return (
                      <li key={t.id}>
                        <a
                          href={`#${t.id}`}
                          className={`-ms-px block border-s-2 ps-3 text-sm leading-snug transition ${
                            active
                              ? "border-primary text-foreground font-medium"
                              : "border-transparent text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {t.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </aside>
          )}
        </div>
      </article>
    </div>
  );
};

export default ResearchArticleTemplate;
