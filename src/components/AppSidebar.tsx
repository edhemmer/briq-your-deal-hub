import { LayoutDashboard, Briefcase, BarChart3, FileText, Settings, ShieldCheck, HelpCircle, FileSignature } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import BrixIcon from "@/components/BrixIcon";
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
  { title: "BRIX OS", url: "/dashboard", icon: LayoutDashboard },
  { title: "DealIQ", url: "/dealiq", icon: BarChart3 },
  { title: "ContractIQ", url: "/contractiq", icon: FileSignature },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Help", url: "/help", icon: HelpCircle },
];



export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { data: isAdmin } = useIsAdmin();

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/" || location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  const allItems = isAdmin
    ? [...navItems, { title: "Admin", url: "/admin", icon: ShieldCheck }]
    : navItems;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-baseline gap-1.5">
          <BrixIcon size={26} className="text-primary self-center" />
          {!collapsed && (
            <>
              <span className="text-base font-extrabold tracking-tight text-sidebar-primary leading-none">BRIX</span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground leading-none">Real Estate</span>
            </>
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
                      end={item.url === "/dashboard"}
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

      </SidebarContent>
    </Sidebar>
  );
}
