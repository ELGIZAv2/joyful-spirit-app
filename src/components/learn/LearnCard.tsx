import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ArrowUp } from "lucide-react";
import mermaid from "mermaid";
import type { LearnCardData } from "@/lib/learnCardParser";
import { detectLearnLocale, getLearnStrings } from "@/lib/learnCardI18n";

// Pull every visible string we know about from a card to detect language.
function localeFromCard(card: any) {
  return detectLearnLocale(
    card?.question,
    card?.title,
    card?.problem,
    Array.isArray(card?.options) ? card.options.join(" ") : "",
    card?.explain,
    card?.topic,
  );
}

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
  fontFamily: "inherit",
});

interface BaseProps {
  card: LearnCardData;
  onAnswer?: (text: string) => void;
}

/* ───────────────────── shared bits ───────────────────── */

/**
 * Quiet minimal card shell.
 * Neutral surface, hairline border, small colored dot + uppercase tracked label.
 * Color is used only as a small accent; the surface itself stays calm.
 */
const TONE_DOT: Record<string, string> = {
  emerald: "bg-emerald-500",
  blue: "bg-blue-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  violet: "bg-violet-500",
};

const CardShell = ({
  children,
  tone = "emerald",
  label,
}: {
  children: React.ReactNode;
  tone?: "emerald" | "blue" | "amber" | "rose" | "violet";
  label?: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
    >
      {label && (
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${TONE_DOT[tone]}`} />
          <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground font-mono">
            {label}
          </span>
        </div>
      )}
      {children}
    </motion.div>
  );
};

const TeacherNoteInput = ({ onSend, locale }: { onSend: (text: string) => void; locale?: any }) => {
  const tt = getLearnStrings(locale || detectLearnLocale(""));
  const [val, setVal] = useState("");
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors"
      >
        {tt.tell_teacher}
      </button>
    );
  }
  return (
    <div className="flex gap-1.5">
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && val.trim()) {
            onSend(val.trim());
            setVal("");
            setOpen(false);
          }
        }}
        placeholder={tt.write_note_teacher}
        className="flex-1 px-3 py-1.5 rounded-lg border border-border/50 bg-background/60 text-xs text-foreground outline-none focus:border-emerald-400/50"
      />
      <button
        type="button"
        aria-label={tt.send}
        onClick={() => {
          if (val.trim()) {
            onSend(val.trim());
            setVal("");
            setOpen(false);
          }
        }}
        disabled={!val.trim()}
        className="luma-cta-icon shrink-0"
        style={{ height: "2.25rem", width: "2.25rem" }}
      >
        <ArrowUp className="w-4 h-4" />
      </button>
    </div>
  );
};

/* ───────────────────── MCQ ───────────────────── */

const MCQCard = ({ card, onAnswer }: BaseProps) => {
  const loc = localeFromCard(card);
  const tt = getLearnStrings(loc);
  const [picked, setPicked] = useState<number | null>(null);
  const correct = card.correct as number;
  const isRight = picked === correct;

  return (
    <CardShell tone="emerald" label={tt.question_choose}>
      <p className="text-[16px] font-semibold text-foreground leading-snug">{card.question}</p>
      <div className="flex flex-col gap-2">
        {(card.options || []).map((opt: string, i: number) => {
          const isPicked = picked === i;
          const isAnswerRevealed = picked !== null;
          const isCorrectOpt = i === correct;
          const letter = String.fromCharCode(65 + i);
          let cls = "border-border/60 bg-card hover:border-emerald-300/60 hover:bg-emerald-500/[0.04] text-foreground/80";
          let chipCls = "bg-muted/60 text-muted-foreground group-hover:bg-emerald-500/10 group-hover:text-emerald-600 dark:group-hover:text-emerald-300";
          if (isAnswerRevealed) {
            if (isCorrectOpt) {
              cls = "border-emerald-400/70 bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-200";
              chipCls = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
            } else if (isPicked) {
              cls = "border-rose-400/60 bg-rose-500/[0.08] text-rose-700 dark:text-rose-200";
              chipCls = "bg-rose-500/15 text-rose-700 dark:text-rose-300";
            } else {
              cls = "border-border/40 bg-card text-muted-foreground opacity-70";
              chipCls = "bg-muted/40 text-muted-foreground";
            }
          }
          return (
            <button
              key={i}
              disabled={picked !== null}
              onClick={() => setPicked(i)}
              className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${cls}`}
            >
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${chipCls}`}>
                {letter}
              </span>
              <span className="flex-1 text-start">{opt}</span>
              {/* status indicated by the option's color state, no icons */}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          <div className={`text-[11px] font-medium ${isRight ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>
            {isRight ? tt.correct_answer : tt.wrong_try_again}
          </div>
          {card.explain && (
            <div className="text-xs text-muted-foreground leading-relaxed border-s-2 border-emerald-400/40 ps-3">
              {card.explain}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              onClick={() => onAnswer?.(isRight ? tt.on_correct_continue : tt.on_wrong_simplify)}
              className="text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full border border-emerald-400/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
            >
              {isRight ? tt.go_harder : tt.explain_again}
            </button>
            <TeacherNoteInput locale={loc} onSend={(t) => onAnswer?.(t)} />
          </div>
        </motion.div>
      )}
    </CardShell>
  );
};

/* ───────────────────── Multi-select ───────────────────── */

const MultiCard = ({ card, onAnswer }: BaseProps) => {
  const loc = localeFromCard(card);
  const tt = getLearnStrings(loc);
  const [picks, setPicks] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const correctSet = new Set<number>(card.correct || []);
  const allRight = submitted && picks.length === correctSet.size && picks.every((p) => correctSet.has(p));

  const toggle = (i: number) => {
    if (submitted) return;
    setPicks((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  };

  return (
    <CardShell tone="emerald" label={tt.select_all_correct}>
      <p className="text-sm font-medium text-foreground">{card.question}</p>
      <div className="space-y-1.5">
        {(card.options || []).map((opt: string, i: number) => {
          const isPicked = picks.includes(i);
          const isCorrect = correctSet.has(i);
          let cls = "border-border/50 bg-background/60";
          if (submitted) {
            if (isCorrect) cls = "border-emerald-400/70 bg-emerald-500/15";
            else if (isPicked) cls = "border-rose-400/60 bg-rose-500/15";
          } else if (isPicked) cls = "border-emerald-400/60 bg-emerald-500/10";
          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              disabled={submitted}
              className={`w-full text-right px-4 py-2.5 rounded-xl border text-sm transition-all ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {!submitted ? (
        <button
          disabled={picks.length === 0}
          onClick={() => setSubmitted(true)}
          className="w-full py-2 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-200 text-sm font-medium hover:bg-emerald-500/30 disabled:opacity-40"
        >
          {tt.confirm}
        </button>
      ) : (
        <div className="space-y-2">
          <div className={`text-xs ${allRight ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>
            {allRight ? tt.all_correct : tt.not_all_correct}
          </div>
          {card.explain && <div className="text-xs text-muted-foreground border-r-2 border-emerald-400/40 pr-3">{card.explain}</div>}
          <TeacherNoteInput locale={loc} onSend={(t) => onAnswer?.(t)} />
        </div>
      )}
    </CardShell>
  );
};

/* ───────────────────── True / False ───────────────────── */

const TrueFalseCard = ({ card, onAnswer }: BaseProps) => {
  const loc = localeFromCard(card);
  const tt = getLearnStrings(loc);
  const [picked, setPicked] = useState<boolean | null>(null);
  const isRight = picked === card.correct;
  return (
    <CardShell tone="emerald" label={tt.true_or_false}>
      <p className="text-sm font-medium text-foreground">{card.question}</p>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: tt.correct, val: true },
          { label: tt.wrong, val: false },
        ].map((b) => {
          const sel = picked === b.val;
          const reveal = picked !== null;
          const correct = card.correct === b.val;
          let cls = "border-border/50 bg-background/60 hover:border-emerald-400/40";
          if (reveal) {
            if (correct) cls = "border-emerald-400/70 bg-emerald-500/15";
            else if (sel) cls = "border-rose-400/60 bg-rose-500/15";
          }
          return (
            <button
              key={b.label}
              disabled={picked !== null}
              onClick={() => setPicked(b.val)}
              className={`py-3 rounded-xl border text-sm font-medium ${cls}`}
            >
              {b.label}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="space-y-2">
          <div className={`text-xs ${isRight ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>
            {isRight ? tt.correct : tt.wrong}
          </div>
          {card.explain && <div className="text-xs text-muted-foreground border-r-2 border-emerald-400/40 pr-3">{card.explain}</div>}
          <TeacherNoteInput locale={loc} onSend={(t) => onAnswer?.(t)} />
        </div>
      )}
    </CardShell>
  );
};

/* ───────────────────── Explain (free text) ───────────────────── */

const ExplainCard = ({ card, onAnswer }: BaseProps) => {
  const loc = localeFromCard(card);
  const tt = getLearnStrings(loc);
  const [val, setVal] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <CardShell tone="blue">
      <p className="text-sm font-medium text-foreground">{card.question}</p>
      {!sent ? (
        <>
          <textarea
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={tt.write_answer}
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-border/50 bg-background/60 text-sm outline-none focus:border-blue-400/50 resize-none"
          />
          <button
            disabled={!val.trim()}
            onClick={() => {
              setSent(true);
              onAnswer?.(tt.my_answer_prefix(val.trim()));
            }}
            className="w-full py-2 rounded-xl bg-blue-500/20 text-blue-700 dark:text-blue-200 text-sm font-medium hover:bg-blue-500/30 disabled:opacity-40"
          >
            {tt.submit_grading}
          </button>
        </>
      ) : (
        <div className="text-xs text-muted-foreground">{tt.sent_grading}</div>
      )}
    </CardShell>
  );
};

/* ───────────────────── Fill in the blank ───────────────────── */

const FillCard = ({ card, onAnswer }: BaseProps) => {
  const loc = localeFromCard(card);
  const tt = getLearnStrings(loc);
  const [val, setVal] = useState("");
  const [sent, setSent] = useState(false);
  const isRight = sent && val.trim().toLowerCase() === String(card.answer || "").trim().toLowerCase();
  return (
    <CardShell tone="emerald" label={tt.fill_blank}>
      <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{card.question}</p>
      <div className="flex gap-2">
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          disabled={sent}
          placeholder={card.placeholder || tt.your_answer}
          className="flex-1 px-3 py-2 rounded-xl border border-border/50 bg-background/60 text-sm outline-none focus:border-emerald-400/50"
        />
        {!sent && (
          <button
            disabled={!val.trim()}
            onClick={() => setSent(true)}
            className="px-4 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-200 text-sm font-medium hover:bg-emerald-500/30 disabled:opacity-40"
          >
            {tt.confirm}
          </button>
        )}
      </div>
      {sent && (
        <div className="space-y-1.5">
          <div className={`text-xs ${isRight ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>
            {isRight ? tt.correct_with_answer(String(card.answer)) : tt.correct_answer_is(String(card.answer))}
          </div>
          {card.explain && <div className="text-xs text-muted-foreground">{card.explain}</div>}
        </div>
      )}
    </CardShell>
  );
};

/* ───────────────────── Match (column A → B) ───────────────────── */

const MatchCard = ({ card, onAnswer }: BaseProps) => {
  const loc = localeFromCard(card);
  const tt = getLearnStrings(loc);
  // pairs: [{a:"...", b:"..."}, ...]
  const pairs = card.pairs || [];
  const [shuffledB] = useState<string[]>(() => {
    const arr = pairs.map((p: any) => p.b);
    return arr.sort(() => Math.random() - 0.5);
  });
  const [picks, setPicks] = useState<Record<number, string>>({});
  const [done, setDone] = useState(false);

  return (
    <CardShell tone="violet" label={tt.match_columns}>
      <div className="space-y-2">
        {pairs.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex-1 px-3 py-2 rounded-lg bg-background/60 border border-border/40 text-sm">{p.a}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <select
              disabled={done}
              value={picks[i] || ""}
              onChange={(e) => setPicks({ ...picks, [i]: e.target.value })}
              className="flex-1 px-3 py-2 rounded-lg bg-background/60 border border-border/40 text-sm outline-none"
            >
              <option value="">{tt.choose}</option>
              {shuffledB.map((b: string, j: number) => (
                <option key={j} value={b}>{b}</option>
              ))}
            </select>
            {done && (
              picks[i] === p.b
                ? <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-300">{tt.correct}</span>
                : <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-300">—</span>
            )}
          </div>
        ))}
      </div>
      {!done ? (
        <button
          disabled={Object.keys(picks).length !== pairs.length}
          onClick={() => setDone(true)}
          className="w-full py-2 rounded-xl bg-violet-500/20 text-violet-700 dark:text-violet-200 text-sm font-medium hover:bg-violet-500/30 disabled:opacity-40"
        >
          {tt.confirm}
        </button>
      ) : (
        <TeacherNoteInput locale={loc} onSend={(t) => onAnswer?.(t)} />
      )}
    </CardShell>
  );
};

/* ───────────────────── Check-in ───────────────────── */

const CheckinCard = ({ card, onAnswer }: BaseProps) => {
  const loc = localeFromCard(card);
  const tt = getLearnStrings(loc);
  const opts = card.options || [tt.opt_continue, tt.opt_slow_down, tt.opt_another_example, tt.opt_take_break];
  return (
    <CardShell tone="amber" label={tt.checkin_label}>
      <p className="text-[16px] font-semibold text-foreground leading-snug">{card.question || tt.checkin_default_q}</p>
      <div className="grid grid-cols-2 gap-2">
        {opts.map((o: string, i: number) => (
          <button
            key={i}
            onClick={() => onAnswer?.(o)}
            className="flex items-center justify-center px-4 py-3 rounded-xl border border-border/60 bg-card text-sm font-medium text-foreground/80 hover:border-amber-300/60 hover:bg-amber-500/[0.06] hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
          >
            {o}
          </button>
        ))}
      </div>
      <TeacherNoteInput locale={loc} onSend={(t) => onAnswer?.(t)} />
    </CardShell>
  );
};

/* ───────────────────── Mermaid diagram ───────────────────── */

const MermaidCard = ({ card }: BaseProps) => {
  const tt = getLearnStrings(localeFromCard(card));
  const ref = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const id = useRef(`m-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    let cancelled = false;
    const code = String(card.code || "").trim();
    if (!code || !ref.current) return;
    mermaid
      .render(id.current, code)
      .then(({ svg }) => {
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      })
      .catch((e) => {
        if (!cancelled) setErr(String(e?.message || e));
      });
    return () => { cancelled = true; };
  }, [card.code]);

  return (
    <CardShell tone="violet" label={tt.visual_explanation}>
      {card.title && <p className="text-sm font-medium text-foreground">{card.title}</p>}
      <div ref={ref} className="overflow-x-auto rounded-lg bg-background/40 p-2 [&_svg]:max-w-full [&_svg]:h-auto" />
      {err && <div className="text-xs text-rose-700 dark:text-rose-300">{tt.cannot_draw}: {err}</div>}
    </CardShell>
  );
};

/* ───────────────────── Roadmap ───────────────────── */

const RoadmapCard = ({ card, onAnswer }: BaseProps) => {
  const tt = getLearnStrings(localeFromCard(card));
  const stages = card.stages || [];
  return (
    <CardShell tone="blue" label={tt.learning_map}>
      {card.title && <p className="text-sm font-semibold text-foreground">{card.title}</p>}
      <div className="space-y-2">
        {stages.map((s: any, i: number) => (
          <div key={i} className="rounded-xl border border-border/40 bg-background/60 p-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-sm font-medium text-foreground">{s.title}</span>
            </div>
            {s.description && <p className="text-xs text-muted-foreground pr-8">{s.description}</p>}
            {s.resources && s.resources.length > 0 && (
              <div className="flex flex-wrap gap-1 pr-8">
                {s.resources.map((r: string, k: number) => (
                  <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300">
                    {r}
                  </span>
                ))}
              </div>
            )}
            {s.project && (
              <div className="pr-8 text-[11px] text-emerald-700 dark:text-emerald-300">Project: {s.project}</div>
            )}
            <button
              onClick={() => onAnswer?.(tt.start_with_stage(s.title))}
              className="text-[11px] text-blue-700 dark:text-blue-300 hover:text-blue-700 dark:text-blue-200 mr-8"
            >
              {tt.start_stage}
            </button>
          </div>
        ))}
      </div>
    </CardShell>
  );
};

/* ───────────────────── Exam setup ───────────────────── */

const ExamSetupCard = ({ card, onAnswer }: BaseProps) => {
  const tt = getLearnStrings(localeFromCard(card));
  const [topic, setTopic] = useState(card.suggestedTopic || "");
  const [count, setCount] = useState(10);
  const [duration, setDuration] = useState(15);
  const [difficulty, setDifficulty] = useState(tt.diff_intermediate);
  const [types, setTypes] = useState<string[]>([tt.type_mcq]);

  const allTypes = [tt.type_mcq, tt.type_tf, tt.type_fill, tt.type_justify];

  const toggleType = (t: string) =>
    setTypes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const submit = () => {
    onAnswer?.(tt.prepare_exam({ topic, count, duration, difficulty, types: types.join(", ") }));
  };

  return (
    <CardShell tone="rose" label={tt.setup_exam}>
      <div className="space-y-2">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={tt.topic_placeholder}
          className="w-full px-3 py-2 rounded-xl border border-border/50 bg-background/60 text-sm outline-none focus:border-rose-400/50"
        />
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-muted-foreground space-y-1">
            {tt.num_questions}
            <input
              type="number" min={3} max={30} value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 10)}
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background/60 text-sm outline-none"
            />
          </label>
          <label className="text-xs text-muted-foreground space-y-1">
            {tt.duration_minutes}
            <input
              type="number" min={1} max={120} value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 15)}
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background/60 text-sm outline-none"
            />
          </label>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">{tt.difficulty}</div>
          <div className="flex gap-1.5">
            {[tt.diff_easy, tt.diff_intermediate, tt.diff_hard].map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`flex-1 py-1.5 rounded-lg text-xs ${
                  difficulty === d ? "bg-rose-500/25 text-rose-700 dark:text-rose-200" : "bg-background/60 border border-border/40 text-muted-foreground"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">{tt.question_types}</div>
          <div className="flex flex-wrap gap-1.5">
            {allTypes.map((t) => (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={`px-2.5 py-1 rounded-full text-[11px] ${
                  types.includes(t) ? "bg-rose-500/25 text-rose-700 dark:text-rose-200" : "bg-background/60 border border-border/40 text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={submit}
          disabled={!topic.trim() || types.length === 0}
          className="w-full py-2 rounded-xl bg-rose-500/25 text-rose-700 dark:text-rose-100 text-sm font-medium hover:bg-rose-500/35 disabled:opacity-40"
        >
          {tt.start_exam}
        </button>
      </div>
    </CardShell>
  );
};

/* ───────────────────── Exam runner (timer + result) ───────────────────── */

const ExamRunnerCard = ({ card, onAnswer }: BaseProps) => {
  const tt = getLearnStrings(localeFromCard(card));
  const questions = card.questions || [];
  const totalSec = (card.durationMin || 10) * 60;
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [done, setDone] = useState(false);
  const [remaining, setRemaining] = useState(totalSec);

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(t);
          setDone(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [done]);

  const finish = () => setDone(true);

  if (done) {
    const correct = questions.reduce(
      (acc: number, q: any, i: number) => acc + (answers[i] === q.correct ? 1 : 0),
      0
    );
    const pct = questions.length ? Math.round((correct / questions.length) * 100) : 0;
    return (
      <CardShell tone="rose" label={tt.exam_result}>
        <div className="text-center py-2">
          <div className="text-4xl font-bold text-rose-700 dark:text-rose-200">{pct}%</div>
          <div className="text-sm text-muted-foreground mt-1">
            {tt.correct_of_total(correct, questions.length)}
          </div>
        </div>
        <div className="space-y-1.5">
          {questions.map((q: any, i: number) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className={`text-[11px] font-semibold shrink-0 mt-0.5 ${answers[i] === q.correct ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"}`}>
                {answers[i] === q.correct ? tt.correct : "—"}
              </span>
              <span className="text-foreground/80">{q.question}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => onAnswer?.(tt.score_analysis(correct, questions.length))}
          className="w-full py-2 rounded-xl bg-rose-500/25 text-rose-700 dark:text-rose-100 text-sm font-medium hover:bg-rose-500/35"
        >
          {tt.analyze_result}
        </button>
      </CardShell>
    );
  }

  const q = questions[idx];
  if (!q) return null;
  const min = String(Math.floor(remaining / 60)).padStart(2, "0");
  const sec = String(remaining % 60).padStart(2, "0");

  return (
    <CardShell tone="rose" label={tt.question_n_of_m(idx + 1, questions.length)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{card.topic}</span>
        <span className={`font-mono font-semibold ${remaining < 60 ? "text-rose-700 dark:text-rose-300" : "text-foreground"}`}>
          {min}:{sec}
        </span>
      </div>
      <p className="text-sm font-medium text-foreground">{q.question}</p>
      <div className="space-y-1.5">
        {(q.options || []).map((o: string, i: number) => (
          <button
            key={i}
            onClick={() => setAnswers({ ...answers, [idx]: i })}
            className={`w-full text-right px-4 py-2.5 rounded-xl border text-sm ${
              answers[idx] === i
                ? "border-rose-400/60 bg-rose-500/15"
                : "border-border/50 bg-background/60 hover:border-rose-400/40"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        {idx > 0 && (
          <button onClick={() => setIdx(idx - 1)} className="flex-1 py-1.5 rounded-lg bg-background/60 border border-border/40 text-xs">
            {tt.previous}
          </button>
        )}
        {idx < questions.length - 1 ? (
          <button
            onClick={() => setIdx(idx + 1)}
            disabled={answers[idx] === undefined}
            className="flex-1 py-1.5 rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-200 text-xs font-medium disabled:opacity-40"
          >
            {tt.next}
          </button>
        ) : (
          <button
            onClick={finish}
            className="flex-1 py-1.5 rounded-lg bg-rose-500/30 text-rose-700 dark:text-rose-100 text-xs font-medium"
          >
            {tt.finish_view_score}
          </button>
        )}
      </div>
    </CardShell>
  );
};

/* ───────────────────── Photo solve ───────────────────── */

const PhotoSolveCard = ({ card, onAnswer }: BaseProps) => {
  const tt = getLearnStrings(localeFromCard(card));
  return (
    <CardShell tone="blue" label={tt.step_by_step}>
      {card.problem && <p className="text-sm font-medium text-foreground">{card.problem}</p>}
      <ol className="space-y-1.5 list-decimal pr-5">
        {(card.steps || []).map((s: string, i: number) => (
          <li key={i} className="text-sm text-foreground/90 leading-relaxed">{s}</li>
        ))}
      </ol>
      {card.answer && (
        <div className="rounded-lg bg-blue-500/10 border border-blue-400/30 px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-200">
          {tt.final_answer}: {card.answer}
        </div>
      )}
      {card.similar && card.similar.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs text-muted-foreground">{tt.try_similar}</div>
          {card.similar.map((q: string, i: number) => (
            <button
              key={i}
              onClick={() => onAnswer?.(tt.solve_for_me(q))}
              className="w-full text-right text-xs px-3 py-2 rounded-lg bg-background/60 border border-border/40 hover:border-blue-400/40"
            >
              {i + 1}. {q}
            </button>
          ))}
        </div>
      )}
    </CardShell>
  );
};

/* ───────────────────── Onboarding ───────────────────── */

const OnboardingCard = ({ card, onAnswer }: BaseProps) => {
  const tt = getLearnStrings(localeFromCard(card));
  const [interests, setInterests] = useState("");
  const [level, setLevel] = useState("");
  return (
    <CardShell tone="emerald" label={tt.introduce_yourself}>
      <p className="text-sm text-foreground">{card.question || "So I can explain in a way that suits you:"}</p>
      <input
        value={interests}
        onChange={(e) => setInterests(e.target.value)}
        placeholder="Your hobbies (football, games, cooking...)"
        className="w-full px-3 py-2 rounded-xl border border-border/50 bg-background/60 text-sm outline-none focus:border-emerald-400/50"
      />
      <div className="flex gap-1.5">
        {[tt.diff_easy, tt.diff_intermediate, tt.diff_hard].map((l) => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            className={`flex-1 py-1.5 rounded-lg text-xs ${
              level === l ? "bg-emerald-500/25 text-emerald-700 dark:text-emerald-200" : "bg-background/60 border border-border/40 text-muted-foreground"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
      <button
        disabled={!interests.trim() || !level}
        onClick={() =>
          onAnswer?.(
            `My info: hobbies ${interests}, level ${level}. Use analogies from my interests in every explanation from now on.`
          )
        }
        className="w-full py-2 rounded-xl bg-emerald-500/25 text-emerald-700 dark:text-emerald-100 text-sm font-medium hover:bg-emerald-500/35 disabled:opacity-40"
      >
        {tt.confirm} →
      </button>
    </CardShell>
  );
};

/* ───────────────────── Router ───────────────────── */

const LearnCard = ({ card, onAnswer }: { card: LearnCardData; onAnswer?: (text: string) => void }) => {
  switch (card.type) {
    case "mcq": return <MCQCard card={card} onAnswer={onAnswer} />;
    case "multi": return <MultiCard card={card} onAnswer={onAnswer} />;
    case "truefalse": return <TrueFalseCard card={card} onAnswer={onAnswer} />;
    case "explain": return <ExplainCard card={card} onAnswer={onAnswer} />;
    case "fill": return <FillCard card={card} onAnswer={onAnswer} />;
    case "match": return <MatchCard card={card} onAnswer={onAnswer} />;
    case "checkin": return <CheckinCard card={card} onAnswer={onAnswer} />;
    case "mermaid": return <MermaidCard card={card} onAnswer={onAnswer} />;
    case "roadmap": return <RoadmapCard card={card} onAnswer={onAnswer} />;
    case "exam_setup": return <ExamSetupCard card={card} onAnswer={onAnswer} />;
    case "exam_runner": return <ExamRunnerCard card={card} onAnswer={onAnswer} />;
    case "photo_solve": return <PhotoSolveCard card={card} onAnswer={onAnswer} />;
    case "onboarding": return <OnboardingCard card={card} onAnswer={onAnswer} />;
    default:
      return (
        <CardShell tone="amber" label={getLearnStrings(localeFromCard(card)).card}>
          <pre className="text-xs text-muted-foreground overflow-x-auto">{JSON.stringify(card, null, 2)}</pre>
        </CardShell>
      );
  }
};

export default LearnCard;
