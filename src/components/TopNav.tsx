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

const navItems = [
  { title: "BRIX OS", url: "/dashboard" },
  { title: "FindIQ", url: "/findiq" },
  { title: "DealIQ", url: "/dealiq" },
  { title: "OfferIQ", url: "/offeriq" },
  { title: "PipelineIQ", url: "/pipelineiq" },
  { title: "PortfolioIQ", url: "/portfolioiq" },
  { title: "ContractIQ", url: "/contractiq" },
  { title: "Reports", url: "/reports" },
  { title: "Settings", url: "/settings" },
];

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
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-card/95 backdrop-blur-sm supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-full max-w-[1320px] items-center justify-between px-4 md:px-6">
        {/* Left: Brand */}
        <Link to="/dashboard" className="flex items-baseline gap-1.5 shrink-0">
          <BrixIcon size={40} className="text-primary self-center" />
          <span className="text-lg font-extrabold tracking-tight text-foreground leading-none">BRIX</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground leading-none">Real Estate</span>
        </Link>

        {/* Center: Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.url}
              to={item.url}
              className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.url)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.title}
              {isActive(item.url) && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          ))}
        </nav>

        {/* Right: Actions */}
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

      {/* Mobile nav */}
      <div className="md:hidden border-t border-border bg-card">
        <nav className="flex items-center justify-around px-2">
          {navItems.map((item) => (
            <Link
              key={item.url}
              to={item.url}
              className={`relative py-2.5 px-2 text-xs font-medium transition-colors ${
                isActive(item.url)
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {item.title}
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
