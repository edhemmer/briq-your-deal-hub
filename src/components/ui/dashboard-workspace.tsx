import { cn } from "@/lib/utils";

interface DashboardWorkspaceProps {
  children?: React.ReactNode;
  className?: string;
}

const DashboardWorkspace = ({ children, className }: DashboardWorkspaceProps) => {
  return (
    <div
      className={cn(
        "bg-briq-surface border border-border rounded-xl min-h-[400px] p-6",
        className
      )}
    >
      {children}
    </div>
  );
};

export { DashboardWorkspace };
