import type { DealAnalysis, DealFacts } from "./types";
import { formatCurrency } from "./underwriting";

export type OfferStructure = {
  name: string;
  price?: number;
  earnestMoney?: number;
  inspectionDays: number;
  closingDays: number;
  posture: string;
  risks: string[];
};

export function buildOfferStructures(deal: DealFacts, analysis: DealAnalysis): OfferStructure[] {
  const price = deal.listPrice;
  const conservative = price ? Math.round(price * 0.94) : undefined;
  const balanced = price ? Math.round(price * 0.97) : undefined;
  const strong = price;
  const blockedRisks = analysis.missing.map((item) => `${item} must be verified before offer confidence improves.`);
  return [
    {
      name: "Conservative",
      price: conservative,
      earnestMoney: conservative ? Math.max(1000, Math.round(conservative * 0.01)) : undefined,
      inspectionDays: 10,
      closingDays: 35,
      posture: "Protect downside while facts are incomplete.",
      risks: blockedRisks,
    },
    {
      name: "Balanced",
      price: balanced,
      earnestMoney: balanced ? Math.max(1500, Math.round(balanced * 0.015)) : undefined,
      inspectionDays: 7,
      closingDays: 30,
      posture: "Reasonable pursuit if confidence improves.",
      risks: blockedRisks.slice(0, 3),
    },
    {
      name: "Competitive",
      price: strong,
      earnestMoney: strong ? Math.max(2500, Math.round(strong * 0.02)) : undefined,
      inspectionDays: 5,
      closingDays: 25,
      posture: "Use only when source quality, affordability, and inspection rights are strong.",
      risks: analysis.confidence < 80 ? ["Not appropriate until confidence is higher."] : [],
    },
  ];
}

export function offerSummary(offer: OfferStructure) {
  return `${offer.name}: ${formatCurrency(offer.price)} | earnest ${formatCurrency(offer.earnestMoney)} | ${offer.inspectionDays} day inspection | ${offer.closingDays} day close`;
}
