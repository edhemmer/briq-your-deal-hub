import Foundation
import SwiftUI

enum VerificationStatus: String, CaseIterable, Identifiable, Codable {
    case verified = "Verified"
    case sourceBacked = "Source Backed"
    case corroborated = "Corroborated"
    case estimated = "Estimated"
    case userEntered = "User Entered"
    case missing = "Missing"
    case unknown = "Unknown"

    var id: String { rawValue }
}

enum Severity: String, Codable {
    case positive = "Positive"
    case info = "Info"
    case caution = "Caution"
    case risk = "Risk"
    case neutral = "Neutral"

    var color: Color {
        switch self {
        case .positive: return .green
        case .info: return .blue
        case .caution: return .orange
        case .risk: return .red
        case .neutral: return .secondary
        }
    }
}

struct AuthSession: Codable, Equatable {
    let accessToken: String
    let refreshToken: String?
    let userID: String
    let email: String?

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case user
    }

    enum UserKeys: String, CodingKey {
        case id
        case email
    }

    init(accessToken: String, refreshToken: String?, userID: String, email: String?) {
        self.accessToken = accessToken
        self.refreshToken = refreshToken
        self.userID = userID
        self.email = email
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        accessToken = try container.decode(String.self, forKey: .accessToken)
        refreshToken = try container.decodeIfPresent(String.self, forKey: .refreshToken)

        let userContainer = try container.nestedContainer(keyedBy: UserKeys.self, forKey: .user)
        userID = try userContainer.decode(String.self, forKey: .id)
        email = try userContainer.decodeIfPresent(String.self, forKey: .email)
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(accessToken, forKey: .accessToken)
        try container.encodeIfPresent(refreshToken, forKey: .refreshToken)
    }
}

struct DealSummary: Identifiable, Codable, Hashable {
    let id: String
    var propertyAddress: String?
    var city: String?
    var state: String?
    var zipCode: String?
    var propertyType: String?
    var beds: Double?
    var baths: Double?
    var squareFeet: Double?
    var purchasePrice: Double?
    var monthlyRent: Double?
    var annualPropertyTax: Double?
    var taxes: Double?
    var insurance: Double?
    var estimatedARV: Double?
    var strategyPrimary: String?
    var dealStatus: String?
    var sourceConfidence: String?
    var listingURL: String?
    var createdAt: String?
    var updatedAt: String?

    enum CodingKeys: String, CodingKey {
        case id
        case propertyAddress = "property_address"
        case city
        case state
        case zipCode = "zip_code"
        case propertyType = "property_type"
        case beds
        case baths
        case squareFeet = "square_feet"
        case purchasePrice = "purchase_price"
        case monthlyRent = "monthly_rent"
        case annualPropertyTax = "annual_property_tax"
        case taxes
        case insurance
        case estimatedARV = "estimated_arv"
        case strategyPrimary = "strategy_primary"
        case dealStatus = "deal_status"
        case sourceConfidence = "source_confidence"
        case listingURL = "listing_url"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    var title: String {
        propertyAddress?.isEmpty == false ? propertyAddress! : "Unnamed property"
    }

    var locationLine: String {
        [city, state, zipCode]
            .compactMap { $0?.isEmpty == false ? $0 : nil }
            .joined(separator: ", ")
    }

    var displayStatus: String {
        dealStatus?.isEmpty == false ? dealStatus! : "Draft"
    }

    var annualTaxesForDisplay: Double? {
        annualPropertyTax ?? taxes
    }

    var missingInputs: [String] {
        var items: [String] = []
        if propertyAddress?.isEmpty ?? true { items.append("Property address") }
        if city?.isEmpty ?? true { items.append("City") }
        if state?.isEmpty ?? true { items.append("State") }
        if purchasePrice == nil || purchasePrice == 0 { items.append("Purchase price") }
        if monthlyRent == nil || monthlyRent == 0 { items.append("Monthly rent") }
        if annualTaxesForDisplay == nil || annualTaxesForDisplay == 0 { items.append("Annual taxes") }
        if insurance == nil || insurance == 0 { items.append("Annual insurance") }
        if propertyType?.isEmpty ?? true { items.append("Property type") }
        if strategyPrimary?.isEmpty ?? true { items.append("Strategy") }
        return items
    }

    var mobileCompletenessScore: Int {
        let total = 9
        let present = total - missingInputs.count
        return max(0, min(100, Int(round(Double(present) / Double(total) * 100))))
    }
}

struct DecisionSnapshot: Identifiable, Codable, Hashable {
    let id: String
    let dealID: String
    let recommendation: String
    let confidence: Int
    let trustScore: Int
    let readinessScore: Int
    let primaryRisk: String
    let nextAction: String
    let evidenceSummary: String?

    enum CodingKeys: String, CodingKey {
        case id
        case dealID = "deal_id"
        case recommendation
        case confidence
        case trustScore = "trust_score"
        case readinessScore = "readiness_score"
        case primaryRisk = "primary_risk"
        case nextAction = "next_action"
        case evidenceSummary = "evidence_summary"
    }
}

struct StrategyOption: Identifiable, Codable, Hashable {
    let id: String
    let name: String
    let score: Int?
    let trust: Int?
    let risk: Severity
    let capitalRequired: String?
    let nextAction: String
}

struct VisualFinding: Identifiable, Codable, Hashable {
    let id: String
    let area: String
    let finding: String
    let estimate: String?
    let confidence: Int?
    let severity: Severity
}

struct ProjectTask: Identifiable, Codable, Hashable {
    let id: String
    let title: String
    let owner: String?
    let due: String?
    let severity: Severity
}

struct PortfolioMetric: Identifiable, Codable, Hashable {
    let id: String
    let label: String
    let value: String
    let score: Int?
    let severity: Severity
}

struct OfflineAction: Identifiable, Codable, Hashable {
    let id: UUID
    let title: String
    let detail: String
    let createdAt: Date
    var uploadState: UploadState

    init(id: UUID = UUID(), title: String, detail: String, createdAt: Date = Date(), uploadState: UploadState = .queued) {
        self.id = id
        self.title = title
        self.detail = detail
        self.createdAt = createdAt
        self.uploadState = uploadState
    }
}

enum UploadState: String, Codable, Hashable {
    case queued = "Queued"
    case uploading = "Uploading"
    case uploaded = "Uploaded"
    case failed = "Needs Retry"
}

struct FieldCapturePayload: Codable {
    let localIdentifier: String
    let captureType: String
    let note: String?
    let createdAt: Date
}

enum InvestorLevel: String, CaseIterable, Identifiable {
    case explorer = "Explorer"
    case firstDeal = "First Deal"
    case active = "Active"
    case operatorLevel = "Operator"

    var id: String { rawValue }

    var mentorMessage: String {
        switch self {
        case .explorer:
            return "BRIX defines terms, explains calculations, and flags common first-pass mistakes."
        case .firstDeal:
            return "BRIX guides verification, financing, due diligence, and first-deal risk without hiding uncertainty."
        case .active:
            return "BRIX emphasizes tradeoffs, strategy fit, and portfolio impact."
        case .operatorLevel:
            return "BRIX focuses on execution variance, capital allocation, and optimization."
        }
    }
}

enum AppTab: String, CaseIterable, Identifiable {
    case dashboard = "Dashboard"
    case find = "FindIQ"
    case deal = "DealIQ"
    case field = "Field"
    case portfolio = "Portfolio"
    case account = "Account"

    var id: String { rawValue }

    var symbol: String {
        switch self {
        case .dashboard: return "target"
        case .find: return "magnifyingglass"
        case .deal: return "chart.bar.xaxis"
        case .field: return "camera.viewfinder"
        case .portfolio: return "chart.pie"
        case .account: return "person.crop.circle"
        }
    }
}
