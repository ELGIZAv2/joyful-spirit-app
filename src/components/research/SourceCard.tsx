import { ExternalLink } from "lucide-react";
import { hostname } from "./templateUtils";

interface Props {
  url: string;
  index: number;
}

const SourceCard = ({ url, index }: Props) => {
  const host = hostname(url);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 rounded-2xl border border-foreground/10 bg-background/40 p-4 backdrop-blur-sm transition hover:border-primary/30 hover:bg-foreground/[0.04]"
    >
      <img
        src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`}
        alt=""
        className="h-8 w-8 shrink-0 rounded-md bg-foreground/5"
        loading="lazy"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[11px] tabular-nums text-muted-foreground">
          <span className="font-mono">{String(index + 1).padStart(2, "0")}</span>
          <span>·</span>
          <span className="truncate">{host}</span>
        </div>
        <div className="mt-1 truncate text-sm font-medium text-foreground/90 group-hover:text-foreground">
          {host}
        </div>
        <div className="mt-1 truncate text-[11px] text-muted-foreground/70">{url}</div>
      </div>
      <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition group-hover:text-primary" />
    </a>
  );
};

export default SourceCard;
