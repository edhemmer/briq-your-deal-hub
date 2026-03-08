import { cn } from "@/lib/utils";

interface CardContainerProps {
  children: React.ReactNode;
  className?: string;
}

const CardContainer = ({ children, className }: CardContainerProps) => {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-6 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
};

export { CardContainer };
