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

        var userContainer = container.nestedContainer(keyedBy: UserKeys.self, forKey: .user)
        try userContainer.encode(userID, forKey: .id)
        try userContainer.encodeIfPresent(email, forKey: .email)
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

struct FieldCaptureAnalysis: Identifiable, Codable, Hashable {
    let id: String
    let captureType: String
    let confidenceScore: Int?
    let severity: String?
    let verificationRecommendation: String?
    let createdAt: String?
    let aiFindings: [CaptureFinding]

    enum CodingKeys: String, CodingKey {
        case id
        case captureType = "capture_type"
        case confidenceScore = "confidence_score"
        case severity
        case verificationRecommendation = "verification_recommendation"
        case createdAt = "created_at"
        case aiFindings = "ai_findings"
    }
}

struct CaptureFinding: Codable, Hashable {
    let area: String?
    let finding: String?
    let evidence: String?
    let severity: String?
    let confidence: Int?
    let limitation: String?
    let recommendedAction: String?

    enum CodingKeys: String, CodingKey {
        case area
        case finding
        case evidence
        case severity
        case confidence
        case limitation
        case recommendedAction = "recommended_action"
    }
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

struct CreateDealDraft {
    var propertyAddress = ""
    var city = ""
    var state = ""
    var zipCode = ""
    var propertyType = "Single Family"
    var purchasePrice = ""
    var monthlyRent = ""
    var annualTaxes = ""
    var annualInsurance = ""
    var beds = ""
    var baths = ""
    var squareFeet = ""
    var yearBuilt = ""
    var strategy = "Buy & Hold"
    var listingURL = ""
    var notes = ""
    var sourceConfidence = "user_entered"

    var isReadyToSave: Bool {
        propertyAddress.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false &&
        city.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false &&
        state.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false
    }

    mutating func apply(_ extracted: ExtractedListingDeal, originalText: String) {
        propertyAddress = extracted.propertyAddress ?? propertyAddress
        city = extracted.city ?? city
        state = extracted.state ?? state
        zipCode = extracted.zipCode ?? zipCode
        propertyType = extracted.propertyType ?? propertyType
        purchasePrice = extracted.purchasePrice.map { String(format: "%.0f", $0) } ?? purchasePrice
        monthlyRent = extracted.monthlyRent.map { String(format: "%.0f", $0) } ?? monthlyRent
        annualTaxes = (extracted.annualPropertyTax ?? extracted.taxes).map { String(format: "%.0f", $0) } ?? annualTaxes
        annualInsurance = extracted.insurance.map { String(format: "%.0f", $0) } ?? annualInsurance
        beds = extracted.beds.map { String(format: "%.1f", $0).replacingOccurrences(of: ".0", with: "") } ?? beds
        baths = extracted.baths.map { String(format: "%.1f", $0).replacingOccurrences(of: ".0", with: "") } ?? baths
        squareFeet = extracted.squareFeet.map { String(format: "%.0f", $0) } ?? squareFeet
        yearBuilt = extracted.yearBuilt.map { String(format: "%.0f", $0) } ?? yearBuilt
        strategy = extracted.strategyPrimary ?? strategy
        sourceConfidence = extracted.sourceConfidence ?? sourceConfidence
        if let url = ListingTextParser.firstURL(in: originalText) {
            listingURL = url
        }
        let notesToAppend = extracted.summaryNotes
        if notesToAppend.isEmpty == false {
            notes = ([notes, notesToAppend].filter { $0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false }).joined(separator: "\n\n")
        } else if notes.isEmpty {
            notes = originalText
        }
    }
}

struct CreateDealRequest: Encodable {
    let userID: String
    let propertyAddress: String
    let city: String
    let state: String
    let zipCode: String?
    let propertyType: String?
    let purchasePrice: Double?
    let monthlyRent: Double?
    let annualPropertyTax: Double?
    let taxes: Double?
    let insurance: Double?
    let beds: Double?
    let baths: Double?
    let squareFeet: Double?
    let yearBuilt: Double?
    let strategyPrimary: String?
    let listingURL: String?
    let listingRemarks: String?
    let sourceConfidence: String
    let assetType = "investment"
    let dealStatus = "draft"

    enum CodingKeys: String, CodingKey {
        case userID = "user_id"
        case propertyAddress = "property_address"
        case city
        case state
        case zipCode = "zip_code"
        case propertyType = "property_type"
        case purchasePrice = "purchase_price"
        case monthlyRent = "monthly_rent"
        case annualPropertyTax = "annual_property_tax"
        case taxes
        case insurance
        case beds
        case baths
        case squareFeet = "square_feet"
        case yearBuilt = "year_built"
        case strategyPrimary = "strategy_primary"
        case listingURL = "listing_url"
        case listingRemarks = "listing_remarks"
        case assetType = "asset_type"
        case dealStatus = "deal_status"
        case sourceConfidence = "source_confidence"
    }
}

struct DealQuickMath {
    let grossRentRatio: Double?
    let annualGrossRent: Double?
    let knownMonthlyCarry: Double?
    let knownAnnualNOIBeforeDebt: Double?

    init(deal: DealSummary) {
        let price = deal.purchasePrice ?? 0
        let rent = deal.monthlyRent ?? 0
        let taxes = deal.annualTaxesForDisplay ?? 0
        let insurance = deal.insurance ?? 0

        grossRentRatio = price > 0 && rent > 0 ? rent / price : nil
        annualGrossRent = rent > 0 ? rent * 12 : nil
        knownMonthlyCarry = taxes > 0 || insurance > 0 ? (taxes + insurance) / 12 : nil
        knownAnnualNOIBeforeDebt = rent > 0 ? (rent * 12) - taxes - insurance : nil
    }
}

struct ExtractListingResponse: Decodable {
    let extracted: ExtractedListingDeal
    let mode: String?
    let warning: String?
}

struct ExtractedListingDeal: Decodable, Hashable {
    let propertyAddress: String?
    let city: String?
    let state: String?
    let zipCode: String?
    let propertyType: String?
    let purchasePrice: Double?
    let estimatedARV: Double?
    let monthlyRent: Double?
    let annualPropertyTax: Double?
    let taxes: Double?
    let insurance: Double?
    let beds: Double?
    let baths: Double?
    let squareFeet: Double?
    let yearBuilt: Double?
    let conditionNotes: [String]?
    let visibleOrStatedRisks: [String]?
    let missingQuestions: [String]?
    let strategyPrimary: String?
    let sourceConfidence: String?

    enum CodingKeys: String, CodingKey {
        case propertyAddress = "property_address"
        case city
        case state
        case zipCode = "zip_code"
        case propertyType = "property_type"
        case purchasePrice = "purchase_price"
        case estimatedARV = "estimated_arv"
        case monthlyRent = "monthly_rent"
        case annualPropertyTax = "annual_property_tax"
        case taxes
        case insurance
        case beds
        case baths
        case squareFeet = "sqft"
        case yearBuilt = "year_built"
        case conditionNotes = "condition_notes"
        case visibleOrStatedRisks = "visible_or_stated_risks"
        case missingQuestions = "missing_questions"
        case strategyPrimary = "strategy_primary"
        case sourceConfidence = "source_confidence"
    }

    var summaryNotes: String {
        var sections: [String] = []
        if let conditionNotes, conditionNotes.isEmpty == false {
            sections.append("Condition notes: \(conditionNotes.joined(separator: " "))")
        }
        if let visibleOrStatedRisks, visibleOrStatedRisks.isEmpty == false {
            sections.append("Stated risks: \(visibleOrStatedRisks.joined(separator: " "))")
        }
        if let missingQuestions, missingQuestions.isEmpty == false {
            sections.append("Questions to verify: \(missingQuestions.joined(separator: " "))")
        }
        return sections.joined(separator: "\n")
    }
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
    case dashboard = "Deal Dashboard"
    case find = "FindIQ"
    case deal = "DealIQ"
    case pipeline = "PipelineIQ"
    case offer = "OfferIQ"
    case field = "Field"
    case portfolio = "PortfolioIQ"
    case account = "Account"

    var id: String { rawValue }

    var symbol: String {
        switch self {
        case .dashboard: return "target"
        case .find: return "magnifyingglass"
        case .deal: return "chart.bar.xaxis"
        case .pipeline: return "rectangle.stack.badge.play"
        case .offer: return "doc.text"
        case .field: return "camera.viewfinder"
        case .portfolio: return "chart.pie"
        case .account: return "person.crop.circle"
        }
    }
}
