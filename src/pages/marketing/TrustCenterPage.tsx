import LegalPageLayout, { type LegalSection } from "@/components/landing/LegalPageLayout";

const sections: LegalSection[] = [
  {
    heading: "Our Trust Commitment",
    paragraphs: [
      "Megsy AI serves creators, businesses, and enterprises in over 180 countries. This Trust Center consolidates everything you need to evaluate Megsy for personal, regulated, or enterprise use — our compliance posture, third-party sub-processors, accessibility commitments, law-enforcement procedures, and annual transparency.",
      "Megsy for Digital Platforms & E-Commerce Development LLC is registered in the Arab Republic of Egypt — Commercial Registry 248691, Tax ID 774034785. We comply with the laws of Egypt and with the cross-border requirements of every jurisdiction where our users reside.",
    ],
  },
  {
    heading: "Global Legal Framework",
    list: [
      "European Union — GDPR, ePrivacy, Digital Services Act (DSA), Digital Markets Act, EU AI Act, European Accessibility Act.",
      "United Kingdom — UK GDPR, Data Protection Act 2018, Online Safety Act 2023.",
      "United States — CCPA / CPRA (California), VCDPA (Virginia), CPA (Colorado), COPPA, FTC Act §5, DMCA, ADA Title III, Section 508.",
      "Canada — PIPEDA, Quebec Law 25.",
      "Brazil — LGPD.  Australia — Privacy Act 1988.  Japan — APPI.  South Korea — PIPA.",
      "Middle East — Egypt PDP Law 151/2020, Saudi PDPL, UAE PDPL.",
      "International — OECD AI Principles, Council of Europe AI Convention, ISO/IEC 27001-aligned controls.",
    ],
  },
  {
    heading: "Sanctions, Export Controls & AML",
    paragraphs: [
      "Megsy enforces international sanctions and export-control regimes. The Service is not offered to, and may not be used by, persons or entities ordinarily resident in, or owned/controlled by, sanctioned jurisdictions.",
    ],
    list: [
      "Restricted jurisdictions: Cuba, Iran, North Korea, Syria, and the Crimea, Donetsk, Luhansk, Kherson, and Zaporizhzhia regions of Ukraine.",
      "Screening against OFAC SDN, EU consolidated, UK OFSI, and UN sanctions lists at account creation and on payment events.",
      "Anti-Money Laundering (AML) and Counter-Terrorist-Financing (CTF) controls per FATF recommendations.",
      "Anti-bribery and anti-corruption policy aligned with the US FCPA and the UK Bribery Act 2010.",
      "Modern slavery statement: we maintain a zero-tolerance position on forced labour and human trafficking across our supply chain.",
    ],
  },
  {
    heading: "Payments, Chargebacks & Card-Brand Compliance",
    paragraphs: [
      "All payments on Megsy AI are processed by Dodo Payments — our PCI-DSS Level 1 certified merchant of record. Megsy never sees, stores, or transmits full card numbers. Card descriptors on bank statements clearly identify Megsy (\"DODO * MEGSY AI\"), and every customer receives an itemised emailed receipt.",
    ],
    list: [
      "Powered by Dodo Payments (https://dodopayments.com) — merchant of record, billing, and tax handling.",
      "Visa, Mastercard, American Express, JCB, UnionPay, Apple Pay, Google Pay, Amazon Pay, and WeChat Pay accepted.",
      "3-D Secure 2 (PSD2 Strong Customer Authentication) on all eligible European transactions.",
      "Chargeback disputes are responded to with full evidence within 7 days; we use representment where the charge is legitimate.",
      "Customers are encouraged to contact support@megsyai.com before filing a chargeback — most disputes are resolved as refunds in under 48 hours.",
      "Repeated friendly-fraud chargebacks result in account closure and possible referral to industry chargeback databases (e.g. Ethoca, Verifi).",
    ],
  },
  {
    heading: "Security Program",
    list: [
      "Encryption: TLS 1.3 in transit, AES-256 at rest.",
      "Authentication: OAuth 2.0, MFA available on every account, optional SSO/SAML for enterprise.",
      "Access control: principle of least privilege; production access audited and reviewed quarterly.",
      "Vulnerability management: continuous dependency scanning, annual penetration test, public vulnerability disclosure at /.well-known/security.txt.",
      "Incident response: breach notification within 72 hours per GDPR Article 33 and analogous laws.",
      "Business continuity: daily encrypted backups, multi-region recovery, documented RPO/RTO targets.",
    ],
  },
  {
    heading: "Sub-processors",
    paragraphs: [
      "We engage a limited set of vetted sub-processors to deliver the Service. Each is bound by GDPR Article 28 compliant data-processing terms. The current list is maintained below; we provide 30 days' notice of additions to enterprise customers via in-product banner and email.",
    ],
    list: [
      "Hosting & database: Supabase (AWS regions, primarily eu-west).",
      "AI model providers: OpenAI, Anthropic, Google AI, Fal.ai, Replicate, Eleven Labs, Stability AI — used per the model selected by the user.",
      "CDN, DDoS & edge: Cloudflare.",
      "Payments: PCI-DSS L1 certified processors (Paddle / Stripe / regional acquirers as enabled).",
      "Transactional email: Resend / Postmark.",
      "Analytics & error monitoring: privacy-respecting first-party analytics, Sentry (no PII).",
      "Customer support: Zendesk / Intercom (account email only).",
    ],
  },
  {
    heading: "Data Residency & International Transfers",
    paragraphs: [
      "By default, EU user data is processed in EU regions. Cross-border transfers rely on the EU Standard Contractual Clauses (SCCs), UK International Data Transfer Addendum, and where applicable, the EU-US Data Privacy Framework. Enterprise customers may request specific data-residency commitments via DPA.",
    ],
  },
  {
    heading: "Accessibility (WCAG 2.2 AA, ADA, EAA)",
    paragraphs: [
      "We are committed to making Megsy usable by everyone, regardless of ability. Our target conformance is WCAG 2.2 Level AA, the Web Content Accessibility Guidelines referenced by the Americans with Disabilities Act (ADA Title III) and the European Accessibility Act (EAA, effective June 2025).",
    ],
    list: [
      "Full keyboard navigation across all primary flows.",
      "Visible focus indicators, semantic HTML, ARIA landmarks where appropriate.",
      "Respect for prefers-reduced-motion; no purely-motion-based controls.",
      "Sufficient colour contrast on text and interactive elements.",
      "Compatible with major screen readers (NVDA, JAWS, VoiceOver, TalkBack).",
      "Report accessibility issues to accessibility@megsyai.com — we respond within 5 business days.",
    ],
  },
  {
    heading: "Law-Enforcement & Government Requests",
    paragraphs: [
      "Megsy responds to valid legal process. We require legally sufficient requests — for non-content data, a subpoena or equivalent court order from a competent authority; for content data, a search warrant or its equivalent under the Mutual Legal Assistance Treaty (MLAT) process where the requester is outside Egypt.",
      "Emergency disclosure: where there is a good-faith belief of imminent risk of death or serious physical injury, we may disclose limited information without legal process, per the emergency-disclosure standards of GDPR Article 6(1)(d).",
    ],
    list: [
      "Submit valid process to legal@megsyai.com (PGP key available on request).",
      "We notify affected users of requests unless legally prohibited.",
      "Aggregate numbers of government requests are published in our annual Transparency Report.",
    ],
  },
  {
    heading: "Annual Transparency Report",
    paragraphs: [
      "Each year we publish a Transparency Report disclosing: total content removals by category, DMCA notices received and acted on, EU DSA Statement of Reasons issued, government and law-enforcement requests received and complied with by jurisdiction, average response times, and appeals outcomes. The most recent report is available on request to transparency@megsyai.com and will be permanently linked from this Trust Center.",
    ],
  },
  {
    heading: "Children's Privacy (COPPA)",
    paragraphs: [
      "Megsy is not directed to children. We do not knowingly collect personal information from anyone under 18 and we have no service offering, marketing, or visual design targeting children under 13 (the COPPA threshold). If you believe a child has provided us personal information, contact privacy@megsyai.com for immediate deletion.",
    ],
  },
  {
    heading: "California & US-State Privacy Rights",
    paragraphs: [
      "California residents have the right under the CCPA / CPRA to know, access, correct, delete, and port their personal information, and to opt out of \"sale\" or \"sharing\" of personal information. Megsy does not sell personal information and does not share it for cross-context behavioural advertising. Residents of Virginia, Colorado, Connecticut, Utah, Texas, Oregon, Montana, and other US states with comprehensive privacy laws have equivalent rights, which we honour at the same intake: privacy@megsyai.com.",
    ],
  },
  {
    heading: "Brazil LGPD",
    paragraphs: [
      "Data subjects in Brazil have the rights set out in Lei Geral de Proteção de Dados (LGPD) Articles 17–22: confirmation, access, correction, anonymisation, portability, deletion, information about sharing, and revocation of consent. Requests may be made to privacy@megsyai.com and are honoured within 15 days where feasible.",
    ],
  },
  {
    heading: "Contact the Trust Team",
    paragraphs: [
      "General trust & compliance — trust@megsyai.com. Privacy & data subject rights — privacy@megsyai.com. Security disclosures — security@megsyai.com (or /.well-known/security.txt). Legal process — legal@megsyai.com. Accessibility — accessibility@megsyai.com. Appeals — appeals@megsyai.com.",
    ],
  },
];

const TrustCenterPage = () => (
  <LegalPageLayout
    eyebrow="Trust Center"
    title="Trust & Compliance"
    subtitle="Compliance posture, security program, sub-processors, accessibility, and law-enforcement procedures for Megsy AI worldwide."
    lastUpdated="19 May 2026"
    sections={sections}
    seoTitle="Trust & Compliance Center — Megsy AI"
    seoDescription="Megsy AI Trust Center. GDPR, CCPA, LGPD, EU AI Act, PCI-DSS, sub-processors, accessibility, sanctions, and transparency reporting."
    canonicalPath="/trust"
    heroVariant="team"
  />
);

export default TrustCenterPage;
