import type { ReactNode } from "react";
import { ArrowRight, CalendarClock, FileSignature, Mail, Scale, ShieldAlert, Split, Workflow } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  dueDiligenceItems,
  offerCommunications,
  offerDocuments,
  sampleOfferStrategies,
  sampleOfferStructures,
  transactionTimeline,
  type OfferStructure,
} from "@/lib/offerIQArchitecture";

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export default function OfferIQ() {
  return (
    <SectionContainer>
      <PageHeader
        title="OfferIQ"
        description="Prepare offers, communications, diligence requests, and transaction packages from verified DealIQ data."
      >
        <Button variant="outline">
          <Mail className="h-4 w-4 mr-2" />
          Draft Message
        </Button>
        <Button>
          <FileSignature className="h-4 w-4 mr-2" />
          Generate Offer Package
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <CardContainer>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                <Workflow className="h-4 w-4" />
                Transaction Workspace
              </div>
              <h2 className="mt-2 text-lg font-semibold text-foreground">Move from analysis to action</h2>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                OfferIQ prepares the next transaction step only after the property, assumptions, and acquisition recommendation are clear enough to act on.
              </p>
            </div>
            <Badge variant="secondary">Deal-linked</Badge>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {["DealIQ Analysis", "OfferIQ Activated", "Documents Generated", "PipelineIQ Updated"].map((step, index) => (
              <div key={step} className="rounded-lg border border-border bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Step {index + 1}</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{step}</p>
              </div>
            ))}
          </div>
        </CardContainer>

        <CardContainer>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <ShieldAlert className="h-4 w-4" />
            Negotiation Guardrails
          </div>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p><span className="font-semibold text-foreground">Status:</span> Select a DealIQ record before BRIX recommends offer price, counter ceiling, or walk-away threshold.</p>
            <p><span className="font-semibold text-foreground">Primary warning:</span> Do not waive inspection, financing, appraisal, insurance, or title protections without professional review.</p>
            <p><span className="font-semibold text-foreground">Confidence rule:</span> Offer guidance remains provisional until rent, taxes, insurance, condition, and comps are verified.</p>
          </div>
        </CardContainer>
      </div>

      <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <CardContainer>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Scale className="h-4 w-4" />
            Offer Strategy Templates
          </div>
          <div className="mt-4 space-y-3">
            {sampleOfferStrategies.map((item) => (
              <div key={item.strategy} className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-foreground">{item.strategy}</h3>
                  <Badge variant={item.fit === "Recommended" ? "default" : "outline"}>{item.fit}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.rationale}</p>
                <p className="mt-2 text-xs text-amber-500">{item.risk}</p>
              </div>
            ))}
          </div>
        </CardContainer>

        <CardContainer>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Split className="h-4 w-4" />
            Offer Structure Templates
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {sampleOfferStructures.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </CardContainer>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <CardContainer>
          <SectionTitle icon={<FileSignature className="h-4 w-4" />} title="Document Generation" />
          <div className="mt-4 space-y-3">
            {offerDocuments.map((doc) => (
              <Row key={doc.id} title={doc.title} detail={`${doc.source} source`} status={doc.status} />
            ))}
          </div>
        </CardContainer>

        <CardContainer>
          <SectionTitle icon={<Mail className="h-4 w-4" />} title="Communication Generator" />
          <div className="mt-4 space-y-3">
            {offerCommunications.map((comm) => (
              <Row key={comm.id} title={comm.title} detail={`${comm.audience}: ${comm.purpose}`} status={comm.status} />
            ))}
          </div>
        </CardContainer>

        <CardContainer>
          <SectionTitle icon={<CalendarClock className="h-4 w-4" />} title="Transaction Timeline" />
          <div className="mt-4 space-y-3">
            {transactionTimeline.map((milestone) => (
              <Row key={milestone.id} title={milestone.label} detail={milestone.date} status={milestone.status} />
            ))}
          </div>
        </CardContainer>
      </div>

      <CardContainer>
        <SectionTitle icon={<Workflow className="h-4 w-4" />} title="Due Diligence Workspace" />
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {dueDiligenceItems.map((item) => (
            <div key={item.id} className="rounded-lg border border-border bg-muted/20 p-4">
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.owner} by {item.dueDate}</p>
              <Badge className="mt-3" variant={item.status === "Complete" ? "default" : "outline"}>{item.status}</Badge>
            </div>
          ))}
        </div>
      </CardContainer>
    </SectionContainer>
  );
}

function OfferCard({ offer }: { offer: OfferStructure }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-foreground">{offer.label}</h3>
        <Badge variant="outline">{offer.financing}</Badge>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Metric label="Price" value={money(offer.purchasePrice)} />
        <Metric label="Earnest" value={money(offer.earnestMoney)} />
        <Metric label="Diligence" value={`${offer.dueDiligenceDays} days`} />
        <Metric label="Closing" value={`${offer.closingDays} days`} />
      </div>
      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        <p><span className="font-semibold text-foreground">Strength:</span> {offer.strengths[0]}</p>
        <p><span className="font-semibold text-foreground">Weakness:</span> {offer.weaknesses[0]}</p>
      </div>
      <Button variant="outline" className="mt-4 w-full">
        Review Scenario
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
      {icon}
      {title}
    </div>
  );
}

function Row({ title, detail, status }: { title: string; detail: string; status: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <Badge variant={status === "Ready" || status === "Complete" ? "default" : "outline"}>{status}</Badge>
      </div>
    </div>
  );
}
