import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Premium toast — floating glass card, theme-aware, with crisp colored icons.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      offset={"max(16px, env(safe-area-inset-top))" as unknown as number}
      duration={3200}
      visibleToasts={3}
      gap={10}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: [
            "group toast pointer-events-auto",
            "flex items-start gap-3 w-full",
            "px-4 py-3",
            "rounded-2xl",
            "bg-popover/90 backdrop-blur-2xl backdrop-saturate-150",
            "border border-border/60",
            "shadow-[0_10px_40px_-12px_hsl(var(--foreground)/0.22),0_2px_6px_-2px_hsl(var(--foreground)/0.08)]",
            "text-popover-foreground",
            "antialiased",
          ].join(" "),
          title: "text-[14px] font-semibold leading-snug tracking-[-0.01em]",
          description:
            "text-[13px] font-normal leading-snug text-muted-foreground mt-0.5",
          icon: "shrink-0 mt-0.5 [&_svg]:w-[18px] [&_svg]:h-[18px]",
          actionButton:
            "!bg-primary !text-primary-foreground rounded-full px-3 py-1.5 text-[12.5px] font-semibold hover:!bg-primary/90 transition",
          cancelButton:
            "!bg-muted !text-muted-foreground rounded-full px-3 py-1.5 text-[12.5px] font-medium hover:!bg-muted/70 transition",
          closeButton:
            "!bg-muted/60 hover:!bg-muted !text-foreground !border-transparent",
          success: "[&>[data-icon]]:text-emerald-500",
          error: "[&>[data-icon]]:text-rose-500",
          info: "[&>[data-icon]]:text-sky-500",
          warning: "[&>[data-icon]]:text-amber-500",
          loading: "[&>[data-icon]]:text-muted-foreground",
        },
      }}
      style={
        {
          "--width": "380px",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster, toast };
