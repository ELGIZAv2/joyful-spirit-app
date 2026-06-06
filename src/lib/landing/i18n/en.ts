import type { LandingContent } from "./types";

const en: LandingContent = {
  meta: {
    title: "Megsy AI — Chat, Slides, Images, Videos & Code",
    description: "All-in-one AI platform: 80+ models for chat, slides, deep research, image & video generation, and full-stack app building.",
    keywords: "AI platform, ChatGPT alternative, AI image generator, AI video generator, AI slides, deep research, full-stack AI builder, Nano Banana Pro, GPT-Image 2, Gemini 3 Pro, Veo 3.1",
    ogLocale: "en_US",
  },
  hero: {
    h1Pre: "ONE AI. EVERY CREATIVE",
    h1Highlight: "TOOL YOU NEED.",
    subtitle: "Chat, slides, deep research, images, videos, cinema, lip-sync, and full-stack apps — built on the world's best models, unified into one workspace.",
    ctaPrimary: "Start Creating — It's Free",
    ctaSecondary: "API Platform",
  },
  chatModels: {
    kicker: "MEGSY CHAT",
    title: "ONE CHAT.",
    titleHighlight: "EVERY MODEL.",
    subtitle: "Megsy intelligently routes your message to the best model — or pick your favorite manually. Switch mid-conversation without losing context.",
    items: [
      { name: "Megsy",       tag: "Default · Smart Router", description: "Picks the perfect model for every prompt. Free to use." },
      { name: "GPT-5",       tag: "OpenAI",                 description: "Best-in-class reasoning, coding, and long-context writing." },
      { name: "Gemini 2.5 Pro", tag: "Google",              description: "1M-token context, native image & file understanding." },
      { name: "Grok",        tag: "xAI",                    description: "Real-time web knowledge with a witty, uncensored tone." },
      { name: "DeepSeek",    tag: "Open-source",            description: "Cost-efficient reasoning model for heavy workloads." },
    ],
    modesTitle: "Specialized Modes",
    modes: [
      { name: "Learning Mode",  description: "Step-by-step explanations, quizzes, and study cards for any topic." },
      { name: "Docs Mode",      description: "Professional reports, contracts, research papers and templates." },
      { name: "Deep Research",  description: "Autonomous multi-source research with sourced citations." },
      { name: "Slides",         description: "Generate full presentations with images, charts, and themes." },
    ],
  },
  imageModels: {
    kicker: "IMAGE MODELS",
    title: "PIXEL-PERFECT",
    titleHighlight: "IMAGE GENERATION.",
    subtitle: "Five flagship models plus 20+ pro tools — face swap, headshots, background removal, relight, cartoonify, and more.",
    items: [
      { name: "Nano Banana Pro",   cost: "4 MC",  description: "Photoreal detail, consistent characters, and brand style at studio quality." },
      { name: "Nano Banana 2",     cost: "3 MC",  description: "Next-gen quality with state-of-the-art hands, text, and anatomy." },
      { name: "GPT-Image 2",       cost: "5 MC",  description: "OpenAI's flagship image model — perfect typography and complex scenes." },
      { name: "Gemini 3 Pro Image",cost: "5 MC",  description: "Google's top-tier image generator with cinematic composition and lighting." },
      { name: "Nano Banana",       cost: "2 MC",  description: "Lightning-fast generation for ideation and high-volume iteration." },
    ],
  },
  codeModels: {
    kicker: "MEGSY BUILD",
    title: "PROMPT TO",
    titleHighlight: "FULL-STACK APP.",
    subtitle: "Describe what you want. Megsy Build generates the React + Tailwind frontend, the database, the auth, the API — and deploys it.",
    steps: [
      { title: "Code",     description: "Production-ready React, TypeScript and Tailwind with clean architecture." },
      { title: "Cloud",    description: "Database, storage, edge functions and auth — wired in automatically." },
      { title: "Speed",    description: "Lighthouse-optimized builds, lazy loading, and image compression baked in." },
      { title: "Security", description: "RLS policies, secret management, and dependency scans on every change." },
      { title: "Publish",  description: "One-click deploy to your custom domain with SSL and CDN included." },
    ],
  },
  howItWorks: {
    title: "GET STARTED",
    titleHighlight: "WITH MEGSY",
    subtitle: "From signup to deployment in five simple steps.",
    steps: [
      { title: "Create your account",  description: "Sign up in seconds and grab free credits to explore every model right away." },
      { title: "Choose your tool",     description: "Chat, Image Studio, Video, Cinema, Slides, Docs, Builder — pick your workspace." },
      { title: "Pick your model",      description: "80+ models from OpenAI, Google, Black Forest Labs, xAI and more." },
      { title: "Create & iterate",     description: "Generate, edit, upscale, restyle. Megsy keeps every version in your library." },
      { title: "Export & deploy",      description: "Download in any format, publish to a custom domain, or share to social." },
    ],
  },
  cta: {
    line1: "TRUSTED BY",
    line2: "LEADING CREATORS",
    subtitle: "Millions of creators and the world's most innovative teams trust Megsy to ship faster with polish and control.",
    button: "Start generating",
  },
  faq: {
    title: "FAQs",
    subtitle: "Everything you need to know about Megsy.",
    items: [
      { q: "What is Megsy?", a: "Megsy is an all-in-one AI workspace that unifies 80+ models for chat, slides, deep research, images, videos, cinema, lip-sync and full-stack code generation — in one interface, one credit system." },
      { q: "Which AI models are included?", a: "Chat: Megsy, GPT-5.5, Gemini 3 Pro, Claude 4.5, Grok 4, DeepSeek. Images: Nano Banana Pro, Nano Banana 2, GPT-Image 2, Gemini 3 Pro Image. Video: Veo 3.1, Kling 3.0 Pro, Runway Gen-4, Hunyuan. Plus voice, lip-sync, and builder models — all in one subscription." },
      { q: "How does the MC credit system work?", a: "MC (Megsy Credits) is the platform's currency. Chat is free; image, video, and tool runs cost a small amount of MC depending on the model. Code builds cost 5 MC. Credits come with every Starter, Pro, or Elite plan." },
      { q: "What plans are available?", a: "Starter ($9/mo · 80 MC), Pro ($29/mo · 280 MC, API + social publishing) and Elite ($59/mo · 480 MC, webhooks + dedicated support) and Business ($149/mo · 1,480 MC, dedicated infrastructure + SLA). All plans cover commercial use, image & video gen, code, and GitHub sync." },
      { q: "Can I use Megsy in my language?", a: "Yes — Megsy understands and generates in 50+ languages including Arabic, Spanish, French, German, Portuguese, Chinese, Japanese, Hindi, and many more." },
      { q: "Is there an API?", a: "Yes. Pro and Elite plans include a developer API for image generation, video creation, chat, and tools. Webhooks are available on Elite." },
      { q: "Can I publish my Megsy Build app?", a: "Yes. Megsy Build ships your full-stack app to a managed cloud, with custom domain, SSL, edge cache, and database all wired in — no DevOps required." },
    ],
  },
};

export default en;
