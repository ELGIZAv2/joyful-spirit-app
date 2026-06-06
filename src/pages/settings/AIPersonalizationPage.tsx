// AI Personalization — simplified, friendlier layout for everyday users.
// Smaller fields, clearer grouping, no Memory duplication (lives in /settings/memory).
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { goBackOr } from "@/lib/navigation";
import { toast } from "sonner";
import { BackIcon, AiPersonalizationIcon } from "@/components/settings/SettingsIcons";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/settings/DesktopSettingsLayout";

const INTEREST_OPTIONS = [
  "Technology", "Design", "Business", "Learning", "Coding", "Writing",
  "Marketing", "Photography", "Travel", "Sports", "Music", "Cooking",
  "Health", "Finance", "Art", "Gaming",
];

const LANGUAGE_STYLES = [
  { id: "mixed", label: "Auto" },
  { id: "casual", label: "Casual" },
  { id: "formal", label: "Formal" },
  { id: "english", label: "English only" },
];

type Tier = "lite" | "pro" | "max";
const TIERS: { id: Tier; label: string; desc: string; paid: boolean }[] = [
  { id: "lite", label: "Lite", desc: "Fast everyday", paid: false },
  { id: "pro", label: "Pro", desc: "Smarter", paid: true },
  { id: "max", label: "Max", desc: "Top-tier", paid: true },
];

export default function AIPersonalizationPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");

  const [callName, setCallName] = useState("");
  const [profession, setProfession] = useState("");
  const [about, setAbout] = useState("");

  const [toneFormality, setToneFormality] = useState(50);
  const [toneVerbosity, setToneVerbosity] = useState(50);
  const [toneCreativity, setToneCreativity] = useState(50);

  const [languageStyle, setLanguageStyle] = useState("mixed");
  const [interests, setInterests] = useState<string[]>([]);
  const [aiTraits, setAiTraits] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");

  const [preferredTier, setPreferredTier] = useState<Tier>("lite");

  const savedSnapshotRef = useRef<string>("");
  const [savedSnapshot, setSavedSnapshot] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      setUserId(user.id);

      const [profileRes, persRes] = await Promise.all([
        supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle(),
        supabase.from("ai_personalization").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      setUserPlan((profileRes.data as any)?.plan || "free");

      if (persRes.data) {
        const d: any = persRes.data;
        setCallName(d.call_name || "");
        setProfession(d.profession || "");
        setAbout(d.about || "");
        setAiTraits(d.ai_traits || "");
        setCustomInstructions(d.custom_instructions || "");
        setToneFormality(d.tone_formality ?? 50);
        setToneVerbosity(d.tone_verbosity ?? 50);
        setToneCreativity(d.tone_creativity ?? 50);
        setLanguageStyle(d.language_style || "mixed");
        setInterests(Array.isArray(d.interests) ? d.interests : []);
        setPreferredTier((d.preferred_tier as Tier) || "lite");
      }
      const snap = JSON.stringify({
        callName: (persRes.data as any)?.call_name || "",
        profession: (persRes.data as any)?.profession || "",
        about: (persRes.data as any)?.about || "",
        aiTraits: (persRes.data as any)?.ai_traits || "",
        customInstructions: (persRes.data as any)?.custom_instructions || "",
        toneFormality: (persRes.data as any)?.tone_formality ?? 50,
        toneVerbosity: (persRes.data as any)?.tone_verbosity ?? 50,
        toneCreativity: (persRes.data as any)?.tone_creativity ?? 50,
        languageStyle: (persRes.data as any)?.language_style || "mixed",
        interests: Array.isArray((persRes.data as any)?.interests) ? (persRes.data as any).interests : [],
        preferredTier: ((persRes.data as any)?.preferred_tier as Tier) || "lite",
      });
      savedSnapshotRef.current = snap;
      setSavedSnapshot(snap);
      setLoading(false);
    })();
  }, [navigate]);

  const isPaid = userPlan !== "free" && userPlan !== "trial";

  const currentSnapshot = useMemo(() => JSON.stringify({
    callName, profession, about, aiTraits, customInstructions,
    toneFormality, toneVerbosity, toneCreativity,
    languageStyle, interests, preferredTier,
  }), [callName, profession, about, aiTraits, customInstructions, toneFormality, toneVerbosity, toneCreativity, languageStyle, interests, preferredTier]);

  const isDirty = currentSnapshot !== savedSnapshot;

  const save = useCallback(async () => {
    if (!userId) return;
    setSaving(true);
    const payload: any = {
      user_id: userId,
      call_name: callName.trim() || null,
      profession: profession.trim() || null,
      about: about.trim() || null,
      ai_traits: aiTraits.trim() || null,
      custom_instructions: customInstructions.trim() || null,
      tone_formality: toneFormality,
      tone_verbosity: toneVerbosity,
      tone_creativity: toneCreativity,
      language_style: languageStyle,
      interests,
      preferred_tier: preferredTier,
    };
    const { error } = await supabase.from("ai_personalization").upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    if (error) { toast.error("Failed to save"); return; }
    setSavedSnapshot(currentSnapshot);
    savedSnapshotRef.current = currentSnapshot;
    toast.success("Saved");
  }, [userId, callName, profession, about, aiTraits, customInstructions, toneFormality, toneVerbosity, toneCreativity, languageStyle, interests, preferredTier, currentSnapshot]);

  const toggleInterest = (i: string) => {
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const field = "w-full px-3 py-2.5 rounded-xl bg-muted/40 border border-transparent text-[13.5px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:bg-muted/60 focus:border-border transition-colors";

  const sections = (
    <>
      {/* Preferred model */}
      <Card title="Preferred model">
        <div className="grid grid-cols-3 gap-2">
          {TIERS.map(t => {
            const locked = t.paid && !isPaid;
            const active = preferredTier === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  if (locked) { toast.info(`Megsy ${t.label} requires a paid plan`); return; }
                  setPreferredTier(t.id);
                }}
                className={`px-3 py-2.5 rounded-xl text-center transition-all ${active ? "bg-foreground text-background" : "bg-muted/40 hover:bg-muted/60 text-foreground"}`}
              >
                <div className="text-[13px] font-semibold">{t.label}{locked ? " ·" : ""}</div>
                <div className="text-[10.5px] opacity-70 mt-0.5">{t.desc}{locked ? " · Pro" : ""}</div>
              </button>
            );
          })}
        </div>
      </Card>

      <Collapsible title="About you" hint={callName || profession ? "Personalized" : "​"}>
        <Field label="What should Megsy call you?">
          <input value={callName} onChange={e => setCallName(e.target.value)} placeholder="e.g. Alex" className={field} />
        </Field>
        <Field label="Your role or field">
          <input value={profession} onChange={e => setProfession(e.target.value)} placeholder="Developer, designer, student…" className={field} />
        </Field>
        <Field label="A short bio ​">
          <textarea value={about} onChange={e => setAbout(e.target.value)} rows={2} placeholder="Anything that helps Megsy understand you…" className={`${field} resize-none`} />
        </Field>
      </Collapsible>

      <Collapsible title="Reply tone" hint={`${toneFormality}/${toneVerbosity}/${toneCreativity}`}>
        <Slider label="Tone" leftLabel="Formal" rightLabel="Friendly" value={toneFormality} onChange={setToneFormality} />
        <Slider label="Length" leftLabel="Concise" rightLabel="Detailed" value={toneVerbosity} onChange={setToneVerbosity} />
        <Slider label="Style" leftLabel="Conservative" rightLabel="Creative" value={toneCreativity} onChange={setToneCreativity} />
      </Collapsible>

      <Collapsible title="Language" hint={LANGUAGE_STYLES.find(s => s.id === languageStyle)?.label}>
        <div className="grid grid-cols-4 gap-1.5">
          {LANGUAGE_STYLES.map(s => (
            <button
              key={s.id}
              onClick={() => setLanguageStyle(s.id)}
              className={`px-2 py-2 rounded-xl text-[12px] font-medium transition-colors ${languageStyle === s.id ? "bg-foreground text-background" : "bg-muted/40 hover:bg-muted/60 text-foreground/80"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Collapsible>

      <Collapsible title="Interests" hint={interests.length ? `${interests.length} selected` : "Tap any that fit"}>
        <div className="flex flex-wrap gap-1.5">
          {INTEREST_OPTIONS.map(i => (
            <button
              key={i}
              onClick={() => toggleInterest(i)}
              className={`px-3 py-1.5 rounded-full text-[12px] transition-colors ${interests.includes(i) ? "bg-foreground text-background" : "bg-muted/40 hover:bg-muted/60 text-foreground/80"}`}
            >
              {i}
            </button>
          ))}
        </div>
      </Collapsible>

      <Collapsible title="Advanced custom instructions" hint={aiTraits || customInstructions ? "Set" : "​"}>
        <Field label="Personality traits for Megsy">
          <input value={aiTraits} onChange={e => setAiTraits(e.target.value)} placeholder="e.g. playful, direct, uses examples" className={field} />
        </Field>
        <Field label="Anything else Megsy should know">
          <textarea value={customInstructions} onChange={e => setCustomInstructions(e.target.value)} rows={3} placeholder="e.g. always cite sources, avoid emojis…" className={`${field} resize-none`} />
        </Field>
      </Collapsible>
    </>
  );

  const saveButton = (
    <button
      onClick={save}
      disabled={saving || !isDirty}
      className={`w-full h-11 rounded-xl bg-foreground text-background font-semibold text-sm flex items-center justify-center gap-2 transition-opacity ${isDirty && !saving ? "opacity-100 hover:opacity-90" : "opacity-40 cursor-not-allowed"}`}
    >
      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
      {saving ? "Saving…" : isDirty ? "Save preferences" : "Saved"}
    </button>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="AI Personalization" subtitle="Customize how Megsy responds to you." action={<div className="w-56">{saveButton}</div>}>
        <div className="max-w-3xl space-y-6">{sections}</div>
      </DesktopSettingsLayout>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-background/85 border-b border-border/50">
        <div className="max-w-2xl mx-auto px-5 py-3 flex items-center gap-3">
          <button onClick={() => goBackOr(navigate, "/settings")} className="w-9 h-9 grid place-items-center rounded-xl text-foreground/70 hover:bg-muted/50 transition-colors" aria-label="Back">
            <BackIcon className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-foreground flex-1">AI Personalization</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 pt-6 space-y-6">
        {/* Intro */}
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-border bg-card">
          <div className="w-10 h-10 rounded-xl bg-muted grid place-items-center text-foreground shrink-0">
            <AiPersonalizationIcon className="w-5 h-5" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tell Megsy a little about you so replies feel more personal. You can leave fields blank — nothing is required.
          </p>
        </div>
        {sections}
      </div>

      {/* Sticky save */}
      <div className="fixed bottom-0 inset-x-0 z-40 backdrop-blur-xl bg-background/90 border-t border-border/50 p-4">
        <div className="max-w-2xl mx-auto">{saveButton}</div>
      </div>
    </div>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-foreground/80">{title}</h3>
        {hint && <span className="text-[10.5px] text-muted-foreground">{hint}</span>}
      </div>
      <div className="space-y-3">{children}</div>
    </motion.section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  );
}

function Slider({ label, leftLabel, rightLabel, value, onChange }: { label: string; leftLabel: string; rightLabel: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
        <span>{label}</span>
        <span className="text-foreground/60 tabular-nums">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-foreground"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground/70 mt-0.5 px-0.5">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

function Collapsible({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-2xl border border-border bg-card overflow-hidden">
      <summary className="px-4 py-3.5 cursor-pointer list-none flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
        <h3 className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-foreground/80">{title}</h3>
        <div className="flex items-center gap-2 text-muted-foreground">
          {hint && <span className="text-[10.5px]">{hint}</span>}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 transition-transform group-open:rotate-180">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </summary>
      <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border/60">{children}</div>
    </details>
  );
}
