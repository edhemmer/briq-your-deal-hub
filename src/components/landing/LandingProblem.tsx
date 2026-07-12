import { ArrowRight, Check, X } from "lucide-react";
import { motion } from "framer-motion";

const beforeItems = [
  "Search listings in one place, notes in another",
  "Copy numbers into fragile spreadsheets",
  "Compare strategies from memory",
  "Lose track of tasks and deadlines",
  "Rely on confidence you cannot verify",
];

const afterItems = [
  "Enter an address or listing link",
  "Create one reusable deal file",
  "Analyze every strategy with scenarios",
  "Move next actions into the pipeline",
  "See confidence, evidence, and risks",
];

export default function LandingProblem() {
  return (
    <section className="px-5 py-20 md:py-28">
      <div className="mx-auto mb-16 max-w-3xl text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold tracking-tight text-foreground md:text-4xl"
        >
          The app can be powerful without feeling complicated.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg"
        >
          BRIX organizes real estate investing around decisions, not software complexity. Each screen answers what
          matters, why it matters, what is still uncertain, and what you should do next.
        </motion.p>
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-[1fr_auto_1fr]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-border bg-card p-7"
          >
            <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Without BRIX</p>
            <div className="space-y-3.5">
              {beforeItems.map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <X className="h-3.5 w-3.5 shrink-0 text-destructive/60" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="hidden items-center justify-center md:flex">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="rounded-2xl border-2 border-primary/20 bg-primary/[0.03] p-7"
          >
            <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-primary">With BRIX</p>
            <div className="space-y-3.5">
              {afterItems.map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
