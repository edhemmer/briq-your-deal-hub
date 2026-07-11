import { TopNav } from "@/components/TopNav";
import { Link, useLocation } from "react-router-dom";
import { appNavItems } from "@/lib/appNavigation";
import { cn } from "@/lib/utils";
import { useDeals } from "@/hooks/useDeals";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, CheckCircle2, CircleAlert, FilePlus2, Workflow } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="h-14" />
      <div className="h-10 xl:hidden" />
      <div className="mx-auto flex w-full max-w-[1440px]">
        <ModuleRail />
        <main className="min-w-0 flex-1 px-3 py-3 pb-safe sm:px-4 md:px-5 md:py-4 xl:px-5">
          <DealOperatingStrip />
          {children}
        </main>
      </div>
    </div>
  );
}

function DealOperatingStrip() {
  const location = useLocation();
  const { data: deals, isLoading } = useDeals();
  const activeDeal = deals?.[0];
  const activeModule = appNavItems.find((item) => {
    if (item.url === "/dashboard") return location.pathname === "/" || location.pathname === "/dashboard";
    return location.pathname.startsWith(item.url);
  }) ?? appNavItems[0];

  const score = activeDeal ? readinessScore(activeDeal) : 0;
  const missing = activeDeal ? missingInputs(activeDeal) : [];

  return (
    <section className="ios-material mb-3 overflow-hidden rounded-2xl md:mb-4">
      <div className="flex flex-col gap-3 border-b border-border/70 px-3 py-3 md:px-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Workflow className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Active module</p>
            <h2 className="truncate text-sm font-semibold leading-5 text-foreground">
              {activeModule.title}
              <span className="hidden font-medium text-muted-foreground sm:inline"> / {activeModule.question}</span>
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          <Button size="sm" asChild>
            <Link to="/findiq">
              <FilePlus2 className="mr-2 h-4 w-4" />
              Add deal
            </Link>
          </Button>
          {activeDeal ? (
            <Button size="sm" variant="outline" asChild>
              <Link to={`/dealiq/${activeDeal.id}`}>
                Open deal <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 px-3 py-3 md:px-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
        <div className="min-w-0">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading your deal files...</p>
          ) : activeDeal ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{activeDeal.property_address || "Unnamed property"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[activeDeal.city, activeDeal.state, activeDeal.zip_code].filter(Boolean).join(", ") || "Location missing"} / {activeDeal.strategy_primary || "Strategy not selected"}
                </p>
              </div>
              <Badge className={cn("w-fit rounded-full border px-2.5 py-1 text-[11px]", score >= 80 ? "border-signal-positive/25 bg-signal-positive/10 text-signal-positive" : "border-signal-warning/25 bg-signal-warning/10 text-signal-warning")}>
                {score >= 80 ? "Decision file ready" : `${missing.length} verification gap${missing.length === 1 ? "" : "s"}`}
              </Badge>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">Start with an address or listing link, choose a strategy, then BRIX opens the deal workspace.</p>
            </div>
          )}
        </div>

        <div className="ios-control p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Confidence workflow</span>
            <span className={cn("text-sm font-bold", score >= 80 ? "text-signal-positive" : "text-signal-warning")}>{score}/100</span>
          </div>
          <Progress value={score} className="h-2" />
          <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
            {score >= 80 ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-signal-positive" /> : <CircleAlert className="mt-0.5 h-3.5 w-3.5 text-signal-warning" />}
            <span>{score >= 80 ? "Core inputs are present. Continue source review and stress testing." : (missing[0] ? `Next: verify ${missing[0].toLowerCase()}.` : "Add required facts to generate a reliable decision.")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

type LayoutDeal = NonNullable<ReturnType<typeof useDeals>["data"]>[number];

function readinessScore(deal: LayoutDeal) {
  const checks = [
    deal.property_address,
    deal.city,
    deal.state,
    positiveNumber(deal.purchase_price),
    positiveNumber(deal.monthly_rent),
    positiveNumber(deal.annual_property_tax ?? deal.taxes),
    positiveNumber(deal.insurance),
    deal.property_type,
    deal.strategy_primary,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function missingInputs(deal: LayoutDeal) {
  const missing: string[] = [];
  if (!deal.property_address) missing.push("property address");
  if (!deal.city) missing.push("city");
  if (!deal.state) missing.push("state");
  if (!positiveNumber(deal.purchase_price)) missing.push("purchase price");
  if (!positiveNumber(deal.monthly_rent)) missing.push("monthly rent");
  if (!positiveNumber(deal.annual_property_tax ?? deal.taxes)) missing.push("annual taxes");
  if (!positiveNumber(deal.insurance)) missing.push("annual insurance");
  if (!deal.property_type) missing.push("property type");
  if (!deal.strategy_primary) missing.push("strategy");
  return missing;
}

function positiveNumber(value: number | null | undefined) {
  return value != null && Number.isFinite(Number(value)) && Number(value) > 0;
}

function ModuleRail() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/" || location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[236px] shrink-0 border-r border-border/70 bg-card/38 p-3 backdrop-blur-xl xl:block 2xl:w-[248px]">
      <div className="mb-3 rounded-2xl border border-border/70 bg-background/45 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Acquisition OS</p>
        <p className="mt-1 text-sm font-semibold leading-5 text-foreground">One deal record from search to ownership.</p>
      </div>

      <nav className="space-y-1">
        {appNavItems.map((item) => {
          const active = isActive(item.url);
          return (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                "ios-pressable group flex gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-colors",
                active
                  ? "border-primary/25 bg-primary/10 text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
                  : "text-muted-foreground hover:border-border/70 hover:bg-background/50 hover:text-foreground",
              )}
            >
              <item.icon className={cn("mt-0.5 h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-5">{item.title}</span>
                <span className="block truncate text-xs leading-5 text-muted-foreground">{item.question}</span>
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
