import type { LandingContent } from "./types";

const de: LandingContent = {
  meta: {
    title: "Megsy — All-in-One KI: Chat, Slides, Recherche, Bilder, Videos & Code",
    description: "Megsy vereint über 80 KI-Modelle an einem Ort. Chatte mit GPT-5 und Gemini, baue Präsentationen, betreibe Deep Research, generiere Bilder mit Nano Banana und Flux, Videos mit Veo 3 und Full-Stack-Apps mit Megsy Build.",
    keywords: "KI Plattform, ChatGPT Alternative, KI Bildgenerator, KI Videogenerator, KI Präsentationen, Deep Research, Full-Stack Builder",
    ogLocale: "de_DE",
  },
  hero: {
    h1Pre: "EINE KI. ALLE",
    h1Highlight: "KREATIV-TOOLS.",
    subtitle: "Chat, Slides, Deep Research, Bilder, Videos, Cinema, Lip-Sync und Full-Stack-Apps — die besten Modelle der Welt in einem Workspace.",
    ctaPrimary: "Kostenlos starten",
    ctaSecondary: "API-Plattform",
  },
  chatModels: {
    kicker: "MEGSY CHAT",
    title: "EIN CHAT.",
    titleHighlight: "ALLE MODELLE.",
    subtitle: "Megsy wählt automatisch das beste Modell für jede Nachricht, oder du wählst manuell. Wechsle mitten im Gespräch ohne Kontextverlust.",
    items: [
      { name: "Megsy",          tag: "Standard · Smart Router", description: "Wählt das perfekte Modell für jeden Prompt. Kostenlos." },
      { name: "GPT-5",          tag: "OpenAI",                  description: "Beste Logik, Code und lange Texte auf Spitzenniveau." },
      { name: "Gemini 2.5 Pro", tag: "Google",                  description: "1M Token Kontext, native Bild- und Datei-Verarbeitung." },
      { name: "Grok",           tag: "xAI",                     description: "Echtzeit-Webwissen mit direktem, ungefiltertem Ton." },
      { name: "DeepSeek",       tag: "Open Source",             description: "Kosteneffizientes Reasoning für große Workloads." },
    ],
    modesTitle: "Spezialisierte Modi",
    modes: [
      { name: "Lernmodus",      description: "Schritt-für-Schritt-Erklärungen, Quizze und Lernkarten zu jedem Thema." },
      { name: "Docs-Modus",     description: "Professionelle Berichte, Verträge, Forschungspapiere und Vorlagen." },
      { name: "Deep Research",  description: "Autonome Multi-Quellen-Recherche mit belegten Zitaten." },
      { name: "Slides",         description: "Komplette Präsentationen mit Bildern, Charts und Themes." },
    ],
  },
  imageModels: {
    kicker: "BILDMODELLE",
    title: "PIXELGENAUE",
    titleHighlight: "BILDGENERIERUNG.",
    subtitle: "Fünf Top-Modelle plus über 20 Pro-Tools — Face Swap, Headshots, Hintergrund entfernen, Relight, Cartoon und mehr.",
    items: [
      { name: "Nano Banana",     cost: "2 MC", description: "Blitzschnelle Generierung für Ideation und Iteration." },
      { name: "Nano Banana Pro", cost: "4 MC", description: "Fotorealistische Details mit konsistenten Charakteren und Brand." },
      { name: "Nano Banana 2",   cost: "3 MC", description: "Neue Generation mit besseren Händen, Text und Anatomie." },
      { name: "Flux Schnell",    cost: "2 MC", description: "Open-Source-Geschwindigkeitschampion für hohe Volumen." },
      { name: "Flux Pro",        cost: "5 MC", description: "Studio-Qualität für Hero-Bilder, Anzeigen und Plakate." },
    ],
  },
  codeModels: {
    kicker: "MEGSY BUILD",
    title: "VON PROMPT",
    titleHighlight: "ZUR FULL-STACK-APP.",
    subtitle: "Beschreibe was du willst. Megsy Build generiert React + Tailwind Frontend, Datenbank, Auth und API — und deployed.",
    steps: [
      { title: "Code",       description: "Produktionsreifes React, TypeScript und Tailwind mit sauberer Architektur." },
      { title: "Cloud",      description: "Datenbank, Storage, Edge Functions und Auth — automatisch verkabelt." },
      { title: "Speed",      description: "Lighthouse-optimierte Builds, Lazy Loading, Bildkomprimierung." },
      { title: "Security",   description: "RLS-Policies, Secret-Management und Dependency-Scans bei jeder Änderung." },
      { title: "Publish",    description: "Ein-Klick-Deploy auf deine Domain mit SSL und CDN." },
    ],
  },
  howItWorks: {
    title: "LOSLEGEN",
    titleHighlight: "MIT MEGSY",
    subtitle: "Von Anmeldung bis Deployment in fünf Schritten.",
    steps: [
      { title: "Konto erstellen",   description: "In Sekunden anmelden und kostenlose Credits für alle Modelle erhalten." },
      { title: "Tool wählen",       description: "Chat, Image Studio, Video, Cinema, Slides, Docs oder Builder — du entscheidest." },
      { title: "Modell wählen",     description: "Über 80 Modelle von OpenAI, Google, Black Forest Labs, xAI und mehr." },
      { title: "Erstellen & iterieren", description: "Generieren, editieren, hochskalieren, umstylen. Alles in deiner Bibliothek." },
      { title: "Exportieren & deployen", description: "Download in jedem Format, auf eigener Domain veröffentlichen oder teilen." },
    ],
  },
  cta: {
    line1: "VERTRAUT VON",
    line2: "TOP-CREATORS",
    subtitle: "Millionen Creator und die innovativsten Teams der Welt setzen auf Megsy, um schneller und kontrollierter zu liefern.",
    button: "Jetzt starten",
  },
  faq: {
    title: "FAQ",
    subtitle: "Alles was du über Megsy wissen musst.",
    items: [
      { q: "Was ist Megsy?", a: "Megsy ist ein KI-Workspace, der über 80 Modelle für Chat, Slides, Deep Research, Bilder, Videos, Cinema, Lip-Sync und Full-Stack-Code vereint — eine Oberfläche, ein Credit-System." },
      { q: "Welche Modelle sind enthalten?", a: "Chat: Megsy, GPT-5, Gemini 2.5 Pro, Grok, DeepSeek. Bilder: Nano Banana Familie, Flux Schnell und Pro. Video: Veo 3, Wan-X, Hunyuan. Plus Voice, Lip-Sync und Builder — alles in einem Abo." },
      { q: "Wie funktionieren MC-Credits?", a: "MC (Megsy Credits) ist die Plattform-Währung. Chat ist gratis; Bilder, Videos und Tools verbrauchen je nach Modell ein paar MC. Build kostet 5 MC. Jeder Plan enthält Credits." },
      { q: "Welche Pläne gibt es?", a: "Starter (25 $/Monat · 250 MC), Pro (49 $/Monat · 500 MC + API + Social Publishing) und Elite (149 $/Monat · 1500 MC + Webhooks + Premium-Support). Alle erlauben kommerzielle Nutzung." },
      { q: "Spricht Megsy Deutsch?", a: "Ja — Megsy versteht und generiert in über 50 Sprachen inkl. Deutsch, Englisch, Spanisch, Französisch, Portugiesisch, Chinesisch, Japanisch, Hindi und mehr." },
      { q: "Gibt es eine API?", a: "Ja. Pro- und Elite-Pläne enthalten eine Entwickler-API für Bild, Video, Chat und Tools. Webhooks bei Elite." },
      { q: "Kann ich meine Megsy Build App veröffentlichen?", a: "Ja. Megsy Build deployed deine Full-Stack-App in eine managed Cloud mit eigener Domain, SSL, CDN und Datenbank — ohne DevOps." },
    ],
  },
};

export default de;
