// Megsy OS icon — minimal monochrome SVG (currentColor)
// Monitor frame with an inner AI spark/star — flat, single-stroke, black & white.
import { type SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { size?: number | string };

export const MegsyComputerIcon = ({ size = 24, strokeWidth = 1.6, className, ...rest }: Props) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
    {...rest}
  >
    {/* monitor frame */}
    <rect x="2.5" y="3.5" width="19" height="13" rx="2.4" />
    {/* stand */}
    <path d="M9.5 20h5" />
    <path d="M12 16.5V20" />
    {/* AI spark inside the screen */}
    <path d="M12 7.2v2.1M12 13.7v2.1M7.9 11.5h2.1M14 11.5h2.1M9.4 8.9l1.4 1.4M13.2 12.7l1.4 1.4M9.4 14.1l1.4-1.4M13.2 10.3l1.4-1.4" />
    <circle cx="12" cy="11.5" r="1.05" fill="currentColor" stroke="none" />
  </svg>
);

export default MegsyComputerIcon;
