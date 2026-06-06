import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Pin, Plus, PanelLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";
import MegsyStar from "@/components/files/MegsyStar";
import { ChatIcon, MediaIcon, CodeIcon, CornIcon, EarnIcon } from "@/components/sidebar/SidebarIcons";
import { useActiveWorkspaceId, WORKSPACE_CHANGED_EVENT } from "@/lib/activeWorkspace";
import WorkspaceSwitcher from "@/components/workspace/WorkspaceSwitcher";
import { useActiveAccount } from "@/hooks/useActiveAccount";
import SidebarSubNav from "@/components/layout/SidebarSubNav";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  mode: string;
  is_pinned?: boolean;
}

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectConversation?: (id: string) => void;
  activeConversationId?: string | null;
  currentMode?: string;
  inline?: boolean;
}

const wsTag = (ws: string | null) => ws ?? "personal";
const cacheKey = (mode: string, uid: string, ws: string | null) => `sidebar:convos:${mode}:${uid}:${wsTag(ws)}`;
const userCacheKey = (uid: string) => `sidebar:user:${uid}`;
const lastUserKey = "sidebar:last-user";

function groupByDate(items: Conversation[]) {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const buckets: Record<string, Conversation[]> = {
    Pinned: [], Today: [], Yesterday: [], "Last 7 Days": [], "Last 30 Days": [], Older: [],
  };
  for (const c of items) {
    if (c.is_pinned) { buckets.Pinned.push(c); continue; }
    const diff = now - new Date(c.updated_at).getTime();
    if (diff < day) buckets.Today.push(c);
    else if (diff < 2 * day) buckets.Yesterday.push(c);
    else if (diff < 7 * day) buckets["Last 7 Days"].push(c);
    else if (diff < 30 * day) buckets["Last 30 Days"].push(c);
    else buckets.Older.push(c);
  }
  return buckets;
}

const AppSidebar = ({
  open, onClose, onNewChat, onSelectConversation,
  activeConversationId, currentMode = "chat", inline = false,
}: AppSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeWs = useActiveWorkspaceId();

  // Hydrate user from cache instantly so the bottom pill never flashes.
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const isBuildMode = currentMode === "build";
  const showRecent = ["chat", "learning", "shopping", "research", "slides"].includes(currentMode);
  const showsUnifiedChatHistory = currentMode === "chat" || currentMode === "research" || currentMode === "slides";

  // Hydrate from local cache (user info + conversations) before network.
  // SECURITY: never read credits / subscription / billing info from localStorage —
  // those are sensitive values that must always come from the server.
  useEffect(() => {
    let cancelled = false;

    const hydrateSafeCache = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const sessionUid = session?.user?.id;
        const lastUid = localStorage.getItem(lastUserKey);

        if (!sessionUid) {
          setConversations([]);
          setUserName("");
          setAvatarUrl(null);
          return;
        }

        if (lastUid && lastUid !== sessionUid) {
          localStorage.removeItem(userCacheKey(lastUid));
        }

        const raw = localStorage.getItem(userCacheKey(sessionUid));
        if (!cancelled && raw) {
          const u = JSON.parse(raw);
          if (u.userName) setUserName(u.userName);
          if (u.avatarUrl !== undefined) setAvatarUrl(u.avatarUrl);
        }

        const conv = localStorage.getItem(cacheKey(currentMode, sessionUid, activeWs));
        if (!cancelled && conv) {
          const arr = JSON.parse(conv);
          if (Array.isArray(arr)) setConversations(arr);
        }
      } catch {
        if (!cancelled) setConversations([]);
      }
    };

    void hydrateSafeCache();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    if (!showRecent || !currentUserId) return;
    try {
      const raw = localStorage.getItem(cacheKey(currentMode, currentUserId, activeWs));
      if (raw) {
        const cached = JSON.parse(raw) as Conversation[];
        if (Array.isArray(cached)) setConversations(cached);
        else setConversations([]);
      } else {
        setConversations([]);
      }
    } catch { setConversations([]); }
  }, [currentUserId, currentMode, showRecent, activeWs]);

  useEffect(() => { loadUserInfo(); }, []);

  useEffect(() => {
    if (showRecent) loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMode, currentUserId, activeWs]);

  useEffect(() => {
    const onFocus = () => { if (showRecent) loadConversations(); };
    const onConversationsChanged = () => { if (showRecent) loadConversations(); };
    const onWorkspaceChanged = () => {
      // Clear the visible list immediately so old workspace data does not flash.
      setConversations([]);
      if (showRecent) loadConversations();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("megsy:conversations-changed", onConversationsChanged);
    window.addEventListener(WORKSPACE_CHANGED_EVENT, onWorkspaceChanged);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("megsy:conversations-changed", onConversationsChanged);
      window.removeEventListener(WORKSPACE_CHANGED_EVENT, onWorkspaceChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMode, showRecent, currentUserId]);

  const loadUserInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setCurrentUserId(null);
      setUserName("");
      setAvatarUrl(null);
      setCredits(0);
      setConversations([]);
      try { localStorage.removeItem(lastUserKey); } catch {}
      return;
    }
    setCurrentUserId(user.id);
    const emailPrefix = user.email?.split("@")[0] || "User";
    const fallbackName = user.user_metadata?.full_name || emailPrefix;
    setUserName(fallbackName);
    const { data: profile } = await supabase.from("profiles").select("credits, avatar_url, display_name").eq("id", user.id).single();
    let next = { userName: fallbackName, avatarUrl: user.user_metadata?.avatar_url || null };
    let nextCredits = 0;
    if (profile) {
      nextCredits = Number(profile.credits) || 0;
      next.avatarUrl = profile.avatar_url || next.avatarUrl;
      if (profile.display_name) next.userName = profile.display_name;
      setCredits(nextCredits);
      setAvatarUrl(next.avatarUrl);
      setUserName(next.userName);
    }
    try {
      localStorage.setItem(lastUserKey, user.id);
      // SECURITY: do NOT persist credits in localStorage.
      localStorage.setItem(userCacheKey(user.id), JSON.stringify(next));
    } catch {}
  };


  const loadConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const validModes = ["code", "images", "videos", "learning", "shopping", "research", "slides"];
    const modeFilter = validModes.includes(currentMode) ? currentMode : "chat";
    const modesToFetch = showsUnifiedChatHistory ? ["chat", "research", "slides"] : [modeFilter];

    const { data: memberRows } = await supabase
      .from("conversation_members").select("conversation_id").eq("user_id", user.id);
    const memberConvIds = (memberRows || []).map((r: any) => r.conversation_id);

    let query = supabase
      .from("conversations")
      .select("id, title, updated_at, mode, is_pinned")
      .in("mode", modesToFetch);
    if (memberConvIds.length > 0) {
      query = query.or(`user_id.eq.${user.id},id.in.(${memberConvIds.join(",")})`);
    } else {
      query = query.eq("user_id", user.id);
    }
    // Filter by active workspace: a workspace shows only its conversations,
    // "personal" mode (no workspace) shows only conversations not tied to any workspace.
    if (activeWs) {
      query = query.eq("workspace_id", activeWs);
    } else {
      query = query.is("workspace_id", null);
    }
    const { data } = await query
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(50);
    if (data) {
      setConversations(data);
      try { localStorage.setItem(cacheKey(modeFilter, user.id, activeWs), JSON.stringify(data)); } catch {}
    } else {
      setConversations([]);
    }
  };

  const account = useActiveAccount();
  const displayName = account.name || userName || "User";
  const displayAvatar = account.avatarUrl ?? avatarUrl;
  const displayCredits = account.credits || credits;
  const initial = displayName.charAt(0).toUpperCase() || "U";
  const [collapsed, setCollapsed, toggleCollapsed] = useSidebarCollapsed();
  const isCollapsed = inline && collapsed;
  const groups = useMemo(() => groupByDate(conversations), [conversations]);

  // Desktop inline: collapse the sidebar immediately after any selection.
  const closeInline = useCallback(() => {
    if (inline) setCollapsed(true);
  }, [inline, setCollapsed]);

  const navItems: Array<{ label: string; Icon: typeof ChatIcon; path: string; match: (p: string) => boolean; isNew?: boolean }> = [
    { label: "Chat", Icon: ChatIcon, path: "/chat", match: (p: string) => p.startsWith("/chat") },
    { label: "Media", Icon: MediaIcon, path: "/media", match: (p: string) => p.startsWith("/media") || p.startsWith("/images") || p.startsWith("/videos") || p.startsWith("/lipsync") },
    { label: "Code", Icon: CodeIcon, path: "/code", match: (p: string) => p.startsWith("/code") || p.startsWith("/build") },
    { label: "Earn", Icon: EarnIcon, path: "/settings/referrals", match: (p: string) => p.startsWith("/settings/referrals"), isNew: true },
  ];

  const handleNewChat = () => {
    if (isBuildMode) navigate("/build"); else onNewChat();
    onClose();
    closeInline();
  };

  // Solid sidebar surface — clean black/white based on theme
  const glassStyle: React.CSSProperties = {
    background: "hsl(var(--sidebar-background))",
    boxShadow: "inset 0 1px 0 hsl(var(--sidebar-border) / 0.5)",
  };

  // Full panel background (sidebar shell)
  const panelGlassStyle: React.CSSProperties = {
    background: "hsl(var(--sidebar-background))",
    boxShadow: "inset 1px 0 0 hsl(var(--sidebar-border) / 0.4)",
  };

  // Active item: subtle solid pill
  const activeItemStyle: React.CSSProperties = {
    background: "hsl(var(--sidebar-accent))",
    boxShadow: "inset 0 1px 0 hsl(var(--sidebar-border) / 0.3)",
  };

  // Prefetch a route's lazy chunk when user hovers/focuses its nav item.
  const prefetchRoute = (path: string) => {
    if (path.startsWith("/chat")) import("@/pages/chat/ChatPage");
    else if (path.startsWith("/media") || path.startsWith("/images") || path.startsWith("/videos")) {
      import("@/pages/media/MediaHubPage");
    }
  };

  const innerContent = (
    <div className="flex flex-col h-full w-full text-foreground relative overflow-hidden" style={panelGlassStyle}>

      {/* HEADER — brand + collapse */}
      <div
        className={`relative shrink-0 h-14 px-3 flex items-center ${isCollapsed ? "justify-center" : "justify-between"} border-b border-foreground/[0.08]`}
      >
        {!isCollapsed && (
          <span className="font-display text-[17px] font-bold tracking-tight truncate pl-1">Megsy</span>
        )}
        {inline && (
          <button
            onClick={toggleCollapsed}
            className="w-9 h-9 grid place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-colors"
            aria-label="Toggle sidebar"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            <PanelLeft className="w-[18px] h-[18px]" strokeWidth={1.6} />
          </button>
        )}
      </div>

      {/* NAV — fixed top section */}
      <div className={`shrink-0 ${isCollapsed ? "px-2 py-2 flex flex-col items-center gap-1" : "px-3 py-3 space-y-1"}`}>
        {navItems.map(({ label, Icon, path, match, isNew }) => {
          const active = match(location.pathname);
          if (isCollapsed) {
            return (
              <button
                key={label}
                onClick={() => { navigate(path); onClose(); closeInline(); }}
                onMouseEnter={() => prefetchRoute(path)}
                onFocus={() => prefetchRoute(path)}
                title={label}
                aria-label={label}
                style={active ? activeItemStyle : undefined}
                className={`relative w-10 h-10 grid place-items-center rounded-xl transition-all ${
                  active ? "text-foreground" : "text-foreground/75 hover:text-foreground hover:bg-foreground/[0.06]"
                }`}
              >
                <Icon size={19} />
              </button>
            );
          }
          return (
            <button
              key={label}
              onClick={() => { navigate(path); onClose(); closeInline(); }}
              onMouseEnter={() => prefetchRoute(path)}
              onFocus={() => prefetchRoute(path)}
              style={active ? activeItemStyle : undefined}
              className={`w-full h-10 px-3 flex items-center gap-3 rounded-xl transition-all ${
                active ? "text-foreground" : "text-foreground/80 hover:text-foreground hover:bg-foreground/[0.06]"
              }`}
            >
              <Icon size={18} />
              <span className="text-[14px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>

      {/* NEW CHAT — prominent action */}
      {!isCollapsed && (
        <div className="relative shrink-0 px-3 pb-2">
          <button
            onClick={handleNewChat}
            style={glassStyle}
            className="w-full h-10 px-3 flex items-center justify-between rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all text-[13.5px] font-medium text-foreground border border-foreground/10"
            title={isBuildMode ? "New project" : "New chat"}
          >
            <span>{isBuildMode ? "New project" : "New chat"}</span>
            <Plus className="w-4 h-4 opacity-80" strokeWidth={2.2} />
          </button>
        </div>
      )}

      {/* SCROLLABLE — conversations or sub-nav */}
      {!isCollapsed ? (
        <div className="relative flex-1 min-h-0 overflow-y-auto px-2 pb-3 [scrollbar-width:thin]">
          {showRecent ? (
            conversations.length === 0 ? (
              <div className="px-3 py-10 text-center">
                <p className="text-[13px] text-muted-foreground/70">No conversations yet</p>
              </div>
            ) : (
              Object.entries(groups).map(([label, items]) =>
                items.length === 0 ? null : (
                  <div key={label} className="mb-3">
                    <div className="px-3 pt-2 pb-1 font-display text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground/60 flex items-center gap-1.5">
                      {label === "Pinned" && <Pin className="w-3 h-3" strokeWidth={2.2} />}
                      {label}
                    </div>
                    <ul className="space-y-0.5">
                      {items.map((conv) => {
                        const onChatPage = location.pathname === "/chat";
                        const isActive = activeConversationId === conv.id;
                        return (
                          <li key={conv.id}>
                            <button
                              onClick={() => {
                                onClose();
                                closeInline();
                                if (onChatPage) onSelectConversation?.(conv.id);
                                else navigate("/chat", { state: { loadConversationId: conv.id } });
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-[13.5px] truncate transition-colors ${
                                isActive
                                  ? "bg-foreground/10 text-foreground"
                                  : "text-foreground/80 hover:bg-foreground/[0.05] hover:text-foreground"
                              }`}
                            >
                              <span className="truncate font-medium">{conv.title || "Untitled"}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )
              )
            )
          ) : (
            <SidebarSubNav
              mode={currentMode}
              size="sm"
              onNavigate={() => {
                onClose();
                closeInline();
              }}
            />
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-0" />
      )}

      {/* FOOTER — user pill (in-flow, no overlap) */}
      <div className="shrink-0 border-t border-border/60 p-2">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={handleNewChat}
              className="w-10 h-10 grid place-items-center rounded-lg text-foreground/80 hover:text-foreground hover:bg-foreground/[0.05] transition-colors"
              title={isBuildMode ? "New project" : "New chat"}
              aria-label="New chat"
            >
              <Plus className="w-[18px] h-[18px]" strokeWidth={2.2} />
            </button>
            <button
              onClick={() => { navigate("/settings"); onClose(); closeInline(); }}
              className="w-10 h-10 rounded-full grid place-items-center text-[12px] font-semibold overflow-hidden border border-border/60 bg-background/60"
              title={displayName}
            >
              {displayAvatar ? <img src={displayAvatar} alt="" className="w-10 h-10 rounded-full object-cover" /> : initial}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { navigate("/settings"); onClose(); closeInline(); }}
              className="flex-1 min-w-0 flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-foreground/[0.05] text-left transition-colors"
              title="Settings"
            >
              {displayAvatar ? (
                <img src={displayAvatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <div
                  className="w-8 h-8 rounded-full grid place-items-center text-[12px] font-semibold text-foreground shrink-0"
                  style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.35), hsl(var(--primary) / 0.12))" }}
                >
                  {initial}
                </div>
              )}
              <span className="text-[13px] font-medium text-foreground truncate flex-1">{displayName}</span>
            </button>
            <button
              onClick={() => { navigate("/pricing"); onClose(); closeInline(); }}
              className="shrink-0 flex items-center gap-1.5 px-2.5 h-8 rounded-md text-[12px] font-semibold text-foreground bg-foreground/[0.06] hover:bg-foreground/[0.10] border border-border/60 transition-colors"
              title={displayCredits > 0 ? `${displayCredits.toFixed(0)} credits` : "Upgrade"}
            >
              <MegsyStar size={13} static />
              <span>{displayCredits > 0 ? displayCredits.toFixed(0) : "Upgrade"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // MOBILE — restore previous design (pre-redesign), unchanged for phones
  const mobileContent = (
    <div className="flex flex-col h-full text-foreground relative overflow-hidden bg-background">
      <div className="relative shrink-0 px-4 pt-4 pb-2 flex items-center justify-between">
        <span className="font-display text-[18px] font-bold tracking-tight truncate">Megsy</span>
      </div>

      <div className="relative flex-1 overflow-y-auto px-3 pt-1 pb-32 min-h-0 [scrollbar-width:thin]">
        <div className="space-y-1 mb-3">
          {navItems.map(({ label, Icon, path, match }) => {
            const active = match(location.pathname);
            return (
              <button
                key={label}
                onClick={() => { navigate(path); onClose(); }}
                onMouseEnter={() => prefetchRoute(path)}
                onFocus={() => prefetchRoute(path)}
                className={`w-full h-11 px-3 flex items-center gap-3 rounded-xl transition-colors ${
                  active ? "bg-foreground/10 text-foreground" : "text-foreground/80 hover:text-foreground hover:bg-foreground/[0.05]"
                }`}
              >
                <Icon size={20} />
                <span className="text-[14.5px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>

        {showRecent ? (
          conversations.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <p className="text-[13px] text-muted-foreground/70">No conversations yet</p>
            </div>
          ) : (
            Object.entries(groups).map(([label, items]) =>
              items.length === 0 ? null : (
                <div key={label} className="mb-4">
                  <div className="px-3 pb-2 font-display text-[11px] uppercase tracking-[0.16em] text-muted-foreground/60 flex items-center gap-1.5">
                    {label === "Pinned" && <Pin className="w-3 h-3" strokeWidth={2.2} />}
                    {label}
                  </div>
                  <ul className="space-y-1">
                    {items.map((conv) => {
                      const onChatPage = location.pathname === "/chat";
                      const isActive = activeConversationId === conv.id;
                      return (
                        <li key={conv.id}>
                          <button
                            onClick={() => {
                              onClose();
                              if (onChatPage) onSelectConversation?.(conv.id);
                              else navigate("/chat", { state: { loadConversationId: conv.id } });
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-[14.5px] truncate transition-colors ${
                              isActive
                                ? "bg-primary/10 text-foreground border border-primary/25"
                                : "text-foreground/85 hover:bg-foreground/[0.05] hover:text-foreground border border-transparent"
                            }`}
                          >
                            <span className="truncate font-medium">{conv.title || "Untitled"}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )
            )
          )
        ) : (
          <SidebarSubNav mode={currentMode} size="md" onNavigate={onClose} />
        )}
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-6 pointer-events-none z-10
                   bg-gradient-to-t from-white via-white/90 to-transparent
                   dark:from-black dark:via-black/90 dark:to-transparent"
      >
        <div className="pointer-events-auto flex items-center gap-2">
          <div
            className="flex-1 min-w-0 flex items-stretch rounded-full overflow-hidden border border-foreground/10"
            style={glassStyle}
          >
            <button
              onClick={() => { navigate("/settings"); onClose(); }}
              className="flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 hover:bg-foreground/[0.06] text-left transition-colors"
              title="Settings"
            >
              {displayAvatar ? (
                <img src={displayAvatar} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-primary/30 shrink-0" />
              ) : (
                <div
                  className="w-8 h-8 rounded-full grid place-items-center text-[12px] font-semibold text-foreground ring-1 ring-primary/30 shrink-0"
                  style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.35), hsl(var(--primary) / 0.12))" }}
                >
                  {initial}
                </div>
              )}
              <span className="text-[13.5px] font-medium text-foreground truncate">{displayName}</span>
            </button>

            <button
              onClick={() => { navigate("/pricing"); onClose(); }}
              className="flex items-center gap-1.5 pl-2.5 pr-3 my-1 mr-1 rounded-full text-[12px] font-semibold text-foreground transition-transform hover:scale-105 border border-foreground/10"
              style={glassStyle}
              title={displayCredits > 0 ? `${displayCredits.toFixed(0)} credits` : "Upgrade"}
            >
              <MegsyStar size={14} static />
              <span>{displayCredits > 0 ? displayCredits.toFixed(0) : "Upgrade"}</span>
            </button>
          </div>

          <button
            onClick={handleNewChat}
            className="w-11 h-11 shrink-0 rounded-full grid place-items-center text-foreground transition-transform hover:scale-105 active:scale-95 border border-foreground/10"
            style={glassStyle}
            title={isBuildMode ? "New project" : "New chat"}
            aria-label="New chat"
          >
            <Plus className="w-5 h-5" strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  );


  if (inline) return innerContent;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 z-[90] bg-background/60 backdrop-blur-md cursor-pointer"
            onClick={onClose}
            onTouchStart={onClose}
          />
          <motion.aside
            initial={{ x: -300, opacity: 0.4 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            style={{ willChange: "transform" }}
            className="fixed left-0 top-0 bottom-0 z-[91] w-[288px] flex flex-col overflow-hidden border-r border-foreground/10"
            onClick={(e) => e.stopPropagation()}
          >
            {mobileContent}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default AppSidebar;
