import type { LandingContent } from "./types";

const nl: LandingContent = {
  meta: {
    title: "Megsy — All-in-one AI: Chat, Slides, Onderzoek, Beelden, Video's & Code",
    description: "Megsy combineert 80+ AI-modellen op één plek. Chat met GPT-5 en Gemini, maak slides, doe diepgaand onderzoek, genereer beelden met Nano Banana en Flux, video's met Veo 3 en full-stack apps met Megsy Build.",
    keywords: "AI platform, ChatGPT alternatief, AI beeldgenerator, AI videogenerator, AI slides, deep research, full-stack builder",
    ogLocale: "nl_NL",
  },
  hero: {
    h1Pre: "ÉÉN AI. ALLE",
    h1Highlight: "CREATIEVE TOOLS.",
    subtitle: "Chat, slides, diep onderzoek, beelden, video's, cinema, lip-sync en full-stack apps — de beste modellen ter wereld in één werkruimte.",
    ctaPrimary: "Gratis starten",
    ctaSecondary: "API-platform",
  },
  chatModels: {
    kicker: "MEGSY CHAT",
    title: "ÉÉN CHAT.",
    titleHighlight: "ELK MODEL.",
    subtitle: "Megsy kiest automatisch het beste model voor elk bericht, of kies handmatig. Wissel midden in een gesprek zonder context te verliezen.",
    items: [
      { name: "Megsy",          tag: "Standaard · Smart Router", description: "Kiest het perfecte model voor elke prompt. Gratis." },
      { name: "GPT-5",          tag: "OpenAI",                   description: "Beste-in-klasse redenering, code en lange teksten." },
      { name: "Gemini 2.5 Pro", tag: "Google",                   description: "1M-token context, native begrip van beelden en bestanden." },
      { name: "Grok",           tag: "xAI",                      description: "Real-time webkennis met directe, ongefilterde toon." },
      { name: "DeepSeek",       tag: "Open-source",              description: "Kostenefficiënte redeneermodel voor zware workloads." },
    ],
    modesTitle: "Gespecialiseerde modi",
    modes: [
      { name: "Leermodus",      description: "Stap-voor-stap uitleg, quizzen en studiekaarten over elk onderwerp." },
      { name: "Docs-modus",     description: "Professionele rapporten, contracten, onderzoekspapers en sjablonen." },
      { name: "Deep Research",  description: "Autonoom multi-bron onderzoek met bronvermelding." },
      { name: "Slides",         description: "Volledige presentaties met beelden, grafieken en thema's." },
    ],
  },
  imageModels: {
    kicker: "BEELDMODELLEN",
    title: "PIXELPERFECTE",
    titleHighlight: "BEELDGENERATIE.",
    subtitle: "Vijf vlaggenschipmodellen plus 20+ pro-tools — face swap, headshots, achtergrond verwijderen, relighten, cartoonifyen en meer.",
    items: [
      { name: "Nano Banana",     cost: "2 MC", description: "Bliksemsnelle generatie voor ideatie en iteratie." },
      { name: "Nano Banana Pro", cost: "4 MC", description: "Fotorealistisch detail met consistente personages en merk." },
      { name: "Nano Banana 2",   cost: "3 MC", description: "Nieuwe generatie met betere handen, tekst en anatomie." },
      { name: "Flux Schnell",    cost: "2 MC", description: "Open-source snelheidskampioen voor grote volumes." },
      { name: "Flux Pro",        cost: "5 MC", description: "Studio-kwaliteit voor hero-beelden, ads en posters." },
    ],
  },
  codeModels: {
    kicker: "MEGSY BUILD",
    title: "VAN PROMPT",
    titleHighlight: "NAAR VOLLEDIGE APP.",
    subtitle: "Beschrijf wat je wilt. Megsy Build maakt React + Tailwind frontend, database, auth, API — en deployed alles.",
    steps: [
      { title: "Code",      description: "Productieklare React, TypeScript en Tailwind met schone architectuur." },
      { title: "Cloud",     description: "Database, storage, edge functions en auth automatisch verbonden." },
      { title: "Snelheid",  description: "Lighthouse-geoptimaliseerde builds, lazy loading en beeldcompressie." },
      { title: "Beveiliging", description: "RLS-policies, secret-beheer en dependency-scans bij elke wijziging." },
      { title: "Publiceren", description: "One-click deploy naar je eigen domein met SSL en CDN." },
    ],
  },
  howItWorks: {
    title: "BEGIN",
    titleHighlight: "MET MEGSY",
    subtitle: "Van aanmelden tot deployen in vijf stappen.",
    steps: [
      { title: "Maak je account",     description: "Meld je in seconden aan en krijg gratis credits voor alle modellen." },
      { title: "Kies je tool",        description: "Chat, Image Studio, Video, Cinema, Slides, Docs of Builder — jij kiest." },
      { title: "Kies je model",       description: "80+ modellen van OpenAI, Google, Black Forest Labs, xAI en meer." },
      { title: "Maak & itereer",      description: "Genereren, bewerken, upscalen, restylen. Alles in je bibliotheek." },
      { title: "Exporteer & publiceer", description: "Download in elk formaat, publiceer op je domein of deel op socials." },
    ],
  },
  cta: {
    line1: "VERTROUWD DOOR",
    line2: "TOPCREATORS",
    subtitle: "Miljoenen creators en 's werelds meest innovatieve teams kiezen Megsy om sneller en gecontroleerder te leveren.",
    button: "Nu beginnen",
  },
  faq: {
    title: "FAQ",
    subtitle: "Alles wat je moet weten over Megsy.",
    items: [
      { q: "Wat is Megsy?", a: "Megsy is een AI-werkruimte die 80+ modellen voor chat, slides, deep research, beelden, video's, cinema, lip-sync en full-stack code combineert in één interface en één creditsysteem." },
      { q: "Welke modellen zijn inbegrepen?", a: "Chat: Megsy, GPT-5, Gemini 2.5 Pro, Grok, DeepSeek. Beeld: Nano Banana-familie, Flux Schnell en Pro. Video: Veo 3, Wan-X, Hunyuan. Plus voice, lip-sync en builder — alles in één abonnement." },
      { q: "Hoe werken MC-credits?", a: "MC (Megsy Credits) is de platformvaluta. Chat is gratis; beeld, video en tools kosten een klein beetje MC afhankelijk van het model. Build kost 5 MC. Credits zitten in elk plan." },
      { q: "Welke plannen zijn er?", a: "Starter ($25/maand · 250 MC), Pro ($49/maand · 500 MC + API + social publishing) en Elite ($149/maand · 1500 MC + webhooks + toegewijde support). Allen voor commercieel gebruik." },
      { q: "Spreekt Megsy Nederlands?", a: "Ja — Megsy begrijpt en genereert in 50+ talen waaronder Nederlands, Engels, Spaans, Frans, Duits, Chinees, Japans, Hindi en meer." },
      { q: "Is er een API?", a: "Ja. Pro- en Elite-plannen bevatten een developer-API voor beeld, video, chat en tools. Webhooks bij Elite." },
      { q: "Kan ik mijn Megsy Build-app publiceren?", a: "Ja. Megsy Build deployed je full-stack app op een beheerde cloud met eigen domein, SSL, CDN en database — zonder DevOps." },
    ],
  },
};

export default nl;
