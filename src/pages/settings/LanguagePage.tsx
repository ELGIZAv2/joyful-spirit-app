// Language settings — luma/neutral. Cartoon-style country flags per language.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/settings/DesktopSettingsLayout";
import { goBackOr } from "@/lib/navigation";
import { BackIcon } from "@/components/settings/SettingsIcons";
import CartoonFlag from "@/components/branding/CartoonFlag";

type Lang = { code: string; name: string; native: string; country: string; rtl?: boolean };

// Mirrors the Google Translate / Chrome language list. One language per country
// flag — no duplicate flag entries. (Hebrew/Israel removed per request.)
const LANGUAGES: Lang[] = [
  { code: "en", name: "English", native: "English", country: "uk" },
  { code: "ar", name: "Arabic", native: "Arabic", country: "eg", rtl: true },
  { code: "es", name: "Spanish", native: "Español", country: "es" },
  { code: "fr", name: "French", native: "Français", country: "fr" },
  { code: "de", name: "German", native: "Deutsch", country: "de" },
  { code: "it", name: "Italian", native: "Italiano", country: "it" },
  { code: "pt", name: "Portuguese", native: "Português", country: "pt" },
  { code: "nl", name: "Dutch", native: "Nederlands", country: "nl" },
  { code: "ru", name: "Russian", native: "Русский", country: "ru" },
  { code: "uk", name: "Ukrainian", native: "Українська", country: "ua" },
  { code: "pl", name: "Polish", native: "Polski", country: "pl" },
  { code: "cs", name: "Czech", native: "Čeština", country: "cz" },
  { code: "sk", name: "Slovak", native: "Slovenčina", country: "sk" },
  { code: "sl", name: "Slovenian", native: "Slovenščina", country: "si" },
  { code: "hr", name: "Croatian", native: "Hrvatski", country: "hr" },
  { code: "sr", name: "Serbian", native: "Српски", country: "rs" },
  { code: "bs", name: "Bosnian", native: "Bosanski", country: "ba" },
  { code: "mk", name: "Macedonian", native: "Македонски", country: "mk" },
  { code: "sq", name: "Albanian", native: "Shqip", country: "al" },
  { code: "ro", name: "Romanian", native: "Română", country: "ro" },
  { code: "hu", name: "Hungarian", native: "Magyar", country: "hu" },
  { code: "bg", name: "Bulgarian", native: "Български", country: "bg" },
  { code: "el", name: "Greek", native: "Ελληνικά", country: "gr" },
  { code: "tr", name: "Turkish", native: "Türkçe", country: "tr" },
  { code: "sv", name: "Swedish", native: "Svenska", country: "se" },
  { code: "no", name: "Norwegian", native: "Norsk", country: "no" },
  { code: "da", name: "Danish", native: "Dansk", country: "dk" },
  { code: "fi", name: "Finnish", native: "Suomi", country: "fi" },
  { code: "is", name: "Icelandic", native: "Íslenska", country: "is" },
  { code: "et", name: "Estonian", native: "Eesti", country: "ee" },
  { code: "lv", name: "Latvian", native: "Latviešu", country: "lv" },
  { code: "lt", name: "Lithuanian", native: "Lietuvių", country: "lt" },
  { code: "be", name: "Belarusian", native: "Беларуская", country: "by" },
  { code: "ka", name: "Georgian", native: "ქართული", country: "ge" },
  { code: "hy", name: "Armenian", native: "Հայերեն", country: "am" },
  { code: "az", name: "Azerbaijani", native: "Azərbaycanca", country: "az" },
  { code: "kk", name: "Kazakh", native: "Қазақша", country: "kz" },
  { code: "ky", name: "Kyrgyz", native: "Кыргызча", country: "kg" },
  { code: "uz", name: "Uzbek", native: "Oʻzbekcha", country: "uz" },
  { code: "fa", name: "Persian", native: "Persian", country: "ir", rtl: true },
  { code: "ps", name: "Pashto", native: "Pashto", country: "af", rtl: true },
  { code: "ku", name: "Kurdish", native: "Kurdî", country: "iq" },
  { code: "ur", name: "Urdu", native: "Urdu", country: "pk", rtl: true },
  { code: "hi", name: "Hindi", native: "हिन्दी", country: "in" },
  { code: "bn", name: "Bengali", native: "বাংলা", country: "bd" },
  { code: "ne", name: "Nepali", native: "नेपाली", country: "np" },
  { code: "si", name: "Sinhala", native: "සිංහල", country: "lk" },
  { code: "my", name: "Burmese", native: "မြန်မာ", country: "mm" },
  { code: "th", name: "Thai", native: "ไทย", country: "th" },
  { code: "lo", name: "Lao", native: "ລາວ", country: "la" },
  { code: "km", name: "Khmer", native: "ខ្មែរ", country: "kh" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt", country: "vn" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia", country: "id" },
  { code: "ms", name: "Malay", native: "Bahasa Melayu", country: "my" },
  { code: "tl", name: "Filipino", native: "Filipino", country: "ph" },
  { code: "zh", name: "Chinese (Simplified)", native: "简体中文", country: "cn" },
  { code: "zh-TW", name: "Chinese (Traditional)", native: "繁體中文", country: "tw" },
  { code: "ja", name: "Japanese", native: "日本語", country: "jp" },
  { code: "ko", name: "Korean", native: "한국어", country: "kr" },
  { code: "mn", name: "Mongolian", native: "Монгол", country: "mn" },
  { code: "sw", name: "Swahili", native: "Kiswahili", country: "ke" },
  { code: "am", name: "Amharic", native: "አማርኛ", country: "et" },
  { code: "ha", name: "Hausa", native: "Hausa", country: "ng" },
  { code: "zu", name: "Zulu", native: "isiZulu", country: "za" },
];

const CheckMark = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M5 12l4.5 4.5L19 7" />
  </svg>
);

const LanguagePage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentLang, setCurrentLang] = useState(localStorage.getItem("language") || "en");

  const handleSelect = (code: string) => {
    localStorage.setItem("language", code);
    setCurrentLang(code);
    window.dispatchEvent(new Event("languagechange-custom"));
  };

  const current = LANGUAGES.find(l => l.code === currentLang);

  const Row = ({ lang }: { lang: Lang }) => {
    const isActive = currentLang === lang.code;
    return (
      <button
        onClick={() => handleSelect(lang.code)}
        className="notranslate w-full flex items-center justify-between gap-4 px-4 py-3 text-left hover:bg-muted/40 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
      >
        <div className="flex items-center gap-3 min-w-0">
          <CartoonFlag country={lang.country} size={36} />
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-foreground truncate">{lang.name}</p>
            <p className="text-[12px] text-muted-foreground truncate" dir={lang.rtl ? "rtl" : "ltr"}>{lang.native}</p>
          </div>
        </div>
        {isActive && (
          <span className="w-6 h-6 rounded-full bg-foreground text-background grid place-items-center shrink-0">
            <CheckMark />
          </span>
        )}
      </button>
    );
  };

  const Content = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="max-w-2xl"
    >
      {current && (
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card mb-6">
          <CartoonFlag country={current.country} size={44} />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/70">Current</p>
            <p className="notranslate text-[15px] font-semibold text-foreground mt-0.5">
              {current.name}
              <span className="text-muted-foreground font-normal ml-2" dir={current.rtl ? "rtl" : "ltr"}>· {current.native}</span>
            </p>
          </div>
        </div>
      )}

      <section>
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/70 mb-2 px-1">All languages</p>
        <div className="rounded-2xl border border-border bg-card divide-y divide-border">
          {LANGUAGES.map(l => <Row key={l.code} lang={l} />)}
        </div>
      </section>
    </motion.div>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="Language" subtitle="Choose your preferred language">
        <Content />
      </DesktopSettingsLayout>
    );
  }

  return (
    <div className="h-[100dvh] bg-background overflow-y-auto">
      <div className="max-w-2xl mx-auto px-5 pb-16">
        <div className="flex items-center gap-3 py-4">
          <button
            onClick={() => goBackOr(navigate, "/settings")}
            className="w-9 h-9 grid place-items-center rounded-xl text-foreground/70 hover:bg-muted/50 transition-colors"
            aria-label="Back"
          >
            <BackIcon className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-foreground">Language</h1>
        </div>
        <div className="pt-2">
          <Content />
        </div>
      </div>
    </div>
  );
};

export default LanguagePage;
