/**
 * Detects whether the current viewport is mobile-sized.
 * Used by composers to decide whether the keyboard's Enter key
 * should send a message (desktop) or insert a newline (mobile).
 */
export const isMobileViewport = (): boolean =>
  typeof window !== "undefined" && window.innerWidth < 768;

/**
 * Returns true when the keyboard's Enter press should submit/send
 * in a chat composer textarea.
 * - Desktop (>=768px): Enter without Shift → send
 * - Mobile (<768px):   Enter inserts a newline (returns false)
 * Also respects IME composition state.
 */
export const isSendKey = (
  e: { key: string; shiftKey: boolean; nativeEvent?: { isComposing?: boolean } }
): boolean => {
  if (e.key !== "Enter") return false;
  if (e.shiftKey) return false;
  if (e.nativeEvent?.isComposing) return false;
  return !isMobileViewport();
};
