import { motion } from "framer-motion";
import { Building2, Compass, GraduationCap, Landmark, Target, TrendingUp } from "lucide-react";

const audiences = [
  {
    icon: Compass,
    title: "Explorers",
    desc: "Learn terms, compare strategies, and understand whether real estate investing fits your goals before you rush into a deal.",
  },
  {
    icon: GraduationCap,
    title: "First Deal Investors",
    desc: "Follow guided steps for discovery, underwriting, due diligence, offer strategy, and common first-deal mistakes.",
  },
  {
    icon: TrendingUp,
    title: "Active Investors",
    desc: "Screen more opportunities, compare returns and risk faster, and standardize how each acquisition decision is made.",
  },
  {
    icon: Building2,
    title: "Operators",
    desc: "Track pipeline work, documents, field notes, renovation scope, deadlines, and asset performance from one environment.",
  },
  {
    icon: Landmark,
    title: "Portfolio Builders",
    desc: "Evaluate capital allocation, refinance options, sell/hold decisions, concentration risk, and portfolio-level performance.",
  },
  {
    icon: Target,
    title: "Acquisition Teams",
    desc: "Use the same decision framework across users, markets, properties, strategies, documents, and pipeline stages.",
  },
];

export default function LandingAudience() {
  return (
    <section className="bg-muted/20 px-5 py-20 md:py-28">
      <div className="mx-auto max-w-5xl text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl"
        >
          Built for every level of investor
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mb-12 max-w-2xl text-base leading-relaxed text-muted-foreground"
        >
          BRIX adapts the explanation and workflow to the user, from first property research to portfolio-level
          optimization.
        </motion.p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {audiences.map((person, i) => (
            <motion.div
              key={person.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-2xl border border-border/60 bg-card/80 p-6 text-left backdrop-blur-sm transition-colors duration-300 hover:border-primary/20"
            >
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <person.icon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">{person.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{person.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
