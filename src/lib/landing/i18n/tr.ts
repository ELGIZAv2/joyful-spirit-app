import type { LandingContent } from "./types";

const tr: LandingContent = {
  meta: {
    title: "Megsy — Hepsi-Bir-Arada Yapay Zeka: Sohbet, Slayt, Araştırma, Görsel, Video ve Kod",
    description: "Megsy 80'den fazla yapay zeka modelini tek yerde topluyor. GPT-5 ve Gemini ile sohbet edin, slayt oluşturun, derin araştırma yapın, Nano Banana ve Flux ile görsel, Veo 3 ile video, Megsy Build ile full-stack uygulamalar üretin.",
    keywords: "yapay zeka platformu, ChatGPT alternatifi, yapay zeka görsel üretici, yapay zeka video üretici, AI slayt, deep research, full-stack builder",
    ogLocale: "tr_TR",
  },
  hero: {
    h1Pre: "TEK YAPAY ZEKA. TÜM",
    h1Highlight: "YARATICI ARAÇLAR.",
    subtitle: "Sohbet, slayt, derin araştırma, görsel, video, sinema, lip-sync ve full-stack uygulamalar — dünyanın en iyi modelleri tek bir çalışma alanında.",
    ctaPrimary: "Ücretsiz başla",
    ctaSecondary: "API Platformu",
  },
  chatModels: {
    kicker: "MEGSY SOHBET",
    title: "TEK SOHBET.",
    titleHighlight: "TÜM MODELLER.",
    subtitle: "Megsy her mesaj için en uygun modeli kendisi seçer, ya da siz seçin. Bağlamı kaybetmeden konuşma ortasında geçiş yapın.",
    items: [
      { name: "Megsy",          tag: "Varsayılan · Smart Router", description: "Her prompt için mükemmel modeli seçer. Ücretsiz." },
      { name: "GPT-5",          tag: "OpenAI",                    description: "Akıl yürütme, kodlama ve uzun yazı için sınıfının en iyisi." },
      { name: "Gemini 2.5 Pro", tag: "Google",                    description: "1M token bağlam, görsel ve dosya anlama desteği." },
      { name: "Grok",           tag: "xAI",                       description: "Gerçek zamanlı web bilgisi, direkt ve filtresiz." },
      { name: "DeepSeek",       tag: "Açık kaynak",               description: "Ağır işler için ekonomik akıl yürütme modeli." },
    ],
    modesTitle: "Özel Modlar",
    modes: [
      { name: "Öğrenme Modu",   description: "Her konuda adım adım açıklamalar, quizler ve çalışma kartları." },
      { name: "Docs Modu",      description: "Profesyonel raporlar, sözleşmeler, araştırma kağıtları ve şablonlar." },
      { name: "Deep Research",  description: "Çok kaynaklı otonom araştırma, kaynaklı atıflarla." },
      { name: "Slayt",          description: "Görsel, grafik ve temalı tam sunumlar üretin." },
    ],
  },
  imageModels: {
    kicker: "GÖRSEL MODELLER",
    title: "PİKSEL PİKSEL",
    titleHighlight: "GÖRSEL ÜRETİMİ.",
    subtitle: "Beş amiral model ve 20'den fazla pro araç — yüz değiştirme, headshot, arka plan kaldırma, yeniden aydınlatma, çizgi film ve daha fazlası.",
    items: [
      { name: "Nano Banana",     cost: "2 MC", description: "Fikir ve denemeler için şimşek hızında üretim." },
      { name: "Nano Banana Pro", cost: "4 MC", description: "Tutarlı karakter ve marka ile foto-gerçekçi detay." },
      { name: "Nano Banana 2",   cost: "3 MC", description: "Daha iyi el, yazı ve anatomiyle yeni nesil kalite." },
      { name: "Flux Schnell",    cost: "2 MC", description: "Yüksek hacim için açık kaynak hız şampiyonu." },
      { name: "Flux Pro",        cost: "5 MC", description: "Hero görseller, reklamlar ve posterler için stüdyo kalitesi." },
    ],
  },
  codeModels: {
    kicker: "MEGSY BUILD",
    title: "PROMPT'TAN",
    titleHighlight: "TAM UYGULAMAYA.",
    subtitle: "Ne istediğinizi yazın. Megsy Build React + Tailwind frontend, veritabanı, kimlik doğrulama ve API üretir — sonra yayına alır.",
    steps: [
      { title: "Kod",       description: "Üretime hazır React, TypeScript ve Tailwind, temiz mimari." },
      { title: "Bulut",     description: "Veritabanı, depolama, edge functions ve auth otomatik bağlı." },
      { title: "Hız",       description: "Lighthouse odaklı build, lazy loading ve görsel sıkıştırma." },
      { title: "Güvenlik",  description: "Her değişiklikte RLS, gizli yönetimi ve bağımlılık tarama." },
      { title: "Yayınla",   description: "Tek tıkla kendi alan adınıza SSL ve CDN ile deploy." },
    ],
  },
  howItWorks: {
    title: "BAŞLA",
    titleHighlight: "MEGSY İLE",
    subtitle: "Kayıttan yayına beş adımda.",
    steps: [
      { title: "Hesabı oluştur",      description: "Saniyeler içinde kaydolun ve tüm modelleri denemek için ücretsiz kredi alın." },
      { title: "Aracı seç",           description: "Sohbet, Image Studio, Video, Sinema, Slayt, Docs veya Builder — siz seçin." },
      { title: "Modeli seç",          description: "OpenAI, Google, Black Forest Labs, xAI ve daha fazlasından 80+ model." },
      { title: "Üret ve iterasyon",   description: "Üretin, düzenleyin, büyütün, yeniden stilize edin. Hepsi kitaplığınızda." },
      { title: "Dışa aktar ve yayınla", description: "Her formatta indirin, kendi domaininize yayınlayın ya da sosyal medyaya paylaşın." },
    ],
  },
  cta: {
    line1: "GÜVENİLEN",
    line2: "ÖNCÜ KREATÖRLER",
    subtitle: "Milyonlarca kreatör ve dünyanın en yenilikçi takımları Megsy ile daha hızlı ve kontrollü üretiyor.",
    button: "Hemen başla",
  },
  faq: {
    title: "SSS",
    subtitle: "Megsy hakkında bilmeniz gereken her şey.",
    items: [
      { q: "Megsy nedir?", a: "Megsy; sohbet, slayt, deep research, görsel, video, sinema, lip-sync ve full-stack kod için 80+ modeli tek arayüz ve tek kredi sisteminde birleştiren bir yapay zeka çalışma alanıdır." },
      { q: "Hangi modeller var?", a: "Sohbet: Megsy, GPT-5, Gemini 2.5 Pro, Grok, DeepSeek. Görsel: Nano Banana ailesi, Flux Schnell ve Pro. Video: Veo 3, Wan-X, Hunyuan. Ayrıca ses, lip-sync ve builder modelleri — tek abonelikte." },
      { q: "MC kredileri nasıl çalışır?", a: "MC (Megsy Credits) platformun parasıdır. Sohbet ücretsiz; görsel, video ve araçlar modele göre küçük miktarda MC harcar. Build 5 MC tutar. Krediler her planda gelir." },
      { q: "Planlar neler?", a: "Starter (25 $/ay · 250 MC), Pro (49 $/ay · 500 MC + API + sosyal yayın) ve Elite (149 $/ay · 1500 MC + webhook + öncelikli destek). Hepsi ticari kullanıma uygun." },
      { q: "Megsy Türkçe destekliyor mu?", a: "Evet — Megsy Türkçe dahil 50'den fazla dilde anlar ve üretir; İngilizce, İspanyolca, Fransızca, Almanca, Çince, Japonca, Hintçe ve daha fazlası." },
      { q: "API var mı?", a: "Evet. Pro ve Elite planları görsel, video, sohbet ve araçlar için geliştirici API içerir. Webhook Elite'te." },
      { q: "Megsy Build uygulamamı yayınlayabilir miyim?", a: "Evet. Megsy Build full-stack uygulamanızı kendi domain, SSL, CDN ve veritabanıyla yönetilen buluta yayınlar — DevOps gerekmeden." },
    ],
  },
};

export default tr;
