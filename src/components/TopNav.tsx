import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, HelpCircle, ShieldCheck, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useAdminData";
import BrixIcon from "@/components/BrixIcon";
import { ThemeToggle } from "@/components/ThemeToggle";
import { appNavItems } from "@/lib/appNavigation";

export function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/" || location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 h-14 border-b border-border bg-card/95 backdrop-blur-sm supports-[backdrop-filter]:bg-card/85">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-4 md:px-5 xl:px-6">
        <Link to="/dashboard" className="flex items-baseline gap-1.5 shrink-0">
          <BrixIcon size={34} className="text-primary self-center" />
          <span className="text-lg font-extrabold tracking-tight text-foreground leading-none">BRIX</span>
          <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground leading-none sm:inline">Real Estate</span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => navigate("/account")}>
                  <User className="mr-2 h-4 w-4" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/help")}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={() => navigate("/login")}>
              Login
            </Button>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-card xl:hidden">
        <nav className="scrollbar-hide mx-auto flex max-w-[1440px] items-center gap-1 overflow-x-auto px-2 md:px-4">
          {appNavItems.map((item) => (
            <Link
              key={item.url}
              to={item.url}
              className={`relative shrink-0 px-2 py-2.5 text-xs font-medium transition-colors md:px-3 ${
                isActive(item.url)
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {item.shortTitle}
              {isActive(item.url) && (
                <span className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
