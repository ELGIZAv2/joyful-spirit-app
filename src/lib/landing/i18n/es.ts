import type { LandingContent } from "./types";

const es: LandingContent = {
  meta: {
    title: "Megsy — IA Todo en Uno: Chat, Diapositivas, Investigación, Imágenes, Vídeos y Código",
    description: "Megsy reúne más de 80 modelos de IA en un solo lugar. Chatea con GPT-5 y Gemini, crea presentaciones, investiga en profundidad, genera imágenes con Nano Banana y Flux, vídeos con Veo 3 y aplicaciones full-stack con Megsy Build.",
    keywords: "plataforma IA, alternativa ChatGPT, generador de imágenes IA, generador de vídeo IA, presentaciones IA, deep research, builder full-stack",
    ogLocale: "es_ES",
  },
  hero: {
    h1Pre: "UNA IA. TODAS",
    h1Highlight: "TUS HERRAMIENTAS.",
    subtitle: "Chat, diapositivas, investigación profunda, imágenes, vídeos, cine, lip-sync y apps full-stack — los mejores modelos del mundo en un solo espacio.",
    ctaPrimary: "Empieza gratis",
    ctaSecondary: "Plataforma API",
  },
  chatModels: {
    kicker: "MEGSY CHAT",
    title: "UN CHAT.",
    titleHighlight: "TODOS LOS MODELOS.",
    subtitle: "Megsy elige el modelo perfecto para cada mensaje o tú decides. Cambia a mitad de conversación sin perder contexto.",
    items: [
      { name: "Megsy",          tag: "Por defecto · Smart Router", description: "Elige el modelo ideal para cada prompt. Gratis." },
      { name: "GPT-5",          tag: "OpenAI",                     description: "Razonamiento, código y escritura larga al máximo nivel." },
      { name: "Gemini 2.5 Pro", tag: "Google",                     description: "Contexto de 1M de tokens y comprensión nativa de imágenes." },
      { name: "Grok",           tag: "xAI",                        description: "Conocimiento web en tiempo real con tono directo y sin filtros." },
      { name: "DeepSeek",       tag: "Open-source",                description: "Modelo de razonamiento económico para cargas pesadas." },
    ],
    modesTitle: "Modos especializados",
    modes: [
      { name: "Modo Aprendizaje", description: "Explicaciones paso a paso, exámenes y tarjetas de estudio para cualquier tema." },
      { name: "Modo Docs",        description: "Informes, contratos, papers de investigación y plantillas profesionales." },
      { name: "Deep Research",    description: "Investigación autónoma multi-fuente con citas verificadas." },
      { name: "Slides",           description: "Presentaciones completas con imágenes, gráficos y temas listos." },
    ],
  },
  imageModels: {
    kicker: "MODELOS DE IMAGEN",
    title: "IMÁGENES",
    titleHighlight: "PIXEL-PERFECT.",
    subtitle: "Cinco modelos insignia más de 20 herramientas pro — face swap, headshots, eliminar fondo, reiluminar, caricaturizar y más.",
    items: [
      { name: "Nano Banana",     cost: "2 MC", description: "Generación ultrarrápida para idear e iterar." },
      { name: "Nano Banana Pro", cost: "4 MC", description: "Detalle fotorrealista con personajes y marca consistentes." },
      { name: "Nano Banana 2",   cost: "3 MC", description: "Nueva generación con mejores manos, texto y anatomía." },
      { name: "Flux Schnell",    cost: "2 MC", description: "Campeón open-source en velocidad para alto volumen creativo." },
      { name: "Flux Pro",        cost: "5 MC", description: "Calidad de estudio para hero images, anuncios y carteles." },
    ],
  },
  codeModels: {
    kicker: "MEGSY BUILD",
    title: "DE PROMPT",
    titleHighlight: "A APP COMPLETA.",
    subtitle: "Describe lo que quieres. Megsy Build genera el frontend React + Tailwind, la base de datos, la auth, la API — y lo despliega.",
    steps: [
      { title: "Código",     description: "React, TypeScript y Tailwind listos para producción con arquitectura limpia." },
      { title: "Cloud",      description: "Base de datos, storage, edge functions y auth conectados automáticamente." },
      { title: "Velocidad",  description: "Builds optimizados para Lighthouse, lazy loading y compresión de imagen." },
      { title: "Seguridad",  description: "Políticas RLS, gestión de secretos y escaneo de dependencias en cada cambio." },
      { title: "Publicar",   description: "Deploy con un clic a tu dominio propio con SSL y CDN incluidos." },
    ],
  },
  howItWorks: {
    title: "EMPIEZA",
    titleHighlight: "CON MEGSY",
    subtitle: "Del registro al despliegue en cinco pasos.",
    steps: [
      { title: "Crea tu cuenta",   description: "Regístrate en segundos y consigue créditos gratis para probar cada modelo." },
      { title: "Elige tu herramienta", description: "Chat, Image Studio, Vídeo, Cine, Slides, Docs o Builder — tú decides." },
      { title: "Elige tu modelo",  description: "Más de 80 modelos de OpenAI, Google, Black Forest Labs, xAI y más." },
      { title: "Crea e itera",     description: "Genera, edita, mejora resolución y cambia estilo. Todo guardado en tu biblioteca." },
      { title: "Exporta y publica", description: "Descarga en cualquier formato, publica en tu dominio o comparte en redes." },
    ],
  },
  cta: {
    line1: "ELEGIDA POR",
    line2: "LOS MEJORES CREADORES",
    subtitle: "Millones de creadores y los equipos más innovadores del mundo confían en Megsy para ir más rápido y con más control.",
    button: "Empezar ahora",
  },
  faq: {
    title: "Preguntas",
    subtitle: "Todo lo que necesitas saber sobre Megsy.",
    items: [
      { q: "¿Qué es Megsy?", a: "Megsy es un espacio de trabajo de IA que unifica más de 80 modelos para chat, slides, deep research, imágenes, vídeos, cine, lip-sync y código full-stack — una interfaz, un sistema de créditos." },
      { q: "¿Qué modelos incluye?", a: "Chat: Megsy, GPT-5, Gemini 2.5 Pro, Grok, DeepSeek. Imágenes: familia Nano Banana, Flux Schnell y Pro. Vídeo: Veo 3, Wan-X, Hunyuan. Más voz, lip-sync y builder — todo en una suscripción." },
      { q: "¿Cómo funcionan los créditos MC?", a: "MC (Megsy Credits) es la moneda de la plataforma. El chat es gratis; imagen, vídeo y herramientas consumen MC según el modelo. Build cuesta 5 MC. Cada plan incluye créditos." },
      { q: "¿Qué planes hay?", a: "Starter ($25/mes · 250 MC), Pro ($49/mes · 500 MC + API + publicación social) y Elite ($149/mes · 1500 MC + webhooks + soporte dedicado). Todos permiten uso comercial." },
      { q: "¿Está disponible en español?", a: "Sí — Megsy entiende y genera en más de 50 idiomas incluyendo español, inglés, francés, alemán, portugués, chino, japonés, hindi y muchos más." },
      { q: "¿Hay API?", a: "Sí. Los planes Pro y Elite incluyen API para imagen, vídeo, chat y herramientas. Webhooks en Elite." },
      { q: "¿Puedo publicar mi app de Megsy Build?", a: "Sí. Megsy Build despliega tu app full-stack en una nube gestionada con dominio propio, SSL, CDN y base de datos — sin DevOps." },
    ],
  },
};

export default es;
