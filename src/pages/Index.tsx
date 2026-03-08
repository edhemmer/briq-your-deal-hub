import { Plus, LayoutDashboard, Briefcase, TrendingUp, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { DashboardWorkspace } from "@/components/ui/dashboard-workspace";
import { EmptyStateContainer } from "@/components/ui/empty-state-container";
import { PrimaryButton } from "@/components/ui/primary-button";
import { CardContainer } from "@/components/ui/card-container";
import { Badge } from "@/components/ui/badge";
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
      <PageHeader title="BRIQ" description="Real Estate Deal Intelligence">
        <Link to="/deals/new">
          <PrimaryButton>
            <Plus className="h-4 w-4 mr-2" />
            Analyze New Deal
          </PrimaryButton>
        </Link>
      </PageHeader>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : totalDeals === 0 ? (
        <DashboardWorkspace>
          <EmptyStateContainer
            icon={<LayoutDashboard className="h-10 w-10" />}
            title="Your workspace is ready"
            description="Start by analyzing a new deal. Insights and analytics will appear here."
          />
        </DashboardWorkspace>
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CardContainer className="p-5">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Deals</p>
                  <p className="text-2xl font-semibold text-foreground">{totalDeals}</p>
                </div>
              </div>
            </CardContainer>
            <CardContainer className="p-5">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Deal Score</p>
                  <p className="text-2xl font-semibold text-muted-foreground">—</p>
                </div>
              </div>
            </CardContainer>
            <CardContainer className="p-5">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Recent Deals</p>
                  <p className="text-2xl font-semibold text-foreground">{recentDeals.length}</p>
                </div>
              </div>
            </CardContainer>
          </div>

          {/* Recent deals list */}
          <DashboardWorkspace>
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Recent Deals</h2>
            <div className="divide-y divide-border">
              {recentDeals.map((deal) => (
                <div key={deal.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{deal.property_address}</p>
                    <p className="text-xs text-muted-foreground">
                      {deal.strategy_primary ?? "No strategy"} · {formatCurrency(deal.purchase_price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={statusColor(deal.deal_status)}>{deal.deal_status}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(deal.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </DashboardWorkspace>
        </div>
      )}
    </SectionContainer>
  );
};

export default Index;
