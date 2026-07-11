import { Link } from "react-router-dom";
import { BarChart3, FileText, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useDeals } from "@/hooks/useDeals";

type Deal = NonNullable<ReturnType<typeof useDeals>["data"]>[number];

export default function Reports() {
  const { data: deals = [], isLoading } = useDeals();
  const sortedDeals = [...deals].sort((a, b) => readiness(b) - readiness(a));

  return (
    <SectionContainer>
      <PageHeader
        title="Reports"
        description="Open deal files that are ready for investor summaries, underwriting exports, and source-backed review."
      />

      {isLoading ? (
        <CardContainer className="min-h-[320px]">
          <EmptyReports title="Loading reports" body="BRIX is checking your deal files." />
        </CardContainer>
      ) : sortedDeals.length === 0 ? (
        <CardContainer className="min-h-[360px]">
          <EmptyReports
            title="No report-ready deals"
            body="Create a deal file first. Reports are generated from DealIQ once the property, assumptions, risks, and verification status are available."
          />
        </CardContainer>
      ) : (
        <CardContainer className="p-0">
          <div className="border-b border-border p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="h-4 w-4 text-primary" />
              Deal Reports
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Reports are generated inside each DealIQ file so the output always uses the latest numbers and verification status.
            </p>
          </div>
          <div className="divide-y divide-border">
            {sortedDeals.map((deal) => (
              <ReportRow key={deal.id} deal={deal} />
            ))}
          </div>
        </CardContainer>
      )}
    </SectionContainer>
  );
}

function ReportRow({ deal }: { deal: Deal }) {
  const score = readiness(deal);
  const gaps = missingInputs(deal);
  return (
    <div className="grid gap-4 p-5 lg:grid-cols-[minmax(260px,1fr)_180px_220px] lg:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">{deal.property_address || deal.deal_name || "Unnamed deal"}</h3>
          <Badge variant="outline">{deal.strategy_primary || "Strategy needed"}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{[deal.city, deal.state, deal.zip_code].filter(Boolean).join(", ") || "Location needed"}</p>
        {gaps.length > 0 && (
          <p className="mt-2 flex items-center gap-2 text-xs text-signal-warning">
            <ShieldAlert className="h-3.5 w-3.5" />
            {gaps[0]}
          </p>
        )}
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Report readiness</span>
          <span className={score >= 85 ? "text-signal-positive" : score >= 65 ? "text-signal-warning" : "text-signal-risk"}>{score}</span>
        </div>
        <Progress value={score} className="h-2" />
      </div>
      <div className="flex flex-wrap gap-2 lg:justify-end">
        <Button asChild>
          <Link to={`/dealiq/${deal.id}`}>Open report tools</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/dealiq/compare">Compare</Link>
        </Button>
      </div>
    </div>
  );
}

function EmptyReports({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
      <BarChart3 className="h-10 w-10 text-muted-foreground" />
      <h2 className="mt-4 text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{body}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link to="/findiq">Add property</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/dealiq">Open DealIQ</Link>
        </Button>
      </div>
    </div>
  );
}

function readiness(deal: Deal) {
  const checks = [
    positive(deal.purchase_price),
    positive(deal.monthly_rent),
    positive(deal.annual_property_tax ?? deal.taxes),
    positive(deal.insurance),
    Boolean(deal.property_address),
    Boolean(deal.strategy_primary),
    Boolean(deal.property_type),
    Boolean(deal.listing_url || deal.property_record_url || deal.listing_remarks),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function missingInputs(deal: Deal) {
  const missing: string[] = [];
  if (!positive(deal.purchase_price)) missing.push("Purchase price needs support.");
  if (!positive(deal.monthly_rent)) missing.push("Rent support is missing.");
  if (!positive(deal.annual_property_tax ?? deal.taxes)) missing.push("Tax history is missing.");
  if (!positive(deal.insurance)) missing.push("Annual insurance quote is missing.");
  if (!deal.strategy_primary) missing.push("Strategy is missing.");
  return missing;
}

function positive(value: number | string | null | undefined) {
  return Number(value) > 0;
}
