import { motion } from "framer-motion";
import { TrendingUp, Building2, Handshake, Scale, Landmark, Target } from "lucide-react";

const audiences = [
  {
    icon: TrendingUp,
    title: "Investors",
    desc: "Underwrite faster and decide which deals are actually worth pursuing.",
  },
  {
    icon: Building2,
    title: "Developers",
    desc: "Pressure-test pricing, upside, and risk before tying up capital.",
  },
  {
    icon: Handshake,
    title: "Brokers",
    desc: "Bring sharper analysis and contract clarity to every conversation.",
  },
  {
    icon: Scale,
    title: "Attorneys",
    desc: "Surface clause risk, deadlines, and negotiation points in minutes.",
  },
  {
    icon: Landmark,
    title: "Lenders",
    desc: "Validate underwriting and risk exposure with a consistent framework.",
  },
  {
    icon: Target,
    title: "Acquisition Teams",
    desc: "Standardize how every deal gets evaluated across your pipeline.",
  },
];

export default function LandingAudience() {
  return (
    <section className="py-20 md:py-28 px-5 bg-muted/20">
      <div className="mx-auto max-w-5xl text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4"
        >
          Built for the people closing deals
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-base text-muted-foreground max-w-xl mx-auto mb-12"
        >
          Investors, developers, brokers, attorneys, lenders, and acquisition teams.
        </motion.p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {audiences.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-6 text-left hover:border-primary/20 transition-colors duration-300"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <p.icon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
