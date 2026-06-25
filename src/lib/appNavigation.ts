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
  { title: "Workspace", shortTitle: "OS", url: "/dashboard", icon: LayoutDashboard, question: "What needs attention?" },
  { title: "FindIQ", shortTitle: "Find", url: "/findiq", icon: Search, question: "What should I investigate?" },
  { title: "DealIQ", shortTitle: "Deal", url: "/dealiq", icon: BarChart3, question: "Should I acquire it?" },
  { title: "OfferIQ", shortTitle: "Offer", url: "/offeriq", icon: PenLine, question: "How should I pursue it?" },
  { title: "PipelineIQ", shortTitle: "Pipeline", url: "/pipelineiq", icon: KanbanSquare, question: "Where does it stand?" },
  { title: "PortfolioIQ", shortTitle: "Portfolio", url: "/portfolioiq", icon: Building2, question: "How is it performing?" },
  { title: "ContractIQ", shortTitle: "Contract", url: "/contractiq", icon: FileSignature, question: "What does the contract expose?" },
  { title: "Reports", shortTitle: "Reports", url: "/reports", icon: FileText, question: "What should I export?" },
  { title: "Settings", shortTitle: "Settings", url: "/settings", icon: Settings, question: "Account and preferences" },
  { title: "Help", shortTitle: "Help", url: "/help", icon: HelpCircle, question: "How do I use this?" },
];
