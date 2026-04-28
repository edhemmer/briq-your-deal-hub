import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import BrixIcon from "@/components/BrixIcon";

export default function LandingNav() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border/40 bg-background/70 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-5">
        <Link to="/landing" className="flex items-center gap-2.5">
          <BrixIcon size={36} className="text-primary" />
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight text-foreground">BRIQ</span>
            <span className="text-[10px] text-muted-foreground font-medium">Real Estate Deal IQ</span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Sign In
            </Button>
          </Link>
          <Link to="/register">
            <Button size="sm" className="rounded-lg text-sm font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
