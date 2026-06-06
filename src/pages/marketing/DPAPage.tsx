import LegalPageLayout, { LegalSection } from "@/components/landing/LegalPageLayout";

const sections: LegalSection[] = [
  {
    heading: "Scope",
    paragraphs: [
      "This Data Processing Addendum (\"DPA\") forms part of the Megsy AI Terms of Service between Megsy for Digital Platforms & E-Commerce Development LLC (\"Processor\", \"Megsy\") and the customer (\"Controller\", \"you\") and applies whenever Megsy processes Personal Data on the Controller's behalf in the course of providing the Megsy AI services (\"Services\").",
      "This DPA is designed to comply with the EU General Data Protection Regulation 2016/679 (GDPR), the UK GDPR and Data Protection Act 2018, the Swiss FADP, the California Consumer Privacy Act as amended by CPRA, the Brazil LGPD, and equivalent data-protection laws worldwide.",
    ],
  },
  {
    heading: "Roles & Responsibilities",
    paragraphs: [
      "The Controller determines the purposes and means of processing Personal Data submitted to the Services. The Processor processes Personal Data only on documented instructions from the Controller, including those set out in the Terms of Service and this DPA. The Processor will inform the Controller if, in its opinion, an instruction infringes applicable data-protection law.",
    ],
  },
  {
    heading: "Categories of Data & Data Subjects",
    list: [
      "Identification data: name, email, account ID, IP address, device identifiers.",
      "Content data: prompts, files, images, video, audio, code, and other inputs submitted to the Services.",
      "Usage data: logs, telemetry, model usage, billing events.",
      "Data subjects: the Controller's authorized users, customers, and any individuals referenced in submitted content.",
    ],
  },
  {
    heading: "Security Measures",
    paragraphs: [
      "Megsy implements appropriate technical and organizational measures to protect Personal Data — including encryption in transit (TLS 1.3) and at rest (AES-256), strict access controls, role-based permissions, audit logging, vulnerability scanning, secret management, secure software development practices, and regular backups. A full list is available on request.",
    ],
  },
  {
    heading: "Sub-processors",
    paragraphs: [
      "The Controller authorizes Megsy to engage sub-processors to provide the Services, including cloud infrastructure, AI model providers, payment processors, email delivery, analytics, and customer-support tooling. An up-to-date list of sub-processors is available on request. Megsy will give at least 14 days' prior notice of any new sub-processor and will impose data-protection obligations on each sub-processor that are no less protective than those in this DPA.",
    ],
  },
  {
    heading: "International Transfers",
    paragraphs: [
      "Where Personal Data is transferred from the EEA, UK, or Switzerland to a country without an adequacy decision, the transfer is governed by the EU Standard Contractual Clauses (Module 2 or 3 as applicable) and, where required, the UK International Data Transfer Addendum, which are hereby incorporated by reference. Megsy will assist the Controller with any transfer impact assessment on reasonable request.",
    ],
  },
  {
    heading: "Data-Subject Rights",
    paragraphs: [
      "Taking into account the nature of the processing, Megsy will assist the Controller, by appropriate technical and organizational measures, in responding to requests from data subjects exercising their rights of access, rectification, erasure, restriction, portability, and objection. End-users may also exercise their rights directly via privacy@megsyai.com.",
    ],
  },
  {
    heading: "Personal-Data Breach Notification",
    paragraphs: [
      "Megsy will notify the Controller without undue delay — and in any event within 72 hours of becoming aware — of any Personal-Data Breach affecting the Controller's data, with the information required by Article 33(3) GDPR to the extent then available.",
    ],
  },
  {
    heading: "Audit Rights",
    paragraphs: [
      "Megsy will make available to the Controller all information reasonably necessary to demonstrate compliance with this DPA, and will allow for and contribute to audits conducted by the Controller or an independent auditor mandated by the Controller, subject to reasonable confidentiality, security, scope, and frequency limitations.",
    ],
  },
  {
    heading: "Return & Deletion",
    paragraphs: [
      "On termination of the Services, Megsy will, at the Controller's choice, return or delete all Personal Data within 90 days, save where retention is required by applicable law. Backups are deleted on their normal rotation cycle.",
    ],
  },
  {
    heading: "AI Training Opt-Out",
    paragraphs: [
      "Megsy does not use Controller content to train its or any third-party general-purpose foundation models. Any opt-in to model improvement, if offered, will be a separate explicit choice surfaced in the account settings.",
    ],
  },
  {
    heading: "Liability",
    paragraphs: [
      "The liability of each party under or in connection with this DPA is subject to the limitations and exclusions of liability set out in the Terms of Service.",
    ],
  },
];

const DPAPage = () => (
  <LegalPageLayout
    eyebrow="Legal"
    title="Data Processing Addendum"
    subtitle="GDPR, UK GDPR, Swiss FADP, CCPA/CPRA, and LGPD-compliant data processing terms for Megsy AI customers — including international transfer safeguards."
    lastUpdated="May 19, 2026"
    sections={sections}
    seoTitle="Data Processing Addendum (DPA) — Megsy AI"
    seoDescription="Megsy AI's GDPR-compliant Data Processing Addendum covering security, sub-processors, international transfers, breach notification, and AI training opt-out."
    canonicalPath="/legal/dpa"
    heroVariant="team"
  />
);

export default DPAPage;
