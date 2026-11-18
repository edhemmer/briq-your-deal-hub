import { ArrowRight, BadgeDollarSign, Calculator, LineChart, ShieldCheck } from "lucide-react";
import { MARKET_DEFAULTS } from "./core/investorMath";

const FEATURES = [
  {
    icon: Calculator,
    title: "Real cash flow, not listing math",
    text: "Vacancy, management, repairs and CapEx reserves are built in, with loan rates set to today's investment-property market.",
  },
  {
    icon: BadgeDollarSign,
    title: "Your max offer, instantly",
    text: "BRIX solves for the highest price that still hits your cash flow, cash-on-cash and DSCR targets.",
  },
  {
    icon: LineChart,
    title: "Rental vs BRRRR vs flip",
    text: "See cash left in the deal after refi, flip profit after every holding cost, and 10-year IRR side by side.",
  },
  {
    icon: ShieldCheck,
    title: "One private deal file",
    text: "Evidence, contracts, financing and decisions stay together in your account, on every device.",
  },
];

export function Landing() {
  return (
    <main className="landing">
      <section className="landing-hero">
        <div className="brand large">
          <div className="mark" aria-hidden="true"><span /><span /><span /><span /></div>
          <div><strong>BRIX</strong><small>Real Estate</small></div>
        </div>
        <p className="landing-kicker">For individual real estate investors</p>
        <h1>Know if a deal pencils before you ever tour it.</h1>
        <p>
          Enter price and rent. BRIX shows true cash flow, cash-on-cash, cap rate, DSCR and your max offer, then compares rental, BRRRR and flip on the same property.
        </p>
        <div className="landing-cta">
          <button className="primary" type="button" onClick={() => window.location.assign("/account")}>
            Analyze a deal free <ArrowRight size={18} />
          </button>
          <button className="secondary" type="button" onClick={() => window.location.assign("/app")}>I have an account</button>
        </div>
        <p className="landing-rate-note">
          Rates current as of {new Date(`${MARKET_DEFAULTS.asOf}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}: 30-year average {MARKET_DEFAULTS.primaryRate30y}% (Freddie Mac), investment loans ≈{MARKET_DEFAULTS.investmentRate30y}%.
        </p>
      </section>
      <section className="landing-grid" aria-label="What BRIX does">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <article key={title} className="landing-step">
            <span className="landing-icon" aria-hidden="true"><Icon size={20} /></span>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
