import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import AppSidebar from "@/components/layout/AppSidebar";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";

export default function CommunityPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed] = useSidebarCollapsed();
  const navigate = useNavigate();

  return (
    <div className="h-[100dvh] flex bg-background text-foreground overflow-hidden">
      {/* Desktop persistent sidebar */}
      <aside
        style={{ width: sidebarCollapsed ? 60 : 280 }}
        className="hidden md:flex shrink-0 overflow-hidden border-r border-border/70 bg-[#f7f7f5] dark:bg-[#0a0a0a] transition-[width] duration-200 ease-out"
      >
        <AppSidebar
          inline
          open
          onClose={() => {}}
          onNewChat={() => navigate("/chat")}
          currentMode="chat"
        />
      </aside>

      {/* Mobile drawer */}
      <div className="md:hidden">
        <AppSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNewChat={() => navigate("/chat")}
          currentMode="chat"
        />
      </div>

      <div className="flex-1 min-w-0 overflow-y-auto">
      <header className="md:hidden px-5 pt-4 pb-3 flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="ios-fab w-11 h-11 rounded-full flex items-center justify-center text-foreground"
          aria-label="Open menu"
        >
          <ChevronRight className="w-[22px] h-[22px] mobile-header-icon-black" strokeWidth={2.25} />
        </button>
        <h1 className="text-xl font-bold">Community</h1>
      </header>

      <div className="px-6 py-16 text-center">
        <h2 className="text-2xl font-bold mb-2">Templates coming soon</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Browse community templates and remix them as your starting point.
        </p>
        <button
          onClick={() => navigate("/chat")}
          className="px-6 py-3 rounded-full bg-foreground text-background font-semibold text-sm"
        >
          Start a new chat
        </button>
      </div>
      </div>
    </div>
  );
}
