import LegalPageLayout, { LegalSection } from "@/components/landing/LegalPageLayout";

const sections: LegalSection[] = [
  {
    heading: "Our Commitment",
    paragraphs: [
      "Megsy respects the intellectual property rights of others and expects users of the Megsy AI platform to do the same. In accordance with the United States Digital Millennium Copyright Act (DMCA) of 1998, the EU Directive 2019/790 on Copyright in the Digital Single Market, and equivalent laws worldwide, we will respond expeditiously to clear notices of alleged copyright infringement.",
    ],
  },
  {
    heading: "Filing a Takedown Notice",
    paragraphs: [
      "If you believe that content available through Megsy infringes your copyright, please send a written notice to our Designated Agent at copyright@megsyai.com that includes all of the following:",
    ],
    list: [
      "A physical or electronic signature of the copyright owner or a person authorized to act on their behalf.",
      "Identification of the copyrighted work claimed to have been infringed.",
      "Identification of the material that is claimed to be infringing, with a direct URL or sufficient detail to locate it.",
      "Your full name, mailing address, telephone number, and email address.",
      "A statement that you have a good-faith belief that use of the material is not authorized by the copyright owner, its agent, or the law.",
      "A statement, made under penalty of perjury, that the information in the notice is accurate and that you are the copyright owner or authorized to act on the owner's behalf.",
    ],
  },
  {
    heading: "Counter-Notification",
    paragraphs: [
      "If you believe that material you posted was removed by mistake or misidentification, you may submit a counter-notification to copyright@megsyai.com containing your name, address, phone number, the removed material's location, a statement under penalty of perjury that you have a good-faith belief the material was removed in error, and your consent to the jurisdiction of the courts at your address (or, if outside the US, the courts of Cairo, Egypt).",
    ],
  },
  {
    heading: "Repeat Infringer Policy",
    paragraphs: [
      "Megsy will, in appropriate circumstances and at its sole discretion, suspend or terminate the accounts of users who are determined to be repeat infringers. We may also terminate accounts even on a single infringement when the violation is willful or harmful.",
    ],
  },
  {
    heading: "False Claims Warning",
    paragraphs: [
      "Under 17 U.S.C. § 512(f), any person who knowingly materially misrepresents that material is infringing — or that material was removed by mistake — may be liable for damages, including costs and attorneys' fees. Please consult an attorney before filing.",
    ],
  },
  {
    heading: "Designated Agent",
    paragraphs: [
      "Copyright Agent — Megsy for Digital Platforms & E-Commerce Development LLC",
      "Email: copyright@megsyai.com",
      "Address: 58 El-Hegaz St., Amoun Tower, Unit 84, Floor 8, Sheraton Al-Matar, Al-Nozha District, Cairo Governorate, Arab Republic of Egypt · CR 248691 · Tax 774034785",
    ],
  },
];

const DMCAPage = () => (
  <LegalPageLayout
    eyebrow="Legal"
    title="DMCA Policy"
    subtitle="How to report copyright infringement on Megsy AI — and how we handle takedowns, counter-notices, and repeat infringers."
    lastUpdated="May 19, 2026"
    sections={sections}
    seoTitle="DMCA & Copyright Policy — Megsy AI"
    seoDescription="Megsy AI's DMCA notice-and-takedown procedure, counter-notification process, and designated copyright agent."
    canonicalPath="/legal/dmca"
  />
);

export default DMCAPage;
