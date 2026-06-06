import { createContext, useContext, type ReactNode } from "react";
import type { LandingContent } from "./i18n/types";
import { LOCALES, type LocaleCode, type LocaleMeta, getLocale } from "./i18n/locales";

import en from "./i18n/en";
import ar from "./i18n/ar";
import es from "./i18n/es";
import fr from "./i18n/fr";
import de from "./i18n/de";
import pt from "./i18n/pt";
import it from "./i18n/it";
import tr from "./i18n/tr";
import ru from "./i18n/ru";
import zh from "./i18n/zh";
import ja from "./i18n/ja";
import ko from "./i18n/ko";
import hi from "./i18n/hi";
import id from "./i18n/id";
import nl from "./i18n/nl";

const CONTENT: Record<LocaleCode, LandingContent> = {
  en, ar, es, fr, de, pt, it, tr, ru, zh, ja, ko, hi, id, nl,
};

interface Ctx {
  locale: LocaleMeta;
  content: LandingContent;
}

const LandingContentContext = createContext<Ctx | null>(null);

export const LandingContentProvider = ({
  locale,
  children,
}: {
  locale: LocaleCode;
  children: ReactNode;
}) => {
  const meta = getLocale(locale);
  const content = CONTENT[locale] ?? CONTENT.en;
  return (
    <LandingContentContext.Provider value={{ locale: meta, content }}>
      {children}
    </LandingContentContext.Provider>
  );
};

export const useLandingContent = () => {
  const ctx = useContext(LandingContentContext);
  if (!ctx) {
    // Sensible fallback if a component is rendered outside the provider.
    return { locale: LOCALES[0], content: CONTENT.en };
  }
  return ctx;
};

export { LOCALES };
export type { LocaleCode, LocaleMeta };
