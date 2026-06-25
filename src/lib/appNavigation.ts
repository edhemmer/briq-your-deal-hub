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
  { title: "Deal Dashboard", shortTitle: "Dashboard", url: "/dashboard", icon: LayoutDashboard, question: "What deal needs work?" },
  { title: "FindIQ", shortTitle: "Find", url: "/findiq", icon: Search, question: "Find the address" },
  { title: "DealIQ", shortTitle: "Deal", url: "/dealiq", icon: BarChart3, question: "Analyze the deal" },
  { title: "OfferIQ", shortTitle: "Offer", url: "/offeriq", icon: PenLine, question: "Work the offer" },
  { title: "PipelineIQ", shortTitle: "Pipeline", url: "/pipelineiq", icon: KanbanSquare, question: "Track win or loss" },
  { title: "PortfolioIQ", shortTitle: "Portfolio", url: "/portfolioiq", icon: Building2, question: "Learn from outcomes" },
  { title: "ContractIQ", shortTitle: "Contract", url: "/contractiq", icon: FileSignature, question: "Analyze the contract" },
  { title: "Reports", shortTitle: "Reports", url: "/reports", icon: FileText, question: "What should I export?" },
  { title: "Settings", shortTitle: "Settings", url: "/settings", icon: Settings, question: "Account and preferences" },
  { title: "Help", shortTitle: "Help", url: "/help", icon: HelpCircle, question: "How do I use this?" },
];
