import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Loader2, MoreVertical, Plus, Share2, UserPlus, Pencil, Pin, Trash2 } from "lucide-react";

export interface MobileChatHeaderProps {
  title?: string;
  hasConversation: boolean;
  isPinned?: boolean;
  onOpenSidebar: () => void;
  onNewChat: () => void;
  onShare: () => void;
  onInvite: () => void;
  onRename: () => void;
  onTogglePin: () => void;
  onDelete: () => void | Promise<void>;
  isDeleting?: boolean;
  rightSlot?: React.ReactNode;
}

export default function MobileChatHeader({
  hasConversation,
  isPinned,
  onOpenSidebar,
  onNewChat,
  onShare,
  onInvite,
  onRename,
  onTogglePin,
  onDelete,
  isDeleting,
  rightSlot,
}: MobileChatHeaderProps) {
  const [open, setOpen] = useState(false);
  const [menuView, setMenuView] = useState<"main" | "delete">("main");

  const items = [
    { icon: Share2, label: "Share", onClick: onShare },
    { icon: Pin, label: isPinned ? "Unpin" : "Pin chat", onClick: onTogglePin },
    { icon: UserPlus, label: "Invite people", onClick: onInvite },
    { icon: Pencil, label: "Rename", onClick: onRename },
    { icon: Plus, label: "New chat", onClick: onNewChat },
  ];

  const run = (fn: () => void) => {
    setOpen(false);
    setMenuView("main");
    setTimeout(fn, 60);
  };

  const confirmDelete = async () => {
    await onDelete();
    setOpen(false);
    setMenuView("main");
  };

  return (
    <>
      <div
        data-testid="mobile-chat-header"
        className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center gap-2 px-3 py-1.5 min-h-[44px] pt-[max(env(safe-area-inset-top),0.25rem)] bg-transparent pointer-events-none [&>*]:pointer-events-auto"
      >
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open menu"
          data-testid="mobile-open-sidebar"
          className="ios-fab w-11 h-11 rounded-full flex items-center justify-center text-foreground"
        >
          <ChevronRight className="mobile-header-icon-black w-[22px] h-[22px]" strokeWidth={2.25} />
        </button>

        <div className="flex-1 min-w-0 text-center">
          {!hasConversation ? rightSlot ?? null : null}
        </div>

        {hasConversation ? (
          <button
            type="button"
            aria-label="More options"
            data-testid="mobile-more-menu"
            onClick={() => { setMenuView("main"); setOpen(true); }}
            className="ios-fab w-10 h-10 rounded-full flex items-center justify-center text-foreground"
          >
            <MoreVertical className="mobile-header-icon-black w-5 h-5" />
          </button>
        ) : (
          <span className="w-10 h-10 opacity-0 pointer-events-none" aria-hidden />
        )}
      </div>

      <AnimatePresence>
        {open && (
          <>
            {/* Click-away backdrop (no dimming — keep liquid glass effect) */}
            <motion.div
              key="lg-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="md:hidden fixed inset-0 z-40"
              onClick={() => { if (!isDeleting) { setOpen(false); setMenuView("main"); } }}
            />

            {/* Liquid Glass popover anchored under the three-dot button */}
            <motion.div
              key="lg-menu"
              data-testid="mobile-more-menu-content"
              initial={{ opacity: 0, scale: 0.94, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.7 }}
              style={{
                top: "calc(env(safe-area-inset-top, 0px) + 52px)",
                transformOrigin: "top right",
                background:
                  "linear-gradient(180deg, hsl(var(--background) / 0.55), hsl(var(--background) / 0.72))",
                backdropFilter: "blur(28px) saturate(180%)",
                WebkitBackdropFilter: "blur(28px) saturate(180%)",
                boxShadow:
                  "0 22px 48px -16px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.25), inset 0 1px 0 hsl(var(--foreground) / 0.08), inset 0 0 0 0.5px hsl(var(--foreground) / 0.10)",
              }}
              className="md:hidden fixed right-3 z-50 w-[256px] rounded-[22px] overflow-hidden border border-foreground/10"
              dir="rtl"
            >
              <AnimatePresence mode="wait" initial={false}>
                {menuView === "main" ? (
                  <motion.div
                    key="menu-main"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.14 }}
                    className="py-1"
                  >
                    {items.map(({ icon: Icon, label, onClick }, i) => (
                      <div key={label}>
                        {i !== 0 && <div className="h-px bg-foreground/[0.07] mx-3" />}
                        <button
                          type="button"
                          onClick={() => run(onClick)}
                          data-testid={`mobile-menu-${label.toLowerCase().replace(/\s+/g, "-")}`}
                          className="w-full flex items-center gap-3 px-4 py-3 transition-colors active:bg-foreground/[0.08] text-foreground"
                        >
                          <span className="flex-1 truncate text-[15px] font-medium text-right">{label}</span>
                          <Icon className="w-[19px] h-[19px] text-foreground shrink-0" strokeWidth={1.8} />
                        </button>
                      </div>
                    ))}
                    <div className="h-px bg-foreground/[0.07] mx-3" />
                    <button
                      type="button"
                      onClick={() => setMenuView("delete")}
                      data-testid="mobile-menu-delete"
                      className="w-full flex items-center gap-3 px-4 py-3 transition-colors active:bg-destructive/10 text-destructive"
                    >
                      <span className="flex-1 truncate text-[15px] font-medium text-right">Delete</span>
                      <Trash2 className="w-[19px] h-[19px] shrink-0" strokeWidth={1.8} />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu-delete"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.14 }}
                    className="p-3"
                  >
                    <button
                      type="button"
                      onClick={() => setMenuView("main")}
                      disabled={isDeleting}
                      className="mb-2 flex items-center gap-1 text-[12px] font-medium text-muted-foreground active:text-foreground disabled:opacity-50"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                      Back
                    </button>
                    <div className="px-1 pb-3 text-right">
                      <div className="text-[14px] font-semibold text-foreground">Delete chat?</div>
                      <p className="mt-1 text-[11.5px] leading-5 text-muted-foreground">This conversation will be permanently removed.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMenuView("main")}
                        disabled={isDeleting}
                        className="flex-1 rounded-xl px-3 py-2 text-[12px] font-semibold text-muted-foreground transition-colors active:bg-foreground/[0.08] disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={confirmDelete}
                        disabled={isDeleting}
                        className="flex-1 rounded-xl px-3 py-2 text-[12px] font-semibold bg-destructive text-destructive-foreground transition-opacity active:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Delete
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
