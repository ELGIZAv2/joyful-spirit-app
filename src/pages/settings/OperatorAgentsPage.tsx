import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Loader2, Bot, Trash2, Sparkles } from "lucide-react";
import { BackIcon } from "@/components/settings/SettingsIcons";
import { toast } from "sonner";

interface DynAgent {
  id: string;
  key: string;
  label: string;
  description: string | null;
  color: string;
  usage_count: number;
  created_at: string;
}

const OperatorAgentsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<DynAgent[]>([]);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }
    const { data } = await supabase
      .from("operator_dynamic_agents")
      .select("id,key,label,description,color,usage_count,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setAgents(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string, label: string) => {
    if (!confirm(`Delete ${label}?`)) return;
    const { error } = await supabase.from("operator_dynamic_agents").delete().eq("id", id);
    if (error) toast.error("Delete failed"); else { toast.success("Deleted"); load(); }
  };

  return (
    <div className="h-[100dvh] bg-background overflow-y-auto">
      <div className="max-w-lg mx-auto pb-16 px-5">
        <div className="flex items-center justify-between py-4">
          <button onClick={() => navigate("/settings/operator")} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted/50">
            <BackIcon className="w-5 h-5" />
          </button>
          <h1 className="font-display text-base font-bold">Dynamic agents</h1>
          <div className="w-9" />
        </div>

        <p className="text-xs text-muted-foreground mb-4 px-1">
          Agents Specialists generated automatically by AI for your tasks. Each agent activates when it finds a task in its specialty.
        </p>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : agents.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            <Bot className="w-10 h-10 mx-auto mb-3 opacity-30" />
            No agents yet. Ask AI for a specialized task and a suitable agent will be generated.
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2.5">
            {agents.map((a) => (
              <div key={a.id} className="p-4 rounded-2xl bg-muted/30 border border-border/30 flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: `${a.color}20` }}>
                  <Sparkles className="w-5 h-5" style={{ color: a.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{a.label}</p>
                  {a.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.description}</p>}
                  <p className="text-[10px] text-muted-foreground/70 mt-1.5">
                    Use {a.usage_count} time · {new Date(a.created_at).toLocaleDateString("ar")}
                  </p>
                </div>
                <button onClick={() => remove(a.id, a.label)} className="w-8 h-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-destructive/70 hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default OperatorAgentsPage;
