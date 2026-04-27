import { Upload, BarChart3, Brain, TrendingUp, ShieldCheck, FileText } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Upload,
    title: "Drop a Listing, Get Answers",
    description: "Paste text or drop a screenshot from any listing site. BRIX extracts the data and runs the numbers — no manual entry required.",
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
            Everything you need to evaluate a deal
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-base text-muted-foreground max-w-xl mx-auto"
          >
            Seven intelligence engines work together to give you a complete picture of every property.
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
