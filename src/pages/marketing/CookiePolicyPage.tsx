import LegalPageLayout, { type LegalSection } from "@/components/landing/LegalPageLayout";

const sections: LegalSection[] = [
  {
    heading: "Data Controller",
    paragraphs: [
      "The data controller is Megsy for Digital Platforms & E-Commerce Development LLC, registered in the Arab Republic of Egypt (CR 248691 · Tax 774034785).",
      "For any cookie or data-protection question, write to privacy@megsyai.com.",
    ],
  },
  {
    heading: "Essential Cookies",
    paragraphs: [
      "These cookies are required for Megsy to function and cannot be disabled. They handle authentication, session management, security (CSRF protection), load balancing, and storing your cookie consent preferences.",
      "Under GDPR Art. 5(3) of the ePrivacy Directive, Egyptian Law No. 151 of 2020, and the CCPA, strictly necessary cookies are exempt from consent requirements.",
    ],
    list: [
      "Session ID (sb-auth-token)",
      "Authentication state",
      "CSRF protection token",
      "Cookie consent preferences",
      "Security headers",
      "Retention: session, or up to 30 days for persistent login",
    ],
  },
  {
    heading: "Analytics & Performance Cookies",
    paragraphs: [
      "Anonymized, aggregated data about how visitors interact with Megsy — most-visited pages, feature usage, error reports, performance metrics. No personally identifiable information is collected.",
      "Legal basis: consent (GDPR Art. 6(1)(a)). You can opt in or out at any time through the cookie banner or browser settings. Retention: up to 12 months.",
    ],
  },
  {
    heading: "Preference / Functional Cookies",
    paragraphs: [
      "These cookies remember settings so you do not have to reconfigure them each visit — theme, language, layout, notifications. They do not track you across other sites.",
      "Legal basis: consent (GDPR Art. 6(1)(a)). Retention: up to 12 months.",
    ],
  },
  {
    heading: "Legal Compliance",
    paragraphs: [
      "Our cookie practices align with the EU General Data Protection Regulation, the ePrivacy Directive, Egyptian Personal Data Protection Law No. 151/2020, the California Consumer Privacy Act, and the UK Data Protection Act.",
    ],
  },
  {
    heading: "Your Cookie Rights",
    list: [
      "Accept or reject non-essential cookies through the consent banner",
      "Withdraw consent at any time by clearing cookies or contacting us",
      "Access information about cookie data we hold about you",
      "Request deletion of cookie-related data",
      "Opt out of analytics without affecting access to the Service",
      "Configure browser settings to block or delete cookies",
    ],
  },
  {
    heading: "Managing Your Cookies",
    paragraphs: [
      "You can manage cookies through the in-app consent banner, your browser's privacy settings (Chrome, Firefox, Safari, Edge), or by clearing your browser storage for megsyai.com.",
      "Disabling essential cookies will prevent authentication and core platform functionality.",
    ],
  },
  {
    heading: "Third-Party Cookies",
    paragraphs: [
      "Megsy does not use third-party advertising or behavioural tracking cookies. We do not participate in ad networks or sell cookie data. Our infrastructure providers may set strictly necessary cookies for security and performance — these are covered under the essential cookies category.",
    ],
  },
  {
    heading: "Changes to This Policy",
    paragraphs: [
      "We may update this Cookie Policy from time to time to reflect changes in our practices, technology, or legal requirements. Material changes will be communicated through the cookie banner or via email to registered users.",
    ],
  },
];

const CookiePolicyPage = () => (
  <LegalPageLayout
    eyebrow="Privacy"
    title="Cookie Policy"
    subtitle="A plain-language guide to the cookies Megsy AI uses, why we use them, and how you can control them."
    lastUpdated="19 May 2026"
    sections={sections}
    seoTitle="Cookie Policy"
    seoDescription="How Megsy AI uses cookies, what categories exist, and how to manage your preferences under GDPR, CCPA and Egyptian law."
    canonicalPath="/cookies"
    heroVariant="nature"
  />
);

export default CookiePolicyPage;
