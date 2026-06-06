// Clean solid-filled settings icons — bold, monochrome, no outlines.
// 24x24 viewBox, fill currentColor. Designed for a confident black silhouette.
import { type SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "currentColor",
  xmlns: "http://www.w3.org/2000/svg",
};

// Account — minimal ID card with avatar dot
export const AccountIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="2.5" y="5" width="19" height="14" rx="2.4" opacity="0.18" />
    <rect x="2.5" y="5" width="19" height="14" rx="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="8.5" cy="11" r="2.2" />
    <path d="M5 16.2c0-1.7 1.6-2.8 3.5-2.8s3.5 1.1 3.5 2.8" />
    <path d="M14 10h4.5M14 12.5h4.5M14 15h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

// Workspaces — three stacked solid plates
export const WorkspacesIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="4.5" width="17" height="4.2" rx="1.4" />
    <rect x="5.5" y="10.2" width="13" height="3.6" rx="1.2" opacity="0.7" />
    <rect x="7.5" y="15.3" width="9" height="3.2" rx="1" opacity="0.45" />
  </svg>
);

// Billing — solid card
export const BillingIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5V9H3V7.5zM3 11h18v5.5A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5V11zm11 4.5h3.5v1.2H14v-1.2z" />
  </svg>
);

// Theme — artist's pen / brush tip
export const ThemeIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M16.5 3.6a2.4 2.4 0 0 1 3.4 3.4l-9.2 9.2-4.2 1 1-4.2z" />
    <path d="M5 18.5l1.5-1.5 1.5 1.5-1.5 1.5z" opacity="0.65" />
    <path d="M14 6l4 4" stroke="#fff" strokeWidth="0.9" opacity="0.65" fill="none" />
  </svg>
);

// AI Personalization — dual spark
export const AiPersonalizationIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M10 2.5l1.3 4.6 4.6 1.3-4.6 1.3L10 14.3 8.7 9.7 4.1 8.4l4.6-1.3z" />
    <path d="M17 13l.9 2.7 2.7.9-2.7.9-.9 2.7-.9-2.7-2.7-.9 2.7-.9z" opacity="0.55" />
  </svg>
);

// Integrations — two interlocked rounded squares
export const IntegrationsIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3" y="3" width="9" height="9" rx="2.2" />
    <rect x="12" y="12" width="9" height="9" rx="2.2" />
    <rect x="12" y="3" width="9" height="9" rx="2.2" opacity="0.45" />
    <rect x="3" y="12" width="9" height="9" rx="2.2" opacity="0.45" />
  </svg>
);

// Memory — brain hemispheres
export const MemoryIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M11.4 4.2a3.2 3.2 0 0 0-5.4 2.1A3 3 0 0 0 4 9.2a2.8 2.8 0 0 0 .7 1.9A2.8 2.8 0 0 0 4 13a2.9 2.9 0 0 0 1.6 2.6A3 3 0 0 0 8 19.8a3.1 3.1 0 0 0 3.4-2.2z" />
    <path d="M12.6 4.2a3.2 3.2 0 0 1 5.4 2.1A3 3 0 0 1 20 9.2a2.8 2.8 0 0 1-.7 1.9A2.8 2.8 0 0 1 20 13a2.9 2.9 0 0 1-1.6 2.6A3 3 0 0 1 16 19.8a3.1 3.1 0 0 1-3.4-2.2z" opacity="0.55" />
    <path d="M12 4v16" stroke="#fff" strokeWidth="0.7" opacity="0.6" fill="none" />
  </svg>
);

// Support — life ring
export const SupportIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" opacity="0.2" />
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="3.4" fill="#fff" />
    <circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M9.7 9.7L6 6M14.3 9.7L18 6M9.7 14.3L6 18M14.3 14.3L18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

// FAQ / guides — book with bookmark
export const FAQIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H18a2 2 0 0 1 2 2v14a1 1 0 0 1-1.5.9L17 19l-1.5.9A1 1 0 0 1 14 19V5H5.5A1.5 1.5 0 0 1 4 4.5z" opacity="0.25" />
    <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H14v16.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 4 19.5z" />
    <path d="M7 8h4M7 11h4M7 14h3" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" fill="none" />
  </svg>
);

// Human support — headset operator
export const HumanSupportIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 13.5v-1A7 7 0 0 1 19 12.5v1" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <rect x="3.5" y="13" width="4" height="6" rx="1.5" />
    <rect x="16.5" y="13" width="4" height="6" rx="1.5" />
    <path d="M16.5 17h-1.2a3 3 0 0 1-3 3H11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="10" cy="20.2" r="1" />
  </svg>
);

// AI support — chat bubble with spark
export const AISupportIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3.5 6.5A2.5 2.5 0 0 1 6 4h12a2.5 2.5 0 0 1 2.5 2.5v8A2.5 2.5 0 0 1 18 17h-4l-4 3.5V17H6a2.5 2.5 0 0 1-2.5-2.5z" />
    <path d="M12 7.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" fill="#fff" />
  </svg>
);

// Privacy — shield with lock
export const PrivacyIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 2.5l8 3v5.8c0 4.6-3.2 8.4-8 10.2-4.8-1.8-8-5.6-8-10.2V5.5z" />
    <rect x="9.5" y="10.5" width="5" height="4.5" rx="0.8" fill="#fff" />
    <path d="M10.5 10.5v-1.2a1.5 1.5 0 0 1 3 0v1.2" fill="none" stroke="#fff" strokeWidth="1.2" />
  </svg>
);

// Skills — 4-point star (solid)
export const SkillsIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 2.5l1.9 7.6 7.6 1.9-7.6 1.9-1.9 7.6-1.9-7.6-7.6-1.9 7.6-1.9z" />
  </svg>
);

// Language — speech bubble with translate marks
export const LanguageIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h9A1.5 1.5 0 0 1 15 5.5v6A1.5 1.5 0 0 1 13.5 13H9l-3.2 2.7c-.5.4-1.3.1-1.3-.6V13H4.5A1.5 1.5 0 0 1 3 11.5v-6z" />
    <path d="M14.5 9.5h5A1.5 1.5 0 0 1 21 11v6a1.5 1.5 0 0 1-1.5 1.5H19v2c0 .7-.8 1-1.3.6L14.5 18.5h-3a1.5 1.5 0 0 1-1.5-1.5v-2.4a3 3 0 0 0 2-.6h3a3 3 0 0 0 3-3z" opacity="0.45" />
    <path d="M6 7.5h6v1.2H6zM6 9.7h4.5v1.2H6z" fill="#fff" opacity="0.9" />
  </svg>
);

// Notifications — bell (solid)
export const NotificationsIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3a1.2 1.2 0 0 0-1.2 1.2v.5c-2.7.6-4.6 3-4.6 5.8v3.2L4.8 15.4c-.6.6-.2 1.6.7 1.6h13c.9 0 1.3-1 .7-1.6L17.8 13.7v-3.2c0-2.8-1.9-5.2-4.6-5.8v-.5A1.2 1.2 0 0 0 12 3z" />
    <path d="M10 18.5a2 2 0 0 0 4 0z" />
  </svg>
);

// APIs — angle brackets / code
export const ApiIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M8.7 6.3L3 12l5.7 5.7 1.5-1.5L6 12l4.2-4.2zM15.3 6.3l-1.5 1.5L18 12l-4.2 4.2 1.5 1.5L21 12z" />
  </svg>
);

// System Status — radiating signal
export const StatusIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="2.4" />
    <path d="M8.5 15.5a5 5 0 0 1 0-7l-1.4-1.4a7 7 0 0 0 0 9.8zM15.5 8.5a5 5 0 0 1 0 7l1.4 1.4a7 7 0 0 0 0-9.8z" opacity="0.7" />
    <path d="M5.6 18.4a9 9 0 0 1 0-12.8L4.2 4.2a11 11 0 0 0 0 15.6zM18.4 5.6a9 9 0 0 1 0 12.8l1.4 1.4a11 11 0 0 0 0-15.6z" opacity="0.4" />
  </svg>
);

// Help — circle with ?
export const HelpIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 13.3a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2zm0-9.6c1.9 0 3.4 1.3 3.4 3.1 0 1.3-.7 1.9-1.5 2.5-.7.5-1.1.8-1.1 1.6v.5h-1.6v-.7c0-1.4.7-2 1.5-2.5.7-.5 1.1-.8 1.1-1.4 0-.8-.7-1.4-1.8-1.4-1 0-1.8.6-1.9 1.5H8.6c.1-1.9 1.6-3.2 3.4-3.2z" />
  </svg>
);

// Sign out — door with arrow
export const SignOutIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3h6A1.5 1.5 0 0 1 14 4.5V6h-1.6V4.6H6.6v14.8h5.8V18H14v1.5a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 5 19.5v-15z" />
    <path d="M16.3 8.3l-1.1 1.1 1.8 1.8H9v1.6h8l-1.8 1.8 1.1 1.1L20 12z" />
  </svg>
);

// Gift — parcel
export const GiftIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3.5 10h7.7v3.6H3.5zM12.8 10h7.7v3.6h-7.7zM4.5 14.6h6.7v6H6a1.5 1.5 0 0 1-1.5-1.5v-4.5zM12.8 14.6h6.7v4.5a1.5 1.5 0 0 1-1.5 1.5h-5.2v-6z" />
    <path d="M12 3.5c-1.6 0-2.9 1.3-2.9 2.9 0 .6.2 1.2.5 1.6H7a1.5 1.5 0 0 0 0 3h10a1.5 1.5 0 0 0 0-3h-2.6c.3-.4.5-1 .5-1.6 0-1.6-1.3-2.9-2.9-2.9zm-1.5 2.9c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5-.7 1.5-1.5 1.5-1.5-.7-1.5-1.5z" />
  </svg>
);

// Switch account — opposing arrows
export const SwitchIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M7 4l-4 4 4 4V9h13V7H7zM17 12l4 4-4 4v-3H4v-2h13z" />
  </svg>
);

// Chevron
export const ChevronIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M9.3 5.7l6.3 6.3-6.3 6.3-1.2-1.2 5.1-5.1-5.1-5.1z" />
  </svg>
);

// Back arrow
export const BackIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M14.7 5.7l-6.3 6.3 6.3 6.3 1.2-1.2-5.1-5.1 5.1-5.1z" />
  </svg>
);

// Sparkle
export const SparkleIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6z" />
    <path d="M18 14l.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7z" opacity="0.6" />
  </svg>
);
