import type { LandingContent } from "./types";

const ja: LandingContent = {
  meta: {
    title: "Megsy — オールインワン AI：チャット、スライド、リサーチ、画像、動画、コード",
    description: "Megsy は 80 以上の AI モデルを 1 か所に集約。GPT-5 や Gemini とチャット、スライド作成、ディープリサーチ、Nano Banana・Flux で画像生成、Veo 3 で動画、Megsy Build でフルスタックアプリを構築。",
    keywords: "AI プラットフォーム, ChatGPT 代替, AI 画像生成, AI 動画生成, AI スライド, ディープリサーチ, フルスタックビルダー",
    ogLocale: "ja_JP",
  },
  hero: {
    h1Pre: "ひとつの AI。すべての",
    h1Highlight: "クリエイティブツール。",
    subtitle: "チャット、スライド、ディープリサーチ、画像、動画、シネマ、リップシンク、フルスタックアプリ — 世界最高峰のモデルを一つのワークスペースに。",
    ctaPrimary: "無料で始める",
    ctaSecondary: "API プラットフォーム",
  },
  chatModels: {
    kicker: "MEGSY チャット",
    title: "ひとつのチャット。",
    titleHighlight: "すべてのモデル。",
    subtitle: "Megsy がメッセージごとに最適なモデルを自動選択、または手動で切り替え。会話の途中でもコンテキストを失いません。",
    items: [
      { name: "Megsy",          tag: "デフォルト · スマートルーター", description: "プロンプトごとに最適なモデルを選択。無料。" },
      { name: "GPT-5",          tag: "OpenAI",                       description: "トップクラスの推論・コード・長文ライティング。" },
      { name: "Gemini 2.5 Pro", tag: "Google",                       description: "100 万トークンのコンテキスト、ネイティブな画像・ファイル理解。" },
      { name: "Grok",           tag: "xAI",                          description: "リアルタイムのウェブ知識、率直で機知に富んだトーン。" },
      { name: "DeepSeek",       tag: "オープンソース",                 description: "大規模ワークロード向けの低コスト推論モデル。" },
    ],
    modesTitle: "特化モード",
    modes: [
      { name: "学習モード",      description: "あらゆるトピックのステップ解説、クイズ、学習カード。" },
      { name: "Docs モード",     description: "プロ仕様のレポート、契約書、研究論文、テンプレート。" },
      { name: "ディープリサーチ", description: "複数ソースを自律調査し、出典付きで引用。" },
      { name: "スライド",         description: "画像、チャート、テーマ付きの完全なプレゼンを生成。" },
    ],
  },
  imageModels: {
    kicker: "画像モデル",
    title: "ピクセルパーフェクトな",
    titleHighlight: "画像生成。",
    subtitle: "主力 5 モデルと 20 以上のプロツール — 顔交換、ヘッドショット、背景除去、リライト、漫画化など。",
    items: [
      { name: "Nano Banana",     cost: "2 MC", description: "アイデア出しと反復に最適な超高速生成。" },
      { name: "Nano Banana Pro", cost: "4 MC", description: "キャラクターとブランドを一貫させたフォトリアルな精細表現。" },
      { name: "Nano Banana 2",   cost: "3 MC", description: "手・テキスト・解剖が向上した次世代モデル。" },
      { name: "Flux Schnell",    cost: "2 MC", description: "大量制作向けのオープンソース・スピードキング。" },
      { name: "Flux Pro",        cost: "5 MC", description: "ヒーロー画像・広告・ポスター向けのスタジオ品質。" },
    ],
  },
  codeModels: {
    kicker: "MEGSY BUILD",
    title: "プロンプトから",
    titleHighlight: "フルスタックアプリへ。",
    subtitle: "やりたいことを伝えるだけ。Megsy Build が React + Tailwind フロント、DB、認証、API を生成し、デプロイまで実行。",
    steps: [
      { title: "コード",      description: "本番品質の React、TypeScript、Tailwind、クリーンな構成。" },
      { title: "クラウド",    description: "DB、ストレージ、Edge Functions、認証を自動配線。" },
      { title: "スピード",    description: "Lighthouse 最適化ビルド、遅延読み込み、画像圧縮。" },
      { title: "セキュリティ", description: "RLS ポリシー、シークレット管理、変更毎に依存スキャン。" },
      { title: "公開",        description: "カスタムドメインへ SSL と CDN 込みでワンクリックデプロイ。" },
    ],
  },
  howItWorks: {
    title: "始めよう",
    titleHighlight: "MEGSY で",
    subtitle: "登録からデプロイまで 5 ステップ。",
    steps: [
      { title: "アカウント作成", description: "数秒で登録、無料クレジットで全モデルを即体験。" },
      { title: "ツールを選ぶ",   description: "チャット、Image Studio、動画、シネマ、スライド、Docs、Builder からどうぞ。" },
      { title: "モデルを選ぶ",   description: "OpenAI、Google、Black Forest Labs、xAI など 80+ モデル。" },
      { title: "作成と反復",     description: "生成・編集・アップスケール・リスタイル。すべてライブラリに保存。" },
      { title: "書き出し・公開", description: "任意フォーマットでダウンロード、ドメインに公開、SNS でシェア。" },
    ],
  },
  cta: {
    line1: "トップクリエイターに",
    line2: "選ばれています",
    subtitle: "数百万のクリエイターと世界で最も革新的なチームが、より速く、より洗練された制作のために Megsy を選択。",
    button: "今すぐ始める",
  },
  faq: {
    title: "FAQ",
    subtitle: "Megsy について知っておくべきこと。",
    items: [
      { q: "Megsy とは？", a: "Megsy は 80 以上のモデルを 1 つの UI と 1 つのクレジット体系に統合した AI ワークスペースで、チャット、スライド、ディープリサーチ、画像、動画、シネマ、リップシンク、フルスタックコードに対応します。" },
      { q: "どんなモデルが入っていますか？", a: "チャット：Megsy、GPT-5、Gemini 2.5 Pro、Grok、DeepSeek。画像：Nano Banana ファミリー、Flux Schnell と Pro。動画：Veo 3、Wan-X、Hunyuan。音声、リップシンク、ビルダーも含めて 1 つのサブスクで利用可能。" },
      { q: "MC クレジットの仕組みは？", a: "MC（Megsy Credits）はプラットフォーム通貨です。チャットは無料、画像・動画・ツールはモデルに応じて少量の MC を消費。Build は 5 MC。クレジットは各プランに含まれます。" },
      { q: "プランは？", a: "Starter（$25/月 · 250 MC）、Pro（$49/月 · 500 MC + API + SNS 投稿）、Elite（$149/月 · 1500 MC + Webhooks + 専任サポート）。すべて商用利用可能。" },
      { q: "日本語に対応していますか？", a: "はい — Megsy は日本語を含む 50 以上の言語を理解・生成します（英語、スペイン語、フランス語、ドイツ語、中国語、韓国語、ヒンディー語、他）。" },
      { q: "API はありますか？", a: "あります。Pro と Elite プランには画像、動画、チャット、ツール向けの開発者 API が含まれます。Webhooks は Elite。" },
      { q: "Megsy Build のアプリは公開できますか？", a: "はい。Megsy Build はフルスタックアプリをカスタムドメイン、SSL、CDN、DB 込みのマネージドクラウドへデプロイします。DevOps 不要。" },
    ],
  },
};

export default ja;
