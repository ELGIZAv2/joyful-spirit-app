import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { WorkspaceCtx } from "@/hooks/useWorkspaceContext";
import WorkspaceImageUpload from "@/components/workspace/WorkspaceImageUpload";

export default function BrandTab() {
  const { ws, isAdmin } = useOutletContext<{ ws: WorkspaceCtx; isAdmin: boolean }>();
  const [brand, setBrand] = useState<any>({
    primary_color: "#000000",
    heading_font: "Inter",
    body_font: "Inter",
    logo_url: "",
    cover_url: "",
    tone_of_voice: "",
    brand_description: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("workspace_brand_kit").select("*").eq("workspace_id", ws.id).maybeSingle();
      if (data) setBrand((b: any) => ({ ...b, ...data }));
    })();
  }, [ws.id]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("workspace_brand_kit").upsert({
      ...brand, workspace_id: ws.id, updated_at: new Date().toISOString(),
    } as any);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-2">
      <label className="text-[11.5px] font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );

  return (
    <div className="space-y-12 animate-fade-in">
      <div>
        <h2 className="text-[22px] font-semibold tracking-tight text-foreground">Brand kit</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Logo, color and typography for your workspace.</p>
      </div>

      <section className="space-y-6 pb-10 border-b border-border/60">
        <h3 className="text-[14px] font-semibold tracking-tight">Visuals</h3>
        <WorkspaceImageUpload
          workspaceId={ws.id} value={brand.logo_url}
          onChange={(url) => setBrand((b: any) => ({ ...b, logo_url: url }))}
          kind="logo" label="Logo" shape="rounded" disabled={!isAdmin}
        />
        <WorkspaceImageUpload
          workspaceId={ws.id} value={brand.cover_url}
          onChange={(url) => setBrand((b: any) => ({ ...b, cover_url: url }))}
          kind="cover" label="Cover image" shape="wide" disabled={!isAdmin}
        />
      </section>

      <section className="space-y-6 pb-10 border-b border-border/60">
        <h3 className="text-[14px] font-semibold tracking-tight">Color & typography</h3>
        <Field label="Primary color">
          <div className="flex gap-2 max-w-md">
            <input
              type="color"
              value={brand.primary_color || "#000000"}
              onChange={(e) => setBrand((b: any) => ({ ...b, primary_color: e.target.value }))}
              disabled={!isAdmin}
              className="w-11 h-10 rounded-lg border border-border bg-background cursor-pointer shrink-0"
            />
            <Input
              value={brand.primary_color || ""}
              onChange={(e) => setBrand((b: any) => ({ ...b, primary_color: e.target.value }))}
              disabled={!isAdmin}
              className="font-mono text-[12.5px] h-10 rounded-lg flex-1"
            />
          </div>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <Field label="Heading font">
            <Input value={brand.heading_font || ""} onChange={(e) => setBrand((b: any) => ({ ...b, heading_font: e.target.value }))} disabled={!isAdmin} className="h-10 rounded-lg" />
          </Field>
          <Field label="Body font">
            <Input value={brand.body_font || ""} onChange={(e) => setBrand((b: any) => ({ ...b, body_font: e.target.value }))} disabled={!isAdmin} className="h-10 rounded-lg" />
          </Field>
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-[14px] font-semibold tracking-tight">Voice</h3>
        <Field label="Tone of voice">
          <Input value={brand.tone_of_voice || ""} onChange={(e) => setBrand((b: any) => ({ ...b, tone_of_voice: e.target.value }))} disabled={!isAdmin} placeholder="Friendly, professional…" className="h-10 rounded-lg max-w-md" />
        </Field>
        <Field label="Brand description">
          <Textarea value={brand.brand_description || ""} onChange={(e) => setBrand((b: any) => ({ ...b, brand_description: e.target.value }))} disabled={!isAdmin} rows={4} className="rounded-lg resize-none" />
        </Field>
      </section>

      {isAdmin && (
        <div className="flex justify-end">
          <Button variant="solid" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save brand kit"}
          </Button>
        </div>
      )}
    </div>
  );
}
