import LegalPageLayout, { LegalSection } from "@/components/landing/LegalPageLayout";

const sections: LegalSection[] = [
  {
    heading: "Minimum Age",
    paragraphs: [
      "Megsy AI is intended for use by adults aged 18 years or older. By creating an account you represent and warrant that you are at least 18 years of age, or the higher age of majority in your country of residence, and that you are legally able to enter into a binding contract.",
      "We do not knowingly collect personal information from anyone under the minimum age. If we learn that we have collected personal data from someone below the applicable age, we will delete that information and terminate the account.",
    ],
  },
  {
    heading: "Stricter Local Limits",
    paragraphs: [
      "In jurisdictions that set a higher digital-consent or contracting age, the higher age applies. Examples: South Korea (19 for contracts), Japan (18), Egypt (21 for certain financial obligations). Where parental consent is required, the parent or legal guardian must complete account creation and accept the Terms on behalf of the minor — for non-sensitive features only.",
    ],
  },
  {
    heading: "Sensitive Tools",
    paragraphs: [
      "Features that generate or modify human likeness, voice, or body — including AI Portrait Studio, Voice Sync Studio, Animated Portrait, and similar tools — may be subject to additional age verification, identity confirmation, or country-level restrictions. Such tools must never be used to create content involving minors or to depict real people without their informed consent.",
    ],
  },
  {
    heading: "Reporting Underage Use",
    paragraphs: [
      "If you believe an account is being used by someone under the minimum age, please email safety@megsyai.com with any supporting information. We investigate promptly and confidentially.",
    ],
  },
  {
    heading: "Parental Controls",
    paragraphs: [
      "Parents and guardians who wish to manage a child's online activity may use device-level or network-level parental controls (such as Apple Screen Time, Google Family Link, or DNS filtering) to block megsyai.com.",
    ],
  },
];

const AgePolicyPage = () => (
  <LegalPageLayout
    eyebrow="Trust & Safety"
    title="Age Policy"
    subtitle="Who can use Megsy AI, why we require adulthood, and how parents can manage access."
    lastUpdated="May 19, 2026"
    sections={sections}
    seoTitle="Age & Eligibility Policy — Megsy AI"
    seoDescription="Megsy AI age requirements, sensitive-tool restrictions, and parental control guidance."
    canonicalPath="/legal/age"
    heroVariant="portrait"
  />
);

export default AgePolicyPage;
