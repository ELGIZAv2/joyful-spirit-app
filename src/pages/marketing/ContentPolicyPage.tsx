import LegalPageLayout, { type LegalSection } from "@/components/landing/LegalPageLayout";

const sections: LegalSection[] = [
  {
    heading: "Purpose & Scope",
    paragraphs: [
      "This Content Policy combines our Acceptable Use Policy, Content Moderation procedures, and Age requirements into a single source of truth. It applies to every account, workspace, prompt, upload, generated output, and public profile on Megsy AI worldwide.",
      "Violations may result in content removal, feature restrictions, account suspension, permanent termination without refund, and — where required by law — reporting to NCMEC, INHOPE, or local law enforcement.",
    ],
  },
  {
    heading: "18+ Adults Only — Age Requirement",
    paragraphs: [
      "Megsy AI is strictly for users aged 18 years or older (or the higher age of majority in your country). By creating an account you represent and warrant that you meet this requirement.",
      "We do not knowingly collect personal information from anyone under 18. If we discover an underage account, it is terminated immediately and any associated data is deleted in accordance with our Privacy Policy and COPPA. Parents or guardians who believe their child has registered may contact support@megsyai.com for immediate removal.",
    ],
    list: [
      "An age-verification gate is presented on first visit and stored locally.",
      "Sensitive creative tools require re-confirmation of age before use.",
      "Workspace owners are responsible for ensuring every collaborator is 18+.",
    ],
  },
  {
    heading: "Zero Tolerance — Child Safety (CSAM)",
    paragraphs: [
      "Megsy has absolute zero tolerance for any content that sexualises, endangers, or exploits minors — real, fictional, animated, AI-generated, or otherwise.",
    ],
    list: [
      "No sexual, suggestive, or nude content involving anyone who appears under 18, in any medium.",
      "No grooming, exploitation, or normalisation of harm to children.",
      "Suspected CSAM is reported to the National Center for Missing & Exploited Children (NCMEC) and INHOPE without notice to the user, with all relevant metadata preserved for investigators.",
      "Accounts found uploading or generating such material are permanently banned and referred to law enforcement.",
    ],
  },
  {
    heading: "Identity, Likeness & Deepfakes",
    paragraphs: [
      "Generative tools must never depict or impersonate real, identifiable individuals without their explicit, informed, written consent. This includes public figures, celebrities, politicians, private individuals, and the deceased.",
      "In line with the EU AI Act (Article 50), all synthetic media depicting people is automatically watermarked and labeled as AI-generated. Removing or obscuring these labels is a violation of this policy and EU law.",
    ],
    list: [
      "No realistic synthetic media of real people without verified, documented consent.",
      "No content making a real person appear to say or do something they did not.",
      "No election-related synthetic media of candidates, officials, or election workers.",
      "No use of another person's photo, video, or voice as input without rights to do so.",
      "By uploading any image of a person you confirm you own the rights or have explicit permission to use it.",
    ],
  },
  {
    heading: "Sexual & Adult Content",
    paragraphs: [
      "Megsy is not a platform for pornographic, sexually explicit, or hardcore adult content. Artistic nudity in clearly non-sexual contexts is reviewed case-by-case and may be restricted depending on the model and tool.",
    ],
    list: [
      "No pornography, hardcore sexual content, or sexually explicit material.",
      "No non-consensual intimate imagery (\"revenge porn\"), real or synthetic.",
      "No sexualisation of real, identifiable individuals — public or private.",
      "No \"undress,\" \"nudify,\" or clothing-removal use cases on photos of real people.",
    ],
  },
  {
    heading: "Violence, Weapons & Dangerous Content",
    list: [
      "No instructions or operational guidance for firearms, explosives, chemical, biological, radiological, or nuclear weapons.",
      "No content promoting terrorism, mass violence, or violent extremism.",
      "No detailed self-harm, suicide, or eating-disorder instructions.",
      "No incitement of violence against any individual, community, or institution.",
    ],
  },
  {
    heading: "Hate, Harassment & Discrimination",
    list: [
      "No hateful content targeting race, ethnicity, religion, nationality, gender, gender identity, sexual orientation, disability, or age.",
      "No threats, doxxing, stalking, or coordinated harassment.",
      "No content that dehumanises or denies historical atrocities.",
    ],
  },
  {
    heading: "Fraud, Deception, Spam & Election Integrity",
    list: [
      "No phishing, scams, fake reviews, counterfeit documents, or identity-theft tooling.",
      "No malware, ransomware, exploits, or instructions to bypass security systems.",
      "No content designed to manipulate elections, opinion polls, or democratic processes.",
      "No automated bulk generation for spam or coordinated inauthentic behaviour.",
      "No misuse of Megsy for academic dishonesty in regulated contexts (medical, legal, professional exams).",
    ],
  },
  {
    heading: "Illegal Activity & Regulated Goods",
    paragraphs: [
      "Do not use Megsy in furtherance of activity that is illegal under the laws of Egypt, your country of residence, or the country where the content is published — including controlled-substance trafficking, human trafficking, weapons trafficking, money laundering, or sanctions evasion.",
    ],
  },
  {
    heading: "Intellectual Property & Privacy",
    paragraphs: [
      "Respect the rights of others. Do not upload, generate, or publish content that infringes a third party's copyright, trademark, trade secret, publicity, or privacy rights.",
      "We respond to valid DMCA takedown notices — see our DMCA / Copyright page for the full procedure and designated agent.",
    ],
  },
  {
    heading: "Platform Integrity",
    list: [
      "No attempts to bypass safety filters, rate limits, watermarks, or credit systems.",
      "No reverse-engineering, scraping, or unauthorised API access.",
      "No reselling raw Megsy outputs as if generated by your own model.",
      "No use of Megsy outputs or logs to train competing generative models.",
    ],
  },
  {
    heading: "How We Moderate",
    paragraphs: [
      "We use a defence-in-depth approach combining input filters, output classifiers, third-party safety models, human review, and user reports. All synthetic media is C2PA-style labeled and watermarked where technically feasible.",
    ],
    list: [
      "Prompt-time filters block requests that match known disallowed patterns.",
      "Output classifiers re-scan generated media before delivery.",
      "Random and targeted human review on flagged content by a trained Trust & Safety team.",
      "All moderation decisions are logged for audit and regulatory inspection.",
    ],
  },
  {
    heading: "Reporting & Flagging Content",
    paragraphs: [
      "If you encounter content or behaviour that violates this policy, please report it to trust@megsyai.com (or support@megsyai.com) with the subject \"Trust & Safety Report.\" Include URLs, screenshots, the type of violation, and any context that helps us investigate quickly.",
      "Reports involving imminent harm or CSAM are escalated within 24 hours; standard reports within 5 business days. In compliance with the EU Digital Services Act, trusted flaggers receive prioritised handling.",
    ],
  },
  {
    heading: "Enforcement Actions",
    list: [
      "Warning and educational notice for first, low-severity issues.",
      "Content removal and feature restriction for repeated or moderate issues.",
      "Account suspension, billing freeze, and review for serious violations.",
      "Permanent termination without refund and referral to law enforcement for severe violations (CSAM, fraud rings, mass-impersonation, terrorism).",
    ],
  },
  {
    heading: "Appeals (EU Digital Services Act Compliant)",
    paragraphs: [
      "If your content was removed or your account restricted, you may appeal within 30 days by emailing appeals@megsyai.com with your account ID and the case reference. Appeals are reviewed by a human moderator who was not involved in the original decision. We respond within 10 business days.",
      "EU users retain the right to escalate disputes to a certified out-of-court dispute settlement body under Article 21 of the DSA.",
    ],
  },
  {
    heading: "Transparency Reporting",
    paragraphs: [
      "We publish a Transparency Report annually disclosing: total content removals by category, government and law-enforcement requests received and complied with, DMCA notices, EU DSA notices, average response times, and appeals outcomes. The most recent report is linked from our Trust Center.",
    ],
  },
  {
    heading: "Updates",
    paragraphs: [
      "We refine this policy as the platform evolves and new abuse patterns emerge. Material changes are announced via in-product notice at least 14 days before they take effect. The current version is always at this page.",
    ],
  },
];

const ContentPolicyPage = () => (
  <LegalPageLayout
    eyebrow="Trust & Safety"
    title="Content Policy"
    subtitle="One unified policy covering acceptable use, content moderation, age requirements, and how we keep Megsy safe for the entire world."
    lastUpdated="19 May 2026"
    sections={sections}
    seoTitle="Content Policy — Megsy AI"
    seoDescription="Unified Acceptable Use, Moderation and Age Policy for Megsy AI. Zero tolerance for CSAM, non-consensual deepfakes, fraud, and abuse."
    canonicalPath="/policies/content"
    heroVariant="portrait"
  />
);

export default ContentPolicyPage;
