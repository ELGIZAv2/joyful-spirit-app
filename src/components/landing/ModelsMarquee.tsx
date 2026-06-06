import { motion } from "framer-motion";

const services = [
  "AI Chat", "Voice Chat", "Memory & Context", "Multi-Model Access", "Conversation History", "System Prompts",
  "Image Generation", "Image Editing", "Background Removal", "Upscaling", "Style Transfer", "Text to Image",
  "Video Generation", "Video Animation", "Image to Video", "Text to Video", "Video Editing",
  "File Analysis", "Document Summary", "PDF Parsing", "Data Extraction", "Spreadsheet Analysis", "OCR",
  "Code Generation", "Code Review", "One-Click Deploy", "Real-Time Preview", "Vercel Deploy", "Bug Fixing", "Full-Stack Apps",
  "Web Search", "Deep Research", "News Search", "Academic Search",
  "AI Agents", "Task Automation", "Email Sending", "Telegram Bot", "Notion", "Composio", "Translation", "Scheduling", "API Access", "Webhooks", "Workflow Automation",
];

const providers = [];

const ModelsMarquee = () => {
  const items = [...services, ...services];

  return (
    <section id="models" className="relative overflow-hidden py-12 md:py-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="mb-6 px-6 text-center"
      >
        <p className="mx-auto max-w-xl text-base text-muted-foreground md:text-lg">
          From freelancers to global teams, Megsy is trusted to turn ideas into polished, professional work.
        </p>
      </motion.div>

      {/* Logos row */}
      <div className="mx-auto mb-10 flex max-w-5xl items-center justify-center gap-4 px-4 md:mb-16 md:gap-20 md:px-6">
        {/* Providers removed */}
      </div>

      {/* Services heading */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="mb-12 px-6 text-center"
      >
        <h2 className="font-display text-3xl font-black uppercase tracking-tighter text-foreground md:text-8xl">
          EVERYTHING YOU{" "}
          <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">NEED</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          All-in-one AI platform — chat, create, code, and automate.
        </p>
      </motion.div>

      {/* Row 1 */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative mb-4"
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-background to-transparent" />
        <div className="landing-marquee">
          <div className="landing-marquee-track">
            {items.map((s, i) => (
              <span key={i} className="inline-flex whitespace-nowrap px-4 py-2 text-sm font-bold uppercase tracking-wider text-muted-foreground/60">
                {s}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Row 2 reverse */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.35 }}
        className="relative"
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-background to-transparent" />
        <div className="landing-marquee">
          <div className="landing-marquee-track-reverse">
            {[...items].reverse().map((s, i) => (
              <span key={i} className="inline-flex whitespace-nowrap px-4 py-2 text-sm font-bold uppercase tracking-wider text-muted-foreground/60">
                {s}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default ModelsMarquee;
