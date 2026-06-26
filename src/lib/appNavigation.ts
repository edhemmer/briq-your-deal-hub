import {
  BarChart3,
  Building2,
  FileSignature,
  FileText,
  HelpCircle,
  KanbanSquare,
  LayoutDashboard,
  PenLine,
  Search,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type AppNavItem = {
  title: string;
  shortTitle: string;
  url: string;
  icon: LucideIcon;
  question: string;
};

export const appNavItems: AppNavItem[] = [
  { title: "Deal Dashboard", shortTitle: "Dashboard", url: "/dashboard", icon: LayoutDashboard, question: "Control active decisions" },
  { title: "FindIQ", shortTitle: "Find", url: "/findiq", icon: Search, question: "Source and rank deals" },
  { title: "DealIQ", shortTitle: "Deal", url: "/dealiq", icon: BarChart3, question: "Underwrite the deal" },
  { title: "OfferIQ", shortTitle: "Offer", url: "/offeriq", icon: PenLine, question: "Structure the offer" },
  { title: "PipelineIQ", shortTitle: "Pipeline", url: "/pipelineiq", icon: KanbanSquare, question: "Move deals forward" },
  { title: "PortfolioIQ", shortTitle: "Portfolio", url: "/portfolioiq", icon: Building2, question: "Measure performance" },
  { title: "ContractIQ", shortTitle: "Contract", url: "/contractiq", icon: FileSignature, question: "Review terms and risk" },
  { title: "Reports", shortTitle: "Reports", url: "/reports", icon: FileText, question: "Export decision records" },
  { title: "Settings", shortTitle: "Settings", url: "/settings", icon: Settings, question: "Account and preferences" },
  { title: "Help", shortTitle: "Help", url: "/help", icon: HelpCircle, question: "Training and guidance" },
];
