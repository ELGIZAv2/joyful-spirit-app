import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Loader2, ScrollText } from "lucide-react";
import { BackIcon } from "@/components/settings/SettingsIcons";

interface AuditEntry {
  id: string;
  agent: string;
  action: string;
  payload: any;
  error: string | null;
  created_at: string;
  run_id: string | null;
}

const OperatorAuditPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data } = await supabase
        .from("operator_audit_log")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      setEntries(data || []);
      setLoading(false);
    })();
  }, [navigate]);

  return (
    <div className="h-[100dvh] bg-background overflow-y-auto">
      <div className="max-w-lg mx-auto pb-16 px-5">
        <div className="flex items-center justify-between py-4">
          <button onClick={() => navigate("/settings/operator")} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted/50">
            <BackIcon className="w-5 h-5" />
          </button>
          <h1 className="font-display text-base font-bold">Audit log</h1>
          <div className="w-9" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            No log yet. Every command the AI runs will appear here.
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {entries.map((e) => (
              <div key={e.id} className="p-3 rounded-2xl bg-muted/30 border border-border/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-primary">{e.agent}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(e.created_at).toLocaleString("ar")}</span>
                </div>
                <p className="text-sm font-medium text-foreground">{e.action}</p>
                {e.payload && Object.keys(e.payload).length > 0 && (
                  <pre className="mt-2 text-[10px] text-muted-foreground bg-background/50 p-2 rounded-lg overflow-x-auto max-h-32" dir="ltr">
                    {JSON.stringify(e.payload, null, 2)}
                  </pre>
                )}
                {e.error && <p className="mt-2 text-xs text-destructive">{e.error}</p>}
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default OperatorAuditPage;
