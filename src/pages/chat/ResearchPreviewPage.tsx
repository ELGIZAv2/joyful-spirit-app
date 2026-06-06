import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, Loader2, Share2, MoreHorizontal, List, Copy, CloudUpload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { detectResearchReportDirection, normalizeResearchReport } from "@/lib/normalizeResearchReport";
import { toast } from "sonner";
import { goBackOr } from "@/lib/navigation";
import {
  ReportData,
  extractUrls,
  ScrollProgress,
} from "@/components/research/templateUtils";
import ResearchArticleTemplate from "@/components/research/ResearchArticleTemplate";
import ShareDialog from "@/components/research/ShareDialog";
import ResearchReportTabs from "@/components/research/ResearchReportTabs";
import ResearchToc, { extractToc } from "@/components/research/ResearchToc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const ResearchPreviewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id?: string; token?: string }>();
  const id = params.id;
  const shareToken = params.token;
  const isShareView = !!shareToken;
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const stateReport = (location.state as { reportData?: ReportData; autoDownload?: boolean } | null)?.reportData ?? null;
  const autoDownload = (location.state as { autoDownload?: boolean } | null)?.autoDownload === true;
  const autoDownloadRef = useRef(false);
  const handleDownloadRef = useRef<() => void>(() => {});

  const cacheKey = id ? `research-preview:${id}` : shareToken ? `research-share:${shareToken}` : "";
  const openConversationInChat = (conversationId: string) => {
    navigate("/chat", { replace: true, state: { loadConversationId: conversationId } });
  };

  useEffect(() => {
    // Public share view: load by share_token (no auth required).
    if (isShareView && shareToken) {
      (async () => {
        const { data: row } = await supabase
          .from("research_reports")
          .select("query, report, images")
          .eq("share_token", shareToken)
          .maybeSingle();
        if (row) {
          setData({
            query: row.query,
            report: row.report,
            images: (row.images as any) || [],
          });
        }
        setLoading(false);
      })();
      return;
    }

    // 1) Hydrate from navigation state (first visit from chat).
    if (stateReport?.report) {
      const fresh = {
        query: stateReport.query,
        report: stateReport.report,
        images: Array.isArray(stateReport.images) ? stateReport.images : [],
      };
      setData(fresh);
      try { sessionStorage.setItem(cacheKey, JSON.stringify(fresh)); } catch {}
      setLoading(false);
      return;
    }
    // 2) Hydrate from sessionStorage so back-nav doesn't lose images.
    if (cacheKey) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as ReportData;
          if (parsed?.report) {
            setData(parsed);
            setLoading(false);
            return;
          }
        }
      } catch {}
    }
    if (!id) { setLoading(false); return; }
    (async () => {
      const { data: user } = await supabase.auth.getUser();
      const uid = user.user?.id;
      if (!uid) { setLoading(false); return; }

      // Parse URL id: may be "<uuid>" or "conv_<uuid>_<idx>".
      const uuidRe = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
      const uuidMatch = id.match(uuidRe);
      const conversationId = uuidMatch ? uuidMatch[0] : null;
      if (conversationId && id === conversationId) {
        openConversationInChat(conversationId);
        return;
      }

      // 1) Direct session_key match (URL id used as-is).
      let { data: row } = await supabase
        .from("research_reports")
        .select("query, report, images")
        .eq("user_id", uid)
        .eq("session_key", id)
        .maybeSingle();

      // 2) Newest report saved against this conversation (any index).
      if (!row && conversationId) {
        const { data: rows } = await supabase
          .from("research_reports")
          .select("query, report, images, created_at")
          .eq("user_id", uid)
          .like("session_key", `conv_${conversationId}_%`)
          .order("created_at", { ascending: false })
          .limit(1);
        row = rows?.[0] ?? null;
      }

      if (row) {
        const fresh = {
          query: row.query,
          report: row.report,
          images: (row.images as any) || [],
        };
        setData(fresh);
        try { sessionStorage.setItem(cacheKey, JSON.stringify(fresh)); } catch {}
        setLoading(false);
        return;
      }

      // 3) Fallback: reconstruct from messages of the conversation.
      if (conversationId) {
        const { data: convo } = await supabase
          .from("conversations")
          .select("id, title, mode")
          .eq("id", conversationId)
          .eq("user_id", uid)
          .maybeSingle();
        if (convo) {
          const { data: msgs } = await supabase
            .from("messages")
            .select("role, content, created_at")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true });
          const userMsg = msgs?.find((m) => m.role === "user");
          const assistantMsg = [...(msgs || [])].reverse().find((m) => m.role === "assistant");
          if (assistantMsg?.content) {
            const fresh = {
              query: convo.title || userMsg?.content || "Research",
              report: assistantMsg.content,
              images: [] as string[],
            };
            setData(fresh);
            try { sessionStorage.setItem(cacheKey, JSON.stringify(fresh)); } catch {}
          }
        }
      }
      setLoading(false);
    })();
  }, [id, shareToken, stateReport]);

  const cleanReport = useMemo(() => (data ? normalizeResearchReport(data.report) : ""), [data]);
  const isRtl = cleanReport ? detectResearchReportDirection(cleanReport) === "rtl" : false;
  const sources = useMemo(() => extractUrls(cleanReport), [cleanReport]);
  const wordCount = cleanReport.split(/\s+/).filter(Boolean).length;
  const readMins = Math.max(1, Math.round(wordCount / 220));
  const reportEmpty = cleanReport.trim().length < 10;

  // Auto-trigger PDF download when navigated with autoDownload flag.
  useEffect(() => {
    if (!autoDownload || !data || autoDownloadRef.current) return;
    autoDownloadRef.current = true;
    const timer = setTimeout(() => { handleDownloadRef.current(); }, 700);
    return () => clearTimeout(timer);
  }, [autoDownload, data]);

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Report not found.</p>
      </div>
    );
  }

  const handleDownload = async () => {
    if (!reportRef.current || exporting) return;
    setExporting(true);
    const t = toast.loading("Generating PDF…");
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"), import("jspdf"),
      ]);
      const node = reportRef.current;
      const bg = getComputedStyle(document.body).backgroundColor || "#ffffff";

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const usableW = pageW - margin * 2;
      const usableH = pageH - margin * 2;
      const gap = 4;

      // Capture each logical section separately so text never gets cut mid-line.
      const sectionEls = Array.from(
        node.querySelectorAll<HTMLElement>("section, article > div > div > div")
      ).filter((el) => el.offsetHeight > 20);
      const targets: HTMLElement[] = sectionEls.length > 0 ? sectionEls : [node];

      let cursorY = margin;
      let firstPage = true;

      for (const el of targets) {
        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          backgroundColor: bg,
          logging: false,
          windowWidth: el.scrollWidth,
        });
        const pxPerMm = canvas.width / usableW;
        const fullHmm = canvas.height / pxPerMm;

        // Section fits on the rest of the current page → place as-is
        if (fullHmm <= pageH - margin - cursorY) {
          if (!firstPage && cursorY === margin) {
            // already on a fresh page
          }
          const imgData = canvas.toDataURL("image/png");
          pdf.addImage(imgData, "PNG", margin, cursorY, usableW, fullHmm, undefined, "FAST");
          cursorY += fullHmm + gap;
          firstPage = false;
          continue;
        }

        // Section taller than remaining space — start a new page and slice.
        if (cursorY > margin) { pdf.addPage(); cursorY = margin; }
        let rendered = 0;
        const sliceH = Math.floor(usableH * pxPerMm);
        while (rendered < canvas.height) {
          const cur = Math.min(sliceH, canvas.height - rendered);
          const sc = document.createElement("canvas");
          sc.width = canvas.width;
          sc.height = cur;
          const ctx = sc.getContext("2d");
          if (!ctx) break;
          ctx.drawImage(canvas, 0, rendered, canvas.width, cur, 0, 0, canvas.width, cur);
          const imgData = sc.toDataURL("image/png");
          const imgHmm = cur / pxPerMm;
          if (rendered > 0) { pdf.addPage(); cursorY = margin; }
          pdf.addImage(imgData, "PNG", margin, cursorY, usableW, imgHmm, undefined, "FAST");
          cursorY += imgHmm + gap;
          rendered += cur;
        }
        firstPage = false;
        // Force next section to start fresh page if very little room left
        if (pageH - margin - cursorY < 30) { pdf.addPage(); cursorY = margin; }
      }

      const safe = data.query.slice(0, 60).replace(/[\\/:*?"<>|]/g, "-").trim() || "research";
      pdf.save(`${safe}.pdf`);
      toast.success("Downloaded", { id: t });
    } catch (e) {
      console.error("[pdf]", e);
      toast.error("Failed to generate PDF", { id: t });
    } finally { setExporting(false); }
  };

  // assign the latest download fn to the ref so the auto-download effect can call it
  handleDownloadRef.current = handleDownload;

  const handleShare = () => setShareOpen(true);

  const tocItems = useMemo(() => extractToc(cleanReport), [cleanReport]);
  const [tocOpen, setTocOpen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanReport);
      toast.success(isRtl ? "تم نسخ المحتوى" : "Copied");
    } catch {
      toast.error(isRtl ? "تعذر النسخ" : "Copy failed");
    }
  };

  const handleNativeShare = async () => {
    const shareData = { title: data.query, text: data.query, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        setShareOpen(true);
      }
    } catch {
      /* user cancelled */
    }
  };

  const handleDriveUpload = async () => {
    const t = toast.loading(isRtl ? "جارٍ الرفع إلى Drive…" : "Uploading to Drive…");
    try {
      const { data: res, error } = await supabase.functions.invoke("pipedream-connect", {
        body: {
          action: "google_drive_upload",
          filename: `${(data.query || "research").slice(0, 80)}.md`,
          content: cleanReport,
        },
      });
      if (error) throw error;
      if ((res as any)?.needs_connect) {
        toast.info(isRtl ? "يلزم ربط Google Drive أولاً" : "Connect Google Drive first", { id: t });
        window.location.href = "/integrations?connect=google_drive";
        return;
      }
      toast.success(isRtl ? "تم الرفع إلى Drive" : "Uploaded to Drive", { id: t });
    } catch (e) {
      console.error(e);
      toast.error(isRtl ? "فشل الرفع" : "Upload failed", { id: t });
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground" dir={isRtl ? "rtl" : "ltr"}>
      <ScrollProgress />
      <ResearchToc markdown={cleanReport} isRtl={isRtl} />

      <header className="sticky top-0 z-30 border-b border-foreground/10 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:px-6">
          <button
            onClick={() => {
              const uuidRe = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
              const convId = id?.match(uuidRe)?.[0];
              if (convId) {
                openConversationInChat(convId);
              } else {
                goBackOr(navigate, "/chat");
              }
            }}
            className="-ms-1 flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 hover:bg-foreground/5 transition"
            aria-label="Back to conversation"
          >
            <ArrowLeft className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
          </button>
          <div className="flex-1" />
          {tocItems.length >= 2 && (
            <Sheet open={tocOpen} onOpenChange={setTocOpen}>
              <SheetTrigger asChild>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 hover:bg-foreground/5 transition"
                  aria-label={isRtl ? "المحتويات" : "Contents"}
                >
                  <List className="h-4 w-4" />
                </button>
              </SheetTrigger>
              <SheetContent side={isRtl ? "right" : "left"} className="w-80" dir={isRtl ? "rtl" : "ltr"}>
                <SheetHeader>
                  <SheetTitle>{isRtl ? "المحتويات" : "Contents"}</SheetTitle>
                </SheetHeader>
                <ul className="mt-4 space-y-1 overflow-y-auto pb-8 text-sm">
                  {tocItems.map((it) => (
                    <li key={it.id} className={it.level === 3 ? (isRtl ? "pr-3" : "pl-3") : ""}>
                      <a
                        href={`#${it.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setTocOpen(false);
                          setTimeout(() => {
                            document.getElementById(it.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }, 150);
                        }}
                        className="block truncate rounded px-2 py-1.5 text-foreground/70 hover:bg-foreground/5 hover:text-foreground transition"
                      >
                        {it.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </SheetContent>
            </Sheet>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 hover:bg-foreground/5 transition"
                aria-label={isRtl ? "خيارات" : "Options"}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRtl ? "start" : "end"} dir={isRtl ? "rtl" : "ltr"} className="w-56">
              <DropdownMenuItem onClick={handleCopy}>
                <Copy className="h-4 w-4" />
                <span>{isRtl ? "نسخ المحتوى" : "Copy"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleNativeShare}>
                <Share2 className="h-4 w-4" />
                <span>{isRtl ? "مشاركة" : "Share"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDriveUpload}>
                <CloudUpload className="h-4 w-4" />
                <span>{isRtl ? "حفظ في Google Drive" : "Save to Google Drive"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div ref={reportRef} className="animate-fade-in">
        <ResearchArticleTemplate
          data={data}
          cleanReport={cleanReport}
          isRtl={isRtl}
          sources={sources}
          wordCount={wordCount}
          readMins={readMins}
          reportEmpty={reportEmpty}
        />
      </div>

      {!reportEmpty && (
        <ResearchReportTabs
          conversationId={id?.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0] || null}
          reportSources={sources}
          isRtl={isRtl}
          reportText={cleanReport}
          reportTitle={data.query}
        />
      )}

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        url={window.location.href}
        title={data.query}
        isRtl={isRtl}
      />
    </div>
  );
};

export default ResearchPreviewPage;
