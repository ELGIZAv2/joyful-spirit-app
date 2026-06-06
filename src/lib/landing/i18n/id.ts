import type { LandingContent } from "./types";

const id: LandingContent = {
  meta: {
    title: "Megsy — AI Serba Ada: Chat, Slide, Riset, Gambar, Video & Kode",
    description: "Megsy menyatukan 80+ model AI di satu tempat. Chat dengan GPT-5 dan Gemini, buat slide, jalankan riset mendalam, generate gambar dengan Nano Banana dan Flux, video dengan Veo 3, dan aplikasi full-stack dengan Megsy Build.",
    keywords: "platform AI, alternatif ChatGPT, generator gambar AI, generator video AI, slide AI, deep research, builder full-stack",
    ogLocale: "id_ID",
  },
  hero: {
    h1Pre: "SATU AI. SEMUA",
    h1Highlight: "ALAT KREATIFMU.",
    subtitle: "Chat, slide, riset mendalam, gambar, video, cinema, lip-sync, dan aplikasi full-stack — model terbaik di dunia dalam satu workspace.",
    ctaPrimary: "Mulai gratis",
    ctaSecondary: "Platform API",
  },
  chatModels: {
    kicker: "MEGSY CHAT",
    title: "SATU CHAT.",
    titleHighlight: "SEMUA MODEL.",
    subtitle: "Megsy otomatis memilih model terbaik untuk setiap pesan, atau pilih sendiri. Berpindah di tengah percakapan tanpa kehilangan konteks.",
    items: [
      { name: "Megsy",          tag: "Default · Smart Router", description: "Memilih model sempurna untuk setiap prompt. Gratis." },
      { name: "GPT-5",          tag: "OpenAI",                 description: "Penalaran, koding, dan tulisan panjang kelas dunia." },
      { name: "Gemini 2.5 Pro", tag: "Google",                 description: "Konteks 1M token, pemahaman gambar dan file native." },
      { name: "Grok",           tag: "xAI",                    description: "Pengetahuan web real-time dengan gaya bicara tajam." },
      { name: "DeepSeek",       tag: "Open-source",            description: "Model penalaran hemat biaya untuk beban berat." },
    ],
    modesTitle: "Mode Khusus",
    modes: [
      { name: "Mode Belajar",   description: "Penjelasan bertahap, kuis, dan kartu belajar untuk topik apa pun." },
      { name: "Mode Docs",      description: "Laporan profesional, kontrak, paper riset, dan template siap pakai." },
      { name: "Deep Research",  description: "Riset otonom multi-sumber dengan kutipan terverifikasi." },
      { name: "Slides",         description: "Presentasi lengkap dengan gambar, grafik, dan tema." },
    ],
  },
  imageModels: {
    kicker: "MODEL GAMBAR",
    title: "GENERASI GAMBAR",
    titleHighlight: "PIXEL-PERFECT.",
    subtitle: "Lima model unggulan plus 20+ alat pro — face swap, headshot, hapus latar, relighting, kartunisasi, dan lainnya.",
    items: [
      { name: "Nano Banana",     cost: "2 MC", description: "Generasi super cepat untuk eksplorasi ide dan iterasi." },
      { name: "Nano Banana Pro", cost: "4 MC", description: "Detail fotorealistis dengan karakter dan brand konsisten." },
      { name: "Nano Banana 2",   cost: "3 MC", description: "Generasi berikutnya dengan tangan, teks, dan anatomi lebih baik." },
      { name: "Flux Schnell",    cost: "2 MC", description: "Juara kecepatan open-source untuk volume tinggi." },
      { name: "Flux Pro",        cost: "5 MC", description: "Kualitas studio untuk hero image, iklan, dan poster." },
    ],
  },
  codeModels: {
    kicker: "MEGSY BUILD",
    title: "DARI PROMPT",
    titleHighlight: "JADI APP UTUH.",
    subtitle: "Cukup ceritakan keinginanmu. Megsy Build membuat frontend React + Tailwind, database, auth, API — dan langsung deploy.",
    steps: [
      { title: "Kode",     description: "React, TypeScript, dan Tailwind siap produksi dengan arsitektur rapi." },
      { title: "Cloud",    description: "Database, storage, edge functions, dan auth otomatis terhubung." },
      { title: "Kecepatan", description: "Build optimal untuk Lighthouse, lazy loading, dan kompresi gambar." },
      { title: "Keamanan", description: "Policy RLS, manajemen secret, dan pemindaian dependensi tiap perubahan." },
      { title: "Publikasi", description: "Deploy satu klik ke domain milikmu dengan SSL dan CDN." },
    ],
  },
  howItWorks: {
    title: "MULAI",
    titleHighlight: "DENGAN MEGSY",
    subtitle: "Dari daftar sampai deploy hanya lima langkah.",
    steps: [
      { title: "Buat akun",         description: "Daftar dalam hitungan detik dan dapat kredit gratis untuk semua model." },
      { title: "Pilih alat",        description: "Chat, Image Studio, Video, Cinema, Slide, Docs, atau Builder — pilih saja." },
      { title: "Pilih model",       description: "80+ model dari OpenAI, Google, Black Forest Labs, xAI dan lainnya." },
      { title: "Buat & iterasi",    description: "Generate, edit, upscale, restyle. Semua tersimpan di pustakamu." },
      { title: "Ekspor & terbitkan", description: "Download format apa pun, terbitkan di domain sendiri, atau bagikan ke media sosial." },
    ],
  },
  cta: {
    line1: "DIPERCAYA OLEH",
    line2: "KREATOR TERBAIK",
    subtitle: "Jutaan kreator dan tim paling inovatif di dunia mengandalkan Megsy untuk hasil yang lebih cepat dan terkontrol.",
    button: "Mulai sekarang",
  },
  faq: {
    title: "FAQ",
    subtitle: "Semua yang perlu kamu tahu tentang Megsy.",
    items: [
      { q: "Apa itu Megsy?", a: "Megsy adalah ruang kerja AI yang menyatukan 80+ model untuk chat, slide, deep research, gambar, video, cinema, lip-sync, dan kode full-stack — satu antarmuka, satu sistem kredit." },
      { q: "Model apa saja yang tersedia?", a: "Chat: Megsy, GPT-5, Gemini 2.5 Pro, Grok, DeepSeek. Gambar: keluarga Nano Banana, Flux Schnell dan Pro. Video: Veo 3, Wan-X, Hunyuan. Plus suara, lip-sync, dan builder — semua dalam satu langganan." },
      { q: "Bagaimana cara kerja kredit MC?", a: "MC (Megsy Credits) adalah mata uang platform. Chat gratis; gambar, video, dan tool memakai sedikit MC tergantung modelnya. Build 5 MC. Setiap paket sudah termasuk kredit." },
      { q: "Paket apa saja yang ada?", a: "Starter ($25/bulan · 250 MC), Pro ($49/bulan · 500 MC + API + publishing media sosial), dan Elite ($149/bulan · 1500 MC + webhook + dukungan khusus). Semua boleh dipakai komersial." },
      { q: "Apakah Megsy mendukung Bahasa Indonesia?", a: "Ya — Megsy memahami dan menghasilkan dalam 50+ bahasa termasuk Indonesia, Inggris, Spanyol, Prancis, Jerman, China, Jepang, Arab, dan lainnya." },
      { q: "Apakah ada API?", a: "Ada. Paket Pro dan Elite menyertakan API untuk gambar, video, chat, dan tools. Webhook di Elite." },
      { q: "Apakah saya bisa menerbitkan aplikasi Megsy Build?", a: "Ya. Megsy Build men-deploy aplikasi full-stack-mu ke cloud terkelola dengan domain sendiri, SSL, CDN, dan database — tanpa DevOps." },
    ],
  },
};

export default id;
