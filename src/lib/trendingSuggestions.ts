// Per-agent pool of trending prompts. We pick a random subset on each agent
// switch so suggestions feel fresh rather than static.

const POOLS: Record<string, string[]> = {
  slides: [
    "Series A pitch deck",
    "Q4 sales review",
    "AI strategy 2026",
    "Product launch keynote",
    "Company onboarding deck",
    "Marketing roadmap",
    "Investor update",
    "Quarterly OKRs presentation",
    "Brand guidelines deck",
    "Hackathon final pitch",
  ],
  "deep-research": [
    "Best AI agents in 2026",
    "Climate tech market report",
    "Notion vs Coda comparison",
    "Egypt e-commerce trends",
    "Top SaaS startups in MENA",
    "Latest LLM benchmarks",
    "AI regulations worldwide",
    "Web3 adoption in 2026",
  ],
  operator: [
    "Build a landing page for my startup",
    "Scrape product prices from Amazon",
    "Automate weekly report email",
    "Find leads on LinkedIn",
    "Create a Shopify storefront",
    "Plan a 7-day trip to Tokyo",
    "Set up a Telegram support bot",
  ],
  learning: [
    "Explain quantum computing simply",
    "How does a Transformer work",
    "Linear algebra crash course",
    "Teach me React hooks",
    "What is reinforcement learning",
  ],
  shopping: [
    "Best laptop under $1000",
    "Wireless earbuds 2026",
    "Gaming chair deals",
    "4K monitor for designers",
    "Air fryer comparison",
  ],
  images: [
    "Cinematic studio portrait",
    "Logo for a coffee brand",
    "Anime cyberpunk city",
    "Minimal product photo",
    "Vintage travel poster",
  ],
  videos: [
    "30s product ad",
    "Animated explainer video",
    "Cinematic drone reel",
    "Short reel for Instagram",
  ],
  resume: [
    "Senior Software Engineer resume",
    "Marketing Manager resume",
    "Data Analyst resume",
    "UX Designer resume",
  ],
  spreadsheet: [
    "Monthly budget tracker",
    "Sales pipeline sheet",
    "Inventory management",
    "Project Gantt chart",
  ],
  document: [
    "Business proposal",
    "Project plan document",
    "Privacy policy",
    "Press release draft",
  ],
  docs: [
    "NDA template",
    "Consulting agreement",
    "Research report",
    "Statement of Work",
  ],
  voice: [
    "Audiobook narration",
    "Podcast intro voice",
    "Friendly assistant voice",
  ],
};

export function getTrendingFor(agentId: string | null | undefined, count = 4): string[] {
  if (!agentId) return [];
  const pool = POOLS[agentId];
  if (!pool || pool.length === 0) return [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}