/** Landing-page templates for the slide generator.
 *
 * Two categories:
 *   - "premium"  → in-house, hand-curated templates we maintain ourselves.
 *   - "standard" → templates originally sourced from an external library.
 */
export type LandingCategory = "premium" | "standard";

export interface LandingTemplate {
  id: string;
  name: string;
  description: string;
  folder: string;
  category: LandingCategory;
  /** path under /public — fetched by the browser before sending to the edge fn */
  path: string;
  /** real screenshot under /public/template-thumbs/ */
  preview: string;
}

const t = (
  id: string,
  name: string,
  description: string,
  folder: string,
  category: LandingCategory,
): LandingTemplate => ({
  id,
  name,
  description,
  folder,
  category,
  path: `/templates/${folder}/index.html`,
  preview: `/template-thumbs/${folder}.jpg`,
});

export const LANDING_TEMPLATES: LandingTemplate[] = [
  // ─── Premium (all in-house templates we maintain) ───
  t("megsy-3d-portfolio", "Megsy 3D Atelier", "Cinematic 3D portfolio with neon UI", "remix-interactive-3d-portfolio", "premium"),
  t("megsy-graphic", "Megsy Color Lab", "Bold animated graphic-designer hero", "remix-animated-graphic-designer", "premium"),
  t("megsy-spider", "Megsy Comic Hero", "Comic-book cinematic landing page", "remix-cool-spiderman-website", "premium"),
  t("vanta-atelier", "Vanta Atelier", "Dark editorial digital studio", "remix-vanta-digital-atelier", "premium"),
  t("ai-builder", "AI Builder", "Modern SaaS landing for AI products", "remix-ai-website-builder-unlim", "premium"),
  t("game-launch", "Game Launch", "High-energy gaming launch page", "remix-game-landing-page-design", "premium"),
  t("neon-portfolio", "Neon Portfolio", "Neon designer portfolio", "remix-neon-portfolio-for-ui-de", "premium"),
  t("veloured", "Veloured", "Premium minimal modern landing", "remix-veloured-modern-landing-", "premium"),
  t("velammal", "Velammal", "Editorial corporate / institutional", "remix-velammal-engineering-col", "premium"),
  t("yash-verma", "Yash Verma", "Interactive personal brand", "remix-yash-verma-interactive-g", "premium"),
  t("forma", "Forma", "Ergonomic premium product page", "remix-forma-ergonomic-sofa", "premium"),
  t("abstract-vector", "Abstract Vector", "Abstract vector neon design", "remix-remix-abstract-vector-ne", "premium"),
  t("portfolio-3d", "3D Portfolio", "Interactive 3D portfolio website", "remix-3d-portfolio-website-bui", "premium"),
  t("documentary", "Documentary", "Documentary research storytelling", "remix-documentary-research-and", "premium"),
  t("fashion-ice", "Fashion Ice", "Editorial fashion with ice cubes", "remix-fashion-ice-cubes", "premium"),
  t("digital-marketplace", "Digital Marketplace", "Interactive 3D digital marketplace", "remix-interactive-3d-digital-m", "premium"),
  t("blob-landing", "Blob Landing", "Soft 3D blob landing page", "remix-landing-page-blobs", "premium"),
  t("landscape", "Landscape", "Architectural landscape design", "remix-landscape-design", "premium"),
  t("modern-ai", "Modern AI", "Modern visible AI website", "remix-modern-ai-visible-websit", "premium"),
  t("noodles", "Noodles Splash", "Playful noodles splash page", "remix-noodles-splash-page", "premium"),
  t("science-lab", "Science Lab", "Interactive science lab website", "remix-science-lab-website-with", "premium"),
];

export const DEFAULT_LANDING_TEMPLATE = LANDING_TEMPLATES[0].id;

export function findLandingTemplate(id?: string | null): LandingTemplate {
  return LANDING_TEMPLATES.find(x => x.id === id) || LANDING_TEMPLATES[0];
}
