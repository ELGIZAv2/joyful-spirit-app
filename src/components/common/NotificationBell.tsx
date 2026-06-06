import { Bell, CreditCard, Settings, Sparkles, Users, CheckCheck, UserPlus, Check, X, UserCheck, UserX, Loader2 } from "lucide-react";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const typeConfig: Record<string, { icon: typeof Bell; className: string }> = {
  credits: { icon: CreditCard, className: "text-yellow-500" },
  system: { icon: Settings, className: "text-blue-500" },
  generation: { icon: Sparkles, className: "text-purple-500" },
  referral: { icon: Users, className: "text-green-500" },
  workspace_invite: { icon: UserPlus, className: "text-indigo-500" },
  workspace_invite_accepted: { icon: UserCheck, className: "text-emerald-500" },
  workspace_invite_declined: { icon: UserX, className: "text-rose-500" },
};

const NotificationBell = () => {
  const { notifications, unreadCount, markAllRead, markOneRead } = useNotifications();
  const navigate = useNavigate();
  const [pending, setPending] = useState<Record<string, "accept" | "decline" | undefined>>({});
  const [handled, setHandled] = useState<Record<string, "accepted" | "declined" | undefined>>({});

  const handleInvite = async (n: Notification, action: "accept" | "decline") => {
    const token = (n.metadata as any)?.invite_token as string | undefined;
    if (!token) {
      toast.error("Invite link is missing");
      return;
    }
    setPending(p => ({ ...p, [n.id]: action }));
    try {
      const rpc = action === "accept" ? "workspace_accept_invite" : "workspace_decline_invite";
      const { data, error } = await supabase.rpc(rpc as any, { p_token: token });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) {
        const msg: Record<string, string> = {
          not_found: "Invite no longer exists",
          already_used: "This invite was already used",
          expired: "This invite has expired",
          email_mismatch: "Invite is for a different email",
          auth_required: "Please sign in first",
        };
        throw new Error(msg[result?.error] || "Could not process invite");
      }
      setHandled(h => ({ ...h, [n.id]: action === "accept" ? "accepted" : "declined" }));
      markOneRead(n.id);
      if (action === "accept") {
        toast.success("You joined the workspace");
        if (result.workspace_id) navigate(`/workspaces/${result.workspace_id}`);
      } else {
        toast.success("Invite declined");
      }
    } catch (e: any) {
      toast.error(e?.message || "Something went wrong");
    } finally {
      setPending(p => ({ ...p, [n.id]: undefined }));
    }
  };

  const renderItem = (n: Notification) => {
    const config = typeConfig[n.type] || typeConfig.system;
    const Icon = config.icon;
    const isInvite = n.type === "workspace_invite";
    const inviteState = handled[n.id];
    const inFlight = pending[n.id];
    return (
      <div
        key={n.id}
        className={`w-full px-4 py-3 transition-colors ${
          n.read && !isInvite ? "opacity-60" : !n.read ? "bg-accent/30" : ""
        }`}
      >
        <button
          onClick={() => { if (!isInvite) markOneRead(n.id); }}
          className="w-full text-left flex items-start gap-3"
        >
          <div className={`w-8 h-8 rounded-full bg-accent/40 flex items-center justify-center shrink-0`}>
            <Icon className={`w-4 h-4 ${config.className}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
            </p>
          </div>
          {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
        </button>

        {isInvite && (
          <div className="mt-3 pl-11">
            {inviteState === "accepted" ? (
              <div className="text-xs font-medium text-emerald-500 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Joined
              </div>
            ) : inviteState === "declined" ? (
              <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <X className="w-3.5 h-3.5" /> Declined
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  disabled={!!inFlight}
                  onClick={() => handleInvite(n, "accept")}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition disabled:opacity-50"
                >
                  {inFlight === "accept" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Accept
                </button>
                <button
                  disabled={!!inFlight}
                  onClick={() => handleInvite(n, "decline")}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-foreground text-xs font-medium hover:bg-accent/50 transition disabled:opacity-50"
                >
                  {inFlight === "decline" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                  Decline
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Drawer direction="top">
      <DrawerTrigger asChild>
        <button
          className="relative flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors w-9 h-9"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[70vh]">
        <DrawerHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border">
          <DrawerTitle className="text-base font-semibold">Notifications</DrawerTitle>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <CheckCheck className="w-3 h-3" />
              Mark all read
            </button>
          )}
        </DrawerHeader>
        <div className="overflow-y-auto flex-1 divide-y divide-border">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No notifications</p>
          ) : (
            notifications.slice(0, 20).map(renderItem)
          )}
        </div>
        <div className="border-t border-border px-4 py-3">
          <button
            onClick={() => navigate("/settings/notifications")}
            className="text-xs text-primary hover:underline w-full text-center"
          >
            Notification settings
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default NotificationBell;
