import { Plus, Trash2, ArrowRight, Briefcase, BarChart3 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { EmptyStateContainer } from "@/components/ui/empty-state-container";
import { CardContainer } from "@/components/ui/card-container";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeals, useDeleteDeal } from "@/hooks/useDeals";

export function DealIQLanding() {
  const { data: deals, isLoading } = useDeals();
  const deleteDeal = useDeleteDeal();
  const navigate = useNavigate();

  const formatCurrency = (val: number | null | undefined) =>
    val != null ? `$${Number(val).toLocaleString()}` : "—";

  const statusColor = (s: string | null) => {
    if (s === "completed") return "default" as const;
    if (s === "analyzing") return "secondary" as const;
    return "outline" as const;
  };

  return (
    <SectionContainer>
      <PageHeader
        title="DealIQ"
        description="Start a new deal analysis or open an existing one."
      >
        <Link to="/deals/new">
          <PrimaryButton>
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </PrimaryButton>
        </Link>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : !deals || deals.length === 0 ? (
        <CardContainer className="p-8">
          <EmptyStateContainer
            icon={<Briefcase className="h-10 w-10" />}
            title="No deals yet"
            description="Create your first deal to begin DealIQ analysis."
          />
          <div className="flex justify-center mt-4">
            <Link to="/deals/new">
              <PrimaryButton>
                <Plus className="h-4 w-4 mr-2" />
                Create First Deal
              </PrimaryButton>
            </Link>
          </div>
        </CardContainer>
      ) : (
        <CardContainer className="overflow-x-auto">
          <table className="w-full text-sm hidden md:table">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 font-medium">Property</th>
                <th className="pb-3 font-medium">Strategy</th>
                <th className="pb-3 font-medium">Price</th>
                <th className="pb-3 font-medium">ARV</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Created</th>
                <th className="pb-3 font-medium sr-only">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {deals.map((deal) => (
                <tr key={deal.id} className="group">
                  <td className="py-3 pr-4 font-medium text-foreground">{deal.property_address}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{deal.strategy_primary ?? "—"}</td>
                  <td className="py-3 pr-4 text-muted-foreground tabular-nums">{formatCurrency(deal.purchase_price)}</td>
                  <td className="py-3 pr-4 text-muted-foreground tabular-nums">{formatCurrency(deal.estimated_arv)}</td>
                  <td className="py-3 pr-4"><Badge variant={statusColor(deal.deal_status)}>{deal.deal_status ?? "draft"}</Badge></td>
                  <td className="py-3 pr-4 text-muted-foreground">{new Date(deal.created_at).toLocaleDateString()}</td>
                  <td className="py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/dealiq/${deal.id}`)}>
                        <BarChart3 className="h-4 w-4 mr-1" /> Analyze <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteDeal.mutate(deal.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="md:hidden divide-y divide-border">
            {deals.map((deal) => (
              <div key={deal.id} className="py-3 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground truncate">{deal.property_address}</p>
                  <Badge variant={statusColor(deal.deal_status)}>{deal.deal_status ?? "draft"}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {deal.strategy_primary ?? "—"} · {formatCurrency(deal.purchase_price)} · ARV {formatCurrency(deal.estimated_arv)}
                </p>
                <div className="flex gap-2 pt-1">
                  <Button variant="default" size="sm" onClick={() => navigate(`/dealiq/${deal.id}`)}>
                    <BarChart3 className="h-3 w-3 mr-1" /> Analyze
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteDeal.mutate(deal.id)}>
                    <Trash2 className="h-3 w-3 mr-1 text-destructive" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContainer>
      )}
    </SectionContainer>
  );
}
