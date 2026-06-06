// Multi-language short descriptions shown under the hero title in
// Learning, Shopping, and Deep Research empty states.
type Mode = "learning" | "shopping" | "research";

const map: Record<Mode, Record<string, string>> = {
  learning: {
    en: "Ask anything. Learn faster.",
    ar: "Ask anything. Learn faster.",
    fr: "Demandez tout. Apprenez plus vite.",
    es: "Pregunta cualquier cosa. Aprende más rápido.",
  },
  shopping: {
    en: "Find the best deal in your currency.",
    ar: "Find the best deal in your currency.",
    fr: "Trouvez la meilleure offre dans votre devise.",
    es: "Encuentra la mejor oferta en tu moneda.",
  },
  research: {
    en: "Deep answers from across the web.",
    ar: "Deep answers from across the web.",
    fr: "Réponses approfondies depuis tout le web.",
    es: "Respuestas profundas desde toda la web.",
  },
};

export const getModeDescription = (mode: Mode): string => {
  return map[mode].en;
};
