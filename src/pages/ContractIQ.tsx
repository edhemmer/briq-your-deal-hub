import { FileSignature, Upload, ShieldCheck, Scale, Clock } from "lucide-react";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ContractIQ = () => {
  return (
    <SectionContainer>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
              ContractIQ
            </h1>
            <Badge variant="outline" className="text-[10px]">Preview</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Analyze the contract — structure, risk, leverage, timeline, and negotiation intelligence.
          </p>
        </div>
      </div>

      <CardContainer className="p-10 md:p-14 mb-6">
        <div className="flex flex-col items-center text-center max-w-lg mx-auto">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
            <FileSignature className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Contract analysis is coming soon
          </h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Upload a purchase agreement, lease, or LOI to get structured contract intelligence:
            obligations, contingencies, timelines, risk flags, and negotiation leverage.
          </p>
          <Button disabled className="mt-6 gap-2">
            <Upload className="h-4 w-4" />
            Upload Contract
          </Button>
          <p className="text-[11px] text-muted-foreground mt-3">
            Workflow under active development.
          </p>
        </div>
      </CardContainer>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardContainer className="p-5">
          <ShieldCheck className="h-5 w-5 text-muted-foreground mb-3" />
          <h3 className="text-sm font-semibold text-foreground">Risk & obligations</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Surface contingencies, default triggers, indemnities, and unusual clauses.
          </p>
        </CardContainer>
        <CardContainer className="p-5">
          <Scale className="h-5 w-5 text-muted-foreground mb-3" />
          <h3 className="text-sm font-semibold text-foreground">Leverage points</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Identify negotiation opportunities and contract terms that favor each party.
          </p>
        </CardContainer>
        <CardContainer className="p-5">
          <Clock className="h-5 w-5 text-muted-foreground mb-3" />
          <h3 className="text-sm font-semibold text-foreground">Timeline & deadlines</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Extract critical dates, inspection windows, and closing milestones.
          </p>
        </CardContainer>
      </div>
    </SectionContainer>
  );
};

export default ContractIQ;
