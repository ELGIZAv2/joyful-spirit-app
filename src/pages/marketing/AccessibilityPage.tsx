import LegalPageLayout, { LegalSection } from "@/components/landing/LegalPageLayout";

const sections: LegalSection[] = [
  {
    heading: "Our Commitment",
    paragraphs: [
      "Megsy is committed to building a platform that is usable by the widest possible audience, including people with disabilities. We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA published by the W3C, the requirements of the European Accessibility Act (EAA, Directive 2019/882), the US Americans with Disabilities Act (ADA) and Section 508, and the UK Public Sector Bodies Accessibility Regulations 2018.",
    ],
  },
  {
    heading: "What We Do",
    list: [
      "Semantic HTML and ARIA labels on interactive elements.",
      "Keyboard navigability and visible focus indicators across all primary flows.",
      "Color contrast meeting WCAG AA on text and UI components.",
      "Support for the user's system 'prefers-reduced-motion' setting — heavy scroll and parallax effects automatically disable.",
      "Responsive layouts that work down to 320px viewports and scale up to 200% zoom.",
      "Alt text on meaningful images and captions on instructional videos.",
    ],
  },
  {
    heading: "Known Limitations",
    paragraphs: [
      "Some AI-generated outputs (such as raw images or generated video) may lack alternative text by default. We are working on automatic alt-text generation. Some third-party embedded content and legacy areas may not yet fully conform — we are actively remediating.",
    ],
  },
  {
    heading: "Feedback",
    paragraphs: [
      "If you encounter any accessibility barrier on Megsy AI, please email accessibility@megsyai.com with the page URL, the device and assistive technology you are using, and a description of the issue. We aim to acknowledge within 5 business days and resolve material barriers within 30 days.",
    ],
  },
];

const AccessibilityPage = () => (
  <LegalPageLayout
    eyebrow="Inclusion"
    title="Accessibility"
    subtitle="Our commitment to WCAG 2.2 AA, the European Accessibility Act, the ADA, and an inclusive experience for every user."
    lastUpdated="May 19, 2026"
    sections={sections}
    seoTitle="Accessibility Statement — Megsy AI"
    seoDescription="Megsy AI's accessibility commitments under WCAG 2.2, the European Accessibility Act, the ADA, and how to report barriers."
    canonicalPath="/legal/accessibility"
    heroVariant="portrait"
  />
);

export default AccessibilityPage;
