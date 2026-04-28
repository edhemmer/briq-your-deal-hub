import { FileSignature, Calculator, Brain, TrendingUp, ShieldCheck, FileText } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: FileSignature,
    title: "ContractIQ Intake",
    description: "Drop a PDF purchase agreement, .eml or pasted email, XLSX terms sheet, or Word contract. ContractIQ parses, maps, and pre-fills every field with a confidence badge — you review before analyze.",
  },
  {
    icon: Calculator,
    title: "Real-Time Deterministic Math",
    description: "Cap rate, cash-on-cash, DSCR, and cash flow recompute live on every input change. Same inputs always produce the same answer — no AI guessing on the numbers.",
  },
  {
    icon: Brain,
    title: "Deal Intelligence Scoring",
    description: "A canonical engine combines financials, market signals, and risk into one composite score with a clear Proceed / Caution / Pass guidance.",
  },
  {
    icon: TrendingUp,
    title: "Forward-Looking Market Signals",
    description: "3–5 year outlook on population, jobs, supply, and rent growth — pulled from a dated, transparent rate table so you always see when the data was sourced.",
  },
  {
    icon: ShieldCheck,
    title: "Stress Testing & Hidden Risk",
    description: "Rate hikes, vacancy spikes, rent drops, and structural risk flags — surfaced before you commit capital. Conservative defaults (6% closing, 25% down, 7.0% rate) when data is missing.",
  },
  {
    icon: FileText,
    title: "Investor-Ready Reports",
    description: "Export structured PDF and CSV briefs that summarize every analysis layer — share with partners, lenders, or keep for your own records.",
  },
];

export default function LandingFeatures() {
  return (
    <section className="py-20 md:py-28 px-5 relative overflow-hidden">
      {/* Subtle background accent */}
      <div className="absolute inset-0 bg-muted/20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="relative mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold tracking-tight text-foreground"
          >
            Two modules built for real transactions
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-base text-muted-foreground max-w-xl mx-auto"
          >
            DealIQ decides if the deal is worth pursuing. ContractIQ makes sure nothing important gets missed.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-7 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/[0.06] transition-all duration-300"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors duration-300">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
