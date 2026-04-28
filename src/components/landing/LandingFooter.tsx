import BrixIcon from "@/components/BrixIcon";

export default function LandingFooter() {
  return (
    <footer className="border-t border-border/40 py-10 px-5">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-baseline gap-1.5">
          <BrixIcon size={24} className="text-primary self-center" />
          <span className="text-sm font-extrabold tracking-tight text-foreground leading-none">BRIX</span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground leading-none">Real Estate</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Built by InLight AI · © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
