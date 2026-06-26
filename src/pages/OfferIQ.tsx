import { Link } from "react-router-dom";
import { ArrowRight, FileSignature, ShieldAlert, Workflow } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";

export default function OfferIQ() {
  return (
    <SectionContainer>
      <PageHeader
        title="OfferIQ"
        description="Generate offers, communications, diligence requests, and transaction packages from verified DealIQ records."
      >
        <Button asChild>
          <Link to="/dealiq">
            <FileSignature className="mr-2 h-4 w-4" />
            Choose deal
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <CardContainer className="min-h-[360px]">
          <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
            <Workflow className="h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">No deal selected for OfferIQ</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Select a DealIQ record to structure offer terms, communication drafts, diligence requests, and negotiation notes from the property file.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/dealiq">
                <Button>
                  Choose DealIQ Record
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/dealiq/new">
                <Button variant="outline">Add Property</Button>
              </Link>
            </div>
          </div>
        </CardContainer>

        <CardContainer>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <ShieldAlert className="h-4 w-4" />
            Offer Guardrails
          </div>
          <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            <p>Offer prices, walk-away thresholds, seller concessions, and counteroffers require explainable support from DealIQ.</p>
            <p>Weak or missing data lowers confidence and moves the deal back to verification.</p>
            <p>Legal, tax, financing, title, and contract questions require qualified professional review before execution.</p>
          </div>
        </CardContainer>
      </div>
    </SectionContainer>
  );
}
