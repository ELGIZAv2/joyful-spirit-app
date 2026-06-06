// Text-only model badges (no emoji)
import type { FalImageModel, FalVideoModel } from "@/hooks/useFalModels";

const Pill = ({ tone = "neutral", children }: { tone?: "neutral" | "accent" | "warning"; children: React.ReactNode }) => {
  const toneCls =
    tone === "accent"
      ? "bg-primary/15 text-primary border-primary/30"
      : tone === "warning"
      ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
      : "bg-muted/40 text-muted-foreground border-border/40";
  return (
    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-none ${toneCls}`}>
      {children}
    </span>
  );
};

export function ImageModelBadges({ m }: { m: FalImageModel }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {m.is_new && <Pill tone="accent">NEW</Pill>}
      {m.is_premium && <Pill tone="warning">PRO</Pill>}
      {m.endpoint_text_to_image && <Pill>T2I</Pill>}
      {m.endpoint_image_to_image && <Pill>I2I</Pill>}
      {m.supports_multi_image && <Pill>MULTI x{m.max_input_images}</Pill>}
    </div>
  );
}

export function VideoModelBadges({ m }: { m: FalVideoModel }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {m.is_new && <Pill tone="accent">NEW</Pill>}
      {m.is_premium && <Pill tone="warning">PRO</Pill>}
      {m.endpoint_text_to_video && <Pill>T2V</Pill>}
      {m.endpoint_image_to_video && <Pill>I2V</Pill>}
      {m.supports_multi_image && <Pill>MULTI x{m.max_input_images}</Pill>}
      {m.supports_start_end_frame && <Pill>START+END</Pill>}
      {m.supports_audio && <Pill>AUDIO</Pill>}
    </div>
  );
}
