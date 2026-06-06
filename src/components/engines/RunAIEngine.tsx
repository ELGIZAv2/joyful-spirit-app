import { useState, useEffect, useRef } from "react";
import { Terminal, Trash2, AlertCircle, Info, AlertTriangle } from "lucide-react";

interface ConsoleLog {
  type: string;
  message: string;
  timestamp: number;
}

const RunAIEngine = () => {
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [filter, setFilter] = useState<"all" | "log" | "error" | "warn">("all");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.__console) {
        setConsoleLogs((prev) => [
          ...prev.slice(-80),
          {
            type: e.data.type || "log",
            message: Array.isArray(e.data.args) ? e.data.args.join(" ") : String(e.data.args || ""),
            timestamp: Date.now(),
          },
        ]);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [consoleLogs, filter]);

  const filtered = filter === "all" ? consoleLogs : consoleLogs.filter((l) => l.type === filter);

  const counts = {
    log: consoleLogs.filter((l) => l.type === "log").length,
    warn: consoleLogs.filter((l) => l.type === "warn").length,
    error: consoleLogs.filter((l) => l.type === "error").length,
  };

  return (
    <div className="h-36 border-t border-border bg-card/95 backdrop-blur-sm flex flex-col shrink-0">
      <div className="px-2 py-1 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-mono text-primary font-bold">
            RunAI Console
          </span>
        </div>
        <div className="flex items-center gap-1">
          {(["all", "log", "warn", "error"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-colors ${
                filter === f
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "All" : f}
              {f !== "all" && (
                <span className="ml-1 opacity-60">({counts[f]})</span>
              )}
            </button>
          ))}
          <button
            onClick={() => setConsoleLogs([])}
            className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors ml-1"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 font-mono text-[11px] space-y-0.5"
        dir="ltr"
      >
        {filtered.length === 0 ? (
          <div className="flex items-center gap-2 text-muted-foreground italic">
            <Info className="w-3 h-3" />
            <span>Waiting for output...</span>
          </div>
        ) : (
          filtered.map((log, i) => (
            <div
              key={i}
              className={`flex items-start gap-1.5 px-1.5 py-0.5 rounded ${
                log.type === "error"
                  ? "bg-destructive/10 text-destructive"
                  : log.type === "warn"
                  ? "bg-warning/10 text-warning"
                  : "text-foreground/80"
              }`}
            >
              {log.type === "error" ? (
                <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
              ) : log.type === "warn" ? (
                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
              ) : (
                <span className="text-primary shrink-0">›</span>
              )}
              <span className="break-all flex-1">{log.message}</span>
              <span className="text-[8px] text-muted-foreground shrink-0">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RunAIEngine;
