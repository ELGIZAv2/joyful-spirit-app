import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Globe, Code2, Database, Wand2 } from "lucide-react";
import { Helmet } from "react-helmet-async";

const TYPING_PROMPTS = [
  "Build me an admin dashboard for an e‑commerce store with sales charts…",
  "Create a landing page for an AI app with dark mode…",
  "A task editor with drag & drop and multiple lists…",
  "A cinematic photographer portfolio…",
];

const EXAMPLES = [
  { tag: "SaaS", title: "Smart dashboard", desc: "Live analytics and charts." },
  { tag: "Store", title: "E‑commerce", desc: "Cart, checkout, product management." },
  { tag: "Portfolio", title: "Creative portfolio", desc: "Cinematic grid with smooth transitions." },
  { tag: "Tools", title: "Productivity tools", desc: "Task and note editors." },
  { tag: "AI", title: "Chat bot", desc: "Live streamed responses and tools." },
  { tag: "Internal", title: "Team tool", desc: "CRUD forms and reports." },
];

const FEATURES = [
  { icon: Zap, title: "Live preview", desc: "Every edit appears instantly in a live frame." },
  { icon: Globe, title: "One‑click publish", desc: "Public URL in seconds, no setup." },
  { icon: Code2, title: "Clean code", desc: "React + TS + Tailwind + shadcn." },
  { icon: Wand2, title: "Framer Motion", desc: "Animation built in by default." },
  { icon: Database, title: "Supabase ready", desc: "Auth and DB from the first moment." },
  { icon: Sparkles, title: "Edit the code", desc: "Open any file and tweak it directly." },
];

export default function CodeLandingPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPlaceholderIdx((i) => (i + 1) % TYPING_PROMPTS.length), 3200);
    return () => clearInterval(id);
  }, []);

  const start = () => {
    const seed = prompt.trim();
    navigate(seed ? `/code/new?prompt=${encodeURIComponent(seed)}` : "/code/new");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-white/20">
      <Helmet>
        <title>Megsy Code — Build your app from one prompt</title>
        <meta name="description" content="Megsy Code turns your ideas into real React apps with live preview and one‑click publish, powered by AI." />
      </Helmet>

      {/* Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
        .font-display { font-family: 'Playfair Display', serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .shimmer::after { content:""; position:absolute; inset:0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent); animation: shimmer 2.4s infinite; }
      `}</style>

      <div className="font-body">
        {/* Nav */}
        <nav className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
            <Link to="/code" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <div className="w-3.5 h-3.5 bg-black rotate-45" />
              </div>
              <span className="font-display font-bold tracking-tight text-lg">Megsy Code</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link to="/" className="hidden md:inline-flex items-center gap-1 text-xs text-white/60 hover:text-white px-3 py-1.5 rounded-full">
                Back to Megsy <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button onClick={start} className="bg-white text-black px-4 py-1.5 rounded-full text-sm font-bold active:scale-95 transition-transform">
                Get started
              </button>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative px-4 md:px-6 pt-16 pb-12 max-w-5xl mx-auto">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 blur-[120px] rounded-full -z-10" />
          <div className="absolute top-32 -left-20 w-72 h-72 bg-indigo-500/10 blur-[120px] rounded-full -z-10" />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 text-[11px] text-white/50 border border-white/10 rounded-full px-3 py-1 mb-6">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Powered by AI · React + Vite + Tailwind
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-light leading-[1.05] mb-6">
              Build your apps <br />
              <span className="italic">with a magic touch</span>
            </h1>
            <p className="text-white/60 text-base md:text-lg max-w-xl leading-relaxed mb-8">
              Describe your idea in any language and Megsy Code will build a full React app with live preview and instant publish.
            </p>
          </motion.div>

          {/* Prompt composer */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="bg-[#111] border border-white/10 rounded-2xl p-4 md:p-5 shadow-2xl shadow-black/60 relative group"
          >
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) start(); }}
              className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-base md:text-lg placeholder-white/30 resize-none h-32 md:h-36 font-body"
              placeholder={TYPING_PROMPTS[placeholderIdx]}
            />
            <div className="flex flex-wrap gap-2 mb-4">
              {["React + Vite", "TypeScript", "Tailwind CSS", "shadcn/ui", "Framer Motion", "Supabase"].map((t) => (
                <span key={t} className="text-[11px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-white/60">{t}</span>
              ))}
            </div>
            <button
              onClick={start}
              className="w-full bg-white text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/90 transition-colors active:scale-[0.99]"
            >
              <span>Build the app now</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="mt-3 text-[11px] text-white/30 text-center">Press ⌘/Ctrl + Enter to start fast</div>
          </motion.div>
        </section>

        {/* Live Preview Mockup */}
        <section className="px-4 md:px-6 pb-8 max-w-5xl mx-auto">
          <div className="bg-[#111] rounded-t-2xl border-x border-t border-white/10 p-2.5 flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
            <div className="mx-auto text-[10px] text-white/30 font-mono tracking-wider">preview.megsy.code/my-app</div>
          </div>
          <div className="aspect-video bg-[#0f0f0f] border border-white/10 rounded-b-2xl relative overflow-hidden group">
            <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 gap-3 p-6 opacity-60">
              <div className="col-span-3 row-span-6 bg-white/5 rounded-lg border border-white/5" />
              <div className="col-span-9 row-span-1 bg-white/5 rounded-lg border border-white/5" />
              <div className="col-span-3 row-span-2 bg-white/5 rounded-lg border border-white/5 relative overflow-hidden shimmer" />
              <div className="col-span-3 row-span-2 bg-white/5 rounded-lg border border-white/5" />
              <div className="col-span-3 row-span-2 bg-white/5 rounded-lg border border-white/5" />
              <div className="col-span-9 row-span-3 bg-white/5 rounded-lg border border-white/5 relative overflow-hidden shimmer" />
            </div>
            <div className="absolute bottom-4 left-4 text-[10px] text-white/40 font-mono uppercase tracking-widest">Live Preview</div>
            <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-white/5 rounded-lg rotate-12 border border-white/10 backdrop-blur-sm" />
          </div>
        </section>

        {/* What you can build */}
        <section className="px-4 md:px-6 py-16 max-w-5xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl italic mb-2">What can you build?</h2>
          <p className="text-white/50 text-sm mb-8">Six ready patterns — the sky is the limit.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {EXAMPLES.map((ex, i) => (
              <motion.div
                key={ex.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className="bg-[#111] border border-white/5 hover:border-white/15 p-5 rounded-xl aspect-square flex flex-col justify-end cursor-pointer transition-colors"
              >
                <div className="text-[10px] text-white/40 mb-1 font-display italic uppercase tracking-widest">{ex.tag}</div>
                <div className="text-sm md:text-base font-medium">{ex.title}</div>
                <div className="text-xs text-white/40 mt-1">{ex.desc}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="px-4 md:px-6 py-12 max-w-5xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl mb-8">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-[#0d0d0d] border border-white/5 p-5 rounded-xl hover:border-white/15 transition-colors">
                <f.icon className="w-5 h-5 mb-3 text-white/70" strokeWidth={1.5} />
                <div className="text-sm font-semibold mb-1">{f.title}</div>
                <div className="text-xs text-white/50 leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="px-4 md:px-6 py-16 bg-white/[0.02] border-y border-white/5">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl mb-12 text-center">The build journey</h2>
            <div className="space-y-10 md:space-y-12">
              {[
                { n: "01", t: "Describe your idea", d: "Write what you want in any language, from the simplest component to the most complex system." },
                { n: "02", t: "Watch the magic", d: "Megsy Code writes the code and shows it in an instant live preview." },
                { n: "03", t: "Publish in one click", d: "When you're happy, publish your app to the web directly — no server complexity." },
              ].map((s) => (
                <div key={s.n} className="flex gap-5 md:gap-8 items-start">
                  <span className="font-display text-5xl md:text-6xl text-white/10 leading-none">{s.n}</span>
                  <div className="pt-1">
                    <h3 className="text-lg md:text-xl font-bold mb-2">{s.t}</h3>
                    <p className="text-sm md:text-base text-white/50 leading-relaxed max-w-md">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing teaser */}
        <section className="px-4 md:px-6 py-20 max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl mb-3">Choose your plan</h2>
          <p className="text-white/50 text-sm mb-12">Start free and upgrade when you need to.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="p-6 rounded-2xl border border-white/10 bg-[#0d0d0d]">
              <div className="text-xs text-white/40 mb-2 uppercase tracking-widest font-display italic">Hobby</div>
              <div className="text-3xl font-bold mb-1">Free</div>
              <div className="text-xs text-white/40 mb-6">For trials and small projects.</div>
              <button onClick={start} className="w-full py-3 rounded-lg border border-white/20 text-sm hover:bg-white/5">Start for free</button>
            </div>

            <div className="p-6 rounded-2xl border-2 border-white bg-white text-black relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-3 py-1 rounded-full">Most popular</div>
              <div className="text-xs opacity-60 mb-2 uppercase tracking-widest font-display italic">Pro</div>
              <div className="text-3xl font-bold mb-1">$20<span className="text-sm font-normal">/month</span></div>
              <div className="text-xs opacity-60 mb-6">Unlimited projects + custom publish.</div>
              <button onClick={start} className="w-full py-3 rounded-lg bg-black text-white text-sm font-bold">Subscribe now</button>
            </div>

            <div className="p-6 rounded-2xl border border-white/10 bg-[#0d0d0d]">
              <div className="text-xs text-white/40 mb-2 uppercase tracking-widest font-display italic">Team</div>
              <div className="text-3xl font-bold mb-1">$60<span className="text-sm font-normal text-white/40">/month</span></div>
              <div className="text-xs text-white/40 mb-6">Workspaces and priority support.</div>
              <button onClick={() => navigate("/pricing")} className="w-full py-3 rounded-lg border border-white/20 text-sm hover:bg-white/5">View details</button>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 md:px-6 pb-20 max-w-3xl mx-auto text-center">
          <div className="border border-white/10 rounded-3xl p-10 bg-gradient-to-b from-white/[0.04] to-transparent">
            <h2 className="font-display text-3xl md:text-5xl mb-4">Ready to build?</h2>
            <p className="text-white/50 mb-8">Your first app is just one sentence away.</p>
            <button onClick={start} className="bg-white text-black px-8 py-3.5 rounded-full font-bold inline-flex items-center gap-2 hover:bg-white/90 active:scale-95 transition">
              Start your first project
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-12 border-t border-white/5 text-center">
          <div className="flex justify-center items-center gap-2 mb-5">
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
              <div className="w-3 h-3 bg-black rotate-45" />
            </div>
            <span className="font-display font-bold">Megsy Code</span>
          </div>
          <div className="flex justify-center gap-6 text-xs text-white/40 mb-6">
            <Link to="/terms" className="hover:text-white">Terms</Link>
            <Link to="/privacy" className="hover:text-white">Privacy</Link>
            <Link to="/contact" className="hover:text-white">Contact</Link>
          </div>
          <div className="text-[10px] text-white/20">© 2026 Megsy AI. Made with love.</div>
        </footer>
      </div>
    </div>
  );
}
