import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, FileSignature, Sparkles } from "lucide-react";
import { SectionContainer } from "@/components/ui/section-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <SectionContainer>
      {/* Header */}
      <div className="mb-10 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 bg-card/60 backdrop-blur-sm mb-5">
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            BRIX Intelligence Suite
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground leading-[1.1]">
          Welcome to your{" "}
          <span className="bg-gradient-to-r from-primary via-primary to-accent-foreground bg-clip-text text-transparent">
            Deal Intelligence
          </span>{" "}
          workspace.
        </h1>
        <p className="text-base text-muted-foreground mt-4 leading-relaxed">
          Two precision-built modules for real estate transaction intelligence — choose where to begin.
        </p>
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleCard
          to="/dealiq"
          eyebrow="Module 01 · Analyze the Deal"
          title="DealIQ"
          description="Property, market, pricing, underwriting, financing, risk, and strategy intelligence — synthesized into a single decision."
          cta="Open DealIQ"
          icon={<BarChart3 className="h-6 w-6" />}
          accent="primary"
          highlights={["10-layer engine", "Deterministic math", "Strategy fit scoring"]}
        />
        <ModuleCard
          to="/contractiq"
          eyebrow="Module 02 · Analyze the Contract"
          title="ContractIQ"
          description="Contract structure, risk, leverage, timeline, and negotiation intelligence — from the buyer's or seller's perspective."
          cta="Open ContractIQ"
          icon={<FileSignature className="h-6 w-6" />}
          accent="accent"
          highlights={["Clause-level review", "Leverage analysis", "Negotiation playbook"]}
          variant="outline"
        />
      </div>
    </SectionContainer>
  );
};

interface ModuleCardProps {
  to: string;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  icon: React.ReactNode;
  accent: "primary" | "accent";
  highlights: string[];
  variant?: "default" | "outline";
}

function ModuleCard({ to, eyebrow, title, description, cta, icon, accent, highlights, variant = "default" }: ModuleCardProps) {
  const isPrimary = accent === "primary";
  return (
    <Link
      to={to}
      className="group relative block rounded-2xl bg-card border border-border/70 overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.25)] hover:-translate-y-0.5"
    >
      {/* Ambient gradient backdrop */}
      <div
        className={`pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-500 group-hover:opacity-100 ${
          isPrimary
            ? "bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.10),transparent_60%)]"
            : "bg-[radial-gradient(circle_at_top_right,hsl(var(--accent)/0.45),transparent_60%)]"
        }`}
      />
      {/* Top hairline highlight */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="relative p-8 flex flex-col min-h-[340px]">
        <div className="flex items-start justify-between mb-6">
          <div className="relative">
            <div
              className={`absolute inset-0 rounded-2xl blur-xl opacity-50 ${
                isPrimary ? "bg-primary/30" : "bg-accent/60"
              }`}
            />
            <div
              className={`relative h-14 w-14 rounded-2xl flex items-center justify-center border ${
                isPrimary
                  ? "bg-gradient-to-br from-primary/15 to-primary/5 border-primary/20 text-primary"
                  : "bg-gradient-to-br from-accent to-accent/40 border-border text-foreground"
              }`}
            >
              {icon}
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] font-medium tracking-wide bg-background/80 backdrop-blur-sm border-border/80"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            Active
          </Badge>
        </div>

        <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted-foreground/80 mb-2">
          {eyebrow}
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{description}</p>

        <div className="flex flex-wrap gap-1.5 mt-5">
          {highlights.map((h) => (
            <span
              key={h}
              className="text-[11px] px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground border border-border/50"
            >
              {h}
            </span>
          ))}
        </div>

        <div className="flex-1" />

        <div className="mt-8">
          <Button
            size="lg"
            variant={variant === "outline" ? "outline" : "default"}
            className="w-full gap-2 group-hover:gap-3 transition-all"
          >
            {cta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </Link>
  );
}

export default Index;
