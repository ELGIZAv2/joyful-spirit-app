// Start frame + end frame inputs for video models that support keyframing.
import { Plus, X } from "lucide-react";
import { useRef } from "react";

interface Props {
  startFrame: string | null;
  endFrame: string | null;
  onChange: (next: { startFrame: string | null; endFrame: string | null }) => void;
}

function SlotBtn({
  label,
  url,
  onPick,
  onClear,
}: {
  label: "START" | "END";
  url: string | null;
  onPick: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
        {label} frame
      </div>
      {url ? (
        <div className="relative">
          <img src={url} alt="" className="w-full h-24 object-cover rounded-xl" />
          <button
            onClick={onClear}
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
          >
            <X className="w-3 h-3" />
          </button>
          <span className="absolute left-1.5 bottom-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-semibold text-white">
            {label}
          </span>
        </div>
      ) : (
        <button
          onClick={onPick}
          className="w-full h-24 rounded-xl border border-dashed border-border/60 flex flex-col items-center justify-center text-muted-foreground hover:bg-accent/40"
        >
          <Plus className="w-4 h-4 mb-1" />
          <span className="text-[10px] font-medium">{label}</span>
        </button>
      )}
    </div>
  );
}

export function StartEndFrameAttach({ startFrame, endFrame, onChange }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const targetRef = useRef<"start" | "end" | null>(null);

  const pick = (slot: "start" | "end") => {
    targetRef.current = slot;
    ref.current?.click();
  };

  const onFile = (file: File | null) => {
    if (!file || !targetRef.current) return;
    const r = new FileReader();
    r.onload = () => {
      const url = r.result as string;
      if (targetRef.current === "start") onChange({ startFrame: url, endFrame });
      else onChange({ startFrame, endFrame: url });
    };
    r.readAsDataURL(file);
  };

  return (
    <div className="px-4 pt-3">
      <div className="flex gap-2">
        <SlotBtn
          label="START"
          url={startFrame}
          onPick={() => pick("start")}
          onClear={() => onChange({ startFrame: null, endFrame })}
        />
        <SlotBtn
          label="END"
          url={endFrame}
          onPick={() => pick("end")}
          onClear={() => onChange({ startFrame, endFrame: null })}
        />
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
    </div>
  );
}
