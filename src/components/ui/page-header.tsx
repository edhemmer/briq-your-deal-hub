import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

const PageHeader = ({ title, description, children, className }: PageHeaderProps) => {
  return (
    <div className={cn("flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/50 p-4 backdrop-blur-xl md:flex-row md:items-center md:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-[1.6rem]">{title}</h1>
        {description && (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:shrink-0 md:justify-end">{children}</div>}
    </div>
  );
};

export { PageHeader };
