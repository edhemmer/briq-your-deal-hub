import briqIcon from "@/assets/briq-icon.png";

interface BriqIconProps {
  size?: number;
  className?: string;
}

const BriqIcon = ({ size = 28, className = "" }: BriqIconProps) => {
  return (
    <img
      src={briqIcon}
      alt="BRIQ"
      width={size}
      height={size}
      className={className}
    />
  );
};

export default BriqIcon;
