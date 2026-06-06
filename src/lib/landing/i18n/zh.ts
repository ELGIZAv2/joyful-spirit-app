import type { LandingContent } from "./types";

const zh: LandingContent = {
  meta: {
    title: "Megsy — 一体化 AI 平台：聊天、幻灯片、研究、图像、视频与代码",
    description: "Megsy 在一个平台上集合 80+ AI 模型。与 GPT-5、Gemini 聊天，生成幻灯片，进行深度研究，用 Nano Banana 和 Flux 生成图像，用 Veo 3 生成视频，并用 Megsy Build 构建全栈应用。",
    keywords: "AI 平台, ChatGPT 替代, AI 图像生成, AI 视频生成, AI 幻灯片, 深度研究, 全栈构建器",
    ogLocale: "zh_CN",
  },
  hero: {
    h1Pre: "一个 AI。所有",
    h1Highlight: "创意工具。",
    subtitle: "聊天、幻灯片、深度研究、图像、视频、电影、唇形同步与全栈应用 — 全球最佳模型，统一在一个工作区。",
    ctaPrimary: "免费开始",
    ctaSecondary: "API 平台",
  },
  chatModels: {
    kicker: "MEGSY 聊天",
    title: "一个聊天。",
    titleHighlight: "所有模型。",
    subtitle: "Megsy 智能为每条消息选择最佳模型，或者您自己选择。在对话中途切换模型而不丢失上下文。",
    items: [
      { name: "Megsy",          tag: "默认 · 智能路由",   description: "为每条提示选择完美的模型。免费使用。" },
      { name: "GPT-5",          tag: "OpenAI",         description: "顶级推理、编码和长文本写作能力。" },
      { name: "Gemini 2.5 Pro", tag: "Google",         description: "100 万 token 上下文，原生图像与文件理解。" },
      { name: "Grok",           tag: "xAI",            description: "实时网络知识，直率不加修饰。" },
      { name: "DeepSeek",       tag: "开源",            description: "面向高负载的经济型推理模型。" },
    ],
    modesTitle: "专属模式",
    modes: [
      { name: "学习模式",  description: "针对任何主题提供分步讲解、测验与学习卡片。" },
      { name: "Docs 模式", description: "专业报告、合同、研究论文和模板。" },
      { name: "深度研究",  description: "多来源自主研究，带可溯源引用。" },
      { name: "幻灯片",    description: "生成包含图像、图表与主题的完整演示文稿。" },
    ],
  },
  imageModels: {
    kicker: "图像模型",
    title: "像素级",
    titleHighlight: "图像生成。",
    subtitle: "五大旗舰模型加 20+ 专业工具 — 换脸、头像、抠图、补光、卡通化等。",
    items: [
      { name: "Nano Banana",     cost: "2 MC", description: "极速生成，适合构思与迭代。" },
      { name: "Nano Banana Pro", cost: "4 MC", description: "照片级细节，角色与品牌风格稳定一致。" },
      { name: "Nano Banana 2",   cost: "3 MC", description: "新一代，手部、文字和解剖结构更佳。" },
      { name: "Flux Schnell",    cost: "2 MC", description: "面向大批量创意工作的开源速度王者。" },
      { name: "Flux Pro",        cost: "5 MC", description: "面向主视觉、广告和海报的影棚级品质。" },
    ],
  },
  codeModels: {
    kicker: "MEGSY BUILD",
    title: "从提示词",
    titleHighlight: "到全栈应用。",
    subtitle: "描述你想要的。Megsy Build 生成 React + Tailwind 前端、数据库、认证、API — 并自动部署。",
    steps: [
      { title: "代码",  description: "生产级 React、TypeScript 和 Tailwind，架构整洁。" },
      { title: "云",    description: "数据库、存储、Edge Functions 和 Auth 自动接入。" },
      { title: "速度",  description: "针对 Lighthouse 优化的构建、懒加载和图片压缩。" },
      { title: "安全",  description: "RLS 策略、密钥管理、每次变更进行依赖扫描。" },
      { title: "发布",  description: "一键部署到您的自定义域名，包含 SSL 和 CDN。" },
    ],
  },
  howItWorks: {
    title: "立刻开始",
    titleHighlight: "MEGSY 之旅",
    subtitle: "从注册到部署，只需五步。",
    steps: [
      { title: "创建账户",  description: "数秒注册，立即获得免费积分体验所有模型。" },
      { title: "选择工具",  description: "聊天、Image Studio、视频、电影、幻灯片、Docs 或 Builder — 自由选择。" },
      { title: "选择模型",  description: "来自 OpenAI、Google、Black Forest Labs、xAI 等的 80+ 模型。" },
      { title: "创建与迭代", description: "生成、编辑、放大、换风格。所有版本保存在您的图库中。" },
      { title: "导出与发布", description: "以任何格式下载，发布到自定义域名或直接分享到社交平台。" },
    ],
  },
  cta: {
    line1: "受到",
    line2: "顶尖创作者信赖",
    subtitle: "数百万创作者和全球最具创新力的团队都选择 Megsy，更快、更精、更可控。",
    button: "立即开始",
  },
  faq: {
    title: "常见问题",
    subtitle: "关于 Megsy 你需要知道的一切。",
    items: [
      { q: "什么是 Megsy？", a: "Megsy 是一个 AI 工作区，将 80+ 模型整合到一个界面与一个积分系统中，用于聊天、幻灯片、深度研究、图像、视频、电影、唇形同步与全栈代码。" },
      { q: "包含哪些模型？", a: "聊天：Megsy、GPT-5、Gemini 2.5 Pro、Grok、DeepSeek。图像：Nano Banana 系列、Flux Schnell 与 Pro。视频：Veo 3、Wan-X、Hunyuan。还有语音、唇形同步与构建器 — 全部在一个订阅内。" },
      { q: "MC 积分如何运作？", a: "MC（Megsy Credits）是平台货币。聊天免费；图像、视频与工具按模型消耗少量 MC。Build 消耗 5 MC。每个套餐都包含积分。" },
      { q: "有哪些套餐？", a: "Starter（25 美元/月 · 250 MC）、Pro（49 美元/月 · 500 MC + API + 社交发布）和 Elite（149 美元/月 · 1500 MC + Webhooks + 专属支持）。全部支持商用。" },
      { q: "Megsy 支持中文吗？", a: "支持 — Megsy 理解并生成 50+ 种语言，包括中文、英语、西班牙语、法语、德语、日语、韩语、印地语等。" },
      { q: "有 API 吗？", a: "有。Pro 和 Elite 套餐包含图像、视频、聊天与工具的开发者 API。Webhooks 见 Elite。" },
      { q: "我可以发布 Megsy Build 应用吗？", a: "可以。Megsy Build 将您的全栈应用部署到托管云中，含自定义域名、SSL、CDN 与数据库 — 无需 DevOps。" },
    ],
  },
};

export default zh;
