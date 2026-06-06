import dodoLight from "@/assets/brands/dodo-payments.svg";
import dodoDark from "@/assets/brands/dodo-payments-dark.svg";

type Variant = "light" | "dark";
type Size = "sm" | "md";

/**
 * Real Dodo Payments wordmark (downloaded from dodopayments.com/logo).
 * Brand signature: chartreuse green mark (#C6FE1E) + dark wordmark.
 */
export const DodoPaymentsBadge = ({
  variant = "light",
  size = "md",
  className = "",
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
}) => {
  const dark = variant === "dark";
  const sm = size === "sm";

  return (
    <a
      href="https://dodopayments.com"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Dodo Payments"
      className={`inline-flex items-center gap-2.5 rounded-full transition-colors ${
        sm ? "px-3 py-1.5 text-[11px]" : "px-3.5 py-2 text-[12px]"
      } ${
        dark
          ? "bg-white/[0.04] ring-1 ring-white/10 text-white/70 hover:text-white hover:bg-white/[0.07]"
          : "bg-white ring-1 ring-black/[0.06] text-foreground/70 hover:text-foreground shadow-sm hover:shadow"
      } ${className}`}
    >
      <img
        src={dark ? dodoDark : dodoLight}
        alt="Dodo Payments"
        loading="lazy"
        className={sm ? "h-[16px] w-auto" : "h-[18px] w-auto"}
      />
    </a>
  );
};

export default DodoPaymentsBadge;
