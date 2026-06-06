import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Presence { user_id: string; display_name?: string; avatar_url?: string; }

export default function PresenceBar({ workspaceId }: { workspaceId: string }) {
  const [online, setOnline] = useState<Presence[]>([]);

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data: prof } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;

      // Unique channel name per mount avoids "callbacks after subscribe()" in StrictMode/hot reload.
      const ch = supabase.channel(
        `ws-presence-${workspaceId}-${Math.random().toString(36).slice(2, 10)}`,
        { config: { presence: { key: user.id } } },
      );
      channel = ch;

      ch.on("presence", { event: "sync" }, () => {
        const state = ch.presenceState() as Record<string, Presence[]>;
        const list: Presence[] = [];
        Object.values(state).forEach((arr) => arr.forEach((p) => list.push(p)));
        if (!cancelled) setOnline(list);
      }).subscribe(async (status) => {
        if (status === "SUBSCRIBED" && !cancelled) {
          await ch.track({
            user_id: user.id,
            display_name: (prof as any)?.display_name,
            avatar_url: (prof as any)?.avatar_url,
          });
        }
      });
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  if (online.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {online.slice(0, 5).map((p, i) => (
          <div key={p.user_id + i} className="relative">
            {p.avatar_url ? (
              <img src={p.avatar_url} alt="" className="w-7 h-7 rounded-full border-2 border-background object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-semibold">
                {(p.display_name || "?")[0]?.toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-background" />
          </div>
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{online.length} online</span>
    </div>
  );
}
