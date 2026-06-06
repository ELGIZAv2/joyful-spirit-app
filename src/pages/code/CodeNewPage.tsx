import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { BLANK_TEMPLATE } from "@/lib/codeRuntime";
import { toast } from "sonner";

export default function CodeNewPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [prompt, setPrompt] = useState(params.get("prompt") ?? "");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const urlPrompt = params.get("prompt") ?? "";
    if (urlPrompt && !prompt) setPrompt(urlPrompt);
  }, [params, prompt]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate("/auth?redirect=/code/new");
    });
  }, [navigate]);

  const create = async () => {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) {
      navigate("/auth?redirect=/code/new");
      return;
    }
    setCreating(true);
    try {
      const finalPrompt = prompt.trim() || (params.get("prompt") ?? "").trim();
      const finalName = name.trim() || finalPrompt.slice(0, 40) || "New project";
      const { data: project, error } = await supabase
        .from("code_projects")
        .insert({
          owner_id: uid,
          name: finalName,
          initial_prompt: finalPrompt || null,
          template: "blank",
          entry_file: "src/App.tsx",
        })
        .select()
        .single();
      if (error || !project) throw error || new Error("create_failed");

      // Seed template files
      const rows = BLANK_TEMPLATE.map((f) => ({ project_id: project.id, path: f.path, content: f.content }));
      const { error: fErr } = await supabase.from("code_project_files").insert(rows);
      if (fErr) throw fErr;

      // If a prompt was supplied, redirect with autosend flag
      const url = finalPrompt
        ? `/code/${project.id}/legacy?autosend=1`
        : `/code/${project.id}/legacy`;
      navigate(url);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Helmet><title>New project · Megsy Code</title></Helmet>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
        .font-display { font-family: 'Playfair Display', serif; }
      `}</style>

      <nav className="border-b border-white/5 px-4 md:px-6 py-3 flex items-center justify-between max-w-6xl mx-auto">
        <Link to="/code" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center"><div className="w-3 h-3 bg-black rotate-45" /></div>
          <span className="font-display font-bold tracking-tight">Megsy Code</span>
        </Link>
        <Link to="/code" className="text-xs text-white/50 hover:text-white inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-4 md:px-6 py-12 md:py-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl md:text-5xl font-light mb-3">New project</h1>
          <p className="text-white/50 text-sm mb-8">Describe your idea and we'll start building right away.</p>

          <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
            <label className="text-xs text-white/50 mb-2 block">Project name (optional)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My store dashboard"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm mb-4 focus:outline-none focus:border-white/30"
            />

            <label className="text-xs text-white/50 mb-2 block">Describe what you want to build</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Build me a dark‑mode landing page for an online store with a hero and a products section…"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-3 text-base h-40 resize-none focus:outline-none focus:border-white/30"
            />

            <button
              onClick={create}
              disabled={creating}
              className="mt-5 w-full bg-white text-black py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] transition"
            >
              {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <>Create project <ArrowLeft className="w-4 h-4 rotate-180" /></>}
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
