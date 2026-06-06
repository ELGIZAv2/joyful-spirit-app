import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Check, Copy, Mail, Link2, Share2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  url: string;
  title: string;
  isRtl?: boolean;
};

const Whatsapp = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M19.05 4.91A10 10 0 0 0 4.06 18.39L3 22l3.7-1.04A10 10 0 1 0 19.05 4.9Zm-7.04 15.43a8.3 8.3 0 0 1-4.24-1.16l-.3-.18-2.2.62.62-2.14-.2-.32A8.32 8.32 0 1 1 12 20.34Zm4.55-6.22c-.25-.13-1.47-.72-1.7-.8-.23-.09-.39-.13-.56.13s-.64.8-.78.97c-.14.17-.29.18-.54.06-.25-.13-1.05-.39-2-1.23a7.5 7.5 0 0 1-1.39-1.72c-.14-.25-.02-.39.11-.51.11-.11.25-.29.38-.43.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.49-.41-.42-.56-.43h-.48c-.16 0-.43.06-.65.31s-.86.84-.86 2.05.88 2.38 1 2.55c.13.17 1.74 2.66 4.22 3.73.59.25 1.05.4 1.41.51.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.29Z" />
  </svg>
);
const XIcon = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M18.244 2H21l-6.52 7.45L22 22h-6.84l-4.78-6.26L4.8 22H2l7.04-8.05L2 2h6.92l4.32 5.71L18.24 2Zm-2.4 18h1.5L7.27 4h-1.6l10.17 16Z" />
  </svg>
);
const Facebook = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" />
  </svg>
);
const Telegram = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="m9.78 14.65 4.36 3.22c.5.27.85.13 1-.46l1.81-8.55c.2-.74-.27-1.07-.74-.86l-10.66 4.1c-.73.3-.72.7-.13.88l2.74.85 6.34-4c.3-.18.57-.08.35.12" />
  </svg>
);
const LinkedIn = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14ZM8.34 18.34V10.5H5.67v7.84h2.67ZM7 9.34a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1Zm11.34 9V13.9c0-2.47-1.32-3.62-3.07-3.62-1.42 0-2.05.78-2.4 1.32V10.5h-2.66c.04.74 0 7.84 0 7.84h2.66v-4.38c0-.24.02-.48.09-.65.19-.48.63-.97 1.36-.97.96 0 1.35.73 1.35 1.8v4.2h2.67Z" />
  </svg>
);

export default function ShareDialog({ open, onOpenChange, url, title, isRtl }: Props) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;

  const channels = [
    { name: "WhatsApp", Icon: Whatsapp, href: `https://wa.me/?text=${enc(`${title} — ${url}`)}`, color: "bg-[#25D366] text-white" },
    { name: "X", Icon: XIcon, href: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`, color: "bg-foreground text-background" },
    { name: "Facebook", Icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, color: "bg-[#1877F2] text-white" },
    { name: "Telegram", Icon: Telegram, href: `https://t.me/share/url?url=${enc(url)}&text=${enc(title)}`, color: "bg-[#229ED9] text-white" },
    { name: "LinkedIn", Icon: LinkedIn, href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`, color: "bg-[#0A66C2] text-white" },
    { name: isRtl ? "Email" : "Email", Icon: Mail, href: `mailto:?subject=${enc(title)}&body=${enc(`${title}\n\n${url}`)}`, color: "bg-muted text-foreground border border-foreground/10" },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(isRtl ? "Link copied" : "Link copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error(isRtl ? "Copy failed" : "Copy failed");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        dir={isRtl ? "rtl" : "ltr"}
        className="!left-1/2 !right-auto w-[calc(100%-1rem)] max-w-[390px] !-translate-x-1/2 p-0 bg-[hsl(var(--background))] border border-foreground/10 rounded-[32px] shadow-2xl max-h-[92vh] overflow-y-auto data-[state=open]:duration-300 sm:!top-1/2 sm:!bottom-auto sm:!-translate-y-1/2"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-6">
          <div className="h-1 w-10 rounded-full bg-foreground/20" />
        </div>

        <div className="px-8 pb-10">
          {/* Header — editorial serif */}
          <SheetHeader className="mb-10 text-center space-y-3">
            <SheetTitle
              className="text-3xl italic leading-tight text-foreground"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              {isRtl ? "Share report" : "Share report"}
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground leading-relaxed max-w-[280px] mx-auto line-clamp-3">
              {title}
            </SheetDescription>
          </SheetHeader>

          {/* Channels — monochrome editorial tiles */}
          <div className="grid grid-cols-3 gap-y-8 gap-x-4 mb-10">
            {channels.map(({ name, Icon, href }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-3"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-foreground/10 bg-foreground/[0.04] text-foreground/90 transition-colors group-hover:bg-foreground/[0.08] group-active:scale-95">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-[11px] font-medium tracking-[0.18em] uppercase text-muted-foreground">
                  {name}
                </span>
              </a>
            ))}
          </div>

          {/* Link bar */}
          <div className="space-y-3 pb-[max(0px,env(safe-area-inset-bottom))]">
            <label className="block pl-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {isRtl ? "Share link" : "Share link"}
            </label>
            <div className="flex items-center gap-2 p-2 rounded-2xl border border-foreground/10 bg-foreground/[0.04]">
              <div className="flex-1 px-3 overflow-hidden">
                <input
                  readOnly
                  value={url}
                  onFocus={(e) => e.currentTarget.select()}
                  dir="ltr"
                  className="w-full bg-transparent text-[13px] text-foreground/90 outline-none truncate"
                  style={{ fontFamily: "'JetBrains Mono','SF Mono',Menlo,Consolas,monospace" }}
                />
              </div>
              <button
                onClick={copy}
                className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold tracking-wider uppercase transition-all active:scale-95 ${
                  copied
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-foreground text-background hover:opacity-90"
                }`}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : null}
                <span>{copied ? (isRtl ? "Done" : "Copied") : (isRtl ? "Copy" : "Copy")}</span>
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
