// Phone/desktop image upload (no URL fields). Stores under
// workspace-assets/{workspace_id}/{kind}-{timestamp}.{ext} and returns the public URL.
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  workspaceId: string;
  value?: string | null;
  onChange: (url: string) => void;
  kind: "avatar" | "logo" | "cover";
  label: string;
  disabled?: boolean;
  shape?: "circle" | "rounded" | "wide";
}

export default function WorkspaceImageUpload({
  workspaceId, value, onChange, kind, label, disabled, shape = "rounded",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Image files only"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${workspaceId}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("workspace-assets").upload(path, file, {
      cacheControl: "3600", upsert: true, contentType: file.type,
    });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("workspace-assets").getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
    toast.success("Uploaded");
  };

  const sizeCls =
    shape === "circle" ? "w-20 h-20 rounded-full" :
    shape === "wide" ? "w-full h-32 rounded-lg" :
    "w-20 h-20 rounded-lg";

  return (
    <div>
      <p className="text-xs font-medium text-foreground mb-2">{label}</p>
      <div className="flex items-center gap-3">
        <div className={`${sizeCls} bg-muted overflow-hidden flex items-center justify-center text-xs text-muted-foreground border border-border`}>
          {value ? <img src={value} alt="" className="w-full h-full object-cover" /> : "—"}
        </div>
        <div className="flex flex-col gap-1.5">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
          />
          <Button
            type="button"
            variant="solid"
            size="sm"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Uploading…" : value ? "Replace" : "Upload from device"}
          </Button>
          {value && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange("")}
              className="text-[11px] text-muted-foreground hover:text-foreground text-left"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
