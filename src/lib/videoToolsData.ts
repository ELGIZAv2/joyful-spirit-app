export interface VideoTool {
  id: string;
  name: string;
  description: string;
  model: string;
  costType: 'flat' | 'per-second' | 'per-minute' | 'dynamic';
  baseCost: number;
  inputType: 'video' | 'video-image' | 'image' | 'video-audio' | 'image-audio-text';
  previewVideo?: string;
  route: string;
  badge?: 'NEW' | 'PRO';
  pricingDetails?: string;
}

export const VIDEO_TOOLS: VideoTool[] = [
  {
    id: 'swap-characters',
    name: 'Swap Characters',
    description: 'Swap faces in any video',
    model: 'fal-ai/pixverse/swap',
    costType: 'dynamic',
    baseCost: 4,
    inputType: 'video-image',
    previewVideo: 'https://i.top4top.io/m_3736q2d581.mp4',
    route: '/videos/tools/character-studio',
    badge: 'NEW',
    pricingDetails: '720p: 4 MC, 1080p: 5.5 MC (×2 if >5s)',
  },
  {
    id: 'upscale',
    name: 'Video Upscale',
    description: 'Upscale video resolution',
    model: 'fal-ai/bytedance-upscaler/upscale/video',
    costType: 'per-second',
    baseCost: 1,
    inputType: 'video',
    previewVideo: 'https://g.top4top.io/m_3736jvh701.mp4',
    route: '/videos/tools/upscale',
    badge: 'PRO',
    pricingDetails: 'Standard: 1 MC/sec | Pro: 1-3 MC/sec by resolution',
  },
  {
    id: 'talking-photo',
    name: 'Animated Portrait',
    description: 'Animate your own portrait with voice narration',
    model: 'fal-ai/heygen/avatar4/image-to-video',
    costType: 'per-second',
    baseCost: 1.5,
    inputType: 'image-audio-text',
    previewVideo: 'https://d.top4top.io/m_373603i1h1.mp4',
    route: '/videos/tools/talking-photo',
    badge: 'NEW',
  },
  {
    id: 'video-extender',
    name: 'Video Extender',
    description: 'Extend video duration with AI',
    model: 'fal-ai/veo3.1/extend-video',
    costType: 'per-second',
    baseCost: 3,
    inputType: 'video',
    previewVideo: 'https://l.top4top.io/m_3736vpf581.mp4',
    route: '/videos/tools/video-extender',
    badge: 'PRO',
    pricingDetails: 'No audio: 3 MC/sec | With audio: 5 MC/sec',
  },
  {
    id: 'auto-caption',
    name: 'Auto Caption',
    description: 'Add captions to videos automatically',
    model: 'fal-ai/auto-caption',
    costType: 'flat',
    baseCost: 2,
    inputType: 'video',
    previewVideo: 'https://i.top4top.io/m_3736uqhii1.mp4',
    route: '/videos/tools/auto-caption',
  },
  {
    id: 'lip-sync',
    name: 'Voice Sync Studio',
    description: 'Sync video lip motion with your own voice track',
    model: 'veed/lipsync',
    costType: 'per-minute',
    baseCost: 6,
    inputType: 'video-audio',
    previewVideo: 'https://d.top4top.io/m_373603i1h1.mp4',
    route: '/videos/tools/lip-sync',
    badge: 'PRO',
  },
  // Removed: video-stabilizer, video-translate, music-separator
  // These had no matching routes in App.tsx → broken links for users.
  // Re-add once pages + edge-function handlers are implemented.
  {
    id: 'green-screen',
    name: 'Green Screen Remover',
    description: 'Remove green screen backgrounds',
    model: 'fal-ai/video-bg-remover',
    costType: 'per-second',
    baseCost: 2,
    inputType: 'video',
    route: '/videos/tools/green-screen',
    badge: 'NEW',
    pricingDetails: '2 MC/sec',
  },
  {
    id: 'video-colorizer',
    name: 'AI Video Colorizer',
    description: 'Colorize old black & white videos',
    model: 'fal-ai/video-colorizer',
    costType: 'per-second',
    baseCost: 2,
    inputType: 'video',
    route: '/videos/tools/video-colorizer',
    badge: 'NEW',
    pricingDetails: '2 MC/sec',
  },
  {
    id: 'video-bg-replacer',
    name: 'Video BG Replacer',
    description: 'Replace video background with AI',
    model: 'fal-ai/video-bg-replacer',
    costType: 'per-second',
    baseCost: 3,
    inputType: 'video-image',
    route: '/videos/tools/video-bg-replacer',
    badge: 'PRO',
    pricingDetails: '3 MC/sec',
  },
  {
    id: 'video-intro',
    name: 'AI Video Intro',
    description: 'Create professional video intros',
    model: 'fal-ai/veo3.1',
    costType: 'flat',
    baseCost: 5,
    inputType: 'video',
    route: '/videos/tools/video-intro',
    badge: 'PRO',
  },
  {
    id: 'video-denoise',
    name: 'Video Noise Reduction',
    description: 'Remove noise from videos',
    model: 'fal-ai/video-denoise',
    costType: 'per-second',
    baseCost: 1,
    inputType: 'video',
    route: '/videos/tools/video-denoise',
    badge: 'NEW',
    pricingDetails: '1 MC/sec',
  },
];

