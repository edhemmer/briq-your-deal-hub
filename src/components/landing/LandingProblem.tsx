import { ArrowRight, X, Check } from "lucide-react";
import { motion } from "framer-motion";

const beforeItems = [
  "Copy listing data by hand",
  "Build spreadsheet models",
  "Research market separately",
  "Guess at risk factors",
  "Hours per deal",
];

const afterItems = [
  "Drop a listing, data extracted",
  "Financials calculated instantly",
  "Market intelligence included",
  "Risk scored automatically",
  "Minutes per deal",
];

export default function LandingProblem() {
  return (
    <section className="py-20 md:py-28 px-5">
      <div className="mx-auto max-w-3xl text-center mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold tracking-tight text-foreground"
        >
          Deal analysis shouldn't take all day
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto"
        >
          Most investors spend hours copying data into spreadsheets, cross-referencing market reports, and second-guessing their numbers. BRIX consolidates every step into one structured workflow.
        </motion.p>
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-stretch">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-border bg-card p-7"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-5">Before</p>
            <div className="space-y-3.5">
              {beforeItems.map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <X className="h-3.5 w-3.5 text-destructive/60 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="hidden md:flex items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
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
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-5">With BRIX</p>
            <div className="space-y-3.5">
              {afterItems.map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-foreground font-medium">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
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
