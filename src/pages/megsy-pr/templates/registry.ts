import Jack3DCreatorPage from "./jack3d/Jack3DCreatorPage";
import jack3dThumb from "./jack3d/thumbnail.jpg";
import ToonhubHeroPage from "./toonhub/ToonhubHeroPage";
import toonhubThumb from "./toonhub/thumbnail.jpg";
import PrismaStudioPage from "./prisma/PrismaStudioPage";
import prismaThumb from "./prisma/thumbnail.jpg";
import AetheraHeroPage from "./aethera/AetheraHeroPage";
import aetheraThumb from "./aethera/thumbnail.jpg";
import VelorahHeroPage from "./velorah/VelorahHeroPage";
import velorahThumb from "./velorah/thumbnail.jpg";
import AsmeHeroPage from "./asme/AsmeHeroPage";
import asmeThumb from "./asme/thumbnail.jpg";
import AeonVoyagePage from "./aeon/AeonVoyagePage";
import aeonThumb from "./aeon/thumbnail.jpg";
import VexHeroPage from "./vex/VexHeroPage";
import vexThumb from "./vex/thumbnail.jpg";
import CuriousHeroPage from "./curious/CuriousHeroPage";
import curiousThumb from "./curious/thumbnail.jpg";
import SkyEliteHeroPage from "./skyelite/SkyEliteHeroPage";
import skyeliteThumb from "./skyelite/thumbnail.jpg";
import FormaHeroPage from "./forma/FormaHeroPage";
import formaThumb from "./forma/thumbnail.jpg";
import AxionStudioPage from "./axion/AxionStudioPage";
import axionThumb from "./axion/thumbnail.jpg";
import LinkFlowHeroPage from "./linkflow/LinkFlowHeroPage";
import linkflowThumb from "./linkflow/thumbnail.jpg";
import VaultShieldHeroPage from "./vaultshield/VaultShieldHeroPage";
import vaultshieldThumb from "./vaultshield/thumbnail.jpg";

export type InternalTemplate = {
  slug: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  Component: React.ComponentType;
  /** Prompt sent to the AI when the user clicks "Remix" */
  remixPrompt: string;
};

export const INTERNAL_TEMPLATES: InternalTemplate[] = [
  {
    slug: "jack-3d-creator",
    name: "Jack — 3D Creator",
    description:
      "Dark portfolio landing page with a magnetic 3D hero portrait, scroll-driven marquee, animated about section, and sticky stacking project cards.",
    category: "Portfolio",
    thumbnail: jack3dThumb,
    Component: Jack3DCreatorPage,
    remixPrompt:
      'Build a dark 3D creator portfolio landing page like the "Jack — 3D Creator" template: massive chrome gradient hero heading on #0C0C0C, scroll-driven horizontal marquee of preview tiles, about section with corner 3D ornaments and character-by-character scroll-reveal text, white services section with numbered list, and dark sticky-stacking project cards.',
  },
  {
    slug: "toonhub-figurines",
    name: "TOONHUB — 3D Figurines",
    description:
      "Full-viewport hero with a 4-character figurine carousel, giant Anton ghost text, animated background color crossfade, and circular nav buttons.",
    category: "Hero",
    thumbnail: toonhubThumb,
    Component: ToonhubHeroPage,
    remixPrompt:
      'Build a full-viewport hero section called "TOONHUB" with a 4-character 3D figurine carousel: giant Anton "3D SHAPE" ghost text behind, center figurine large with two blurred side figurines and one back figurine, animated background color crossfade per slide (orange/green/pink/blue), grain overlay, circular white-bordered prev/next buttons with ArrowLeft/ArrowRight icons, and an Anton "DISCOVER IT" link bottom-right. Use Inter for body and Anton for display, smooth 650ms cubic-bezier transitions.',
  },
  {
    slug: "prisma-studio",
    name: "Prisma — Creative Studio",
    description:
      "Cinematic dark landing page with a giant hero word, hanging navbar pill, scroll-revealed about copy, and a 4-card features grid with video and checklists.",
    category: "Studio",
    thumbnail: prismaThumb,
    Component: PrismaStudioPage,
    remixPrompt:
      'Build a dark cinematic creative studio landing called "Prisma" with three sections: hero with full-bleed background video, noise overlay, top-center hanging black navbar pill, giant cream "Prisma" word with WordsPullUp animation and asterisk, right-column description + cream pill CTA "Join the lab" with black icon circle; About section on #101010 with multi-style WordsPullUp (Almarai + Instrument Serif italic) and scroll-linked per-character opacity reveal; Features section with subtle noise bg and 4-card grid (1 video card + 3 dark #212121 cards with image icon, numbered title, green Check checklist, rotated arrow Learn more). Almarai global font, cream #E1E0CC text, framer-motion entrances.',
  },
  {
    slug: "aethera-hero",
    name: "Aethera — Cinematic Hero",
    description:
      "Minimal white hero with serif headline, italic gray accents, looping fade-in/out background video, clean navbar and pill CTAs.",
    category: "Hero",
    thumbnail: aetheraThumb,
    Component: AetheraHeroPage,
    remixPrompt:
      'Build a minimal fullscreen white hero section called "Aethera" with: Instrument Serif headline "Beyond silence, we build the eternal." (italic gray accents on "silence," and "the eternal."), Inter body, top navbar with serif "Aethera®" logo and 5 menu items (Home active black, others #6F6F6F) and black pill "Begin Journey" CTA, descriptive paragraph in gray, and a looping background video at top:300px with custom requestAnimationFrame fade-in/out (0.5s) and seamless restart on ended. White background, smooth fade-rise entrance animations with staggered 0/0.2/0.4s delays.',
  },
  {
    slug: "velorah-hero",
    name: "Velorah — Liquid Glass Hero",
    description:
      "Deep navy cinematic hero with fullscreen looping video, glassmorphic liquid-glass CTAs, and elegant Instrument Serif headline.",
    category: "Hero",
    thumbnail: velorahThumb,
    Component: VelorahHeroPage,
    remixPrompt:
      'Build a fullscreen cinematic hero called "Velorah" on a deep navy background (hsl 201 100% 13%) with a looping background video covering the viewport, a glassmorphic top navbar with serif "Velorah®" logo and Home/Studio/About/Journal/Reach Us links and a liquid-glass "Begin Journey" pill, a large Instrument Serif headline "Where dreams rise through the silence." with muted-gray italic accents on "dreams" and "through the silence.", muted subtext, and a centered liquid-glass "Begin Journey" CTA. Use a liquid-glass CSS class with backdrop blur and gradient mask border, and fade-rise animations staggered at 0/0.2/0.4s.',
  },
  {
    slug: "asme-hero",
    name: "Asme — AI No-Code Hero",
    description:
      "Fullscreen black hero with HLS Mux background video, glassmorphic pill navbar, gradient serif headline, and animated email capture CTA with typewriter placeholder.",
    category: "Hero",
    thumbnail: asmeThumb,
    Component: AsmeHeroPage,
    remixPrompt:
      'Build a fullscreen single-screen black hero called "Asme" with: an HLS Mux background video (via hls.js fallback), a centered glassmorphic liquid-glass pill navbar containing a Globe icon + "Asme" logo, nav links (Features/Pricing/About) and Sign Up + glass Login buttons; a centered hero with uppercase tracked tagline "BUILD A NO-CODE AI APP IN MINUTES", a gradient Instrument Serif headline "A new way to think and create with computers", and a CTA that morphs between a "Get early access" pill button and an email capture form with a typewriter placeholder and ArrowRight/Check submit icon (resets after 4s). White text selection, Inter body, framer-motion entrance animations.',
  },
  {
    slug: "aeon-voyage",
    name: "Aeon — Space Voyage",
    description:
      "Cinematic two-section space-travel landing with crossfading background videos, italic Instrument Serif headlines, glass nav + stats + capabilities cards.",
    category: "Landing",
    thumbnail: aeonThumb,
    Component: AeonVoyagePage,
    remixPrompt:
      'Build a cinematic dark space-travel landing page called "Aeon" with two full-height sections (Hero + Capabilities), each using a custom requestAnimationFrame crossfading background video (no CSS transitions, manual loop on ended). Use Instrument Serif italic for all headings and Barlow for body. Hero: glass pill navbar with italic "a" logo, "Maiden Crewed Voyage to Mars Arrives 2026" badge, BlurText word-by-word headline "Venture Past Our Sky Across the Universe", subtext, primary liquid-glass-strong "Start Your Voyage" + secondary "View Liftoff" with Play icon, two stat glass cards (34.5 Min, 2.8B+) with clock/globe icons, and a partners row (Aeon · Vela · Apex · Orbit · Zeno). Capabilities: "// Capabilities" kicker, huge italic "Production / evolved" heading, and three liquid-glass cards (AI Scenery, Batch Production, Smart Lighting) each with an icon, 4 tag pills, title and description. All text white, framer-motion blur-in entrances.',
  },
  {
    slug: "vex-hero",
    name: "VEX — Vision & Action",
    description:
      "Full-bleed background video hero with glass navbar, character-by-character animated headline, and bottom-aligned content with glass tag.",
    category: "Hero",
    thumbnail: vexThumb,
    Component: VexHeroPage,
    remixPrompt:
      'Build a full-screen dark hero called "VEX" with a raw fullscreen background video (no overlay), a liquid-glass rounded navbar (logo "VEX" + Story/Investing/Building/Advisory links + white "Start a Chat" pill), bottom-aligned hero content with a 2-column layout: left has a character-by-character animated headline "Shaping tomorrow / with vision and action." (-0.04em letter spacing, 30ms char delay), gray subtext "We back visionaries and craft ventures that define what comes next.", and two CTAs ("Start a Chat" solid white + "Explore Now" glass); right column has a glass tag "Investing. Building. Advisory." aligned bottom-right. Inter font, fade-in delays at 200/800/1200/1400ms.',
  },
  {
    slug: "curious-hero",
    name: "Curious — Newsletter Hero",
    description:
      "Cinematic dark hero with looping fade-video, glass navbar, serif headline, glass email capture and Manifesto CTA, with social icon footer.",
    category: "Hero",
    thumbnail: curiousThumb,
    Component: CuriousHeroPage,
    remixPrompt:
      'Build a fullscreen dark hero called "Built for the curious" with a looping background video shifted down 17% with custom requestAnimationFrame fade-in/out (500ms, lead 0.55s, manual loop on ended). Glass navbar with Globe + "Asme" logo, Features/Pricing/About links and Sign Up + glass Login buttons. Centered Instrument Serif headline "Built for the curious", a glass rounded-full email input with white circular ArrowRight submit, gray subtitle, and a glass "Manifesto" pill button. Footer with three glass circular social icons (Instagram, Twitter, Globe). All white text on black, liquid-glass utility for chrome.',
  },
  {
    slug: "skyelite-hero",
    name: "SkyElite — Private Jets Hero",
    description:
      "Clean premium private jet hero with fullscreen looping video, light navbar, overlapping two-line headline and pill CTAs.",
    category: "Hero",
    thumbnail: skyeliteThumb,
    Component: SkyEliteHeroPage,
    remixPrompt:
      'Build a premium private jet hero called "SkyElite" on bg-gray-50 with a fullscreen looping muted background video (object-cover, h-screen). Light navbar: "SkyElite" logo (gray-900), desktop links (Start/Story/Rates/Benefits/FAQ) hidden on mobile with a Lucide Menu/X hamburger dropdown (white/95 backdrop-blur rounded shadow). Centered hero pulled up with -mt-80: uppercase "PRIVATE JETS" label, two overlapping headlines "Premium." (text-gray-500) and "Accessible." (#202A36, -12px margin-top), subtitle "Your dedication deserves recognition.", and two pill CTAs: "Discover" (bg-gray-300) and "Book Now" (#202A36 hover #1a2229). Inter font, smooth transition-colors.',
  },
  {
    slug: "forma-microvisuals",
    name: "Forma — MicroVisuals",
    description:
      "Dark cinematic hero with frame-captured boomerang video background, gsap mouse parallax, italic serif headline, and liquid-glass nav + CTAs.",
    category: "Hero",
    thumbnail: formaThumb,
    Component: FormaHeroPage,
    remixPrompt:
      'Build a fullscreen dark hero called "Forma / MicroVisuals" with a background video that captures each frame to an offscreen canvas array (via requestVideoFrameCallback) then plays back as a boomerang (forward/reverse at 30fps) on a display canvas after the video ends. Use gsap for smooth lerped mouse parallax (strength 20, 0.06 ease) on the video layer. Italic Instrument Serif "MicroVisuals" headline (clamp 96-280px) at top:126px. Top-center liquid-glass pill nav with 3-bar LogoMark SVG, links (Gallery/Styles/API/Pricing/Blog), Sign in, and a liquid-glass-strong "Try it free" pill. Bottom row: left + right caption columns (white/75 max-w-220), center two pill CTAs ("Start generating" white + "See templates" liquid-glass) with hover scale/glow. Barlow body, black bg, fade-rise mount transitions.',
  },
  {
    slug: "axion-studio",
    name: "Axion Studio — Agency",
    description:
      "Light cinematic agency landing with Paper shader hero (Swirl + FlutedGlass + grain), pill navbar, text-roll CTAs, about grid, and case study video cards.",
    category: "Agency",
    thumbnail: axionThumb,
    Component: AxionStudioPage,
    remixPrompt:
      'Build a 3-section design agency landing called "Axion Studio": Hero on #EFEFEF with @paper-design/shaders-react Swirl + FlutedGlass + CSS grain overlay, white pill navbar (AX dark circle logo, Projects/Studio/Journal/Connect links, London live clock, dark "Book a strategy call" pill with text-roll hover + rotating arrow circle), mobile bottom-sheet menu, hero headline "We craft digital experiences for brands ready to dominate their category online." with orange #F26522 "Start a project" CTA and white "Certified Partner / Featured" badge with starburst SVG. About section on white: numbered "1 Introducing Axion" pill, h2 "Strategy-led creatives, delivering results in digital and beyond.", desktop 3-col grid (26%/1fr/48%) with two images and right-aligned paragraph + orange "About our studio" CTA. Case studies on #F5F5F5: numbered "2 Featured client work", h2 "Our projects", 2-col grid of video cards (Narrativ aspect 329/246 with expanding white "Learn more" link button; Luminar aspect-square with expanding dark "View case study" arrow button). All CTAs use a hover text-roll inside overflow-hidden h-[20px] with -translate-y-1/2 on group-hover, 500ms cubic-bezier(0.25,0.1,0.25,1).',
  },
  {
    slug: "linkflow-hero",
    name: "LinkFlow — Sage AI Hero",
    description:
      "Soft sage hero with boomerang frame-captured video background, glass pill navbar, animated hamburger menu, and stacked CTA blocks.",
    category: "Hero",
    thumbnail: linkflowThumb,
    Component: LinkFlowHeroPage,
    remixPrompt:
      'Build a single-screen sage-green hero called "LinkFlow" with a BoomerangVideoBg (captures video frames into canvases via requestVideoFrameCallback then plays forward/reverse at 30fps). Navbar: "LinkFlowTM" wordmark, center glass pill nav (Purpose/The Process/Tariffs + dark "Try it Live" pill), right Sign Me Up + Enter buttons. Mobile: animated hamburger/X rotate-scale swap, full-screen drawer slide from right (cubic-bezier(0.22,1,0.36,1)) with staggered link reveals. Hero copy: "Close the rift linking signals and action" (#336443/#85AB8B), sage paragraph. Bottom-left FluxEngineTM block with Sparkles icon, body copy, "Try it Live" pill + "Know More." link. Bottom-right glass Play circle "How we build? 1:35". Use lucide-react icons, no framer-motion — all CSS transitions.',
  },
  {
    slug: "vaultshield-hero",
    name: "VaultShield — Password Manager Hero",
    description:
      "Fullscreen video hero for a password manager with Helvetica Now Display heading, inline lock icons, purple CTA, and animated mobile sheet menu.",
    category: "Hero",
    thumbnail: vaultshieldThumb,
    Component: VaultShieldHeroPage,
    remixPrompt:
      'Build a fullscreen hero called "VaultShield" with a looping background video and dark text on top. Helvetica Now Display Bold heading "Lock Down Your Passwords with Ironclad Security" (color #192837) with inline Lucide icons Zap (before "Lock"), LockKeyhole (between "Passwords" and "with") and Fingerprint (after "Security"), Inter subtext at 0.8 opacity, and a purple #7342E2 pill CTA "Get It Free" with ArrowRightCircle (shadow 0 4px 24px rgba(115,66,226,0.28), hover scale 1.04 brightness 1.1). Navbar: custom angular SVG logo, desktop links (Vault/Plans/Install/News/Help), "Start For Free" purple + "Sign In" #F2F2EE pills. Mobile: hamburger opens framer-motion right sheet (#CFC8C5, 88vw/360px, ease [0.22,1,0.36,1], 0.45s) with staggered link reveals. fadeUp variants on heading/subtext/CTA with 0/0.15/0.30s delays.',
  },
];

export function getInternalTemplate(slug: string) {
  return INTERNAL_TEMPLATES.find((t) => t.slug === slug) ?? null;
}
