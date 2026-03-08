import { Link } from "react-router-dom";
import { ArrowRight, Clock, Brain, ShieldCheck, BarChart3, Upload, FileText, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import BriqIcon from "@/components/BriqIcon";

const features = [
  {
    icon: Upload,
    title: "Drop a Listing, Get Answers",
    description: "Paste text or drop a screenshot from any listing site. BRIQ extracts the data and runs the numbers — no manual entry required.",
  },
  {
    icon: BarChart3,
    title: "Complete Financial Analysis",
    description: "Cap rate, cash-on-cash return, monthly cash flow, debt service — calculated instantly from your deal inputs.",
  },
  {
    icon: Brain,
    title: "Deal Intelligence Scoring",
    description: "Every deal gets a composite score based on financials, market conditions, and risk factors. One number to guide your decision.",
  },
  {
    icon: TrendingUp,
    title: "Local Market Signals",
    description: "Price trends, rent growth, days on market, supply levels, and demand pressure — pulled together for the market you're evaluating.",
  },
  {
    icon: ShieldCheck,
    title: "Stress Testing Built In",
    description: "See how your deal holds up under rate increases, vacancy spikes, and rent drops before you commit capital.",
  },
  {
    icon: FileText,
    title: "Export-Ready Reports",
    description: "Generate professional deal reports you can share with partners, lenders, or your own records.",
  },
];

const metrics = [
  { value: "Minutes", label: "From listing to full analysis" },
  { value: "7", label: "Intelligence engines per deal" },
  { value: "Zero", label: "Spreadsheets required" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-5">
          <Link to="/landing" className="flex items-center gap-2.5">
            <BriqIcon size={36} className="text-primary" />
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold tracking-tight text-foreground">BRIQ</span>
              <span className="text-[10px] text-muted-foreground font-medium">Real Estate Deal IQ</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="rounded-lg text-sm font-medium">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 px-5">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 mb-8">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Real estate deal analysis, simplified</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
            Stop the guessing chaos.
            <br />
            <span className="text-primary">Start the deal clarity.</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            BRIQ turns property listings into complete deal intelligence — financial analysis, market signals, risk scoring, and strategy fit — in minutes instead of hours.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="rounded-xl text-base font-semibold px-8 py-6 shadow-lg hover:shadow-xl transition-all gap-2">
                Analyze Your First Deal
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="rounded-xl text-base font-medium px-8 py-6">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics bar */}
      <section className="border-y border-border/60 bg-muted/30">
        <div className="mx-auto max-w-4xl px-5 py-12 md:py-14">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-4 text-center">
            {metrics.map((m) => (
              <div key={m.label}>
                <p className="text-3xl md:text-4xl font-black text-foreground tracking-tight">{m.value}</p>
                <p className="mt-1 text-sm text-muted-foreground font-medium">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The problem */}
      <section className="py-20 md:py-28 px-5">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Deal analysis shouldn't take all day
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Most investors spend hours copying data into spreadsheets, cross-referencing market reports, and second-guessing their numbers. BRIQ consolidates every step into one structured workflow — so you spend your time on decisions, not data entry.
          </p>
        </div>

        {/* Transformation */}
        <div className="mx-auto max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
            <div className="rounded-2xl border border-border bg-card p-6 text-center">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Before</p>
              <div className="space-y-2.5 text-sm text-muted-foreground">
                <p>Copy listing data by hand</p>
                <p>Build spreadsheet models</p>
                <p>Research market separately</p>
                <p>Guess at risk factors</p>
                <p>Hours per deal</p>
              </div>
            </div>
            <div className="hidden md:flex items-center justify-center">
              <ArrowRight className="h-6 w-6 text-primary" />
            </div>
            <div className="rounded-2xl border-2 border-primary/20 bg-primary/[0.03] p-6 text-center">
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">With BRIQ</p>
              <div className="space-y-2.5 text-sm text-foreground font-medium">
                <p>Drop a listing, data extracted</p>
                <p>Financials calculated instantly</p>
                <p>Market intelligence included</p>
                <p>Risk scored automatically</p>
                <p>Minutes per deal</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28 px-5 bg-muted/20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Everything you need to evaluate a deal
            </h2>
            <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto">
              Seven intelligence engines work together to give you a complete picture of every property.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border/80 bg-card p-7 hover:shadow-md transition-shadow"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-28 px-5">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Three steps to a smarter decision
            </h2>
          </div>

          <div className="space-y-12">
            {[
              {
                step: "01",
                title: "Add your deal",
                description: "Paste a listing, drop a screenshot, or type the address. BRIQ pulls in the details.",
              },
              {
                step: "02",
                title: "Review the intelligence",
                description: "Financials, market conditions, strategy fit, risk signals, and stress test results — all on one screen.",
              },
              {
                step: "03",
                title: "Make your decision",
                description: "Export a report, compare deals, or move forward with confidence. The data is already done.",
              },
            ].map((s) => (
              <div key={s.step} className="flex gap-6 items-start">
                <span className="text-4xl font-black text-primary/20 tabular-nums shrink-0 leading-none pt-1">{s.step}</span>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-20 md:py-28 px-5 bg-muted/20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-12">
            Built for investors who value their time
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            {[
              { title: "Solo Investors", desc: "Evaluate deals faster without hiring an analyst or building complex spreadsheets." },
              { title: "Small Teams", desc: "Standardize how your team underwrites deals. Same framework, every time." },
              { title: "Busy Professionals", desc: "Invest on the side without spending your evenings on data entry." },
            ].map((p) => (
              <div key={p.title} className="rounded-2xl border border-border/80 bg-card p-6">
                <h3 className="text-sm font-semibold text-foreground mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 md:py-32 px-5">
        <div className="mx-auto max-w-2xl text-center">
          <BriqIcon size={56} className="text-primary mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Your next deal deserves better analysis
          </h2>
          <p className="mt-4 text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Stop wrestling with spreadsheets. Start with the intelligence you need to invest with clarity.
          </p>
          <div className="mt-8">
            <Link to="/register">
              <Button size="lg" className="rounded-xl text-base font-semibold px-10 py-6 shadow-lg hover:shadow-xl transition-all gap-2">
                Get Started — It's Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Your first deal analysis is free. No credit card required.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-10 px-5">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BriqIcon size={24} className="text-primary" />
            <span className="text-sm font-semibold text-foreground">BRIQ</span>
            <span className="text-xs text-muted-foreground">· Real Estate Deal IQ</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Built by InLight AI · © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
