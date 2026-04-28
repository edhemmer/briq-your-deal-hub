import { motion } from "framer-motion";

const steps = [
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
];

export default function LandingHowItWorks() {
  return (
    <section className="py-20 md:py-28 px-5">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Three steps to a smarter decision
          </h2>
        </motion.div>

        <div className="space-y-10">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex gap-6 items-start group"
            >
              <div className="relative shrink-0">
                <span className="text-4xl font-black text-primary/15 tabular-nums leading-none pt-1 block group-hover:text-primary/25 transition-colors duration-300">
                  {s.step}
                </span>
                {i < steps.length - 1 && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full h-10 w-px bg-border/60" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{s.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
