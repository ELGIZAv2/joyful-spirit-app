import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";

type Src = { url: string; title?: string };

interface Props {
  conversationId?: string | null;
  reportSources: string[];
  isRtl: boolean;
  reportText: string;
  reportTitle: string;
}

const ResearchReportTabs = ({ conversationId, reportSources, isRtl, reportText, reportTitle }: Props) => {
  const [thinking, setThinking] = useState<string>("");
  const [jobSources, setJobSources] = useState<Src[]>([]);

  useEffect(() => {
    if (!conversationId) return;
    (async () => {
      const { data } = await supabase
        .from("research_jobs")
        .select("sources, thinking")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        const srcs = ((data.sources as any) || []) as Src[];
        setJobSources(srcs.filter((s) => s && s.url));
        setThinking((data.thinking as string) || "");
      }
    })();
  }, [conversationId]);

  // Prefer URLs cited in the report; fall back to the job's source list so
  // we always have something to show when the markdown didn't include them.
  const used: Src[] = (reportSources.length > 0
    ? reportSources.map((u) => ({ url: u }))
    : jobSources);

  const getHost = (u: string) => {
    try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; }
  };
  const favicon = (u: string) => `https://www.google.com/s2/favicons?domain=${getHost(u)}&sz=64`;

  const SourceList = ({ items }: { items: Src[] }) => (
    <ul className="space-y-2 pt-2">
      {items.length === 0 && (
        <li className="px-2 py-3 text-sm text-foreground/60">{isRtl ? "لا يوجد." : "None."}</li>
      )}
      {items.map((s, i) => (
        <li key={i}>
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-2xl border border-foreground/10 bg-background/40 px-3 py-2.5 hover:bg-foreground/5 transition"
          >
            <div className="min-w-0 flex-1 truncate text-sm font-medium text-foreground/90">
              {s.title || getHost(s.url)}
            </div>
            <div className="hidden truncate text-xs text-foreground/50 sm:block max-w-[40%]">
              {s.url}
            </div>
            <img
              src={favicon(s.url)}
              alt=""
              className="h-7 w-7 shrink-0 rounded-full bg-foreground/10 object-cover"
              loading="lazy"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
            />
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6" dir={isRtl ? "rtl" : "ltr"}>
      <Accordion type="multiple" className="space-y-2">
        <AccordionItem value="used" className="border-b-0">
          <AccordionTrigger className="rounded-2xl px-3 py-3 text-base font-semibold text-foreground/90 hover:no-underline">
            {isRtl ? "المراجع المستخدَمة في التقرير" : `Sources used in this report`}
          </AccordionTrigger>
          <AccordionContent className="pb-2">
            <SourceList items={used} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="thinking" className="border-b-0">
          <AccordionTrigger className="rounded-2xl px-3 py-3 text-base font-semibold text-foreground/90 hover:no-underline">
            {isRtl ? "أفكار" : "AI thinking"}
          </AccordionTrigger>
          <AccordionContent className="pb-2">
            <div className="whitespace-pre-wrap rounded-2xl border border-foreground/10 bg-background/40 px-4 py-3 text-sm leading-relaxed text-foreground/80">
              {thinking || (isRtl ? "لا توجد ملاحظات تفكير محفوظة." : "No internal thinking captured.")}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default ResearchReportTabs;
