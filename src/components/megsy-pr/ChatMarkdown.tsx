// @ts-nocheck — imported design from external repo; backend wiring deferred.
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

interface Props {
  children: string;
  className?: string;
}

/**
 * Renders agent messages as cleanly formatted markdown:
 * bold headings, ordered/unordered lists, inline code, etc.
 * Stripped of any internal <change> XML tags – those are shown as chips elsewhere.
 */
export default function ChatMarkdown({ children, className }: Props) {
  const cleaned = (children || "")
    .replace(/<change\b[^>]*>[\s\S]*?<\/change>/gi, "")
    .replace(/<\/?(?:think|thinking|tool|step)\b[^>]*>/gi, "")
    .trim();

  return (
    <div
      dir="auto"
      className={
        "text-[15px] leading-[1.85] text-foreground/95 " +
        "[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 " +
        "[&_strong]:font-bold [&_strong]:text-foreground " +
        "[&_h1]:text-[20px] [&_h1]:font-bold [&_h1]:mt-5 [&_h1]:mb-2 " +
        "[&_h2]:text-[18px] [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 " +
        "[&_h3]:text-[16px] [&_h3]:font-bold [&_h3]:mt-3 [&_h3]:mb-1.5 " +
        "[&_ul]:list-disc [&_ul]:ps-6 [&_ul]:my-2 [&_ul]:space-y-1 " +
        "[&_ol]:list-decimal [&_ol]:ps-6 [&_ol]:my-2 [&_ol]:space-y-1 " +
        "[&_li]:marker:text-foreground/50 " +
        "[&_code]:rounded-md [&_code]:bg-foreground/[0.08] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:font-mono " +
        "[&_pre]:rounded-xl [&_pre]:bg-foreground/[0.06] [&_pre]:p-3 [&_pre]:my-3 [&_pre]:overflow-x-auto " +
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0 " +
        "[&_blockquote]:border-s-2 [&_blockquote]:border-foreground/20 [&_blockquote]:ps-3 [&_blockquote]:text-foreground/80 [&_blockquote]:my-2 " +
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 " +
        "[&_hr]:my-4 [&_hr]:border-foreground/10 " +
        (className ?? "")
      }
    >
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{cleaned}</ReactMarkdown>
    </div>
  );
}
