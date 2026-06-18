import Foundation
import SwiftUI

enum VerificationStatus: String, CaseIterable, Identifiable {
    case verified = "Verified"
    case sourceBacked = "Source Backed"
    case corroborated = "Corroborated"
    case estimated = "Estimated"
    case userEntered = "User Entered"
    case missing = "Missing"

    var id: String { rawValue }
}

enum Severity: String {
    case positive = "Positive"
    case info = "Info"
    case caution = "Caution"
    case risk = "Risk"

    var color: Color {
        switch self {
        case .positive: return .green
        case .info: return .blue
        case .caution: return .orange
        case .risk: return .red
        }
    }
}

struct DecisionSnapshot: Identifiable {
    let id = UUID()
    let recommendation: String
    let confidence: Int
    let trustScore: Int
    let readinessScore: Int
    let primaryRisk: String
    let nextAction: String
}

struct PropertyTwin: Identifiable {
    let id: String
    let address: String
    let propertyType: String
    let ownershipStatus: String
    let verificationStatus: VerificationStatus
    let timeline: [TwinEvent]
}

struct TwinEvent: Identifiable {
    let id = UUID()
    let title: String
    let stage: String
    let date: String
}

struct StrategyOption: Identifiable {
    let id = UUID()
    let name: String
    let score: Int
    let trust: Int
    let risk: Severity
    let capitalRequired: String
    let nextAction: String
}

struct CommitteeOpinion: Identifiable {
    let id = UUID()
    let role: String
    let position: String
    let detail: String
    let severity: Severity
}

struct VisualFinding: Identifiable {
    let id = UUID()
    let area: String
    let finding: String
    let estimate: String
    let confidence: Int
    let severity: Severity
}

struct ProjectTask: Identifiable {
    let id = UUID()
    let title: String
    let owner: String
    let due: String
    let severity: Severity
}

struct PortfolioMetric: Identifiable {
    let id = UUID()
    let label: String
    let value: String
    let score: Int
    let severity: Severity
}

struct BrixDemoData {
    static let decision = DecisionSnapshot(
        recommendation: "Buy with conditions",
        confidence: 74,
        trustScore: 78,
        readinessScore: 72,
        primaryRisk: "Insurance and roof scope are not verified.",
        nextAction: "Verify insurance quote before inspection period ends."
    )

    static let property = PropertyTwin(
        id: "BRX-1042",
        address: "1248 W Maple Ave",
        propertyType: "Duplex",
        ownershipStatus: "Under Contract",
        verificationStatus: .sourceBacked,
        timeline: [
            TwinEvent(title: "Offer accepted", stage: "Acquisition", date: "Today"),
            TwinEvent(title: "Inspection window open", stage: "Due Diligence", date: "3 days left"),
            TwinEvent(title: "Contractor walk scheduled", stage: "Renovation", date: "Tomorrow"),
            TwinEvent(title: "Lease-up model pending", stage: "Operations", date: "Queued")
        ]
    )

    static let strategies = [
        StrategyOption(name: "Buy and Hold", score: 84, trust: 78, risk: .caution, capitalRequired: "$84k", nextAction: "Verify rent comps"),
        StrategyOption(name: "Seller Finance", score: 79, trust: 72, risk: .info, capitalRequired: "$52k", nextAction: "Review terms"),
        StrategyOption(name: "BRRRR", score: 73, trust: 66, risk: .caution, capitalRequired: "$118k", nextAction: "Contractor bid required"),
        StrategyOption(name: "Flip", score: 58, trust: 61, risk: .risk, capitalRequired: "$126k", nextAction: "Exit comps too thin")
    ]

    static let committee = [
        CommitteeOpinion(role: "Acquisition Analyst", position: "Conditional buy", detail: "Value works if rents are verified.", severity: .positive),
        CommitteeOpinion(role: "Contractor", position: "Caution", detail: "Roof and bath scope need bid support.", severity: .caution),
        CommitteeOpinion(role: "Lender", position: "Mostly ready", detail: "Base-case DSCR clears lender threshold.", severity: .info),
        CommitteeOpinion(role: "Insurance Underwriter", position: "Concern", detail: "Premium exposure is unverified.", severity: .risk),
        CommitteeOpinion(role: "Portfolio Manager", position: "Good fit", detail: "Adds cash flow without market over-concentration.", severity: .positive)
    ]

    static let findings = [
        VisualFinding(area: "Kitchen", finding: "Replace cabinets, counters, and appliances.", estimate: "$14.5k - $21k", confidence: 82, severity: .caution),
        VisualFinding(area: "Bathrooms", finding: "Two full remodels and tile repair.", estimate: "$10k - $15k", confidence: 76, severity: .caution),
        VisualFinding(area: "Roof", finding: "Aging shingles visible. Professional review required.", estimate: "Review needed", confidence: 61, severity: .risk),
        VisualFinding(area: "Flooring", finding: "Replace carpet and refinish common areas.", estimate: "$6.8k - $9.2k", confidence: 87, severity: .positive)
    ]

    static let projectTasks = [
        ProjectTask(title: "Order insurance quote", owner: "Investor", due: "Today", severity: .risk),
        ProjectTask(title: "Request contractor roof review", owner: "Contractor", due: "Tomorrow", severity: .caution),
        ProjectTask(title: "Pull three rent comps", owner: "BRIX", due: "Queued", severity: .caution),
        ProjectTask(title: "Confirm DSCR terms", owner: "Lender", due: "2 days", severity: .info)
    ]

    static let portfolioMetrics = [
        PortfolioMetric(label: "Cash flow", value: "$8.7k/mo", score: 84, severity: .positive),
        PortfolioMetric(label: "Liquidity", value: "$186k", score: 74, severity: .info),
        PortfolioMetric(label: "Debt risk", value: "Moderate", score: 62, severity: .caution),
        PortfolioMetric(label: "Insurance exposure", value: "Elevated", score: 58, severity: .risk)
    ]
}
