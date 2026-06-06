import { Sparkles } from "lucide-react";
import type { Skill } from "@/hooks/useSkills";

interface Props {
  skill: Skill;
  onRemove?: () => void;
  size?: "sm" | "md";
}

export default function SkillBadge({ skill, onRemove, size = "md" }: Props) {
  const sizeCls = size === "sm" ? "text-[11px] px-2 py-0.5 gap-1" : "text-xs px-2.5 py-1 gap-1.5";
  return (
    <span className={`inline-flex items-center ${sizeCls} rounded-full bg-primary/15 backdrop-blur-sm border border-primary/30 font-medium text-primary select-none`}>
      <Sparkles className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      <span className="max-w-[140px] truncate">{skill.name}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 hover:opacity-70 transition-opacity text-base leading-none"
          aria-label="Remove skill"
        >
          ×
        </button>
      )}
    </span>
  );
}
