import { cn } from "@/lib/utils";

interface CardContainerProps {
  children: React.ReactNode;
  className?: string;
}

const CardContainer = ({ children, className }: CardContainerProps) => {
  return (
    <div
      className={cn(
        "bg-card border border-border/80 rounded-xl p-6 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)]",
        className
      )}
    >
      {children}
    </div>
  );
};

export { CardContainer };
