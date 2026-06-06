import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { WorkspaceCtx } from "@/hooks/useWorkspaceContext";
import WorkspaceImageUpload from "@/components/workspace/WorkspaceImageUpload";

export default function GeneralTab() {
  const { ws, isAdmin } = useOutletContext<{ ws: WorkspaceCtx; isAdmin: boolean }>();
  const [name, setName] = useState(ws.name);
  const [avatarUrl, setAvatarUrl] = useState<string | null>((ws as any).avatar_url || null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: w } = await supabase.from("workspaces").select("name, avatar_url").eq("id", ws.id).maybeSingle();
      if (w) {
        setName(w.name);
        setAvatarUrl((w as any).avatar_url || null);
      }
    })();
  }, [ws.id]);

  const save = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) { toast.error("Name must be at least 2 characters"); return; }
    if (trimmed.length > 60) { toast.error("Name must be 60 characters or fewer"); return; }
    setSaving(true);
    const { error } = await supabase
      .from("workspaces")
      .update({ name: trimmed, avatar_url: avatarUrl } as any)
      .eq("id", ws.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Saved");
  };

  return (
    <div className="space-y-12 animate-fade-in">
      <div>
        <h2 className="text-[22px] font-semibold tracking-tight text-foreground">General</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Manage your workspace name and identity.</p>
      </div>

      <section className="space-y-5 pb-10 border-b border-border/60">
        <div>
          <h3 className="text-[14px] font-semibold tracking-tight text-foreground">Workspace photo</h3>
          <p className="text-[12.5px] text-muted-foreground mt-1">A square image works best. Visible to all members.</p>
        </div>
        <WorkspaceImageUpload
          workspaceId={ws.id}
          value={avatarUrl}
          onChange={setAvatarUrl}
          kind="avatar"
          label=""
          shape="circle"
          disabled={!isAdmin}
        />
      </section>

      <section className="space-y-4 pb-10 border-b border-border/60">
        <div>
          <h3 className="text-[14px] font-semibold tracking-tight text-foreground">Workspace name</h3>
          <p className="text-[12.5px] text-muted-foreground mt-1">This is the name your members will see across the app.</p>
        </div>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!isAdmin}
          className="max-w-md h-11 rounded-lg"
          placeholder="Acme Inc."
        />
      </section>

      {isAdmin && (
        <div className="flex justify-end">
          <Button variant="solid" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
