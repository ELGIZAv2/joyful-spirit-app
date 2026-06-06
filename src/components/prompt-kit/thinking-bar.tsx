import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ThinkingBarProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
}

export const ThinkingBar = React.forwardRef<HTMLDivElement, ThinkingBarProps>(
  ({ className, text = "Thinking...", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-2.5",
          className
        )}
        {...props}
      >
        <motion.svg
          width="16"
          height="16"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 text-primary"
          animate={{ rotate: [0, 180, 360], scale: [1, 1.15, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" fill="currentColor" />
        </motion.svg>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={text}
            initial={{ opacity: 0, y: 4, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="text-[13px] font-medium text-foreground/90 truncate"
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </div>
    );
  }
);
ThinkingBar.displayName = "ThinkingBar";
