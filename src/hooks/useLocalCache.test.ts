import { describe, it, expect, beforeEach, vi } from "vitest";
import { getCache, setCache, clearCache } from "./useLocalCache";

describe("useLocalCache", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips a value", () => {
    setCache("k", { a: 1 });
    expect(getCache<{ a: number }>("k")).toEqual({ a: 1 });
  });

  it("returns null for missing keys", () => {
    expect(getCache("nope")).toBeNull();
  });

  it("expires after ttl", () => {
    vi.useFakeTimers();
    setCache("k", "v", 1000);
    vi.advanceTimersByTime(2000);
    expect(getCache("k")).toBeNull();
    vi.useRealTimers();
  });

  it("clearCache removes the entry", () => {
    setCache("k", "v");
    clearCache("k");
    expect(getCache("k")).toBeNull();
  });

  it("tolerates malformed payloads", () => {
    localStorage.setItem("megsy_cache_bad", "{not json");
    expect(getCache("bad")).toBeNull();
  });
});
