import { Link } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function LandingHero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-5 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/[0.06] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-20 right-1/4 w-[300px] h-[300px] bg-primary/[0.04] rounded-full blur-[80px] pointer-events-none" />

      <div className="relative mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-4 py-1.5 mb-8"
        >
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">DealIQ + ContractIQ — built for real transactions</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl md:text-[3.5rem] lg:text-6xl font-bold tracking-tight text-foreground leading-[1.08]"
        >
          Better analysis. Faster decisions.
          <br />
          <span className="bg-gradient-to-r from-primary to-[hsl(199,89%,48%)] bg-clip-text text-transparent">
            Stronger deals.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto"
        >
          BRIQ helps real estate investors and operators move faster with two modules built for real transactions. <span className="text-foreground font-medium">DealIQ</span> analyzes pricing, underwriting, risk, and upside from a property address and key inputs. <span className="text-foreground font-medium">ContractIQ</span> reviews contracts from the buyer or seller perspective — surfacing pros, cons, deadlines, and smart questions to ask.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/register">
            <Button
              size="lg"
              className="rounded-xl text-base font-semibold px-8 py-6 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 transition-all duration-300 gap-2 group"
            >
              Analyze Your First Deal
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg" className="rounded-xl text-base font-medium px-8 py-6 border-border/60 hover:border-border transition-colors">
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
          Free to start · No credit card required
        </motion.p>
      </div>
    </section>
  );
}
