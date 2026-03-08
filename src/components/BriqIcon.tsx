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
      {/* 2x2 brick grid */}
      <rect x="4" y="14" width="14" height="10" rx="2" fill="currentColor" opacity="0.85" />
      <rect x="22" y="14" width="14" height="10" rx="2" fill="currentColor" opacity="0.85" />
      <rect x="4" y="28" width="14" height="10" rx="2" fill="currentColor" opacity="0.6" />
      <rect x="22" y="28" width="14" height="10" rx="2" fill="currentColor" opacity="0.6" />
      {/* Rising insight element */}
      <rect x="30" y="4" width="6" height="20" rx="3" fill="currentColor" opacity="1" />
    </svg>
  );
};

export default BriqIcon;
