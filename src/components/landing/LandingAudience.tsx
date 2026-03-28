import { motion } from "framer-motion";
import { User, Users, Briefcase } from "lucide-react";

const audiences = [
  {
    icon: User,
    title: "Solo Investors",
    desc: "Evaluate deals faster without hiring an analyst or building complex spreadsheets.",
  },
  {
    icon: Users,
    title: "Small Teams",
    desc: "Standardize how your team underwrites deals. Same framework, every time.",
  },
  {
    icon: Briefcase,
    title: "Busy Professionals",
    desc: "Invest on the side without spending your evenings on data entry.",
  },
];

export default function LandingAudience() {
  return (
    <section className="py-20 md:py-28 px-5 bg-muted/20">
      <div className="mx-auto max-w-3xl text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-12"
        >
          Built for investors who value their time
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {audiences.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
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
