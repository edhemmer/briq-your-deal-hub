import { Link, useLocation, useNavigate } from "react-router-dom";
import { Plus, User, HelpCircle, ShieldCheck, LogOut, ChevronDown } from "lucide-react";
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
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-card/95 backdrop-blur-sm supports-[backdrop-filter]:bg-card/85">
      <div className="mx-auto flex h-full max-w-[1500px] items-center justify-between px-4 md:px-6">
        {/* Left: Brand */}
        <Link to="/dashboard" className="flex items-baseline gap-1.5 shrink-0">
          <BrixIcon size={34} className="text-primary self-center" />
          <span className="text-lg font-extrabold tracking-tight text-foreground leading-none">BRIX</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground leading-none">Real Estate</span>
        </Link>

        <div className="hidden items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground lg:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-signal-positive" />
          Workspace
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button size="sm" asChild className="hidden sm:inline-flex">
            <Link to="/dealiq/new">
              <Plus className="mr-2 h-4 w-4" />
              Add property
            </Link>
          </Button>
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

      {/* Mobile nav */}
      <div className="border-t border-border bg-card md:hidden">
        <nav className="scrollbar-hide flex items-center gap-1 overflow-x-auto px-2">
          {appNavItems.slice(0, 7).map((item) => (
            <Link
              key={item.url}
              to={item.url}
              className={`relative shrink-0 py-2.5 px-2 text-xs font-medium transition-colors ${
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
