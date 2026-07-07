import { cn } from "@/lib/utils";

interface CardContainerProps {
  children: React.ReactNode;
  className?: string;
}

const CardContainer = ({ children, className }: CardContainerProps) => {
  return (
    <div
      className={cn(
        "ios-material rounded-2xl p-4 md:p-5",
        className
      )}
    >
      {children}
    </div>
  );
};

export { CardContainer };
