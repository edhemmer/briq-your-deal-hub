import { TopNav } from "@/components/TopNav";
import { Link, useLocation } from "react-router-dom";
import { appNavItems } from "@/lib/appNavigation";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="h-14" />
      <div className="md:hidden h-10" />
      <div className="mx-auto flex w-full max-w-[1500px]">
        <ModuleRail />
        <main className="min-w-0 flex-1 px-4 py-4 pb-safe md:px-6 md:py-5 lg:px-7">
          {children}
        </main>
      </div>
    </div>
  );
}

function ModuleRail() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/" || location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[258px] shrink-0 border-r border-border bg-card/35 p-3 lg:block">
      <div className="mb-3 rounded-md border border-border bg-background p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Investor workflow</p>
        <p className="mt-1 text-sm leading-5 text-foreground">Source, underwrite, pursue, close, and learn from every deal file.</p>
      </div>

      <nav className="space-y-1">
        {appNavItems.map((item) => {
          const active = isActive(item.url);
          return (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                "group flex gap-3 rounded-md border border-transparent px-3 py-2.5 transition-colors",
                active
                  ? "border-primary/25 bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:border-border hover:bg-background hover:text-foreground",
              )}
            >
              <item.icon className={cn("mt-0.5 h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-5">{item.title}</span>
                <span className="block truncate text-xs leading-5 text-muted-foreground">{item.question}</span>
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
