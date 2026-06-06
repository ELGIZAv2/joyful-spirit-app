// Curated Figma template registry — used by the AI builder to inject
// real design references (frames + images) into generated projects.
// Each entry maps a category to a Figma file key + tags so the agent
// can pick the right reference for the user's intent.

export type FigmaTemplate = {
  key: string;            // Figma file key (from URL)
  name: string;
  category:
    | "saas-landing"
    | "ai-landing"
    | "dashboard"
    | "pricing"
    | "widgets"
    | "ios-glass"
    | "mobile-app"
    | "ai-mobile"
    | "product-launch"
    | "visionos"
    | "background-3d";
  tags: string[];
  url: string;
};

export const FIGMA_TEMPLATES: FigmaTemplate[] = [
  // ---------- SaaS landing pages ----------
  { key: "no2Q6u0loCaiC7FPhyDJTD", name: "Modern Clean SaaS Company", category: "saas-landing", tags: ["saas", "clean", "modern"], url: "https://www.figma.com/site/no2Q6u0loCaiC7FPhyDJTD" },
  { key: "CzsRsAmxqJ8JpOumdMbzV5", name: "SaaS Landing Page Template", category: "saas-landing", tags: ["saas", "landing"], url: "https://www.figma.com/design/CzsRsAmxqJ8JpOumdMbzV5" },
  { key: "YkEvvcKyZO4tozfdmFIJ4s", name: "Launch UI – Landing Page Templates", category: "saas-landing", tags: ["launch", "components"], url: "https://www.figma.com/design/YkEvvcKyZO4tozfdmFIJ4s" },
  { key: "jN3uicWVHNv2UD3f89CpYw", name: "Brainwave.io – Landing Page UI Kit", category: "saas-landing", tags: ["saas", "creative", "app"], url: "https://www.figma.com/design/jN3uicWVHNv2UD3f89CpYw" },
  { key: "IyL95zxHjogQGNvvP6hNwi", name: "Cloudhub SaaS Website Template", category: "saas-landing", tags: ["saas", "cloud"], url: "https://www.figma.com/design/IyL95zxHjogQGNvvP6hNwi" },
  { key: "XpGRyPkVEV6at5J1VjcGsg", name: "SaaS websites collection", category: "saas-landing", tags: ["saas", "collection"], url: "https://www.figma.com/design/XpGRyPkVEV6at5J1VjcGsg" },
  { key: "jCWTUT2exmiKKpRSb5qUps", name: "Modern Product Launch", category: "product-launch", tags: ["launch", "product"], url: "https://www.figma.com/site/jCWTUT2exmiKKpRSb5qUps" },

  // ---------- AI agents / AI tools ----------
  { key: "55K4XdPCxNZaEubsMkpgBc", name: "100+ AI Tools Website Inspiration", category: "ai-landing", tags: ["ai", "agents", "saas"], url: "https://www.figma.com/design/55K4XdPCxNZaEubsMkpgBc" },
  { key: "8wlaQdRTSxFcvcKczvRQoJ", name: "Present.Ai", category: "ai-landing", tags: ["ai", "presentation"], url: "https://www.figma.com/design/8wlaQdRTSxFcvcKczvRQoJ" },
  { key: "c2kpwUEtP7Kap3pTJzWoKG", name: "AI Agent Chat Apps UI Kit", category: "ai-landing", tags: ["ai", "chat", "agent"], url: "https://www.figma.com/design/c2kpwUEtP7Kap3pTJzWoKG" },
  { key: "Hxp9JPi8acpW1O1r4vJ59v", name: "Nerve AI – App Showcase", category: "ai-landing", tags: ["ai", "showcase"], url: "https://www.figma.com/design/Hxp9JPi8acpW1O1r4vJ59v" },

  // ---------- Dashboards ----------
  { key: "u5iHoIonmGUyEIBTbGa4GW", name: "DashStack Admin Dashboard UI Kit", category: "dashboard", tags: ["admin", "dashboard"], url: "https://www.figma.com/design/u5iHoIonmGUyEIBTbGa4GW" },
  { key: "byJNxpGc7LTKrNzLqY5qAT", name: "SAAS Dashboard", category: "dashboard", tags: ["saas", "dashboard"], url: "https://www.figma.com/design/byJNxpGc7LTKrNzLqY5qAT" },
  { key: "sts4PbLgGK0rh8LyqzI9Ow", name: "Aerten Web App", category: "dashboard", tags: ["webapp", "admin"], url: "https://www.figma.com/design/sts4PbLgGK0rh8LyqzI9Ow" },

  // ---------- Widgets / cards / pricing ----------
  { key: "jt76Xcqn5LZDZtFwrEFWQh", name: "Widgets / Graphs / Cards / Products", category: "widgets", tags: ["widgets", "cards", "graphs"], url: "https://www.figma.com/design/jt76Xcqn5LZDZtFwrEFWQh" },
  { key: "fycWv2zgFtooRDnIrDfnqD", name: "Pricing Model / Pricing Table", category: "pricing", tags: ["pricing", "table"], url: "https://www.figma.com/design/fycWv2zgFtooRDnIrDfnqD" },

  // ---------- iOS / glass / VisionOS ----------
  { key: "7nxykDLB9mM9ES71UNRXsH", name: "iOS 16 UI Kit for Figma", category: "ios-glass", tags: ["ios", "uikit"], url: "https://www.figma.com/design/7nxykDLB9mM9ES71UNRXsH" },
  { key: "hRCwGJjQdOigEl9ePaPXCb", name: "iOS 26 Safari UI / Keyboards", category: "ios-glass", tags: ["ios26", "glass", "safari"], url: "https://www.figma.com/design/hRCwGJjQdOigEl9ePaPXCb" },
  { key: "flHypcVlnFMUJYn14KIAqk", name: "Apple VisionOS Concept (Airbnb)", category: "visionos", tags: ["visionos", "glass", "spatial"], url: "https://www.figma.com/design/flHypcVlnFMUJYn14KIAqk" },

  // ---------- Mobile apps ----------
  { key: "uiPGtcbzFEm3PVDuOP12Md", name: "Airtable Apps UI Kit", category: "mobile-app", tags: ["mobile", "airtable"], url: "https://www.figma.com/design/uiPGtcbzFEm3PVDuOP12Md" },
  { key: "sRhnHqj7Ydt3Jv50QZVgx5", name: "Food / Coffee Delivery App", category: "mobile-app", tags: ["food", "delivery", "mobile"], url: "https://www.figma.com/design/sRhnHqj7Ydt3Jv50QZVgx5" },
  { key: "Kj66WOYtmTTIhEtqml0swP", name: "Sonic AI Voice Generator (Free)", category: "ai-mobile", tags: ["ai", "voice", "mobile"], url: "https://www.figma.com/design/Kj66WOYtmTTIhEtqml0swP" },
  { key: "O8oD9SmTwH6DwQEdCuJaLo", name: "Sonic AI Voice Generator v1.0", category: "ai-mobile", tags: ["ai", "voice", "mobile"], url: "https://www.figma.com/design/O8oD9SmTwH6DwQEdCuJaLo" },
  { key: "Hps1dCNFlg9jmMOEa8g5fA", name: "AIChefMate Recipe App", category: "ai-mobile", tags: ["ai", "recipe", "mobile"], url: "https://www.figma.com/design/Hps1dCNFlg9jmMOEa8g5fA" },
  { key: "WHcCsQexuLsYNkJollSnJy", name: "Real Estate Mobile UI", category: "mobile-app", tags: ["realestate", "mobile"], url: "https://www.figma.com/design/WHcCsQexuLsYNkJollSnJy" },
  { key: "jfLm1s84EqMP9gh0sNTXcJ", name: "AI Fitness & Health App UI Kit", category: "ai-mobile", tags: ["ai", "fitness", "health", "mobile"], url: "https://www.figma.com/design/jfLm1s84EqMP9gh0sNTXcJ" },

  // ---------- Backgrounds ----------
  { key: "qBKMG9y7R830GhqC7RDvcw", name: "3D Visual Backgrounds (High-Res)", category: "background-3d", tags: ["3d", "background", "hero"], url: "https://www.figma.com/design/qBKMG9y7R830GhqC7RDvcw" },
];

/** Pick the best-matching templates for a free-text user intent. */
export function pickFigmaTemplates(intent: string, limit = 3): FigmaTemplate[] {
  const q = intent.toLowerCase();
  const scored = FIGMA_TEMPLATES.map((t) => {
    let score = 0;
    for (const tag of t.tags) if (q.includes(tag)) score += 3;
    if (q.includes(t.category.replace("-", " "))) score += 2;
    if (q.includes(t.name.toLowerCase().split(" ")[0])) score += 1;
    return { t, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((s) => s.score > 0).slice(0, limit).map((s) => s.t);
  // Fallback: always return at least one SaaS landing template.
  if (top.length === 0) {
    return FIGMA_TEMPLATES.filter((t) => t.category === "saas-landing").slice(0, limit);
  }
  return top;
}
