import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, FileSignature } from "lucide-react";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <SectionContainer>
      <div className="mb-8">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
          BRIX Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real estate transaction intelligence — choose a module to begin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* DealIQ */}
        <CardContainer className="p-7 flex flex-col border-primary/15 bg-gradient-to-br from-primary/[0.04] to-card hover:border-primary/30 hover:shadow-lg transition-all min-h-[280px]">
          <div className="flex items-start justify-between mb-5">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <Badge variant="default" className="text-[10px]">Active</Badge>
          </div>
          <h2 className="text-xl font-semibold text-foreground">DealIQ</h2>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mt-1">
            Analyze the deal
          </p>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed flex-1">
            Property, market, pricing, underwriting, financing, risk, and strategy intelligence.
          </p>
          <Link to="/dealiq" className="mt-6">
            <Button size="lg" className="w-full gap-2">
              Open DealIQ
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContainer>

        {/* ContractIQ */}
        <CardContainer className="p-7 flex flex-col border-primary/15 bg-gradient-to-br from-accent/[0.04] to-card hover:border-primary/30 hover:shadow-lg transition-all min-h-[280px]">
          <div className="flex items-start justify-between mb-5">
            <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <FileSignature className="h-6 w-6 text-accent-foreground" />
            </div>
            <Badge variant="default" className="text-[10px]">Active</Badge>
          </div>
          <h2 className="text-xl font-semibold text-foreground">ContractIQ</h2>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mt-1">
            Analyze the contract
          </p>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed flex-1">
            Contract structure, risk, leverage, timeline, and negotiation intelligence — from the buyer's or seller's perspective.
          </p>
          <Link to="/contractiq" className="mt-6">
            <Button size="lg" variant="outline" className="w-full gap-2">
              Open ContractIQ
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContainer>
      </div>
    </SectionContainer>
  );
};

export default Index;
