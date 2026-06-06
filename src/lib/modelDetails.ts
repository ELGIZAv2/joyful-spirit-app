// Centralized model details — descriptions, capabilities, modes, and requirements
// Image/Video models are now fully dynamic via admin bot. Only chat models are hardcoded.

export type ModelType = "chat" | "image" | "image-tool" | "video" | "video-i2v" | "video-avatar" | "video-effect" | "video-motion";

export interface ModelDetail {
  id: string;
  name: string;
  type: ModelType;
  credits: number;
  description: string;
  longDescription: string;
  icon: string;
  modes: string[];
  acceptsImages: boolean;
  requiresImage: boolean;
  maxImages: number;
  acceptedMimeTypes: string[];
  inputLabels?: string[];
  resolutions?: string[];
  notes?: string;
  provider: string;
  speed?: "fast" | "standard" | "slow";
  quality?: "standard" | "high" | "ultra";
  customization?: Record<string, any>;
  iconUrl?: string;
  badges?: string[];
  isFree?: boolean;
}

const MIME_IMG = ["image/jpeg", "image/png", "image/webp"];

// Provider logo helpers (served from /public/model-logos/)
const LOGO = {
  fal: "/model-logos/fal.ico",
  google: "/model-logos/google.ico",
  openai: "/model-logos/openai.svg",
  bfl: "/model-logos/bfl.webp",
  bytedance: "/model-logos/bytedance.ico",
  ideogram: "/model-logos/ideogram.webp",
  kling: "/model-logos/kling.webp",
  luma: "/model-logos/luma.webp",
  pika: "/model-logos/pika.webp",
  recraft: "/model-logos/recraft.webp",
  nanoBanana: "/model-logos/nano-banana.webp",
  megsy: "/model-logos/megsy.webp",
  minimax: "/model-logos/minimax.webp",
  runway: "/model-logos/runway.webp",
  qwen: "/model-logos/qwen.webp",
  hidream: "/model-logos/hidream.webp",
  stability: "/model-logos/stability.webp",
  playground: "/model-logos/playground.webp",
  lightricks: "/model-logos/lightricks.webp",
} as const;

export const FREE_MODEL_IDS: string[] = [];

export const ALL_MODEL_DETAILS: ModelDetail[] = [
  // ═══════════════════════════════════════════
  // CHAT MODELS — Megsy Tier System
  // ═══════════════════════════════════════════
  {
    id: "megsy-lite", name: "Megsy Lite", type: "chat", credits: 0,
    description: "Fast & free — Gemini 2.5 Flash Lite for everyday tasks.",
    longDescription: "Ultra-cheap, ultra-fast tier powered by Gemini 2.5 Flash Lite (primary) with auto-upgrade to Gemini 2.5 Flash for complex prompts. 1M context.",
    icon: "Zap", modes: ["text-to-text", "multimodal"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "fast", quality: "high", isFree: true,
    badges: ["FREE", "FAST"],
  },
  {
    id: "megsy-pro", name: "Megsy Pro", type: "chat", credits: 0,
    description: "Balanced — Gemini Flash + Kimi K2 (1T params) for hard tasks.",
    longDescription: "Pro tier: Gemini 2.5 Flash for daily chat, with auto-escalation to Kimi K2-0905 — a 1 Trillion parameter MoE model — when the task gets complex.",
    icon: "Brain", modes: ["text-to-text", "multimodal"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "fast", quality: "ultra",
    badges: ["1T", "BALANCED"],
  },
  {
    id: "megsy-max", name: "Megsy Max", type: "chat", credits: 0,
    description: "Strongest — Kimi K2 (1T) + K2 Thinking for deep reasoning.",
    longDescription: "Max tier: Kimi K2-0905 (1T MoE) for primary, escalating to Kimi K2 Thinking for the hardest reasoning, math, coding and analysis tasks. 262K context.",
    icon: "Sparkles", modes: ["text-to-text", "multimodal"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "standard", quality: "ultra",
    badges: ["1T", "THINKING"],
  },
  {
    id: "megsy-research", name: "Megsy Research", type: "chat", credits: 0,
    description: "Deep research — Qwen3-235B writer + Gemini 2.5 Pro analyst.",
    longDescription: "Two-stage research pipeline: Qwen3-235B (262K ctx, ultra-cheap output at $0.10/M) drafts long-form content, then Gemini 2.5 Pro synthesizes and refines. Built for academic depth at minimal cost.",
    icon: "BookOpen", modes: ["text-to-text"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "standard", quality: "ultra",
    badges: ["RESEARCH", "LONG-OUTPUT"],
  },


  // ═══════════════════════════════════════════
  // FAL.AI IMAGE MODELS — Top 20 (May 2026)
  // (Removed duplicates: megsy-image alias of nano-banana,
  //  and *.edit variants — main models handle editing too)
  // ═══════════════════════════════════════════
  {
    id: "fal-ai/nano-banana-2", name: "Nano Banana 2", type: "image", credits: 6,
    description: "Google Gemini 3 Pro Image — newest flagship image model.",
    longDescription: "Nano Banana 2 runs on Gemini 3 Pro Image. State-of-the-art prompt adherence, in-image text, and multi-reference editing.",
    icon: "Sparkles", modes: ["text-to-image", "image-to-image"], acceptsImages: true, requiresImage: false, maxImages: 6, acceptedMimeTypes: MIME_IMG,
    provider: "fal", speed: "fast", quality: "ultra",
    iconUrl: LOGO.nanoBanana, badges: ["NEW", "TOP", "EDIT"],
  },
  {
    id: "fal-ai/nano-banana", name: "Nano Banana", type: "image", credits: 4,
    description: "Google Gemini 2.5 Flash Image — fast edits with reference images.",
    longDescription: "Nano Banana uses Gemini 2.5 Flash Image to generate and edit images. Supports up to 4 reference images.",
    icon: "Image", modes: ["text-to-image", "image-to-image"], acceptsImages: true, requiresImage: false, maxImages: 4, acceptedMimeTypes: MIME_IMG,
    provider: "fal", speed: "fast", quality: "high",
    iconUrl: LOGO.nanoBanana, badges: ["EDIT", "MULTI-REF"],
  },
  {
    id: "fal-ai/flux-2-pro", name: "FLUX.2 Pro", type: "image", credits: 10,
    description: "Black Forest Labs' newest flagship — FLUX.2 Pro.",
    longDescription: "FLUX.2 Pro pushes photorealism, prompt adherence and text rendering further than FLUX 1.1 Ultra. The new BFL benchmark.",
    icon: "Sparkles", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "fal", speed: "standard", quality: "ultra",
    iconUrl: LOGO.bfl, badges: ["NEW", "TOP", "PHOTO"],
  },
  {
    id: "fal-ai/flux-2-flex", name: "FLUX.2 Flex", type: "image", credits: 5,
    description: "FLUX.2 Flex — balanced quality and speed from BFL.",
    longDescription: "FLUX.2 Flex is the fast, affordable FLUX.2 tier. Strong quality at a fraction of the cost of Pro.",
    icon: "Image", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "fal", speed: "fast", quality: "high",
    iconUrl: LOGO.bfl, badges: ["NEW", "FAST"],
  },
  {
    id: "fal-ai/flux-pro/v1.1-ultra", name: "FLUX Pro 1.1 Ultra", type: "image", credits: 8,
    description: "Top-tier photorealism and prompt adherence from Black Forest Labs.",
    longDescription: "FLUX Pro 1.1 Ultra delivers cinematic detail, accurate text, and strong prompt following.",
    icon: "Sparkles", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "fal", speed: "standard", quality: "ultra",
    iconUrl: LOGO.bfl, badges: ["PRO", "PHOTO"],
  },
  {
    id: "fal-ai/flux-pro/kontext-max", name: "FLUX Kontext Max", type: "image", credits: 8,
    description: "Maximum-fidelity context-aware FLUX editor.",
    longDescription: "FLUX Pro Kontext Max — highest-quality FLUX editor that preserves subjects, styles and composition across edits.",
    icon: "Image", modes: ["image-to-image"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    provider: "fal", speed: "standard", quality: "ultra",
    iconUrl: LOGO.bfl, badges: ["EDIT", "CONSISTENT", "MAX"],
  },
  {
    id: "fal-ai/flux-pro/kontext", name: "FLUX Kontext", type: "image", credits: 6,
    description: "Context-aware FLUX edits — preserves subjects across edits.",
    longDescription: "FLUX Pro Kontext lets you edit images while keeping characters, styles, and composition consistent.",
    icon: "Image", modes: ["image-to-image"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    provider: "fal", speed: "standard", quality: "ultra",
    iconUrl: LOGO.bfl, badges: ["EDIT", "CONSISTENT"],
  },
  {
    id: "fal-ai/flux/dev", name: "FLUX.1 Dev", type: "image", credits: 3,
    description: "Strong general-purpose FLUX model, fast and flexible.",
    longDescription: "FLUX.1 Dev — balanced open-weight FLUX model. Great quality, faster than Pro, ideal for everyday creative work.",
    icon: "Image", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "fal", speed: "fast", quality: "high",
    iconUrl: LOGO.bfl, badges: ["FAST"],
  },
  {
    id: "fal-ai/bytedance/seedream/v4/text-to-image", name: "Seedream 4.0", type: "image", credits: 5,
    description: "ByteDance Seedream 4 — high-fidelity photorealism with rich detail.",
    longDescription: "Seedream 4 produces vivid, photoreal images with cinematic lighting and excellent style range.",
    icon: "Sparkles", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "fal", speed: "standard", quality: "ultra",
    iconUrl: LOGO.bytedance, badges: ["PHOTO"],
  },
  // (Seedream 4 Edit removed — duplicate of Seedream 4)

  {
    id: "fal-ai/imagen4/preview/ultra", name: "Imagen 4 Ultra", type: "image", credits: 8,
    description: "Google Imagen 4 Ultra — premium photorealism.",
    longDescription: "Imagen 4 Ultra is Google's highest-fidelity image model — exceptional realism, lighting, and composition.",
    icon: "Sparkles", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "fal", speed: "standard", quality: "ultra",
    iconUrl: LOGO.google, badges: ["TOP", "PHOTO"],
  },
  {
    id: "fal-ai/gpt-image-1/text-to-image", name: "GPT Image 1", type: "image", credits: 7,
    description: "OpenAI gpt-image-1 — strong reasoning and text rendering.",
    longDescription: "GPT Image 1 from OpenAI excels at instruction following, in-image text, and complex compositions.",
    icon: "Sparkles", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "fal", speed: "standard", quality: "ultra",
    iconUrl: LOGO.openai, badges: ["TEXT", "PRO"],
  },
  {
    id: "fal-ai/recraft-v3", name: "Recraft V3", type: "image", credits: 5,
    description: "Best-in-class for design, vectors, typography, and brand assets.",
    longDescription: "Recraft V3 excels at logos, icons, posters, illustrations with text, and any design-oriented imagery.",
    icon: "Sparkles", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "fal", speed: "standard", quality: "ultra",
    iconUrl: LOGO.recraft, badges: ["DESIGN", "TEXT"],
  },
  {
    id: "fal-ai/ideogram/v3", name: "Ideogram V3", type: "image", credits: 4,
    description: "Exceptional text rendering inside images.",
    longDescription: "Ideogram V3 generates images with legible, accurate in-image text — great for posters, ads, mockups.",
    icon: "Image", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "fal", speed: "standard", quality: "high",
    iconUrl: LOGO.ideogram, badges: ["TEXT"],
  },
  {
    id: "fal-ai/qwen-image", name: "Qwen Image", type: "image", credits: 3,
    description: "Alibaba Qwen Image — strong multilingual and Asian text rendering.",
    longDescription: "Qwen Image excels at Chinese / Arabic / multilingual in-image text, with strong overall quality.",
    icon: "Image", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "fal", speed: "fast", quality: "high",
    iconUrl: LOGO.qwen, badges: ["MULTILINGUAL"],
  },
  {
    id: "fal-ai/hidream-i1-full", name: "HiDream I1 Full", type: "image", credits: 4,
    description: "HiDream I1 — open-weight model with strong aesthetics.",
    longDescription: "HiDream I1 Full delivers polished, stylized imagery competitive with closed models.",
    icon: "Image", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "fal", speed: "standard", quality: "high",
    iconUrl: LOGO.hidream, badges: ["AESTHETIC"],
  },
  {
    id: "fal-ai/luma-photon", name: "Luma Photon", type: "image", credits: 4,
    description: "Luma Photon — bright, vivid, illustrative imagery.",
    longDescription: "Luma Photon is built for fast, beautiful image generation with cinematic lighting.",
    icon: "Image", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "fal", speed: "fast", quality: "high",
    iconUrl: LOGO.luma, badges: ["FAST", "VIVID"],
  },
  {
    id: "fal-ai/stable-diffusion-v35-large", name: "Stable Diffusion 3.5 Large", type: "image", credits: 3,
    description: "Stability AI SD 3.5 Large — versatile open-weight model.",
    longDescription: "Stable Diffusion 3.5 Large is Stability AI's strongest SD 3.5 variant — versatile, with great fine-tuning support.",
    icon: "Image", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "fal", speed: "standard", quality: "high",
    iconUrl: LOGO.stability, badges: ["OPEN"],
  },

  // ═══════════════════════════════════════════
  // FAL.AI VIDEO MODELS — Top 20 (May 2026)
  // ═══════════════════════════════════════════
  {
    id: "fal-ai/veo3", name: "Veo 3", type: "video", credits: 40,
    description: "Google Veo 3 — cinematic text-to-video with native audio.",
    longDescription: "Veo 3 delivers cinematic 1080p video with synchronized audio. State of the art for narrative shots.",
    icon: "Video", modes: ["text-to-video"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "fal", speed: "slow", quality: "ultra",
    iconUrl: LOGO.google, badges: ["TOP", "AUDIO"],
  },
  {
    id: "fal-ai/veo3/fast", name: "Veo 3 Fast", type: "video", credits: 20,
    description: "Faster, cheaper Veo 3 for quick iterations.",
    longDescription: "Veo 3 Fast trades some quality for speed and cost. Great for drafts and previews.",
    icon: "Video", modes: ["text-to-video"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "fal", speed: "standard", quality: "high",
    iconUrl: LOGO.google, badges: ["FAST"],
  },
  {
    id: "fal-ai/veo3/image-to-video", name: "Veo 3 Image-to-Video", type: "video-i2v", credits: 40,
    description: "Animate any image with Veo 3.",
    longDescription: "Provide a starting frame and a motion prompt — Veo 3 produces a cinematic clip from your image.",
    icon: "Video", modes: ["image-to-video"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    provider: "fal", speed: "slow", quality: "ultra",
    iconUrl: LOGO.google, badges: ["IMG2VID", "AUDIO"],
  },
  {
    id: "fal-ai/kling-video/v2.5-turbo/pro/text-to-video", name: "Kling 2.5 Turbo Pro", type: "video", credits: 25,
    description: "Kling 2.5 Turbo Pro — newest Kling, faster than 2.1 Master.",
    longDescription: "Kling 2.5 Turbo Pro from Kuaishou — newest flagship with sharper motion and lower latency than 2.1 Master.",
    icon: "Video", modes: ["text-to-video"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "fal", speed: "standard", quality: "ultra",
    iconUrl: LOGO.kling, badges: ["NEW", "TURBO"],
  },
  {
    id: "fal-ai/kling-video/v2.5-turbo/pro/image-to-video", name: "Kling 2.5 Turbo Pro I2V", type: "video-i2v", credits: 25,
    description: "Animate images with Kling 2.5 Turbo Pro.",
    longDescription: "Image-to-video with Kling's newest flagship — sharp motion and great identity preservation.",
    icon: "Video", modes: ["image-to-video"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    provider: "fal", speed: "standard", quality: "ultra",
    iconUrl: LOGO.kling, badges: ["NEW", "IMG2VID"],
  },
  {
    id: "fal-ai/kling-video/v2.1/master/text-to-video", name: "Kling 2.1 Master", type: "video", credits: 30,
    description: "Kling 2.1 Master — premium realism and motion.",
    longDescription: "Kling 2.1 Master from Kuaishou — known for strong physics and realism.",
    icon: "Video", modes: ["text-to-video"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "fal", speed: "slow", quality: "ultra",
    iconUrl: LOGO.kling, badges: ["MASTER"],
  },
  {
    id: "fal-ai/kling-video/v2.1/master/image-to-video", name: "Kling 2.1 Master I2V", type: "video-i2v", credits: 30,
    description: "Animate images with Kling 2.1 Master.",
    longDescription: "Image-to-video with Kling's flagship — strong character and motion consistency.",
    icon: "Video", modes: ["image-to-video"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    provider: "fal", speed: "slow", quality: "ultra",
    iconUrl: LOGO.kling, badges: ["IMG2VID", "MASTER"],
  },
  {
    id: "fal-ai/bytedance/seedance/v1/pro/text-to-video", name: "Seedance 1.0 Pro", type: "video", credits: 20,
    description: "ByteDance Seedance Pro — cinematic motion and lighting.",
    longDescription: "Seedance 1.0 Pro delivers expressive camera work and natural motion. Great for storytelling.",
    icon: "Video", modes: ["text-to-video"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "fal", speed: "standard", quality: "ultra",
    iconUrl: LOGO.bytedance, badges: ["CINEMA"],
  },
  {
    id: "fal-ai/bytedance/seedance/v1/pro/image-to-video", name: "Seedance 1.0 Pro I2V", type: "video-i2v", credits: 20,
    description: "Animate images with ByteDance Seedance Pro.",
    longDescription: "Seedance 1.0 Pro image-to-video — expressive cinematic motion from any still.",
    icon: "Video", modes: ["image-to-video"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    provider: "fal", speed: "standard", quality: "ultra",
    iconUrl: LOGO.bytedance, badges: ["IMG2VID", "CINEMA"],
  },
  {
    id: "fal-ai/minimax/hailuo-02/pro/text-to-video", name: "MiniMax Hailuo 02 Pro", type: "video", credits: 18,
    description: "MiniMax Hailuo 02 Pro — sharp, fluid motion.",
    longDescription: "Hailuo 02 Pro generates high-quality 1080p video with natural motion and strong prompt fidelity.",
    icon: "Video", modes: ["text-to-video"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "fal", speed: "standard", quality: "high",
    iconUrl: LOGO.minimax, badges: ["1080P"],
  },
  {
    id: "fal-ai/minimax/hailuo-02/pro/image-to-video", name: "Hailuo 02 Pro I2V", type: "video-i2v", credits: 18,
    description: "Animate any image with Hailuo 02 Pro.",
    longDescription: "MiniMax Hailuo 02 Pro image-to-video — turn stills into smooth 1080p clips.",
    icon: "Video", modes: ["image-to-video"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    provider: "fal", speed: "standard", quality: "high",
    iconUrl: LOGO.minimax, badges: ["IMG2VID"],
  },
  {
    id: "fal-ai/wan-25-preview/text-to-video", name: "Wan 2.5", type: "video", credits: 10,
    description: "Alibaba Wan 2.5 — newest, fast and affordable.",
    longDescription: "Wan 2.5 from Alibaba — improved motion and prompt adherence over Wan 2.2.",
    icon: "Video", modes: ["text-to-video"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "fal", speed: "fast", quality: "high",
    iconUrl: LOGO.qwen, badges: ["NEW", "CHEAP"],
  },
  {
    id: "fal-ai/wan-25-preview/image-to-video", name: "Wan 2.5 I2V", type: "video-i2v", credits: 10,
    description: "Animate images with Alibaba Wan 2.5.",
    longDescription: "Wan 2.5 image-to-video — fast, affordable, great quality for the price.",
    icon: "Video", modes: ["image-to-video"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    provider: "fal", speed: "fast", quality: "high",
    iconUrl: LOGO.qwen, badges: ["NEW", "IMG2VID"],
  },
  {
    id: "fal-ai/luma-dream-machine/ray-2", name: "Luma Ray 2", type: "video", credits: 22,
    description: "Luma Ray 2 — photoreal video with stunning motion.",
    longDescription: "Luma Ray 2 is Luma's flagship video model. Excellent for realistic, cinematic clips.",
    icon: "Video", modes: ["text-to-video"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "fal", speed: "standard", quality: "ultra",
    iconUrl: LOGO.luma, badges: ["PHOTO"],
  },
  {
    id: "fal-ai/luma-dream-machine/ray-2-flash", name: "Luma Ray 2 Flash", type: "video", credits: 12,
    description: "Luma Ray 2 Flash — fast and affordable.",
    longDescription: "Ray 2 Flash trades some quality for big speed and cost gains. Great for iteration.",
    icon: "Video", modes: ["text-to-video"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "fal", speed: "fast", quality: "high",
    iconUrl: LOGO.luma, badges: ["FAST"],
  },
  {
    id: "fal-ai/pika/v2.2/text-to-video", name: "Pika 2.2", type: "video", credits: 15,
    description: "Pika 2.2 — playful, stylized video generation.",
    longDescription: "Pika 2.2 delivers stylized, expressive video with creative camera moves.",
    icon: "Video", modes: ["text-to-video"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "fal", speed: "standard", quality: "high",
    iconUrl: LOGO.pika, badges: ["STYLIZED"],
  },
  {
    id: "fal-ai/pika/v2.2/image-to-video", name: "Pika 2.2 I2V", type: "video-i2v", credits: 15,
    description: "Animate images with Pika 2.2.",
    longDescription: "Pika 2.2 image-to-video — stylized motion from any image.",
    icon: "Video", modes: ["image-to-video"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    provider: "fal", speed: "standard", quality: "high",
    iconUrl: LOGO.pika, badges: ["IMG2VID", "STYLIZED"],
  },
  {
    id: "fal-ai/hunyuan-video", name: "Hunyuan Video", type: "video", credits: 14,
    description: "Tencent Hunyuan Video — large open-weight video model.",
    longDescription: "Hunyuan Video from Tencent — a high-quality open video model with strong motion.",
    icon: "Video", modes: ["text-to-video"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "fal", speed: "standard", quality: "high",
    iconUrl: LOGO.fal, badges: ["OPEN"],
  },
];

// Helper getters
export const getModelDetail = (id: string): ModelDetail | undefined =>
  ALL_MODEL_DETAILS.find(m => m.id === id);

export const getModelsByType = (type: ModelType): ModelDetail[] =>
  ALL_MODEL_DETAILS.filter(m => m.type === type);

export const getChatModels = () => getModelsByType("chat");
export const getImageGenerationModels = () => getModelsByType("image");
export const getImageToolModels = () => getModelsByType("image-tool");
export const getVideoGenerationModels = () => getModelsByType("video");
export const getVideoI2VModels = () => getModelsByType("video-i2v");
export const getVideoAvatarModels = () => getModelsByType("video-avatar");

// Legacy dedup list — kept empty after model list was deduped in source.
export const HIDDEN_DUPLICATE_IDS: string[] = [];
