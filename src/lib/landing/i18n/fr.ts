import type { LandingContent } from "./types";

const fr: LandingContent = {
  meta: {
    title: "Megsy — L'IA Tout-en-Un : Chat, Slides, Recherche, Images, Vidéos & Code",
    description: "Megsy réunit plus de 80 modèles d'IA en un seul espace. Chattez avec GPT-5 et Gemini, créez des slides, lancez de la recherche approfondie, générez images avec Nano Banana et Flux, vidéos avec Veo 3, et déployez des apps full-stack avec Megsy Build.",
    keywords: "plateforme IA, alternative ChatGPT, générateur d'images IA, générateur vidéo IA, slides IA, deep research, builder full-stack",
    ogLocale: "fr_FR",
  },
  hero: {
    h1Pre: "UNE IA. TOUS",
    h1Highlight: "VOS OUTILS CRÉATIFS.",
    subtitle: "Chat, slides, recherche profonde, images, vidéos, cinéma, lip-sync et apps full-stack — les meilleurs modèles du monde dans un seul espace de travail.",
    ctaPrimary: "Commencer — c'est gratuit",
    ctaSecondary: "Plateforme API",
  },
  chatModels: {
    kicker: "MEGSY CHAT",
    title: "UN CHAT.",
    titleHighlight: "TOUS LES MODÈLES.",
    subtitle: "Megsy choisit automatiquement le meilleur modèle pour chaque message, ou choisissez-le vous-même. Changez en pleine conversation sans perdre le contexte.",
    items: [
      { name: "Megsy",          tag: "Par défaut · Smart Router", description: "Sélectionne le modèle parfait pour chaque prompt. Gratuit." },
      { name: "GPT-5",          tag: "OpenAI",                    description: "Raisonnement, code et écriture longue au plus haut niveau." },
      { name: "Gemini 2.5 Pro", tag: "Google",                    description: "Contexte 1M tokens, compréhension native des images." },
      { name: "Grok",           tag: "xAI",                       description: "Connaissance web en temps réel, ton vif et sans filtre." },
      { name: "DeepSeek",       tag: "Open-source",               description: "Raisonnement économique pour charges lourdes." },
    ],
    modesTitle: "Modes spécialisés",
    modes: [
      { name: "Mode Apprentissage", description: "Explications pas à pas, quiz et fiches d'étude sur tout sujet." },
      { name: "Mode Docs",          description: "Rapports, contrats, papers de recherche et modèles pro." },
      { name: "Deep Research",      description: "Recherche autonome multi-sources avec citations sourcées." },
      { name: "Slides",             description: "Présentations complètes avec images, graphiques et thèmes." },
    ],
  },
  imageModels: {
    kicker: "MODÈLES D'IMAGE",
    title: "GÉNÉRATION",
    titleHighlight: "PIXEL-PERFECT.",
    subtitle: "Cinq modèles phares et plus de 20 outils pro — face swap, headshots, suppression de fond, relighting, cartoon et plus.",
    items: [
      { name: "Nano Banana",     cost: "2 MC", description: "Génération ultra-rapide pour idéation et itération." },
      { name: "Nano Banana Pro", cost: "4 MC", description: "Détail photoréaliste, personnages et identité cohérents." },
      { name: "Nano Banana 2",   cost: "3 MC", description: "Nouvelle génération : mains, texte et anatomie améliorés." },
      { name: "Flux Schnell",    cost: "2 MC", description: "Champion open-source de la vitesse pour gros volumes." },
      { name: "Flux Pro",        cost: "5 MC", description: "Qualité studio pour hero images, publicités et affiches." },
    ],
  },
  codeModels: {
    kicker: "MEGSY BUILD",
    title: "DU PROMPT À",
    titleHighlight: "L'APP COMPLÈTE.",
    subtitle: "Décrivez ce que vous voulez. Megsy Build génère le frontend React + Tailwind, la base de données, l'auth, l'API — et déploie.",
    steps: [
      { title: "Code",     description: "React, TypeScript et Tailwind prêts pour la production, architecture propre." },
      { title: "Cloud",    description: "Base de données, stockage, edge functions et auth câblés automatiquement." },
      { title: "Vitesse",  description: "Builds optimisés Lighthouse, lazy loading, compression d'images intégrée." },
      { title: "Sécurité", description: "Politiques RLS, gestion des secrets et scan des dépendances à chaque change." },
      { title: "Publier",  description: "Déploiement en un clic sur votre domaine avec SSL et CDN inclus." },
    ],
  },
  howItWorks: {
    title: "COMMENCEZ",
    titleHighlight: "AVEC MEGSY",
    subtitle: "De l'inscription au déploiement en cinq étapes.",
    steps: [
      { title: "Créez votre compte", description: "Inscription en quelques secondes et crédits gratuits pour explorer chaque modèle." },
      { title: "Choisissez votre outil", description: "Chat, Image Studio, Vidéo, Cinéma, Slides, Docs ou Builder — à vous de voir." },
      { title: "Choisissez votre modèle", description: "Plus de 80 modèles d'OpenAI, Google, Black Forest Labs, xAI et autres." },
      { title: "Créez & itérez",   description: "Générez, éditez, upscalez, restylez. Tout est sauvegardé dans votre bibliothèque." },
      { title: "Exportez & déployez", description: "Téléchargez, publiez sur votre domaine ou partagez sur les réseaux." },
    ],
  },
  cta: {
    line1: "ADOPTÉ PAR",
    line2: "LES MEILLEURS CRÉATEURS",
    subtitle: "Des millions de créateurs et les équipes les plus innovantes au monde utilisent Megsy pour livrer plus vite avec plus de contrôle.",
    button: "Commencer",
  },
  faq: {
    title: "FAQ",
    subtitle: "Tout ce que vous devez savoir sur Megsy.",
    items: [
      { q: "Qu'est-ce que Megsy ?", a: "Megsy est un espace de travail IA qui unifie plus de 80 modèles pour chat, slides, deep research, images, vidéos, cinéma, lip-sync et code full-stack — une interface, un système de crédits." },
      { q: "Quels modèles sont inclus ?", a: "Chat : Megsy, GPT-5, Gemini 2.5 Pro, Grok, DeepSeek. Images : famille Nano Banana, Flux Schnell et Pro. Vidéo : Veo 3, Wan-X, Hunyuan. Plus voix, lip-sync et builder — tout dans un seul abonnement." },
      { q: "Comment fonctionnent les crédits MC ?", a: "Les MC (Megsy Credits) sont la monnaie de la plateforme. Le chat est gratuit ; image, vidéo et outils consomment un peu de MC selon le modèle. Build coûte 5 MC. Chaque plan inclut des crédits." },
      { q: "Quels plans existe-t-il ?", a: "Starter (25 $/mois · 250 MC), Pro (49 $/mois · 500 MC + API + publication sociale) et Elite (149 $/mois · 1500 MC + webhooks + support dédié). Tous autorisent l'usage commercial." },
      { q: "Megsy parle-t-il français ?", a: "Oui — Megsy comprend et génère dans plus de 50 langues dont le français, l'anglais, l'espagnol, l'allemand, le chinois, le japonais, le hindi et bien d'autres." },
      { q: "Y a-t-il une API ?", a: "Oui. Les plans Pro et Elite incluent une API développeur pour image, vidéo, chat et outils. Webhooks sur Elite." },
      { q: "Puis-je publier une app Megsy Build ?", a: "Oui. Megsy Build déploie votre app full-stack sur un cloud géré avec domaine personnalisé, SSL, CDN et base de données — sans DevOps." },
    ],
  },
};

export default fr;
