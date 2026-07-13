import Foundation

enum AppTab: String, CaseIterable, Identifiable {
    case find, deal, contract, pipeline, offer, portfolio, account
    var id: String { rawValue }
    var title: String {
        switch self {
        case .find: "FindIQ"
        case .deal: "DealIQ"
        case .contract: "ContractIQ"
        case .pipeline: "PipelineIQ"
        case .offer: "OfferIQ"
        case .portfolio: "PortfolioIQ"
        case .account: "Account"
        }
    }
}

enum StrategyId: String, CaseIterable, Identifiable, Codable {
    case ownerOccupant = "owner_occupant"
    case buyAndHold = "buy_and_hold"
    case longTermRental = "long_term_rental"
    case midTermRental = "mid_term_rental"
    case shortTermRental = "short_term_rental"
    case hybridRental = "hybrid_rental"
    case houseHack = "house_hack"
    case brrrr = "brrrr"
    case hybridBrrrr = "hybrid_brrrr"
    case fixAndFlip = "fix_and_flip"
    case valueAdd = "value_add"
    case adu = "adu"
    case lotSplit = "lot_split"
    case mixedUseConversion = "mixed_use_conversion"
    case commercialRepositioning = "commercial_repositioning"
    case development = "development"
    case refinance = "refinance"
    case hold = "hold"
    case sell = "sell"
    case sellerFinance = "seller_finance"
    case subjectTo = "subject_to"
    case leaseOption = "lease_option"
    case wrapMortgage = "wrap_mortgage"
    case assumableFinancing = "assumable_financing"
    case privateMoney = "private_money"
    case hardMoney = "hard_money"
    case dscrFinancing = "dscr_financing"
    case cashOutRefinance = "cash_out_refinance"
    case equityRedeployment = "equity_redeployment"
    case portfolioRefinance = "portfolio_refinance"
    case exchange1031 = "exchange_1031"
    case installmentSale = "installment_sale"
    case costSegregation = "cost_segregation"
    case jointVenture = "joint_venture"
    case equityPartner = "equity_partner"
    case waterfallPartnership = "waterfall_partnership"

    var id: String { rawValue }
    var title: String {
        rawValue.replacingOccurrences(of: "_", with: " ").split(separator: " ").map { word in
            word.prefix(1).uppercased() + word.dropFirst()
        }.joined(separator: " ").replacingOccurrences(of: "Brrrr", with: "BRRRR").replacingOccurrences(of: "Dscr", with: "DSCR")
    }
}

struct Deal: Identifiable, Codable, Equatable {
    var id = UUID()
    var createdAt = Date()
    var updatedAt = Date()
    var status = "draft"
    var sourceUrl = ""
    var sourceText = ""
    var address = ""
    var city = ""
    var state = ""
    var zip = ""
    var strategy = StrategyId.ownerOccupant
    var listPrice: Double?
    var beds: Double?
    var baths: Double?
    var squareFeet: Double?
    var annualTaxes: Double?
    var annualInsurance: Double?
    var monthlyRent: Double?
    var rehabBudget: Double?
    var arv: Double?
    var downPayment: Double?
    var photoNames: [String] = []
    var notes: [String] = []
}

struct DealAnalysis {
    var decision: String
    var confidence: Int
    var readiness: Int
    var missing: [String]
    var nextActions: [String]
}
