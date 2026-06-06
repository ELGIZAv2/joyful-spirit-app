import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { WorkspaceCtx } from "@/hooks/useWorkspaceContext";

const EVENTS = [
  { key: "member_joined", label: "Member joined", desc: "When someone joins the workspace." },
  { key: "task_assigned", label: "Task assigned", desc: "When a task is assigned to you." },
  { key: "comment_mention", label: "Mentions", desc: "When you're mentioned in a comment." },
  { key: "low_credits", label: "Low credits", desc: "When this workspace's credits run low." },
];

export default function NotificationsTab() {
  const { ws, me } = useOutletContext<{ ws: WorkspaceCtx; me: string | null }>();
  const [prefs, setPrefs] = useState<any>({ in_app: {}, email: {} });

  useEffect(() => {
    if (!me) return;
    (async () => {
      const { data } = await supabase
        .from("workspace_notification_prefs")
        .select("*")
        .eq("workspace_id", ws.id).eq("user_id", me).maybeSingle();
      if (data) setPrefs({ in_app: (data as any).in_app, email: (data as any).email });
      else setPrefs({
        in_app: { member_joined: true, task_assigned: true, comment_mention: true, low_credits: true },
        email: { member_joined: true, task_assigned: false, comment_mention: true, low_credits: true },
      });
    })();
  }, [ws.id, me]);

  const toggle = async (channel: "in_app" | "email", key: string, val: boolean) => {
    const next = { ...prefs, [channel]: { ...prefs[channel], [key]: val } };
    setPrefs(next);
    await supabase.from("workspace_notification_prefs").upsert({
      workspace_id: ws.id, user_id: me!,
      in_app: next.in_app, email: next.email,
      updated_at: new Date().toISOString(),
    } as any, { onConflict: "workspace_id,user_id" });
    toast.success("Saved");
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-[22px] font-semibold tracking-tight text-foreground">Notifications</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Choose how this workspace notifies you.</p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_90px_90px] px-5 py-3 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60 bg-foreground/[0.02]">
          <span>Event</span>
          <span className="text-center">In-app</span>
          <span className="text-center">Email</span>
        </div>
        {EVENTS.map((e, i) => (
          <div key={e.key} className={`grid grid-cols-[1fr_90px_90px] items-center px-5 py-4 hover:bg-foreground/[0.02] transition-colors ${i < EVENTS.length - 1 ? "border-b border-border/60" : ""}`}>
            <div>
              <p className="text-[13.5px] font-medium text-foreground">{e.label}</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">{e.desc}</p>
            </div>
            <div className="flex justify-center">
              <Switch checked={!!prefs.in_app[e.key]} onCheckedChange={(v) => toggle("in_app", e.key, v)} />
            </div>
            <div className="flex justify-center">
              <Switch checked={!!prefs.email[e.key]} onCheckedChange={(v) => toggle("email", e.key, v)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
