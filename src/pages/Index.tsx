import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, FileSignature, Briefcase, FileText, Activity } from "lucide-react";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeals } from "@/hooks/useDeals";

const formatCurrency = (val: number | null) =>
  val != null ? `$${val.toLocaleString()}` : "—";

const statusVariant = (s: string | null): "default" | "secondary" | "outline" => {
  if (s === "completed") return "default";
  if (s === "analyzing") return "secondary";
  return "outline";
};

const Index = () => {
  const { data: deals, isLoading } = useDeals();
  const recentDeals = deals?.slice(0, 5) ?? [];
  const completedDeals = deals?.filter((d) => d.deal_status === "completed").slice(0, 5) ?? [];
  const recentActivity = deals?.slice(0, 5) ?? [];

  return (
    <SectionContainer>
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real estate transaction intelligence
        </p>
      </div>

      {/* Section 1: Two module panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <CardContainer className="p-6 flex flex-col border-primary/15 bg-gradient-to-br from-primary/[0.03] to-card hover:border-primary/30 hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="default" className="text-[10px]">Active</Badge>
          </div>
          <h2 className="text-lg font-semibold text-foreground">DealIQ</h2>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mt-1">
            Analyze the deal
          </p>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed flex-1">
            Property, market, pricing, underwriting, and opportunity intelligence.
          </p>
          <Link to="/dealiq" className="mt-5">
            <Button className="w-full gap-2">
              Open DealIQ
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContainer>

        <CardContainer className="p-6 flex flex-col hover:border-primary/30 hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <FileSignature className="h-5 w-5 text-foreground/70" />
            </div>
            <Badge variant="outline" className="text-[10px]">Active</Badge>
          </div>
          <h2 className="text-lg font-semibold text-foreground">ContractIQ</h2>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mt-1">
            Analyze the contract
          </p>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed flex-1">
            Contract structure, risk, leverage, timeline, and negotiation intelligence.
          </p>
          <Link to="/contractiq" className="mt-5">
            <Button variant="outline" className="w-full gap-2">
              Open ContractIQ
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContainer>
      </div>

      {/* Section 2: Recent Deals */}
      <CardContainer className="p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Recent Deals</h2>
          </div>
          <Link to="/deals" className="text-xs font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-md" />
            ))}
          </div>
        ) : recentDeals.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No deals yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {recentDeals.map((deal) => (
              <Link
                key={deal.id}
                to={`/dealiq/${deal.id}`}
                className="py-3 flex items-center justify-between gap-4 hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {deal.property_address}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {deal.strategy_primary ?? "No strategy"} · {formatCurrency(deal.purchase_price)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={statusVariant(deal.deal_status)}>
                    {deal.deal_status ?? "draft"}
                  </Badge>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {new Date(deal.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContainer>

      {/* Section 3: Recent Reports */}
      <CardContainer className="p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Recent Reports</h2>
          </div>
          <Link to="/reports" className="text-xs font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        {isLoading ? (
          <Skeleton className="h-12 rounded-md" />
        ) : completedDeals.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            Reports appear here once deals are fully analyzed.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {completedDeals.map((deal) => (
              <Link
                key={deal.id}
                to={`/dealiq/${deal.id}`}
                className="py-3 flex items-center justify-between gap-4 hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {deal.property_address}
                  </p>
                  <p className="text-xs text-muted-foreground">DealIQ Report</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(deal.created_at).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContainer>

      {/* Section 4: Recent Activity */}
      <CardContainer className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
        </div>
        {isLoading ? (
          <Skeleton className="h-12 rounded-md" />
        ) : recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No activity yet.</p>
        ) : (
          <ul className="space-y-3">
            {recentActivity.map((deal) => (
              <li key={deal.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-foreground truncate">
                  Deal created · <span className="text-muted-foreground">{deal.property_address}</span>
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(deal.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContainer>
    </SectionContainer>
  );
};

export default Index;
