import { describe, it, expect } from "vitest";
import { detectLang, langDir } from "./detectLang";

describe("detectLang", () => {
  it("detects Arabic", () => {
    expect(detectLang("مرحبا يا عالم")).toBe("ar");
  });
  it("detects English / Latin", () => {
    expect(detectLang("Hello world")).toBe("en");
  });
  it("detects other scripts (CJK)", () => {
    expect(detectLang("你好世界")).toBe("other");
  });
  it("defaults to en for empty / punctuation-only", () => {
    expect(detectLang("")).toBe("en");
    expect(detectLang("123 !!!")).toBe("en");
  });
});

describe("langDir", () => {
  it("returns rtl only for Arabic", () => {
    expect(langDir("ar")).toBe("rtl");
    expect(langDir("en")).toBe("ltr");
    expect(langDir("other")).toBe("ltr");
  });
});
