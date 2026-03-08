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
      {/* Top row - two bricks */}
      <rect x="2" y="4" width="17" height="12" rx="2" fill="currentColor" opacity="0.7" />
      <rect x="21" y="4" width="17" height="12" rx="2" fill="currentColor" opacity="0.7" />
      {/* Bottom row - offset masonry */}
      <rect x="2" y="20" width="12" height="12" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="16" y="20" width="12" height="12" rx="2" fill="currentColor" opacity="0.5" />
      {/* Insight element - rising brick */}
      <rect x="30" y="20" width="8" height="18" rx="2" className="fill-[hsl(var(--briq-accent))]" opacity="0.9" />
    </svg>
  );
};

export default BriqIcon;
