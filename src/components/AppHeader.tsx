import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import BriqIcon from "@/components/BriqIcon";

export function AppHeader() {
  return (
    <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card">
      <div className="flex items-center">
        <SidebarTrigger className="mr-3" />
        <div className="flex items-center gap-2 md:hidden">
          <BriqIcon size={22} className="text-primary" />
          <span className="text-sm font-semibold tracking-tight text-foreground">BRIQ</span>
        </div>
      </div>
      <Link to="/help">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </Link>
    </header>
  );
}
