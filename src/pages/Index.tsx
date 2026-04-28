import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, FileSignature, Sparkles, TrendingUp, Shield, Zap } from "lucide-react";
import { SectionContainer } from "@/components/ui/section-container";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="relative overflow-hidden">
      {/* Animated mesh background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,hsl(217_91%_60%/0.18),transparent_70%)] animate-float-slow" />
        <div className="absolute top-20 -right-32 h-[450px] w-[450px] rounded-full bg-[radial-gradient(circle,hsl(174_62%_47%/0.20),transparent_70%)] animate-float-slow [animation-delay:-4s]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,hsl(262_83%_70%/0.14),transparent_70%)] animate-float-slow [animation-delay:-8s]" />
      </div>

      <SectionContainer>
        {/* Hero header */}
        <div className="mb-12 max-w-3xl animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 via-[hsl(174_62%_47%/0.10)] to-primary/10 backdrop-blur-md mb-6 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] bg-gradient-to-r from-primary to-[hsl(174_62%_47%)] bg-clip-text text-transparent">
              BRIQ Intelligence Suite
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
            <span className="text-foreground">Welcome to your </span>
            <span
              className="bg-[linear-gradient(110deg,hsl(217_91%_60%),hsl(174_62%_47%),hsl(262_83%_65%),hsl(217_91%_60%))] bg-clip-text text-transparent bg-[length:300%_100%] animate-gradient-shift"
            >
              Deal Intelligence
            </span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mt-5 leading-relaxed max-w-2xl">
            Two precision-built modules for real estate transaction intelligence.
            Choose where to begin — every signal, deterministic, defensible.
          </p>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-10 animate-fade-in-up [animation-delay:120ms]">
          {[
            { icon: TrendingUp, label: "10-Layer Engine", value: "Deterministic" },
            { icon: Shield, label: "Risk Detection", value: "32 Signals" },
            { icon: Zap, label: "Decision Time", value: "< 60 sec" },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="relative group rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4 overflow-hidden transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/15 to-[hsl(174_62%_47%/0.12)] flex items-center justify-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
                  <p className="text-sm font-semibold text-foreground truncate">{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Module cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ModuleCard
            to="/dealiq"
            eyebrow="Module 01 · Analyze the Deal"
            title="DealIQ"
            description="Property, market, pricing, underwriting, financing, risk, and strategy intelligence — synthesized into a single decision."
            cta="Open DealIQ"
            icon={<BarChart3 className="h-7 w-7" />}
            gradient="from-[hsl(217_91%_60%)] via-[hsl(217_91%_55%)] to-[hsl(199_89%_48%)]"
            highlights={["10-layer engine", "Deterministic math", "Strategy fit scoring"]}
            delay="200ms"
          />
          <ModuleCard
            to="/contractiq"
            eyebrow="Module 02 · Analyze the Contract"
            title="ContractIQ"
            description="Contract structure, risk, leverage, timeline, and negotiation intelligence — from the buyer's or seller's perspective."
            cta="Open ContractIQ"
            icon={<FileSignature className="h-7 w-7" />}
            gradient="from-[hsl(174_62%_47%)] via-[hsl(189_70%_50%)] to-[hsl(217_91%_60%)]"
            highlights={["Clause-level review", "Leverage analysis", "Negotiation playbook"]}
            delay="320ms"
          />
        </div>
      </SectionContainer>
    </div>
  );
};

interface ModuleCardProps {
  to: string;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  icon: React.ReactNode;
  gradient: string;
  highlights: string[];
  delay?: string;
}

function ModuleCard({ to, eyebrow, title, description, cta, icon, gradient, highlights, delay }: ModuleCardProps) {
  return (
    <Link
      to={to}
      style={{ animationDelay: delay }}
      className="group relative block rounded-3xl bg-card border border-border/70 overflow-hidden transition-all duration-500 hover:border-transparent hover:-translate-y-1 hover:shadow-[0_30px_80px_-20px_hsl(217_91%_60%/0.35)] animate-fade-in-up"
    >
      {/* Animated gradient border on hover */}
      <div className={`pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm`} />
      <div className="relative rounded-3xl bg-card overflow-hidden">
        {/* Mesh gradient backdrop */}
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.04] group-hover:opacity-[0.10] transition-opacity duration-700`} />

        {/* Floating orb */}
        <div className={`pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gradient-to-br ${gradient} opacity-20 blur-3xl group-hover:opacity-40 group-hover:scale-110 transition-all duration-700`} />

        {/* Top hairline */}
        <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-50 group-hover:opacity-100 transition-opacity`} />

        <div className="relative p-8 flex flex-col min-h-[360px]">
          <div className="flex items-start justify-between mb-6">
            <div className="relative">
              {/* Glow */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} blur-2xl opacity-50 animate-pulse-glow`} />
              {/* Rotating ring */}
              <div className={`absolute -inset-2 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-60 blur-md transition-opacity duration-500`} />
              <div className={`relative h-16 w-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                {/* Shimmer overlay */}
                <div className="absolute inset-0 rounded-2xl bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.4)_50%,transparent_70%)] bg-[length:200%_100%] animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
                {icon}
              </div>
            </div>

          </div>

          <p className={`text-[10px] uppercase tracking-[0.18em] font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent mb-2`}>
            {eyebrow}
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{description}</p>

          <div className="flex flex-wrap gap-1.5 mt-5">
            {highlights.map((h) => (
              <span
                key={h}
                className="text-[11px] px-2.5 py-1 rounded-full bg-muted/70 text-foreground/80 border border-border/60 font-medium backdrop-blur-sm group-hover:border-primary/30 transition-colors"
              >
                {h}
              </span>
            ))}
          </div>

          <div className="flex-1" />

          <div className="mt-8 relative">
            <Button
              size="lg"
              className={`w-full gap-2 bg-gradient-to-r ${gradient} hover:opacity-90 border-0 text-white shadow-lg group-hover:shadow-xl transition-all relative overflow-hidden`}
            >
              {/* Shimmer */}
              <span className="absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.3)_50%,transparent_70%)] bg-[length:200%_100%] animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative">{cta}</span>
              <ArrowRight className="h-4 w-4 relative transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default Index;
