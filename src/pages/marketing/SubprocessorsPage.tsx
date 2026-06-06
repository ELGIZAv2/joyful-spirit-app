import LegalPageLayout, { LegalSection } from "@/components/landing/LegalPageLayout";

const sections: LegalSection[] = [
  {
    heading: "Why We Disclose",
    paragraphs: [
      "Transparency about who processes your data is a requirement of the EU GDPR (Article 28), the UK GDPR, the California CPRA, the Brazil LGPD, and most enterprise procurement frameworks. Below is the current list of sub-processors Megsy may engage to deliver the Services.",
      "We require every sub-processor to maintain security and confidentiality obligations no less protective than those in our Data Processing Addendum. We give 14 days' prior notice of any addition or change via email and on this page.",
    ],
  },
  {
    heading: "Infrastructure & Hosting",
    list: [
      "Lovable Cloud (Supabase) — managed Postgres database, authentication, object storage, edge functions. Region: Europe / United States. Purpose: primary application backend.",
      "Cloudflare, Inc. — CDN, DDoS protection, custom-domain routing, SSL. Global edge.",
      "Vercel / Lovable Edge — static asset delivery and preview environments.",
    ],
  },
  {
    heading: "AI Model Providers",
    paragraphs: [
      "Megsy routes inference requests to model providers strictly to fulfill the user's prompt. Inputs are not retained for training by Megsy and, where supported, are sent with provider-side training opt-out enabled.",
    ],
    list: [
      "Lovable AI Gateway — routing layer to multiple foundation-model providers.",
      "OpenAI, L.L.C. — text, image, and audio generation.",
      "Anthropic, PBC — text generation.",
      "Google LLC (Gemini, Imagen, Veo) — text, image, and video generation.",
      "Fal.ai, Inc. — image, video, and lipsync model inference.",
      "Replicate, Inc. — third-party model inference.",
      "fireworks.ai — text inference.",
      "ElevenLabs Inc. — voice generation.",
    ],
  },
  {
    heading: "Payments",
    paragraphs: [
      "All checkout, recurring billing, tax handling, and payout flows on Megsy AI are processed by Dodo Payments — our merchant of record. Megsy never sees, stores, or transmits full card numbers; payment data is handled exclusively by Dodo Payments' PCI-DSS Level 1 certified infrastructure.",
    ],
    list: [
      "Dodo Payments (Dodo Inc.) — merchant of record, card processing, recurring billing, tax compliance, payouts. https://dodopayments.com",
      "Payoneer Inc. — supplemental global payouts (planned).",
      "NowPayments — cryptocurrency payments (planned).",
    ],
  },
  {
    heading: "Communications & Support",
    list: [
      "Resend — transactional email delivery.",
      "Postmark / SendGrid — failover email.",
      "Telegram (bot API) — optional user notifications.",
    ],
  },
  {
    heading: "Analytics & Monitoring",
    list: [
      "PostHog, Inc. — privacy-respecting product analytics (self-host option available).",
      "Sentry — error monitoring (PII-scrubbed).",
    ],
  },
  {
    heading: "Code & Sandbox Execution",
    list: [
      "E2B — ephemeral isolated sandboxes for code execution and document rendering.",
      "GitHub, Inc. — optional Git integration when the user connects an account.",
    ],
  },
  {
    heading: "Notice of Changes",
    paragraphs: [
      "Subscribe to subprocessors@megsyai.com to receive at least 14 days' written notice of any new sub-processor, change in scope, or geographic relocation. You may object by replying to that notice; if we cannot accommodate a reasonable objection, you may terminate the affected Services and receive a pro-rata refund of pre-paid fees.",
    ],
  },
];

const SubprocessorsPage = () => (
  <LegalPageLayout
    eyebrow="Compliance"
    title="Sub-processors"
    subtitle="The third parties that help us deliver Megsy AI, what they do, and how we keep them accountable under GDPR Article 28."
    lastUpdated="May 19, 2026"
    sections={sections}
    seoTitle="Sub-processor List — Megsy AI"
    seoDescription="Up-to-date list of sub-processors Megsy AI engages to deliver hosting, AI inference, payments, communications, and analytics."
    canonicalPath="/legal/subprocessors"
    heroVariant="nature"
  />
);

export default SubprocessorsPage;
