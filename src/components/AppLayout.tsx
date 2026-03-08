import { TopNav } from "@/components/TopNav";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      {/* Spacer for fixed nav: 64px + mobile sub-nav 40px on md:hidden */}
      <div className="h-16 md:h-16" />
      <div className="md:hidden h-10" />
      <main className="flex-1 w-full max-w-[1320px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 pb-safe">
        {children}
      </main>
    </div>
  );
}
