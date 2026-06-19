import { motion } from "framer-motion";

const steps = [
  {
    step: "01",
    title: "Set your acquisition profile",
    description: "Tell BRIX your budget, markets, property type, goals, risk profile, and preferred strategies.",
  },
  {
    step: "02",
    title: "Review ranked opportunities",
    description: "FindIQ shows which properties deserve attention and explains why they match or miss your profile.",
  },
  {
    step: "03",
    title: "Underwrite the strategy",
    description: "DealIQ compares financials, risks, rent support, resale, rehab, scenarios, and alternative strategies.",
  },
  {
    step: "04",
    title: "Move from decision to action",
    description: "PipelineIQ and OfferIQ turn the recommendation into tasks, deadlines, offer options, and communications.",
  },
  {
    step: "05",
    title: "Operate what you own",
    description: "PortfolioIQ carries the history forward so equity, cash flow, risk, documents, and next moves remain visible.",
  },
];

export default function LandingHowItWorks() {
  return (
    <section className="px-5 py-20 md:py-28">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Learn it once. Use it for every deal.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            The workflow stays consistent whether you are buying your first rental, comparing flips, testing a BRRRR,
            negotiating seller finance, or deciding whether to refinance or sell.
          </p>
        </motion.div>

        <div className="space-y-10">
          {steps.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group flex items-start gap-6"
            >
              <div className="relative shrink-0">
                <span className="block pt-1 text-4xl font-black leading-none text-primary/15 tabular-nums transition-colors duration-300 group-hover:text-primary/25">
                  {item.step}
                </span>
                {i < steps.length - 1 && (
                  <div className="absolute left-1/2 top-full h-10 w-px -translate-x-1/2 bg-border/60" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
