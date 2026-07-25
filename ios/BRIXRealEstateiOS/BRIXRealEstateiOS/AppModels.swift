import Foundation

enum AppTab: String, CaseIterable, Identifiable {
    case find, deal, contract, pipeline, offer, portfolio, reports, account
    var id: String { rawValue }
    var title: String {
        switch self {
        case .find: "FindIQ"
        case .deal: "DealIQ"
        case .contract: "ContractIQ"
        case .pipeline: "PipelineIQ"
        case .offer: "OfferIQ"
        case .portfolio: "PortfolioIQ"
        case .reports: "Reports"
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
    var monthlyPayment: Double?
    var monthlyNOI: Double?
    var monthlyCashFlow: Double?
    var dscr: Double?
    var missing: [String]
    var nextActions: [String]
    var keyRisks: [String]
    var bullCase: [String]
    var bearCase: [String]
    var whatMustBeTrue: [String]
    var failureScenarios: [String]
    var alternativeStrategies: [String]
    var strategyHeadline: String
    var strategyExplanation: String
    var bestStrategyName: String
    var strategyScoreGap: Int
    var strategyTradeoffs: [String]
    var strategyVerification: [String]
}

enum OfflineDraftStatus: String, Codable, CaseIterable {
    case local
    case queued
    case syncing
    case synced
    case conflicted
    case failed
    case cancelled

    func canTransition(to next: OfflineDraftStatus) -> Bool {
        switch self {
        case .local:
            return next == .queued || next == .cancelled
        case .queued:
            return next == .syncing || next == .cancelled
        case .syncing:
            return next == .synced || next == .failed || next == .conflicted
        case .failed, .conflicted:
            return next == .queued || next == .cancelled
        case .synced, .cancelled:
            return false
        }
    }
}

enum OfflineDraftType: String, Codable, CaseIterable {
    case newDeal = "new_deal"
    case dealCoreUpdate = "deal_core_update"
    case propertyUpdate = "property_update"
    case noteCreate = "note_create"
    case noteUpdate = "note_update"
    case taskCreate = "task_create"
    case taskUpdate = "task_update"
    case deadlineCreate = "deadline_create"
    case deadlineUpdate = "deadline_update"
}

enum OfflineCommandType: String, Codable, CaseIterable {
    case createCanonicalDeal = "create_canonical_deal"
    case updateCanonicalDeal = "update_canonical_deal"
    case updateCanonicalProperty = "update_canonical_property"
    case createDealNote = "create_deal_note"
    case updateDealNote = "update_deal_note"
    case createDealTask = "create_deal_task"
    case updateDealTask = "update_deal_task"
    case createDealDeadline = "create_deal_deadline"
    case updateDealDeadline = "update_deal_deadline"
}

struct OfflineDraftScope: Codable, Equatable {
    enum Kind: String, Codable {
        case anonymous
        case authenticated
    }

    var kind: Kind
    var userId: String?
    var workspaceId: String?

    var storageKey: String {
        switch kind {
        case .anonymous:
            return "anonymous"
        case .authenticated:
            return "user:\(userId ?? "unknown"):workspace:\(workspaceId ?? "unknown")"
        }
    }
}

struct LocalCanonicalMapping: Codable, Equatable {
    var localId: String
    var canonicalId: String
    var canonicalVersion: Int?
    var canonicalType: String
    var updatedAt: Date
}

struct OfflineDraftRecord: Identifiable, Codable, Equatable {
    var id: String { localDraftId }
    var schemaVersion = 1
    var localDraftId: String
    var scope: OfflineDraftScope
    var workspaceId: String?
    var dealId: String?
    var propertyId: String?
    var draftType: OfflineDraftType
    var commandType: OfflineCommandType
    var baseRecordId: String?
    var baseVersion: Int?
    var createdAt: Date
    var updatedAt: Date
    var status: OfflineDraftStatus
    var retryCount: Int
    var lastAttemptedAt: Date?
    var lastSyncedAt: Date?
    var lastSafeErrorCategory: String
    var idempotencyKey: String
    var clientId: String
    var resultingCanonicalId: String?
    var resultingCanonicalVersion: Int?
    var dependencyLocalIds: [String]
    var mappings: [LocalCanonicalMapping]

    func transitioned(to next: OfflineDraftStatus, at date: Date = Date()) throws -> OfflineDraftRecord {
        guard status.canTransition(to: next) else {
            throw OfflineDraftStoreError.invalidTransition
        }
        var copy = self
        copy.status = next
        copy.updatedAt = date
        if next == .syncing {
            copy.lastAttemptedAt = date
        }
        return copy
    }
}

enum OfflineDraftStoreError: Error {
    case invalidTransition
    case invalidAuthenticatedScope
}

final class UserDefaultsOfflineDraftStore {
    private let defaults: UserDefaults
    private let key = "brix.offlineDrafts.v1"
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        decoder.dateDecodingStrategy = .iso8601
        encoder.dateEncodingStrategy = .iso8601
    }

    func list(scope: OfflineDraftScope) -> [OfflineDraftRecord] {
        loadAll().filter { $0.scope.storageKey == scope.storageKey }
    }

    func put(_ draft: OfflineDraftRecord) throws {
        if draft.scope.kind == .authenticated && (draft.scope.userId?.isEmpty ?? true || draft.scope.workspaceId?.isEmpty ?? true) {
            throw OfflineDraftStoreError.invalidAuthenticatedScope
        }
        var drafts = loadAll().filter { $0.localDraftId != draft.localDraftId }
        drafts.insert(draft, at: 0)
        defaults.set(try encoder.encode(drafts), forKey: key)
    }

    func clear(scope: OfflineDraftScope) throws {
        let drafts = loadAll().filter { $0.scope.storageKey != scope.storageKey }
        defaults.set(try encoder.encode(drafts), forKey: key)
    }

    private func loadAll() -> [OfflineDraftRecord] {
        guard let data = defaults.data(forKey: key),
              let drafts = try? decoder.decode([OfflineDraftRecord].self, from: data) else {
            return []
        }
        return drafts
    }
}
