// @ts-nocheck — imported design from external repo; backend wiring deferred.
import { BarChart3, ChevronDown, Cloud, Code2, ExternalLink, FileText, Github, History, Image, LayoutPanelLeft, MessageCircle, Mic, Monitor, MoreHorizontal, Pause, Plus, RefreshCw, Send, Sparkles, Square, X } from "lucide-react";

type DesignVariant = {
  id: string;
  title: string;
  subtitle: string;
  shell: string;
  top: string;
  preview: string;
  card: string;
  accent: string;
  button: string;
};

const variants: DesignVariant[] = [
  {
    id: "v1",
    title: "Sleek Glassmorphism",
    subtitle: "Very close to Lovable with soft glass and clear buttons",
    shell: "bg-[hsl(0_0%_4%)] border-[hsl(0_0%_100%/0.08)]",
    top: "bg-[hsl(0_0%_7%/0.92)] border-[hsl(0_0%_100%/0.08)]",
    preview: "bg-[hsl(0_0%_98%)] text-[hsl(0_0%_12%)]",
    card: "bg-[hsl(0_0%_100%/0.05)] border-[hsl(0_0%_100%/0.08)]",
    accent: "text-[hsl(262_83%_64%)]",
    button: "bg-[hsl(262_83%_58%)] hover:bg-[hsl(262_83%_64%)]",
  },
  {
    id: "v2",
    title: "Glass & Depth",
    subtitle: "Greater depth, floating panels, and a readable top bar for desktop",
    shell: "bg-[hsl(240_10%_5%)] border-[hsl(262_83%_64%/0.18)] shadow-[0_28px_80px_hsl(0_0%_0%/0.55)]",
    top: "bg-[hsl(240_8%_9%/0.86)] border-[hsl(0_0%_100%/0.1)] backdrop-blur-xl",
    preview: "bg-[hsl(210_20%_98%)] text-[hsl(230_12%_15%)]",
    card: "bg-[hsl(240_8%_12%/0.78)] border-[hsl(0_0%_100%/0.12)] shadow-[0_18px_40px_hsl(0_0%_0%/0.28)]",
    accent: "text-[hsl(270_95%_70%)]",
    button: "bg-[hsl(270_95%_60%)] hover:bg-[hsl(270_95%_68%)]",
  },
  {
    id: "v3",
    title: "Neo-Futuristic Lovable",
    subtitle: "A bolder, premium look with all the same Lovable buttons",
    shell: "bg-[radial-gradient(circle_at_top_left,hsl(262_83%_20%/0.25),hsl(0_0%_3%)_34%,hsl(0_0%_1%))] border-[hsl(262_83%_64%/0.24)] shadow-[0_0_70px_hsl(262_83%_45%/0.16)]",
    top: "bg-[hsl(0_0%_5%/0.88)] border-[hsl(262_83%_64%/0.18)] backdrop-blur-2xl",
    preview: "bg-[linear-gradient(145deg,hsl(0_0%_99%),hsl(260_40%_96%))] text-[hsl(240_8%_10%)]",
    card: "bg-[hsl(0_0%_100%/0.06)] border-[hsl(262_83%_64%/0.18)] shadow-[0_0_24px_hsl(262_83%_50%/0.12)]",
    accent: "text-[hsl(281_100%_72%)]",
    button: "bg-[linear-gradient(135deg,hsl(262_83%_58%),hsl(320_85%_62%))] hover:brightness-110",
  },
];

export default function BuildWorkspaceDesignOptionsPage() {
  return (
    <main className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] p-5" dir="rtl">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-5">
        <header className="flex items-center justify-between rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-4">
          <div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Live design choices for desktop</p>
            <h1 className="text-2xl font-bold">Chat page + internal coding preview</h1>
          </div>
          <div className="rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-sm font-semibold text-[hsl(var(--primary-foreground))]">
            Pick a design number and tell me about it
          </div>
        </header>

        <section className="flex flex-col gap-8">
          {variants.map((variant, index) => (
            <article key={variant.id} className="overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xl">
              <div className="flex items-start justify-between gap-3 border-b border-[hsl(var(--border))] p-4">
                <div>
                  <div className="mb-2 inline-flex rounded-full bg-[hsl(var(--secondary))] px-3 py-1 text-xs font-bold text-[hsl(var(--secondary-foreground))]">
                    Design {index + 1}
                  </div>
                  <h2 className="text-lg font-bold">{variant.title}</h2>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{variant.subtitle}</p>
                </div>
                <button className="rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-xs font-bold text-[hsl(var(--primary-foreground))]">
                  Pick this one
                </button>
              </div>
              <WorkspaceMockup variant={variant} />
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

function WorkspaceMockup({ variant }: { variant: DesignVariant }) {
  return (
    <div className={`h-[780px] overflow-hidden border-t ${variant.shell}`} dir="ltr">
      <div className={`flex h-11 items-center justify-between border-b px-3 ${variant.top}`}>
        <div className="flex items-center gap-2 text-white">
          <span className="h-5 w-5 rounded-md bg-[linear-gradient(135deg,hsl(25_95%_58%),hsl(262_83%_58%))]" />
          <span className="text-xs font-bold">Joy Hub</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </div>
        <div className="flex items-center gap-2 text-[hsl(0_0%_72%)]">
          <History className="h-3.5 w-3.5" />
          <LayoutPanelLeft className="h-3.5 w-3.5" />
          <div className="mx-1 flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-0.5">
            <button className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold text-white ${variant.button}`}><Monitor className="h-3 w-3" />Preview</button>
            <FileText className="h-3.5 w-3.5 mx-1" />
            <Code2 className="h-3.5 w-3.5 mx-1" />
            <Cloud className="h-3.5 w-3.5 mx-1" />
            <BarChart3 className="h-3.5 w-3.5 mx-1" />
            <MoreHorizontal className="h-3.5 w-3.5 mx-1" />
          </div>
        </div>
        <div className="flex min-w-[180px] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-[hsl(0_0%_75%)]">
          <Monitor className="h-3 w-3" />
          <span className="flex-1">/chat</span>
          <ExternalLink className="h-3 w-3" />
          <RefreshCw className="h-3 w-3" />
        </div>
        <div className="flex items-center gap-2 text-white">
          <MessageCircle className="h-4 w-4 opacity-70" />
          <button className="rounded-full bg-white/8 px-3 py-1 text-[10px] font-bold">Share</button>
          <Github className="h-4 w-4 opacity-80" />
          <button className={`rounded-full px-3 py-1 text-[10px] font-bold text-white ${variant.button}`}>Publish</button>
        </div>
      </div>

      <div className="flex min-h-[739px] text-white">
        <aside className="hidden md:flex w-[26%] min-w-[360px] flex-col border-r border-white/10 bg-black/30">
          <div className="flex-1 space-y-5 overflow-hidden p-4" dir="rtl">
            <p className="text-center text-[10px] text-white/35">May 22 at 8:06 PM</p>
            <div className={`mr-auto max-w-[82%] rounded-2xl rounded-tr-md border px-4 py-2 text-sm ${variant.card}`}>You haven't placed any designs yet</div>
            <div className="space-y-3 text-sm leading-7 text-white/80">
              <p className="text-xs font-bold text-white/65">Thought for 9s</p>
              <p>Good point — I'll show 3 options inside the preview itself with the same Lovable buttons.</p>
              <div className={`overflow-hidden rounded-2xl border ${variant.card}`}>
                <div className="p-3">
                  <p className="text-xs font-bold">Generated image</p>
                  <p className="text-[10px] text-white/45">Tuning visuals for clearer results</p>
                </div>
                <div className="mx-3 mb-3 flex aspect-video items-center justify-center rounded-xl bg-[radial-gradient(circle,hsl(190_95%_55%/0.35),hsl(260_80%_12%))]">
                  <span className="text-2xl font-black tracking-[0.2em] text-cyan-200">SYSTEM</span>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2 border-t border-white/10 p-3" dir="rtl">
            <div className={`rounded-2xl border p-3 ${variant.card}`}>
              <div className="flex items-center justify-between text-xs font-bold"><span>Queue <b className="rounded bg-white/10 px-1">1</b></span><span className="flex gap-2 opacity-60"><Pause className="h-3.5 w-3.5" /><X className="h-3.5 w-3.5" /></span></div>
              <p className="mt-2 truncate text-[11px] text-white/70">In chat, even if I type in English it still replies in Arabic...</p>
            </div>
            <div className={`rounded-2xl border p-3 ${variant.card}`}>
              <p className="mb-7 text-sm text-white/35">Queue follow-up...</p>
              <div className="flex items-center justify-between text-white/60"><Plus className="h-4 w-4" /><span className="text-[11px]">Build⌄</span><Mic className="h-4 w-4" /><button className="rounded-full bg-white/12 p-2"><Square className="h-3 w-3 fill-current" /></button></div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white/60"><button className="rounded-full border border-white/10 p-1"><Plus className="h-3 w-3" /></button><button className="rounded-full border border-white/10 px-2 py-1">Visual edits</button></div>
          </div>
        </aside>

        <section className={`relative flex-1 overflow-hidden ${variant.preview}`}>
          <button className="absolute left-1/2 top-5 z-10 -translate-x-1/2 rounded-full bg-black px-4 py-2 text-[10px] font-black text-white shadow-xl"><Sparkles className="mr-1 inline h-3 w-3" />Unlock Pro</button>
          <div className="absolute left-0 top-0 z-10 flex h-full w-12 flex-col items-center gap-5 border-r border-black/10 bg-white/65 py-6 text-black/50">
            <LayoutPanelLeft className="h-4 w-4" />
            <MessageCircle className={`h-9 w-9 rounded-2xl p-2 ${variant.accent} bg-black/5`} />
            <Image className="h-4 w-4" />
            <Code2 className="h-4 w-4" />
            <Plus className="mt-auto h-5 w-5" />
            <div className="h-8 w-8 rounded-full bg-[linear-gradient(135deg,hsl(25_95%_65%),hsl(260_85%_72%))]" />
          </div>
          <div className="flex h-full flex-col items-center justify-center px-16 text-center">
            <h3 className="mb-10 text-4xl font-black tracking-tight"><Sparkles className="mb-1 mr-2 inline h-7 w-7 text-[hsl(25_95%_58%)]" />Welcome back, support</h3>
            <div className="w-full max-w-xl rounded-3xl border border-black/10 bg-white p-5 text-left shadow-[0_24px_60px_hsl(0_0%_0%/0.12)]">
              <p className="mb-8 text-sm text-black/35">Ask Megsy?</p>
              <div className="flex items-center justify-between"><button className="rounded-full bg-black/5 p-3"><Plus className="h-4 w-4" /></button><button className={`rounded-2xl px-5 py-3 text-xs font-black text-white ${variant.button}`}><Send className="mr-1 inline h-3 w-3" />Send</button></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
