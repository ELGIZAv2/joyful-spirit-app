import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Layers, Box } from "lucide-react";

interface OpenBuilderEngineProps {
  code: string;
}

interface TreeNode {
  tag: string;
  className?: string;
  depth: number;
}

const tagIcons: Record<string, string> = {
  div: "📦", span: "📝", h1: "🔤", h2: "🔤", h3: "🔤",
  p: "📄", button: "🔘", input: "✏️", img: "🖼️",
  ul: "📋", li: "•", a: "🔗", form: "📝", section: "📑",
  header: "🏷️", footer: "🦶", nav: "🧭", main: "📌",
};

const OpenBuilderEngine = ({ code }: OpenBuilderEngineProps) => {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  const tree = useMemo(() => {
    const nodes: TreeNode[] = [];
    const re = /<(\w+)(?:\s+className="([^"]*)")?[^>]*?(\/?)>/g;
    let m;
    let depth = 0;
    while ((m = re.exec(code)) !== null && nodes.length < 50) {
      const tag = m[1];
      if (["React", "useState", "useEffect", "useCallback", "useMemo", "useRef"].includes(tag)) continue;
      const selfClose = m[3] === "/";
      nodes.push({ tag, className: m[2]?.split(" ")[0], depth: Math.min(depth, 8) });
      if (!selfClose && !["img", "input", "br", "hr"].includes(tag)) depth++;
    }
    return nodes;
  }, [code]);

  const stats = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    tree.forEach((n) => { tagCounts[n.tag] = (tagCounts[n.tag] || 0) + 1; });
    const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
    const maxDepth = Math.max(...tree.map((n) => n.depth), 0);
    return { tagCounts: sorted, total: tree.length, maxDepth };
  }, [tree]);

  const toggleCollapse = (i: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-card">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-bold text-foreground">Component Tree</span>
        </div>
        <span className="text-[9px] text-muted-foreground font-mono">
          {stats.total} elements
        </span>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2" dir="ltr">
        {tree.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs italic">
            No components to display
          </div>
        ) : (
          tree.map((node, i) => (
            <div
              key={i}
              className="flex items-center gap-1 py-[3px] hover:bg-accent/50 rounded px-1.5 cursor-pointer transition-colors"
              style={{ paddingLeft: `${node.depth * 14 + 4}px` }}
              onClick={() => toggleCollapse(i)}
            >
              {!collapsed.has(i) ? (
                <ChevronDown className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
              )}
              <span className="text-[10px]">{tagIcons[node.tag] || "📦"}</span>
              <span className="text-[10px] font-mono text-primary">
                {"<"}{node.tag}{">"}
              </span>
              {node.className && (
                <span className="text-[9px] text-muted-foreground/70 truncate max-w-[120px]">
                  .{node.className}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Stats Footer */}
      <div className="border-t border-border p-2.5 space-y-2 bg-card/80 shrink-0">
        <p className="text-[9px] font-bold text-foreground flex items-center gap-1.5">
          <Box className="w-3 h-3 text-primary" /> Stats
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="bg-primary/5 rounded-lg px-2 py-1.5 text-center">
            <p className="text-xs font-bold text-primary">{stats.total}</p>
            <p className="text-[8px] text-muted-foreground">Elements</p>
          </div>
          <div className="bg-primary/5 rounded-lg px-2 py-1.5 text-center">
            <p className="text-xs font-bold text-primary">{stats.maxDepth}</p>
            <p className="text-[8px] text-muted-foreground">Max Depth</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {stats.tagCounts.slice(0, 6).map(([tag, count]) => (
            <span key={tag} className="px-1.5 py-0.5 rounded-full bg-secondary text-[8px] font-mono text-foreground">
              {tag} ×{count}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OpenBuilderEngine;
