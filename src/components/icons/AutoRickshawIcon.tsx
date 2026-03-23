import React from "react";

interface AutoRickshawIconProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Custom Indian Auto Rickshaw (Tuk-Tuk) icon — side profile view.
 * Designed to match the visual style of Phosphor & Material icon sets.
 */
const AutoRickshawIcon: React.FC<AutoRickshawIconProps> = ({ className, style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-label="Auto Rickshaw"
  >
    {/* ── Cabin / Hood ── */}
    <path d="M8 28 L8 18 Q8 14 12 13 L24 11 Q28 10 30 13 L34 20 L34 28 Z" />

    {/* ── Windshield opening ── */}
    <path d="M12 18 L12 14 Q12 13 13.5 12.5 L22 11.5 L22 18 Z" fill="currentColor" fillOpacity="0.15" strokeWidth="2" />

    {/* ── Passenger side opening ── */}
    <path d="M23 18 L23 11.8 L28 12.8 Q30 13.5 31 15 L31 18 Z" fill="currentColor" fillOpacity="0.15" strokeWidth="2" />

    {/* ── Roof rack line ── */}
    <line x1="8" y1="18" x2="34" y2="18" strokeWidth="2" />

    {/* ── Cargo / rear body ── */}
    <rect x="8" y="28" width="26" height="6" rx="1" />

    {/* ── Front mudguard / nose ── */}
    <path d="M8 28 Q5 28 4 32 L4 34 L8 34" />

    {/* ── Rear fender ── */}
    <path d="M34 28 L38 28 Q40 28 40 32 L40 34 L34 34" />

    {/* ── Chassis bottom line ── */}
    <line x1="4" y1="34" x2="40" y2="34" strokeWidth="2" />

    {/* ── Front wheel ── */}
    <circle cx="11" cy="37" r="4" strokeWidth="2.5" />
    <circle cx="11" cy="37" r="1.5" fill="currentColor" />

    {/* ── Rear wheel ── */}
    <circle cx="35" cy="37" r="4" strokeWidth="2.5" />
    <circle cx="35" cy="37" r="1.5" fill="currentColor" />

    {/* ── Handlebar ── */}
    <path d="M5 24 L4 22 L7 21" strokeWidth="2" />

    {/* ── Headlight ── */}
    <circle cx="5" cy="26" r="1.5" strokeWidth="2" />

    {/* ── Exhaust ── */}
    <path d="M40 32 L43 33 L43 34" strokeWidth="2" />
  </svg>
);

export default AutoRickshawIcon;
