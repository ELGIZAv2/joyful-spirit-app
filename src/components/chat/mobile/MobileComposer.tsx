import { useEffect, useRef } from "react";
import { Plus, ArrowUp, Square, Mic } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onCancel?: () => void;
  onPlus?: () => void;
  onMic?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * Luma neutral mobile composer.
 * Single rounded surface: [+]  textarea  [send]
 */
export default function MobileComposer({
  value,
  onChange,
  onSend,
  onCancel,
  onPlus,
  onMic,
  disabled,
  isLoading,
  placeholder = "Ask anything…",
  autoFocus,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // auto-grow
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [value]);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div
      data-testid="mobile-composer"
      className="md:hidden luma-card flex items-end gap-2 px-2 py-2"
      style={{
        borderRadius: "1.5rem",
        border: "2.5px solid hsl(var(--foreground) / 0.5)",
        boxShadow: "none",
      }}
    >
      <button
        type="button"
        aria-label="Attach"
        data-testid="mobile-composer-plus"
        onClick={onPlus}
        className="luma-icon-btn shrink-0"
        style={{ height: "2.25rem", width: "2.25rem" }}
      >
        <Plus className="w-5 h-5" />
      </button>

      <textarea
        ref={ref}
        value={value}
        data-testid="mobile-composer-input"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          // Mobile composer: Enter inserts a newline by default (no send).
          // Send happens only via the send button.
        }}
        placeholder={placeholder}
        rows={1}
        className="flex-1 resize-none bg-transparent border-0 outline-none text-[15px] leading-6 px-2 py-2 max-h-40"
        style={{ color: "hsl(var(--luma-ink))" }}
      />

      {!value.trim() && onMic ? (
        <button
          type="button"
          aria-label="Voice input"
          data-testid="mobile-composer-mic"
          onClick={onMic}
          className="luma-icon-btn shrink-0"
          style={{ height: "2.25rem", width: "2.25rem" }}
        >
          <Mic className="w-5 h-5" />
        </button>
      ) : isLoading ? (
        <button
          type="button"
          aria-label="Stop"
          data-testid="mobile-composer-stop"
          onClick={onCancel}
          className="luma-cta-icon shrink-0"
          style={{ height: "2.25rem", width: "2.25rem" }}
        >
          <Square className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          aria-label="Send message"
          data-testid="mobile-composer-send"
          onClick={onSend}
          disabled={!canSend}
          className="luma-cta-icon shrink-0"
          style={{ height: "2.25rem", width: "2.25rem" }}
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
