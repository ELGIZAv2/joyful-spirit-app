// Conversational clarify wizard: one question at a time, rendered as a
// chat-style stack — a pill header with circular progress, an indigo speech
// bubble for the question, and a card below for the answer input. ALL
// questions are treated as optional client-side so the user is never blocked.
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, ArrowRight, ArrowLeft, Upload, X as XIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { DocsClarifyQuestion, DocsClarifyUi } from "@/lib/agent/docs/types";

// Auto-detect UI language based on the source language of the clarify content.
// Defaults to English; only switches to Arabic when the text contains Arabic
// script. This way ALL languages get a sensible (English) UI by default and
// Arabic users still see fully-localized labels.
type UiLang = "ar" | "en";
function detectUiLang(..._samples: string[]): UiLang {
  // Force English UI everywhere.
  return "en";
}
const UI_STRINGS: Record<UiLang, Record<string, string>> = {
  ar: {
    title: "قبل ما أبدأ التصميم",
    phase: "مرحلة التوضيح",
    optional: "​",
    back: "رجوع",
    skip: "تخطي",
    next: "السؤال التالي",
    startDesign: "ابدأ التصميم",
    answered: "تم",
    thinking: "أفكر…",
    maxSize: "أقصى حجم 5 ميجا",
    uploaded: "تم الرفع",
    uploadFailed: "تعذّر الرفع",
    finishEarly: "تخطّي الباقي وابدأ التصميم",
    uploaded2: "تم رفع الصورة",
    clear: "إزالة",
    uploading: "جاري الرفع…",
    uploadCta: "اضغط لرفع صورة (PNG/JPG/WEBP — حتى 5MB)",
    orPasteUrl: "أو الصق رابط الصورة",
    optionalHint: "اختياري — تقدر تتخطاه",
  },
  en: {
    title: "Before I start designing",
    phase: "Clarifying phase",
    optional: "​",
    back: "Back",
    skip: "Skip",
    next: "Next question",
    startDesign: "Start designing",
    answered: "Got it",
    thinking: "Thinking…",
    maxSize: "Max size is 5MB",
    uploaded: "Uploaded",
    uploadFailed: "Upload failed",
    finishEarly: "Skip to results",
    uploaded2: "Image uploaded",
    clear: "Clear",
    uploading: "Uploading…",
    uploadCta: "Click to upload an image (PNG/JPG/WEBP — up to 5MB)",
    orPasteUrl: "Or paste an image URL",
    optionalHint: "Optional — feel free to skip",
  },
};

interface Props {
  reason: string;
  questions: DocsClarifyQuestion[];
  /** AI-generated UI labels in the user's exact language/dialect.
   *  Any missing key falls back to the baked-in English defaults. */
  ui?: DocsClarifyUi;
  onSubmit: (answers: Record<string, string>) => void;
  onSkip?: () => void;
  busy?: boolean;
}

export default function DocsClarifyCard({ reason, questions, ui, onSubmit, busy }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [idx, setIdx] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Force English UI for all clarify content regardless of source language.
  const uiLang: UiLang = "en";
  // Prefer AI-supplied label (user's own language/dialect); fall back to English baseline.
  const t = (k: keyof typeof UI_STRINGS.en) => {
    const aiVal = ui ? (ui as Record<string, string | undefined>)[k] : undefined;
    if (typeof aiVal === "string" && aiVal.trim()) return aiVal;
    return UI_STRINGS[uiLang][k] ?? UI_STRINGS.en[k];
  };

  // If a new clarify arrives (different questions), reset wizard state so the
  // user sees the new questions instead of the "answered" pill from the prior round.
  const questionsSig = useMemo(
    () => `${questions.length}::${questions.map((q) => q.id).join(",")}::${reason.slice(0, 64)}`,
    [questions, reason],
  );
  useEffect(() => {
    setAnswers({});
    setIdx(0);
    setSubmitted(false);
  }, [questionsSig]);

  const q = questions[idx];
  const total = questions.length;
  const isLast = idx === total - 1;
  const value = answers[q?.id ?? ""] ?? "";
  const isAnswered = value.trim().length > 0;
  // Every clarify question is OPTIONAL on the client — the wizard never blocks
  // the user, and missing answers are filled in by the generator downstream.
  const effectiveRequired = false;
  const canAdvance = true;

  const setAns = (id: string, v: string) => setAnswers((p) => ({ ...p, [id]: v }));

  // Ensure every question has *some* answer before submitting so the backend
  // doesn't immediately re-ask the same clarifying questions. Skipped/empty
  // answers become an explicit "no preference — use best defaults" marker.
  const withDefaults = (current: Record<string, string>): Record<string, string> => {
    const filled: Record<string, string> = { ...current };
    for (const qq of questions) {
      const v = (filled[qq.id] ?? "").trim();
      if (!v) filled[qq.id] = "__skip__: no preference, use best defaults";
    }
    return filled;
  };

  const handleNext = () => {
    if (!canAdvance) return;
    if (isLast) {
      setSubmitted(true);
      onSubmit(withDefaults(answers));
    } else {
      setIdx((i) => i + 1);
    }
  };
  const handleBack = () => setIdx((i) => Math.max(0, i - 1));
  const handleSkip = () => {
    if (effectiveRequired) return;
    if (isLast) { setSubmitted(true); onSubmit(withDefaults(answers)); }
    else setIdx((i) => i + 1);
  };

  const handleFinishEarly = () => {
    setSubmitted(true);
    onSubmit(withDefaults(answers));
  };

  const handleUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(t("maxSize")); return; }
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Login required");
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("docs-uploads").upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("docs-uploads").getPublicUrl(path);
      setAns(q.id, pub.publicUrl);
      toast.success(t("uploaded"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("uploadFailed"));
    } finally { setUploading(false); }
  };

  // Nothing is required → always offer the early-finish shortcut once the
  // user has scrolled past the first question.
  const requiredRemaining = 0;

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="inline-flex items-center gap-2.5 rounded-full border border-border/60 bg-card/80 backdrop-blur-xl px-3.5 h-9"
      >
        <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <Check className="w-3 h-3" strokeWidth={3} />
        </span>
        <span className="text-[12.5px] font-medium text-foreground/85">{t("answered")}</span>
        <span className="w-px h-3.5 bg-border/60" />
        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
        <span className="text-[12px] text-muted-foreground">{t("thinking")}</span>
      </motion.div>
    );
  }

  if (!q) return null;

  const progressPct = Math.round(((idx + (isAnswered ? 1 : 0)) / total) * 100);
  const contentDir = detectUiLang(reason, q.label, q.help ?? "", ...(q.options ?? [])) === "ar" ? "rtl" : "ltr";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[460px]"
      dir={contentDir}
    >
      <div className="rounded-xl border border-border bg-card p-4 shadow-2xl sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
              <span className="tabular-nums">{idx + 1}/{total}</span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
              <span className="truncate">{t("phase")}</span>
            </div>
            <p className="text-[13px] font-medium text-foreground/80">{t("title")}</p>
          </div>
          <span className="shrink-0 rounded-md border border-border bg-muted/30 px-2 py-1 text-[11px] font-semibold text-muted-foreground">
            {q.group || reason || t("optional")}
          </span>
        </div>

        <div className="mt-4 h-1 overflow-hidden rounded-full bg-muted/60" dir="ltr">
          <motion.div
            className="h-full rounded-full bg-foreground"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`question-${q.id}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5"
          >
            <h2 className="text-[18px] font-semibold leading-snug text-foreground">{q.label}</h2>
            {q.help && (
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{q.help}</p>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={`input-${q.id}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <QuestionInput
              q={q}
              value={value}
              onChange={(v) => setAns(q.id, v)}
              uploading={uploading}
              onUploadClick={() => fileRef.current?.click()}
              onClear={() => setAns(q.id, "")}
              uiLang={uiLang}
              ui={ui}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
            />
            <p className="mt-3 text-[11px] text-muted-foreground/80">{t("optionalHint")}</p>
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBack}
              disabled={idx === 0 || busy}
              aria-label={t("back")}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-30 disabled:hover:bg-muted/30"
            >
              <ArrowLeft className="w-4 h-4 rtl:hidden" strokeWidth={2.5} />
              <ArrowRight className="w-4 h-4 hidden rtl:inline" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={handleSkip}
              disabled={busy}
              className="h-10 rounded-lg px-3 text-[12px] font-semibold text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground disabled:opacity-50"
            >
              {t("skip")}
            </button>
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={busy}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-foreground px-4 text-[12px] font-bold text-background transition-all hover:bg-foreground/90 active:scale-95 disabled:opacity-50"
          >
            <span>{isLast ? t("startDesign") : t("next")}</span>
            {isLast ? (
              <Check className="w-3.5 h-3.5" strokeWidth={3} />
            ) : (
              <>
                <ArrowRight className="w-3.5 h-3.5 rtl:hidden" strokeWidth={2.5} />
                <ArrowLeft className="w-3.5 h-3.5 hidden rtl:inline" strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>
      </div>
      </div>

      {/* Skip to results — always visible, except on last step */}
      {!isLast && (
        <button
          type="button"
          onClick={handleFinishEarly}
          disabled={busy}
          className="mx-auto mt-3 block py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          {t("finishEarly")}
        </button>
      )}
    </motion.div>
  );
}

function QuestionInput({
  q, value, onChange, uploading, onUploadClick, onClear, uiLang, ui,
}: {
  q: DocsClarifyQuestion;
  value: string;
  onChange: (v: string) => void;
  uploading: boolean;
  onUploadClick: () => void;
  onClear: () => void;
  uiLang: UiLang;
  ui?: DocsClarifyUi;
}) {
  const tt = (k: keyof typeof UI_STRINGS.en) => {
    const aiVal = ui ? (ui as Record<string, string | undefined>)[k] : undefined;
    if (typeof aiVal === "string" && aiVal.trim()) return aiVal;
    return UI_STRINGS[uiLang][k] ?? UI_STRINGS.en[k];
  };
  if (q.type === "image") {
    if (value) {
      return (
        <div className="flex items-center gap-3 p-2 rounded-xl border border-border/60 bg-background/60">
          <img src={value} alt="" className="w-14 h-14 rounded-lg object-cover bg-muted" />
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-medium text-foreground truncate">{tt("uploaded2")}</div>
            <div className="text-[11px] text-muted-foreground truncate">{value}</div>
          </div>
          <button type="button" onClick={onClear} className="w-8 h-8 rounded-full hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground" title={tt("clear")}>
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={onUploadClick}
          disabled={uploading}
          className="w-full h-24 rounded-xl border-2 border-dashed border-border/60 hover:border-foreground/40 bg-background/40 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground transition disabled:opacity-60"
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          <span className="text-[12.5px] font-medium">{uploading ? tt("uploading") : tt("uploadCta")}</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="h-px flex-1 bg-border/60" />
          <span className="text-[10.5px] text-muted-foreground">{tt("orPasteUrl")}</span>
          <span className="h-px flex-1 bg-border/60" />
        </div>
        <input
          type="url"
          inputMode="url"
          placeholder="https://…"
          dir="ltr"
          onChange={(e) => onChange(e.target.value.trim())}
          className="w-full h-9 px-3 rounded-xl bg-background/60 border border-border/60 text-[12.5px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/40 transition-colors"
        />
        <div className="text-[11px] text-muted-foreground/80 text-center">{tt("optionalHint")}</div>
      </div>
    );
  }

  if (q.type === "long_text") {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={q.placeholder ?? ""}
        maxLength={q.maxLength ?? 1000}
        rows={4}
        className="w-full px-3 py-2.5 rounded-xl bg-background/60 border border-border/60 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/40 transition-colors resize-y leading-relaxed"
      />
    );
  }

  if (q.type === "choice" && q.options?.length) {
    const cols = q.options.length <= 2 ? "grid-cols-1" : "grid-cols-2";
    return (
      <div className={`grid ${cols} gap-2.5`}>
        {q.options.map((opt) => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`flex items-center justify-between gap-3 p-4 rounded-2xl border-2 text-start transition-all active:scale-[0.97] ${
                selected
                  ? "border-indigo-600 bg-indigo-50 text-indigo-950 dark:bg-indigo-500/10 dark:text-indigo-50 dark:border-indigo-500/60 shadow-sm"
                  : "border-border/60 bg-background/60 text-foreground/80 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:bg-background"
              }`}
            >
              <span className="font-semibold text-[13px] leading-snug">{opt}</span>
              <span className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selected ? "border-indigo-600 bg-indigo-600 dark:border-indigo-400 dark:bg-indigo-500" : "border-border"}`}>
                {selected && <Check className="w-3 h-3 text-white" strokeWidth={3.5} />}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (q.type === "multi_choice" && q.options?.length) {
    const selected = value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const toggle = (opt: string) => {
      const next = selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt];
      onChange(next.join(", "));
    };
    const cols = q.options.length <= 2 ? "grid-cols-1" : "grid-cols-2";
    return (
      <div className={`grid ${cols} gap-2.5`}>
        {q.options.map((opt) => {
          const isSel = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`flex items-center justify-between gap-3 p-4 rounded-2xl border-2 text-start transition-all active:scale-[0.97] ${
                isSel
                  ? "border-indigo-600 bg-indigo-50 text-indigo-950 dark:bg-indigo-500/10 dark:text-indigo-50 dark:border-indigo-500/60 shadow-sm"
                  : "border-border/60 bg-background/60 text-foreground/80 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:bg-background"
              }`}
            >
              <span className="font-semibold text-[13px] leading-snug">{opt}</span>
              <span className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${isSel ? "border-indigo-600 bg-indigo-600 dark:border-indigo-400 dark:bg-indigo-500" : "border-border"}`}>
                {isSel && <Check className="w-3 h-3 text-white" strokeWidth={3.5} />}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  const htmlType =
    q.type === "number" ? "number" :
    q.type === "date" ? "date" :
    q.type === "email" ? "email" :
    q.type === "phone" ? "tel" :
    q.type === "url" ? "url" :
    "text";

  return (
    <input
      type={htmlType}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={q.placeholder ?? ""}
      maxLength={q.maxLength ?? 200}
      className="w-full h-10 px-3 rounded-xl bg-background/60 border border-border/60 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/40 transition-colors"
    />
  );
}
