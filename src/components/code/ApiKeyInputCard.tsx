// @ts-nocheck — imported design from external repo; backend wiring deferred.
import { useState } from "react";
import { motion } from "framer-motion";
import { Key, Check, Loader2 } from "lucide-react";

interface Props {
  serviceName: string;
  description: string;
  onSaved: (key: string) => void;
}

const ApiKeyInputCard = ({ serviceName, description, onSaved }: Props) => {
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!key.trim()) return;
    setSaving(true);
    // Simulate brief delay for UX
    await new Promise(r => setTimeout(r, 300));
    setSaving(false);
    setSaved(true);
    onSaved(key.trim());
  };

  if (saved) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 py-1.5"
      >
        <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
          <Check className="w-2.5 h-2.5 text-primary" />
        </div>
        <span className="text-xs text-muted-foreground">{serviceName} key saved</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-3 space-y-2 max-w-sm"
    >
      <div className="flex items-center gap-2">
        <Key className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-medium text-foreground">{serviceName}</span>
      </div>
      <p className="text-[11px] text-muted-foreground">{description}</p>
      <div className="flex gap-2">
        <input
          type="password"
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder="API Key"
          className="flex-1 bg-secondary rounded-lg px-3 py-1.5 text-xs text-foreground border border-border outline-none focus:border-primary transition-colors"
        />
        <button
          onClick={handleSave}
          disabled={!key.trim() || saving}
          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-30"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
        </button>
      </div>
    </motion.div>
  );
};

export default ApiKeyInputCard;
