import { ButtonHTMLAttributes, CSSProperties, forwardRef } from "react";

type GlowVariant = "starter" | "pro" | "elite" | "business" | "enterprise" | "gold";

// Each gradient has a single bright highlight band so rotation is clearly visible.
const VARIANT_GRADIENTS: Record<GlowVariant, string> = {
  starter:
    "conic-gradient(from var(--glow-angle), #166534 0deg, #22C55E 60deg, #BBF7D0 90deg, #22C55E 120deg, #166534 200deg, #166534 360deg)",
  pro:
    "conic-gradient(from var(--glow-angle), #1E3A8A 0deg, #3B82F6 60deg, #DBEAFE 90deg, #3B82F6 120deg, #1E3A8A 200deg, #1E3A8A 360deg)",
  elite:
    "conic-gradient(from var(--glow-angle), #4C1D95 0deg, #A855F7 60deg, #FDE68A 90deg, #A855F7 120deg, #4C1D95 200deg, #4C1D95 360deg)",
  business:
    "conic-gradient(from var(--glow-angle), #78350F 0deg, #F59E0B 60deg, #FEF3C7 90deg, #F59E0B 120deg, #78350F 200deg, #78350F 360deg)",
  enterprise:
    "conic-gradient(from var(--glow-angle), #1f2937 0deg, #C0C0C0 60deg, #FFFFFF 90deg, #C0C0C0 120deg, #1f2937 200deg, #1f2937 360deg)",
  gold:
    "conic-gradient(from var(--glow-angle), #78350F 0deg, #FFD700 60deg, #FFF7C2 90deg, #FFD700 120deg, #78350F 200deg, #78350F 360deg)",
};

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GlowVariant;
  /** Tailwind sizing/padding overrides */
  className?: string;
  /** Inner background; default #0A0A0A */
  innerBg?: string;
}

const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
  (
    {
      variant = "gold",
      className = "",
      innerBg = "#0A0A0A",
      children,
      style,
      ...rest
    },
    ref,
  ) => {
    const cssVars: CSSProperties = {
      // @ts-expect-error CSS custom props
      "--glow-gradient": VARIANT_GRADIENTS[variant],
      "--glow-inner": innerBg,
      ...style,
    };
    return (
      <button
        ref={ref}
        {...rest}
        style={cssVars}
        className={`glow-btn ${className}`}
      >
        <span className="relative z-10 inline-flex items-center justify-center gap-2">
          {children}
        </span>
      </button>
    );
  },
);
GlowButton.displayName = "GlowButton";

export default GlowButton;
