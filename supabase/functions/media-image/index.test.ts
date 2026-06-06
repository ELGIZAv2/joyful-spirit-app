import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  extractLeonardoGenerationId,
  LEONARDO_V2_PROMPT_MAX_LENGTH,
  normalizeLeonardoPrompt,
} from "../_shared/providers/leonardo.ts";

Deno.test("media-image: extracts generation id from Leonardo generate response", () => {
  const generationId = extractLeonardoGenerationId({
    generate: {
      apiCreditCost: null,
      generationId: "1f15abf6-9f12-6220-9869-cb61a6d048c7",
      cost: { amount: "0.0389", unit: "DOLLARS" },
    },
  });

  assertEquals(generationId, "1f15abf6-9f12-6220-9869-cb61a6d048c7");
});

Deno.test("media-image: still extracts legacy Leonardo response ids", () => {
  assertEquals(
    extractLeonardoGenerationId({ sdGenerationJob: { generationId: "legacy-id" } }),
    "legacy-id",
  );
});

Deno.test("media-image: trims Leonardo v2 prompts to provider max length", () => {
  const longPrompt = "x".repeat(LEONARDO_V2_PROMPT_MAX_LENGTH + 250);
  const normalized = normalizeLeonardoPrompt(longPrompt);

  assertEquals(normalized.length, LEONARDO_V2_PROMPT_MAX_LENGTH);
});