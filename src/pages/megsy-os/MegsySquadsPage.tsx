import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/common/SEOHead";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Users, Play, RefreshCw, Compass, Server, Code2, Palette, Wrench, TestTube } from "lucide-react";

type Squad = {
  id: string;
  name: string;
  description: string | null;
  agent_slugs: string[];
  is_public: boolean;
};

const ROLE_ICONS: Record<string, any> = {
  "sq-architect": Compass,
  "sq-backend": Server,
  "sq-frontend": Code2,
  "sq-ui": Palette,
  "sq-devops": Wrench,
  "sq-qa": TestTube,
};

export default function MegsySquadsPage() {
  const navigate = useNavigate();
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [task, setTask] = useState("");
  const [running, setRunning] = useState<string | null>(null);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    const { data, error } = await supabase
      .from("agent_squads")
      .select("id,name,description,agent_slugs,is_public")
      .eq("is_public", true)
      .order("created_at", { ascending: true });
    if (error && !silent) toast.error(error.message);
    setSquads((data as any) || []);
    if (!silent) setLoading(false);
    return (data as any) || [];
  }

  useEffect(() => {
    (async () => {
      const list = await load();
      // Auto-seed silently if no squads exist yet — runs once per fresh DB
      if (list.length === 0) {
        await supabase.functions.invoke("agent-run", { body: { action: "seed-squads" } }).catch(() => null);
        await load(true);
      }
    })();
  }, []);

  async function seed() {
    setSeeding(true);
    const { data, error } = await supabase.functions.invoke("agent-run", { body: { action: "seed-squads" } });
    setSeeding(false);
    if (error || !(data as any)?.ok) {
      toast.error((error as any)?.message || (data as any)?.error || "Seed failed");
      return;
    }
    toast.success("Megsy squad initialized");
    load();
  }

  async function runSquad(squad: Squad) {
    if (!task.trim()) { toast.error("Describe the project first"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please sign in first"); navigate("/auth"); return; }
    setRunning(squad.id);
    // Create a session row first so we can navigate immediately
    const { data: session, error } = await supabase
      .from("agent_sessions")
      .insert({
        user_id: user.id,
        agent_slug: `squad:${squad.id}`,
        title: task.slice(0, 80),
        status: "running",
        metadata: { squad_id: squad.id, squad_name: squad.name },
      })
      .select("id").single();
    if (error || !session) {
      setRunning(null);
      toast.error(error?.message || "Failed to start");
      return;
    }
    // Fire and forget — the page will poll messages
    supabase.functions.invoke("agent-run", {
      body: { action: "squad-run", squad_id: squad.id, task, session_id: session.id },
    }).then(({ error: e }) => {
      if (e) console.error("squad-run", e);
    });
    navigate(`/megsy-os/squads/${squad.id}/${session.id}`);
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Megsy Squads — Agent teams" description="Multi-agent squads that build full applications." path="/megsy-os/squads" />

      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="container max-w-5xl flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/megsy-os/agents")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold flex items-center gap-2"><Users className="h-4 w-4" /> Megsy Squads</h1>
              <p className="text-xs text-muted-foreground">Agent teams working together</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={seed} disabled={seeding}>
            <RefreshCw className={`h-3.5 w-3.5 ${seeding ? "animate-spin" : ""} me-2`} />
            {seeding ? "Seeding..." : "Seed squads"}
          </Button>
        </div>
      </header>

      <main className="container max-w-5xl py-6 space-y-6">
        <section className="rounded-xl border bg-card p-4 space-y-3">
          <label className="text-sm font-medium">Describe the project you want to build</label>
          <Textarea
            value={task} onChange={(e) => setTask(e.target.value)}
            placeholder="e.g.: Build a small e-commerce site for a coffee shop with a products page, cart, and checkout using Supabase auth"
            rows={4} className="resize-none"
          />
          <p className="text-xs text-muted-foreground">The squad works together inside the same E2B sandbox. May take a few minutes.</p>
        </section>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">{[1, 2].map((i) => <Skeleton key={i} className="h-48" />)}</div>
        ) : squads.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center">
            <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm mb-4">No squads available. Click "Seed squads" to set up the default Full-Stack Builder team.</p>
            <Button onClick={seed} disabled={seeding}>Seed Full-Stack squad</Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {squads.map((s) => (
              <article key={s.id} className="rounded-xl border bg-card p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{s.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {s.agent_slugs.map((slug) => {
                    const Icon = ROLE_ICONS[slug] || Users;
                    return (
                      <span key={slug} className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-[11px]">
                        <Icon className="h-3 w-3" />
                        {slug.replace("sq-", "")}
                      </span>
                    );
                  })}
                </div>
                <Button className="w-full" onClick={() => runSquad(s)} disabled={!!running}>
                  <Play className="h-3.5 w-3.5 me-2" />
                  {running === s.id ? "Starting..." : "Run squad"}
                </Button>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
