import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Loader2, FileCode, Component, Image as ImageIcon, Palette, Sparkles, Layout, Wallpaper } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Category = "templates" | "components" | "assets" | "design" | "skills" | "landing" | "backgrounds";

interface Skill {
  id: string;
  title: string;
  content: string;
  enabled: boolean;
  sort_order: number;
  category: Category;
}

const CATS: { key: Category; label: string; icon: any }[] = [
  { key: "templates", label: "TEMPLATES", icon: FileCode },
  { key: "components", label: "COMPONENTS", icon: Component },
  { key: "assets", label: "ASSETS", icon: ImageIcon },
  { key: "design", label: "DESIGN.MD", icon: Palette },
  { key: "skills", label: "SKILLS", icon: Sparkles },
  { key: "landing", label: "LANDING", icon: Layout },
  { key: "backgrounds", label: "BACKGROUNDS", icon: Wallpaper },
];

export default function SePage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<Category>("skills");
  const [activeTab, setActiveTab] = useState<Category>("skills");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("megsy_code_skills")
      .select("id,title,content,enabled,sort_order,category")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setSkills((data as Skill[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!title.trim() || !content.trim()) return toast.error("Enter a title and content");
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return toast.error("Sign in first"); }
    const { error } = await supabase.from("megsy_code_skills").insert({
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
      category,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    setTitle(""); setContent("");
    toast.success("Added");
    load();
  };

  const toggle = async (s: Skill) => {
    setSkills((p) => p.map((x) => (x.id === s.id ? { ...x, enabled: !x.enabled } : x)));
    await supabase.from("megsy_code_skills").update({ enabled: !s.enabled }).eq("id", s.id);
  };
  const remove = async (id: string) => {
    setSkills((p) => p.filter((x) => x.id !== id));
    await supabase.from("megsy_code_skills").delete().eq("id", id);
  };
  const updateField = (id: string, patch: Partial<Skill>) =>
    setSkills((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const persistField = async (id: string, patch: Partial<Skill>) =>
    await supabase.from("megsy_code_skills").update(patch).eq("id", id);

  const counts = useMemo(() => {
    const map: Record<Category, { total: number; on: number }> = {
      templates: { total: 0, on: 0 }, components: { total: 0, on: 0 },
      assets: { total: 0, on: 0 }, design: { total: 0, on: 0 },
      skills: { total: 0, on: 0 }, landing: { total: 0, on: 0 },
      backgrounds: { total: 0, on: 0 },
    };
    for (const s of skills) {
      map[s.category].total += 1;
      if (s.enabled) map[s.category].on += 1;
    }
    return map;
  }, [skills]);

  const filtered = skills.filter((s) => s.category === activeTab);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-5 py-10 space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Megsy Skill</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            All items are grouped into a single skill called <b>Megsy</b> which the AI uses as its base.
          </p>
        </header>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {CATS.map((c) => {
            const Icon = c.icon;
            const isActive = activeTab === c.key;
            const { total, on } = counts[c.key];
            return (
              <button
                key={c.key}
                onClick={() => { setActiveTab(c.key); setCategory(c.key); }}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border/60 hover:border-border"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {c.label}
                <span className={`text-[10px] ${isActive ? "opacity-80" : "text-muted-foreground"}`}>
                  {on}/{total}
                </span>
              </button>
            );
          })}
        </div>

        {/* Add form */}
        <section className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Add new item</h2>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="px-3 py-1.5 rounded-lg border border-border/50 bg-background text-xs outline-none"
            >
              {CATS.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full px-4 py-2.5 rounded-xl border border-border/50 bg-background text-sm outline-none focus:border-primary/40"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Prompt text / content…"
            rows={5}
            className="w-full px-4 py-2.5 rounded-xl border border-border/50 bg-background text-sm outline-none focus:border-primary/40 resize-none"
          />
          <button
            onClick={add}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </button>
        </section>

        {/* List */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">
            {CATS.find((c) => c.key === activeTab)?.label}
          </h2>
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">No items in this section.</p>
          )}
          {filtered.map((s) => (
            <div key={s.id} className="rounded-2xl border border-border/60 bg-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={s.enabled}
                  onChange={() => toggle(s)}
                  className="w-4 h-4 accent-primary"
                />
                <input
                  value={s.title}
                  onChange={(e) => updateField(s.id, { title: e.target.value })}
                  onBlur={(e) => persistField(s.id, { title: e.target.value })}
                  className="flex-1 bg-transparent text-sm font-semibold outline-none"
                />
                <select
                  value={s.category}
                  onChange={(e) => {
                    const v = e.target.value as Category;
                    updateField(s.id, { category: v });
                    persistField(s.id, { category: v });
                  }}
                  className="px-2 py-1 rounded-lg border border-border/40 bg-background text-[11px] outline-none"
                >
                  {CATS.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => remove(s.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={s.content}
                onChange={(e) => updateField(s.id, { content: e.target.value })}
                onBlur={(e) => persistField(s.id, { content: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-border/40 bg-background text-xs leading-relaxed outline-none focus:border-primary/40 resize-none"
              />
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
