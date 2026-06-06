// @ts-nocheck — imported design from external repo; backend wiring deferred.
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

type Visit = {
  id: string;
  path: string | null;
  referrer: string | null;
  ua_hash: string | null;
  country: string | null;
  device: string | null;
  created_at: string;
};

const RANGES: { id: string; label: string; days: number; bucket: "hour" | "day" }[] = [
  { id: "today",   label: "Today",        days: 1,   bucket: "hour" },
  { id: "yest",    label: "Yesterday",    days: 1,   bucket: "hour" },
  { id: "24h",     label: "Last 24 hours",days: 1,   bucket: "hour" },
  { id: "7d",      label: "Last 7 days",  days: 7,   bucket: "day" },
  { id: "14d",     label: "Last 14 days", days: 14,  bucket: "day" },
  { id: "30d",     label: "Last 30 days", days: 30,  bucket: "day" },
  { id: "90d",     label: "Last 90 days", days: 90,  bucket: "day" },
  { id: "month",   label: "This month",   days: 31,  bucket: "day" },
];

const FLAGS: Record<string, string> = {
  EG: "🇪🇬", US: "🇺🇸", SA: "🇸🇦", AE: "🇦🇪", GB: "🇬🇧", DE: "🇩🇪",
  FR: "🇫🇷", IN: "🇮🇳", BR: "🇧🇷", JP: "🇯🇵", CN: "🇨🇳", CA: "🇨🇦",
};

function rangeBounds(id: string): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now);
  let from = new Date(now);
  if (id === "today") {
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (id === "yest") {
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    to.setTime(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime());
  } else if (id === "24h") {
    from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  } else if (id === "month") {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    const r = RANGES.find((x) => x.id === id)!;
    from = new Date(now.getTime() - r.days * 24 * 60 * 60 * 1000);
  }
  return { from, to };
}

function fmtDuration(s: number) {
  if (!s || !isFinite(s)) return "0s";
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

function sourceFromReferrer(ref: string | null): string {
  if (!ref) return "Direct";
  try {
    const u = new URL(ref);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "Direct";
  }
}

export default function MegsyPrAnalyticsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [rangeId, setRangeId] = useState("7d");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [metric, setMetric] = useState<"visitors" | "pageviews">("visitors");

  const range = RANGES.find((r) => r.id === rangeId)!;
  const bounds = useMemo(() => rangeBounds(rangeId), [rangeId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!projectId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("project_visits")
        .select("id, path, referrer, ua_hash, country, device, created_at")
        .eq("project_id", projectId)
        .gte("created_at", bounds.from.toISOString())
        .lte("created_at", bounds.to.toISOString())
        .order("created_at", { ascending: true })
        .limit(10000);
      if (!alive) return;
      if (error) console.error(error);
      setVisits((data as Visit[]) || []);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [projectId, bounds.from.getTime(), bounds.to.getTime()]);

  // Sessions: (ua_hash, day) groups
  const sessions = useMemo(() => {
    const m = new Map<string, Visit[]>();
    for (const v of visits) {
      const day = v.created_at.slice(0, 10);
      const key = `${v.ua_hash || "?"}|${day}`;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(v);
    }
    return Array.from(m.values());
  }, [visits]);

  const visitors = useMemo(() => new Set(visits.map((v) => v.ua_hash || "?")).size, [visits]);
  const pageviews = visits.length;
  const viewsPerVisit = sessions.length ? +(pageviews / sessions.length).toFixed(1) : 0;
  const visitDuration = useMemo(() => {
    const ds = sessions
      .filter((s) => s.length > 1)
      .map((s) => (new Date(s[s.length - 1].created_at).getTime() - new Date(s[0].created_at).getTime()) / 1000);
    if (!ds.length) return 0;
    return ds.reduce((a, b) => a + b, 0) / ds.length;
  }, [sessions]);
  const bounce = sessions.length
    ? Math.round((sessions.filter((s) => s.length === 1).length / sessions.length) * 100)
    : 0;

  // Time series
  const series = useMemo(() => {
    const buckets = new Map<string, { date: string; visitors: Set<string>; pageviews: number; ts: number }>();
    const stepMs = range.bucket === "hour" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const startMs = range.bucket === "hour"
      ? Math.floor(bounds.from.getTime() / stepMs) * stepMs
      : new Date(bounds.from.getFullYear(), bounds.from.getMonth(), bounds.from.getDate()).getTime();
    for (let t = startMs; t <= bounds.to.getTime(); t += stepMs) {
      const d = new Date(t);
      const label = range.bucket === "hour"
        ? `${d.getHours()}:00`
        : d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
      buckets.set(String(t), { date: label, visitors: new Set(), pageviews: 0, ts: t });
    }
    for (const v of visits) {
      const t = new Date(v.created_at).getTime();
      const k = String(Math.floor(t / stepMs) * stepMs);
      const b = buckets.get(k);
      if (b) {
        b.visitors.add(v.ua_hash || "?");
        b.pageviews += 1;
      }
    }
    return Array.from(buckets.values()).sort((a, b) => a.ts - b.ts).map((b) => ({
      date: b.date, visitors: b.visitors.size, pageviews: b.pageviews,
    }));
  }, [visits, bounds.from.getTime(), bounds.to.getTime(), range.bucket]);

  const topBy = (key: (v: Visit) => string | null) => {
    const m = new Map<string, Set<string>>();
    for (const v of visits) {
      const k = key(v);
      if (!k) continue;
      if (!m.has(k)) m.set(k, new Set());
      m.get(k)!.add(v.ua_hash || "?");
    }
    return Array.from(m.entries())
      .map(([k, s]) => ({ key: k, count: s.size }))
      .sort((a, b) => b.count - a.count);
  };

  const topSources  = useMemo(() => topBy((v) => sourceFromReferrer(v.referrer)), [visits]);
  const topPages    = useMemo(() => topBy((v) => v.path || "/"), [visits]);
  const topCountries= useMemo(() => topBy((v) => v.country), [visits]);
  const topDevices  = useMemo(() => {
    const list = topBy((v) => v.device || "Unknown");
    const total = list.reduce((a, b) => a + b.count, 0) || 1;
    return list.map((d) => ({ ...d, pct: (d.count / total) * 100 }));
  }, [visits]);

  return (
    <div dir="ltr" className="min-h-screen bg-background text-foreground">
      {/* Floating glass back button */}
      <button
        onClick={() => navigate(-1)}
        aria-label="Back"
        className="fixed top-4 left-4 z-50 w-11 h-11 rounded-full grid place-items-center backdrop-blur-2xl backdrop-saturate-150 border border-foreground/10 shadow-[0_4px_16px_-6px_rgba(0,0,0,0.18)] dark:shadow-[0_4px_16px_-6px_rgba(0,0,0,0.6)] transition"
        style={{ backgroundColor: "color-mix(in oklab, hsl(var(--background)) 55%, transparent)" }}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="px-4 pt-20 pb-4 max-w-3xl mx-auto space-y-4">
        {/* Page intro */}
        <div className="text-center mb-2">
          <h1 className="text-[22px] font-bold tracking-tight">Analytics</h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">
            Track real visitor activity for your published site — top pages, sources, devices, and trends over time.
          </p>
        </div>

        {/* Range picker */}
        <div className="relative">
          <button
            onClick={() => setPickerOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg backdrop-blur-2xl border border-foreground/10 text-sm font-medium transition"
            style={{ backgroundColor: "color-mix(in oklab, hsl(var(--background)) 55%, transparent)" }}
          >
            {range.label}
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
          {pickerOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
              <div
                className="absolute z-50 mt-1 w-56 rounded-xl backdrop-blur-2xl backdrop-saturate-150 border border-foreground/10 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.25)] dark:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.6)] overflow-hidden"
                style={{ backgroundColor: "color-mix(in oklab, hsl(var(--background)) 75%, transparent)" }}
              >
                {RANGES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { setRangeId(r.id); setPickerOpen(false); }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-foreground/[0.06] transition ${
                      r.id === rangeId ? "text-primary font-semibold" : ""
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="border-t border-foreground/10 -mx-4" />

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Visitors"      value={visitors.toLocaleString()}     active={metric === "visitors"}  onClick={() => setMetric("visitors")} />
              <StatCard label="Pageviews"     value={pageviews.toLocaleString()}    active={metric === "pageviews"} onClick={() => setMetric("pageviews")} />
              <StatCard label="Views Per Visit" value={viewsPerVisit.toString()} />
              <StatCard label="Visit Duration"  value={fmtDuration(visitDuration)} />
              <StatCard label="Bounce Rate"     value={`${bounce}%`} />
            </div>

            {/* Chart */}
            <div
              className="rounded-2xl backdrop-blur-2xl backdrop-saturate-150 border border-foreground/10 p-3 pt-4 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)]"
              style={{ backgroundColor: "color-mix(in oklab, hsl(var(--background)) 55%, transparent)" }}
            >
              <div className="h-[260px] -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="aFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="hsl(var(--foreground) / 0.06)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "color-mix(in oklab, hsl(var(--background)) 80%, transparent)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid hsl(var(--foreground) / 0.1)",
                        borderRadius: 12, fontSize: 12,
                      }}
                    />
                    <Area
                      type="linear"
                      dataKey={metric}
                      stroke="hsl(217 91% 60%)"
                      strokeWidth={2}
                      fill="url(#aFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sources */}
            <BreakdownCard title="Source" rows={topSources.slice(0, 8)} renderKey={(k) => k} />

            {/* Pages */}
            <BreakdownCard title="Page" rows={topPages.slice(0, 12)} renderKey={(k) => <span className="font-mono text-[12.5px]">{k}</span>} tone="violet" />

            {/* Countries */}
            <BreakdownCard
              title="Country"
              rows={topCountries.slice(0, 10)}
              renderKey={(k) => (
                <span className="inline-flex items-center gap-2">
                  <span className="text-base leading-none">{FLAGS[k] || "🌐"}</span>
                  <span>{k}</span>
                </span>
              )}
            />

            {/* Devices */}
            <div
              className="rounded-2xl backdrop-blur-2xl backdrop-saturate-150 border border-foreground/10 p-4 space-y-3 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)]"
              style={{ backgroundColor: "color-mix(in oklab, hsl(var(--background)) 55%, transparent)" }}
            >
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Device</span>
                <span className="text-muted-foreground">Visitors</span>
              </div>
              <div className="space-y-2">
                {topDevices.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-2">No data yet</div>
                ) : topDevices.map((d) => (
                  <div key={d.key} className="relative h-10 rounded-md overflow-hidden bg-foreground/[0.04]">
                    <div className="absolute inset-y-0 left-0 bg-primary/15" style={{ width: `${d.pct}%` }} />
                    <div className="relative h-full px-3 flex items-center justify-between text-sm">
                      <span>{d.key}</span>
                      <span className="font-medium">{d.pct.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground text-center pt-2 pb-6">
              Powered by privacy-friendly first-party analytics
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label, value, active, onClick,
}: { label: string; value: string; active?: boolean; onClick?: () => void }) {
  const Comp: any = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`text-left rounded-2xl backdrop-blur-2xl backdrop-saturate-150 border p-4 transition shadow-[0_4px_20px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)] ${
        active ? "border-primary/40 ring-1 ring-primary/30" : "border-foreground/10"
      } ${onClick ? "hover:border-primary/40" : ""}`}
      style={{ backgroundColor: active
        ? "color-mix(in oklab, hsl(var(--primary)) 12%, transparent)"
        : "color-mix(in oklab, hsl(var(--background)) 55%, transparent)" }}
    >
      <div className={`text-[13px] font-medium ${active ? "text-primary" : ""}`}>{label}</div>
      <div className="mt-2 text-[26px] font-bold leading-none">{value}</div>
    </Comp>
  );
}

function BreakdownCard({
  title, rows, renderKey, tone = "blue",
}: {
  title: string;
  rows: { key: string; count: number }[];
  renderKey: (k: string) => React.ReactNode;
  tone?: "blue" | "violet";
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  const bar = tone === "violet" ? "bg-violet-500/15" : "bg-primary/15";
  return (
    <div
      className="rounded-2xl backdrop-blur-2xl backdrop-saturate-150 border border-foreground/10 p-4 space-y-3 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)]"
      style={{ backgroundColor: "color-mix(in oklab, hsl(var(--background)) 55%, transparent)" }}
    >
      <div className="flex items-center justify-between text-sm font-semibold">
        <span>{title}</span>
        <span className="text-muted-foreground">Visitors</span>
      </div>
      <div className="space-y-2">
        {rows.length === 0 ? (
          <div className="text-sm text-muted-foreground py-2">No data yet</div>
        ) : rows.map((r) => (
          <div key={r.key} className="relative min-h-10 rounded-md overflow-hidden bg-foreground/[0.04]">
            <div className={`absolute inset-y-0 left-0 ${bar}`} style={{ width: `${(r.count / max) * 100}%` }} />
            <div className="relative px-3 py-2 flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0 break-all">{renderKey(r.key)}</div>
              <div className="font-medium shrink-0">{r.count}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
