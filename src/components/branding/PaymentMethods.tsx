import wechatPayLogo from "@/assets/brands/wechat-pay.png";

type Method = { name: string; src: string };

const ROWS: Method[][] = [
  [
    { name: "Apple Pay",  src: "https://cdn.jsdelivr.net/gh/gilbarbara/logos/logos/apple-pay.svg" },
    { name: "Google Pay", src: "https://cdn.jsdelivr.net/gh/gilbarbara/logos/logos/google-pay.svg" },
    { name: "Amazon Pay", src: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/amazonpay.svg" },
  ],
  [
    { name: "Visa",             src: "https://cdn.jsdelivr.net/gh/gilbarbara/logos/logos/visa.svg" },
    { name: "Mastercard",       src: "https://cdn.jsdelivr.net/gh/gilbarbara/logos/logos/mastercard.svg" },
    { name: "American Express", src: "https://cdn.jsdelivr.net/gh/gilbarbara/logos/logos/amex.svg" },
  ],
  [
    { name: "UnionPay",  src: "https://cdn.jsdelivr.net/gh/gilbarbara/logos/logos/unionpay.svg" },
    { name: "WeChat Pay", src: wechatPayLogo },
    { name: "JCB",       src: "https://cdn.jsdelivr.net/gh/gilbarbara/logos/logos/jcb.svg" },
  ],
];

type Variant = "light" | "dark";

const Card = ({ method, variant }: { method: Method; variant: Variant }) => {
  const isMono = method.name === "Amazon Pay";
  return (
    <div
      title={method.name}
      className={`h-11 w-[68px] sm:h-12 sm:w-[76px] rounded-xl flex items-center justify-center px-2.5 transition-all duration-300 hover:-translate-y-0.5 ${
        variant === "dark"
          ? "bg-white ring-1 ring-white/10 shadow-[0_4px_14px_-4px_rgba(0,0,0,0.6)] hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.8)]"
          : "bg-white ring-1 ring-black/5 shadow-sm hover:shadow-md"
      }`}
    >
      <img
        src={method.src}
        alt={method.name}
        loading="lazy"
        className={`max-h-6 max-w-full object-contain ${isMono ? "opacity-90" : ""}`}
      />
    </div>
  );
};

export const PaymentMethods = ({ variant = "light" }: { variant?: Variant }) => (
  <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
    {ROWS.map((row, i) => (
      <div
        key={i}
        className={`flex items-center gap-1.5 sm:gap-2 rounded-2xl px-2 py-1.5 ${
          variant === "dark"
            ? "bg-white/[0.03] ring-1 ring-white/[0.06]"
            : "bg-muted/40 ring-1 ring-border/60"
        }`}
      >
        {row.map((m) => (
          <Card key={m.name} method={m} variant={variant} />
        ))}
      </div>
    ))}
  </div>
);

export default PaymentMethods;
