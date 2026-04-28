import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import BrixIcon from "@/components/BrixIcon";

export default function LandingCTA() {
  return (
    <section className="py-24 md:py-32 px-5 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/[0.05] rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto max-w-2xl text-center"
      >
        <BrixIcon size={56} className="text-primary mx-auto mb-6" />
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          Better analysis. Faster decisions. Stronger deals.
        </h2>
        <p className="mt-4 text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Run your next deal through DealIQ and ContractIQ — and make sure nothing important gets missed.
        </p>
        <div className="mt-8">
          <Link to="/register">
            <Button
              size="lg"
              className="rounded-xl text-base font-semibold px-10 py-6 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 transition-all duration-300 gap-2 group"
            >
              Get Started — It's Free
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Your first deal analysis is free. No credit card required.
        </p>
      </motion.div>
    </section>
  );
}
