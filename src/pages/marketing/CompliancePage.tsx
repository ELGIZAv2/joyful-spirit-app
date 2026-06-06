import LegalPageLayout, { LegalSection } from "@/components/landing/LegalPageLayout";

const sections: LegalSection[] = [
  {
    heading: "Sanctions & Export Controls",
    paragraphs: [
      "Megsy AI complies with international sanctions and export-control programs administered by the United Nations Security Council, the European Union, the United Kingdom Office of Financial Sanctions Implementation (OFSI), the United States Office of Foreign Assets Control (OFAC), the US Bureau of Industry and Security (BIS), and the Arab Republic of Egypt.",
      "We do not knowingly provide the Services to any individual or entity ordinarily resident in a comprehensively sanctioned territory (currently including Cuba, Iran, North Korea, Syria, and the Crimea, Donetsk, Luhansk, Zaporizhzhia, and Kherson regions of Ukraine) or to any party on a restricted-persons list (SDN, EU Consolidated, UK HMT Consolidated, UN Sanctions List).",
      "You represent that you are not subject to any such sanction and will not use the Services in violation of any applicable export-control law, including the US Export Administration Regulations (EAR) and the EU Dual-Use Regulation 2021/821.",
    ],
  },
  {
    heading: "Anti-Money Laundering (AML)",
    paragraphs: [
      "Megsy follows the recommendations of the Financial Action Task Force (FATF) and applicable AML laws of the Arab Republic of Egypt. We monitor for suspicious payment patterns, may request additional identity verification before processing high-value transactions or affiliate payouts, and will file Suspicious Activity Reports with the competent authority when required by law.",
    ],
  },
  {
    heading: "Anti-Bribery & Corruption",
    paragraphs: [
      "Megsy maintains a zero-tolerance policy on bribery and corruption in all forms, in compliance with the UK Bribery Act 2010, the US Foreign Corrupt Practices Act (FCPA), and Egyptian anti-corruption law. Our directors, employees, contractors, and affiliates may not offer, give, request, or accept any improper financial or other advantage to influence a business decision.",
    ],
  },
  {
    heading: "Modern Slavery & Human Trafficking",
    paragraphs: [
      "In line with the UK Modern Slavery Act 2015, the California Transparency in Supply Chains Act, and the Australian Modern Slavery Act 2018, Megsy is committed to preventing modern slavery and human trafficking in its operations and supply chain. We require equivalent commitments from our material vendors and will publish an annual Modern Slavery Statement once turnover thresholds are met.",
    ],
  },
  {
    heading: "Tax Compliance",
    paragraphs: [
      "Megsy collects and remits VAT, GST, or sales tax where required by the laws of the country of consumption, either directly or through a merchant-of-record sub-processor. Egyptian tax registration number 774034785 and commercial registry number 248691 apply to invoices issued from our headquarters.",
    ],
  },
  {
    heading: "Law-Enforcement Requests",
    paragraphs: [
      "Megsy responds to valid legal process from competent law-enforcement authorities. We require requests to be properly served, narrowly scoped, and accompanied by a valid court order, subpoena, search warrant, or MLAT request as appropriate. We will notify the affected user before disclosure unless prohibited by law. Emergency disclosure requests for risk to life or limb may be honored without prior notice.",
      "Send valid legal process to legal@megsyai.com (PGP key available on request).",
    ],
  },
  {
    heading: "Whistleblowing",
    paragraphs: [
      "Anyone — employee, contractor, user, or member of the public — may report suspected illegal conduct, regulatory breach, or serious ethics violation in confidence to whistleblower@megsyai.com. Reports may be made anonymously. Retaliation against a person who reports in good faith is strictly prohibited and is itself grounds for termination.",
    ],
  },
];

const CompliancePage = () => (
  <LegalPageLayout
    eyebrow="Governance"
    title="Compliance"
    subtitle="Sanctions, AML, anti-bribery, modern slavery, tax, and law-enforcement — the global rules we follow and how to engage us on them."
    lastUpdated="May 19, 2026"
    sections={sections}
    seoTitle="Compliance Statement — Megsy AI"
    seoDescription="Megsy AI compliance with sanctions, AML, anti-bribery, modern slavery, and law-enforcement process worldwide."
    canonicalPath="/legal/compliance"
    heroVariant="team"
  />
);

export default CompliancePage;
