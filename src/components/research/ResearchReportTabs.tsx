import { useEffect, useState } from "react";
import { Brain, ExternalLink, FileText, BookOpen, CloudUpload, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Src = { url: string; title?: string };

interface Props {
  conversationId?: string | null;
  reportSources: string[];
  isRtl: boolean;
  reportText: string;
  reportTitle: string;
}

const ResearchReportTabs = ({ conversationId, reportSources, isRtl, reportText, reportTitle }: Props) => {
  const [open, setOpen] = useState<null | "used" | "unused" | "thinking">(null);
  const [unused, setUnused] = useState<Src[]>([]);
  const [thinking, setThinking] = useState<string>("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!conversationId) return;
    (async () => {
      const { data } = await supabase
        .from("research_jobs")
        .select("unused_sources, thinking")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setUnused(((data.unused_sources as any) || []) as Src[]);
        setThinking((data.thinking as string) || "");
      }
    })();
  }, [conversationId]);

  const used: Src[] = reportSources.map((u) => ({ url: u }));

  const exportToDrive = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("pipedream-connect", {
        body: {
          action: "google_drive_upload",
          filename: `${reportTitle.slice(0, 80) || "research"}.md`,
          content: reportText,
        },
      });
      if (error) throw error;
      if ((data as any)?.needs_connect) {
        toast.info(isRtl ? "يلزم ربط Google Drive أولاً" : "Connect Google Drive first");
        window.location.href = "/integrations?connect=google_drive";
        return;
      }
      toast.success(isRtl ? "تم الرفع إلى Drive" : "Uploaded to Drive");
    } catch (e) {
      console.error(e);
      toast.error(isRtl ? "فشل الرفع" : "Upload failed");
    } finally {
      setExporting(false);
    }
  };

  const btnCls =
    "flex items-center gap-2 rounded-full border border-foreground/10 bg-background/60 px-4 py-2 text-sm text-foreground/85 hover:bg-foreground/5 transition";

  return (
    <>
      <div className="mx-auto max-w-3xl px-4 py-8" dir={isRtl ? "rtl" : "ltr"}>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button className={btnCls} onClick={() => setOpen("used")}>
            <FileText className="h-4 w-4" />
            {isRtl ? `المصادر المستخدمة (${used.length})` : `Sources used (${used.length})`}
          </button>
          <button className={btnCls} onClick={() => setOpen("unused")}>
            <BookOpen className="h-4 w-4" />
            {isRtl ? `قُرئت ولم تُستخدم (${unused.length})` : `Read, not used (${unused.length})`}
          </button>
          <button className={btnCls} onClick={() => setOpen("thinking")}>
            <Brain className="h-4 w-4" />
            {isRtl ? "تفكير الذكاء الاصطناعي" : "AI thinking"}
          </button>
          <button className={btnCls} onClick={exportToDrive} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
            {isRtl ? "حفظ في Google Drive" : "Save to Google Drive"}
          </button>
        </div>
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-2xl" dir={isRtl ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>
              {open === "used" && (isRtl ? "المصادر المستخدمة" : "Sources used")}
              {open === "unused" && (isRtl ? "مصادر قُرئت ولم تُستخدم" : "Sources read but not cited")}
              {open === "thinking" && (isRtl ? "تفكير الذكاء الاصطناعي" : "AI thinking")}
            </DialogTitle>
          </DialogHeader>
          {open === "thinking" ? (
            <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm text-foreground/80 leading-relaxed">
              {thinking || (isRtl ? "لا توجد ملاحظات تفكير محفوظة." : "No internal thinking captured.")}
            </div>
          ) : (
            <ul className="max-h-[60vh] space-y-2 overflow-y-auto text-sm">
              {(open === "used" ? used : unused).length === 0 && (
                <li className="text-foreground/60">{isRtl ? "لا يوجد." : "None."}</li>
              )}
              {(open === "used" ? used : unused).map((s, i) => (
                <li key={i}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-2 rounded-lg border border-foreground/10 p-3 hover:bg-foreground/5 transition"
                  >
                    <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-foreground/50 group-hover:text-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-foreground/90">{s.title || s.url}</div>
                      <div className="truncate text-xs text-foreground/50">{s.url}</div>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ResearchReportTabs;
