import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { WorkspaceCtx } from "@/hooks/useWorkspaceContext";

export default function SecurityTab() {
  const { ws, isAdmin } = useOutletContext<{ ws: WorkspaceCtx; isAdmin: boolean }>();
  const [s, setS] = useState<any>({
    sso_enabled: false, sso_metadata_url: "", sso_entity_id: "",
    require_join_approval: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("workspace_settings").select("*").eq("workspace_id", ws.id).maybeSingle();
      if (data) setS((cur: any) => ({ ...cur, ...data }));
    })();
  }, [ws.id]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("workspace_settings").upsert({
      workspace_id: ws.id,
      sso_enabled: s.sso_enabled,
      sso_metadata_url: s.sso_metadata_url,
      sso_entity_id: s.sso_entity_id,
      require_join_approval: s.require_join_approval,
      updated_at: new Date().toISOString(),
    } as any);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div>
        <h2 className="text-[22px] font-semibold tracking-tight text-foreground">Security</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Membership rules and single sign-on.</p>
      </div>

      <section className="rounded-2xl border border-border/60 bg-card overflow-hidden divide-y divide-border/60">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="pr-6">
            <p className="text-[13.5px] font-medium text-foreground">Require approval to join</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">New members must be approved by an admin.</p>
          </div>
          <Switch
            checked={!!s.require_join_approval}
            onCheckedChange={(v) => setS((c: any) => ({ ...c, require_join_approval: v }))}
            disabled={!isAdmin}
          />
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="pr-6">
              <p className="text-[13.5px] font-medium text-foreground">Single sign-on (SAML)</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">Enterprise SSO via your identity provider.</p>
            </div>
            <Switch
              checked={!!s.sso_enabled}
              onCheckedChange={(v) => setS((c: any) => ({ ...c, sso_enabled: v }))}
              disabled={!isAdmin}
            />
          </div>

          {s.sso_enabled && (
            <div className="space-y-4 pt-5 mt-4 border-t border-border/60">
              <div className="space-y-1.5">
                <label className="text-[11.5px] font-medium uppercase tracking-wider text-muted-foreground">Metadata URL</label>
                <Input
                  value={s.sso_metadata_url || ""}
                  onChange={(e) => setS((c: any) => ({ ...c, sso_metadata_url: e.target.value }))}
                  disabled={!isAdmin}
                  placeholder="https://idp.example.com/metadata.xml"
                  className="h-10 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11.5px] font-medium uppercase tracking-wider text-muted-foreground">Entity ID</label>
                <Input
                  value={s.sso_entity_id || ""}
                  onChange={(e) => setS((c: any) => ({ ...c, sso_entity_id: e.target.value }))}
                  disabled={!isAdmin}
                  className="h-10 rounded-lg"
                />
              </div>
            </div>
          )}
        </div>
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
