import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  GlassSheet,
  GlassSheetContent,
  GlassSheetHeader,
  GlassSheetTitle,
  GlassSheetDescription,
} from "@/components/ui/glass-sheet";
import { cn } from "@/lib/utils";

/**
 * ResponsiveDialog — single API that renders a centered Dialog on desktop
 * and a vaul-based GlassSheet on mobile.
 *
 * Use the *Title and *Description re-exports below so the same JSX works in
 * both contexts.
 */

interface RootProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function ResponsiveDialog({ open, onOpenChange, children }: RootProps) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <GlassSheet open={open} onOpenChange={onOpenChange}>
        {children}
      </GlassSheet>
    );
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
}

interface ContentProps {
  children: React.ReactNode;
  className?: string;
  /** Extra className for desktop Dialog only */
  desktopClassName?: string;
}

export function ResponsiveDialogContent({
  children,
  className,
  desktopClassName,
}: ContentProps) {
  const isMobile = useIsMobile();
  if (isMobile) {
    // Intentionally do NOT forward className on mobile — most callers pass
    // desktop-centric sizing classes (max-w-*, rounded-2xl, …) that conflict
    // with the bottom-sheet layout.
    return (
      <GlassSheetContent
        className="md:!left-1/2 md:!right-auto md:!bottom-auto md:!top-1/2 md:!w-[calc(100vw-2rem)] md:!max-w-[420px] md:!-translate-x-1/2 md:!-translate-y-1/2 md:!rounded-2xl md:!border md:!border-border/30 md:!shadow-2xl"
        contentClassName="px-0 pt-0 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]"
      >
        {children}
      </GlassSheetContent>
    );
  }
  return (
    <DialogContent
      className={cn(
        "max-w-[calc(100vw-2rem)] sm:max-w-[420px] p-0 gap-0 overflow-hidden rounded-2xl liquid-glass border border-border/30 text-foreground",
        className,
        desktopClassName,
      )}
    >
      {children}
    </DialogContent>
  );
}

export function ResponsiveDialogHeader(
  props: React.HTMLAttributes<HTMLDivElement>,
) {
  const isMobile = useIsMobile();
  if (isMobile) return <GlassSheetHeader {...props} />;
  return <DialogHeader {...props} />;
}

export function ResponsiveDialogTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return <GlassSheetTitle className={className}>{children}</GlassSheetTitle>;
  }
  return (
    <DialogTitle
      className={cn(
        "text-base font-semibold text-foreground tracking-tight text-left",
        className,
      )}
    >
      {children}
    </DialogTitle>
  );
}

export function ResponsiveDialogDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <GlassSheetDescription className={className}>
        {children}
      </GlassSheetDescription>
    );
  }
  return (
    <DialogDescription
      className={cn("text-xs text-muted-foreground text-left mt-0.5", className)}
    >
      {children}
    </DialogDescription>
  );
}
