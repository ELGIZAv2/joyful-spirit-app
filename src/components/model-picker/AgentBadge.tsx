import { getAgentById } from "@/lib/agentRegistry";

interface AgentBadgeProps {
  agentId: string;
  onRemove?: () => void;
  size?: "sm" | "md";
}

const AgentBadge = ({ agentId, onRemove, size = "md" }: AgentBadgeProps) => {
  const agent = getAgentById(agentId);
  if (!agent) return null;
  const Icon = agent.icon;

  const sizeClasses = size === "sm"
    ? "text-[11px] px-2 py-0.5 gap-1"
    : "text-xs px-2.5 py-1 gap-1.5";

  return (
    <span className={`inline-flex items-center ${sizeClasses} rounded-full ${agent.bg} backdrop-blur-sm border border-white/5 font-medium ${agent.color} select-none`}>
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      <span>{agent.mention}</span>
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 hover:opacity-70 transition-opacity">×</button>
      )}
    </span>
  );
};

export default AgentBadge;
