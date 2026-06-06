import LegalPageLayout, { type LegalSection } from "@/components/landing/LegalPageLayout";

const sections: LegalSection[] = [
  {
    heading: "Purpose",
    paragraphs: [
      "Megsy AI gives you powerful generative tools across text, image, video, audio, and code. With that power comes responsibility. This Acceptable Use Policy (\"AUP\") describes the conduct and content that are not permitted on Megsy and applies to every account, workspace, prompt, upload, and generated output.",
      "Violations may result in content removal, feature restrictions, account suspension, or permanent termination — and, where appropriate, reporting to law-enforcement authorities.",
    ],
  },
  {
    heading: "Identity & Likeness",
    paragraphs: [
      "Megsy's image, video, and voice tools must never be used to depict or impersonate real, identifiable individuals without their explicit, informed, written consent. This includes — without limitation — public figures, celebrities, politicians, private individuals, and deceased persons.",
    ],
    list: [
      "No deepfakes, face-swap composites, or voice clones of real people without verified consent.",
      "No content designed to make a real person appear to say or do something they did not.",
      "No use of another person's photo, video, or voice as an input without the rights to do so.",
      "No outputs intended to defraud, harass, defame, blackmail, or politically manipulate.",
    ],
  },
  {
    heading: "Minors",
    paragraphs: [
      "Megsy has zero tolerance for content that sexualises or endangers minors.",
    ],
    list: [
      "Absolutely no sexual or suggestive content involving anyone under 18, real or fictional.",
      "No nudity of minors in any context.",
      "No grooming, exploitation, or content that normalises harm to children.",
      "We report suspected child-sexual-abuse material to the appropriate authorities without notice to the user.",
    ],
  },
  {
    heading: "Adult & Explicit Content",
    paragraphs: [
      "Megsy is not a platform for pornographic, sexually explicit, or hardcore adult content. Tasteful artistic nudity is reviewed case-by-case and may be restricted depending on the model and feature used.",
    ],
    list: [
      "No pornography, hardcore sexual content, or sexually explicit material involving any person.",
      "No non-consensual intimate imagery (\"revenge porn\"), real or synthetic.",
      "No content sexualising real, identifiable individuals.",
    ],
  },
  {
    heading: "Violence & Dangerous Content",
    paragraphs: [
      "Do not use Megsy to plan, promote, or glorify real-world violence or to produce content that could cause physical harm.",
    ],
    list: [
      "No instructions or operational guidance for weapons (firearms, explosives, chemical, biological, radiological, or nuclear).",
      "No content promoting terrorism, mass violence, or violent extremism.",
      "No detailed self-harm or suicide instructions.",
      "No content that encourages dangerous physical challenges or eating disorders.",
    ],
  },
  {
    heading: "Hate, Harassment & Discrimination",
    paragraphs: [
      "Megsy is a creative platform for everyone. Content that dehumanises or threatens people on the basis of protected characteristics is not allowed.",
    ],
    list: [
      "No hateful content targeting race, ethnicity, religion, nationality, gender, gender identity, sexual orientation, disability, or age.",
      "No threats, doxxing, or content intended to harass, intimidate, or silence an individual or group.",
      "No content that incites violence against any community.",
    ],
  },
  {
    heading: "Fraud, Deception & Spam",
    paragraphs: [
      "Megsy must not be used to deceive others or to operate fraudulent schemes.",
    ],
    list: [
      "No phishing, scams, fake reviews, or counterfeit identification documents.",
      "No malware, ransomware, exploits, or instructions to bypass security systems.",
      "No content designed to manipulate elections, opinion polls, or democratic processes.",
      "No automated bulk generation for spam or coordinated inauthentic behaviour.",
    ],
  },
  {
    heading: "Illegal Activity",
    paragraphs: [
      "Do not use Megsy in furtherance of activity that is illegal under the laws of Egypt, your country of residence, or the country where the content is published — including but not limited to controlled-substance trafficking, human trafficking, weapons trafficking, money laundering, or fraud.",
    ],
  },
  {
    heading: "Intellectual Property & Privacy",
    paragraphs: [
      "Respect the rights of others. Do not upload, generate, or publish content that infringes a third party's copyright, trademark, trade secret, publicity, or privacy rights.",
      "We respond to valid takedown notices. Send copyright complaints to support@megsyai.com with the subject \"IP Notice\".",
    ],
  },
  {
    heading: "Platform Integrity",
    paragraphs: [
      "Keep the platform reliable for everyone.",
    ],
    list: [
      "No attempts to bypass safety filters, rate limits, or credit systems.",
      "No reverse-engineering, scraping, or unauthorised API access.",
      "No reselling Megsy outputs as if they were generated by your own model.",
      "No use of Megsy to train competing generative models.",
    ],
  },
  {
    heading: "Reporting Violations",
    paragraphs: [
      "If you encounter content or behaviour that violates this AUP, please report it to support@megsyai.com with the subject \"AUP Report\". Include links, screenshots, and any details that will help us investigate quickly.",
    ],
  },
  {
    heading: "Enforcement",
    paragraphs: [
      "We use a mix of automated moderation, human review, and user reports to enforce this AUP. Depending on severity and history, enforcement actions range from a warning, to content removal, to permanent account termination without refund.",
      "Severe violations — especially those involving minors, identity impersonation for fraud, or threats to physical safety — result in immediate termination and may be referred to law enforcement.",
    ],
  },
  {
    heading: "Updates",
    paragraphs: [
      "We refine this AUP as the platform evolves and as new abuse patterns emerge. The current version always lives at this page.",
    ],
  },
];

const AcceptableUsePage = () => (
  <LegalPageLayout
    eyebrow="Legal"
    title="Acceptable Use"
    subtitle="The clear, non-negotiable line between creative use of Megsy AI and behaviour that puts people at risk."
    lastUpdated="19 May 2026"
    sections={sections}
    seoTitle="Acceptable Use Policy"
    seoDescription="Megsy AI Acceptable Use Policy — what's allowed, what's prohibited, and how violations are handled."
    canonicalPath="/acceptable-use"
  />
);

export default AcceptableUsePage;
