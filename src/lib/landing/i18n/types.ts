// Shared shape for every landing locale.
export interface LandingContent {
  meta: {
    title: string;
    description: string;
    keywords: string;
    ogLocale: string; // e.g. en_US, ar_EG
  };
  hero: {
    h1Pre: string;
    h1Highlight: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  chatModels: {
    kicker: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    items: Array<{ name: string; tag: string; description: string }>;
    modesTitle: string;
    modes: Array<{ name: string; description: string }>;
  };
  imageModels: {
    kicker: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    items: Array<{ name: string; cost: string; description: string }>;
  };
  codeModels: {
    kicker: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    steps: Array<{ title: string; description: string }>;
  };
  howItWorks: {
    title: string;
    titleHighlight: string;
    subtitle: string;
    steps: Array<{ title: string; description: string }>;
  };
  cta: {
    line1: string;
    line2: string;
    subtitle: string;
    button: string;
  };
  faq: {
    title: string;
    subtitle: string;
    items: Array<{ q: string; a: string }>;
  };
}
