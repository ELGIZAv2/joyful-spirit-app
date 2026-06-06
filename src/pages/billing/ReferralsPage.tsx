import { ArrowLeft, Copy, Check, X, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { DesktopSettingsLayout } from "@/components/settings/DesktopSettingsLayout";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import referralHero from "@/assets/referral-hero.webp";

interface Referral { id: string; referred_id: string; status: string; created_at: string; }
interface Earning { id: string; amount: number; source_action: string; created_at: string; }
interface Withdrawal { id: string; amount: number; status: string; method: string; created_at: string; }

interface Stats {
  totalClicks: number;
  conversions: number;
  convRate: number;
  totalEarned: number;
  availableEarnings: number;
  pendingEarnings: number;
  signups: number;
  topSources: { source: string; clicks: number; conversions: number }[];
  topCountries: { country: string; count: number }[];
  peakHour: number;
  streak: number;
  bestDay: { date: string; clicks: number };
  milestones: { milestone_key: string; achieved_at: string }[];
}

interface Tier { tier_name: string; commission_rate: number; }

interface ShareData {
  url: string;
  qr_url: string;
  share: Record<string, string>;
}

const MILESTONE_LABELS: Record<string, string> = {
  first_referral: "First Referral",
  ten_referrals: "10 Referrals",
  first_10_dollars: "First $10",
  first_100_dollars: "First $100",
  week_streak: "7-Day Streak",
};

const NOIR = "#0d0d0d";
const SURFACE = "#1a1a1a";
const GOLD = "#c9a84c";
const GOLD_LIGHT = "#f0d78c";

const ReferralsPage = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [copiedLanding, setCopiedLanding] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [tier, setTier] = useState<Tier | null>(null);
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [activeTab, setActiveTab] = useState<"insights" | "referrals" | "earnings" | "withdrawals">("insights");

  const referralLink = referralCode ? `${window.location.origin}/ref/${referralCode}` : "";
  const landingLink = referralCode ? `${window.location.origin}/r/${referralCode}` : "";

  const shareTemplates = referralCode ? [
    {
      id: "casual",
      label: "Casual",
      text: `Hey! I've been using Megsy AI — it's actually amazing. Chat, image, video, code, all in one place. Try it free: ${landingLink}`,
    },
    {
      id: "value",
      label: "Value",
      text: `Stop paying for 5 different AI tools. Megsy AI = ChatGPT + Midjourney + Runway + Cursor in ONE app. Start free → ${landingLink}`,
    },
    {
      id: "creator",
      label: "Creator",
      text: `My new favorite AI tool 🤖✨\n\nText, images, videos, code — all from one prompt.\nGrab it free here: ${landingLink}`,
    },
  ] : [];

  const callApi = useCallback(async (op: string, body: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke("referral-track", {
      body: { op, ...body },
    });
    if (error) throw error;
    return data;
  }, []);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: codes } = await supabase
      .from("referral_codes").select("code").eq("user_id", user.id).limit(1);
    let code = codes?.[0]?.code;
    if (!code) {
      code = `MEGSY-${user.id.substring(0, 6).toUpperCase()}`;
      await supabase.from("referral_codes").insert({ user_id: user.id, code });
    }
    setReferralCode(code);

    const [refsRes, earnsRes, wdsRes] = await Promise.all([
      supabase.from("referrals").select("*").eq("referrer_id", user.id).order("created_at", { ascending: false }),
      supabase.from("referral_earnings").select("*").eq("referrer_id", user.id).order("created_at", { ascending: false }),
      supabase.from("withdrawal_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setReferrals(refsRes.data || []);
    setEarnings(earnsRes.data || []);
    setWithdrawals(wdsRes.data || []);

    try {
      const [statsData, tierData, shareRes] = await Promise.all([
        callApi("stats"),
        callApi("tier"),
        callApi("share", { origin: window.location.origin }),
      ]);
      setStats(statsData);
      setTier(tierData);
      setShareData(shareRes);
    } catch (e) {
      console.warn("referral-api unavailable", e);
    }
  }, [callApi]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Tracking link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLanding = () => {
    navigator.clipboard.writeText(landingLink);
    setCopiedLanding(true);
    toast.success("Personal landing page copied!");
    setTimeout(() => setCopiedLanding(false), 2000);
  };

  const handleCopyTemplate = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessage(id);
    toast.success("Message copied — ready to paste");
    setTimeout(() => setCopiedMessage(null), 2000);
  };

  const handleShare = (platform: string) => {
    if (!shareData?.share[platform]) return;
    window.open(shareData.share[platform], "_blank", "noopener,noreferrer");
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const totalEarned = stats?.totalEarned ?? earnings.reduce((s, e) => s + Number(e.amount), 0);
  const availableBalance = stats?.availableEarnings ?? 0;
  const commissionPct = tier ? Math.round(tier.commission_rate * 100) : 15;
  const tierName = tier?.tier_name ?? "Bronze";

  const mobileContent = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 pb-28 font-['Work_Sans'] text-zinc-400"
      style={{ fontFamily: "'Work Sans', system-ui, sans-serif" }}
    >
      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/5" style={{ background: SURFACE }}>
        <div className="relative h-40 overflow-hidden">
          <img src={referralHero} alt="Megsy Referral Program" className="h-full w-full object-cover opacity-55 grayscale" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, rgba(13,13,13,0.05), ${SURFACE})` }} />
          <div className="absolute left-5 top-5 inline-flex items-center rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest" style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)", color: GOLD_LIGHT }}>
            {tierName} Tier
          </div>
        </div>

        <div className="space-y-5 px-5 pb-5 pt-1">
          <div className="space-y-2">
            <h1 className="text-[2rem] leading-none text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Referral Program
            </h1>
            <p className="max-w-[19rem] text-[13px] leading-5 text-zinc-500">
              Earn {commissionPct}% recurring commission every time your referrals pay.
            </p>
          </div>

          <div className="flex items-end justify-between gap-4 rounded-2xl p-4" style={{ background: NOIR, border: "1px solid rgba(201,168,76,0.12)" }}>
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-widest text-zinc-500">Available</p>
              <p className="mt-1 text-3xl font-semibold text-white">${availableBalance.toFixed(2)}</p>
              {stats && stats.pendingEarnings > 0 && <p className="text-[10px] text-zinc-600">${stats.pendingEarnings.toFixed(2)} pending</p>}
            </div>
            <button
              onClick={() => navigate("/settings/withdraw")}
              className="shrink-0 rounded-full px-5 py-3 text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: `linear-gradient(to top right, ${GOLD}, ${GOLD_LIGHT})`, color: NOIR }}
            >
              Withdraw
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {[
          { label: "Clicks", value: (stats?.totalClicks ?? 0).toString(), highlight: false },
          { label: "Signups", value: (stats?.signups ?? referrals.length).toString(), highlight: false },
          { label: "Conv. Rate", value: `${stats?.convRate ?? 0}%`, highlight: false },
          { label: "Total Earned", value: `$${totalEarned.toFixed(2)}`, highlight: true },
        ].map((s) => (
          <div key={s.label} className="min-w-0 rounded-2xl p-4" style={{ background: SURFACE, border: `1px solid ${s.highlight ? "rgba(201,168,76,0.32)" : "rgba(255,255,255,0.05)"}` }}>
            <p className="mb-2 text-[9px] uppercase tracking-widest" style={{ color: s.highlight ? GOLD : "#71717a" }}>{s.label}</p>
            <p className="truncate text-[1.7rem] leading-none" style={{ fontFamily: "'Instrument Serif', serif", color: s.highlight ? GOLD_LIGHT : "#fff" }}>{s.value}</p>
          </div>
        ))}
      </section>

      {stats && stats.milestones.length > 0 && (
        <section className="rounded-2xl p-4" style={{ background: SURFACE, border: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="mb-3 text-[9px] uppercase tracking-widest text-zinc-500">Milestones</p>
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {stats.milestones.map((m) => (
              <span key={m.milestone_key} className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold" style={{ background: "rgba(201,168,76,0.10)", border: "1px solid rgba(201,168,76,0.20)", color: GOLD_LIGHT }}>
                {MILESTONE_LABELS[m.milestone_key] || m.milestone_key}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4 rounded-[1.5rem] p-4" style={{ background: SURFACE, border: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold text-white">Referral Assets</h2>
          <span className="rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest" style={{ background: "rgba(201,168,76,0.10)", color: GOLD_LIGHT }}>
            Ready
          </span>
        </div>

        {[
          { label: "Tracking Link", value: referralLink || "Loading…", copied: copied, action: handleCopy },
          { label: "Landing Page", value: landingLink || "Loading…", copied: copiedLanding, action: handleCopyLanding },
        ].map((item) => (
          <div key={item.label} className="space-y-2 rounded-2xl p-3" style={{ background: NOIR, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[9px] uppercase tracking-widest text-zinc-500">{item.label}</p>
              <button onClick={item.action} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/5" style={{ color: item.copied ? GOLD_LIGHT : "#a1a1aa" }} aria-label={`Copy ${item.label}`}>
                {item.copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="min-w-0 truncate pr-1 text-[12px] text-zinc-500">{item.value}</p>
          </div>
        ))}

        {shareData && (
          <div className="space-y-3 pt-1">
            <p className="text-[9px] uppercase tracking-widest text-zinc-500">Quick Share</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "whatsapp", label: "WhatsApp" },
                { key: "twitter", label: "X" },
                { key: "telegram", label: "Telegram" },
                { key: "email", label: "Email" },
                { key: "qr", label: "QR" },
              ].map((b) => (
                <button key={b.key} onClick={() => (b.key === "qr" ? setShowQR(true) : handleShare(b.key))} className="min-h-11 rounded-xl px-2 text-[11px] font-semibold transition-colors hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.06)", color: b.key === "qr" ? GOLD_LIGHT : "#d4d4d8" }}>
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-[1.5rem] p-4" style={{ background: SURFACE, border: "1px solid rgba(255,255,255,0.05)" }}>
        <h2 className="text-[15px] font-semibold text-white">Message Templates</h2>
        <div className="space-y-3">
          {shareTemplates.map((t) => (
            <div key={t.id} className="rounded-2xl p-3" style={{ background: NOIR, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>{t.label}</span>
                <button onClick={() => handleCopyTemplate(t.id, t.text)} className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-colors hover:text-[#f0d78c] text-white">
                  {copiedMessage === t.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedMessage === t.id ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="line-clamp-3 whitespace-pre-line text-[12px] leading-5 text-zinc-500">{t.text}</p>
            </div>
          ))}
          {shareTemplates.length === 0 && <p className="py-4 text-center text-xs text-zinc-600">Loading templates…</p>}
        </div>
      </section>

      {stats && (stats.streak > 0 || stats.bestDay.clicks > 0) && (
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4" style={{ background: SURFACE, border: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="mb-2 text-[9px] uppercase tracking-widest text-zinc-500">Streak</p>
            <p className="text-3xl text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>{stats.streak}d</p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: SURFACE, border: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="mb-2 text-[9px] uppercase tracking-widest text-zinc-500">Best Day</p>
            <p className="text-3xl text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>{stats.bestDay.clicks}</p>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex gap-2 overflow-x-auto rounded-full p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ background: SURFACE, border: "1px solid rgba(255,255,255,0.05)" }}>
          {(["insights", "referrals", "earnings", "withdrawals"] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} className={`shrink-0 rounded-full px-4 py-2 text-[11px] font-semibold capitalize transition-all ${activeTab === t ? "text-[#0d0d0d]" : "text-zinc-400 hover:text-white"}`} style={activeTab === t ? { background: `linear-gradient(to top right, ${GOLD}, ${GOLD_LIGHT})` } : undefined}>
              {t}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} className="rounded-[1.5rem] p-4" style={{ background: SURFACE, border: "1px solid rgba(255,255,255,0.05)" }}>
            {activeTab === "insights" && (!stats ? <p className="py-8 text-center text-sm text-zinc-500">Loading insights…</p> : <div className="space-y-5"><div className="space-y-2"><p className="text-[10px] uppercase tracking-widest" style={{ color: GOLD }}>Top Sources</p>{stats.topSources.length === 0 ? <p className="py-2 text-sm text-zinc-500">No clicks yet.</p> : stats.topSources.map((s) => <div key={s.source} className="flex items-center justify-between gap-3 border-b border-white/5 py-2 last:border-0"><p className="min-w-0 truncate text-sm font-medium capitalize text-white">{s.source}</p><p className="shrink-0 text-[11px] text-zinc-500">{s.clicks} clicks · {s.conversions} conv.</p></div>)}</div>{stats.topCountries.length > 0 && <div className="space-y-2"><p className="text-[10px] uppercase tracking-widest" style={{ color: GOLD }}>Top Countries</p>{stats.topCountries.map((c) => <div key={c.country} className="flex items-center justify-between gap-3 border-b border-white/5 py-2 last:border-0"><p className="min-w-0 truncate text-sm font-medium text-white">{c.country}</p><p className="shrink-0 text-[11px] text-zinc-500">{c.count}</p></div>)}</div>}<div className="rounded-xl p-4 text-center" style={{ background: NOIR, border: "1px solid rgba(255,255,255,0.05)" }}><p className="text-2xl text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>{stats.peakHour}:00 UTC</p><p className="mt-1 text-[10px] uppercase tracking-widest text-zinc-500">Peak Click Hour</p></div></div>)}
            {activeTab === "referrals" && (referrals.length === 0 ? <p className="py-8 text-center text-sm text-zinc-500">No referrals yet. Share your link to get started.</p> : referrals.map((r) => <div key={r.id} className="flex items-center justify-between gap-3 border-b border-white/5 py-3 last:border-0"><div className="min-w-0"><p className="truncate text-sm font-medium text-white">User {r.referred_id.substring(0, 8)}…</p><p className="text-[11px] text-zinc-500">{formatDate(r.created_at)}</p></div><span className="shrink-0 text-[11px] font-medium" style={{ color: r.status === "active" ? "#86efac" : GOLD_LIGHT }}>{r.status}</span></div>))}
            {activeTab === "earnings" && (earnings.length === 0 ? <p className="py-8 text-center text-sm text-zinc-500">No earnings yet.</p> : earnings.map((e) => <div key={e.id} className="flex items-center justify-between gap-3 border-b border-white/5 py-3 last:border-0"><div className="min-w-0"><p className="text-sm font-medium text-white">${Number(e.amount).toFixed(2)}</p><p className="text-[11px] text-zinc-500">{formatDate(e.created_at)}</p></div><span className="shrink-0 text-[11px] text-zinc-500">{e.source_action}</span></div>))}
            {activeTab === "withdrawals" && (withdrawals.length === 0 ? <p className="py-8 text-center text-sm text-zinc-500">No withdrawal requests yet.</p> : withdrawals.map((w) => <div key={w.id} className="flex items-center justify-between gap-3 border-b border-white/5 py-3 last:border-0"><div className="min-w-0"><p className="text-sm font-medium text-white">${Number(w.amount).toFixed(2)}</p><p className="truncate text-[11px] text-zinc-500">{w.method} — {formatDate(w.created_at)}</p></div><span className="shrink-0 text-[11px] font-medium" style={{ color: w.status === "completed" ? "#86efac" : w.status === "rejected" ? "#f87171" : GOLD_LIGHT }}>{w.status}</span></div>))}
          </motion.div>
        </AnimatePresence>
      </section>
    </motion.div>
  );

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 md:space-y-6 max-w-5xl mx-auto pb-24 md:pb-16 font-['Work_Sans'] text-zinc-400"
      style={{ fontFamily: "'Work Sans', system-ui, sans-serif" }}
    >
      {/* Hero Block */}
      <div
        className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-white/5"
        style={{ background: SURFACE }}
      >
        <div className="flex flex-col md:flex-row">
          <div className="p-5 md:p-12 flex-1 flex flex-col justify-center space-y-3 md:space-y-4 order-2 md:order-1">
            <div
              className="inline-flex w-fit items-center px-2.5 py-1 rounded-full text-[9px] md:text-[10px] font-bold tracking-widest uppercase"
              style={{
                background: "rgba(201,168,76,0.10)",
                border: "1px solid rgba(201,168,76,0.20)",
                color: GOLD_LIGHT,
              }}
            >
              {tierName} Tier
            </div>
            <h1
              className="text-3xl md:text-5xl text-white leading-tight"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Megsy Referral Program
            </h1>
            <p className="text-sm md:text-base text-zinc-500 max-w-sm">
              Earn {commissionPct}% recurring commission on every payment made by your referrals — forever.
            </p>
            <div className="pt-2 md:pt-4 flex items-end justify-between md:items-center md:justify-start gap-4 md:gap-6 flex-wrap">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">Available Balance</p>
                <p className="text-2xl font-semibold text-white">${availableBalance.toFixed(2)}</p>
                {stats && stats.pendingEarnings > 0 && (
                  <p className="text-[10px] text-zinc-500">${stats.pendingEarnings.toFixed(2)} pending</p>
                )}
              </div>
              <button
                onClick={() => navigate("/settings/withdraw")}
                className="px-5 md:px-6 py-2.5 rounded-full font-bold text-sm hover:opacity-90 transition-opacity"
                style={{
                  background: `linear-gradient(to top right, ${GOLD}, ${GOLD_LIGHT})`,
                  color: NOIR,
                }}
              >
                Withdraw
              </button>
            </div>
          </div>
          <div
            className="md:w-1/2 relative h-32 md:h-auto md:min-h-[300px] overflow-hidden flex items-center justify-center order-1 md:order-2"
            style={{ background: "rgba(13,13,13,0.5)" }}
          >
            <img
              src={referralHero}
              alt="Megsy Referral Program"
              className="w-full h-full object-cover opacity-50 md:opacity-60 grayscale hover:grayscale-0 transition-all duration-700"
            />
            <div
              className="absolute inset-0 md:hidden"
              style={{ background: `linear-gradient(to bottom, transparent 40%, ${SURFACE})` }}
            />
            <div
              className="absolute inset-0 hidden md:block"
              style={{ background: `linear-gradient(to right, ${SURFACE}, transparent, transparent)` }}
            />
            <div
              className="absolute inset-0 hidden md:block"
              style={{ background: `linear-gradient(to top, ${SURFACE}, transparent, transparent)` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Clicks", value: (stats?.totalClicks ?? 0).toString(), highlight: false },
          { label: "Signups", value: (stats?.signups ?? referrals.length).toString(), highlight: false },
          { label: "Conv. Rate", value: `${stats?.convRate ?? 0}%`, highlight: false },
          { label: "Total Earned", value: `$${totalEarned.toFixed(2)}`, highlight: true },
        ].map((s) => (
          <div
            key={s.label}
            className="p-4 md:p-6 rounded-2xl"
            style={{
              background: SURFACE,
              border: `1px solid ${s.highlight ? "rgba(201,168,76,0.30)" : "rgba(255,255,255,0.05)"}`,
            }}
          >
            <p
              className="text-[9px] md:text-[10px] uppercase tracking-widest mb-1.5 md:mb-2"
              style={{ color: s.highlight ? GOLD : "#71717a" }}
            >
              {s.label}
            </p>
            <p
              className="text-2xl md:text-3xl truncate"
              style={{
                fontFamily: "'Instrument Serif', serif",
                color: s.highlight ? GOLD_LIGHT : "#fff",
              }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Milestones */}
      {stats && stats.milestones.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: "#52525b" }}>Your Milestones</p>
          <div className="flex flex-wrap gap-2">
            {stats.milestones.map((m) => (
              <div
                key={m.milestone_key}
                className="px-3 py-1.5 rounded-full text-[11px] font-semibold"
                style={{
                  background: "rgba(201,168,76,0.10)",
                  border: "1px solid rgba(201,168,76,0.20)",
                  color: GOLD_LIGHT,
                }}
              >
                {MILESTONE_LABELS[m.milestone_key] || m.milestone_key}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interaction Grid */}
      <div className="grid md:grid-cols-12 gap-4 md:gap-6">
        {/* Links & Social */}
        <div className="md:col-span-7 space-y-6">
          <div
            className="p-5 md:p-8 rounded-2xl md:rounded-3xl space-y-5 md:space-y-6"
            style={{ background: SURFACE, border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <h3 className="text-white font-medium">Your Referral Assets</h3>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest block mb-2" style={{ color: "#52525b" }}>
                  Tracking Link
                </label>
                <div
                  className="flex items-center gap-2 rounded-xl p-1 pl-4"
                  style={{ background: NOIR, border: "1px solid rgba(255,255,255,0.10)" }}
                >
                  <span className="text-xs truncate text-zinc-500 flex-1 min-w-0">{referralLink || "Loading..."}</span>
                  <button
                    onClick={handleCopy}
                    className="p-3 text-zinc-400 transition-colors ml-auto hover:text-[#f0d78c]"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest block mb-2" style={{ color: "#52525b" }}>
                  Personal Landing Page
                </label>
                <div
                  className="flex items-center gap-2 rounded-xl p-1 pl-4"
                  style={{ background: NOIR, border: "1px solid rgba(255,255,255,0.10)" }}
                >
                  <span className="text-xs truncate text-zinc-500 flex-1 min-w-0">{landingLink || "Loading..."}</span>
                  <button
                    onClick={handleCopyLanding}
                    className="p-3 text-zinc-400 transition-colors ml-auto hover:text-[#f0d78c]"
                  >
                    {copiedLanding ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-zinc-600">
                Top: tracking link (instant signup). Bottom: personal landing page with your name.
              </p>
            </div>

            {shareData && (
              <div className="pt-4">
                <p className="text-[10px] uppercase tracking-widest mb-4" style={{ color: "#52525b" }}>Quick Share</p>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { key: "whatsapp", label: "WhatsApp" },
                    { key: "twitter", label: "X" },
                    { key: "telegram", label: "Telegram" },
                    { key: "email", label: "Email" },
                    { key: "qr", label: "QR" },
                  ].map((b) => (
                    <button
                      key={b.key}
                      onClick={() => (b.key === "qr" ? setShowQR(true) : handleShare(b.key))}
                      className="py-2 rounded-lg text-[10px] font-medium transition-colors uppercase hover:bg-white/5"
                      style={{
                        border: "1px solid rgba(255,255,255,0.05)",
                        color: b.key === "qr" ? GOLD_LIGHT : "#d4d4d8",
                      }}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Templates */}
        <div className="md:col-span-5">
          <div
            className="p-5 md:p-8 rounded-2xl md:rounded-3xl space-y-5 md:space-y-6 h-full"
            style={{ background: SURFACE, border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <h3 className="text-white font-medium">Share Templates</h3>

            <div className="space-y-4">
              {shareTemplates.map((t) => (
                <div key={t.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] font-bold tracking-widest uppercase"
                      style={{ color: GOLD }}
                    >
                      {t.label}
                    </span>
                    <button
                      onClick={() => handleCopyTemplate(t.id, t.text)}
                      className="text-[10px] font-bold text-white hover:text-[#f0d78c] transition-colors uppercase tracking-widest inline-flex items-center gap-1"
                    >
                      {copiedMessage === t.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedMessage === t.id ? "Copied" : "Copy Text"}
                    </button>
                  </div>
                  <div
                    className="text-xs leading-relaxed text-zinc-500 p-4 rounded-xl whitespace-pre-line"
                    style={{ background: NOIR, border: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    {t.text}
                  </div>
                </div>
              ))}
              {shareTemplates.length === 0 && (
                <p className="text-xs text-zinc-600">Loading templates…</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Streak + Best day */}
      {stats && (stats.streak > 0 || stats.bestDay.clicks > 0) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl" style={{ background: SURFACE, border: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Streak</p>
            <p className="text-3xl text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>{stats.streak}d</p>
          </div>
          <div className="p-6 rounded-2xl" style={{ background: SURFACE, border: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Personal Best</p>
            <p className="text-3xl text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>{stats.bestDay.clicks}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div
        className="flex rounded-full p-1"
        style={{ background: SURFACE, border: "1px solid rgba(255,255,255,0.05)" }}
      >
        {(["insights", "referrals", "earnings", "withdrawals"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 px-2 rounded-full text-[11px] font-semibold transition-all capitalize ${
              activeTab === t ? "text-[#0d0d0d]" : "text-zinc-400 hover:text-white"
            }`}
            style={
              activeTab === t
                ? { background: `linear-gradient(to top right, ${GOLD}, ${GOLD_LIGHT})` }
                : undefined
            }
          >
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className="p-5 md:p-8 rounded-2xl md:rounded-3xl space-y-4"
          style={{ background: SURFACE, border: "1px solid rgba(255,255,255,0.05)" }}
        >
          {activeTab === "insights" && (
            !stats ? (
              <p className="text-center text-sm text-zinc-500 py-10">Loading insights…</p>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: GOLD }}>Top Sources</p>
                  {stats.topSources.length === 0 ? (
                    <p className="text-sm text-zinc-500 py-2">No clicks yet.</p>
                  ) : stats.topSources.map((s) => (
                    <div key={s.source} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <p className="text-sm font-medium text-white capitalize">{s.source}</p>
                      <p className="text-[11px] text-zinc-500">{s.clicks} clicks · {s.conversions} conv.</p>
                    </div>
                  ))}
                </div>

                {stats.topCountries.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest" style={{ color: GOLD }}>Top Countries</p>
                    {stats.topCountries.map((c) => (
                      <div key={c.country} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <p className="text-sm font-medium text-white">{c.country}</p>
                        <p className="text-[11px] text-zinc-500">{c.count}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-4 rounded-xl text-center" style={{ background: NOIR, border: "1px solid rgba(255,255,255,0.05)" }}>
                  <p className="text-2xl text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>{stats.peakHour}:00 UTC</p>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">Peak Click Hour</p>
                </div>
              </div>
            )
          )}

          {activeTab === "referrals" && (
            referrals.length === 0 ? (
              <p className="text-center text-sm text-zinc-500 py-10">No referrals yet. Share your link to get started.</p>
            ) : (
              referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-white">User {r.referred_id.substring(0, 8)}…</p>
                    <p className="text-[11px] text-zinc-500">{formatDate(r.created_at)}</p>
                  </div>
                  <span className="text-[11px] font-medium" style={{ color: r.status === "active" ? "#86efac" : GOLD_LIGHT }}>
                    {r.status}
                  </span>
                </div>
              ))
            )
          )}

          {activeTab === "earnings" && (
            earnings.length === 0 ? (
              <p className="text-center text-sm text-zinc-500 py-10">No earnings yet.</p>
            ) : (
              earnings.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-white">${Number(e.amount).toFixed(2)}</p>
                    <p className="text-[11px] text-zinc-500">{formatDate(e.created_at)}</p>
                  </div>
                  <span className="text-[11px] text-zinc-500">{e.source_action}</span>
                </div>
              ))
            )
          )}

          {activeTab === "withdrawals" && (
            withdrawals.length === 0 ? (
              <p className="text-center text-sm text-zinc-500 py-10">No withdrawal requests yet.</p>
            ) : (
              withdrawals.map((w) => (
                <div key={w.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-white">${Number(w.amount).toFixed(2)}</p>
                    <p className="text-[11px] text-zinc-500">{w.method} — {formatDate(w.created_at)}</p>
                  </div>
                  <span
                    className="text-[11px] font-medium"
                    style={{
                      color:
                        w.status === "completed" ? "#86efac" :
                        w.status === "rejected" ? "#f87171" : GOLD_LIGHT,
                    }}
                  >
                    {w.status}
                  </span>
                </div>
              ))
            )
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );

  const qrModal = showQR && shareData && (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => setShowQR(false)}
    >
      <div
        className="rounded-2xl p-6 max-w-xs w-full space-y-4 relative"
        style={{ background: SURFACE, border: "1px solid rgba(201,168,76,0.20)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setShowQR(false)}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/5"
        >
          <X className="w-4 h-4 text-zinc-500" />
        </button>
        <p className="text-center text-[11px] text-zinc-500 uppercase tracking-wider inline-flex items-center justify-center gap-2 w-full">
          <QrCode className="w-3 h-3" /> Scan to Join
        </p>
        <img src={shareData.qr_url} alt="Referral QR code" className="w-full rounded-xl bg-white p-2" />
        <p className="text-center text-[10px] text-zinc-500 font-mono break-all">{shareData.url}</p>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden md:block" style={{ background: NOIR }}>
        <DesktopSettingsLayout title="Referrals" subtitle="Earn commission by inviting friends">
          {content}
        </DesktopSettingsLayout>
      </div>

      <div className="block h-[100dvh] w-full max-w-full overflow-y-auto overflow-x-hidden md:hidden" style={{ background: NOIR }}>
        <div className="mx-auto w-full max-w-md overflow-hidden">
          <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 backdrop-blur-xl" style={{ background: "rgba(13,13,13,0.86)" }}>
            <button onClick={() => navigate("/settings")} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:text-white" style={{ background: "rgba(255,255,255,0.04)" }}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Referrals
            </h1>
          </div>
          <div className="w-full max-w-full overflow-hidden px-4 pt-1">{mobileContent}</div>
        </div>
      </div>
      {qrModal}
    </>
  );
};

export default ReferralsPage;
