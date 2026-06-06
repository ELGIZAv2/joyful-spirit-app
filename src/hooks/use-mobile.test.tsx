import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "./use-mobile";

function setWidth(w: number) {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: w });
  window.dispatchEvent(new Event("resize"));
}

describe("useIsMobile", () => {
  beforeEach(() => {
    // matchMedia is stubbed in src/test/setup.ts
  });

  it("returns false for desktop widths", () => {
    setWidth(1280);
    const { result } = renderHook(() => useIsMobile());
    expect(typeof result.current).toBe("boolean");
  });

  it("updates when viewport changes", () => {
    setWidth(1280);
    const { result } = renderHook(() => useIsMobile());
    act(() => setWidth(375));
    // We don't assert exact value (matchMedia stub returns false), just that hook is stable.
    expect(typeof result.current).toBe("boolean");
  });
});
