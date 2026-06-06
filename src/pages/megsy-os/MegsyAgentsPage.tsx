import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/common/SEOHead";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import * as Icons from "lucide-react";
import { ArrowLeft, Search, Sparkles, Play, RefreshCw } from "lucide-react";

type Agent = {
  id: string;
  slug: string;
  name: string;
  name_ar: string | null;
  description: string;
  description_ar: string | null;
  category: string;
  icon: string;
  color: string;
  model: string;
  default_tools: string[];
  capabilities: string[];
  tags: string[];
  is_premium: boolean;
  is_featured: boolean;
  credits_per_message: number;
};

const COLOR_CLASSES: Record<string, string> = {
  blue: "bg-blue-500/15 text-blue-500",
  violet: "bg-violet-500/15 text-violet-500",
  emerald: "bg-emerald-500/15 text-emerald-500",
  orange: "bg-orange-500/15 text-orange-500",
  rose: "bg-rose-500/15 text-rose-500",
  amber: "bg-amber-500/15 text-amber-500",
  cyan: "bg-cyan-500/15 text-cyan-500",
  pink: "bg-pink-500/15 text-pink-500",
  teal: "bg-teal-500/15 text-teal-500",
  indigo: "bg-indigo-500/15 text-indigo-500",
  purple: "bg-purple-500/15 text-purple-500",
  red: "bg-red-500/15 text-red-500",
  slate: "bg-slate-500/15 text-slate-500",
  primary: "bg-primary/15 text-primary",
};

function getIcon(name: string) {
  const Comp = (Icons as any)[name] || Icons.Bot;
  return Comp;
}

export default function MegsyAgentsPage() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("All");
  const [seeding, setSeeding] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);

  const loadAgents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("agents_catalog")
      .select("*")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true });
    if (error) {
      toast.error("Failed to load agents");
      console.error(error);
    } else {
      setAgents((data || []) as any);
    }
    setLoading(false);
  };

  useEffect(() => { loadAgents(); }, []);

  const categories = useMemo(() => {
    const set = new Set<string>(["All"]);
    agents.forEach((a) => set.add(a.category));
    return Array.from(set);
  }, [agents]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return agents.filter((a) => {
      if (activeCat !== "All" && a.category !== activeCat) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        (a.name_ar || "").includes(q) ||
        a.description.toLowerCase().includes(q) ||
        (a.description_ar || "").includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [agents, query, activeCat]);

  const seedAgents = async () => {
    setSeeding(true);
    try {
      const { error } = await supabase.functions.invoke("agents-seed", { body: {} });
      if (error) throw error;
      toast.success("Catalog refreshed");
      await loadAgents();
    } catch (e: any) {
      toast.error(e.message || "Seed failed");
    } finally {
      setSeeding(false);
    }
  };

  const startAgent = async (agent: Agent) => {
    setStarting(agent.slug);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth?next=/megsy-os/agents");
        return;
      }
      const { data, error } = await supabase
        .from("agent_sessions")
        .insert({
          user_id: user.id,
          agent_slug: agent.slug,
          title: agent.name,
        })
        .select("id")
        .single();
      if (error) throw error;
      navigate(`/megsy-os/agents/${agent.slug}/${data.id}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to start session");
    } finally {
      setStarting(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Megsy Agents — Multi-agent AI workforce"
        description="Hundreds of specialized AI agents with their own cloud computers, ready to work for you."
        path="/megsy-os/agents"
      />

      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Megsy Agents
            </h1>
            <p className="text-xs text-muted-foreground">
              {agents.length} specialized agents · open a cloud computer & work
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={seedAgents}
            disabled={seeding}
            className="gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${seeding ? "animate-spin" : ""}`} />
            {agents.length === 0 ? "Seed catalog" : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search agents…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCat === cat
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Agents grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="text-5xl">🤖</div>
            <p className="text-muted-foreground">
              {agents.length === 0
                ? "No agents yet — click 'Seed catalog' to populate."
                : "No agents match your search."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((agent) => {
              const Icon = getIcon(agent.icon);
              const colorClass = COLOR_CLASSES[agent.color] || COLOR_CLASSES.primary;
              return (
                <div
                  key={agent.id}
                  className="group relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur p-5 hover:border-border hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                      <Icon className="w-5 h-5" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-[15px] truncate">{agent.name}</h3>
                        {agent.is_premium && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600">
                            PRO
                          </span>
                        )}
                        {agent.is_featured && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                            ★
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{agent.category}</p>
                    </div>
                  </div>

                  <p className="text-[13px] text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                    {agent.description}
                  </p>

                  <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                    {agent.capabilities.slice(0, 3).map((cap) => (
                      <Badge key={cap} variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                        {cap}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      {agent.credits_per_message} MC / msg
                    </span>
                    <Button
                      size="sm"
                      onClick={() => startAgent(agent)}
                      disabled={starting === agent.slug}
                      className="gap-1.5 h-8 rounded-full"
                    >
                      <Play className="w-3 h-3" />
                      {starting === agent.slug ? "…" : "Run"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
