import { LayoutDashboard, Briefcase, BarChart3, FileText, User, ShieldCheck, HelpCircle } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import BriqIcon from "@/components/BriqIcon";
import { useIsAdmin } from "@/hooks/useAdminData";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "DealIQ", url: "/dealiq", icon: BarChart3 },
  { title: "Deals", url: "/deals", icon: Briefcase },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Account", url: "/account", icon: User },
  { title: "Help", url: "/help", icon: HelpCircle },
];

const comingSoonModules = ["ContractIQ", "MarketIQ", "LeaseIQ", "CapitalIQ"];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { data: isAdmin } = useIsAdmin();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const allItems = isAdmin
    ? [...navItems, { title: "Admin", url: "/admin", icon: ShieldCheck }]
    : navItems;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <BriqIcon size={26} className="text-primary" />
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-base font-semibold tracking-tight text-sidebar-primary">
                BRIX
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Real Estate Intelligence
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {allItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <div className="px-4 pt-6 pb-2">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
              Coming Soon
            </p>
            <ul className="space-y-1.5">
              {comingSoonModules.map((m) => (
                <li
                  key={m}
                  className="text-xs text-muted-foreground/80 flex items-center gap-2"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
