import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowUp, Pencil, Trash2, X, Plus, Paperclip } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSkills, type Skill } from "@/hooks/useSkills";
import { SKILL_TOOLS, SKILL_MODELS } from "@/lib/skillTools";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import MegsyStar from "@/components/files/MegsyStar";
import { goBackOr } from "@/lib/navigation";
import { getActiveWorkspaceId } from "@/lib/activeWorkspace";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/settings/DesktopSettingsLayout";

type DraftSkill = Partial<Skill> & {
  name: string;
  description: string;
  body: string;
  triggers: string[];
  enabled_tools: string[];
};

const emptyDraft = (): DraftSkill => ({
  name: "",
  description: "",
  body: "",
  triggers: [],
  enabled_tools: [],
  preferred_model: null,
  icon: null,
});

const SUGGESTIONS = [
  "A YC pitch coach",
  "A TikTok hooks copywriter",
  "A senior code reviewer",
  "A no-nonsense legal advisor",
  "A growth-loop strategist",
  "A 5th grade math tutor",
];

export default function SkillsSettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { mySkills, librarySkills, loading, reload, toggleEnabled } = useSkills();
  const [editing, setEditing] = useState<DraftSkill | null>(null);
  const [seedPrompt, setSeedPrompt] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [triggerInput, setTriggerInput] = useState("");
  const [tab, setTab] = useState<"mine" | "library">("mine");
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Close add-menu on outside click / escape
  useEffect(() => {
    if (!addMenuOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setAddMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [addMenuOpen]);

  // Open the designer when arriving with a seed prompt from /settings/skills/new
  useEffect(() => {
    const seed = (location.state as { seed?: string } | null)?.seed;
    if (seed && seed.trim()) {
      setSeedPrompt(seed.trim());
      setEditing(emptyDraft());
      // Clear the navigation state so refresh doesn't re-trigger
      navigate(location.pathname, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const startNew = (prompt = "") => {
    setSeedPrompt(prompt);
    setEditing(emptyDraft());
  };
  const startEdit = (s: Skill) => {
    setSeedPrompt("");
    setEditing({
      ...s,
      body: s.body || s.instructions || "",
      triggers: s.triggers || [],
      enabled_tools: s.enabled_tools || [],
    });
  };

  const handleSave = async (silent = false) => {
    if (!editing) return;
    if (!editing.name.trim()) { if (!silent) toast.error("Name is required"); return; }
    if (!editing.body.trim()) { if (!silent) toast.error("Instructions are required"); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); if (!silent) toast.error("Sign in required"); return; }

    const payload = {
      user_id: user.id,
      workspace_id: getActiveWorkspaceId(),
      name: editing.name.trim(),
      description: editing.description?.trim() || "",
      instructions: editing.body.trim().slice(0, 6000),
      body: editing.body.trim(),
      triggers: editing.triggers,
      enabled_tools: editing.enabled_tools,
      preferred_model: editing.preferred_model && editing.preferred_model !== "auto" ? editing.preferred_model : null,
      icon: editing.icon || null,
    };

    const res = editing.id
      ? await supabase.from("skills").update(payload).eq("id", editing.id)
      : await supabase.from("skills").insert(payload).select("id").single();

    setSaving(false);
    if (res.error) { if (!silent) toast.error(res.error.message); return; }
    // For brand-new skills, capture the new id so subsequent auto-saves UPDATE in place
    if (!editing.id && (res as any).data?.id) {
      setEditing({ ...editing, id: (res as any).data.id });
    }
    if (!silent) {
      toast.success(editing.id ? "Updated" : "Created");
    }
    reload();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this skill?")) return;
    const { error } = await supabase.from("skills").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    reload();
  };

  const handleAddFromLibrary = async (s: Skill) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Sign in required"); return; }
    const { error } = await supabase.from("skills").insert({
      user_id: user.id,
      workspace_id: getActiveWorkspaceId(),
      name: s.name,
      description: s.description,
      instructions: s.instructions,
      body: s.body || s.instructions,
      triggers: s.triggers || [],
      enabled_tools: s.enabled_tools || [],
      preferred_model: s.preferred_model,
      icon: s.icon,
      is_enabled: true,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Added "${s.name}"`);
    reload();
  };

  const handleImportZip = async (file: File) => {
    if (!file.name.endsWith(".zip")) { toast.error("Please pick a .zip file"); return; }
    setImporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const form = new FormData();
      form.append("file", file);
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-skill`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: form,
      });
      const json = await resp.json();
      if (!resp.ok || json.error) throw new Error(json.error || "Import failed");
      toast.success(`Imported "${json.name}"`);
      reload();
    } catch (e: any) {
      toast.error(e.message || "Import failed");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleTool = (name: string) => {
    if (!editing) return;
    const has = editing.enabled_tools.includes(name);
    setEditing({
      ...editing,
      enabled_tools: has ? editing.enabled_tools.filter((t) => t !== name) : [...editing.enabled_tools, name],
    });
  };

  const addTrigger = () => {
    if (!editing) return;
    const v = triggerInput.trim().toLowerCase();
    if (!v || editing.triggers.includes(v)) return;
    setEditing({ ...editing, triggers: [...editing.triggers, v] });
    setTriggerInput("");
  };

  const removeTrigger = (t: string) => {
    if (!editing) return;
    setEditing({ ...editing, triggers: editing.triggers.filter((x) => x !== t) });
  };


  // ===== Editor view (conversational AI Skill Designer) =====
  if (editing) {
    return <SkillDesigner
      key={editing.id || "new"}
      draft={editing}
      setDraft={setEditing}
      onClose={() => { setEditing(null); setSeedPrompt(""); }}
      onSave={handleSave}
      saving={saving}
      seedPrompt={seedPrompt}
      onImportZip={(f) => { handleImportZip(f).then(() => setEditing(null)); }}
      importing={importing}
      triggerInput={triggerInput}
      setTriggerInput={setTriggerInput}
      addTrigger={addTrigger}
      removeTrigger={removeTrigger}
      toggleTool={toggleTool}
    />;
  }

  // ===== List / hero view =====
  const mobileHeader = (
    <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => goBackOr(navigate, "/settings")} className="p-2 -ml-2 rounded-xl hover:bg-accent/60 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[15px] font-semibold tracking-tight flex-1">Skills</h1>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportZip(f); }}
          />
          <div ref={addMenuRef} className="relative">
              <button
                onClick={() => setAddMenuOpen((v) => !v)}
                disabled={importing}
                aria-label="Add skill"
                className="h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {addMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: -6 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transformOrigin: "top right" }}
                    className="absolute right-0 top-full mt-2 z-50 w-52 rounded-2xl border border-border/50 bg-popover/95 backdrop-blur-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.35)] overflow-hidden p-1"
                  >
                    <button
                      onClick={() => {
                        setAddMenuOpen(false);
                        navigate("/settings/skills/new");
                      }}
                      className="w-full text-left text-[13px] px-3 py-2.5 rounded-xl hover:bg-accent/70 transition-colors font-medium"
                    >
                      Create with AI
                    </button>
                    <button
                      onClick={() => {
                        setAddMenuOpen(false);
                        fileInputRef.current?.click();
                      }}
                      className="w-full text-left text-[13px] px-3 py-2.5 rounded-xl hover:bg-accent/70 transition-colors font-medium"
                    >
                      Import from file
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
          </div>
        </div>
    </header>
  );

  const listBody = (
    <>
        {/* Tabs */}
        <div ref={tabsRef} className="flex justify-center mb-6 scroll-mt-20">
          <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-muted/40 border border-border/40 backdrop-blur-sm">
            {[
              { id: "mine" as const, label: "My Skills", count: mySkills.length },
              { id: "library" as const, label: "Library", count: librarySkills.length },
            ].map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 h-9 text-[13px] font-medium rounded-xl transition-all duration-200 ${
                    active
                      ? "bg-background text-foreground shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12)] ring-1 ring-border/60"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                  }`}
                >
                  <span>{t.label}</span>
                  <span
                    className={`min-w-[20px] h-[18px] inline-flex items-center justify-center text-[10.5px] font-semibold px-1.5 rounded-full transition-colors ${
                      active ? "bg-primary text-primary-foreground" : "bg-muted-foreground/15 text-muted-foreground"
                    }`}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {tab === "mine" ? (
          <section>
            {loading ? (
              <div className="text-center text-sm text-muted-foreground py-10">Loading…</div>
            ) : mySkills.length === 0 ? (
              <div className="flex flex-col items-center text-center py-12 px-5 rounded-2xl border border-dashed border-border/50">
                <p className="text-[13px] text-muted-foreground mb-5">
                  No skills yet — pick how you want to start.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => navigate("/settings/skills/new")}
                    className="h-11 px-5 rounded-full bg-foreground text-background text-[13.5px] font-medium hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    Create with AI
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                    className="h-11 px-5 rounded-full border border-border bg-card text-foreground text-[13.5px] font-medium hover:border-foreground/40 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    Import from file
                  </button>
                  <button
                    onClick={() => setTab("library")}
                    className="h-11 px-5 rounded-full border border-border bg-card text-foreground text-[13.5px] font-medium hover:border-foreground/40 active:scale-[0.98] transition-all"
                  >
                    Browse library
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {mySkills.map((s) => {
                  const enabled = s.is_enabled !== false;
                  return (
                    <div
                      key={s.id}
                      className={`group p-4 rounded-2xl border bg-card transition-all ${
                        enabled
                          ? "border-border/50 hover:border-border"
                          : "border-border/30 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[14.5px] font-semibold truncate">{s.name}</h4>
                          {s.description && (
                            <p className="text-[12.5px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">{s.description}</p>
                          )}
                          {s.triggers && s.triggers.length > 0 && (
                            <TriggerChips triggers={s.triggers} />
                          )}
                        </div>
                        <Switch checked={enabled} onCheckedChange={(v) => toggleEnabled(s, v)} />
                      </div>
                      <div className="flex justify-end gap-1 mt-2 -mb-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(s)}
                          className="text-[11.5px] flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="text-[11.5px] flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          <section>
            {librarySkills.length === 0 ? (
              <div className="text-center text-[13px] text-muted-foreground py-10 rounded-2xl border border-dashed border-border/50">
                The library is empty.
              </div>
            ) : (
              <div className="space-y-2">
                {librarySkills.map((s) => {
                  const exists = mySkills.some((m) => m.name === s.name);
                  return (
                    <div key={s.id} className="p-4 rounded-2xl border border-border/50 bg-card hover:border-border transition-all flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14.5px] font-semibold">{s.name}</h4>
                        {s.description && (
                          <p className="text-[12.5px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">{s.description}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={exists ? "outline" : "default"}
                        disabled={exists}
                        onClick={() => handleAddFromLibrary(s)}
                        className="shrink-0 rounded-full"
                      >
                        {exists ? "Added" : "Add"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
    </>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="Skills" subtitle="Tune the experts Megsy can switch into.">
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportZip(f); }}
        />
        <div className="max-w-3xl">{listBody}</div>
      </DesktopSettingsLayout>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {mobileHeader}
      <main className="max-w-3xl mx-auto px-4 mt-14 pb-24">{listBody}</main>
    </div>
  );
}

// ===========================================================================
// Composer (centered input like Files page)
// ===========================================================================
function ComposerBox({
  value, onChange, onSubmit, inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
}) {
  const localRef = useRef<HTMLTextAreaElement>(null);
  const ref = inputRef || localRef;
  useEffect(() => {
    const el = ref.current; if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  }, [value, ref]);

  return (
    <div className="relative rounded-3xl border border-border/60 bg-card shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)] focus-within:border-foreground/30 transition-colors">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && (typeof window === 'undefined' || window.innerWidth >= 768)) { e.preventDefault(); onSubmit(); }
        }}
        rows={1}
        placeholder="Describe the expert you want…"
        className="w-full resize-none bg-transparent outline-none text-[15px] leading-relaxed px-5 pt-4 pb-14 placeholder:text-muted-foreground/70"
      />
      <button
        onClick={onSubmit}
        disabled={!value.trim()}
        aria-label="Design skill"
        className="absolute right-3 bottom-3 h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-transform"
      >
        <ArrowUp className="w-4 h-4" />
      </button>
    </div>
  );
}

// ===========================================================================
// Conversational Skill Designer
// ===========================================================================
type ChatMsg = { role: "user" | "assistant"; content: string; draft?: any; summary?: string };

const STAGES = [
  "Reading your brief",
  "Picking the right voice",
  "Writing instructions",
  "Choosing tools & triggers",
  "Polishing the draft",
];

function SkillDesigner({
  draft, setDraft, onClose, onSave, saving, seedPrompt, onImportZip, importing,
  triggerInput, setTriggerInput, addTrigger, removeTrigger, toggleTool,
}: {
  draft: DraftSkill;
  setDraft: (d: DraftSkill) => void;
  onClose: () => void;
  onSave: (silent?: boolean) => void;
  saving: boolean;
  seedPrompt?: string;
  onImportZip: (file: File) => void;
  importing: boolean;
  triggerInput: string;
  setTriggerInput: (v: string) => void;
  addTrigger: () => void;
  removeTrigger: (t: string) => void;
  toggleTool: (n: string) => void;
}) {
  const isEdit = !!draft.id;
  const [messages, setMessages] = useState<ChatMsg[]>(() =>
    isEdit
      ? [{
          role: "assistant",
          content: `You're editing "${draft.name}". Tell me what you want to change — tone, expertise, tools, triggers — and I'll update the draft.`,
        }]
      : [{
          role: "assistant",
          content: "Hey! Tell me what kind of expert you want — for example: \"a YC pitch coach\" or \"a TikTok hooks copywriter\". I'll ask a couple of questions and build it.",
        }]
  );
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);
  // (preview is desktop-only, mobile users see only chat)
  const scrollRef = useRef<HTMLDivElement>(null);
  const seedSentRef = useRef(false);
  const zipInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  // Rotate through stage labels while waiting
  useEffect(() => {
    if (!thinking) { setStageIdx(0); return; }
    const id = setInterval(() => setStageIdx((i) => (i + 1) % STAGES.length), 1400);
    return () => clearInterval(id);
  }, [thinking]);

  const sendText = async (text: string) => {
    if (!text || thinking) return;
    const next: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setThinking(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-skill`;
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await resp.json();
      if (data.action === "draft" && data.skill) {
        const s = data.skill;
        setDraft({
          ...draft,
          name: s.name || draft.name,
          description: s.description || "",
          body: s.body || "",
          triggers: Array.isArray(s.triggers) ? s.triggers.map((t: string) => String(t).toLowerCase()) : [],
          enabled_tools: Array.isArray(s.enabled_tools) ? s.enabled_tools : [],
          preferred_model: s.preferred_model ?? null,
        });
        setMessages([...next, {
          role: "assistant",
          content: data.summary || `I've drafted "${s.name}". Open the preview to fine-tune anything, or hit Save.`,
          draft: s,
          summary: data.summary,
        }]);
      } else {
        setMessages([...next, { role: "assistant", content: data.message || "Could you tell me a bit more?" }]);
      }
    } catch {
      setMessages([...next, { role: "assistant", content: "Sorry — I hit an error. Try again?" }]);
    } finally {
      setThinking(false);
    }
  };

  const send = () => sendText(input.trim());

  // Auto-send the seed prompt from the hero composer
  useEffect(() => {
    if (seedSentRef.current) return;
    if (seedPrompt && seedPrompt.trim()) {
      seedSentRef.current = true;
      sendText(seedPrompt.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedPrompt]);

  const hasDraft = !!draft.name && !!draft.body;

  // Auto-save: debounce while user has a valid draft
  const lastSavedRef = useRef<string>("");
  useEffect(() => {
    if (!hasDraft) return;
    const sig = JSON.stringify({
      n: draft.name, d: draft.description, b: draft.body,
      t: draft.triggers, e: draft.enabled_tools, m: draft.preferred_model,
    });
    if (sig === lastSavedRef.current) return;
    const id = setTimeout(() => {
      lastSavedRef.current = sig;
      onSave(true);
    }, 1500);
    return () => clearTimeout(id);
  }, [draft.name, draft.description, draft.body, draft.triggers, draft.enabled_tools, draft.preferred_model, hasDraft, onSave]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={onClose} className="p-2 -ml-2 rounded-xl hover:bg-accent/60 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="text-[11.5px] text-muted-foreground tabular-nums">
            {saving ? "Saving…" : hasDraft ? "Saved" : ""}
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-5xl w-full mx-auto grid lg:grid-cols-[1fr_400px] gap-0 lg:gap-6 lg:px-4 lg:py-4">
        {/* Chat panel */}
        <section className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-5rem)] lg:rounded-2xl lg:border lg:border-border/30 lg:bg-card/30 flex">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "user" ? (
                  <div className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 bg-primary text-primary-foreground text-[14px] whitespace-pre-wrap leading-relaxed">
                    {m.content}
                  </div>
                ) : (
                  <div className="max-w-[92%] w-full">
                    <div className="flex items-start gap-2.5">
                      <div className="shrink-0 mt-0.5"><MegsyStar size={20} static /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] whitespace-pre-wrap text-foreground leading-relaxed">{m.content}</p>
                        {m.draft && (
                          <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[12px] font-medium">
                            Draft ready · {m.draft.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <AnimatePresence>
              {thinking && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2.5"
                >
                  <div className="shrink-0 mt-0.5"><MegsyStar size={20} static /></div>
                  <div className="flex-1">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={stageIdx}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.25 }}
                        className="text-[14px] font-semibold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent"
                      >
                        {STAGES[stageIdx]}…
                      </motion.p>
                    </AnimatePresence>
                    <div className="mt-1.5 flex gap-1">
                      {STAGES.map((_, i) => (
                        <span
                          key={i}
                          className={`h-1 rounded-full transition-all ${
                            i <= stageIdx ? "bg-primary w-6" : "bg-muted w-3"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="px-4 py-3 border-t border-border/30 bg-background/50">
            <div className="relative rounded-2xl border border-border/60 bg-card focus-within:border-foreground/30 transition-colors">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && (typeof window === 'undefined' || window.innerWidth >= 768)) { e.preventDefault(); send(); }
                }}
                rows={1}
                placeholder={hasDraft ? "Refine the skill — e.g. \"add SEO triggers\", \"make tone bolder\"…" : "Describe the expert you want…"}
                className="w-full resize-none bg-transparent outline-none text-[14px] leading-relaxed pl-12 pr-4 pt-3 pb-12 max-h-32 placeholder:text-muted-foreground/70"
              />
              <input
                ref={zipInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportZip(f); }}
              />
              <button
                type="button"
                onClick={() => zipInputRef.current?.click()}
                disabled={importing}
                aria-label="Import .zip"
                title="Import a SKILL.md .zip"
                className="absolute left-2.5 bottom-2.5 h-8 w-8 rounded-full hover:bg-accent/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                onClick={send}
                disabled={!input.trim() || thinking}
                className="absolute right-2.5 bottom-2.5 h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center disabled:opacity-30 hover:scale-105 active:scale-95 transition-transform"
                aria-label="Send"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Live draft preview / editor */}
        <aside className="h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-5rem)] overflow-y-auto px-4 lg:px-5 py-5 space-y-5 lg:rounded-2xl lg:border lg:border-border/30 lg:bg-card/30 hidden lg:block">
          {!hasDraft ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <MegsyStar size={36} static />
              <div className="text-[14px] font-semibold mt-4">Your skill will appear here</div>
              <p className="text-[12.5px] text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
                Chat with the designer. Once it's drafted you can fine-tune every field and save.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                <MegsyStar size={12} static /> Live draft
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Name</Label>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Description</Label>
                <Input
                  value={draft.description || ""}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Triggers</Label>
                <div className="flex gap-1.5 flex-wrap p-2 rounded-xl border border-border/50 bg-card min-h-[42px]">
                  {draft.triggers.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 text-[11.5px] px-2 py-0.5 rounded-full bg-primary/12 text-primary">
                      {t}
                      <button onClick={() => removeTrigger(t)} className="hover:bg-primary/25 rounded-full p-0.5">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={triggerInput}
                    onChange={(e) => setTriggerInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTrigger(); } }}
                    onBlur={addTrigger}
                    placeholder="add keyword…"
                    className="flex-1 min-w-[100px] bg-transparent outline-none text-[12.5px] px-1"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Instructions</Label>
                <Textarea
                  rows={10}
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  className="font-mono text-[12px] leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Tools</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {SKILL_TOOLS.map((tool) => {
                    const active = draft.enabled_tools.includes(tool.name);
                    return (
                      <button
                        key={tool.name}
                        onClick={() => toggleTool(tool.name)}
                        className={`text-left p-2 rounded-lg border transition-all ${active ? "bg-primary/10 border-primary/50" : "border-border/40 hover:border-border bg-card"}`}
                      >
                        <div className="text-[12px] font-medium">{tool.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5 pb-4">
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Preferred model</Label>
                <select
                  value={draft.preferred_model || "auto"}
                  onChange={(e) => setDraft({ ...draft, preferred_model: e.target.value })}
                  className="w-full h-10 rounded-xl border border-border/50 bg-card px-3 text-[13px] outline-none focus:border-primary/50"
                >
                  {SKILL_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function TriggerChips({ triggers }: { triggers: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 3;
  const shown = expanded ? triggers : triggers.slice(0, LIMIT);
  const hidden = triggers.length - LIMIT;
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {shown.map((t) => (
        <span key={t} className="text-[10.5px] px-2 py-0.5 rounded-full bg-muted/70 text-muted-foreground">
          {t}
        </span>
      ))}
      {hidden > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-[10.5px] px-2 py-0.5 rounded-full bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {expanded ? "Show less" : `+${hidden} more`}
        </button>
      )}
    </div>
  );
}
