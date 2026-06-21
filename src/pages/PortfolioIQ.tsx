import { Link } from "react-router-dom";
import { Archive, ArrowRight, BarChart3, Building2, FileText, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";

export default function PortfolioIQ() {
  return (
    <SectionContainer>
      <PageHeader
        title="PortfolioIQ"
        description="Track acquired assets, equity, cash flow, risk exposure, refinance opportunities, and portfolio performance."
      >
        <Button variant="outline" disabled>
          <Archive className="mr-2 h-4 w-4" />
          Document Vault
        </Button>
        <Button disabled>
          <FileText className="mr-2 h-4 w-4" />
          Quarterly Report
        </Button>
      </PageHeader>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <PortfolioMetric label="Total Asset Value" value="$0" />
        <PortfolioMetric label="Total Equity" value="$0" />
        <PortfolioMetric label="Total Debt" value="$0" />
        <PortfolioMetric label="Monthly Cash Flow" value="$0" />
      </div>

      <CardContainer className="min-h-[420px]">
        <div className="flex min-h-[340px] flex-col items-center justify-center text-center">
          <Building2 className="h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold text-foreground">No acquired assets yet</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            PortfolioIQ begins after an acquisition closes. Closed properties become asset records with equity, cash flow, documents, and performance history.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/pipelineiq">
              <Button>
                Open PipelineIQ
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/dealiq">
              <Button variant="outline">Review Deals</Button>
            </Link>
          </div>
        </div>
      </CardContainer>

      <div className="grid gap-4 lg:grid-cols-2">
        <CardContainer>
          <div className="flex items-start gap-3">
            <BarChart3 className="mt-1 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">Portfolio analyst</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Portfolio recommendations will appear only after BRIX has real asset, debt, income, expense, and valuation data.
              </p>
            </div>
          </div>
        </CardContainer>

        <CardContainer>
          <div className="flex items-start gap-3">
            <RefreshCw className="mt-1 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">Refinance intelligence</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Refinance, hold, and sell recommendations require verified value, loan balance, rate, cash flow, and market conditions.
              </p>
            </div>
          </div>
        </CardContainer>
      </div>
    </SectionContainer>
  );
}

function PortfolioMetric({ label, value }: { label: string; value: string }) {
  return (
    <CardContainer className="p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
    </CardContainer>
  );
}
