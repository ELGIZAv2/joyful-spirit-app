// @ts-nocheck — imported design from external repo; backend wiring deferred.
import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Key, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  projectId: string | null;
  onConnected: (url: string, anonKey: string) => void;
}

const SupabaseConnectCard = ({ projectId, onConnected }: Props) => {
  const [step, setStep] = useState<"url" | "key" | "done">("url");
  const [url, setUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSaveUrl = () => {
    if (!url.trim() || !url.includes("supabase")) return;
    setStep("key");
  };

  const handleSaveKey = async () => {
    if (!anonKey.trim()) return;
    setSaving(true);
    
    // Save to project metadata
    if (projectId) {
      const { data: project } = await supabase
        .from("projects")
        .select("files_snapshot")
        .eq("id", projectId)
        .single();
      
      const snapshot = (project?.files_snapshot as Record<string, unknown>) || {};
      await supabase
        .from("projects")
        .update({
          files_snapshot: {
            ...snapshot,
            __supabase_config: { url: url.trim(), anon_key: anonKey.trim() }
          } as any
        })
        .eq("id", projectId);
    }

    setSaving(false);
    setStep("done");
    onConnected(url.trim(), anonKey.trim());
  };

  if (step === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 py-2"
      >
        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
          <Check className="w-3 h-3 text-primary" />
        </div>
        <span className="text-xs text-muted-foreground">Supabase connected</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4 space-y-3 max-w-sm"
    >
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">
          {step === "url" ? "Supabase Project URL" : "Anon Key"}
        </span>
      </div>
      
      {step === "url" ? (
        <div className="space-y-2">
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://xxx.supabase.co"
            className="w-full bg-secondary rounded-lg px-3 py-2 text-xs text-foreground border border-border outline-none focus:border-primary transition-colors"
          />
          <button
            onClick={handleSaveUrl}
            disabled={!url.trim()}
            className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-30"
          >
            Next
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Key className="w-3 h-3 text-muted-foreground" />
            <input
              type="password"
              value={anonKey}
              onChange={e => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOi..."
              className="flex-1 bg-secondary rounded-lg px-3 py-2 text-xs text-foreground border border-border outline-none focus:border-primary transition-colors"
            />
          </div>
          <button
            onClick={handleSaveKey}
            disabled={!anonKey.trim() || saving}
            className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-30 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Connect
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default SupabaseConnectCard;
