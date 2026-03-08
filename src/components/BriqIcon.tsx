interface BriqIconProps {
  size?: number;
  className?: string;
}

const BriqIcon = ({ size = 28, className = "" }: BriqIconProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Row 1 - two bricks */}
      <rect x="2" y="4" width="18" height="9" rx="1.5" fill="currentColor" opacity="0.85" />
      <rect x="22" y="4" width="16" height="9" rx="1.5" fill="currentColor" opacity="0.7" />
      {/* Row 2 - staggered three bricks */}
      <rect x="2" y="15" width="10" height="9" rx="1.5" fill="currentColor" opacity="0.6" />
      <rect x="14" y="15" width="16" height="9" rx="1.5" fill="currentColor" opacity="0.8" />
      <rect x="32" y="15" width="6" height="9" rx="1.5" fill="currentColor" opacity="0.55" />
      {/* Row 3 - two bricks, last one glows as the "insight" brick */}
      <rect x="2" y="26" width="14" height="9" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="18" y="26" width="20" height="9" rx="1.5" fill="currentColor" opacity="0.95" />
      {/* Subtle IQ pulse - small dot in corner of insight brick */}
      <circle cx="34" cy="30" r="2" fill="currentColor" opacity="0.3" />
      <circle cx="34" cy="30" r="1" fill="white" opacity="0.9" />
    </svg>
  );
};

export default BriqIcon;
