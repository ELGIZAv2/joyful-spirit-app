// Comparison page data — Megsy vs other AI tools. Tuned for SEO and honest framing.

export interface ComparisonRow {
  feature: string;
  megsy: string;
  competitor: string;
  winner: "megsy" | "competitor" | "tie";
}

export interface Comparison {
  slug: string;
  competitorName: string;
  competitorTagline: string;
  title: string;
  description: string;
  intro: string;
  honestNote: string;
  bestFor: { megsy: string[]; competitor: string[] };
  rows: ComparisonRow[];
  verdict: string;
}

export const COMPARISONS: Comparison[] = [
  {
    slug: "chatgpt",
    competitorName: "ChatGPT",
    competitorTagline: "OpenAI's conversational AI",
    title: "Megsy AI vs ChatGPT — Which One Should You Pay For in 2026?",
    description:
      "Honest comparison of Megsy AI and ChatGPT across chat quality, image generation, video, code, pricing, and workflow. No marketing spin.",
    intro:
      "ChatGPT is the most popular AI assistant on the planet. Megsy is an all-in-one creative workspace built around unified chat, image, video, code, and research. They overlap in the chat layer — but the rest of the surface area is very different. Here's where each one actually wins.",
    honestNote:
      "We make Megsy, so we're biased. But ChatGPT is a great product and we use it ourselves. The right answer for you depends entirely on what you actually do every day.",
    bestFor: {
      megsy: [
        "Creators who generate images and video weekly",
        "Solo founders consolidating 3+ AI subscriptions",
        "Teams that want one credit balance across modes",
        "Anyone building short-form content end-to-end",
      ],
      competitor: [
        "Power users who live in chat all day",
        "Developers who use the ChatGPT API for products",
        "People who want voice mode on mobile constantly",
        "Researchers who need the absolute best reasoning model",
      ],
    },
    rows: [
      { feature: "Conversational chat", megsy: "Routes across 36+ models incl. GPT, Claude, Gemini", competitor: "GPT-5 family only", winner: "megsy" },
      { feature: "Best-in-class reasoning", megsy: "Available via Deep Research mode", competitor: "Native o-series models", winner: "competitor" },
      { feature: "Image generation", megsy: "10+ models incl. Flux, Imagen, GPT-Image, Nano Banana", competitor: "GPT-Image only", winner: "megsy" },
      { feature: "Video generation", megsy: "Sora, Veo, Kling, Hailuo, Wan", competitor: "Sora (in Plus tier, limited)", winner: "megsy" },
      { feature: "Code & app building", megsy: "Full app builder + sandbox deploy", competitor: "Code interpreter in chat", winner: "megsy" },
      { feature: "Voice mode", megsy: "Not available", competitor: "Excellent on mobile", winner: "competitor" },
      { feature: "Custom GPTs / Skills", megsy: "Skills system with tools", competitor: "GPT Store ecosystem", winner: "tie" },
      { feature: "Starting price", megsy: "Free tier + flexible credits", competitor: "$20/mo Plus", winner: "tie" },
      { feature: "Project memory", megsy: "Persistent across modes", competitor: "Within a single chat or memory", winner: "megsy" },
      { feature: "Free tier usage", megsy: "Daily free credits", competitor: "Limited GPT-5 messages", winner: "megsy" },
    ],
    verdict:
      "If chat is 90% of your AI usage, ChatGPT is still the cleanest choice. If you generate images, video, or want to build apps even occasionally, Megsy is dramatically cheaper than stacking ChatGPT + Midjourney + Runway separately — and the unified context makes complex projects much faster to ship.",
  },
  {
    slug: "midjourney",
    competitorName: "Midjourney",
    competitorTagline: "The image generator with the strongest aesthetic",
    title: "Megsy AI vs Midjourney — Is the Discord-Free Alternative Finally Good?",
    description:
      "Comparing Megsy's image generation (Flux, Imagen, GPT-Image, Nano Banana) with Midjourney v7. Quality, control, workflow, and price.",
    intro:
      "Midjourney built the best-looking AI image model on the market by being opinionated. Megsy gives you 10+ image models in one workspace with no Discord required. So which actually produces better images — and which fits a real creative workflow?",
    honestNote:
      "Midjourney is genuinely the gold standard for stylized imagery. Megsy wins on workflow and breadth. Honest split.",
    bestFor: {
      megsy: [
        "Creators who also do video, chat, or code",
        "People who hate Discord",
        "Anyone iterating with images inside a larger project",
        "Teams that need API-style usage without the Midjourney API tier",
      ],
      competitor: [
        "Pure illustrators chasing one specific aesthetic",
        "Artists who love Midjourney's remix community",
        "Concept artists where 5% quality matters",
      ],
    },
    rows: [
      { feature: "Image model selection", megsy: "10+ models — Flux Pro, Imagen 3, GPT-Image, Nano Banana", competitor: "Midjourney v7 only", winner: "megsy" },
      { feature: "Out-of-the-box aesthetic", megsy: "Depends on model", competitor: "Industry-leading", winner: "competitor" },
      { feature: "Web interface", megsy: "Native, fast, mobile-friendly", competitor: "Native web app (2024+)", winner: "tie" },
      { feature: "Discord requirement", megsy: "None", competitor: "Optional, but core community", winner: "megsy" },
      { feature: "Image editing tools", megsy: "20+ tools: inpaint, bg remove, upscale, relight…", competitor: "Vary Region, Pan, Zoom", winner: "megsy" },
      { feature: "Aspect ratios", megsy: "Up to 21:9, custom sizes", competitor: "Standard set", winner: "megsy" },
      { feature: "Resolution", megsy: "Up to 4K via upscaler", competitor: "Up to 2K native", winner: "megsy" },
      { feature: "Style consistency", megsy: "Reference images + brand kit", competitor: "Style refs (--sref)", winner: "tie" },
      { feature: "Pricing", megsy: "Pay-as-you-go credits", competitor: "$10–$120/mo subscription", winner: "megsy" },
      { feature: "Other AI modes", megsy: "Chat, video, code, research", competitor: "Image only", winner: "megsy" },
    ],
    verdict:
      "If you want one specific Midjourney look and you do nothing else, stay on Midjourney. If you want flexibility across multiple image models, integrated editing tools, and the ability to use chat, video, and code in the same workspace — Megsy is the better bet for almost every creator workflow.",
  },
  {
    slug: "lovable",
    competitorName: "Lovable",
    competitorTagline: "AI app builder for production web apps",
    title: "Megsy AI vs Lovable — Which AI Builder Is Right for Your Project?",
    description:
      "Megsy and Lovable both let you build apps by chatting. Here's how they differ on app complexity, deployment, pricing, and what comes with the platform.",
    intro:
      "Lovable is a focused AI software engineer — chat with it, and it builds and deploys a production React app. Megsy includes an app builder but also covers chat, image, video, and research in the same workspace. Different bets, different fits.",
    honestNote:
      "Lovable is purpose-built for app development and goes deeper there. Megsy spreads wider across creative work. The right pick depends on whether you're shipping apps or shipping content.",
    bestFor: {
      megsy: [
        "Creators who also need image/video/research",
        "Founders prototyping a landing + content + app together",
        "Teams that want one tool covering most AI work",
      ],
      competitor: [
        "Developers building production web apps",
        "Teams that need polished deploys with custom domains",
        "Anyone integrating Supabase, Stripe, Auth deeply",
      ],
    },
    rows: [
      { feature: "App building", megsy: "Sandboxed builder, web apps", competitor: "Full-stack with backend integrations", winner: "competitor" },
      { feature: "Chat / writing", megsy: "Multi-model chat across 36+ engines", competitor: "Coding-focused chat", winner: "megsy" },
      { feature: "Image generation", megsy: "10+ models, full editing suite", competitor: "Asset generation for apps only", winner: "megsy" },
      { feature: "Video generation", megsy: "Sora, Veo, Kling, Hailuo", competitor: "Not available", winner: "megsy" },
      { feature: "Deployment", megsy: "Sandbox preview + share links", competitor: "Production deploy + custom domains", winner: "competitor" },
      { feature: "Backend integrations", megsy: "Limited", competitor: "Supabase, Stripe, Auth, etc.", winner: "competitor" },
      { feature: "Free tier", megsy: "Daily credits across all modes", competitor: "Limited daily messages", winner: "tie" },
      { feature: "Pricing model", megsy: "Unified credits", competitor: "Message-based plans", winner: "tie" },
    ],
    verdict:
      "If you're shipping a real SaaS or web app to production, Lovable is the more focused tool and goes deeper in the right places. If you're a creator or solo founder building landing pages, content, and a simple app in the same week, Megsy covers more of that surface area in one place.",
  },
];

export const getComparison = (slug: string) => COMPARISONS.find((c) => c.slug === slug);
