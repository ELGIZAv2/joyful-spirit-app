// Modern duotone nav icons — filled accent + crisp stroke.
// Designed in-house with iOS 26 / Krea-inspired soft geometry.

type Props = { className?: string; strokeWidth?: number; active?: boolean };

const base = (className?: string) => `inline-block ${className || ""}`;

/* Home — rounded squircle house with filled door */
export const NavHomeIcon = ({ className, strokeWidth = 1.8, active }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)}>
    <path
      d="M3.6 10.4 11 3.8a1.5 1.5 0 0 1 2 0l7.4 6.6c.38.34.6.83.6 1.34V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7.26c0-.51.22-1 .6-1.34Z"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      fill={active ? "currentColor" : "none"}
      fillOpacity={active ? 0.18 : 0}
    />
    <path
      d="M9.5 21v-5a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v5"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={active ? "currentColor" : "none"}
    />
  </svg>
);

/* Studio — 4-point sparkle star (modern AI mark) */
export const NavStudioIcon = ({ className, strokeWidth = 1.8, active }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)}>
    <path
      d="M12 3c.4 3.4 2.2 5.2 5.6 5.6-3.4.4-5.2 2.2-5.6 5.6-.4-3.4-2.2-5.2-5.6-5.6C9.8 8.2 11.6 6.4 12 3Z"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      fill={active ? "currentColor" : "none"}
      fillOpacity={active ? 0.22 : 0}
    />
    <path
      d="M18.5 14c.2 1.7 1.1 2.6 2.8 2.8-1.7.2-2.6 1.1-2.8 2.8-.2-1.7-1.1-2.6-2.8-2.8 1.7-.2 2.6-1.1 2.8-2.8Z"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity={active ? 0.9 : 0.5}
    />
  </svg>
);

/* Discover — soft squircle compass with diamond needle */
export const NavDiscoverIcon = ({ className, strokeWidth = 1.8, active }: Props) => (
  <svg viewBox="0 0 24 24" fill="none" className={base(className)}>
    <path
      d="M12 3c5 0 9 4 9 9s-4 9-9 9-9-4-9-9 4-9 9-9Z"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      fill={active ? "currentColor" : "none"}
      fillOpacity={active ? 0.16 : 0}
    />
    <path
      d="m15.5 8.5-2 5-5 2 2-5 5-2Z"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity={active ? 0.95 : 0.55}
    />
  </svg>
);
