import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, FileDown, FileSpreadsheet, File } from "lucide-react";
import { toast } from "sonner";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  html: string;
  fileName: string;
  isSpreadsheet?: boolean;
}

const ExportDialog = ({ open, onClose, html, fileName, isSpreadsheet }: ExportDialogProps) => {

  const downloadHtml = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("HTML downloaded");
    onClose();
  };

  const downloadPdf = () => {
    const w = window.open("", "_blank");
    if (!w) { toast.error("Allow popups to export PDF"); return; }
    w.document.write(`
      <html><head><style>@media print { @page { margin: 0.5in; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }</style></head>
      <body>${html}</body></html>
    `);
    w.document.close();
    setTimeout(() => w.print(), 600);
    onClose();
  };

  const downloadDocx = async () => {
    try {
      const { asBlob } = await import("html-docx-js-typescript");
      const docxBlob = await asBlob(html, { orientation: "portrait", margins: { top: 720, right: 720, bottom: 720, left: 720 } });
      const url = URL.createObjectURL(docxBlob as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("DOCX downloaded");
    } catch {
      toast.error("Failed to generate DOCX");
    }
    onClose();
  };

  const downloadTxt = () => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const text = tmp.innerText || tmp.textContent || "";
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("TXT downloaded");
    onClose();
  };

  const downloadCsv = () => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const tables = tmp.querySelectorAll("table");
    if (tables.length === 0) { toast.error("No table found"); return; }
    const rows = tables[0].querySelectorAll("tr");
    const csv = Array.from(rows).map(row => {
      return Array.from(row.querySelectorAll("th, td")).map(cell => `"${(cell.textContent || "").replace(/"/g, '""')}"`).join(",");
    }).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
    onClose();
  };

  const formats = [
    { id: "html", label: "HTML", desc: "Web format, preserves styling", icon: FileText, action: downloadHtml },
    { id: "pdf", label: "PDF", desc: "Print-ready document", icon: FileDown, action: downloadPdf },
    { id: "docx", label: "DOCX", desc: "Microsoft Word format", icon: File, action: downloadDocx },
    { id: "txt", label: "TXT", desc: "Plain text, no formatting", icon: FileText, action: downloadTxt },
    ...(isSpreadsheet ? [{ id: "csv", label: "CSV", desc: "Spreadsheet data format", icon: FileSpreadsheet, action: downloadCsv }] : []),
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm liquid-glass rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">Download As</h3>
              <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {formats.map(fmt => (
                <button
                  key={fmt.id}
                  onClick={fmt.action}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl liquid-glass-button text-left transition-all hover:scale-[1.01]"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <fmt.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{fmt.label}</p>
                    <p className="text-xs text-muted-foreground">{fmt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExportDialog;
