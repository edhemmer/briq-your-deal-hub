import { BarChart3, Brain, Building2, FileText, KanbanSquare, PenLine, Search, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Search,
    title: "FindIQ",
    question: "What should I investigate?",
    description: "Enter a property address or listing link, choose a strategy, create the deal file, and send it into underwriting without duplicate entry.",
  },
  {
    icon: BarChart3,
    title: "DealIQ",
    question: "Should I acquire it?",
    description: "Analyze cash flow, rent support, resale, renovation, market risk, stress cases, and strategy fit before capital is committed.",
  },
  {
    icon: KanbanSquare,
    title: "PipelineIQ",
    question: "Where is it in the process?",
    description: "Track stages, tasks, deadlines, notes, activity, health, and next actions from first review through closing.",
  },
  {
    icon: PenLine,
    title: "OfferIQ",
    question: "How should I pursue it?",
    description: "Turn DealIQ findings into offer structures, negotiation points, communications, document packages, and due diligence workflows.",
  },
  {
    icon: Building2,
    title: "PortfolioIQ",
    question: "How is it performing?",
    description: "After closing, monitor asset value, equity, debt, cash flow, documents, risk, refinance opportunities, and long-term portfolio health.",
  },
  {
    icon: Brain,
    title: "AI Intelligence Layer",
    question: "What matters and why?",
    description: "Explain recommendations, surface missing data, challenge assumptions, compare alternatives, and adapt guidance to the investor's experience level.",
  },
  {
    icon: ShieldCheck,
    title: "Trust Architecture",
    question: "Can I rely on this?",
    description: "Every major output shows confidence, evidence, assumptions, source quality, risks, alternatives, and what still needs verification.",
  },
  {
    icon: FileText,
    title: "Reports and Memos",
    question: "How do I share the decision?",
    description: "Create acquisition memos, investor-ready reports, exports, and decision records that make the logic easy to review and challenge.",
  },
];

export default function LandingFeatures() {
  return (
    <section className="relative overflow-hidden px-5 py-20 md:py-28">
      <div className="absolute inset-0 bg-muted/20" />
      <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.03] blur-[100px]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold tracking-tight text-foreground md:text-4xl"
          >
            One operating system, five simple questions
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground"
          >
            BRIX keeps each module focused so investors can move quickly without losing accuracy, context, or risk visibility.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="group rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/[0.06]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-colors duration-300 group-hover:bg-primary/15">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-primary">{feature.question}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
