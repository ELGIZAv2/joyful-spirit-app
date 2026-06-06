import LegalPageLayout, { type LegalSection } from "@/components/landing/LegalPageLayout";

const sections: LegalSection[] = [
  {
    heading: "Overview",
    paragraphs: [
      "Megsy AI is a digital service that delivers AI-generated content instantly to your account. This Refund Policy explains when refunds are available, how to request one, and how refunds are processed.",
      "By purchasing a subscription, credit pack, or any other product on Megsy, you agree to the terms of this policy.",
    ],
  },
  {
    heading: "Subscriptions",
    paragraphs: [
      "Subscriptions renew automatically at the end of each billing cycle. You may cancel at any time from the Billing page; cancellation prevents future renewals and takes effect at the end of the paid period. You keep full access until that date.",
      "We offer a 7-day no-questions-asked refund window on a new paid subscription (Pro or higher), provided that you have not consumed more than 10% of the credits included in that subscription. Refunds outside this window are granted only in cases of duplicate charges, billing errors, or where required by law.",
    ],
  },
  {
    heading: "Credit Packs",
    paragraphs: [
      "Credit packs are one-time purchases that add MC (Megsy Credits) to your balance. Because credits can be consumed instantly, credit-pack purchases are non-refundable once any credit from that pack has been spent.",
      "If you have not used any credits from a pack, you may request a refund within 7 days of purchase by emailing support@megsyai.com from the email address registered on your account.",
    ],
  },
  {
    heading: "Generation Failures",
    paragraphs: [
      "When a generation fails due to a server-side error on our platform or its model providers, the credits charged for that specific request are automatically returned to your balance, usually within minutes.",
      "If you believe credits were consumed for a failed generation that was not auto-refunded, contact support@megsyai.com with the conversation or job ID and we will investigate and refund the credits where appropriate.",
    ],
  },
  {
    heading: "Not Eligible for Refund",
    paragraphs: [
      "The following situations are not eligible for a refund:",
    ],
    list: [
      "Credits already consumed on successful generations.",
      "Credit packs where at least one credit has been used.",
      "Subscription renewals after the cancellation window has passed.",
      "Dissatisfaction with the creative quality of an output that was successfully delivered.",
      "Accounts terminated for violation of the Acceptable Use Policy or Terms of Service.",
      "Free credits, bonus credits, referral credits, or promotional credits.",
    ],
  },
  {
    heading: "How to Request a Refund",
    paragraphs: [
      "Email support@megsyai.com from your account email with the subject \"Refund Request\" and include: your account email, the transaction date, the order or invoice reference, and a short explanation of the reason for the request.",
      "We review every request individually and respond within 5 business days. Approved refunds are processed within 7-14 business days back to the original payment method. Bank processing times may add a few extra days.",
    ],
  },
  {
    heading: "Chargebacks & Dispute Resolution",
    paragraphs: [
      "We are a payments-friendly platform and want every billing concern resolved fairly. Please contact support@megsyai.com BEFORE filing a chargeback with your bank — the vast majority of disputes are resolved as refunds within 48 hours.",
      "Initiating a chargeback before contacting support may result in immediate account suspension while the dispute is investigated. Chargebacks filed for digital products that were delivered and used (\"friendly fraud\") will be contested with full evidence — including login records, IP, generation logs, and policy acceptance — under Visa, Mastercard, American Express, and JCB representment rules.",
      "Accounts found to have abused chargebacks are permanently terminated and may be reported to industry chargeback databases such as Ethoca and Verifi.",
    ],
    list: [
      "Email: support@megsyai.com — subject \"Billing Dispute\".",
      "Response: within 48 hours, full resolution within 7 business days.",
      "Bank statement descriptor: \"MEGSY AI\" or the descriptor shown at checkout.",
      "Itemised receipt: emailed automatically after every purchase.",
    ],
  },
  {
    heading: "European Right of Withdrawal & Digital Content",
    paragraphs: [
      "Consumers in the EU/EEA have a 14-day right of withdrawal on distance contracts under Directive 2011/83/EU. For digital content delivered immediately (such as AI credits and subscriptions activated on purchase), this right is waived where you have given express prior consent and acknowledgement that consumption begins immediately and that the right of withdrawal is lost upon first use. We display this consent at checkout for EU customers.",
    ],
  },
  {
    heading: "Card-Brand & Payment-Processor Compliance",
    paragraphs: [
      "All payments on Megsy AI are processed by Dodo Payments, our PCI-DSS Level 1 merchant of record. Megsy operates in full compliance with Visa Core Rules, Mastercard Rules, American Express Merchant Operating Guide, JCB, UnionPay, and Discover acceptance rules. Pricing is clearly disclosed before checkout, recurring billing is opt-in with cancellation available at any time from the Billing page, and 3-D Secure 2 (Strong Customer Authentication) is enforced on all eligible European transactions.",
      "Bank statements show the descriptor \"DODO * MEGSY AI\" (or the localized equivalent). For any billing question, contact support@megsyai.com before opening a dispute with your bank.",
    ],
  },
  {
    heading: "Statutory Rights",
    paragraphs: [
      "Nothing in this policy limits any mandatory statutory consumer-protection right you have under the laws of your country of residence.",
    ],
  },
  {
    heading: "Contact",
    paragraphs: [
      "For refund requests or any billing question, write to support@megsyai.com.",
    ],
  },
];

const RefundPage = () => (
  <LegalPageLayout
    eyebrow="Legal"
    title="Refund Policy"
    subtitle="Clear, fair rules for refunds on subscriptions, credit packs, and failed generations."
    lastUpdated="19 May 2026"
    sections={sections}
    seoTitle="Refund Policy"
    seoDescription="Megsy AI refund rules for subscriptions, credit packs, and failed generations — how to request a refund and what's eligible."
    canonicalPath="/refund"
  />
);

export default RefundPage;
