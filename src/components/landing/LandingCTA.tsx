import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import BrixIcon from "@/components/BrixIcon";

export default function LandingCTA() {
  return (
    <section className="relative overflow-hidden px-5 py-24 md:py-32">
      <div className="absolute bottom-0 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-primary/[0.05] blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto max-w-2xl text-center"
      >
        <BrixIcon size={56} className="mx-auto mb-6 text-primary" />
        <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Simple enough to learn fast. Serious enough to protect capital.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
          Run your next opportunity through the full BRIX workflow: discover it, analyze it, pursue it, track it, and
          optimize it after closing.
        </p>
        <div className="mt-8">
          <Link to="/register">
            <Button
              size="lg"
              className="group gap-2 rounded-xl px-10 py-6 text-base font-semibold shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/35"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Built for beginners, active investors, operators, and portfolio builders.
        </p>
      </motion.div>
    </section>
  );
}
