import { cn } from "@/lib/utils";

interface SectionContainerProps {
  children: React.ReactNode;
  className?: string;
}

const SectionContainer = ({ children, className }: SectionContainerProps) => {
  return (
    <section className={cn("space-y-6", className)}>
      {children}
    </section>
  );
};

export { SectionContainer };
