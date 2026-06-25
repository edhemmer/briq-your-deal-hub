import { BarChart3, Briefcase, GitCompareArrows, Plus, ShieldAlert, Trash2 } from "lucide-react";
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

type Deal = NonNullable<ReturnType<typeof useDeals>["data"]>[number];

const formatCurrency = (value: number | null | undefined) =>
  value != null ? `$${Number(value).toLocaleString()}` : "Missing";

const readiness = (deal: Deal) => {
  const checks = [
    deal.property_address,
    deal.city,
    deal.state,
    deal.purchase_price && deal.purchase_price > 0,
    deal.monthly_rent && deal.monthly_rent > 0,
    deal.insurance && deal.insurance > 0,
    deal.annual_property_tax && deal.annual_property_tax > 0,
    deal.property_type,
    deal.strategy_primary,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

export function DealIQLanding() {
  const { data: deals, isLoading } = useDeals();
  const deleteDeal = useDeleteDeal();
  const navigate = useNavigate();

  return (
    <SectionContainer>
      <PageHeader title="DealIQ" description="Open a property file, complete missing inputs, and run acquisition analysis.">
        <div className="flex gap-2">
          <Link to="/dealiq/compare">
            <Button variant="outline">
              <GitCompareArrows className="mr-2 h-4 w-4" />
              Compare
            </Button>
          </Link>
          <Link to="/dealiq/new">
            <PrimaryButton>
              <Plus className="mr-2 h-4 w-4" />
              Add property
            </PrimaryButton>
          </Link>
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : !deals || deals.length === 0 ? (
        <CardContainer className="p-8">
          <EmptyStateContainer
            icon={<Briefcase className="h-10 w-10" />}
            title="No property files"
            description="Add a listing, address, screenshots, or known facts to create the first analysis file."
          />
          <div className="mt-4 flex justify-center">
            <Link to="/dealiq/new">
              <PrimaryButton>
                <Plus className="mr-2 h-4 w-4" />
                Add first property
              </PrimaryButton>
            </Link>
          </div>
        </CardContainer>
      ) : (
        <div className="grid gap-3">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onOpen={() => navigate(`/dealiq/${deal.id}`)} onDelete={() => deleteDeal.mutate(deal.id)} />
          ))}
        </div>
      )}
    </SectionContainer>
  );
}

function DealCard({ deal, onOpen, onDelete }: { deal: Deal; onOpen: () => void; onDelete: () => void }) {
  const score = readiness(deal);
  const missing = [
    !deal.monthly_rent && "rent",
    !deal.insurance && "insurance",
    !deal.annual_property_tax && "taxes",
  ].filter(Boolean);

  return (
    <CardContainer className="p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">{deal.property_address || "Unnamed property"}</h2>
            <Badge variant="outline">{deal.strategy_primary ?? "Strategy needed"}</Badge>
            {missing.length > 0 && (
              <Badge className="border border-signal-warning/25 bg-signal-warning/10 text-signal-warning">
                <ShieldAlert className="mr-1 h-3 w-3" />
                Verify {missing.length}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {[deal.city, deal.state].filter(Boolean).join(", ") || "Location missing"} · Price {formatCurrency(deal.purchase_price)} · ARV {formatCurrency(deal.estimated_arv)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-md border border-border bg-background px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Readiness</p>
            <p className="mt-1 text-sm font-black text-foreground">{score}</p>
          </div>
          <Button onClick={onOpen}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Open Analysis
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </CardContainer>
  );
}
