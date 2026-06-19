import { Link } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function LandingHero() {
  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-32 md:pb-32 md:pt-44">
      <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary/[0.06] blur-[120px]" />
      <div className="absolute right-1/4 top-20 h-[300px] w-[300px] rounded-full bg-primary/[0.04] blur-[80px]" />

      <div className="relative mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-4 py-1.5"
        >
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">
            Chaos to Clarity - simple acquisition intelligence for every strategy
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-[3.5rem] lg:text-6xl"
        >
          Real estate investing made clear enough to act.
          <br />
          <span className="bg-gradient-to-r from-primary to-[hsl(199,89%,48%)] bg-clip-text text-transparent">
            Find, analyze, pursue, and optimize with confidence.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
        >
          BRIX turns listings, market data, photos, documents, assumptions, and strategy questions into one guided
          workflow. It is quick to learn, conservative with uncertainty, and built for any legal real estate strategy at
          any stage of the investment lifecycle.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link to="/register">
            <Button
              size="lg"
              className="group gap-2 rounded-xl px-8 py-6 text-base font-semibold shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/35"
            >
              Start Your First Analysis
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <Link to="/login">
            <Button
              variant="outline"
              size="lg"
              className="rounded-xl border-border/60 px-8 py-6 text-base font-medium transition-colors hover:border-border"
            >
              Sign In
            </Button>
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-5 text-xs text-muted-foreground"
        >
          Free to start. No credit card required.
        </motion.p>
      </div>
    </section>
  );
}
