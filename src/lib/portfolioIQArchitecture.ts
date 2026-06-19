export type AssetStatus = "Owner Occupied" | "Long-Term Rental" | "Short-Term Rental" | "Vacant" | "Listed For Sale" | "Under Contract";

export interface PortfolioAsset {
  id: string;
  address: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  lotSize: string;
  yearBuilt: number;
  county: string;
  state: string;
  acquisitionDate: string;
  purchasePrice: number;
  currentEstimatedValue: number;
  financingType: string;
  loanAmount: number;
  loanBalance: number;
  interestRate: number;
  loanTermYears: number;
  status: AssetStatus;
  grossMonthlyIncome: number;
  monthlyExpenses: number;
  monthlyDebtService: number;
  occupancy: number;
  capRate: number;
  cashOnCashReturn: number;
  dscr: number;
  roi: number;
  healthScore: number;
  risks: string[];
  opportunities: string[];
}

export interface PortfolioSummary {
  totalAssetValue: number;
  totalEquity: number;
  totalDebt: number;
  monthlyCashFlow: number;
  totalUnits: number;
  averageCapRate: number;
  averageDscr: number;
  portfolioRoi: number;
  occupancy: number;
}

export const portfolioAssets: PortfolioAsset[] = [
  {
    id: "asset-maple",
    address: "Portfolio Asset A",
    propertyType: "Duplex",
    bedrooms: 4,
    bathrooms: 2,
    squareFeet: 2140,
    lotSize: "0.21 ac",
    yearBuilt: 1978,
    county: "Kane",
    state: "IL",
    acquisitionDate: "2024-09-12",
    purchasePrice: 265000,
    currentEstimatedValue: 318000,
    financingType: "Conventional",
    loanAmount: 212000,
    loanBalance: 205400,
    interestRate: 6.75,
    loanTermYears: 30,
    status: "Long-Term Rental",
    grossMonthlyIncome: 3450,
    monthlyExpenses: 1180,
    monthlyDebtService: 1375,
    occupancy: 100,
    capRate: 7.4,
    cashOnCashReturn: 9.1,
    dscr: 1.32,
    roi: 18.6,
    healthScore: 84,
    risks: ["Insurance renewal due in 54 days"],
    opportunities: ["Refinance watch if rates drop below 5.9%", "Consider rent review at lease renewal"],
  },
  {
    id: "asset-oak",
    address: "233 Oak Ridge Ave",
    propertyType: "Single Family",
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1580,
    lotSize: "0.18 ac",
    yearBuilt: 1994,
    county: "DeKalb",
    state: "IL",
    acquisitionDate: "2023-05-18",
    purchasePrice: 228000,
    currentEstimatedValue: 286000,
    financingType: "DSCR",
    loanAmount: 171000,
    loanBalance: 164800,
    interestRate: 7.25,
    loanTermYears: 30,
    status: "Long-Term Rental",
    grossMonthlyIncome: 2550,
    monthlyExpenses: 980,
    monthlyDebtService: 1165,
    occupancy: 100,
    capRate: 6.6,
    cashOnCashReturn: 7.8,
    dscr: 1.22,
    roi: 22.7,
    healthScore: 77,
    risks: ["DSCR cushion is modest", "HVAC age requires capital planning"],
    opportunities: ["Potential equity extraction if value verifies", "Kitchen refresh could improve rent"],
  },
  {
    id: "asset-pine",
    address: "87 Pine Hollow Rd",
    propertyType: "Single Family",
    bedrooms: 3,
    bathrooms: 1.5,
    squareFeet: 1360,
    lotSize: "0.16 ac",
    yearBuilt: 1968,
    county: "Kendall",
    state: "IL",
    acquisitionDate: "2022-11-04",
    purchasePrice: 198000,
    currentEstimatedValue: 246000,
    financingType: "Conventional",
    loanAmount: 158400,
    loanBalance: 151250,
    interestRate: 5.95,
    loanTermYears: 30,
    status: "Vacant",
    grossMonthlyIncome: 0,
    monthlyExpenses: 760,
    monthlyDebtService: 945,
    occupancy: 0,
    capRate: 0,
    cashOnCashReturn: -8.8,
    dscr: 0,
    roi: 14.1,
    healthScore: 42,
    risks: ["Vacancy is creating negative cash flow", "Maintenance backlog unresolved"],
    opportunities: ["Lease-up task should be prioritized", "Disposition review if vacancy persists"],
  },
];

export function equity(asset: PortfolioAsset) {
  return asset.currentEstimatedValue - asset.loanBalance;
}

export function monthlyCashFlow(asset: PortfolioAsset) {
  return asset.grossMonthlyIncome - asset.monthlyExpenses - asset.monthlyDebtService;
}

export function buildPortfolioSummary(assets: PortfolioAsset[]): PortfolioSummary {
  const totalAssetValue = assets.reduce((sum, asset) => sum + asset.currentEstimatedValue, 0);
  const totalDebt = assets.reduce((sum, asset) => sum + asset.loanBalance, 0);
  const monthlyCashFlowTotal = assets.reduce((sum, asset) => sum + monthlyCashFlow(asset), 0);
  const occupied = assets.filter((asset) => asset.occupancy > 0).length;

  return {
    totalAssetValue,
    totalDebt,
    totalEquity: totalAssetValue - totalDebt,
    monthlyCashFlow: monthlyCashFlowTotal,
    totalUnits: assets.length,
    averageCapRate: assets.reduce((sum, asset) => sum + asset.capRate, 0) / assets.length,
    averageDscr: assets.reduce((sum, asset) => sum + asset.dscr, 0) / assets.length,
    portfolioRoi: assets.reduce((sum, asset) => sum + asset.roi, 0) / assets.length,
    occupancy: Math.round((occupied / assets.length) * 100),
  };
}
