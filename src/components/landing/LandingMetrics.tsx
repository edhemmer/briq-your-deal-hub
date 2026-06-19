import { motion } from "framer-motion";

const metrics = [
  { value: "Minutes", label: "To understand what needs attention" },
  { value: "Any", label: "Legal strategy can be modeled" },
  { value: "Always", label: "Confidence, risks, and next actions shown" },
];

export default function LandingMetrics() {
  return (
    <section className="border-y border-border/40 bg-muted/30">
      <div className="mx-auto max-w-4xl px-5 py-14 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-4 text-center">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <p className="text-3xl md:text-4xl font-black text-foreground tracking-tight">{m.value}</p>
              <p className="mt-1.5 text-sm text-muted-foreground font-medium">{m.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
