import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          "bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-5 py-2.5 rounded-lg text-sm transition-colors",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);
PrimaryButton.displayName = "PrimaryButton";

export { PrimaryButton };
