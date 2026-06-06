import type { LandingContent } from "./types";

const pt: LandingContent = {
  meta: {
    title: "Megsy — IA Tudo-em-Um: Chat, Slides, Pesquisa, Imagens, Vídeos e Código",
    description: "Megsy reúne mais de 80 modelos de IA em um único lugar. Converse com GPT-5 e Gemini, crie apresentações, faça pesquisa profunda, gere imagens com Nano Banana e Flux, vídeos com Veo 3 e apps full-stack com Megsy Build.",
    keywords: "plataforma IA, alternativa ChatGPT, gerador de imagens IA, gerador de vídeo IA, slides IA, deep research, builder full-stack",
    ogLocale: "pt_BR",
  },
  hero: {
    h1Pre: "UMA IA. TODAS AS",
    h1Highlight: "FERRAMENTAS CRIATIVAS.",
    subtitle: "Chat, slides, pesquisa profunda, imagens, vídeos, cinema, lip-sync e apps full-stack — os melhores modelos do mundo num só workspace.",
    ctaPrimary: "Começar grátis",
    ctaSecondary: "Plataforma API",
  },
  chatModels: {
    kicker: "MEGSY CHAT",
    title: "UM CHAT.",
    titleHighlight: "TODOS OS MODELOS.",
    subtitle: "Megsy escolhe o melhor modelo para cada mensagem, ou você decide. Troque no meio da conversa sem perder o contexto.",
    items: [
      { name: "Megsy",          tag: "Padrão · Smart Router", description: "Escolhe o modelo ideal para cada prompt. Grátis." },
      { name: "GPT-5",          tag: "OpenAI",                description: "Raciocínio, código e escrita longa no nível mais alto." },
      { name: "Gemini 2.5 Pro", tag: "Google",                description: "Contexto de 1M tokens e compreensão nativa de imagens." },
      { name: "Grok",           tag: "xAI",                   description: "Conhecimento web em tempo real, tom direto e sem filtros." },
      { name: "DeepSeek",       tag: "Open-source",           description: "Raciocínio econômico para cargas pesadas." },
    ],
    modesTitle: "Modos especializados",
    modes: [
      { name: "Modo Aprendizado", description: "Explicações passo a passo, quizzes e flashcards para qualquer tema." },
      { name: "Modo Docs",        description: "Relatórios, contratos, papers de pesquisa e templates profissionais." },
      { name: "Deep Research",    description: "Pesquisa autônoma multi-fonte com citações verificadas." },
      { name: "Slides",           description: "Apresentações completas com imagens, gráficos e temas prontos." },
    ],
  },
  imageModels: {
    kicker: "MODELOS DE IMAGEM",
    title: "IMAGENS",
    titleHighlight: "PIXEL-PERFECT.",
    subtitle: "Cinco modelos principais e mais de 20 ferramentas pro — face swap, headshots, remoção de fundo, reiluminação, cartoon e mais.",
    items: [
      { name: "Nano Banana",     cost: "2 MC", description: "Geração ultra-rápida para ideação e iteração." },
      { name: "Nano Banana Pro", cost: "4 MC", description: "Detalhe fotorrealista com personagens e marca consistentes." },
      { name: "Nano Banana 2",   cost: "3 MC", description: "Nova geração com mãos, texto e anatomia melhorados." },
      { name: "Flux Schnell",    cost: "2 MC", description: "Campeão open-source de velocidade para alto volume." },
      { name: "Flux Pro",        cost: "5 MC", description: "Qualidade de estúdio para hero images, anúncios e pôsteres." },
    ],
  },
  codeModels: {
    kicker: "MEGSY BUILD",
    title: "DE PROMPT",
    titleHighlight: "A APP COMPLETO.",
    subtitle: "Descreva o que quer. Megsy Build gera o frontend React + Tailwind, banco, auth, API — e faz deploy.",
    steps: [
      { title: "Código",     description: "React, TypeScript e Tailwind prontos para produção, arquitetura limpa." },
      { title: "Cloud",      description: "Banco, storage, edge functions e auth conectados automaticamente." },
      { title: "Velocidade", description: "Builds otimizados para Lighthouse, lazy loading e compressão de imagem." },
      { title: "Segurança",  description: "Políticas RLS, gestão de segredos e scan de dependências a cada mudança." },
      { title: "Publicar",   description: "Deploy com um clique no seu domínio com SSL e CDN incluídos." },
    ],
  },
  howItWorks: {
    title: "COMECE",
    titleHighlight: "COM MEGSY",
    subtitle: "Do cadastro ao deploy em cinco passos.",
    steps: [
      { title: "Crie sua conta",       description: "Cadastro em segundos e créditos grátis para testar todos os modelos." },
      { title: "Escolha a ferramenta", description: "Chat, Image Studio, Vídeo, Cinema, Slides, Docs ou Builder — você decide." },
      { title: "Escolha o modelo",     description: "Mais de 80 modelos de OpenAI, Google, Black Forest Labs, xAI e outros." },
      { title: "Crie e itere",         description: "Gere, edite, faça upscale, mude estilo. Tudo salvo na sua biblioteca." },
      { title: "Exporte e publique",   description: "Baixe em qualquer formato, publique no seu domínio ou compartilhe nas redes." },
    ],
  },
  cta: {
    line1: "USADO POR",
    line2: "TOP CRIADORES",
    subtitle: "Milhões de criadores e os times mais inovadores do mundo usam Megsy para entregar mais rápido e com mais controle.",
    button: "Começar agora",
  },
  faq: {
    title: "FAQ",
    subtitle: "Tudo o que você precisa saber sobre Megsy.",
    items: [
      { q: "O que é Megsy?", a: "Megsy é um workspace de IA que unifica mais de 80 modelos para chat, slides, deep research, imagens, vídeos, cinema, lip-sync e código full-stack — uma interface, um sistema de créditos." },
      { q: "Quais modelos estão incluídos?", a: "Chat: Megsy, GPT-5, Gemini 2.5 Pro, Grok, DeepSeek. Imagens: família Nano Banana, Flux Schnell e Pro. Vídeo: Veo 3, Wan-X, Hunyuan. Mais voz, lip-sync e builder — tudo numa assinatura." },
      { q: "Como funcionam os créditos MC?", a: "MC (Megsy Credits) é a moeda da plataforma. Chat é grátis; imagem, vídeo e ferramentas consomem MC conforme o modelo. Build custa 5 MC. Cada plano inclui créditos." },
      { q: "Quais planos existem?", a: "Starter ($25/mês · 250 MC), Pro ($49/mês · 500 MC + API + publicação social) e Elite ($149/mês · 1500 MC + webhooks + suporte dedicado). Todos permitem uso comercial." },
      { q: "Megsy fala português?", a: "Sim — Megsy entende e gera em mais de 50 idiomas incluindo português, inglês, espanhol, francês, alemão, chinês, japonês, hindi e muitos outros." },
      { q: "Existe API?", a: "Sim. Planos Pro e Elite incluem API para imagem, vídeo, chat e ferramentas. Webhooks no Elite." },
      { q: "Posso publicar meu app Megsy Build?", a: "Sim. Megsy Build faz deploy do seu app full-stack numa cloud gerenciada com domínio próprio, SSL, CDN e banco — sem DevOps." },
    ],
  },
};

export default pt;
