export interface ApiModel {
  id: string;
  name: string;
  description: string;
  credits: number;
  category: string;
  icon: string;
}

export const API_CATEGORIES = [
  { id: "chat", label: "Chat AI", icon: "MessageSquare" },
  { id: "image-gen", label: "Image Generation", icon: "Image" },
  { id: "image-tools", label: "Image Tools", icon: "Wand2" },
  { id: "video-gen", label: "Video Generation", icon: "Video" },
  { id: "video-i2v", label: "Image to Video", icon: "Film" },
  { id: "avatar", label: "Avatar & Lipsync", icon: "User" },
  { id: "services", label: "Services", icon: "Globe" },
];

export const API_MODELS: ApiModel[] = [
  // Chat
  { id: "megsy-v1", name: "Megsy V1", description: "Our flagship conversational AI model with advanced reasoning and multi-turn dialogue.", credits: 1, category: "chat", icon: "MessageSquare" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", description: "Google's most capable model with deep thinking and 1M token context window.", credits: 1, category: "chat", icon: "Brain" },
  { id: "gpt-5", name: "GPT-5", description: "OpenAI's latest generation model with superior instruction following.", credits: 1, category: "chat", icon: "Cpu" },
  { id: "grok-3", name: "Grok 3", description: "Advanced reasoning model with real-time knowledge and wit.", credits: 1, category: "chat", icon: "Zap" },
  { id: "deepseek-r1", name: "DeepSeek R1", description: "Open-source reasoning model optimized for math, code, and logic.", credits: 1, category: "chat", icon: "Search" },

  // Image Generation
  { id: "megsy-v1-img", name: "Megsy V1", description: "Our proprietary image generation model with exceptional quality and style diversity.", credits: 4, category: "image-gen", icon: "Sparkles" },
  { id: "gpt-image", name: "GPT Image 1.5", description: "OpenAI's image model with photorealistic output and precise prompt adherence.", credits: 5, category: "image-gen", icon: "Image" },
  { id: "nano-banana-2", name: "Nano Banana 2", description: "Ultra-fast generation with artistic flair and creative compositions.", credits: 4, category: "image-gen", icon: "Palette" },
  { id: "flux-kontext", name: "FLUX Kontext Max", description: "Context-aware generation that maintains character and style consistency.", credits: 3, category: "image-gen", icon: "Layers" },
  { id: "ideogram-3", name: "Ideogram 3", description: "Best-in-class text rendering within images and creative typography.", credits: 3, category: "image-gen", icon: "Type" },
  { id: "seedream-5-lite", name: "Seedream 5 Lite", description: "Lightweight yet powerful model for fast, high-quality generations.", credits: 2, category: "image-gen", icon: "Leaf" },
  { id: "recraft-v4", name: "Recraft V4", description: "Professional-grade design model for illustrations, icons, and branding.", credits: 3, category: "image-gen", icon: "PenTool" },
  { id: "flux-2-pro", name: "FLUX 2 Pro", description: "Premium generation model with exceptional detail and photorealism.", credits: 5, category: "image-gen", icon: "Star" },
  { id: "seedream-4", name: "Seedream 4.5", description: "Balanced model offering great quality-to-speed ratio.", credits: 2, category: "image-gen", icon: "Flower2" },
  { id: "grok-imagine", name: "Grok Imagine", description: "Creative image generation with unique artistic interpretations.", credits: 3, category: "image-gen", icon: "Zap" },
  { id: "imagineart-1.5", name: "ImagineArt 1.5", description: "Artistic model specializing in painterly and illustrative styles.", credits: 2, category: "image-gen", icon: "Brush" },
  { id: "hidream-i1", name: "HiDream I1 Full", description: "High-resolution dream-like imagery with surreal aesthetics.", credits: 2, category: "image-gen", icon: "Moon" },
  { id: "aura-v2", name: "Aura Flow V2", description: "Fast and efficient model for everyday image generation needs.", credits: 1, category: "image-gen", icon: "Wind" },
  { id: "stable-cascade", name: "Stable Cascade", description: "Multi-stage generation pipeline for enhanced detail and coherence.", credits: 1, category: "image-gen", icon: "Waves" },
  { id: "omnigen2", name: "OmniGen2", description: "Versatile model supporting diverse styles from photo to anime.", credits: 2, category: "image-gen", icon: "Shapes" },
  { id: "flux-realism", name: "FLUX Realism", description: "Hyper-realistic generation focused on photographic quality.", credits: 2, category: "image-gen", icon: "Camera" },
  { id: "logo-creator", name: "Logo Creator", description: "Specialized model for professional logo and brand identity design.", credits: 2, category: "image-gen", icon: "Hexagon" },
  { id: "sticker-maker", name: "Sticker Maker", description: "Create fun, expressive stickers with transparent backgrounds.", credits: 2, category: "image-gen", icon: "Smile" },
  { id: "qr-art", name: "QR Art", description: "Generate artistic QR codes that are both scannable and beautiful.", credits: 2, category: "image-gen", icon: "QrCode" },

  // Image Tools
  { id: "nano-banana-edit", name: "Nano Banana Edit", description: "Advanced image editing with multi-image support (up to 4 images).", credits: 2, category: "image-tools", icon: "Edit3" },
  { id: "object-remover", name: "Object Remover", description: "Intelligently remove unwanted objects from images seamlessly.", credits: 2, category: "image-tools", icon: "Eraser" },
  { id: "watermark-remover", name: "Watermark Remover", description: "Clean removal of watermarks while preserving image quality.", credits: 2, category: "image-tools", icon: "Droplets" },
  { id: "image-extender", name: "Image Extender", description: "Extend image canvas with AI-generated content (outpainting).", credits: 2, category: "image-tools", icon: "Maximize2" },
  { id: "flux-pro-editor", name: "FLUX Pro Editor", description: "Professional precision editing for detailed image modifications.", credits: 2, category: "image-tools", icon: "Sliders" },
  { id: "image-variations", name: "Image Variations", description: "Generate creative variations of existing images (up to 4 refs).", credits: 2, category: "image-tools", icon: "Copy" },
  { id: "photo-colorizer", name: "Photo Colorizer", description: "Add realistic color to black-and-white or faded photographs.", credits: 1, category: "image-tools", icon: "Palette" },
  { id: "bg-remover", name: "Background Remover", description: "Precise background removal with clean edge detection.", credits: 1, category: "image-tools", icon: "Scissors" },
  { id: "4k-upscaler", name: "4K Upscaler", description: "Upscale images to 4K resolution with enhanced detail.", credits: 2, category: "image-tools", icon: "ArrowUpRight" },
  { id: "face-enhancer", name: "Face Enhancer", description: "Restore and enhance facial details in photos.", credits: 1, category: "image-tools", icon: "Scan" },
  { id: "creative-upscaler", name: "Creative Upscaler", description: "Upscale with creative AI-generated detail enhancement.", credits: 2, category: "image-tools", icon: "Sparkles" },
  { id: "old-photo-restorer", name: "Old Photo Restorer", description: "Restore damaged, scratched, or aged photographs.", credits: 2, category: "image-tools", icon: "Clock" },
  { id: "bg-replacer", name: "Background Replacer", description: "Replace image backgrounds with AI-generated scenes.", credits: 2, category: "image-tools", icon: "Replace" },
  { id: "style-transfer", name: "Style Transfer", description: "Apply artistic styles from reference images to your photos.", credits: 2, category: "image-tools", icon: "Paintbrush" },
  { id: "ai-relighting", name: "AI Relighting", description: "Relight subjects and scenes with AI-controlled lighting.", credits: 3, category: "image-tools", icon: "Sun" },
  { id: "photo-to-cartoon", name: "Photo to Cartoon", description: "Convert photos into cartoon or illustrated style artwork.", credits: 3, category: "image-tools", icon: "Smile" },
  { id: "product-photo", name: "Product Photo", description: "Generate studio-quality product photography from simple shots.", credits: 2, category: "image-tools", icon: "Package" },
  { id: "ai-headshot", name: "AI Headshot", description: "Create professional headshots from casual photos.", credits: 2, category: "image-tools", icon: "UserCircle" },

  // Video Generation
  { id: "megsy-video", name: "Megsy Video", description: "Our flagship text-to-video model with cinematic quality output.", credits: 6, category: "video-gen", icon: "Video" },
  { id: "veo-3.1", name: "Veo 3.1", description: "Google's most advanced video model with exceptional motion and physics.", credits: 30, category: "video-gen", icon: "Clapperboard" },
  { id: "veo-3.1-fast", name: "Veo 3.1 Fast", description: "Faster variant of Veo 3.1 for quicker video generation.", credits: 12, category: "video-gen", icon: "Gauge" },
  { id: "kling-3-pro", name: "Kling 3.0 Pro", description: "Professional-grade video with excellent character consistency.", credits: 20, category: "video-gen", icon: "Film" },
  { id: "kling-o1", name: "Kling O1", description: "Advanced video model with enhanced motion understanding.", credits: 15, category: "video-gen", icon: "Play" },
  { id: "openai-sora", name: "Sora", description: "OpenAI's video model with impressive scene composition.", credits: 8, category: "video-gen", icon: "Tv" },
  { id: "pika-2.2", name: "Pika 2.2", description: "Creative video generation with unique visual effects.", credits: 8, category: "video-gen", icon: "Sparkles" },
  { id: "luma-dream", name: "Luma Dream Machine", description: "Dream-like video sequences with smooth transitions.", credits: 8, category: "video-gen", icon: "Moon" },
  { id: "seedance-pro", name: "Seedance Pro", description: "Dance and motion-focused video generation model.", credits: 5, category: "video-gen", icon: "Music" },
  { id: "wan-2.6", name: "WAN 2.6", description: "High-fidelity video generation with natural motion dynamics.", credits: 10, category: "video-gen", icon: "Waves" },
  { id: "pixverse-5.5", name: "PixVerse V5.5", description: "Versatile video model with style-diverse output.", credits: 8, category: "video-gen", icon: "MonitorPlay" },

  // Video I2V
  { id: "megsy-video-i2v", name: "Megsy Video I2V", description: "Animate still images into dynamic video sequences.", credits: 6, category: "video-i2v", icon: "ImagePlay" },
  { id: "kling-3-pro-i2v", name: "Kling 3.0 Pro I2V", description: "Professional image-to-video with cinematic motion.", credits: 20, category: "video-i2v", icon: "Film" },
  { id: "kling-o1-i2v", name: "Kling O1 I2V", description: "Advanced image-to-video with natural animation.", credits: 15, category: "video-i2v", icon: "Play" },
  { id: "veo-3.1-fast-i2v", name: "Veo 3.1 Fast I2V", description: "Fast image-to-video powered by Google's Veo engine.", credits: 12, category: "video-i2v", icon: "Gauge" },
  { id: "openai-sora-i2v", name: "Sora I2V", description: "OpenAI's image-to-video with scene understanding.", credits: 8, category: "video-i2v", icon: "Tv" },
  { id: "pixverse-5.5-i2v", name: "PixVerse V5.5 I2V", description: "Versatile image-to-video with style preservation.", credits: 8, category: "video-i2v", icon: "MonitorPlay" },
  { id: "wan-2.6-i2v", name: "WAN 2.6 I2V", description: "Natural motion image-to-video conversion.", credits: 10, category: "video-i2v", icon: "Waves" },
  { id: "wan-flf", name: "WAN First-Last-Frame", description: "Control video by specifying first and last frames.", credits: 6, category: "video-i2v", icon: "Columns" },

  // Avatar
  { id: "kling-avatar-pro", name: "Kling Avatar V2 Pro", description: "Premium avatar animation with lifelike expressions.", credits: 10, category: "avatar", icon: "User" },
  { id: "kling-avatar-std", name: "Kling Avatar V2 Std", description: "Standard avatar animation for everyday use.", credits: 5, category: "avatar", icon: "UserCircle" },
  { id: "sadtalker", name: "SadTalker", description: "Generate talking-head animations from a single photo.", credits: 2, category: "avatar", icon: "Mic" },
  { id: "sync-lipsync", name: "Sync Lipsync V2", description: "Professional lip-sync with precise mouth movement.", credits: 50, category: "avatar", icon: "AudioLines" },

  // Services
  { id: "web-search", name: "Web Search", description: "Real-time web search with AI-powered result summarization.", credits: 2, category: "services", icon: "Globe" },
  { id: "code-execution", name: "Code Execution", description: "Run code in a sandboxed environment with full package support.", credits: 5, category: "services", icon: "Terminal" },
];

export const getModelsByCategory = (category: string) =>
  API_MODELS.filter(m => m.category === category);

export const getModelById = (id: string) =>
  API_MODELS.find(m => m.id === id);
