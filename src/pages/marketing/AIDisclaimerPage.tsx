import LegalPageLayout, { LegalSection } from "@/components/landing/LegalPageLayout";

const sections: LegalSection[] = [
  {
    heading: "Nature of AI Output",
    paragraphs: [
      "Megsy AI uses third-party and proprietary machine-learning models (\"Models\") to generate text, images, audio, video, code, and other content (collectively, \"Output\"). Output is produced by statistical pattern-matching, not by human reasoning, and may be inaccurate, incomplete, biased, outdated, offensive, or entirely fabricated (commonly called \"hallucination\").",
      "You must independently verify any Output before relying on it for any decision, publication, transaction, or communication. Megsy does not warrant that Output is accurate, reliable, fit for purpose, lawful in your jurisdiction, or free from third-party rights.",
    ],
  },
  {
    heading: "No Professional Advice",
    paragraphs: [
      "Output is for general informational and creative purposes only. It does not constitute and must not be relied upon as legal, medical, psychological, financial, tax, investment, accounting, engineering, safety-critical, or any other form of professional advice. Always consult a qualified licensed professional in your jurisdiction.",
    ],
  },
  {
    heading: "High-Risk Uses Prohibited",
    paragraphs: [
      "You must not use Megsy, its Models, or Output in connection with any high-risk activity where failure or error could cause death, personal injury, severe environmental damage, or significant property damage — including (without limitation) operation of aircraft, nuclear facilities, life-support, weapons systems, mass-surveillance, automated medical diagnosis, autonomous vehicles, financial-trading automation, or critical infrastructure control.",
    ],
  },
  {
    heading: "Likeness, Identity & Deepfakes",
    paragraphs: [
      "Tools that modify or generate human faces, voices, bodies, or identifiable likenesses (such as AI Portrait Studio, Voice Sync Studio, Animated Portrait, and similar) may only be used on (a) yourself, (b) a person who has given clear, informed, written consent, or (c) public-domain or properly licensed content.",
      "You must not impersonate any real person, create non-consensual intimate content, generate election-related disinformation, or produce any content depicting minors in a sexual or violent context. Such use is strictly prohibited and will result in immediate account termination and may be reported to law enforcement.",
    ],
  },
  {
    heading: "Ownership of Output",
    paragraphs: [
      "Subject to applicable law and the Terms of Service, you own the Output you generate, except for portions reproduced from training data, third-party assets, or other users' inputs. Because identical or similar Output may be generated for other users, Output is not exclusive. You are solely responsible for ensuring your use of Output does not infringe any third party's rights.",
    ],
  },
  {
    heading: "Provenance & Watermarking",
    paragraphs: [
      "Some AI-generated content may carry visible or invisible provenance markers (such as C2PA metadata or SynthID-style watermarks). You agree not to remove, alter, or obscure such markers, and to comply with applicable AI-disclosure laws — including the EU AI Act, the California AI Transparency Act, and similar regulations — when distributing AI-generated content.",
    ],
  },
  {
    heading: "Third-Party Models",
    paragraphs: [
      "Megsy routes requests to a range of underlying model providers. Your use of those Models is also governed by the providers' own usage policies. Megsy is not responsible for changes, downtime, deprecation, or content restrictions imposed by upstream providers.",
    ],
  },
  {
    heading: "Disclaimer of Warranties",
    paragraphs: [
      "OUTPUT AND THE SERVICE ARE PROVIDED \"AS IS\" AND \"AS AVAILABLE\" WITHOUT WARRANTY OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY — INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, ACCURACY, AND QUIET ENJOYMENT — TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW.",
    ],
  },
];

const AIDisclaimerPage = () => (
  <LegalPageLayout
    eyebrow="Legal"
    title="AI Disclaimer"
    subtitle="What AI-generated content is — and isn't. Your responsibilities when using Megsy's models, and the limits of what we promise."
    lastUpdated="May 19, 2026"
    sections={sections}
    seoTitle="AI Content Disclaimer — Megsy AI"
    seoDescription="Important disclaimers about AI-generated content on Megsy AI: accuracy, prohibited uses, ownership, provenance, and high-risk restrictions."
    canonicalPath="/legal/ai-disclaimer"
    heroVariant="nature"
  />
);

export default AIDisclaimerPage;
