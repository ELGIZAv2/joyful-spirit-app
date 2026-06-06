import { describe, it, expect } from "vitest";
import { detectLanguage } from "./detectLanguage";

describe("detectLanguage", () => {
  const cases: Array<[string, string]> = [
    ["مرحبا", "ar"],
    ["你好", "zh"],
    ["こんにちは", "ja"],
    ["안녕하세요", "ko"],
    ["Привет", "ru"],
    ["שלום", "he"],
    ["สวัสดี", "th"],
    ["Bonjour le monde", "fr"],
    ["Hola amigo gracias", "es"],
    ["Hello world", "en"],
  ];
  for (const [text, expected] of cases) {
    it(`detects "${text}" as ${expected}`, () => {
      expect(detectLanguage(text)).toBe(expected);
    });
  }
});
