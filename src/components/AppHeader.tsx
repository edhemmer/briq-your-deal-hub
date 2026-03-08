import { SidebarTrigger } from "@/components/ui/sidebar";
import BriqIcon from "@/components/BriqIcon";

export function AppHeader() {
  return (
    <header className="h-14 flex items-center border-b border-border px-4 bg-card">
      <SidebarTrigger className="mr-3" />
      <div className="flex items-center gap-2 md:hidden">
        <BriqIcon size={22} />
        <span className="text-sm font-semibold tracking-tight text-foreground">BRIQ</span>
      </div>
    </header>
  );
}
