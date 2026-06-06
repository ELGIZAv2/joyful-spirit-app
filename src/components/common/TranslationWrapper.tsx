import { useEffect, useRef, ReactNode } from "react";
import { runFallbackTranslate } from "@/lib/translation/fallback";

const RTL_LANGUAGES = ["ar", "fa", "he", "ps", "ur"];

const LANG_MAP: Record<string, string> = {
  en: "en", ar: "ar", es: "es", fr: "fr", de: "de", it: "it", pt: "pt",
  nl: "nl", ru: "ru", uk: "uk", pl: "pl", cs: "cs", sk: "sk", sl: "sl",
  hr: "hr", sr: "sr", bs: "bs", mk: "mk", sq: "sq", ro: "ro", hu: "hu",
  bg: "bg", el: "el", tr: "tr", sv: "sv", no: "no", da: "da", fi: "fi",
  is: "is", et: "et", lv: "lv", lt: "lt", be: "be", ka: "ka", hy: "hy",
  az: "az", kk: "kk", ky: "ky", uz: "uz", fa: "fa", ps: "ps", ku: "ku",
  ur: "ur", hi: "hi", bn: "bn", ne: "ne", si: "si", my: "my", th: "th",
  lo: "lo", km: "km", vi: "vi", id: "id", ms: "ms", tl: "tl",
  zh: "zh-CN", "zh-TW": "zh-TW", ja: "ja", ko: "ko", mn: "mn",
  sw: "sw", am: "am", ha: "ha", zu: "zu", he: "iw",
};

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

/* ── Cookie helpers ─────────────────────────────────────────── */

function setGoogTransCookie(gtLang: string) {
  const val = gtLang === "en" ? "" : `/en/${gtLang}`;
  const host = window.location.hostname;
  // Set for both root and current domain
  document.cookie = `googtrans=${val}; path=/;`;
  document.cookie = `googtrans=${val}; path=/; domain=.${host}`;
}

function clearGoogTransCookie() {
  const host = window.location.hostname;
  document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${host}`;
}

/* ── Attribute translation (placeholder/title/aria-label) ──── */

type AttrPair = { el: Element; attr: string; span: HTMLSpanElement };

function translateInputAttributes() {
  const ATTRS = ["placeholder", "title", "aria-label"] as const;
  const old = document.getElementById("gt-attr-mirror");
  if (old) old.remove();

  const mirror = document.createElement("div");
  mirror.id = "gt-attr-mirror";
  mirror.style.cssText =
    "position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;overflow:hidden;height:0;width:0;";
  document.body.appendChild(mirror);

  const pairs: AttrPair[] = [];
  document.querySelectorAll("input, textarea, [title], [aria-label]").forEach((el) => {
    ATTRS.forEach((attr) => {
      const val = el.getAttribute(attr);
      if (!val?.trim()) return;

      const origKey = `data-orig-${attr}`;
      if (!el.getAttribute(origKey)) el.setAttribute(origKey, val);

      const span = document.createElement("span");
      span.textContent = el.getAttribute(origKey) || val;
      mirror.appendChild(span);
      pairs.push({ el, attr, span });
    });
  });

  if (!pairs.length) {
    mirror.remove();
    return;
  }

  // Google Translate will translate the mirror spans; copy back after delay
  setTimeout(() => {
    pairs.forEach(({ el, attr, span }) => {
      const t = span.textContent?.trim();
      if (t) el.setAttribute(attr, t);
    });
    mirror.remove();
  }, 2500);
}

/* ── Core trigger (one-shot) ───────────────────────────────── */

function triggerTranslateOnce(langCode: string) {
  const gtLang = LANG_MAP[langCode] || langCode;

  if (langCode === "en") {
    clearGoogTransCookie();
    document.querySelectorAll("[data-orig-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", el.getAttribute("data-orig-placeholder")!);
    });
    // Switch Google combo back to English in-place — no full page reload
    const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
    if (select) {
      select.value = "en";
      select.dispatchEvent(new Event("change"));
    }
    return;
  }

  setGoogTransCookie(gtLang);

  let attempts = 0;
  const trySwitch = () => {
    const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
    if (select) {
      select.value = gtLang;
      select.dispatchEvent(new Event("change"));
      setTimeout(translateInputAttributes, 2000);
      return;
    }
    if (++attempts < 30) setTimeout(trySwitch, 200);
    else {
      // Google Translate didn't load (blocked by network/extension/CSP).
      // Fallback to open-source Lingva/MyMemory.
      void runFallbackTranslate(langCode);
    }
  };

  trySwitch();
}

/* ── Init Google Translate widget ──────────────────────────── */

function initGoogleTranslate() {
  if (!document.getElementById("google_translate_element")) {
    const div = document.createElement("div");
    div.id = "google_translate_element";
    div.style.display = "none";
    document.body.appendChild(div);
  }

  // Pre-set cookie BEFORE loading the script so Google picks it up automatically
  const savedLang = localStorage.getItem("language") || "en";
  if (savedLang !== "en") {
    setGoogTransCookie(LANG_MAP[savedLang] || savedLang);
  }

  window.googleTranslateElementInit = () => {
    new window.google.translate.TranslateElement(
      {
        pageLanguage: "en",
        autoDisplay: false,
        includedLanguages: Object.values(LANG_MAP).join(","),
      },
      "google_translate_element"
    );

    // If there's a saved non-English language, trigger once after widget ready
    if (savedLang !== "en") {
      setTimeout(() => {
        triggerTranslateOnce(savedLang);
      }, 800);
    }
  };

  if (!document.getElementById("google-translate-script")) {
    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }
}

/* ── Hide Google Translate UI CSS ──────────────────────────── */

const HIDE_CSS = `
  .goog-te-banner-frame, .goog-te-balloon-frame,
  iframe.goog-te-banner-frame,
  .goog-te-spinner-pos, .goog-te-spinner-animation,
  [class*="VIpgJd-ZVi9od-"],
  [class*="goog-te-spinner"] {
    display: none !important; height: 0 !important; width: 0 !important;
    visibility: hidden !important; overflow: hidden !important;
    opacity: 0 !important; pointer-events: none !important;
  }
  body { top: 0px !important; margin-top: 0px !important; position: static !important; }
  html > body { top: 0px !important; }
  .goog-tooltip, .goog-tooltip:hover { display: none !important; }
  .goog-text-highlight { background: none !important; box-shadow: none !important; }
  #google_translate_element { display: none !important; }
  .skiptranslate { display: none !important; height: 0 !important; overflow: hidden !important; opacity: 0 !important; }
  #goog-gt-tt, .goog-te-menu-value { display: none !important; }
`;

/* ── Component ─────────────────────────────────────────────── */

interface TranslationWrapperProps {
  children: ReactNode;
}

const TranslationWrapper = ({ children }: TranslationWrapperProps) => {
  const appliedLangRef = useRef(localStorage.getItem("language") || "en");

  // 1. Boot Google Translate + hide UI (deferred — only when user picked a non-English lang,
  //    or after the page is idle. Avoids loading 200KB+ of Google Translate JS on every page.)
  useEffect(() => {
    const savedLang = localStorage.getItem("language") || "en";

    const style = document.createElement("style");
    style.textContent = HIDE_CSS;
    document.head.appendChild(style);

    const boot = () => initGoogleTranslate();

    let bootTimer: number | undefined;
    if (savedLang !== "en") {
      // User actively translated → boot ASAP
      boot();
    } else if (typeof (window as any).requestIdleCallback === "function") {
      (window as any).requestIdleCallback(boot, { timeout: 4000 });
    } else {
      bootTimer = window.setTimeout(boot, 2500);
    }

    const cleanUp = () => {
      document.body.style.top = "0px";
      document.body.style.marginTop = "0px";
      document
        .querySelectorAll<HTMLIFrameElement>(".goog-te-banner-frame, iframe.skiptranslate")
        .forEach((f) => {
          f.style.display = "none";
          f.style.height = "0";
          f.style.visibility = "hidden";
        });
    };

    const bodyObs = new MutationObserver(cleanUp);
    bodyObs.observe(document.body, { attributes: true, attributeFilter: ["style", "class"] });

    const docObs = new MutationObserver((muts) => {
      for (const m of muts) {
        for (const n of m.addedNodes) {
          if (
            n instanceof HTMLElement &&
            (n.classList?.contains("skiptranslate") ||
              n.classList?.contains("goog-te-banner-frame"))
          ) {
            n.style.display = "none";
            n.style.height = "0";
            n.style.visibility = "hidden";
          }
        }
      }
      cleanUp();
    });
    docObs.observe(document.documentElement, { childList: true, subtree: true });

    const iv = setInterval(cleanUp, 100);
    setTimeout(() => clearInterval(iv), 5000);

    return () => {
      bodyObs.disconnect();
      docObs.disconnect();
      clearInterval(iv);
      if (bootTimer) clearTimeout(bootTimer);
      document.head.removeChild(style);
    };
  }, []);

  // 2. Set dir/lang from localStorage on mount
  useEffect(() => {
    const lang = localStorage.getItem("language") || "en";
    document.documentElement.dir = RTL_LANGUAGES.includes(lang) ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, []);

  // 3. Listen for EXPLICIT language changes only (no DOM mutation loops)
  useEffect(() => {
    const onLangChange = () => {
      const lang = localStorage.getItem("language") || "en";

      document.documentElement.dir = RTL_LANGUAGES.includes(lang) ? "rtl" : "ltr";
      document.documentElement.lang = lang;

      if (appliedLangRef.current === lang) return;
      appliedLangRef.current = lang;

      // Persist cookie
      if (lang === "en") {
        clearGoogTransCookie();
      } else {
        setGoogTransCookie(LANG_MAP[lang] || lang);
      }
      // Make sure Google Translate is booted (skipped on initial idle load when lang was 'en')
      if (lang !== "en" && !document.getElementById("google-translate-script")) {
        initGoogleTranslate();
      }

      triggerTranslateOnce(lang);
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key !== "language") return;
      onLangChange();
    };

    window.addEventListener("languagechange-custom", onLangChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("languagechange-custom", onLangChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // 4. On SPA route change → re-trigger translation for the new page content
  useEffect(() => {
    let lastPath = window.location.pathname;

    const reTranslate = () => {
      const lang = localStorage.getItem("language") || "en";
      if (lang === "en") return;

      // Re-set cookie + re-fire the Google Translate select so newly mounted
      // React subtrees get translated, not just static text from the initial render.
      setGoogTransCookie(LANG_MAP[lang] || lang);
      const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
      if (select) {
        // Toggle through 'en' then back so Google re-walks the DOM
        select.value = "en";
        select.dispatchEvent(new Event("change"));
        setTimeout(() => {
          select.value = LANG_MAP[lang] || lang;
          select.dispatchEvent(new Event("change"));
          setTimeout(translateInputAttributes, 1200);
        }, 80);
      } else {
        triggerTranslateOnce(lang);
      }
    };

    const checkRoute = () => {
      const cur = window.location.pathname;
      if (cur !== lastPath) {
        lastPath = cur;
        setTimeout(reTranslate, 350);
      }
    };

    const origPush = history.pushState;
    const origReplace = history.replaceState;
    history.pushState = function (...args) {
      origPush.apply(history, args);
      checkRoute();
    };
    history.replaceState = function (...args) {
      origReplace.apply(history, args);
      checkRoute();
    };
    window.addEventListener("popstate", checkRoute);

    return () => {
      history.pushState = origPush;
      history.replaceState = origReplace;
      window.removeEventListener("popstate", checkRoute);
    };
  }, []);

  return <>{children}</>;
};

export default TranslationWrapper;
