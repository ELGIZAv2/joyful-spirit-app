import LegalPageLayout, { LegalSection } from "@/components/landing/LegalPageLayout";

const sections: LegalSection[] = [
  {
    heading: "About the Program",
    paragraphs: [
      "The Megsy Affiliate Rewards Program (the \"Program\") is a performance-based marketing arrangement that lets approved participants (\"Affiliates\") receive promotional rewards for referring new paying customers to Megsy AI through a unique tracking link.",
      "Participation is voluntary. The Program is not an employment, investment, franchise, multi-level marketing, securities, or money-transmission arrangement. Affiliates act as independent marketing partners and are not agents, employees, or representatives of Megsy.",
    ],
  },
  {
    heading: "No Income Guarantee",
    paragraphs: [
      "Megsy makes no representation, promise, or guarantee that any Affiliate will receive any specific amount of rewards, any rewards at all, or recover any costs associated with their promotional activity. Any figures shown on the website (such as commission percentages or example payouts) are illustrative only and depend entirely on whether referred users complete a qualifying paid subscription.",
      "Rewards depend on the Affiliate's own marketing efforts, audience, market conditions, and Megsy's pricing — all of which may change without notice.",
    ],
  },
  {
    heading: "Eligibility",
    list: [
      "You must be at least 18 years old and legally able to enter binding contracts.",
      "You must hold a valid Megsy account in good standing.",
      "You must not be located in, or a resident of, a country subject to comprehensive sanctions by the United Nations, the European Union, the United Kingdom, or the United States.",
      "Government employees, public officials, and minors are not eligible.",
    ],
  },
  {
    heading: "Reward Structure",
    paragraphs: [
      "Approved Affiliates may receive a percentage-based reward on the net subscription revenue collected by Megsy from each qualifying referred user, as published in the Affiliate dashboard. Rewards are calculated on net revenue only — excluding taxes, refunds, chargebacks, fraudulent payments, processor fees, and discounts.",
      "Self-referrals, referrals through paid advertising on Megsy's own brand keywords, incentivized signups, or referrals generated through misleading, deceptive, or coercive means are not eligible and may result in account termination and forfeiture of pending rewards.",
    ],
  },
  {
    heading: "Disclosure Obligations (FTC, ASA, EU)",
    paragraphs: [
      "Affiliates must clearly and conspicuously disclose their material connection with Megsy in every promotion — including on social media, blogs, videos, livestreams, newsletters, and messaging apps — in compliance with the US FTC Endorsement Guides, the UK CAP/ASA Code, the EU Unfair Commercial Practices Directive, and equivalent local laws.",
      "Acceptable disclosure language includes: \"#ad\", \"#sponsored\", \"affiliate link\", or \"I receive a commission if you sign up\". The disclosure must appear before the link and be visible without requiring the audience to click \"more\".",
    ],
  },
  {
    heading: "Prohibited Promotional Conduct",
    list: [
      "No spam: bulk unsolicited email, SMS, comment spam, or unsolicited DMs.",
      "No false, misleading, or unverified claims about Megsy, its features, pricing, or results.",
      "No bidding on Megsy trademarks or look-alike domains in paid search.",
      "No promotion on adult, hate, violent, illegal, deepfake-impersonation, or copyright-infringing platforms.",
      "No cookie stuffing, click fraud, bot traffic, incentivized clicks, or fake accounts.",
      "No representation that Megsy endorses your personal opinions, products, or services.",
    ],
  },
  {
    heading: "Payout Terms",
    paragraphs: [
      "Rewards become payable only after the referred user has remained an active paying subscriber for the full refund window applicable to their plan and after Megsy has received cleared funds. Minimum payout thresholds and payment methods are shown in the Affiliate dashboard and may be updated from time to time.",
      "Affiliates are solely responsible for declaring rewards as income to their local tax authority and for paying any income tax, VAT, GST, withholding tax, or social contributions due in their jurisdiction. Megsy may request a valid tax form (W-9, W-8BEN, or equivalent) before issuing payment and may withhold amounts required by law.",
    ],
  },
  {
    heading: "Suspension, Termination & Clawback",
    paragraphs: [
      "Megsy may suspend, withhold, reverse, or cancel any reward at its sole discretion if it suspects fraud, abuse, chargeback activity, violation of these terms, violation of applicable law, or reputational harm. Megsy may terminate any Affiliate's participation at any time, with or without cause, with reasonable notice.",
      "Pending or paid rewards linked to refunded, chargebacked, fraudulent, or terms-violating referrals may be clawed back from future payouts or invoiced to the Affiliate.",
    ],
  },
  {
    heading: "Intellectual Property",
    paragraphs: [
      "Megsy grants Affiliates a limited, revocable, non-exclusive, non-transferable license to use approved Megsy logos, screenshots, and marketing assets solely to promote Megsy in accordance with these terms. All goodwill arising from such use accrues to Megsy. The license terminates automatically when an Affiliate leaves the Program.",
    ],
  },
  {
    heading: "Disclaimer & Limitation of Liability",
    paragraphs: [
      "The Program is provided \"as is\" without warranties of any kind. To the maximum extent permitted by law, Megsy's total aggregate liability to any Affiliate under or in connection with the Program shall not exceed the rewards actually paid to that Affiliate during the twelve (12) months preceding the event giving rise to the claim.",
      "In no event shall Megsy be liable for any indirect, incidental, special, consequential, punitive, or lost-profits damages.",
    ],
  },
  {
    heading: "Governing Law & Disputes",
    paragraphs: [
      "These Affiliate Terms are governed by the laws of the Arab Republic of Egypt without regard to conflict-of-law principles. Any dispute shall be submitted to the exclusive jurisdiction of the competent courts of Cairo, Egypt — except where mandatory consumer protection laws of the Affiliate's country of residence apply.",
    ],
  },
  {
    heading: "Changes to the Program",
    paragraphs: [
      "Megsy may modify, suspend, or discontinue the Program — including reward rates, eligibility rules, and tracking technology — at any time. Material changes will be communicated at least 14 days in advance via email or the Affiliate dashboard. Continued participation after the effective date constitutes acceptance.",
    ],
  },
];

const AffiliateTermsPage = () => (
  <LegalPageLayout
    eyebrow="Legal"
    title="Affiliate Terms"
    subtitle="The rules of our performance-based Affiliate Rewards Program — designed to be fair, transparent, and compliant with global advertising and consumer-protection law."
    lastUpdated="May 19, 2026"
    sections={sections}
    seoTitle="Affiliate Program Terms — Megsy AI"
    seoDescription="Official terms of the Megsy AI Affiliate Rewards Program. Eligibility, payouts, disclosure rules, and compliance with FTC, ASA, and EU advertising laws."
    canonicalPath="/legal/affiliate"
  />
);

export default AffiliateTermsPage;
