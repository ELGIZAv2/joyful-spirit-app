import { useMemo, useState } from "react";
import { Search, X, ChevronDown, Plus } from "lucide-react";
import {
  SiGmail,
  SiGoogledrive,
  SiGooglecalendar,
  SiSlack,
  SiNotion,
  SiGithub,
  SiFigma,
  SiCanva,
  SiAtlassian,
  SiZoom,
  
} from "react-icons/si";
import { createPortal } from "react-dom";

type IconCmp = React.ComponentType<{ size?: number; color?: string }>;

type Item = {
  id: string;
  name: string;
  rank?: string;
  desc: string;
  Icon: IconCmp;
  color: string;
  badge?: { label: string; tone: "new" | "interactive" };
  trending?: boolean;
};

const M365: IconCmp = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <rect x="2" y="2" width="9" height="9" fill="#F25022" />
    <rect x="13" y="2" width="9" height="9" fill="#7FBA00" />
    <rect x="2" y="13" width="9" height="9" fill="#00A4EF" />
    <rect x="13" y="13" width="9" height="9" fill="#FFB900" />
  </svg>
);

const IBKR: IconCmp = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#D81920">
    <path d="M3 3h4v18H3zM10 3h4v18h-4zM17 3h4v18h-4z" />
  </svg>
);

const ITEMS: Item[] = [
  { id: "canva", name: "Canva", rank: "#4 popular", desc: "Search, create, autofill, and export Canva designs", Icon: SiCanva, color: "#00C4CC" },
  { id: "m365", name: "Microsoft 365", rank: "#8 popular", desc: "Access SharePoint, OneDrive, Outlook, and Teams", Icon: M365, color: "" },
  { id: "figma", name: "Figma", rank: "#5 popular", desc: "Generate diagrams and better code from Figma context", Icon: SiFigma, color: "#F24E1E" },
  { id: "gmail", name: "Gmail", rank: "#2 popular", desc: "Draft replies, summarize threads, & search your inbox", Icon: SiGmail, color: "#EA4335" },
  { id: "notion", name: "Notion", rank: "#6 popular", desc: "Search, update, and power workflows across tools", Icon: SiNotion, color: "#ffffff" },
  { id: "drive", name: "Google Drive", rank: "Most popular", desc: "Search, read, and upload files instantly", Icon: SiGoogledrive, color: "#FBBC04" },
  { id: "gcal", name: "Google Calendar", rank: "#3 popular", desc: "Manage your schedule and coordinate meetings effortlessly", Icon: SiGooglecalendar, color: "#4285F4" },
  { id: "slack", name: "Slack", rank: "#9 popular", desc: "Send messages, create canvases, and fetch Slack data", Icon: SiSlack, color: "#E01E5A" },
  { id: "atlassian", name: "Atlassian Rovo", rank: "#7 popular", desc: "Access Jira & Confluence from your chat", Icon: SiAtlassian, color: "#2684FF" },
  { id: "ibkr", name: "Interactive Brokers", desc: "Trade, invest, analyze, and manage global markets", Icon: IBKR, color: "", badge: { label: "New", tone: "new" }, trending: true },
  { id: "adobe", name: "Adobe for creativity", desc: "Generate and edit assets with Adobe Creative Cloud", Icon: ({ size = 18 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="#FA0F00"><path d="M3 3h7l-3 7L3 3zm11 0h7L14 21V3zM9 14l3-7 7 14H9z"/></svg>), color: "", badge: { label: "Interactive", tone: "interactive" } },
  { id: "zoom", name: "Zoom", desc: "Schedule meetings and fetch recordings & transcripts", Icon: SiZoom, color: "#2D8CFF" },
  { id: "github", name: "GitHub", desc: "Browse repos, issues, and pull requests", Icon: SiGithub, color: "#ffffff" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateIntegrations: () => void;
}

export default function DirectoryDialog({ open, onOpenChange, onNavigateIntegrations }: Props) {
  
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ITEMS;
    return ITEMS.filter((i) => i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q));
  }, [search]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 animate-in fade-in-0 duration-150">
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
        onClick={() => onOpenChange(false)}
      />
      <div
        className="relative w-full max-w-[980px] max-h-[88vh] rounded-2xl border overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        style={{ backgroundColor: "#1a1a1a", borderColor: "rgba(255,255,255,0.08)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <h2 className="text-[22px] font-bold text-white tracking-tight">Directory</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-white/70" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">


          {/* Main */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Search + filters */}
            <div className="px-6 pt-5 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search connectors..."
                  className="w-full pl-10 pr-3 h-10 rounded-lg border bg-transparent text-[14px] text-white outline-none focus:ring-1 focus:ring-white/20 placeholder:text-white/40"
                  style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.03)" }}
                />
              </div>

              <div className="flex items-center justify-end mt-4">
                <div className="flex items-center gap-2">
                  {["Filter by", "Sort by"].map((l) => (
                    <button
                      key={l}
                      className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md border text-[12.5px] text-white/75 hover:text-white hover:bg-white/5 transition-colors"
                      style={{ borderColor: "rgba(255,255,255,0.1)" }}
                    >
                      {l}
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
              {(

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filtered.map((it) => (
                    <button
                      key={it.id}
                      onClick={() => {
                        onOpenChange(false);
                        onNavigateIntegrations();
                      }}
                      className="text-left rounded-xl border p-4 hover:bg-white/[0.04] transition-colors group"
                      style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)" }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <span
                            className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 border"
                            style={{ backgroundColor: "#0e0e0e", borderColor: "rgba(255,255,255,0.08)" }}
                          >
                            <it.Icon size={18} color={it.color || undefined} />
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[14px] font-semibold text-white truncate">{it.name}</span>
                              {it.badge && (
                                <span
                                  className="px-1.5 h-[18px] inline-flex items-center rounded text-[10px] font-semibold"
                                  style={{
                                    backgroundColor:
                                      it.badge.tone === "new" ? "rgba(96,165,250,0.15)" : "rgba(168,85,247,0.15)",
                                    color: it.badge.tone === "new" ? "#93c5fd" : "#d8b4fe",
                                  }}
                                >
                                  {it.badge.label}
                                </span>
                              )}
                              {it.trending && (
                                <span className="text-[10.5px] font-medium text-white/55">↗ Trending</span>
                              )}
                            </div>
                            {it.rank && <div className="text-[11.5px] text-white/45 mt-0.5">{it.rank}</div>}
                          </div>
                        </div>
                        <span
                          className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 border opacity-70 group-hover:opacity-100 transition-opacity"
                          style={{ borderColor: "rgba(255,255,255,0.1)" }}
                        >
                          <Plus className="w-4 h-4 text-white/80" />
                        </span>
                      </div>
                      <p className="text-[12.5px] text-white/55 mt-3 leading-relaxed">{it.desc}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
