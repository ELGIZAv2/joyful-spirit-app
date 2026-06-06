import type { LandingContent } from "./types";

const it: LandingContent = {
  meta: {
    title: "Megsy — IA Tutto-in-Uno: Chat, Slide, Ricerca, Immagini, Video e Codice",
    description: "Megsy unisce oltre 80 modelli IA in un solo posto. Chatta con GPT-5 e Gemini, crea presentazioni, fai ricerca approfondita, genera immagini con Nano Banana e Flux, video con Veo 3 e app full-stack con Megsy Build.",
    keywords: "piattaforma IA, alternativa ChatGPT, generatore immagini IA, generatore video IA, slide IA, deep research, builder full-stack",
    ogLocale: "it_IT",
  },
  hero: {
    h1Pre: "UN'IA. TUTTI",
    h1Highlight: "I TOOL CREATIVI.",
    subtitle: "Chat, slide, ricerca profonda, immagini, video, cinema, lip-sync e app full-stack — i migliori modelli al mondo in un unico workspace.",
    ctaPrimary: "Inizia gratis",
    ctaSecondary: "Piattaforma API",
  },
  chatModels: {
    kicker: "MEGSY CHAT",
    title: "UNA CHAT.",
    titleHighlight: "TUTTI I MODELLI.",
    subtitle: "Megsy sceglie il modello migliore per ogni messaggio, oppure scegli tu. Cambia in mezzo alla conversazione senza perdere il contesto.",
    items: [
      { name: "Megsy",          tag: "Default · Smart Router", description: "Sceglie il modello perfetto per ogni prompt. Gratis." },
      { name: "GPT-5",          tag: "OpenAI",                 description: "Ragionamento, codice e scrittura lunga ai massimi livelli." },
      { name: "Gemini 2.5 Pro", tag: "Google",                 description: "Contesto da 1M token, comprensione nativa di immagini." },
      { name: "Grok",           tag: "xAI",                    description: "Conoscenza web in tempo reale, tono diretto e senza filtri." },
      { name: "DeepSeek",       tag: "Open source",            description: "Ragionamento economico per carichi pesanti." },
    ],
    modesTitle: "Modalità specializzate",
    modes: [
      { name: "Modalità Apprendimento", description: "Spiegazioni passo-passo, quiz e schede di studio su ogni argomento." },
      { name: "Modalità Docs",          description: "Report, contratti, paper di ricerca e template professionali." },
      { name: "Deep Research",          description: "Ricerca autonoma multi-fonte con citazioni verificate." },
      { name: "Slides",                 description: "Presentazioni complete con immagini, grafici e temi pronti." },
    ],
  },
  imageModels: {
    kicker: "MODELLI IMMAGINE",
    title: "GENERAZIONE",
    titleHighlight: "PIXEL-PERFECT.",
    subtitle: "Cinque modelli flagship e oltre 20 tool pro — face swap, headshot, rimozione sfondo, relighting, cartoon e altro.",
    items: [
      { name: "Nano Banana",     cost: "2 MC", description: "Generazione ultra-rapida per ideazione e iterazione." },
      { name: "Nano Banana Pro", cost: "4 MC", description: "Dettaglio fotorealistico, personaggi e brand coerenti." },
      { name: "Nano Banana 2",   cost: "3 MC", description: "Nuova generazione con mani, testo e anatomia migliori." },
      { name: "Flux Schnell",    cost: "2 MC", description: "Campione open-source di velocità per grandi volumi." },
      { name: "Flux Pro",        cost: "5 MC", description: "Qualità da studio per hero image, ads e poster." },
    ],
  },
  codeModels: {
    kicker: "MEGSY BUILD",
    title: "DAL PROMPT",
    titleHighlight: "ALL'APP COMPLETA.",
    subtitle: "Descrivi cosa vuoi. Megsy Build genera frontend React + Tailwind, database, auth, API — e fa il deploy.",
    steps: [
      { title: "Codice",    description: "React, TypeScript e Tailwind production-ready con architettura pulita." },
      { title: "Cloud",     description: "Database, storage, edge functions e auth collegati automaticamente." },
      { title: "Velocità",  description: "Build ottimizzate Lighthouse, lazy loading e compressione immagini." },
      { title: "Sicurezza", description: "Policy RLS, gestione segreti e scan dipendenze a ogni cambio." },
      { title: "Pubblica",  description: "Deploy one-click sul tuo dominio con SSL e CDN inclusi." },
    ],
  },
  howItWorks: {
    title: "INIZIA",
    titleHighlight: "CON MEGSY",
    subtitle: "Dall'iscrizione al deploy in cinque passi.",
    steps: [
      { title: "Crea l'account",  description: "Registrati in pochi secondi e ottieni crediti gratuiti per provare ogni modello." },
      { title: "Scegli lo strumento", description: "Chat, Image Studio, Video, Cinema, Slide, Docs o Builder — scegli tu." },
      { title: "Scegli il modello", description: "Oltre 80 modelli di OpenAI, Google, Black Forest Labs, xAI e altri." },
      { title: "Crea e itera",    description: "Genera, modifica, upscale, restyle. Tutto salvato nella tua libreria." },
      { title: "Esporta e pubblica", description: "Scarica in ogni formato, pubblica sul tuo dominio o condividi sui social." },
    ],
  },
  cta: {
    line1: "SCELTO DAI",
    line2: "MIGLIORI CREATOR",
    subtitle: "Milioni di creator e i team più innovativi al mondo si affidano a Megsy per consegnare prima e meglio.",
    button: "Inizia ora",
  },
  faq: {
    title: "FAQ",
    subtitle: "Tutto quello che devi sapere su Megsy.",
    items: [
      { q: "Cos'è Megsy?", a: "Megsy è un workspace IA che unisce oltre 80 modelli per chat, slide, deep research, immagini, video, cinema, lip-sync e codice full-stack — un'interfaccia, un sistema di crediti." },
      { q: "Quali modelli sono inclusi?", a: "Chat: Megsy, GPT-5, Gemini 2.5 Pro, Grok, DeepSeek. Immagini: famiglia Nano Banana, Flux Schnell e Pro. Video: Veo 3, Wan-X, Hunyuan. Più voce, lip-sync e builder — tutto in un abbonamento." },
      { q: "Come funzionano i crediti MC?", a: "MC (Megsy Credits) è la valuta della piattaforma. Chat gratis; immagini, video e tool consumano MC in base al modello. Build costa 5 MC. Ogni piano include crediti." },
      { q: "Quali piani esistono?", a: "Starter (25 $/mese · 250 MC), Pro (49 $/mese · 500 MC + API + pubblicazione social) e Elite (149 $/mese · 1500 MC + webhook + supporto dedicato). Tutti per uso commerciale." },
      { q: "Megsy parla italiano?", a: "Sì — Megsy capisce e genera in oltre 50 lingue tra cui italiano, inglese, spagnolo, francese, tedesco, cinese, giapponese, hindi e molte altre." },
      { q: "C'è un'API?", a: "Sì. I piani Pro e Elite includono API per immagini, video, chat e tool. Webhook su Elite." },
      { q: "Posso pubblicare un'app Megsy Build?", a: "Sì. Megsy Build fa il deploy della tua app full-stack su una cloud gestita con dominio personalizzato, SSL, CDN e database — senza DevOps." },
    ],
  },
};

export default it;
