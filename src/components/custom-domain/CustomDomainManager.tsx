import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Globe, Trash2, RefreshCw, Copy, CheckCircle2, AlertCircle, Clock, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface DomainRecord {
  id: string;
  project_id: string;
  domain: string;
  verification_status: string;
  ssl_status: string | null;
  error_message: string | null;
  verification_records: Array<{ type: string; name: string; value: string; purpose?: string }>;
  last_checked_at: string | null;
  created_at: string;
}

interface Props {
  projectId?: string; // if provided, scoped to single project
  showProjectColumn?: boolean;
}

export function CustomDomainManager({ projectId, showProjectColumn = false }: Props) {
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [fallback, setFallback] = useState<string>("app.Megsy.site");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const invoke = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke("manage-custom-domain", {
      body: { action, ...payload },
    });
    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error || "Operation failed");
    return data;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invoke("list", projectId ? { projectId } : {});
      setDomains(data.domains || []);
      if (data.fallback) setFallback(data.fallback);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [invoke, projectId]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!projectId) { toast.error("Select first project"); return; }
    if (!newDomain.trim()) return;
    setAdding(true);
    try {
      await invoke("add", { domain: newDomain.trim(), projectId });
      toast.success("Domain added! Follow the DNS instructions");
      setNewDomain("");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const handleVerify = async (id: string) => {
    setVerifyingId(id);
    try {
      const r = await invoke("verify", { domainId: id });
      toast.success(`Status: ${r.status}`);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Are you sure you want to delete the domain?")) return;
    try {
      await invoke("remove", { domainId: id });
      toast.success("Deleted");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  const statusBadge = (status: string) => {
    if (status === "active") return <Badge className="bg-green-500/15 text-green-600 border-green-500/30 hover:bg-green-500/20"><CheckCircle2 className="w-3 h-3 me-1" />Active</Badge>;
    if (status === "failed") return <Badge variant="destructive"><AlertCircle className="w-3 h-3 me-1" />Failed</Badge>;
    return <Badge variant="secondary"><Clock className="w-3 h-3 me-1" />Verifying</Badge>;
  };

  return (
    <div className="space-y-6">
      {projectId && (
        <Card className="p-5 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Add custom domain</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Connect your own domain (e.g. <code className="px-1.5 py-0.5 rounded bg-muted">mysite.com</code>) to your project. You'll need to add a CNAME record in the DNS settings at your domain provider.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="example.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              disabled={adding}
              dir="ltr"
              className="text-left"
            />
            <Button onClick={handleAdd} disabled={adding || !newDomain.trim()}>
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : domains.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <Globe className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No custom domains yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {domains.map((d) => (
            <Card key={d.id} className="p-5">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-primary" />
                  <div>
                    <a href={`https://${d.domain}`} target="_blank" rel="noreferrer" className="font-semibold hover:underline flex items-center gap-1" dir="ltr">
                      {d.domain}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {d.last_checked_at && (
                      <p className="text-xs text-muted-foreground mt-0.5">Last check: {new Date(d.last_checked_at).toLocaleString("ar-EG")}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(d.verification_status)}
                  <Button size="sm" variant="ghost" onClick={() => handleVerify(d.id)} disabled={verifyingId === d.id}>
                    {verifyingId === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleRemove(d.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {d.error_message && (
                <div className="text-sm text-destructive bg-destructive/10 rounded-md p-3 mb-3">
                  {d.error_message}
                </div>
              )}

              {d.verification_status !== "active" && d.verification_records?.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium mb-2">📋 Add DNS records to your domain provider:</p>
                  {d.verification_records.map((rec, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 text-xs items-center bg-background rounded p-2">
                      <Badge variant="outline" className="col-span-2 justify-center">{rec.type}</Badge>
                      <code className="col-span-4 truncate" dir="ltr">{rec.name}</code>
                      <code className="col-span-5 truncate text-muted-foreground" dir="ltr">{rec.value}</code>
                      <Button size="sm" variant="ghost" className="col-span-1 h-7 w-7 p-0" onClick={() => copy(rec.value)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground mt-2">
                    ⏱️ DNS propagation Can take from minutes to 24 hours. Press 🔄 to verify.
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Card className="p-4 bg-muted/30 border-dashed">
        <p className="text-xs text-muted-foreground">
          💡 The domain will point to <code className="px-1.5 py-0.5 rounded bg-background" dir="ltr">{fallback}</code> via CNAME. Certificate SSL is enabled automatically from Cloudflare.
        </p>
      </Card>
    </div>
  );
}
