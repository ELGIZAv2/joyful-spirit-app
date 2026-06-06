import { useEffect, useState } from "react";
import { Check, Loader2, Search } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const SupabaseIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
    <path d="M13.976 22.654c-.62.781-1.879.353-1.893-.643l-.205-14.575h9.798c1.775 0 2.765 2.05 1.66 3.438L13.976 22.654z" fill="#3ECF8E"/>
    <path d="M10.024 1.346c.62-.781 1.879-.353 1.893.643l.09 14.575H2.331c-1.775 0-2.765-2.05-1.66-3.438L10.024 1.346z" fill="#3ECF8E" fillOpacity="0.6"/>
  </svg>
);

const connectors = [
  {
    id: "github",
    name: "GitHub",
    description: "Connect your repositories to read code and manage tasks.",
    icon: GitHubIcon,
    category: "Development",
  },
  {
    id: "supabase",
    name: "Supabase",
    description: "Connect your Supabase project to manage data and auth.",
    icon: SupabaseIcon,
    category: "Backend",
  },
];

interface ConnectorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateIntegrations: () => void;
}

const ConnectorsDialog = ({ open, onOpenChange, onNavigateIntegrations }: ConnectorsDialogProps) => {
  const [search, setSearch] = useState("");
  const [loadingConnector, setLoadingConnector] = useState<string | null>(null);
  const [connectedMap, setConnectedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) return;
    void loadConnections();
  }, [open]);

  const loadConnections = async () => {
    const [githubStatus, supabaseStatus] = await Promise.all([
      supabase.functions.invoke("github-push", { body: { action: "status" } }),
      supabase.functions.invoke("supabase-link-manager", { body: { action: "status" } }),
    ]);
    setConnectedMap({
      github: !githubStatus.error && !!githubStatus.data?.connected,
      supabase: !supabaseStatus.error && !!supabaseStatus.data?.connected,
    });
  };

  const filtered = connectors.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleConnect = async (c: typeof connectors[number]) => {
    setLoadingConnector(c.id);
    const popup = window.open("about:blank", `${c.id}-oauth`, "width=600,height=750");
    try {
      const fnName = c.id === "github" ? "github-push" : "supabase-link-manager";
      const startFn = c.id === "github" ? "oauth-github-connect" : "supabase-oauth-start";
      const { data: status } = await supabase.functions.invoke(fnName, { body: { action: "status" } });
      if (status?.connected) {
        if (popup && !popup.closed) popup.close();
        setConnectedMap((prev) => ({ ...prev, [c.id]: true }));
        toast.success(`${c.name} already connected`);
        setLoadingConnector(null);
        return;
      }

      const { data, error } = await supabase.functions.invoke(startFn, { body: { redirect_to: window.location.href } });
      if (error || data?.error || !data?.authorize_url) throw new Error(data?.error || error?.message || `${c.name} OAuth not configured`);
      if (!popup) throw new Error("Allow popups to complete the connection");
      popup.location.href = data.authorize_url;

      const listener = async (ev: MessageEvent) => {
        if (ev.data?.type !== `${c.id}-oauth`) return;
        window.removeEventListener("message", listener);
        window.clearInterval(poll);
        if (ev.data?.ok === false) {
          toast.error(ev.data?.message || `Failed to connect ${c.name}`);
        } else {
          await loadConnections();
          toast.success(`${c.name} connected successfully`);
        }
        setLoadingConnector(null);
      };
      window.addEventListener("message", listener);
      const poll = window.setInterval(async () => {
        if (!popup.closed) return;
        window.clearInterval(poll);
        window.removeEventListener("message", listener);
        await loadConnections();
        setLoadingConnector(null);
      }, 1200);
    } catch (err) {
      if (popup && !popup.closed) popup.close();
      toast.error(err instanceof Error ? err.message : `Failed to start ${c.name}`);
      setLoadingConnector(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">Connectors</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Connect GitHub and Supabase via the same OAuth flow used on the integrations page.
            </p>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-secondary/30 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
              />
            </div>
            <button
              onClick={() => { onOpenChange(false); onNavigateIntegrations(); }}
              className="px-3 py-2 rounded-lg border border-border bg-secondary/30 text-sm text-foreground hover:bg-accent transition-colors whitespace-nowrap"
            >
              Manage integrations
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((connector) => (
              
              <button
                key={connector.id}
                onClick={() => handleConnect(connector)}
                disabled={loadingConnector === connector.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-secondary/40 transition-colors text-left group"
              >
                <div className="shrink-0">
                  <connector.icon />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{connector.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{connector.description}</p>
                </div>
                {loadingConnector === connector.id ? (
                  <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
                ) : connectedMap[connector.id] ? (
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <span className="text-[11px] text-muted-foreground/70 shrink-0">Connect</span>
                )}
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No results
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectorsDialog;
