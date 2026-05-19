/**
 * ContractIQ — paralegal-grade supplemental rules.
 *
 * Pure deterministic. Returns additive findings for the main engine to merge.
 * Covers: deal structure, tax/proration accounting, FIRPTA/1031, options &
 * lease-options, wholesale assignment, seller-carry, commercial diligence,
 * title/deed/escrow, broker commission, and risk-shifting clauses.
 */

import type {
  CanonicalContractExtraction,
  DealStructure,
  PaidBy,
} from "./contractDataMapper";
import type {
  Perspective,
  Pro,
  Con,
  Weakness,
  Question,
  NegotiationMove,
  BrokerQuestion,
  Severity,
  WhoPaysRow,
  LiabilityRow,
} from "./contractIQEngine";

const val = <T>(f?: { value: T | null } | null): T | null => (f ? f.value : null);
const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export interface RulesOutput {
  pros: Pro[];
  cons: Con[];
  weaknesses: Weakness[];
  questions: Question[];
  brokerQuestions: BrokerQuestion[];
  negotiation: NegotiationMove[];
  whoPaysWhat: WhoPaysRow[];
  liabilityAllocation: LiabilityRow[];
  dealStructureLabel: string;
  closingAccounting: ClosingAccountingRow[];
}

export interface ClosingAccountingRow {
  id: string;
  category: "Acquisition" | "Title & Recording" | "Taxes" | "Prorations" | "Lender" | "Other";
  item: string;
  buyer: boolean;
  seller: boolean;
  estimatedAmount: number | null;
  notes: string;
}

const STRUCTURE_LABELS: Record<Exclude<DealStructure, null>, string> = {
  cash: "All-cash purchase",
  conventional: "Conventional financed purchase",
  fha: "FHA-insured residential loan",
  va: "VA-guaranteed loan",
  usda: "USDA Rural Development loan",
  fannie_mae: "Fannie Mae agency multifamily (DUS)",
  freddie_mac: "Freddie Mac agency multifamily (Optigo)",
  hud_223f: "HUD 223(f) — multifamily acquisition / refi",
  hud_221d4: "HUD 221(d)(4) — multifamily new construction / sub-rehab",
  hud_232: "HUD 232 — healthcare / senior housing",
  fha_multifamily: "FHA multifamily insured loan",
  cmbs: "CMBS (conduit) commercial loan",
  sba_504: "SBA 504 (owner-user real estate)",
  sba_7a: "SBA 7(a) (owner-user / business + RE)",
  dscr_loan: "DSCR investor loan",
  non_qm: "Non-QM / alt-doc loan",
  construction_loan: "Construction loan",
  bridge_loan: "Bridge / transitional loan",
  mezzanine: "Mezzanine debt",
  preferred_equity: "Preferred equity",
  hard_money: "Hard-money / bridge financed",
  private_lender: "Private-lender financed",
  seller_financing: "Seller-financed (owner-carry note)",
  subject_to: "Subject-to existing financing",
  wrap_mortgage: "Wrap-around mortgage",
  assumption: "Loan assumption",
  lease_option: "Lease with option to purchase",
  option_to_purchase: "Pure option contract",
  assignment_wholesale: "Assignment / wholesale flip",
  "1031_exchange": "1031 like-kind exchange",
  installment_sale: "Installment sale / land contract",
  joint_venture: "Joint venture / partnership acquisition",
  auction: "Auction / courthouse-step sale",
  reo_bank_owned: "REO / bank-owned acquisition",
  short_sale: "Short sale (lender approval required)",
  tax_deed: "Tax-deed / tax-lien acquisition",
  foreclosure: "Foreclosure / trustee-sale acquisition",
  reverse_exchange: "Reverse 1031 exchange",
  build_to_suit: "Build-to-suit",
  ground_lease: "Ground lease (leasehold acquisition)",
  sale_leaseback: "Sale-leaseback",
  tic_delaware_statutory_trust: "TIC / Delaware Statutory Trust (DST)",
  opportunity_zone: "Qualified Opportunity Zone investment",
  unknown: "Standard purchase (structure not stated)",
};

export function runParalegalRules(
  e: CanonicalContractExtraction | null,
  perspective: Perspective,
  price: number,
  state: string | null,
): RulesOutput {
  const p = perspective;
  const opp: Perspective = p === "buyer" ? "seller" : "buyer";
  const pros: Pro[] = [];
  const cons: Con[] = [];
  const weaknesses: Weakness[] = [];
  const questions: Question[] = [];
  const brokerQuestions: BrokerQuestion[] = [];
  const negotiation: NegotiationMove[] = [];
  const whoPaysWhat: WhoPaysRow[] = [];
  const liabilityAllocation: LiabilityRow[] = [];
  const closingAccounting: ClosingAccountingRow[] = [];

  const addCon = (id: string, label: string, sev: Severity, detail: string, affects: Perspective | "both" = p) => {
    if (affects === p || affects === "both") cons.push({ id, label, severity: sev, detail });
  };
  const addPro = (id: string, label: string, detail: string, favors: Perspective | "both" = p) => {
    if (favors === p || favors === "both") pros.push({ id, label, detail });
  };
  const addQ = (id: string, q: string, why: string, cat: Question["category"]) =>
    questions.push({ id, question: q, why, category: cat });
  const addBQ = (id: string, q: string, why: string) => brokerQuestions.push({ id, question: q, why });
  const addMove = (id: string, ask: string, rationale: string) => negotiation.push({ id, ask, rationale });
  const addWeak = (id: string, label: string, detail: string) => weaknesses.push({ id, label, detail });
  const addPays = (id: string, item: string, paidBy: PaidBy | "unspecified", notes: string) =>
    whoPaysWhat.push({
      id, item,
      buyer: paidBy === "buyer",
      seller: paidBy === "seller",
      notes: paidBy === "split" ? "Split between buyer and seller" : paidBy === "unspecified" ? "Not specified — defaults to local custom" : notes,
    });
  const addLiab = (id: string, item: string, party: LiabilityRow["party"], when: string, why: string) =>
    liabilityAllocation.push({ id, item, party, when, why });
  const addAcct = (row: ClosingAccountingRow) => closingAccounting.push(row);

  const structure: DealStructure = val(e?.deal_structure) ?? "unknown";
  const dealStructureLabel = STRUCTURE_LABELS[structure ?? "unknown"];
  const stateUp = (state ?? "").toUpperCase();

  // ===== Deal-structure specific paralegal rules =====
  if (structure === "cash") {
    addPro("cash_clean", "All-cash structure", "No financing or appraisal contingency exposure; cleanest close path.", "both");
    if (p === "seller") addPro("cash_close", "Faster close cycle typical", "Cash deals usually close in 14–21 days vs 30–45 financed.");
    addQ("pof", "Has verified proof of funds (bank letter, statement) been delivered within the last 30 days?", "Cash claims without recent POF are a common stall tactic.", "financial");
  }

  if (structure === "hard_money" || structure === "private_lender") {
    if (p === "buyer") {
      addCon("hm_cost", "Hard-money / private-lender financing", "moderate", "Expect 8–13% rates, 2–4 points, 6–18 month terms, and balloon. Underwrite refinance exit explicitly.", "buyer");
      addQ("hm_exit", "What is the refinance or sale exit before the balloon?", "Hard money without a clear exit creates refinance default risk.", "financial");
    } else {
      addCon("hm_seller", "Buyer using hard money", "moderate", "Hard-money lenders pull funding more often than banks. Tighten EM and shorten financing window.", "seller");
      addMove("hm_short_fin", "Shorten financing contingency to 14 days and require term sheet within 5 days", "Limits exposure to lender pull.");
    }
  }

  // ===== Agency / GSE multifamily (Fannie DUS, Freddie Optigo) =====
  if (structure === "fannie_mae" || structure === "freddie_mac") {
    const agency = structure === "fannie_mae" ? "Fannie Mae DUS" : "Freddie Mac Optigo";
    addPro("agency_terms", `${agency} financing`, "Non-recourse (with standard carve-outs), 10-yr fixed, 30-yr amortization, assumable. Best-in-class CRE debt terms for stabilized multifamily.", "both");
    if (p === "buyer") {
      addQ("agency_size", "Does the deal meet agency minimums (typically $1M Small Balance / $7.5M conventional)?", "Below-threshold deals fall to portfolio or CMBS execution with worse terms.", "financial");
      addQ("agency_occ", "Is the property ≥90% physical and 85% economic occupancy for 90+ days?", "Agency seasoning requirements for stabilized execution.", "financial");
      addQ("agency_repl", "Are replacement-reserve and tax/insurance escrows underwritten ($250–$300/unit/yr typical)?", "Mandatory escrows reduce free cash flow vs proforma.", "financial");
      addCon("agency_prepay", "Yield maintenance / defeasance prepayment", "moderate", "Agency loans carry YM or defeasance — refinance/sale before maturity can cost 5–15% of loan balance in a falling-rate environment.", "buyer");
      addQ("agency_carve", "Have the bad-boy carve-outs and sponsor net-worth / liquidity tests been reviewed?", "Carve-outs convert non-recourse to recourse on fraud, waste, environmental, bankruptcy.", "legal");
    }
    addAcct({ id: "acct_agency_fee", category: "Lender", item: `${agency} origination + due diligence`, buyer: true, seller: false, estimatedAmount: price > 0 ? price * 0.01 : null, notes: "Typical 1% origination + $25–75k third-party reports (appraisal, PCNA, Phase I, seismic if applicable)." });
    addAcct({ id: "acct_agency_esc", category: "Lender", item: "Replacement / T&I escrows (initial deposit)", buyer: true, seller: false, estimatedAmount: null, notes: "Funded at close; recurring monthly thereafter." });
  }

  // ===== HUD / FHA multifamily & healthcare =====
  if (structure === "hud_223f" || structure === "hud_221d4" || structure === "hud_232" || structure === "fha_multifamily") {
    const prog = structure === "hud_223f" ? "HUD 223(f)" : structure === "hud_221d4" ? "HUD 221(d)(4)" : structure === "hud_232" ? "HUD 232" : "FHA multifamily";
    addPro("hud_terms", `${prog} financing`, "35–40 yr fully-amortizing, non-recourse, low fixed rate, assumable. Best long-duration CRE debt available.", "both");
    if (p === "buyer") {
      addCon("hud_time", `${prog} timeline`, "high", "HUD processing runs 6–12 months from application to firm commitment. Standard 30–60 day contracts cannot accommodate — secure extensions or bridge-to-HUD.", "buyer");
      addQ("hud_extensions", "Are sufficient closing extensions or bridge financing arranged for HUD's 6–12 month timeline?", "HUD deals routinely die at close from timing mismatch.", "timeline");
      addQ("hud_davis", "Does Davis-Bacon prevailing-wage apply (221(d)(4))?", "Raises construction cost ~10–20% and lengthens schedule.", "financial");
      addQ("hud_regagree", "Has the HUD Regulatory Agreement been reviewed (rent restrictions, distributions, reserves)?", "Reg-A binds for the life of the loan — caps distributions and operational flexibility.", "legal");
      addQ("hud_lihtc", "Is LIHTC, Section 8 HAP, or other affordability layered with the HUD loan?", "Layered subsidies add compliance and impact equity returns.", "legal");
    }
    addAcct({ id: "acct_hud_mip", category: "Lender", item: `${prog} MIP (mortgage insurance premium)`, buyer: true, seller: false, estimatedAmount: price > 0 ? price * 0.0025 : null, notes: "Upfront ~0.25% + ongoing ~0.25–0.65%/yr on loan balance." });
    addAcct({ id: "acct_hud_app", category: "Lender", item: "HUD application + third-party reports", buyer: true, seller: false, estimatedAmount: 75000, notes: "Appraisal, market study, PCNA, environmental, architectural — typically $50–125k." });
  }

  // ===== CMBS conduit =====
  if (structure === "cmbs") {
    addPro("cmbs_lev", "CMBS execution", "Higher leverage (up to 75% LTV), non-recourse, fixed rate, IO available — best for stabilized commercial.", "both");
    if (p === "buyer") {
      addCon("cmbs_def", "Defeasance prepayment", "moderate", "CMBS loans are defeased (Treasury portfolio substitution), not prepaid. Defeasance cost can exceed 10% of balance in falling-rate periods.", "buyer");
      addCon("cmbs_serv", "Special-servicer risk", "moderate", "Modifications, assumptions, lease consents go through master/special servicer with 30–90 day response times and fees.", "buyer");
      addQ("cmbs_carve", "Have non-recourse carve-outs and sponsor net-worth covenants been reviewed?", "Same bad-boy carve-out exposure as agency loans.", "legal");
      addQ("cmbs_cash", "Are cash-management / lockbox triggers (DSCR, occupancy) set at reasonable thresholds?", "Springing lockboxes can sweep cash flow during temporary dips.", "financial");
    }
    addAcct({ id: "acct_cmbs", category: "Lender", item: "CMBS origination + legal", buyer: true, seller: false, estimatedAmount: price > 0 ? price * 0.012 : null, notes: "1% origination + lender legal ~$50–100k + third-party reports." });
  }

  // ===== SBA 504 / 7(a) — owner-user =====
  if (structure === "sba_504" || structure === "sba_7a") {
    const prog = structure === "sba_504" ? "SBA 504" : "SBA 7(a)";
    addPro("sba_terms", `${prog} financing`, "Up to 90% LTV, low down payment, 25-yr amortization, below-market blended rates for owner-user real estate.", "buyer");
    if (p === "buyer") {
      addCon("sba_owneruser", `${prog} owner-occupancy requirement`, "moderate", "Borrower must occupy ≥51% of an existing building (60% new construction). Pure investment use is ineligible.", "buyer");
      addCon("sba_pg", "Personal guaranty required", "moderate", "All 20%+ owners must personally guarantee. No non-recourse option.", "buyer");
      addQ("sba_size", "Does the borrower meet SBA size standards (NAICS-based)?", "Affiliation rules can disqualify deals with related entities.", "financial");
      addQ("sba_environmental", "Has SBA environmental screening (RSRA or Phase I) been ordered?", "SBA has strict environmental triggers — typically required even on low-risk property.", "property");
    }
    addAcct({ id: "acct_sba", category: "Lender", item: `${prog} guaranty / CDC fees`, buyer: true, seller: false, estimatedAmount: price > 0 ? price * 0.025 : null, notes: prog === "SBA 504" ? "CDC fee ~2.15% on debenture + bank fees" : "Guaranty fee 2–3.75% of guaranteed portion." });
  }

  // ===== DSCR investor loan =====
  if (structure === "dscr_loan") {
    addPro("dscr_noincome", "DSCR loan", "Qualifies on property cash flow (DSCR ≥1.0–1.25), not personal income — entity-friendly, fast close.", "buyer");
    if (p === "buyer") {
      addCon("dscr_rate", "DSCR rate premium", "low", "Typically 1.0–2.0% above conforming. Prepay penalties (3-2-1, 5-4-3-2-1) standard.", "buyer");
      addQ("dscr_ratio", "What DSCR threshold is the loan sized to, and at what stress vacancy?", "Lender stress assumptions drive max loan amount and reserve requirements.", "financial");
    }
  }

  // ===== Construction / bridge =====
  if (structure === "construction_loan") {
    addCon("constr_complex", "Construction loan", "high", "Interest reserve, draw schedule, completion guaranty, retainage — material default exposure if budget slips or schedule lengthens.", "buyer");
    addQ("constr_gc", "Has the GC contract (lump-sum vs GMP vs cost-plus) and surety bonding been reviewed?", "Owner bears overruns absent a bonded lump-sum or GMP with hard cap.", "financial");
    addQ("constr_takeout", "Is permanent (mini-perm or agency) takeout commitment in place?", "Construction-only loans without forward takeout face refinance risk at C/O.", "financial");
    addAcct({ id: "acct_constr_res", category: "Lender", item: "Interest reserve + contingency", buyer: true, seller: false, estimatedAmount: null, notes: "Typically 10–15% of hard costs + 6–12 mo interest reserve." });
  }

  if (structure === "bridge_loan") {
    addCon("bridge_cost", "Bridge / transitional loan", "moderate", "Typically SOFR+300–600, 12–36 mo term, 1–2 points in + out, extensions on milestones (lease-up, DSCR).", "buyer");
    addQ("bridge_exit", "What is the takeout (agency, CMBS, sale)? Is the underwriting consistent with current market rates?", "Bridge defaults concentrate at maturity when takeout underwrites tighter than initial proforma.", "financial");
  }

  if (structure === "mezzanine" || structure === "preferred_equity") {
    const layer = structure === "mezzanine" ? "Mezzanine debt" : "Preferred equity";
    addCon("mezz_cost", layer, "moderate", `${layer} typically 10–14% pay rate + accrual, intercreditor with senior lender required. Forced-sale rights on default.`, "buyer");
    addQ("mezz_inter", "Has the intercreditor / recognition agreement with senior been finalized?", "Most mezz deals die on intercreditor terms (cure rights, standstill, voting).", "legal");
  }

  // ===== USDA Rural =====
  if (structure === "usda") {
    addPro("usda_100", "USDA Rural Development loan", "Up to 100% LTV, no down payment, for eligible rural properties and income-qualified borrowers.", "buyer");
    addQ("usda_eligible", "Has the property address been confirmed eligible in the USDA Property Eligibility map?", "Eligibility is parcel-specific — recent boundary changes can disqualify.", "property");
    addQ("usda_income", "Is the borrower under the USDA income limit for the county (typically 115% of AMI)?", "Income cap is an absolute disqualifier.", "financial");
  }

  // ===== FHA / VA residential =====
  if (structure === "fha") {
    addCon("fha_minprop", "FHA minimum property standards", "moderate", "HUD Handbook 4000.1 — peeling paint, missing handrails, roof life <2 yr, exposed wiring all trigger repair conditions before funding.", p);
    addQ("fha_appraisal", "Has an FHA-approved appraiser ordered and reviewed the property?", "FHA appraisals are stricter than conventional and often require repair escrows.", "property");
    addAcct({ id: "acct_fha_mip", category: "Lender", item: "FHA upfront MIP (1.75%)", buyer: true, seller: false, estimatedAmount: price > 0 ? price * 0.0175 : null, notes: "Plus annual MIP 0.45–1.05% added to monthly payment." });
  }
  if (structure === "va") {
    addPro("va_nodp", "VA loan", "0% down, no PMI, capped fees — best residential financing for eligible veterans.", "buyer");
    addQ("va_funding", "Has the VA funding fee (1.4–3.6%) been factored, or is the borrower exempt (disability)?", "Funding fee can be financed but materially impacts LTV and payment.", "financial");
    addQ("va_mpr", "Has a VA-approved appraiser confirmed Minimum Property Requirements?", "MPRs (heating, water, roof, termite in southern states) drive repair conditions.", "property");
  }

  // ===== Distressed acquisitions =====
  if (structure === "reo_bank_owned") {
    addCon("reo_asis", "REO / bank-owned sale", "moderate", "Banks sell as-is, refuse repair credits, use proprietary addenda that override standard contract terms, and impose per-diem late penalties.", p);
    addQ("reo_addenda", "Has the bank's addendum been reviewed for override of inspection, title, and timing terms?", "REO addenda routinely waive seller disclosures and shorten timelines.", "legal");
  }
  if (structure === "short_sale") {
    addCon("ss_time", "Short sale", "high", "Requires lender approval — 60–180 day process with no guarantee. Bank may counter price, demand seller cash contribution, or reject.", p);
    addQ("ss_approval", "Has the short-sale package been submitted and is there a written approval letter?", "Verbal approvals are not binding; written approval letters have expiration dates.", "legal");
  }
  if (structure === "tax_deed" || structure === "foreclosure") {
    addCon("td_title", structure === "tax_deed" ? "Tax-deed acquisition" : "Foreclosure / trustee sale", "high", "Title delivered subject to clouds (IRS liens, junior mortgages, redemption rights). Quiet-title action often required (6–18 months, $3–10k).", "buyer");
    addQ("td_redeem", "What is the statutory redemption period in this state?", "Owner / lienholder can redeem and unwind the sale during the period (e.g. IL: 2.5 yr tax-deed; CA: 1 yr judicial foreclosure).", "legal");
    addQ("td_title_ins", "Will a title insurer underwrite this property without a quiet-title judgment?", "Most insurers require quiet-title before issuing a clean policy.", "legal");
  }

  // ===== Ground lease / sale-leaseback =====
  if (structure === "ground_lease") {
    addCon("gl_leasehold", "Ground-lease (leasehold) interest", "moderate", "You own improvements, not the land. Lease term, rent reset, reversion, and lender estoppels drive all value.", "buyer");
    addQ("gl_term", "What is the remaining lease term, and are rent resets CPI-capped or fair-market?", "Remaining term <50 yr or uncapped FMV resets materially impair financeability and resale.", "financial");
    addQ("gl_lender", "Will conventional lenders finance a leasehold with this remaining term?", "Most lenders require remaining term ≥ loan term + 10–20 yr.", "financial");
    addQ("gl_sndaa", "Is there a recorded SNDA / non-disturbance from the fee owner?", "Without it, lender loses leasehold if fee owner defaults / lease terminates.", "legal");
  }
  if (structure === "sale_leaseback") {
    addPro("slb_capital", "Sale-leaseback", "Unlocks owner-occupant equity while retaining operational control via lease.", p === "seller" ? "seller" : "buyer");
    addQ("slb_term", "What are lease term, rent escalators, renewal options, and credit of the operating tenant?", "Cap-rate and resale of leased-back property depend entirely on lease economics and tenant credit.", "financial");
    addQ("slb_nnn", "Is the lease NNN with tenant-paid taxes, insurance, and CAM?", "Gross or modified-gross leases shift operating risk back to landlord.", "financial");
  }

  // ===== TIC / DST and Opportunity Zone =====
  if (structure === "tic_delaware_statutory_trust") {
    addPro("dst_1031", "DST / TIC interest", "Eligible 1031 replacement property; passive ownership; institutional-quality assets accessible at low minimums.", "buyer");
    addCon("dst_control", "No operational control", "moderate", "DST sponsor has full control; investors cannot vote on financing, sale, or major leases ('7 deadly sins' restrictions).", "buyer");
    addQ("dst_fees", "What are upfront load, ongoing sponsor fees, and projected exit cap?", "DST loads (8–15%) materially reduce 1031-equivalent equity vs direct ownership.", "financial");
  }
  if (structure === "opportunity_zone") {
    addPro("oz_tax", "Qualified Opportunity Zone (QOZ) investment", "Deferral of original capital gain to 2026, and tax-free appreciation on QOF investment held ≥10 yr.", "buyer");
    addQ("oz_substantial", "Will the substantial improvement test be met (double the basis of improvements within 30 months)?", "Failure forfeits OZ benefits and triggers full gain recognition.", "financial");
    addQ("oz_180", "Was the QOF investment made within 180 days of the triggering gain?", "Hard deadline — no extensions.", "timeline");
  }

  if (structure === "seller_financing" || structure === "installment_sale") {
    const amt = val(e?.seller_carry_amount);
    const rate = val(e?.seller_carry_rate);
    const term = val(e?.seller_carry_term_years);
    const balloon = val(e?.balloon_payment) === true;
    if (p === "seller") {
      addCon("sf_risk", "Seller carryback exposes you to buyer default", "high", "If buyer defaults you must foreclose or forfeit. Demand 20–30% down, personal guaranty, and Dodd-Frank-compliant note (if owner-occ residential).", "seller");
      addQ("sf_dodd", "Does the note comply with Dodd-Frank / SAFE Act if buyer is owner-occupant?", "Residential seller-financing to owner-occupants requires RMLO or exemption.", "legal");
      addQ("sf_guaranty", "Is there a personal guaranty if buyer is an LLC?", "Entity-only liability often leaves the seller without recourse.", "legal");
      addMove("sf_due_on_sale", "Add due-on-sale and due-on-encumbrance clauses + late-fee + acceleration", "Standard protective covenants in carryback notes.");
    } else {
      addPro("sf_flex", "Seller financing", "Avoids bank underwriting, faster close, often more flexible terms.");
      if (balloon) addCon("sf_balloon", "Balloon payment on seller carry", "high", `${term ? term + "-year" : "Short-term"} note with balloon requires a refinance plan well before maturity.`, "buyer");
    }
    if (amt != null && rate != null && term != null) {
      addAcct({ id: "acct_sf", category: "Lender", item: `Seller carry note (${rate}% / ${term}yr${balloon ? ", balloon" : ""})`, buyer: true, seller: false, estimatedAmount: amt, notes: "Recorded as second or first lien per contract." });
    }
  }

  if (structure === "subject_to") {
    addCon("sub2_dos", "Subject-to existing financing", "high", "Triggers due-on-sale clause in existing mortgage. Lender can call the loan at any time post-close.", "both");
    addQ("sub2_dos_q", "How will due-on-sale risk be mitigated (land trust, insurance reserves, refinance plan)?", "Sub-to deals carry latent default exposure for both parties.", "legal");
    addQ("sub2_pf", "Will an authorization-to-release form let buyer monitor the loan?", "Without it, buyer cannot confirm payments are being received post-close.", "financial");
  }

  if (structure === "wrap_mortgage") {
    addCon("wrap_dos", "Wrap-around mortgage", "high", "Wrap depends on underlying lender not calling the senior loan; identical due-on-sale risk as sub-to.", "both");
    addQ("wrap_servicer", "Will a third-party loan servicer collect and remit the senior payment?", "Servicer creates audit trail and reduces missed-payment risk.", "financial");
  }

  if (structure === "assumption") {
    addCon("assume_qual", "Loan assumption", "moderate", "Lender must approve buyer (credit, DTI, reserves). Assumption fees typical 0.5–1%.", p);
    addQ("assume_release", "Will the original borrower be released from liability post-assumption?", "Without release, the seller stays on the hook if buyer defaults.", "legal");
  }

  if (structure === "lease_option") {
    const monthly = val(e?.monthly_rent_lease_option);
    const credit = val(e?.rent_credit_to_purchase);
    const optFee = val(e?.option_fee);
    const period = val(e?.option_period_days);
    if (p === "buyer") {
      addPro("lo_path", "Lease-option path to ownership", "Locks the strike price while you build credit / income for financing.");
      if (optFee != null && price > 0 && optFee / price < 0.02)
        addPro("lo_low_fee", "Low option fee", `${fmt(optFee)} (${((optFee / price) * 100).toFixed(2)}% of strike) — modest capital at risk.`);
      addQ("lo_recharacterize", "Is there risk the IRS / court recharacterizes this as an installment sale?", "Heavy rent credits + long terms can convert lease-options into disguised sales, changing tax treatment and remedies.", "legal");
    } else {
      addCon("lo_recharacterize_s", "Recharacterization risk", "moderate", "Excess rent-credit + long option period can recharacterize this as an installment sale (eviction no longer available; foreclosure required).", "seller");
      addQ("lo_above_mkt", "Is monthly rent at or above market and rent credit ≤25% of market rent?", "Protects against recharacterization.", "legal");
    }
    if (monthly && credit && monthly > 0 && credit / monthly > 0.5)
      addCon("lo_credit_high", "Rent credit >50% of monthly rent", "moderate", "Materially raises recharacterization risk.", "seller");
    addAcct({ id: "acct_optfee", category: "Acquisition", item: "Option fee (lease-option)", buyer: true, seller: false, estimatedAmount: optFee, notes: val(e?.option_fee_credited) === true ? "Credits against strike at exercise." : "Typically non-refundable, non-credited." });
  }

  if (structure === "option_to_purchase") {
    const optFee = val(e?.option_fee);
    const strike = val(e?.option_strike_price);
    const period = val(e?.option_period_days);
    if (p === "buyer") {
      addPro("opt_optionality", "Pure option locks the strike", `${period ?? "—"}-day right to buy at ${strike ? fmt(strike) : "stated strike"} without obligation.`);
      addQ("opt_recorded", "Will a memorandum of option be recorded against title?", "Without recording, seller can convey to a third party in breach.", "legal");
    } else {
      addCon("opt_tie", "Option ties up the property", "moderate", `Property is off-market for ${period ?? "the option period"}; downside if market rises.`, "seller");
      addMove("opt_breakup", "Add a top-up / breakup fee if buyer fails to exercise", "Compensates for opportunity cost.");
    }
    addAcct({ id: "acct_opt", category: "Acquisition", item: "Option fee", buyer: true, seller: false, estimatedAmount: optFee, notes: val(e?.option_fee_credited) === true ? "Credits to strike at exercise." : "Non-refundable." });
  }

  if (structure === "assignment_wholesale") {
    const fee = val(e?.assignment_fee);
    if (p === "seller") {
      addCon("ws_disclosure", "Wholesale / assignment structure", "moderate", "Many states (IL, OK, etc.) now require wholesaler licensing or written disclosure to seller. Confirm compliance.", "seller");
      addQ("ws_end_buyer", "Has the end-buyer's proof of funds been delivered?", "Wholesalers rarely close themselves; the deal depends on the assignee.", "financial");
    } else {
      addPro("ws_fee", "Assignment fee captured at close", fee != null ? `${fmt(fee)} assignment fee on settlement statement.` : "Set assignment fee on the settlement statement.");
      addQ("ws_em_source", "Will EM be funded by the wholesaler or the end-buyer?", "End-buyer-funded EM signals a real assignee; wholesaler EM signals daisy-chain risk.", "financial");
    }
    addAcct({ id: "acct_assign", category: "Acquisition", item: "Assignment fee", buyer: false, seller: false, estimatedAmount: fee, notes: "Paid to assignor on the HUD/CD." });
  }

  if (structure === "1031_exchange") {
    const party = (val(e?.exchange_party) ?? "").toLowerCase();
    const qi = val(e?.qualified_intermediary);
    addPro("1031_defer", "1031 like-kind exchange", "Defers federal capital gains and depreciation recapture for the exchanging party.", party === "buyer" ? "buyer" : party === "seller" ? "seller" : "both");
    addQ("1031_45_180", "Are the 45-day identification and 180-day exchange deadlines calendared?", "Missing either deadline collapses the exchange and triggers full tax recognition.", "timeline");
    addQ("1031_qi", "Is the QI bonded, insured, and segregating funds in a qualified escrow?", "QI failures (e.g. 2008 LandAmerica) caused millions in lost exchange funds.", "financial");
    if (!qi) addWeak("1031_qi_missing", "No Qualified Intermediary identified", "QI must be named and engaged BEFORE close — taxpayer cannot have actual or constructive receipt of proceeds.");
    addMove("1031_coop", "Add standard 1031 cooperation clause at no cost / no liability to non-exchanging party", "Standard accommodation language; protects both sides.");
  }

  if (val(e?.firpta_applies) === true) {
    const pct = val(e?.firpta_withholding_pct) ?? 15;
    addCon("firpta", "FIRPTA withholding applies", "moderate", `Buyer must withhold ${pct}% of gross sales price and remit to IRS within 20 days of close (Form 8288/8288-A) unless seller obtains a withholding certificate.`, "buyer");
    addQ("firpta_cert", "Has seller applied for or received a FIRPTA withholding certificate?", "Reduces withholding to actual tax liability; takes 90 days to process.", "financial");
    addAcct({ id: "acct_firpta", category: "Taxes", item: `FIRPTA withholding (${pct}%)`, buyer: false, seller: true, estimatedAmount: price > 0 ? price * (pct / 100) : null, notes: "Withheld at close, remitted by buyer/closing agent." });
  }

  // ===== Mansion tax (NY/NJ/CA) =====
  if (val(e?.mansion_tax_applies) === true || (price >= 1_000_000 && ["NY", "NJ", "CA", "DC", "CT"].includes(stateUp))) {
    const rate = stateUp === "NY" ? 0.01 : 0.01;
    addCon("mansion", "Mansion tax applies", "low", `Approx ${(rate * 100).toFixed(2)}%+ on sales ≥ $1M in ${stateUp}. Confirm exact bracket — NY scales 1% to 3.9% above $25M.`, val(e?.mansion_tax_applies) ? p : "buyer");
    addAcct({ id: "acct_mansion", category: "Taxes", item: "Mansion / additional transfer tax", buyer: true, seller: false, estimatedAmount: price >= 1_000_000 ? price * rate : null, notes: "Confirm state/county bracket." });
  }

  // ===== Closing accounting lines (always add the core lines) =====
  addAcct({ id: "acct_pp", category: "Acquisition", item: "Purchase price", buyer: true, seller: false, estimatedAmount: price || null, notes: "Net sale proceeds to seller before deductions." });
  if (val(e?.earnest_money) != null) {
    addAcct({ id: "acct_em", category: "Acquisition", item: "Earnest money (credit to buyer)", buyer: true, seller: false, estimatedAmount: val(e?.earnest_money), notes: `Held by ${val(e?.earnest_money_holder) ?? "escrow"}; applied at close.` });
  }

  // Title insurance — owners + lenders
  const titlePaidBy = val(e?.title_insurance_paid_by);
  addPays("wp_title_o", "Owner's title insurance", titlePaidBy ?? "unspecified", "Per contract / local custom");
  if (val(e?.lenders_title_policy) === true) {
    addPays("wp_title_l", "Lender's title insurance", "buyer", "Required by lender; paid by buyer at close.");
    addAcct({ id: "acct_title_l", category: "Title & Recording", item: "Lender's title policy", buyer: true, seller: false, estimatedAmount: price > 0 ? price * 0.0035 : null, notes: "Typical 0.30–0.40% of loan amount." });
  }
  if (price > 0) addAcct({ id: "acct_title_o", category: "Title & Recording", item: "Owner's title policy", buyer: titlePaidBy === "buyer" || titlePaidBy === "split", seller: titlePaidBy === "seller" || titlePaidBy === "split", estimatedAmount: price * 0.005, notes: "Typical 0.5% of price; varies by state." });

  // Survey
  const survPaid = val(e?.survey_paid_by);
  addPays("wp_survey", "Survey (boundary / ALTA)", survPaid ?? "unspecified", `Type: ${val(e?.survey_type) ?? "not specified"}`);
  if (survPaid) addAcct({ id: "acct_survey", category: "Title & Recording", item: `${val(e?.survey_type) ?? "Boundary"} survey`, buyer: survPaid === "buyer" || survPaid === "split", seller: survPaid === "seller" || survPaid === "split", estimatedAmount: 600, notes: "ALTA typically $1,500–$5,000+." });

  // Transfer / recordation tax
  const tt = val(e?.transfer_tax_paid_by);
  addPays("wp_tt", "Transfer tax", tt ?? "unspecified", val(e?.transfer_tax_amount) != null ? fmt(val(e?.transfer_tax_amount) as number) : "Per state/county schedule");
  addAcct({ id: "acct_tt", category: "Taxes", item: "Transfer tax", buyer: tt === "buyer" || tt === "split", seller: tt === "seller" || tt === "split" || !tt, estimatedAmount: val(e?.transfer_tax_amount) ?? (price > 0 ? price * 0.004 : null), notes: "State/county varies (CA city $0–$30/$1k; IL $1/$1k state + city)." });

  const rt = val(e?.recordation_tax_paid_by);
  if (val(e?.recordation_tax_amount) != null || rt) {
    addPays("wp_rt", "Recordation tax", rt ?? "unspecified", val(e?.recordation_tax_amount) != null ? fmt(val(e?.recordation_tax_amount) as number) : "Per local schedule");
    addAcct({ id: "acct_rt", category: "Taxes", item: "Recordation tax", buyer: rt === "buyer" || rt === "split", seller: rt === "seller" || rt === "split", estimatedAmount: val(e?.recordation_tax_amount), notes: "Typically buyer; varies." });
  }

  // HOA
  const hoaXfer = val(e?.hoa_transfer_fee_paid_by);
  if (hoaXfer) addPays("wp_hoa", "HOA transfer fee", hoaXfer, "Per contract");
  const hoaOut = val(e?.hoa_assessments_outstanding);
  if (hoaOut && hoaOut > 0) {
    addCon("hoa_assess", "Outstanding HOA assessments", "moderate", `${fmt(hoaOut)} in unpaid HOA assessments. Must be cleared at close to deliver clean title.`, "seller");
    addAcct({ id: "acct_hoa_assess", category: "Other", item: "Outstanding HOA assessments", buyer: false, seller: true, estimatedAmount: hoaOut, notes: "Paid from seller proceeds at close." });
  }

  // Warranty
  const hw = val(e?.home_warranty_paid_by);
  if (hw) addPays("wp_warranty", "Home warranty", hw, val(e?.home_warranty_amount) != null ? fmt(val(e?.home_warranty_amount) as number) : "Per contract");

  // Escrow + attorney fees
  const esc = val(e?.escrow_fee_split);
  if (esc) addPays("wp_escrow", "Escrow / closing fee", esc, "Typically split 50/50 (West Coast) or seller-paid (East Coast).");
  const att = val(e?.attorney_fees_paid_by);
  if (att) addPays("wp_att", "Attorney fees", att, "Each party usually pays own; some markets allocate.");

  // ===== Prorations =====
  const pm = val(e?.proration_method);
  if (val(e?.property_tax_proration) === true) {
    addAcct({ id: "acct_prop_tax_pro", category: "Prorations", item: `Property tax proration (${pm ?? "method not stated"})`, buyer: true, seller: true, estimatedAmount: null, notes: `Basis: ${val(e?.tax_proration_basis) ?? "not stated"}. Seller credits buyer for taxes through close.` });
    if (!val(e?.tax_proration_basis)) addWeak("tax_basis", "Tax proration basis not stated", "Specify last_known, current_year_estimate, or supplemental. Material in CA (Prop 13 reassessment), IL (1-year-arrears billing), TX (year-of-sale supplementals).");
  }
  if (val(e?.rent_proration) === true)
    addAcct({ id: "acct_rent_pro", category: "Prorations", item: "Rent proration", buyer: true, seller: true, estimatedAmount: null, notes: "Pre-paid rent for closing month credited to buyer." });
  if (val(e?.utilities_proration) === true)
    addAcct({ id: "acct_util_pro", category: "Prorations", item: "Utility proration", buyer: true, seller: true, estimatedAmount: null, notes: "Final reads at close." });
  if (val(e?.hoa_dues_proration) === true)
    addAcct({ id: "acct_hoa_pro", category: "Prorations", item: "HOA dues proration", buyer: true, seller: true, estimatedAmount: null, notes: "Credit through close." });
  if (val(e?.security_deposits_amount) != null) {
    const sd = val(e?.security_deposits_amount) as number;
    addAcct({ id: "acct_sd", category: "Prorations", item: "Security deposits transferred to buyer", buyer: false, seller: true, estimatedAmount: sd, notes: "Credit to buyer at close; buyer assumes return obligation." });
  }

  // ===== Liability allocation enrichments =====
  if (val(e?.firpta_applies) === true) {
    addLiab("liab_firpta", "FIRPTA withholding (Form 8288)", "buyer", "Within 20 days of close", "Buyer is statutorily liable for withholding even if closing agent fails to remit.");
  }
  if (val(e?.environmental_phase_required) === true || val(e?.environmental_indemnity) === true) {
    addLiab("liab_env_phase", "Environmental Phase I / indemnity", val(e?.environmental_indemnity) === true ? "seller" : "buyer", "Pre-close to post-close", val(e?.environmental_indemnity) === true ? "Seller indemnifies for pre-close contamination." : "Buyer orders Phase I and accepts findings.");
  }
  if (val(e?.balloon_payment) === true) {
    addLiab("liab_balloon", "Balloon payment on seller carry", "buyer", "At balloon maturity", "Buyer must refinance or pay in full at term end.");
  }

  // ===== Commercial / investment diligence =====
  const isCommercial = (val(e?.property_use) ?? "").toLowerCase().match(/commercial|multifamily|mixed|industrial|retail|office/);
  if (isCommercial || val(e?.rent_roll_attached) != null) {
    if (val(e?.rent_roll_attached) !== true) addWeak("no_rentroll", "No rent roll attached", "Commercial / multifamily diligence requires rent roll, T-12, and trailing operating statements.");
    if (val(e?.estoppel_required) !== true && p === "buyer") {
      addCon("no_estoppel", "No tenant estoppels required", "moderate", "Without estoppels you cannot confirm lease economics, deposits, or defaults at close.", "buyer");
      addMove("add_estoppel", "Require tenant estoppels from ≥80% of leased SF as a closing condition", "Standard commercial protection.");
    }
    if (val(e?.snda_required) !== true && p === "buyer") {
      addQ("snda_q", "Will SNDAs be required from major tenants?", "Subordination, non-disturbance, attornment protects lender financing on income-producing assets.", "legal");
    }
    if (val(e?.cam_reconciliation) !== true) addWeak("no_cam", "No CAM reconciliation clause", "True-up at close prevents disputes on under/over-billed CAM, taxes, and insurance.");
  }

  // ===== Broker commission =====
  const commPct = val(e?.broker_commission_pct);
  const commAmt = val(e?.broker_commission_amount);
  const commBy = val(e?.commission_paid_by);
  if (commPct != null || commAmt != null) {
    const calc = commAmt ?? (commPct != null && price > 0 ? price * (commPct / 100) : null);
    addAcct({ id: "acct_comm", category: "Other", item: `Brokerage commission${commPct != null ? ` (${commPct}%)` : ""}`, buyer: commBy === "buyer" || commBy === "split", seller: commBy === "seller" || commBy === "split" || !commBy, estimatedAmount: calc, notes: "Per listing agreement; verify split between listing and selling brokers." });
  }
  if (val(e?.dual_agency_disclosed) === true) {
    addQ("dual_q", "Has dual agency been disclosed and consented to in writing?", "Dual agency is illegal in some states (e.g. FL designated only) and creates fiduciary conflicts.", "legal");
  }

  // ===== Time-is-of-essence / per-diem =====
  if (val(e?.time_is_of_essence) === true) {
    if (p === "buyer") addCon("toe", "Time is of the essence", "moderate", "Any missed deadline (financing, inspection, close) is a material breach — no grace period.", "buyer");
    else addPro("toe_s", "Time is of the essence", "Buyer delays trigger immediate default and EM forfeiture.");
  }
  const perDiem = val(e?.per_diem_late_close);
  if (perDiem && perDiem > 0) {
    if (p === "buyer") addCon("perdiem", "Per-diem late-close penalty", "moderate", `${fmt(perDiem)}/day if close is delayed. Calendar back to lender funding deadline.`, "buyer");
    else addPro("perdiem_s", "Per-diem late-close penalty", `${fmt(perDiem)}/day disincentivizes buyer delay.`);
  }

  // ===== Post-close occupancy =====
  const occDays = val(e?.post_close_occupancy_days);
  if (occDays && occDays > 0) {
    const rent = val(e?.post_close_occupancy_rent);
    if (p === "buyer") {
      addCon("occ_buyer", `Seller post-close occupancy (${occDays} days)`, occDays > 30 ? "moderate" : "low", `Seller stays ${occDays} days after close. Insurance, holdover, and damage exposure are buyer's risk.`, "buyer");
      addQ("occ_holdover", "Is there a holdover penalty (typically 2x daily rate) and security deposit?", "Protects against seller refusing to vacate.", "legal");
      addQ("occ_insurance", "Who carries property insurance during the occupancy period?", "Buyer's policy may not cover loss caused by seller-occupant.", "legal");
    }
    addAcct({ id: "acct_occ", category: "Prorations", item: `Seller rent-back (${occDays}d)`, buyer: false, seller: true, estimatedAmount: rent != null ? rent * occDays : null, notes: rent != null ? `${fmt(rent)}/day` : "Daily rate not stated." });
  }

  // ===== Deed form =====
  const deed = val(e?.deed_form);
  if (deed === "quitclaim" && p === "buyer") {
    addCon("quitclaim", "Quitclaim deed", "high", "Quitclaim conveys whatever interest seller has — no warranties of title. Title insurance is the only protection.", "buyer");
  } else if (deed === "special_warranty" && p === "buyer") {
    addCon("spec_warr", "Special warranty deed", "low", "Seller warrants only against defects arising during their ownership. Pre-seller defects are not covered by deed (only by title policy).", "buyer");
  } else if (deed === "warranty") {
    addPro("warr_deed", "General warranty deed", "Strongest deed form — seller warrants title against all defects.", "buyer");
  }

  // ===== Risk-shifting clauses =====
  if (val(e?.right_of_first_refusal) === true) {
    if (p === "buyer") addCon("rofr_b", "ROFR encumbers the property", "moderate", "Existing ROFR holder can match your offer. Closing depends on holder's election period.", "buyer");
  }
  if (val(e?.right_of_first_offer) === true && p === "buyer") {
    addQ("rofo_q", "Has the ROFO process been triggered and waived in writing?", "Unwaived ROFO is a cloud on title until cured.", "legal");
  }
  if (val(e?.arbitration_required) === true) {
    if (p === "buyer") addCon("arb_b", "Mandatory arbitration", "low", "Waives jury trial and most appeal rights. Confirm forum and cost-sharing.", "buyer");
    else addPro("arb_s", "Mandatory arbitration", "Faster, cheaper than litigation; preserves confidentiality.");
  }
  if (val(e?.mediation_required) === true) {
    addPro("med", "Mediation required before suit", "Standard friction-reducer; preserves remedies if mediation fails.", "both");
  }

  // ===== Broker / market questions (always useful) =====
  addBQ("bq_pof_age", "How recent is the buyer's proof-of-funds or pre-approval letter?", ">30 days old means lender / underwriting status may have changed.");
  addBQ("bq_appr_risk", "What appraisal risk is anticipated given recent comps?", "Drives whether to push for appraisal gap or waiver language.");
  if (isCommercial) {
    addBQ("bq_cap", "What is the in-place cap rate vs market cap?", "Underwriting baseline for value and exit.");
    addBQ("bq_tenants", "Are any tenant leases month-to-month or in their final year?", "Material to underwriting and lender approval.");
  }

  return {
    pros, cons, weaknesses, questions, brokerQuestions, negotiation,
    whoPaysWhat, liabilityAllocation, dealStructureLabel, closingAccounting,
  };
}
