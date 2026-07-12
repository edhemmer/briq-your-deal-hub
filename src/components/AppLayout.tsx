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
      <div className="h-10 xl:hidden" />
      <div className="mx-auto flex w-full max-w-[1440px]">
        <ModuleRail />
        <main className="min-w-0 flex-1 px-3 py-3 pb-safe sm:px-4 md:px-5 md:py-4 xl:px-5">
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
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[236px] shrink-0 border-r border-border/70 bg-card/38 p-3 backdrop-blur-xl xl:block 2xl:w-[248px]">
      <div className="mb-3 rounded-2xl border border-border/70 bg-background/45 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Acquisition OS</p>
        <p className="mt-1 text-sm font-semibold leading-5 text-foreground">One deal record from search to ownership.</p>
      </div>

      <nav className="space-y-1">
        {appNavItems.map((item) => {
          const active = isActive(item.url);
          return (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                "ios-pressable group flex gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-colors",
                active
                  ? "border-primary/25 bg-primary/10 text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
                  : "text-muted-foreground hover:border-border/70 hover:bg-background/50 hover:text-foreground",
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
