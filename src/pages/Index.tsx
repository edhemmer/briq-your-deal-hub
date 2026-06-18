import { useMemo, useState, type ElementType } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  Building2,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  Gauge,
  GraduationCap,
  Home,
  Layers3,
  LineChart,
  MapPin,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  WalletCards,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContainer } from "@/components/ui/card-container";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type RiskLevel = "Positive" | "Caution" | "Risk" | "Info";

const operatingModules = [
  { name: "Property Snapshot", status: "Facts, files, timeline", icon: Home },
  { name: "Strategy Compare", status: "Buy, hold, sell, refi", icon: Layers3 },
  { name: "Downside Testing", status: "Base, conservative, stress", icon: Gauge },
  { name: "Expert Review", status: "Multiple perspectives", icon: Brain },
  { name: "Action Plan", status: "Due diligence tasks", icon: ClipboardCheck },
  { name: "Portfolio View", status: "Exposure and allocation", icon: WalletCards },
  { name: "Investor Coach", status: "Plain-English guidance", icon: GraduationCap },
  { name: "Field Capture", status: "Photos, scans, notes", icon: Camera },
];

const trustFactors = [
  { label: "Verified records", value: 82, tone: "Positive" },
  { label: "Rent support", value: 70, tone: "Caution" },
  { label: "Insurance quote", value: 48, tone: "Risk" },
  { label: "Rehab scope", value: 64, tone: "Caution" },
];

const strategies = [
  {
    name: "Buy and Hold",
    score: 84,
    trust: 78,
    risk: "Moderate",
    capital: "$84k",
    next: "Verify insurance and rent comps",
  },
  {
    name: "BRRRR",
    score: 73,
    trust: 66,
    risk: "Elevated",
    capital: "$118k",
    next: "Contractor bid required",
  },
  {
    name: "Flip",
    score: 58,
    trust: 61,
    risk: "High",
    capital: "$126k",
    next: "Exit comps too thin",
  },
  {
    name: "Seller Finance",
    score: 79,
    trust: 72,
    risk: "Moderate",
    capital: "$52k",
    next: "Review terms with attorney",
  },
];

const committee = [
  { role: "Acquisition Analyst", opinion: "Conditional buy", detail: "Value works if rent is verified.", tone: "Positive" },
  { role: "Contractor", opinion: "Caution", detail: "Roof and bath scope need bids.", tone: "Caution" },
  { role: "Lender", opinion: "Mostly ready", detail: "DSCR clears base case only.", tone: "Info" },
  { role: "Insurance Underwriter", opinion: "Concern", detail: "Premium exposure is unverified.", tone: "Risk" },
  { role: "Portfolio Manager", opinion: "Good fit", detail: "Adds cash flow without over-concentrating.", tone: "Positive" },
];

const fieldFindings = [
  { room: "Kitchen", scope: "Cabinets, counters, appliance package", budget: "$14.5k - $21k", confidence: 82 },
  { room: "Bathrooms", scope: "Two full remodels, tile repair", budget: "$10k - $15k", confidence: 76 },
  { room: "Roof", scope: "Visual review flags aging shingles", budget: "Review needed", confidence: 61 },
  { room: "Flooring", scope: "Replace carpet and refinish common areas", budget: "$6.8k - $9.2k", confidence: 87 },
];

const projectTasks = [
  { task: "Order insurance quote", owner: "Investor", due: "Today", status: "Critical" },
  { task: "Request contractor roof review", owner: "Contractor", due: "Tomorrow", status: "Important" },
  { task: "Pull three rent comps", owner: "BRIX", due: "Queued", status: "Important" },
  { task: "Confirm lender DSCR terms", owner: "Lender", due: "2 days", status: "Info" },
];

const portfolioExposure = [
  { label: "Debt risk", value: 62 },
  { label: "Liquidity", value: 74 },
  { label: "Market concentration", value: 41 },
  { label: "Insurance exposure", value: 68 },
];

function toneClasses(tone: RiskLevel | string) {
  if (tone === "Positive") return "text-signal-positive bg-signal-positive/10 border-signal-positive/20";
  if (tone === "Risk") return "text-signal-risk bg-signal-risk/10 border-signal-risk/20";
  if (tone === "Caution") return "text-signal-warning bg-signal-warning/10 border-signal-warning/20";
  return "text-signal-info bg-signal-info/10 border-signal-info/20";
}

function scoreText(score: number) {
  if (score >= 80) return "text-signal-positive";
  if (score >= 65) return "text-signal-warning";
  return "text-signal-risk";
}

const Index = () => {
  const [investorLevel, setInvestorLevel] = useState<"Explorer" | "First Deal" | "Active" | "Operator">("First Deal");
  const [activeDecision, setActiveDecision] = useState("Buy with conditions");

  const mentorCopy = useMemo(() => {
    if (investorLevel === "Explorer") {
      return "BRIX will define terms, explain calculations, and show why each risk matters before you act.";
    }
    if (investorLevel === "First Deal") {
      return "BRIX will walk you through verification, financing, due diligence, and first-deal mistakes.";
    }
    if (investorLevel === "Active") {
      return "BRIX will emphasize tradeoffs, strategy fit, and portfolio impact so you can move faster with discipline.";
    }
    return "BRIX will focus on execution variance, capital allocation, concentration, and optimization.";
  }, [investorLevel]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-md">BRIX Operating System</Badge>
                <Badge variant="outline" className="rounded-md">Evidence-led decisions</Badge>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">
                Invest with clarity before you commit capital.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                Screen deals, compare strategies, verify assumptions, and turn next steps into an execution plan from one decision environment.
              </p>
            </div>
            <div className="grid min-w-[220px] grid-cols-2 gap-2 rounded-lg border border-border bg-muted/40 p-3">
              <Metric label="Trust Score" value="78" suffix="/100" tone="Positive" />
              <Metric label="Readiness" value="74" suffix="/100" tone="Caution" />
              <Metric label="Risk" value="Moderate" tone="Caution" />
              <Metric label="Next" value="Verify" tone="Info" />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {operatingModules.map(({ name, status, icon: Icon }) => (
              <div key={name} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground">{status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DecisionBoard activeDecision={activeDecision} onDecisionChange={setActiveDecision} />
      </section>

      <Tabs defaultValue="decision" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted p-1 md:grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="decision">Decision</TabsTrigger>
          <TabsTrigger value="field">Field</TabsTrigger>
          <TabsTrigger value="project">Execution</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
        </TabsList>

        <TabsContent value="decision" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr_0.8fr]">
            <DigitalTwinPanel />
            <StrategyLabPanel />
            <TrustPanel />
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <ScenarioPanel />
            <CommitteePanel />
          </div>
        </TabsContent>

        <TabsContent value="field" className="space-y-4">
          <FieldInvestorMode />
        </TabsContent>

        <TabsContent value="project" className="space-y-4">
          <ProjectOSPanel />
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-4">
          <PortfolioOSPanel />
        </TabsContent>
      </Tabs>

      <section className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
        <CardContainer className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-foreground">Investor Coach</h2>
              <p className="mt-1 text-sm text-muted-foreground">Guidance adapts to your experience level and the decision in front of you.</p>
            </div>
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(["Explorer", "First Deal", "Active", "Operator"] as const).map(level => (
              <button
                key={level}
                onClick={() => setInvestorLevel(level)}
                className={`rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${
                  investorLevel === level ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-6 text-foreground">{mentorCopy}</p>
        </CardContainer>

        <CardContainer className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">From analysis to action</h2>
              <p className="mt-1 text-sm text-muted-foreground">BRIX turns a recommendation into verification tasks, deal comparisons, and a clean next-step plan.</p>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link to="/dealiq/new">
                  Start analysis <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/contractiq">Review contract</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Principle icon={ShieldCheck} title="Clear recommendation" body="Know the suggested move, the evidence behind it, and what could change it." />
            <Principle icon={Target} title="Visible confidence" body="See assumptions, risks, missing information, and source quality before acting." />
            <Principle icon={Sparkles} title="Better decisions" body="Learn through real deals, scenario tests, and mistakes avoided before closing." />
          </div>
        </CardContainer>
      </section>
    </div>
  );
};

function DecisionBoard({ activeDecision, onDecisionChange }: { activeDecision: string; onDecisionChange: (value: string) => void }) {
  return (
    <CardContainer className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Recommendation</p>
          <h2 className="mt-1 text-2xl font-black text-foreground">{activeDecision}</h2>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-signal-warning/10 text-signal-warning">
          <AlertTriangle className="h-5 w-5" />
        </div>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">
        Promising opportunity, but BRIX would not move forward until insurance, rent support, and roof scope are verified.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {["Buy with conditions", "Renegotiate", "Keep checking"].map(decision => (
          <button
            key={decision}
            onClick={() => onDecisionChange(decision)}
            className={`rounded-md border px-2 py-2 text-xs font-semibold transition-colors ${
              activeDecision === decision ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            {decision}
          </button>
        ))}
      </div>
      <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
        {["Get an insurance quote before the inspection window closes", "Ask for an itemized roof and bathroom scope", "Run the conservative rent case before committing"].map(item => (
          <div key={item} className="flex items-start gap-2 text-sm text-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-signal-positive" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </CardContainer>
  );
}

function DigitalTwinPanel() {
  const timeline = ["Acquisition", "Inspection", "Renovation", "Lease up", "Refinance", "Improve"];
  return (
    <CardContainer className="space-y-4">
      <PanelTitle icon={Building2} title="Property Snapshot" subtitle="The facts, files, and timeline behind the recommendation." />
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-foreground">1248 W Maple Ave</h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> Duplex - 1978 - 2,140 sq ft
            </p>
          </div>
          <Badge variant="outline" className="rounded-md">Property Record BRX-1042</Badge>
        </div>
      </div>
      <div className="space-y-3">
        {timeline.map((item, index) => (
          <div key={item} className="flex items-center gap-3">
            <div className={`h-2.5 w-2.5 rounded-full ${index < 2 ? "bg-primary" : "bg-border"}`} />
            <div className="h-px flex-1 bg-border" />
            <span className="w-24 text-right text-xs font-medium text-muted-foreground">{item}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {["Documents", "Images", "Assumptions", "Decisions"].map(layer => (
          <div key={layer} className="rounded-md border border-border bg-background p-3">
            <p className="text-sm font-semibold text-foreground">{layer}</p>
            <p className="text-xs text-muted-foreground">Traceable</p>
          </div>
        ))}
      </div>
    </CardContainer>
  );
}

function StrategyLabPanel() {
  return (
    <CardContainer className="space-y-4">
      <PanelTitle icon={BarChart3} title="Strategy Comparison" subtitle="See which path fits the deal, your capital, and your risk profile." />
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-3 text-left">Strategy</th>
              <th className="px-3 py-3 text-right">Score</th>
              <th className="hidden px-3 py-3 text-right sm:table-cell">Trust</th>
              <th className="px-3 py-3 text-left">Next action</th>
            </tr>
          </thead>
          <tbody>
            {strategies.map(strategy => (
              <tr key={strategy.name} className="border-t border-border">
                <td className="px-3 py-3 font-semibold text-foreground">{strategy.name}</td>
                <td className={`px-3 py-3 text-right font-black ${scoreText(strategy.score)}`}>{strategy.score}</td>
                <td className="hidden px-3 py-3 text-right text-muted-foreground sm:table-cell">{strategy.trust}</td>
                <td className="px-3 py-3 text-xs text-muted-foreground">{strategy.next}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardContainer>
  );
}

function TrustPanel() {
  return (
    <CardContainer className="space-y-4">
      <PanelTitle icon={ShieldCheck} title="Trust & Readiness" subtitle="Know what is verified, what is assumed, and what is missing." />
      {trustFactors.map(factor => (
        <div key={factor.label} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{factor.label}</span>
            <span className={`text-sm font-black ${scoreText(factor.value)}`}>{factor.value}</span>
          </div>
          <Progress value={factor.value} className="h-2" />
        </div>
      ))}
      <div className="rounded-lg border border-signal-risk/20 bg-signal-risk/10 p-3 text-sm text-signal-risk">
        Missing information lowers confidence. Verify insurance and roof scope before recommendation upgrades.
      </div>
    </CardContainer>
  );
}

function ScenarioPanel() {
  const scenarios = [
    { label: "Base", cash: "$486/mo", dscr: "1.31x", width: "84%", tone: "Positive" },
    { label: "Conservative", cash: "$122/mo", dscr: "1.08x", width: "58%", tone: "Caution" },
    { label: "Stress", cash: "-$318/mo", dscr: "0.86x", width: "34%", tone: "Risk" },
  ];
  return (
    <CardContainer className="space-y-4">
      <PanelTitle icon={LineChart} title="Downside Scenarios" subtitle="See how the deal behaves when assumptions get worse." />
      <div className="space-y-3">
        {scenarios.map(scenario => (
          <div key={scenario.label} className="rounded-lg border border-border bg-background p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">{scenario.label} case</p>
                <p className="text-xs text-muted-foreground">Cash flow {scenario.cash} - DSCR {scenario.dscr}</p>
              </div>
              <Badge className={`rounded-md border ${toneClasses(scenario.tone)}`}>{scenario.tone}</Badge>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className={`h-2 rounded-full ${scenario.tone === "Positive" ? "bg-signal-positive" : scenario.tone === "Caution" ? "bg-signal-warning" : "bg-signal-risk"}`} style={{ width: scenario.width }} />
            </div>
          </div>
        ))}
      </div>
    </CardContainer>
  );
}

function CommitteePanel() {
  return (
    <CardContainer className="space-y-4">
      <PanelTitle icon={Brain} title="Expert Review" subtitle="BRIX weighs the deal from analyst, contractor, lender, insurance, and portfolio angles." />
      <div className="grid gap-2">
        {committee.map(member => (
          <div key={member.role} className="rounded-lg border border-border bg-background p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">{member.role}</p>
              <Badge className={`rounded-md border ${toneClasses(member.tone)}`}>{member.opinion}</Badge>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{member.detail}</p>
          </div>
        ))}
      </div>
    </CardContainer>
  );
}

function FieldInvestorMode() {
  return (
    <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
      <CardContainer className="space-y-4">
        <PanelTitle icon={Camera} title="Property Walkthrough" subtitle="Capture photos, scans, and notes while you are on site." />
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { label: "Take photos", icon: Camera },
            { label: "Scan documents", icon: FileSearch },
            { label: "Voice notes", icon: Upload },
            { label: "Sync offline", icon: CheckCircle2 },
          ].map(action => (
            <button key={action.label} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 text-left hover:border-primary/40">
              <action.icon className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">{action.label}</span>
            </button>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <p className="text-sm font-semibold text-foreground">Visual Scope Builder</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Photos become findings, scopes, budgets, confidence, risks, and strategy inputs. Estimates remain preliminary until contractor verification.
          </p>
        </div>
      </CardContainer>

      <CardContainer className="space-y-4">
        <PanelTitle icon={Wrench} title="Preliminary Rehab Scope" subtitle="Early budget intelligence from field evidence, pending contractor verification." />
        <div className="grid gap-3 md:grid-cols-2">
          {fieldFindings.map(finding => (
            <div key={finding.room} className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{finding.room}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{finding.scope}</p>
                </div>
                <span className={`text-lg font-black ${scoreText(finding.confidence)}`}>{finding.confidence}%</span>
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">{finding.budget}</p>
            </div>
          ))}
        </div>
      </CardContainer>
    </div>
  );
}

function ProjectOSPanel() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <CardContainer className="space-y-4">
        <PanelTitle icon={ClipboardCheck} title="Execution Plan" subtitle="Turn diligence and strategy into tracked next steps." />
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-3 text-left">Task</th>
                <th className="px-3 py-3 text-left">Owner</th>
                <th className="px-3 py-3 text-left">Due</th>
                <th className="px-3 py-3 text-left">Priority</th>
              </tr>
            </thead>
            <tbody>
              {projectTasks.map(task => (
                <tr key={task.task} className="border-t border-border">
                  <td className="px-3 py-3 font-semibold text-foreground">{task.task}</td>
                  <td className="px-3 py-3 text-muted-foreground">{task.owner}</td>
                  <td className="px-3 py-3 text-muted-foreground">{task.due}</td>
                  <td className="px-3 py-3"><Badge className={`rounded-md border ${toneClasses(task.status === "Critical" ? "Risk" : task.status === "Important" ? "Caution" : "Info")}`}>{task.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContainer>
      <CardContainer className="space-y-4">
        <PanelTitle icon={Gauge} title="Execution Health" subtitle="Track budget, schedule, and scope drift before they damage the deal." />
        <MetricRow label="Budget health" value={72} />
        <MetricRow label="Schedule health" value={81} />
        <MetricRow label="Scope confidence" value={64} />
        <MetricRow label="Lease-up readiness" value={58} />
      </CardContainer>
    </div>
  );
}

function PortfolioOSPanel() {
  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <CardContainer className="space-y-4">
        <PanelTitle icon={WalletCards} title="Portfolio Impact" subtitle="Understand how one deal changes cash flow, risk, and liquidity." />
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Total equity" value="$1.42M" tone="Positive" />
          <Metric label="Cash flow" value="$8.7k" suffix="/mo" tone="Positive" />
          <Metric label="LTV" value="61%" tone="Caution" />
          <Metric label="Liquidity" value="$186k" tone="Info" />
        </div>
        <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
          This acquisition improves cash flow but increases insurance exposure. BRIX recommends verifying carrier pricing before allocating capital.
        </div>
      </CardContainer>
      <CardContainer className="space-y-4">
        <PanelTitle icon={BarChart3} title="Risk & Allocation" subtitle="Avoid good deals that create bad portfolio exposure." />
        {portfolioExposure.map(item => (
          <MetricRow key={item.label} label={item.label} value={item.value} />
        ))}
      </CardContainer>
    </div>
  );
}

function PanelTitle({ icon: Icon, title, subtitle }: { icon: ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
    </div>
  );
}

function Metric({ label, value, suffix, tone = "Info" }: { label: string; value: string; suffix?: string; tone?: RiskLevel | string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-black ${tone === "Positive" ? "text-signal-positive" : tone === "Caution" ? "text-signal-warning" : tone === "Risk" ? "text-signal-risk" : "text-foreground"}`}>
        {value} {suffix && <span className="text-xs font-medium text-muted-foreground">{suffix}</span>}
      </p>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className={`text-sm font-black ${scoreText(value)}`}>{value}</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}

function Principle({ icon: Icon, title, body }: { icon: ElementType; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="mt-3 text-sm font-bold text-foreground">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
    </div>
  );
}

export default Index;
