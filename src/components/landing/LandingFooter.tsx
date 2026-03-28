import BriqIcon from "@/components/BriqIcon";

export default function LandingFooter() {
  return (
    <footer className="border-t border-border/40 py-10 px-5">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BriqIcon size={24} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">BRIQ</span>
          <span className="text-xs text-muted-foreground">· Real Estate Deal IQ</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Built by InLight AI · © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
