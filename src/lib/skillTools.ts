// Catalog of tool names that a Skill can enable. Names match the tool names
// used by the chat edge function.
export interface SkillToolOption {
  name: string;
  label: string;
  description: string;
}

export const SKILL_TOOLS: SkillToolOption[] = [
  { name: "WEB_SEARCH", label: "Web Search", description: "Search the live web for fresh information" },
  { name: "FETCH_URL", label: "Read URL", description: "Open a specific page and read its content" },
  { name: "BROWSE_WEBSITE", label: "Browse Website", description: "Use a real browser for interactive tasks" },
  { name: "GENERATE_IMAGE", label: "Generate Images", description: "Create images from text prompts" },
  { name: "GENERATE_VIDEO", label: "Generate Video", description: "Create short videos from text" },
  { name: "GENERATE_VOICE", label: "Text-to-Speech", description: "Convert text into natural speech" },
  { name: "CODE_INTERPRETER", label: "Code Interpreter", description: "Run JS for calculations and transforms" },
  { name: "SEARCH_ATTACHMENTS", label: "Search Attachments", description: "Semantic search inside your uploaded files" },
  { name: "SHOPPING_SEARCH", label: "Product Search", description: "Find products across online stores" },
  { name: "CANVA_CREATE_SLIDES", label: "Canva Slides", description: "Generate slide decks via Canva" },
];

export const SKILL_MODELS: { id: string; label: string }[] = [
  { id: "auto", label: "Auto (recommended)" },
  { id: "google/gemini-2.5-flash-lite-preview-09-2025", label: "Gemini 2.5 Flash Lite" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  { id: "openai/gpt-5", label: "GPT-5" },
  { id: "moonshotai/kimi-k2.5:nitro", label: "Kimi K2.5 Nitro" },
];
