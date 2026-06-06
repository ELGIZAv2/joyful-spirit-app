import LegalPageLayout, { LegalSection } from "@/components/landing/LegalPageLayout";

const sections: LegalSection[] = [
  {
    heading: "Our Approach",
    paragraphs: [
      "Megsy AI is a general-purpose creative platform used by individuals and businesses worldwide. We balance creative freedom with strict prohibitions on content that is illegal, deceptive, or harmful — particularly content that exploits real people, minors, or vulnerable communities.",
      "Our moderation system combines (a) provider-level filters from upstream AI model vendors, (b) Megsy's own automated detection (text classifiers, image/video safety models, perceptual hashing against known-bad content databases), and (c) human review of escalations and reports.",
    ],
  },
  {
    heading: "Strictly Prohibited Content (Zero Tolerance)",
    list: [
      "Child sexual abuse material (CSAM) or any sexualization of minors — reported to the National Center for Missing & Exploited Children (NCMEC) and local authorities.",
      "Non-consensual intimate imagery, including AI-generated nudity of real identifiable people.",
      "Content that promotes terrorism, violent extremism, or organized hate against protected groups.",
      "Realistic political deepfakes intended to deceive voters, defame public figures, or interfere with elections.",
      "Content designed to facilitate real-world violence, weapons manufacture, biological/chemical/nuclear/radiological harm, or critical-infrastructure attacks.",
      "Instructions or material that enables fraud, identity theft, phishing, malware, or unauthorized intrusion.",
    ],
  },
  {
    heading: "Restricted Content (Allowed With Safeguards)",
    paragraphs: [
      "Some content is permitted only with clear context, age-gating, or platform-level controls — including artistic nudity, mature fiction, security research, harm-reduction information, and historical or educational depictions of violence. Megsy may downgrade discoverability, add safety labels, or require additional verification for restricted content.",
    ],
  },
  {
    heading: "Identity & Likeness Tools",
    paragraphs: [
      "Tools that modify human faces, voices, or bodies require, by acceptance of our Terms, that the user has the right to use the source likeness — either because it is the user themselves, a person who gave informed written consent, or properly licensed material. Outputs from such tools may include invisible provenance markers (C2PA / watermarks) that must not be removed.",
    ],
  },
  {
    heading: "Reporting Abuse",
    paragraphs: [
      "Anyone — user or non-user — can report harmful content or accounts at abuse@megsyai.com. We aim to acknowledge reports within 24 hours and act within 72 hours for high-severity content. CSAM and credible threats of imminent violence are escalated immediately.",
      "Reports may be submitted anonymously. False or malicious reports submitted in bad faith may result in account action against the reporter.",
    ],
  },
  {
    heading: "Enforcement Actions",
    list: [
      "Soft action: content removal, safety label, reduced visibility, warning to user.",
      "Account action: temporary suspension, removal of specific feature access, mandatory re-acceptance of terms.",
      "Severe action: permanent account termination, forfeiture of pending affiliate rewards, IP/device ban, referral to law enforcement.",
    ],
  },
  {
    heading: "Appeals",
    paragraphs: [
      "Users whose content or account has been actioned may appeal within 30 days by emailing appeals@megsyai.com with the account email and reference number. Appeals are reviewed by a person not involved in the original decision. We aim to respond within 10 business days.",
    ],
  },
  {
    heading: "Transparency",
    paragraphs: [
      "Megsy publishes an annual Transparency Report summarizing volumes of moderation actions, government requests, and CSAM reports. The first report covers calendar year 2026 and will be available at megsyai.com/trust.",
    ],
  },
];

const ModerationPage = () => (
  <LegalPageLayout
    eyebrow="Trust & Safety"
    title="Content Moderation"
    subtitle="What we allow, what we never allow, and how we review reports — built for global compliance under the EU Digital Services Act and equivalent laws."
    lastUpdated="May 19, 2026"
    sections={sections}
    seoTitle="Content Moderation Policy — Megsy AI"
    seoDescription="Megsy AI's content moderation policy: prohibited content, restricted categories, identity tools, reporting, enforcement, and appeals."
    canonicalPath="/legal/moderation"
    heroVariant="portrait"
  />
);

export default ModerationPage;
