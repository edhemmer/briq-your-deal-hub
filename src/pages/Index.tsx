import { Plus, Briefcase, TrendingUp, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDeals } from "@/hooks/useDeals";

const Index = () => {
  const { data: deals, isLoading } = useDeals();
  const totalDeals = deals?.length ?? 0;
  const recentDeals = deals?.slice(0, 5) ?? [];

  const formatCurrency = (val: number | null) =>
    val != null ? `$${val.toLocaleString()}` : "—";

  const statusColor = (s: string | null) => {
    if (s === "completed") return "default";
    if (s === "analyzing") return "secondary";
    return "outline";
  };

  return (
    <SectionContainer>
      <PageHeader title="BRIQ" description="Real Estate Deal Intelligence" />

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : totalDeals === 0 ? (
        <CardContainer className="py-20 px-6">
          <div className="flex flex-col items-center text-center max-w-md mx-auto">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              BRIQ Deal Intelligence Workspace
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Analyze a property to generate financial insights, market signals, and risk intelligence.
            </p>
            <Link to="/deals/new" className="mt-6">
              <Button size="lg" className="gap-2 rounded-lg font-medium shadow-sm hover:shadow-md transition-shadow">
                <Plus className="h-4 w-4" />
                Analyze Deal
              </Button>
            </Link>
          </div>
        </CardContainer>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CardContainer className="p-5">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Deals</p>
                  <p className="text-2xl font-black text-foreground tabular-nums">{totalDeals}</p>
                </div>
              </div>
            </CardContainer>
            <CardContainer className="p-5">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Avg Deal Score</p>
                  <p className="text-2xl font-black text-muted-foreground">—</p>
                </div>
              </div>
            </CardContainer>
            <CardContainer className="p-5">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Recent Deals</p>
                  <p className="text-2xl font-black text-foreground tabular-nums">{recentDeals.length}</p>
                </div>
              </div>
            </CardContainer>
          </div>

          <CardContainer className="p-5">
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Recent Deals</h2>
            <div className="divide-y divide-border">
              {recentDeals.map((deal) => (
                <Link
                  key={deal.id}
                  to={`/analysis/${deal.id}`}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{deal.property_address}</p>
                    <p className="text-xs text-muted-foreground">
                      {deal.strategy_primary ?? "No strategy"} · {formatCurrency(deal.purchase_price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={statusColor(deal.deal_status)}>{deal.deal_status ?? "draft"}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(deal.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContainer>
        </div>
      )}
    </SectionContainer>
  );
};

export default Index;
