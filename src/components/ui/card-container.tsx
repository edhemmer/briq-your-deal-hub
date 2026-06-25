import { cn } from "@/lib/utils";

interface CardContainerProps {
  children: React.ReactNode;
  className?: string;
}

const CardContainer = ({ children, className }: CardContainerProps) => {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/80 bg-card/95 p-6 shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_12px_32px_-28px_rgb(59_130_246/0.45)]",
        className
      )}
    >
      {children}
    </div>
  );
};

export { CardContainer };
