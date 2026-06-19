import SEO from "@/components/SEO";
import LandingNav from "@/components/landing/LandingNav";
import LandingHero from "@/components/landing/LandingHero";
import LandingMetrics from "@/components/landing/LandingMetrics";
import LandingProblem from "@/components/landing/LandingProblem";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingAudience from "@/components/landing/LandingAudience";
import LandingCTA from "@/components/landing/LandingCTA";
import LandingFooter from "@/components/landing/LandingFooter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="BRIX Real Estate - Acquisition Intelligence Operating System"
        description="BRIX helps investors find, analyze, pursue, track, and optimize real estate opportunities with clear recommendations, visible confidence, risk checks, and training for every strategy."
        path="/landing"
      />
      <LandingNav />
      <main>
        <LandingHero />
        <LandingMetrics />
        <LandingProblem />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingAudience />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
