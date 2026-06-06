// @ts-nocheck — imported design from external repo; backend wiring deferred.
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft, Database, Cloud as CloudIcon, KeyRound,
  Users as UsersIcon, Loader2, HelpCircle, Plus, Check, RefreshCw, Link2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProjectRow {
  id: string;
  name: string;
  linked_supabase_project_ref: string | null;
  linked_supabase_project_name: string | null;
  linked_supabase_url: string | null;
}

interface SupaProject { id: string; name: string; region?: string; ref?: string }

const POST_LINK_USER_MSG =
  "I have connected my Supabase account. Let's get to work.";

const POST_LINK_AI_MSG = `Your account has been successfully linked to Supabase ✅

Now I can do a lot for your project directly:

- 🗄️ Create and edit databases (tables, indexes, relations).
- 🔐 Set up authentication and sign-in (Email, Google, Apple…).
- 🛡️ Write RLS policies to protect each user's data.
- ⚡ Write Edge Functions to run any server-side logic.
- 📦 Upload and store files in Storage.
- 🔑 Manage secrets (API keys) safely without exposing them to users.
- 🔄 Run SQL queries directly against your project.

Ask for anything — for example: "Build a tasks table with sign-in", "Add Google Auth",
"Make me a real-time chat", and I will do it instantly.`;

export default function MegsyPrCloudPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [projects, setProjects] = useState<SupaProject[] | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [linkingRef, setLinkingRef] = useState<string | null>(null);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  // Initial load
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      const { data: p } = await supabase
        .from("projects")
        .select("id,name,linked_supabase_project_ref,linked_supabase_project_name,linked_supabase_url")
        .eq("id", projectId)
        .maybeSingle();
      if (p) setProject(p as ProjectRow);

      const { data: status } = await supabase.functions.invoke("supabase-link-manager", {
        body: { action: "status" },
      });
      const isConn = !!status?.connected;
      setConnected(isConn);
      if (isConn && !p?.linked_supabase_project_ref) {
        await loadProjects();
      }
    })();
     
  }, [projectId]);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const { data, error } = await supabase.functions.invoke("supabase-link-manager", {
        body: { action: "list_projects" },
      });
      if (error || data?.error) {
        toast.error("Failed to fetch project list");
        return false;
      }
      const list = (data?.projects || []) as any[];
      const norm: SupaProject[] = list.map((p) => ({
        id: p.id ?? p.ref ?? p.name,
        name: p.name,
        region: p.region,
        ref: p.ref ?? p.id,
      }));
      setProjects(norm);
      return true;
    } finally {
      setLoadingProjects(false);
    }
  };

  const startConnect = async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("supabase-link-manager", {
        body: { action: "status" },
      });
      if (error || data?.error) throw new Error(data?.error || "Connection failed");
      if (!data?.connected) throw new Error("Supabase backend token is not configured");
      setConnected(true);
      await loadProjects();
      toast.success("Supabase backend integration is active");
    } catch (e: any) {
      toast.error(e?.message || "Connection failed");
      setConnecting(false);
    }
  };

  const linkProject = async (sp: SupaProject) => {
    if (!projectId || !sp.ref) return;
    setLinkingRef(sp.ref);
    try {
      const { data, error } = await supabase.functions.invoke("supabase-link-manager", {
        body: { action: "link_project", project_id: projectId, ref: sp.ref, name: sp.name },
      });
      if (error || data?.error) {
        toast.error(data?.error || "Could not link the project");
        return;
      }
      // Insert the user + assistant chat messages
      await supabase.from("ai_project_messages").insert([
        { project_id: projectId, role: "user", content: POST_LINK_USER_MSG },
        { project_id: projectId, role: "assistant", content: POST_LINK_AI_MSG },
      ]);
      // Refresh local project info
      const { data: p } = await supabase
        .from("projects")
        .select("id,name,linked_supabase_project_ref,linked_supabase_project_name,linked_supabase_url")
        .eq("id", projectId)
        .maybeSingle();
      if (p) setProject(p as ProjectRow);
      toast.success("Project linked");
      navigate(`/build/${projectId}/chat`);
    } finally {
      setLinkingRef(null);
    }
  };

  const unlinkProject = async () => {
    if (!projectId) return;
    if (!confirm("Unlink this project from Supabase?")) return;
    const { error } = await supabase.functions.invoke("supabase-link-manager", {
      body: { action: "unlink_project", project_id: projectId },
    });
    if (error) { toast.error("Failed to unlink"); return; }
    setProject((p) => p ? { ...p, linked_supabase_project_ref: null, linked_supabase_project_name: null, linked_supabase_url: null } : p);
    toast.success("Unlinked");
    await loadProjects();
  };

  const disconnectAccount = async () => {
    if (!confirm("Sign out from your Supabase account?")) return;
    setDisconnecting(true);
    try {
      await supabase.functions.invoke("supabase-link-manager", { body: { action: "disconnect" } });
      setConnected(false);
      setProjects(null);
      toast.success("Account disconnected");
    } finally {
      setDisconnecting(false);
    }
  };

  const linked = !!project?.linked_supabase_project_ref;

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-background text-foreground">
      {/* Floating glass back button */}
      <button
        onClick={() => navigate(`/build/${projectId}/chat`)}
        aria-label="Back"
        className="fixed top-4 start-4 z-50 w-11 h-11 rounded-full grid place-items-center backdrop-blur-2xl backdrop-saturate-150 border border-foreground/10 shadow-[0_4px_16px_-6px_rgba(0,0,0,0.18)] dark:shadow-[0_4px_16px_-6px_rgba(0,0,0,0.6)] transition"
        style={{ backgroundColor: "color-mix(in oklab, hsl(var(--background)) 55%, transparent)" }}
      >
        <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
      </button>

      <div className="flex-1 overflow-y-auto px-4 pt-20 pb-10">
        <div className="max-w-2xl mx-auto">
          {/* Page intro */}
          <div className="mb-6 text-center">
            <h1 className="text-[22px] font-bold tracking-tight">Cloud</h1>
            <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">
              Connect Supabase to your project to enable a database, authentication, file storage, and Edge Functions — all managed directly from this page.
            </p>
          </div>

          {/* === LINKED state — like screenshot === */}
          {linked && (
            <section
              className="rounded-2xl backdrop-blur-2xl backdrop-saturate-150 border border-foreground/10 p-5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)]"
              style={{ backgroundColor: "color-mix(in oklab, hsl(var(--background)) 55%, transparent)" }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold tracking-tight">Supabase</h2>
                  <p className="text-[14px] text-muted-foreground mt-1">Manage your Supabase project</p>
                </div>
                <span className="px-2.5 py-1 rounded-md text-[12px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Connected
                </span>
              </div>

              <ul className="mt-5 space-y-1">
                <CloudRow icon={<SupaLogo />} label={project?.linked_supabase_project_name || "Supabase Project"} />
                <CloudRow
                  icon={<UsersIcon className="w-5 h-5" strokeWidth={1.7} />}
                  label="User management"
                />
                <CloudRow
                  icon={<Database className="w-5 h-5" strokeWidth={1.7} />}
                  label="SQL editor"
                />
                <CloudRow
                  icon={<CloudIcon className="w-5 h-5" strokeWidth={1.7} />}
                  label="Edge Functions"
                />
                <CloudRow
                  icon={<KeyRound className="w-5 h-5" strokeWidth={1.7} />}
                  label="Manage secrets"
                />
              </ul>

              <div className="mt-6 flex items-center justify-between">
                <button
                  className="w-9 h-9 grid place-items-center rounded-full hover:bg-foreground/[0.05] text-muted-foreground"
                  title="Help"
                >
                  <HelpCircle className="w-5 h-5" strokeWidth={1.7} />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={unlinkProject}
                    className="h-10 px-4 rounded-full backdrop-blur-2xl border border-foreground/10 text-[13.5px] font-medium hover:bg-foreground/[0.06] transition"
                    style={{ backgroundColor: "color-mix(in oklab, hsl(var(--background)) 55%, transparent)" }}
                  >
                    Unlink
                  </button>
                  <button
                    type="button"
                    onClick={loadProjects}
                    className="h-10 px-4 rounded-full backdrop-blur-2xl border border-foreground/10 text-[13.5px] font-medium hover:bg-foreground/[0.06] flex items-center transition"
                    style={{ backgroundColor: "color-mix(in oklab, hsl(var(--background)) 55%, transparent)" }}
                  >
                    Refresh projects
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* === CONNECTED but no project linked yet === */}
          {!linked && connected && (
            <section
              className="rounded-2xl backdrop-blur-2xl backdrop-saturate-150 border border-foreground/10 p-5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)]"
              style={{ backgroundColor: "color-mix(in oklab, hsl(var(--background)) 55%, transparent)" }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold tracking-tight">Choose a Supabase project</h2>
                  <p className="text-[14px] text-muted-foreground mt-1">
                    Pick a project to link to this app
                  </p>
                </div>
                <button
                  onClick={loadProjects}
                  className="w-9 h-9 grid place-items-center rounded-full hover:bg-foreground/[0.05]"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingProjects ? "animate-spin" : ""}`} />
                </button>
              </div>

              <div className="mt-5">
                {loadingProjects && projects === null ? (
                  <div className="py-8 grid place-items-center text-sm text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mb-2" />
                    Loading projects…
                  </div>
                ) : projects && projects.length > 0 ? (
                  <ul className="space-y-1.5">
                    {projects.map((p) => {
                      const sel = selectedRef === p.ref;
                      return (
                        <li key={p.id}>
                          <button
                            onClick={() => setSelectedRef(p.ref ?? null)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl backdrop-blur-2xl border text-start transition ${
                              sel
                                ? "border-primary/40"
                                : "border-foreground/10 hover:bg-foreground/[0.05]"
                            }`}
                            style={{ backgroundColor: sel
                              ? "color-mix(in oklab, hsl(var(--primary)) 12%, transparent)"
                              : "color-mix(in oklab, hsl(var(--background)) 55%, transparent)" }}
                          >
                            <SupaLogo />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[14.5px] truncate">{p.name}</p>
                              {p.region && (
                                <p className="text-[11.5px] text-muted-foreground truncate">{p.region}</p>
                              )}
                            </div>
                            {sel && <Check className="w-4 h-4 text-primary" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No projects found in your account
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={loadProjects}
                  className="h-10 px-4 rounded-full backdrop-blur-2xl border border-foreground/10 text-[13.5px] font-medium hover:bg-foreground/[0.06] flex items-center gap-1.5 transition"
                  style={{ backgroundColor: "color-mix(in oklab, hsl(var(--background)) 55%, transparent)" }}
                >
                  <Plus className="w-4 h-4" /> Refresh projects
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={disconnectAccount}
                    disabled={disconnecting}
                    className="h-10 px-4 rounded-full backdrop-blur-2xl border border-foreground/10 text-[13.5px] font-medium hover:bg-foreground/[0.06] disabled:opacity-50 transition"
                    style={{ backgroundColor: "color-mix(in oklab, hsl(var(--background)) 55%, transparent)" }}
                  >
                    Sign out
                  </button>
                  <button
                    onClick={() => {
                      const sp = projects?.find((x) => x.ref === selectedRef);
                      if (sp) linkProject(sp);
                    }}
                    disabled={!selectedRef || !!linkingRef}
                    className="h-10 px-5 rounded-full backdrop-blur-2xl border border-primary/25 text-primary text-[13.5px] font-semibold disabled:opacity-40 flex items-center gap-1.5 transition"
                    style={{ backgroundColor: "color-mix(in oklab, hsl(var(--primary)) 18%, transparent)" }}
                  >
                    {linkingRef ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                    Connect
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* === NOT CONNECTED === */}
          {connected === false && (
            <section
              className="rounded-2xl backdrop-blur-2xl backdrop-saturate-150 border border-foreground/10 p-6 text-center shadow-[0_4px_20px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)]"
              style={{ backgroundColor: "color-mix(in oklab, hsl(var(--background)) 55%, transparent)" }}
            >
              <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/10 grid place-items-center">
                <SupaLogo size={32} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight mt-4">Supabase</h2>
              <p className="text-[14px] text-muted-foreground mt-1.5 leading-relaxed">
                Connect your Supabase account to enable the database, authentication, and
                Edge Functions inside your app.
              </p>
              <button
                onClick={startConnect}
                disabled={connecting}
                className="mt-5 h-11 px-6 rounded-full backdrop-blur-2xl border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[14px] font-semibold inline-flex items-center gap-2 disabled:opacity-60 transition"
                style={{ backgroundColor: "color-mix(in oklab, hsl(142 71% 45%) 22%, transparent)" }}
              >
                {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                Connect
              </button>
            </section>
          )}

          {/* loading initial status */}
          {connected === null && !linked && (
            <div className="py-16 grid place-items-center text-sm text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mb-2" />
              Loading…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CloudRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  const Inner = (
    <>
      <span className="w-7 grid place-items-center text-foreground/80 shrink-0">{icon}</span>
      <span className="flex-1 font-semibold text-[15.5px] truncate">{label}</span>
    </>
  );
  return (
    <li>
      <div className="flex items-center gap-3 px-1 py-3">{Inner}</div>
    </li>
  );
}

function SupaLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 109 113" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="#3ECF8E"/>
      <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442904 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="#3ECF8E" fillOpacity="0.6"/>
    </svg>
  );
}

