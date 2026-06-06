import { motion } from "framer-motion";

export interface ResearchStep {
  id: string;
  label: string;
  status: "pending" | "active" | "done";
}

interface ResearchFlowProps {
  steps: ResearchStep[];
  outline?: string[] | null;
}

const AnimatedStar = ({ size = 18, color = "hsl(var(--primary))" }: { size?: number; color?: string }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className="shrink-0"
    style={{ color }}
    animate={{ rotate: [0, 180, 360], scale: [1, 1.2, 1] }}
    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
  >
    <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" fill="currentColor" />
  </motion.svg>
);

const DoneStar = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className="shrink-0 text-primary/40">
    <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" fill="currentColor" />
  </svg>
);

const ResearchFlow = ({ steps }: ResearchFlowProps) => {
  return (
    <div className="space-y-0.5 py-2">
      {steps.map((step, i) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ 
            delay: i * 0.05, 
            type: "spring", 
            damping: 22, 
            stiffness: 350 
          }}
          className="flex items-center gap-3 py-1.5 px-1"
        >
          <div className="shrink-0">
            {step.status === "active" ? (
              <AnimatedStar size={18} color="hsl(var(--primary))" />
            ) : (
              <DoneStar size={14} />
            )}
          </div>
          <span className={`text-sm leading-snug ${
            step.status === "active" 
              ? "text-foreground font-medium" 
              : "text-muted-foreground/45"
          }`}>
            {step.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

export default ResearchFlow;
