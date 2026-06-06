// @ts-nocheck — imported design from external repo; backend wiring deferred.
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, Power } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Connector state lives in user_connector_state (DB). No localStorage.
async function readEnabledFromDB(): Promise<Record<string, boolean>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};
  const { data } = await supabase
    .from("user_connector_state")
    .select("connector_id, enabled")
    .eq("user_id", user.id);
  const out: Record<string, boolean> = {};
  for (const r of (data as any[]) ?? []) out[r.connector_id] = !!r.enabled;
  return out;
}
async function writeEnabledToDB(connectorId: string, enabled: boolean) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("user_connector_state").upsert(
    { user_id: user.id, connector_id: connectorId, enabled, updated_at: new Date().toISOString() } as any,
    { onConflict: "user_id,connector_id" }
  );
  try { window.dispatchEvent(new CustomEvent("connectors:changed")); } catch { /* noop */ }
}

interface Connector {
  id: string;
  name: string;
  short: string;
  enabled: boolean;
  iconUrl: string;
  iconBg: string;
  overview: string;
  features: { title: string; desc: string }[];
  useCases: { title: string; desc: string }[];
  docsUrl: string;
}

const CONNECTORS: Connector[] = [
  {
    id: "supabase",
    name: "Supabase",
    short: "Connect your Supabase project",
    enabled: true,
    iconUrl: "https://cdn.simpleicons.org/supabase/3ECF8E",
    iconBg: "bg-[#1F1F1F]",
    overview: "Integrate user authentication, data storage, and full backend capabilities.",
    features: [
      { title: "Database (PostgreSQL)", desc: "Store and query your app data with full SQL support. The assistant generates tables and schema from prompts automatically." },
      { title: "User Authentication", desc: "Secure management of sign-in, sign-up, and permissions. Add ready-made flows (Email/Password and others) with a single prompt." },
      { title: "File Storage", desc: "Upload and serve images and files via Supabase Storage — suitable for profiles and media." },
      { title: "Real-time Updates", desc: "Stream data changes instantly to enable live chat and team collaboration." },
      { title: "Edge Functions", desc: "Run custom backend logic (TypeScript) on Supabase infrastructure for email, payments, or connecting external APIs." },
    ],
    useCases: [
      { title: "SaaS apps", desc: "Quickly build multi-user platforms." },
      { title: "Social apps", desc: "Feed, comments, real-time notifications." },
      { title: "Dashboards", desc: "Real-time data for business and management." },
      { title: "MVP projects", desc: "Launch your idea with minimal setup time." },
    ],
    docsUrl: "https://docs.lovable.dev/integrations/supabase",
  },
  {
    id: "github",
    name: "GitHub",
    short: "Sync your project with a Git repository",
    enabled: true,
    iconUrl: "https://cdn.simpleicons.org/github/ffffff",
    iconBg: "bg-[#0D1117]",
    overview: "Automatically sync your project code with a GitHub repository for broader collaboration and better version safety.",
    features: [
      { title: "Two-way Sync", desc: "Lovable changes are pushed to GitHub automatically, and GitHub changes are reflected back in the project." },
      { title: "Branches & PRs", desc: "Work on separate branches and review code via Pull Requests before merging." },
      { title: "Version History", desc: "Every commit is saved — easily restore any previous version." },
      { title: "CI/CD Friendly", desc: "Connect GitHub Actions or any pipeline to test and deploy code." },
    ],
    useCases: [
      { title: "Development teams", desc: "Multiple developers collaborating on the same project." },
      { title: "Open Source", desc: "Open your code to public contributors." },
      { title: "Backups", desc: "Keep a full reference of every change in your project." },
      { title: "Custom deployment", desc: "Connect deployment to platforms like Vercel or Netlify." },
    ],
    docsUrl: "https://docs.lovable.dev/integrations/github-integration",
  },
];

export default function ConnectorsSheet({ onClose }: { onClose: () => void }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = CONNECTORS.find((c) => c.id === activeId) || null;
  const [mounted, setMounted] = useState(false);
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>(() => {
    // Defaults until DB hydrates.
    const out: Record<string, boolean> = {};
    for (const c of CONNECTORS) out[c.id] = c.enabled;
    return out;
  });

  // Hydrate from DB on mount.
  useEffect(() => {
    let cancelled = false;
    readEnabledFromDB().then((stored) => {
      if (cancelled) return;
      setEnabledMap((prev) => {
        const out = { ...prev };
        for (const c of CONNECTORS) if (c.id in stored) out[c.id] = stored[c.id];
        return out;
      });
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, [enabledMap]);

  useEffect(() => {
    const onChange = () => {
      readEnabledFromDB().then((stored) => {
        setEnabledMap((prev) => {
          const out: Record<string, boolean> = { ...prev };
          for (const c of CONNECTORS) if (c.id in stored) out[c.id] = stored[c.id];
          return out;
        });
      });
    };
    window.addEventListener("connectors:changed", onChange);
    return () => {
      window.removeEventListener("connectors:changed", onChange);
    };
  }, []);

  const toggleEnabled = useCallback(async (id: string) => {
    const c = CONNECTORS.find((x) => x.id === id);
    if (enabledMap[id]) {
      const next = { ...enabledMap, [id]: false };
      setEnabledMap(next);
      await writeEnabledToDB(id, false);
      toast.success(`${c?.name ?? "Integration"} disabled for workspace`);
      return;
    }
    const fnName = id === "github" ? "github-push" : "supabase-link-manager";
    const { data, error } = await supabase.functions.invoke(fnName, { body: { action: "status" } });
    if (error || data?.error || !data?.connected) {
      toast.error(data?.error || `${c?.name ?? "Integration"} backend token is not configured`);
      return;
    }
    const next = { ...enabledMap, [id]: true };
    setEnabledMap(next);
    await writeEnabledToDB(id, true);
    toast.success(`${c?.name ?? "Integration"} backend integration is active`);
  }, [enabledMap]);

  function handleClose() {
    setMounted(false);
    setTimeout(onClose, 200);
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/40 transition-opacity duration-200"
        style={{ opacity: mounted ? 1 : 0 }}
        onClick={handleClose}
      />
      <div
        className="fixed inset-x-0 bottom-0 z-[101] max-h-[88vh] rounded-t-3xl backdrop-blur-2xl backdrop-saturate-150 border-t border-foreground/10 shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col transition-transform duration-200 ease-out"
        style={{
          transform: mounted ? "translateY(0)" : "translateY(100%)",
          background: "color-mix(in oklab, hsl(var(--background)) 70%, transparent)",
        }}
      >
        {/* Grabber */}
        <div className="pt-2.5 pb-1 grid place-items-center shrink-0">
          <span className="w-10 h-1.5 rounded-full bg-foreground/15" />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-3 shrink-0 border-b border-foreground/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[15px] font-semibold min-w-0">
              {active ? (
                <>
                  <button
                    onClick={() => setActiveId(null)}
                    aria-label="Back"
                    className="w-7 h-7 grid place-items-center rounded-full hover:bg-foreground/5 -ms-1 shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="truncate">{active.name}</span>
                </>
              ) : (
                <span>Integrations</span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {!active ? (
            <ListView
              connectors={CONNECTORS}
              enabledMap={enabledMap}
              onSelect={(id) => setActiveId(id)}
            />
          ) : (
            <DetailView
              connector={active}
              enabled={enabledMap[active.id] ?? active.enabled}
              onToggle={() => toggleEnabled(active.id)}
            />
          )}
        </div>
      </div>
    </>
  );
}

function BrandIcon({ url, bg, name }: { url: string; bg: string; name: string }) {
  return (
    <div className={`w-11 h-11 rounded-xl grid place-items-center ${bg}`}>
      <img src={url} alt={name} className="w-6 h-6" loading="lazy" />
    </div>
  );
}

function ListView({
  connectors,
  enabledMap,
  onSelect,
}: {
  connectors: Connector[];
  enabledMap: Record<string, boolean>;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-5">
      <section>
        <p className="text-[13px] text-muted-foreground mb-3 leading-relaxed">
          Add capabilities to your apps. Configured once and available to all workspace members.
        </p>
        <div className="space-y-2">
          {connectors.map((c) => {
            const on = enabledMap[c.id] ?? c.enabled;
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className="w-full flex items-center gap-3 rounded-2xl backdrop-blur-2xl backdrop-saturate-150 border border-foreground/10 hover:border-foreground/20 transition px-3.5 py-3 text-start shadow-[0_4px_16px_-8px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_16px_-8px_rgba(0,0,0,0.5)]"
                style={{ background: "color-mix(in oklab, hsl(var(--background)) 55%, transparent)" }}
              >
                <BrandIcon url={c.iconUrl} bg={c.iconBg} name={c.name} />
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold truncate">{c.name}</div>
                  <div className="text-[12.5px] text-muted-foreground truncate">{c.short}</div>
                </div>
                <span
                  className={`shrink-0 text-[11px] font-medium px-2 py-1 rounded-full border ${
                    on
                      ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                      : "text-muted-foreground border-foreground/15 bg-foreground/[0.04]"
                  }`}
                >
                  {on ? "Enabled" : "Disabled"}
                </span>
              </button>
            );
          })}
        </div>
      </section>
      <p className="text-[12px] text-muted-foreground text-center pt-2">
        More integrations coming soon
      </p>
    </div>
  );
}

function DetailView({
  connector,
  enabled,
  onToggle,
}: {
  connector: Connector;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Status card */}
      <div
        className="rounded-2xl backdrop-blur-2xl backdrop-saturate-150 border border-foreground/10 p-4 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)]"
        style={{ background: "color-mix(in oklab, hsl(var(--background)) 55%, transparent)" }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-12 h-12 rounded-xl grid place-items-center ${connector.iconBg}`}>
            <img src={connector.iconUrl} alt={connector.name} className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[16px] font-semibold">{connector.name}</div>
            <div
              className={`flex items-center gap-1.5 text-[12.5px] mt-0.5 ${
                enabled ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${enabled ? "bg-emerald-500" : "bg-foreground/30"}`} />
              <span>{enabled ? "Enabled" : "Disabled"}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onToggle}
            className="h-10 rounded-xl backdrop-blur-2xl border border-foreground/10 hover:border-foreground/20 text-[13.5px] font-medium transition inline-flex items-center justify-center gap-1.5"
            style={{ background: "color-mix(in oklab, hsl(var(--background)) 45%, transparent)" }}
          >
            <Power className="w-3.5 h-3.5" />
            {enabled ? "Disable" : "Enable"}
          </button>
          <button
            type="button"
            onClick={() => toast.success(`${connector.name} runs through backend integration`)}
            className="h-10 rounded-xl backdrop-blur-2xl border border-foreground/10 hover:border-foreground/20 text-[13.5px] font-medium transition inline-flex items-center justify-center gap-1.5"
            style={{ background: "color-mix(in oklab, hsl(var(--background)) 45%, transparent)" }}
          >
            <Power className="w-3.5 h-3.5" />
            Backend
          </button>
        </div>
      </div>

      {/* Overview */}
      <section>
        <h3 className="text-[16px] font-semibold mb-2">Overview</h3>
        <p className="text-[13.5px] text-muted-foreground leading-relaxed">{connector.overview}</p>
      </section>

      {/* Key features */}
      <section>
        <h3 className="text-[16px] font-semibold mb-3">Key features</h3>
        <ul className="space-y-3">
          {connector.features.map((f) => (
            <li key={f.title} className="flex gap-3">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-foreground/40 shrink-0" />
              <div className="flex-1">
                <div className="text-[14px] font-semibold">{f.title}</div>
                <div className="text-[13px] text-muted-foreground leading-relaxed mt-0.5">{f.desc}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Use cases */}
      <section>
        <h3 className="text-[16px] font-semibold mb-3">Use cases</h3>
        <ul className="space-y-3">
          {connector.useCases.map((u) => (
            <li key={u.title} className="flex gap-3">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-foreground/40 shrink-0" />
              <div className="flex-1">
                <span className="text-[14px] font-semibold">{u.title}</span>
                <span className="text-[13px] text-muted-foreground leading-relaxed">: {u.desc}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

    </div>
  );
}
