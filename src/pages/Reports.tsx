import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, FileText, Save, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useDeals } from "@/hooks/useDeals";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { dealReadinessScore, missingDealInputs } from "@/lib/dealReadiness";

type Deal = NonNullable<ReturnType<typeof useDeals>["data"]>[number];

export default function Reports() {
  const { user } = useAuth();
  const { data: deals = [], isLoading } = useDeals();
  const { data: reports = [], isLoading: reportsLoading } = useSavedReports();
  const saveReport = useSaveReportSnapshot();
  const sortedDeals = [...deals].sort((a, b) => readiness(b) - readiness(a));

  return (
    <SectionContainer>
      <PageHeader
        title="Reports"
        description="Open deal files that are ready for investor summaries, underwriting exports, and source-backed review."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
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
                Save a point-in-time snapshot before exporting or sharing a deal review.
              </p>
            </div>
            <div className="divide-y divide-border">
              {sortedDeals.map((deal) => (
                <ReportRow
                  key={deal.id}
                  deal={deal}
                  saving={saveReport.isPending}
                  onSave={() => user && saveReport.mutate({ deal, userId: user.id })}
                />
              ))}
            </div>
          </CardContainer>
        )}

        <CardContainer className="p-0">
          <div className="border-b border-border p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Save className="h-4 w-4 text-primary" />
              Saved Snapshots
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              A record of report snapshots you saved for review.
            </p>
          </div>
          <div className="divide-y divide-border">
            {reportsLoading ? (
              <p className="p-5 text-sm text-muted-foreground">Loading saved snapshots.</p>
            ) : reports.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No saved report snapshots yet.</p>
            ) : (
              reports.slice(0, 8).map((report) => (
                <div key={report.id} className="p-5">
                  <p className="font-semibold text-foreground">{report.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(report.created_at).toLocaleString()} - {report.report_status}
                  </p>
                  {report.summary && (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{report.summary}</p>
                  )}
                  {report.deal_id && (
                    <Button className="mt-4" size="sm" variant="outline" asChild>
                      <Link to={`/dealiq/${report.deal_id}`}>Open deal file</Link>
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContainer>
      </div>
    </SectionContainer>
  );
}

function ReportRow({ deal, saving, onSave }: { deal: Deal; saving: boolean; onSave: () => void }) {
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
        <Button variant="secondary" onClick={onSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving" : "Save snapshot"}
        </Button>
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
  return dealReadinessScore(deal, { requireLocation: true, requireSource: true });
}

function missingInputs(deal: Deal) {
  return missingDealInputs(deal, { requireLocation: true, requireSource: true }).map((item) => {
    switch (item) {
      case "purchase price": return "Purchase price needs support.";
      case "rent support": return "Rent support is missing.";
      case "verified annual taxes": return "Verified annual taxes are missing.";
      case "annual insurance quote": return "Annual insurance quote is missing.";
      case "strategy": return "Strategy is missing.";
      case "source listing or notes": return "Source listing or notes are missing.";
      default: return `${item.charAt(0).toUpperCase()}${item.slice(1)} is missing.`;
    }
  });
}

function useSavedReports() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["brix-reports", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brix_reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function useSaveReportSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ deal, userId }: { deal: Deal; userId: string }) => {
      const score = readiness(deal);
      const gaps = missingInputs(deal);
      const title = deal.property_address || deal.deal_name || "Deal report";
      const { data, error } = await supabase
        .from("brix_reports")
        .insert({
          user_id: userId,
          deal_id: deal.id,
          report_type: "deal_snapshot",
          report_status: "saved",
          title,
          summary: `${score}/100 readiness. ${gaps[0] ?? "Core report inputs are present."}`,
          payload: {
            deal_id: deal.id,
            title,
            readiness: score,
            missing_inputs: gaps,
            strategy: deal.strategy_primary,
            purchase_price: deal.purchase_price,
            monthly_rent: deal.monthly_rent,
            annual_taxes: deal.property_taxes,
            annual_insurance: deal.insurance,
            saved_at: new Date().toISOString(),
          },
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["brix-reports"] });
      toast({ title: "Report snapshot saved" });
    },
    onError: (error) => {
      toast({
        title: "Could not save report snapshot",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });
}
