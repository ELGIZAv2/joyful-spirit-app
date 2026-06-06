export interface ImageTool {
  id: string;
  name: string;
  description: string;
  model: string;
  cost: number;
  inputType: 'image' | 'two-images' | 'image-text' | 'text' | 'image-color';
  previewImage?: string;
  previewVideo?: string;
  route: string;
  badge?: 'NEW' | 'PRO';
}

export interface ImageModel {
  id: string;
  name: string;
  textToImage?: string;
  imageToImage?: string;
  cost: number;
  iconUrl: string;
  badge?: 'NEW' | 'PRO';
}

export const IMAGE_TOOLS: ImageTool[] = [
  { id: 'inpaint', name: 'Inpaint', description: 'Edit parts of an image with AI', model: 'fal-ai/qwen-image-edit/inpaint', cost: 1, inputType: 'two-images', previewImage: '/tool-previews/inpaint.webp', route: '/images/tools/inpaint', badge: 'NEW' },
  { id: 'clothes-changer', name: 'Outfit Studio', description: 'Restyle outfits with AI fashion presets', model: 'fal-ai/nano-banana-pro/edit', cost: 4, inputType: 'image', route: '/images/tools/clothes-changer', badge: 'PRO' },
  { id: 'headshot', name: 'Headshot', description: 'Professional headshot photos', model: 'fal-ai/image-apps-v2/headshot-photo', cost: 1, inputType: 'image', route: '/images/tools/headshot' },
  { id: 'bg-remover', name: 'Background Remover', description: 'Remove image backgrounds', model: 'fal-ai/bria/background/remove', cost: 0.5, inputType: 'image', route: '/images/tools/bg-remover' },
  { id: 'face-swap', name: 'AI Portrait Studio', description: 'Blend portrait styles between your own photos', model: 'fal-ai/flux-2/klein/9b/base/edit', cost: 0.5, inputType: 'two-images', route: '/images/tools/portrait-studio' },
  { id: 'relight', name: 'Relight', description: 'Change lighting and colors', model: 'bria/fibo-edit/relight', cost: 1, inputType: 'image-color', route: '/images/tools/relight' },
  { id: 'colorizer', name: 'Image Colorizer', description: 'Colorize black & white images', model: 'bria/fibo-edit/colorize', cost: 1, inputType: 'image', route: '/images/tools/colorizer' },
  { id: 'character-swap', name: 'Character Studio', description: 'Restyle fictional characters in your scenes', model: 'fal-ai/flux-2/klein/9b/base/edit', cost: 0.5, inputType: 'two-images', route: '/images/tools/character-studio' },
  { id: 'storyboard', name: 'Storyboard', description: 'Create storyboard panels', model: 'fal-ai/flux-2-pro', cost: 1, inputType: 'text', route: '/images/tools/storyboard' },
  { id: 'sketch-to-image', name: 'Sketch to Image', description: 'Convert sketches to images', model: 'bria/fibo-edit/sketch_to_colored_image', cost: 1, inputType: 'image', route: '/images/tools/sketch-to-image' },
  { id: 'retouching', name: 'Retouching', description: 'Retouch and enhance photos', model: 'fal-ai/retoucher', cost: 1, inputType: 'image', route: '/images/tools/retouching' },
  { id: 'remover', name: 'Object Remover', description: 'Remove objects from images', model: 'fal-ai/qwen-image-edit-plus-lora-gallery/remove-element', cost: 1, inputType: 'image-text', route: '/images/tools/remover' },
  { id: 'hair-changer', name: 'Hairstyle Studio', description: 'Try on new hairstyles with AI', model: 'fal-ai/image-apps-v2/hair-change', cost: 1, inputType: 'image', route: '/images/tools/hair-changer' },
  { id: 'cartoon', name: 'Cartoon', description: 'Cartoonify your photos', model: 'fal-ai/image-editing/cartoonify', cost: 1, inputType: 'image', route: '/images/tools/cartoon' },
  { id: 'avatar-maker', name: 'Avatar Maker 3D', description: 'Create 3D avatars from photos', model: 'fal-ai/hunyuan-3d/v3.1/rapid/image-to-3d', cost: 4, inputType: 'image', route: '/images/tools/avatar-maker', badge: 'PRO' },
  { id: 'avatar-generator', name: 'AI Avatar Generator', description: 'Generate personal AI avatars', model: 'nano-banana-pro', cost: 3, inputType: 'image', route: '/images/tools/avatar-generator', badge: 'NEW' },
  { id: 'product-photo', name: 'Product Photography', description: 'Professional product photos', model: 'nano-banana-edit', cost: 2, inputType: 'image-text', route: '/images/tools/product-photo', badge: 'NEW' },
  { id: 'logo-generator', name: 'AI Logo Generator', description: 'Design logos with AI', model: 'nano-banana-pro', cost: 2, inputType: 'text', route: '/images/tools/logo-generator', badge: 'NEW' },
  { id: 'perspective-correction', name: 'Perspective Correction', description: 'Fix image perspective', model: 'nano-banana-edit', cost: 1, inputType: 'image', route: '/images/tools/perspective-correction' },
];

export const NEW_IMAGE_MODELS: ImageModel[] = [
  { id: 'seedream-5', name: 'SeDream 5.0', textToImage: 'fal-ai/bytedance/seedream/v5/lite/text-to-image', imageToImage: 'fal-ai/bytedance/seedream/v5/lite/edit', cost: 1, iconUrl: '/model-logos/bytedance.ico', badge: 'NEW' },
  { id: 'wan-2.2', name: 'Wan 2.2', textToImage: 'fal-ai/wan/v2.2-a14b/text-to-image', imageToImage: 'fal-ai/wan/v2.2-a14b/image-to-image', cost: 1, iconUrl: '/model-logos/google.ico', badge: 'NEW' },
];

export const FOOTBALL_CLUBS = [
  { name: 'Liverpool', colors: 'Red', stadium: 'Anfield' },
  { name: 'Barcelona', colors: 'Blue and Red', stadium: 'Camp Nou' },
  { name: 'Real Madrid', colors: 'White', stadium: 'Santiago Bernabéu' },
  { name: 'Manchester United', colors: 'Red', stadium: 'Old Trafford' },
  { name: 'Juventus', colors: 'Black and White', stadium: 'Allianz Stadium' },
  { name: 'Bayern Munich', colors: 'Red', stadium: 'Allianz Arena' },
  { name: 'Paris Saint-Germain', colors: 'Blue and Red', stadium: 'Parc des Princes' },
  { name: 'Chelsea', colors: 'Blue', stadium: 'Stamford Bridge' },
  { name: 'Arsenal', colors: 'Red and White', stadium: 'Emirates Stadium' },
  { name: 'Manchester City', colors: 'Sky Blue', stadium: 'Etihad Stadium' },
  { name: 'Inter Milan', colors: 'Blue and Black', stadium: 'San Siro' },
  { name: 'AC Milan', colors: 'Red and Black', stadium: 'San Siro' },
  { name: 'Tottenham Hotspur', colors: 'White and Navy', stadium: 'Tottenham Hotspur Stadium' },
  { name: 'Borussia Dortmund', colors: 'Yellow and Black', stadium: 'Signal Iduna Park' },
  { name: 'Atlético Madrid', colors: 'Red and White', stadium: 'Wanda Metropolitano' },
  { name: 'Ajax', colors: 'Red and White', stadium: 'Johan Cruyff Arena' },
  { name: 'Roma', colors: 'Red and Yellow', stadium: 'Stadio Olimpico' },
  { name: 'Napoli', colors: 'Blue', stadium: 'Stadio Diego Armando Maradona' },
  { name: 'Lazio', colors: 'Sky Blue', stadium: 'Stadio Olimpico' },
  { name: 'Sevilla', colors: 'White and Red', stadium: 'Ramón Sánchez Pizjuán' },
  { name: 'Valencia', colors: 'White and Black', stadium: 'Mestalla Stadium' },
  { name: 'Villarreal', colors: 'Yellow', stadium: 'Estadio de la Cerámica' },
  { name: 'Bayer Leverkusen', colors: 'Red and Black', stadium: 'BayArena' },
  { name: 'RB Leipzig', colors: 'Red and White', stadium: 'Red Bull Arena' },
  { name: 'Porto', colors: 'Blue and White', stadium: 'Estádio do Dragão' },
  { name: 'Benfica', colors: 'Red and White', stadium: 'Estádio da Luz' },
  { name: 'Galatasaray', colors: 'Red and Yellow', stadium: 'Türk Telekom Stadium' },
  { name: 'Fenerbahçe', colors: 'Yellow and Blue', stadium: 'Şükrü Saracoğlu Stadium' },
  { name: 'Flamengo', colors: 'Red and Black', stadium: 'Maracanã' },
  { name: 'Boca Juniors', colors: 'Blue and Yellow', stadium: 'La Bombonera' },
  { name: 'River Plate', colors: 'White and Red', stadium: 'Estadio Monumental' },
  { name: 'Inter Miami', colors: 'Pink and Black', stadium: 'DRV PNK Stadium' },
];

export const CLOTHES_STYLES = [
  {
    id: 'football',
    name: 'Football',
    previewUrl: 'https://j.top4top.io/p_3736n4ua61.jpeg',
    hasSubOptions: true,
  },
  {
    id: 'mirror-selfie',
    name: 'Mirror Selfie',
    previewUrl: 'https://freeimage.host/i/qiDieBs',
    prompt: 'Ultra-realistic mirror selfie of a me (uploaded pic) with glasses. He is wearing a loose brown sweater layered over a crisp white T-shirt, paired with blue jeans. A silver chain necklace adds a subtle accessory touch. He holds a new modern iPhone 17 smartphone orange colour in one hand, partially covering his face, while his other hand rests casually in his pocket. The scene is set in warm indoor lighting, creating a cinematic, moody atmosphere with soft shadow',
  },
  {
    id: 'mountain',
    name: 'Mountain Adventure',
    previewUrl: 'https://freeimage.host/i/qib4Qff',
    prompt: 'Ultra-realistic photo of a man sitting on the edge of a high mountain peak overlooking Rio de Janeiro, Brazil. The city, coastline, and Sugarloaf Mountain are visible in the background under a hazy blue sky. The man wears a dark gray t-shirt, light beige cargo shorts, and a black cap worn backward. He sits calmly, looking at the camera, with soft natural morning light illuminating the scene. The photo captures a sense of adventure, height, and tranquility, with a detailed view of the city and the ocean below. Shot in high resolution, DSLR-style realism.',
  },
  {
    id: 'gamer',
    name: 'Gamer Setup',
    previewUrl: 'https://freeimage.host/i/qimTzjR',
    prompt: 'Modelo masculino em um retrato ultra-realista em 8k, vestindo um moletom oversized preto e calças de moletom pretas, combinados com tênis brancos. O modelo está sentado elegantemente em uma cadeira gamer preta com iluminação LED, em um estúdio minimalista com fundo preto e uma luz suave e cinematográfica que destaca as texturas. O estilo é futurista e editorial, com o modelo em uma pose de moda, com a cabeça levemente inclinada. O rosto é consistente com o da foto fornecida.',
  },
  {
    id: 'business',
    name: 'Business Suit',
    previewUrl: 'https://freeimage.host/i/qiy3W3x',
    prompt: 'Keep the facial features of the person in the uploaded image exactly consistent. Dress them in a professional navy blue business suit with a white shirt. Background: clean, solid dark gray studio photography backdrop with subtle gradient. Photography Style: Shot on Sony A7III with 85mm f/1.4 lens. Lighting: classic three-point lighting setup. Render natural skin texture, add natural catchlights to the eyes. Ultra-realistic, 8k professional headshot.',
  },
  {
    id: 'esports',
    name: 'Esports',
    previewUrl: 'https://freeimage.host/i/qiytEzv',
    prompt: 'Please dress the person in the picture in a simple black T-shirt, similar to an esports jersey. Use strong contrast lighting to create a dark atmosphere, like in esports photography, where the focus is primarily on black. The background should be a solid black, fitting the esports style. The person should be centered in the frame, looking directly at the camera with their arms crossed over their chest, positioned straight and facing forward.',
  },
  {
    id: 'blank',
    name: 'Custom',
    previewUrl: '',
    prompt: '',
  },
];

export const getFootballPrompt = (club: typeof FOOTBALL_CLUBS[0]) =>
  `Ultra-realistic photographic image, preserving the exact facial features of the original person, a man wearing a ${club.colors} ${club.name} jersey, jumping in the middle of a decisive soccer match at ${club.stadium} filled with cheering crowd, heading the ball powerfully and focused toward the goal, surrounded by professional players wearing ${club.colors} ${club.name} kits, fast dynamic action captured with a professional camera, soccer ball mid-air heading towards the net, bright daylight with natural sunlight highlighting the player, detailed sweat and excited facial expressions, blurred crowd background creating depth, atmosphere full of energy, excitement, and focus, professional sports photography, 8K, extremely high resolution, natural and vibrant colors, hyper-realistic.`;
