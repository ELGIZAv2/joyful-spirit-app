import type { LandingContent } from "./types";

const ko: LandingContent = {
  meta: {
    title: "Megsy — 올인원 AI: 채팅, 슬라이드, 리서치, 이미지, 비디오, 코드",
    description: "Megsy는 80개 이상의 AI 모델을 한곳에 모았습니다. GPT-5와 Gemini로 채팅, 슬라이드 제작, 딥 리서치, Nano Banana와 Flux로 이미지, Veo 3로 비디오, Megsy Build로 풀스택 앱을 만드세요.",
    keywords: "AI 플랫폼, ChatGPT 대안, AI 이미지 생성기, AI 비디오 생성기, AI 슬라이드, 딥 리서치, 풀스택 빌더",
    ogLocale: "ko_KR",
  },
  hero: {
    h1Pre: "하나의 AI. 모든",
    h1Highlight: "크리에이티브 도구.",
    subtitle: "채팅, 슬라이드, 딥 리서치, 이미지, 비디오, 시네마, 립싱크, 풀스택 앱 — 세계 최고의 모델을 하나의 워크스페이스에서.",
    ctaPrimary: "무료로 시작하기",
    ctaSecondary: "API 플랫폼",
  },
  chatModels: {
    kicker: "MEGSY 채팅",
    title: "하나의 채팅.",
    titleHighlight: "모든 모델.",
    subtitle: "Megsy가 각 메시지에 맞는 최적의 모델을 자동 선택하거나 직접 고를 수 있습니다. 대화 중에도 컨텍스트를 잃지 않고 전환됩니다.",
    items: [
      { name: "Megsy",          tag: "기본 · 스마트 라우터", description: "모든 프롬프트에 완벽한 모델을 선택. 무료 사용." },
      { name: "GPT-5",          tag: "OpenAI",            description: "최고 수준의 추론, 코드, 장문 작성 능력." },
      { name: "Gemini 2.5 Pro", tag: "Google",            description: "100만 토큰 컨텍스트, 네이티브 이미지·파일 이해." },
      { name: "Grok",           tag: "xAI",               description: "실시간 웹 지식, 솔직하고 위트 있는 톤." },
      { name: "DeepSeek",       tag: "오픈소스",            description: "대규모 워크로드를 위한 저비용 추론 모델." },
    ],
    modesTitle: "전문 모드",
    modes: [
      { name: "학습 모드",  description: "모든 주제에 대한 단계별 설명, 퀴즈, 학습 카드." },
      { name: "Docs 모드", description: "전문 보고서, 계약서, 연구 논문, 템플릿." },
      { name: "딥 리서치",  description: "다중 출처 자율 리서치, 출처 인용 포함." },
      { name: "슬라이드",    description: "이미지, 차트, 테마가 포함된 완전한 프레젠테이션." },
    ],
  },
  imageModels: {
    kicker: "이미지 모델",
    title: "픽셀 단위로",
    titleHighlight: "완벽한 이미지 생성.",
    subtitle: "5가지 플래그십 모델과 20개 이상의 프로 도구 — 얼굴 합성, 헤드샷, 배경 제거, 재조명, 만화화 등.",
    items: [
      { name: "Nano Banana",     cost: "2 MC", description: "아이디어와 반복에 최적인 초고속 생성." },
      { name: "Nano Banana Pro", cost: "4 MC", description: "캐릭터와 브랜드가 일관된 사진처럼 정교한 디테일." },
      { name: "Nano Banana 2",   cost: "3 MC", description: "손, 텍스트, 해부학이 향상된 차세대 품질." },
      { name: "Flux Schnell",    cost: "2 MC", description: "대량 작업을 위한 오픈소스 속도 챔피언." },
      { name: "Flux Pro",        cost: "5 MC", description: "히어로 이미지, 광고, 포스터를 위한 스튜디오급 품질." },
    ],
  },
  codeModels: {
    kicker: "MEGSY BUILD",
    title: "프롬프트에서",
    titleHighlight: "풀스택 앱으로.",
    subtitle: "원하는 것을 설명하세요. Megsy Build가 React + Tailwind 프런트엔드, 데이터베이스, 인증, API를 생성하고 배포까지 합니다.",
    steps: [
      { title: "코드",   description: "프로덕션 수준의 React, TypeScript, Tailwind, 깔끔한 아키텍처." },
      { title: "클라우드", description: "데이터베이스, 스토리지, Edge Functions, 인증 자동 연결." },
      { title: "속도",   description: "Lighthouse 최적화 빌드, 레이지 로딩, 이미지 압축." },
      { title: "보안",   description: "RLS 정책, 시크릿 관리, 변경마다 의존성 스캔." },
      { title: "게시",   description: "SSL과 CDN 포함, 커스텀 도메인에 원클릭 배포." },
    ],
  },
  howItWorks: {
    title: "시작하기",
    titleHighlight: "MEGSY와 함께",
    subtitle: "가입부터 배포까지 다섯 단계.",
    steps: [
      { title: "계정 만들기",   description: "몇 초 만에 가입하고 모든 모델을 체험할 무료 크레딧 받기." },
      { title: "도구 선택",     description: "채팅, Image Studio, 비디오, 시네마, 슬라이드, Docs, Builder 중 선택." },
      { title: "모델 선택",     description: "OpenAI, Google, Black Forest Labs, xAI 등에서 80+ 모델." },
      { title: "만들고 다듬기", description: "생성, 편집, 업스케일, 리스타일 — 모두 라이브러리에 저장." },
      { title: "내보내기·게시", description: "원하는 포맷으로 다운로드, 도메인 게시, SNS에 공유." },
    ],
  },
  cta: {
    line1: "최고의 크리에이터가",
    line2: "선택한 도구",
    subtitle: "수백만 명의 크리에이터와 가장 혁신적인 팀들이 Megsy로 더 빠르고 정교하게 작업합니다.",
    button: "지금 시작",
  },
  faq: {
    title: "FAQ",
    subtitle: "Megsy에 대해 알아야 할 모든 것.",
    items: [
      { q: "Megsy란?", a: "Megsy는 채팅, 슬라이드, 딥 리서치, 이미지, 비디오, 시네마, 립싱크, 풀스택 코드를 위한 80+ 모델을 하나의 인터페이스와 하나의 크레딧 시스템에 통합한 AI 워크스페이스입니다." },
      { q: "어떤 모델이 포함되나요?", a: "채팅: Megsy, GPT-5, Gemini 2.5 Pro, Grok, DeepSeek. 이미지: Nano Banana 패밀리, Flux Schnell·Pro. 비디오: Veo 3, Wan-X, Hunyuan. 음성, 립싱크, 빌더까지 단일 구독으로 제공." },
      { q: "MC 크레딧은 어떻게 작동하나요?", a: "MC(Megsy Credits)는 플랫폼 화폐입니다. 채팅은 무료, 이미지·비디오·도구는 모델에 따라 소량의 MC를 소비합니다. Build는 5 MC. 모든 플랜에 크레딧 포함." },
      { q: "어떤 플랜이 있나요?", a: "Starter($25/월 · 250 MC), Pro($49/월 · 500 MC + API + 소셜 게시), Elite($149/월 · 1500 MC + Webhooks + 전담 지원). 모두 상업적 사용 가능." },
      { q: "한국어를 지원하나요?", a: "네 — Megsy는 한국어를 포함한 50개 이상의 언어를 이해하고 생성합니다(영어, 스페인어, 프랑스어, 독일어, 중국어, 일본어, 힌디어 등)." },
      { q: "API가 있나요?", a: "있습니다. Pro와 Elite 플랜은 이미지, 비디오, 채팅, 도구를 위한 개발자 API를 포함합니다. Webhooks는 Elite." },
      { q: "Megsy Build 앱을 게시할 수 있나요?", a: "네. Megsy Build는 풀스택 앱을 커스텀 도메인, SSL, CDN, 데이터베이스가 포함된 관리형 클라우드에 배포합니다. DevOps 불필요." },
    ],
  },
};

export default ko;
