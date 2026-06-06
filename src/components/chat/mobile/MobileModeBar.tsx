import { GraduationCap, ShoppingCart, Globe, Layers, X } from "lucide-react";

export type LumaMode = "normal" | "learning" | "shopping" | "deep-research" | "slides";

const MODES: { id: LumaMode; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "normal", label: "Chat", Icon: () => null },
  { id: "learning", label: "Learn", Icon: GraduationCap },
  { id: "shopping", label: "Shop", Icon: ShoppingCart },
  { id: "deep-research", label: "Research", Icon: Globe },
  { id: "slides", label: "Slides", Icon: Layers },
];

interface Props {
  mode: LumaMode;
  onChange: (mode: LumaMode) => void;
}

export default function MobileModeBar({ mode, onChange }: Props) {
  return (
    <div
      data-testid="mobile-mode-bar"
      className="md:hidden flex items-center gap-2 overflow-x-auto no-scrollbar"
    >
      {MODES.filter((m) => m.id !== "normal").map(({ id, label, Icon }) => {
        const active = mode === id;
        return (
          <button
            key={id}
            type="button"
            data-testid={`mobile-mode-${id}`}
            data-active={active}
            onClick={() => onChange(active ? "normal" : id)}
            className="luma-chip shrink-0"
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
            {active && <X className="w-3 h-3 ml-1" />}
          </button>
        );
      })}
    </div>
  );
}
