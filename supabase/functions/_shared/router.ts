// Intent Router — detects intent, mood, dialect, complexity, persona, and tools needed
// Used to optimize model selection, tool loading, and tone before main chat call.

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const ROUTER_MODEL = "google/gemini-2.5-flash";

type RouterTarget = string | {
  url: string;
  key: string;
  headers?: Record<string, string>;
  model?: string;
};

export type RouterDecision = {
  intent: "chat" | "code" | "search" | "creative" | "math" | "media" | "integration" | "research" | "learning";
  complexity: "simple" | "medium" | "complex";
  mood: "neutral" | "happy" | "frustrated" | "urgent" | "curious" | "sad" | "excited";
  language: string;
  dialect: string;
  persona: "default" | "friend" | "teacher" | "expert" | "comedian";
  tools_needed: string[];
  needs_memory: boolean;
  needs_reasoning: boolean;
  needs_citations: boolean;
};

const DEFAULT_DECISION: RouterDecision = {
  intent: "chat",
  complexity: "simple",
  mood: "neutral",
  language: "auto",
  dialect: "auto",
  persona: "default",
  tools_needed: [],
  needs_memory: false,
  needs_reasoning: false,
  needs_citations: false,
};

const ROUTER_TOOL = {
  type: "function",
  function: {
    name: "route_request",
    description: "Classify the user's request to optimize routing.",
    parameters: {
      type: "object",
      properties: {
        intent: { type: "string", enum: ["chat", "code", "search", "creative", "math", "media", "integration", "research", "learning"] },
        complexity: { type: "string", enum: ["simple", "medium", "complex"] },
        mood: { type: "string", enum: ["neutral", "happy", "frustrated", "urgent", "curious", "sad", "excited"] },
        language: { type: "string", description: "ISO code: ar, en, fr, es..." },
        dialect: { type: "string", description: "egyptian, gulf, levantine, maghrebi, msa, american, british, or 'none'" },
        persona: { type: "string", enum: ["default", "friend", "teacher", "expert", "comedian"], description: "Best matching persona for this message" },
        tools_needed: { type: "array", items: { type: "string" }, description: "List from: WEB_SEARCH, WIKIPEDIA, ARXIV, GITHUB_SEARCH, REDDIT_SEARCH, STACKOVERFLOW, NEWS_SEARCH, YOUTUBE_TRANSCRIPT, MATH_SOLVER, GENERATE_IMAGE, GENERATE_VIDEO, GENERATE_VOICE, FETCH_URL" },
        needs_memory: { type: "boolean", description: "True if user references past info or shares personal facts to remember" },
        needs_reasoning: { type: "boolean", description: "True for hard logic/math/multi-step problems" },
        needs_citations: { type: "boolean", description: "True if answer should cite sources (factual claims, news, research)" },
      },
      required: ["intent", "complexity", "mood", "language", "persona", "tools_needed", "needs_memory", "needs_reasoning", "needs_citations"],
    },
  },
};

export async function routeMessage(
  userText: string,
  target: RouterTarget,
  recentContext?: string
): Promise<RouterDecision> {
  if (!userText || userText.trim().length < 2) return DEFAULT_DECISION;

  const systemPrompt = `You are an internal request router. Classify the user's last message FAST. Return ONLY a route_request tool call.
Detect:
- intent: what kind of task
- complexity: simple (greeting, small talk, single fact) | medium (explanation, short code, summary) | complex (deep analysis, hard math, multi-step)
- mood: from tone clues (frustrated if angry/cursing, urgent if "ASAP/quickly", sad if down, excited if !!! or caps)
- language + dialect: detect EXACTLY (Egyptian Arabic vs MSA vs Gulf vs Levantine vs Maghrebi)
- persona: pick the best fit (friend for casual, teacher for "how does X work", expert for technical, comedian for jokes, default otherwise)
- tools_needed: only what's clearly needed
- needs_memory: true if user shares a fact about themselves or references prior info
- needs_reasoning: true for hard/multi-step logic
- needs_citations: true for factual claims that benefit from sources`;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const endpoint = typeof target === "string" ? OPENROUTER_URL : target.url;
    const headers = typeof target === "string"
      ? { Authorization: `Bearer ${target}`, "Content-Type": "application/json" }
      : { ...(target.headers || { Authorization: `Bearer ${target.key}` }), "Content-Type": "application/json" };
    const model = typeof target === "string" ? ROUTER_MODEL : (target.model || ROUTER_MODEL);

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      signal: ctrl.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...(recentContext ? [{ role: "user", content: `Recent context: ${recentContext.slice(0, 400)}` }] : []),
          { role: "user", content: `Classify this message:\n"""${userText.slice(0, 800)}"""` },
        ],
        tools: [ROUTER_TOOL],
        tool_choice: { type: "function", function: { name: "route_request" } },
        stream: false,
      }),
    });
    clearTimeout(timer);

    if (!res.ok) return DEFAULT_DECISION;
    const data = await res.json();
    const tc = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!tc?.function?.arguments) return DEFAULT_DECISION;
    const parsed = JSON.parse(tc.function.arguments);
    return {
      intent: parsed.intent ?? DEFAULT_DECISION.intent,
      complexity: parsed.complexity ?? DEFAULT_DECISION.complexity,
      mood: parsed.mood ?? DEFAULT_DECISION.mood,
      language: parsed.language ?? "auto",
      dialect: parsed.dialect ?? "auto",
      persona: parsed.persona ?? "default",
      tools_needed: Array.isArray(parsed.tools_needed) ? parsed.tools_needed : [],
      needs_memory: !!parsed.needs_memory,
      needs_reasoning: !!parsed.needs_reasoning,
      needs_citations: !!parsed.needs_citations,
    };
  } catch (e) {
    console.warn("router failed", (e as Error).message);
    return DEFAULT_DECISION;
  }
}

// Build a tone/persona system prompt addition based on router decision + user settings
export function buildPersonaPrompt(
  decision: RouterDecision,
  userPreferredPersona?: string | null
): string {
  const persona = userPreferredPersona && userPreferredPersona !== "default"
    ? userPreferredPersona
    : decision.persona;

  const personaPrompts: Record<string, string> = {
    friend: "Speak like a close, casual friend. Use the user's slang, be warm, supportive, and brief.",
    teacher: "Explain step by step like a patient teacher. Use simple analogies, check understanding, and offer examples.",
    expert: "Reply with technical precision, named concepts, and concise structured explanations. No fluff.",
    comedian: "Be playful and witty. Add light humor and clever wordplay. Stay helpful underneath the jokes.",
    default: "",
  };

  const moodAdjustments: Record<string, string> = {
    frustrated: "The user sounds frustrated — be calm, empathetic, and solution-focused. Acknowledge their feeling first, then help.",
    urgent: "The user is in a hurry — give the answer first, details after.",
    sad: "The user sounds down — be warm and gentle, not clinical.",
    excited: "Match their energy with enthusiasm.",
    curious: "Encourage their curiosity with rich, interesting context.",
    happy: "Mirror their positive energy.",
    neutral: "",
  };

  const parts: string[] = [];
  if (personaPrompts[persona]) parts.push(`PERSONA: ${personaPrompts[persona]}`);
  if (moodAdjustments[decision.mood]) parts.push(`MOOD: ${moodAdjustments[decision.mood]}`);
  if (decision.dialect && decision.dialect !== "auto" && decision.dialect !== "none") {
    parts.push(`DIALECT LOCK: Reply in ${decision.dialect} dialect — match the user's exact register.`);
  }
  return parts.length ? `\n\n--- ROUTING ADJUSTMENTS ---\n${parts.join("\n")}\n` : "";
}
