import LegalPageLayout, { type LegalSection } from "@/components/landing/LegalPageLayout";

const sections: LegalSection[] = [
  {
    heading: "Agreement to Terms",
    paragraphs: [
      "These Terms of Service form a legally binding agreement between you and Megsy for Digital Platforms & E-Commerce Development LLC, a limited liability company registered in the Arab Republic of Egypt (Commercial Registry No. 248691, Tax ID 774034785) (\"Megsy\", \"we\", \"us\").",
      "By creating an account, accessing, or using any part of Megsy AI (the \"Service\") you agree to be bound by these Terms together with our Privacy Policy, Acceptable Use Policy, Refund Policy and Cookie Policy, which are incorporated by reference.",
      "If you do not agree to any part of these Terms, you must not access or use the Service.",
    ],
  },
  {
    heading: "Eligibility & Accounts",
    paragraphs: [
      "You must be at least 18 years old (or the age of majority in your jurisdiction) to create an account. You are responsible for the accuracy of the information you provide and for maintaining the security of your credentials.",
      "Each account is for a single person or legal entity. You are responsible for all activity that occurs under your account, including any use by your employees or authorised collaborators in workspaces you administer.",
    ],
    list: [
      "Notify us immediately at support@megsyai.com of any unauthorised access.",
      "Do not share, transfer or sell your account credentials.",
      "We may suspend or terminate accounts that violate these Terms.",
    ],
  },
  {
    heading: "The Service",
    paragraphs: [
      "Megsy AI is a multi-modal creative platform that gives you access to text, image, video, audio and code generation models, document and presentation builders, deep-research workflows, and project hosting tools.",
      "We continuously add, modify, and remove features. We may also update model providers, pricing, quotas, and credit costs at any time. Material changes will be announced through in-app notices or email where reasonable.",
    ],
  },
  {
    heading: "Credits, Plans & Billing",
    paragraphs: [
      "The Service operates on a credit system (\"MC\"). Credits are consumed when you generate or process content. Credit costs per action are shown in the interface before you confirm the action.",
      "Subscription plans renew automatically at the end of each billing cycle unless cancelled before the renewal date. You may cancel a subscription at any time from the Billing page; cancellation takes effect at the end of the current cycle.",
      "Credit packs are one-time purchases and do not auto-renew. Credit balances do not expire while your account remains in good standing.",
      "All prices are exclusive of applicable taxes, which may be added at checkout based on your billing location.",
    ],
  },
  {
    heading: "Your Content",
    paragraphs: [
      "You retain all rights to the inputs you submit and the outputs you generate using the Service (\"Your Content\"), subject to the terms of the underlying third-party model providers where applicable.",
      "You grant Megsy a worldwide, non-exclusive, royalty-free licence to host, process, transmit, and display Your Content solely to operate, secure, and improve the Service for you.",
      "You are solely responsible for Your Content and for ensuring that you have all rights necessary to upload, generate, publish, and distribute it.",
    ],
  },
  {
    heading: "AI-Generated Output",
    paragraphs: [
      "Outputs from generative models are statistical predictions and may be inaccurate, incomplete, or offensive. You must independently verify any output before relying on it for medical, legal, financial, or other consequential decisions.",
      "Different users may receive similar or identical outputs for similar prompts. We do not warrant that any specific output is unique.",
      "You are responsible for reviewing every generated asset and removing it from publication if it infringes any third-party right or violates our Acceptable Use Policy.",
    ],
  },
  {
    heading: "Acceptable Use",
    paragraphs: [
      "Your use of the Service is governed by our Acceptable Use Policy. In summary, you must not use Megsy to generate or distribute content that depicts real individuals without their consent, sexual content involving minors, content that promotes violence or unlawful acts, or any output that infringes intellectual property or privacy rights.",
      "We reserve the right to refuse, restrict, or remove access to any feature, account, or workspace that violates the Acceptable Use Policy.",
    ],
  },
  {
    heading: "Intellectual Property",
    paragraphs: [
      "The Service, including its software, interface, branding, documentation, and underlying models that we own or licence, is the property of Megsy and its licensors and is protected by international intellectual-property law.",
      "We grant you a limited, non-exclusive, non-transferable, revocable licence to access and use the Service in accordance with these Terms.",
    ],
  },
  {
    heading: "Third-Party Services",
    paragraphs: [
      "The Service integrates third-party model providers, payment processors, hosting platforms, and analytics services. Your use of those components is subject to their own terms and privacy policies, which you should review.",
      "We are not responsible for the availability, accuracy, or content of third-party services.",
    ],
  },
  {
    heading: "Disclaimers",
    paragraphs: [
      "The Service is provided on an \"as is\" and \"as available\" basis without warranties of any kind, whether express, implied, statutory, or otherwise.",
      "To the maximum extent permitted by law, Megsy disclaims all warranties of merchantability, fitness for a particular purpose, non-infringement, and uninterrupted operation.",
    ],
  },
  {
    heading: "Limitation of Liability",
    paragraphs: [
      "To the maximum extent permitted by applicable law, Megsy's aggregate liability arising out of or relating to the Service shall not exceed the amount you paid to Megsy in the twelve (12) months preceding the event giving rise to the claim, or one hundred US dollars (USD 100), whichever is greater.",
      "In no event shall Megsy be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, including loss of profits, revenue, data, or goodwill.",
    ],
  },
  {
    heading: "Indemnification",
    paragraphs: [
      "You agree to defend, indemnify, and hold harmless Megsy, its officers, directors, employees, and agents from and against any claims, damages, obligations, losses, liabilities, costs, or expenses (including reasonable attorneys' fees) arising from (i) Your Content, (ii) your use of the Service, (iii) your violation of these Terms, or (iv) your violation of any third-party right.",
    ],
  },
  {
    heading: "Termination",
    paragraphs: [
      "You may terminate your account at any time from the Settings page. We may suspend or terminate your access immediately, without notice, if we believe you have violated these Terms or applicable law, or if your continued use poses a risk to Megsy, other users, or third parties.",
      "Upon termination, your right to use the Service ceases. Provisions that by their nature should survive termination will survive, including ownership, disclaimers, indemnities, and limitations of liability.",
    ],
  },
  {
    heading: "Governing Law & Disputes",
    paragraphs: [
      "These Terms are governed by the laws of the Arab Republic of Egypt, without regard to its conflict-of-laws principles. The competent courts of Cairo, Egypt shall have exclusive jurisdiction over any dispute arising from or relating to these Terms, except where mandatory consumer-protection law in your country of residence provides otherwise.",
    ],
  },
  {
    heading: "Changes to These Terms",
    paragraphs: [
      "We may update these Terms from time to time. When we do, we will revise the \"Last updated\" date and, where the changes are material, notify you in-app or by email. Your continued use of the Service after the effective date constitutes your acceptance of the updated Terms.",
    ],
  },
  {
    heading: "Contact",
    paragraphs: [
      "Questions about these Terms should be sent to support@megsyai.com.",
    ],
  },
];

const TermsPage = () => (
  <LegalPageLayout
    eyebrow="Legal"
    title="Terms of Service"
    subtitle="The contract that governs your use of Megsy AI — written in plain language wherever we can, and in precise legal language where we must."
    lastUpdated="19 May 2026"
    sections={sections}
    seoTitle="Terms of Service"
    seoDescription="Read the Megsy AI Terms of Service governing your account, credits, content rights, and use of the platform."
    canonicalPath="/terms"
  />
);

export default TermsPage;
