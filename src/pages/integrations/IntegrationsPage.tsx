// Integrations page — Paper & Ink editorial redesign.
// Sidebar layout. No icons or emojis anywhere — only real app brand logos.
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { integrations, INTEGRATION_CATEGORIES, type Integration } from "@/lib/integrationsData";
import IntegrationDetailModal from "@/components/integrations/IntegrationDetailModal";

type AppMeta = Record<string, any>;

// ---------- Palette (locked: Paper & Ink) ----------
const PAPER = "#f5f3ee";
const PAPER_2 = "#e8e4dd";
const INK = "#0d0d0d";
const INK_2 = "#2d2d2d";
const INK_MUTED = "#6b6b66";
const DISPLAY = "'Space Grotesk', sans-serif";
const BODY = "'DM Sans', sans-serif";

// ---------- Brand logo ----------
const FAVICON_SOURCES = (domain: string) => [
  `https://www.google.com/s2/favicons?sz=128&domain=${domain}`,
  `https://icons.duckduckgo.com/ip3/${domain}.ico`,
];

const BrandLogo = ({ integration, size = 28 }: { integration: Integration; size?: number }) => {
  const [srcIdx, setSrcIdx] = useState(0);
  const sources = integration.domain ? FAVICON_SOURCES(integration.domain) : [];
  const url = sources[srcIdx];
  if (!url) {
    return (
      <span
        style={{
          fontFamily: DISPLAY,
          fontWeight: 600,
          color: INK_2,
          fontSize: size * 0.55,
        }}
      >
        {integration.name.charAt(0)}
      </span>
    );
  }
  return (
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="object-contain"
      loading="lazy"
      onError={() => setSrcIdx((i) => i + 1)}
    />
  );
};

const LogoTile = ({ integration, size = 44 }: { integration: Integration; size?: number }) => (
  <div
    className="grid place-items-center shrink-0"
    style={{
      width: size,
      height: size,
      background: "#ffffff",
      border: `1px solid ${PAPER_2}`,
    }}
  >
    <BrandLogo integration={integration} size={Math.round(size * 0.6)} />
  </div>
);

// ---------- Page ----------
const IntegrationsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [connectedApps, setConnectedApps] = useState<Record<string, boolean>>({});
  const [appMeta, setAppMeta] = useState<Record<string, AppMeta>>({});
  const [loadingApp, setLoadingApp] = useState<string | null>(null);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [toolEnabled, setToolEnabled] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadConnections();
    loadToolSettings();
  }, []);

  const loadToolSettings = async () => {
    const { data } = await supabase.from("pipedream_tool_settings").select("app_slug, enabled");
    const map: Record<string, boolean> = {};
    for (const row of data ?? []) map[row.app_slug] = row.enabled;
    setToolEnabled(map);
  };

  const toggleTool = async (appSlug: string, next: boolean) => {
    setToolEnabled((prev) => ({ ...prev, [appSlug]: next }));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("pipedream_tool_settings").upsert(
      { user_id: user.id, app_slug: appSlug, enabled: next, updated_at: new Date().toISOString() },
      { onConflict: "user_id,app_slug" },
    );
  };

  const loadConnections = async () => {
    setIsLoadingConnections(true);
    try {
      const [github, supa, notify, cf, pd] = await Promise.all([
        supabase.functions.invoke("github-push", { body: { action: "status" } }),
        supabase.functions.invoke("supabase-link-manager", { body: { action: "status" } }),
        supabase.functions.invoke("notify-user", { body: { action: "status" } }),
        supabase.functions.invoke("check-cf-secrets", { body: {} }),
        supabase.functions.invoke("pipedream-connect", { body: { action: "list_accounts" } }),
      ]);

      const connected: Record<string, boolean> = {};
      const meta: Record<string, AppMeta> = {};

      if (!github.error && github.data?.connected) connected.github = true;
      if (!supa.error && supa.data?.connected) connected.supabase = true;

      if (!notify.error && notify.data) {
        meta.email = { ...notify.data.email };
        meta.telegram = { ...notify.data.telegram };
        if (notify.data.email?.connected) connected.email = true;
        if (notify.data.telegram?.connected) connected.telegram = true;
      }

      const cfOk = !cf.error && cf.data?.verify?.success === true;
      meta.cloudflare = { available: cfOk };
      if (cfOk) connected.cloudflare = true;

      if (!pd.error && Array.isArray(pd.data?.accounts)) {
        for (const a of pd.data.accounts) {
          const slug = a.app_slug ?? a.app?.name_slug ?? a.app?.slug;
          if (!slug) continue;
          connected[slug] = true;
          meta[slug] = {
            account_id: a.account_id ?? a.id,
            account_name: a.account_name ?? a.name,
          };
        }
      }

      setConnectedApps(connected);
      setAppMeta(meta);
    } finally {
      setIsLoadingConnections(false);
    }
  };

  const handleConnect = async (integration: Integration, form?: any) => {
    setLoadingApp(integration.id);
    try {
      if (integration.type === "pipedream" && integration.pipedreamSlug) {
        const { data, error } = await supabase.functions.invoke("pipedream-connect", {
          body: { action: "create_token" },
        });
        if (error || data?.error || !data?.connect_link_url) {
          throw new Error(data?.error || error?.message || "Pipedream not configured");
        }
        const url = `${data.connect_link_url}&app=${encodeURIComponent(integration.pipedreamSlug)}`;
        const popup = window.open(url, `pd-${integration.app}`, "width=600,height=750");
        if (!popup) throw new Error("Allow popups to complete the connection");

        await new Promise<void>((resolve) => {
          const start = Date.now();
          const timer = window.setInterval(async () => {
            if (popup.closed || Date.now() - start > 180_000) {
              window.clearInterval(timer);
              resolve();
              return;
            }
            const { data: poll } = await supabase.functions.invoke("pipedream-connect", {
              body: { action: "list_accounts" },
            });
            const found = (poll?.accounts || []).some(
              (a: any) =>
                (a.app_slug ?? a.app?.name_slug ?? a.app?.slug) === integration.pipedreamSlug,
            );
            if (found) {
              window.clearInterval(timer);
              try { popup.close(); } catch {}
              resolve();
            }
          }, 2500);
        });

        await loadConnections();
        if (connectedApps[integration.app]) toast.success(`${integration.name} connected`);
        setSelectedIntegration(null);
        return;
      }

      if (integration.app === "github" || integration.app === "supabase") {
        const popup = window.open("about:blank", `${integration.app}-oauth`, "width=600,height=750");
        try {
          const startFn =
            integration.app === "github" ? "oauth-github-connect" : "supabase-oauth-start";
          const { data, error } = await supabase.functions.invoke(startFn, {
            body: { redirect_to: window.location.href },
          });
          if (error || data?.error || !data?.authorize_url) {
            throw new Error(data?.error || error?.message || "OAuth is not configured");
          }
          if (!popup) throw new Error("Allow popups to complete the connection");
          popup.location.href = data.authorize_url;

          await new Promise<void>((resolve) => {
            const listener = (ev: MessageEvent) => {
              if (ev.data?.type !== `${integration.app}-oauth`) return;
              window.removeEventListener("message", listener);
              window.clearInterval(poll);
              resolve();
            };
            window.addEventListener("message", listener);
            const poll = window.setInterval(() => {
              if (popup.closed) {
                window.clearInterval(poll);
                window.removeEventListener("message", listener);
                resolve();
              }
            }, 1000);
          });

          await loadConnections();
          toast.success(`${integration.name} connected`);
          setSelectedIntegration(null);
        } catch (e) {
          if (popup && !popup.closed) popup.close();
          throw e;
        }
        return;
      }

      if (integration.app === "email" || integration.app === "telegram") {
        const { data, error } = await supabase.functions.invoke("notify-user", {
          body: { action: "connect", app: integration.app, ...(form || {}) },
        });
        if (error || data?.error) throw new Error(data?.error || error?.message || "Failed");
        await loadConnections();
        toast.success(`${integration.name} enabled`);
        setSelectedIntegration(null);
        return;
      }

      if (integration.app === "cloudflare") {
        toast.info("Cloudflare is configured by the server administrator.");
        return;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `${integration.name} connection failed`);
    } finally {
      setLoadingApp(null);
    }
  };

  const handleDisconnect = async (integration: Integration) => {
    setLoadingApp(integration.id);
    try {
      if (integration.type === "pipedream") {
        const accountId = appMeta[integration.app]?.account_id;
        if (accountId) {
          await supabase.functions.invoke("pipedream-connect", {
            body: { action: "delete_account", account_id: accountId },
          });
        }
      } else if (integration.app === "github") {
        await supabase.functions.invoke("github-push", { body: { action: "disconnect" } });
      } else if (integration.app === "supabase") {
        await supabase.functions.invoke("supabase-link-manager", {
          body: { action: "disconnect" },
        });
      } else if (integration.app === "email" || integration.app === "telegram") {
        await supabase.functions.invoke("notify-user", {
          body: { action: "disconnect", app: integration.app },
        });
      }
      await loadConnections();
      toast.success(`${integration.name} disconnected`);
      setSelectedIntegration(null);
    } finally {
      setLoadingApp(null);
    }
  };

  const isConnected = (app: string) => !!connectedApps[app];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return integrations.filter((i) => {
      if (activeCategory !== "All" && i.category !== activeCategory) return false;
      if (!q) return true;
      return (
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      );
    });
  }, [query, activeCategory]);

  const connectedCount = Object.keys(connectedApps).filter((k) => connectedApps[k]).length;

  // Per-category counts for sidebar
  const categoryCounts = useMemo(() => {
    const m: Record<string, number> = { All: integrations.length };
    for (const i of integrations) m[i.category] = (m[i.category] ?? 0) + 1;
    return m;
  }, []);

  // ---------- Row (list-style card) ----------
  const Row = ({ integration }: { integration: Integration }) => {
    const connected = isConnected(integration.app);
    const isPipedream = integration.type === "pipedream";
    const enabled = toolEnabled[integration.app] !== false;
    return (
      <div
        className="group flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5"
        style={{ borderBottom: `1px solid ${PAPER_2}`, background: PAPER }}
      >
        <button
          onClick={() => setSelectedIntegration(integration)}
          className="flex items-center gap-4 flex-1 text-left min-w-0"
        >
          <LogoTile integration={integration} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h3
                className="text-[15px] truncate"
                style={{ fontFamily: DISPLAY, fontWeight: 600, color: INK }}
              >
                {integration.name}
              </h3>
              {connected && (
                <span
                  className="uppercase"
                  style={{
                    fontFamily: DISPLAY,
                    fontSize: 9,
                    letterSpacing: "0.22em",
                    color: INK_MUTED,
                    borderBottom: `1px solid ${INK_2}`,
                    paddingBottom: 1,
                  }}
                >
                  Connected
                </span>
              )}
            </div>
            <p
              className="text-[13px] mt-1 line-clamp-2"
              style={{ color: INK_MUTED, fontFamily: BODY }}
            >
              {integration.description}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-3 sm:gap-5 sm:pl-4 sm:ml-auto">
          {connected && isPipedream && (
            <label
              className="flex items-center gap-2 cursor-pointer select-none"
              title="Use in chat"
            >
              <span
                className="uppercase"
                style={{
                  fontFamily: DISPLAY,
                  fontSize: 9,
                  letterSpacing: "0.22em",
                  color: INK_MUTED,
                }}
              >
                Use in chat
              </span>
              <input
                type="checkbox"
                className="sr-only peer"
                checked={enabled}
                onChange={(e) => toggleTool(integration.app, e.target.checked)}
              />
              <span
                aria-hidden
                className="relative inline-flex h-[18px] w-[34px] items-center transition-colors"
                style={{
                  background: enabled ? INK : "transparent",
                  border: `1px solid ${INK}`,
                }}
              >
                <span
                  className="inline-block h-[12px] w-[12px] transition-transform"
                  style={{
                    background: enabled ? PAPER : INK,
                    transform: enabled ? "translateX(18px)" : "translateX(2px)",
                  }}
                />
              </span>
            </label>
          )}

          <button
            onClick={() => setSelectedIntegration(integration)}
            className="px-5 py-2 text-[11px] uppercase transition-colors shrink-0"
            style={{
              fontFamily: DISPLAY,
              letterSpacing: "0.22em",
              background: connected ? "transparent" : INK,
              color: connected ? INK : PAPER,
              border: `1px solid ${INK}`,
            }}
          >
            {connected ? "Manage" : "Connect"}
          </button>
        </div>
      </div>
    );
  };

  // ---------- Sidebar ----------
  const Sidebar = () => (
    <aside
      className="hidden lg:flex flex-col shrink-0"
      style={{
        width: 280,
        background: PAPER,
        borderRight: `1px solid ${PAPER_2}`,
        minHeight: "100dvh",
      }}
    >
      <div className="px-7 pt-10 pb-8">
        <button
          onClick={() => navigate("/settings")}
          className="text-[11px] uppercase hover:opacity-60 transition-opacity"
          style={{ fontFamily: DISPLAY, letterSpacing: "0.24em", color: INK_MUTED }}
        >
          ← Settings
        </button>
        <h1
          className="mt-8 leading-[1.05]"
          style={{
            fontFamily: DISPLAY,
            fontWeight: 600,
            color: INK,
            fontSize: 34,
            letterSpacing: "-0.02em",
          }}
        >
          Integrations
        </h1>
        <p
          className="mt-3 text-[12px] uppercase"
          style={{ fontFamily: DISPLAY, letterSpacing: "0.2em", color: INK_MUTED }}
        >
          {connectedCount} / {integrations.length} Connected
        </p>
      </div>

      <nav className="px-3 pb-10 overflow-y-auto flex-1">
        <p
          className="px-4 pb-3 uppercase"
          style={{ fontFamily: DISPLAY, fontSize: 10, letterSpacing: "0.24em", color: INK_MUTED }}
        >
          Categories
        </p>
        {INTEGRATION_CATEGORIES.map((cat) => {
          const active = activeCategory === cat;
          const count = categoryCounts[cat] ?? 0;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors"
              style={{
                fontFamily: BODY,
                fontSize: 14,
                color: active ? INK : INK_2,
                background: active ? "#ffffff" : "transparent",
                borderLeft: `2px solid ${active ? INK : "transparent"}`,
                fontWeight: active ? 600 : 400,
              }}
            >
              <span>{cat}</span>
              <span
                style={{
                  fontFamily: DISPLAY,
                  fontSize: 11,
                  color: INK_MUTED,
                  letterSpacing: "0.05em",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );

  // ---------- Main content ----------
  const Main = () => (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex-1 min-w-0"
      style={{ background: PAPER, color: INK, fontFamily: BODY }}
    >
      {/* Mobile header */}
      <header
        className="lg:hidden sticky top-0 z-10 px-5 py-4 flex items-center justify-between"
        style={{ background: PAPER, borderBottom: `1px solid ${PAPER_2}` }}
      >
        <button
          onClick={() => navigate("/settings")}
          className="text-[11px] uppercase"
          style={{ fontFamily: DISPLAY, letterSpacing: "0.24em", color: INK_2 }}
        >
          ← Back
        </button>
        <span
          className="text-[11px] uppercase"
          style={{ fontFamily: DISPLAY, letterSpacing: "0.24em", color: INK }}
        >
          Integrations
        </span>
        <span style={{ width: 48 }} />
      </header>

      <div className="lg:hidden px-5 pt-7 pb-2">
        <h1
          className="leading-[1.05]"
          style={{
            fontFamily: DISPLAY,
            fontWeight: 600,
            color: INK,
            fontSize: 32,
            letterSpacing: "-0.02em",
          }}
        >
          Integrations
        </h1>
        <p
          className="mt-2 text-[11px] uppercase"
          style={{ fontFamily: DISPLAY, letterSpacing: "0.22em", color: INK_MUTED }}
        >
          {connectedCount} / {integrations.length} Connected
        </p>
      </div>

      {/* Toolbar */}
      <div
        className="sticky top-0 lg:top-0 z-[5] px-5 lg:px-10 py-5"
        style={{ background: PAPER, borderBottom: `1px solid ${PAPER_2}` }}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search integrations"
            className="flex-1 px-4 py-2.5 text-[14px] outline-none focus:border-[#0d0d0d] transition-colors"
            style={{
              background: "#ffffff",
              border: `1px solid ${PAPER_2}`,
              color: INK,
              fontFamily: BODY,
            }}
          />
          <div
            className="hidden sm:flex items-center px-4"
            style={{
              fontFamily: DISPLAY,
              fontSize: 11,
              letterSpacing: "0.22em",
              color: INK_MUTED,
            }}
          >
            <span className="uppercase">
              {filtered.length} {filtered.length === 1 ? "Result" : "Results"}
            </span>
          </div>
        </div>

        {/* Mobile category chips */}
        <div className="lg:hidden mt-4 -mx-5 px-5 overflow-x-auto flex gap-2 scrollbar-hide">
          {INTEGRATION_CATEGORIES.map((cat) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="shrink-0 px-4 py-1.5 text-[11px] uppercase whitespace-nowrap transition-colors"
                style={{
                  fontFamily: DISPLAY,
                  letterSpacing: "0.2em",
                  background: active ? INK : "transparent",
                  color: active ? PAPER : INK_2,
                  border: `1px solid ${active ? INK : PAPER_2}`,
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="px-0 lg:px-10 py-2 lg:py-6">
        {isLoadingConnections ? (
          <div
            className="text-center py-24 text-[12px] uppercase"
            style={{ fontFamily: DISPLAY, letterSpacing: "0.24em", color: INK_MUTED }}
          >
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="text-center py-24 mx-5 lg:mx-0"
            style={{ border: `1px dashed ${PAPER_2}` }}
          >
            <p
              className="uppercase text-[12px]"
              style={{ fontFamily: DISPLAY, letterSpacing: "0.24em", color: INK }}
            >
              No matches
            </p>
            <p className="text-[12px] mt-2" style={{ color: INK_MUTED }}>
              Try a different keyword or category.
            </p>
          </div>
        ) : (
          <div style={{ borderTop: `1px solid ${PAPER_2}` }}>
            {filtered.map((i) => (
              <Row key={i.id} integration={i} />
            ))}
          </div>
        )}
      </div>

      <IntegrationDetailModal
        integration={selectedIntegration}
        isConnected={selectedIntegration ? isConnected(selectedIntegration.app) : false}
        isLoading={selectedIntegration ? loadingApp === selectedIntegration.id : false}
        meta={selectedIntegration ? appMeta[selectedIntegration.app] : undefined}
        onConnect={(form) => selectedIntegration && handleConnect(selectedIntegration, form)}
        onDisconnect={() => selectedIntegration && handleDisconnect(selectedIntegration)}
        onClose={() => setSelectedIntegration(null)}
      />
    </motion.main>
  );

  return (
    <div
      className="flex w-full"
      style={{
        background: PAPER,
        color: INK,
        fontFamily: BODY,
        minHeight: "100dvh",
      }}
    >
      <Sidebar />
      <Main />
    </div>
  );
};

export default IntegrationsPage;
