import Foundation
import SwiftUI

@MainActor
final class AppState: ObservableObject {
    @Published var tab: AppTab = .find
    @Published var deals: [Deal] = []
    @Published var selectedDealID: UUID?
    @Published var email = ""
    @Published var authMessage = ""
    @Published var accessToken = ""

    var selectedDeal: Deal? {
        get { deals.first { $0.id == selectedDealID } ?? deals.first }
        set {
            guard let newValue else { return }
            if let index = deals.firstIndex(where: { $0.id == newValue.id }) {
                deals[index] = newValue
            } else {
                deals.insert(newValue, at: 0)
            }
            selectedDealID = newValue.id
            save()
        }
    }

    init() { load() }

    func createDeal(from input: String, strategy: StrategyId) {
        var deal = ListingTextParser.parse(input, strategy: strategy)
        deal.updatedAt = Date()
        selectedDeal = deal
        tab = .deal
    }

    func deleteSelectedDeal() {
        guard let selectedDealID else { return }
        deals.removeAll { $0.id == selectedDealID }
        self.selectedDealID = deals.first?.id
        save()
    }

    func advance(_ deal: Deal) {
        var updated = deal
        updated.status = nextStatus(after: deal.status)
        updated.updatedAt = Date()
        selectedDeal = updated
    }

    func analysis(for deal: Deal) -> DealAnalysis {
        let missing = missingFields(deal)
        let readiness = max(0, 100 - missing.count * 14)
        let confidence = max(0, min(100, readiness - (deal.photoNames.isEmpty ? 8 : 0)))
        let decision = confidence >= 78 ? "Visit" : confidence >= 55 ? "Research first" : "Do not visit yet"
        let payment = monthlyPayment(for: deal)
        let noi = monthlyNOI(for: deal)
        let cashFlow = noi.flatMap { net in payment.map { net - $0 } }
        let dscr = noi.flatMap { net in payment.flatMap { debt in debt > 0 ? rounded(net / debt) : nil } }
        return DealAnalysis(
            decision: decision,
            confidence: confidence,
            readiness: readiness,
            monthlyPayment: payment,
            monthlyNOI: noi,
            monthlyCashFlow: cashFlow,
            dscr: dscr,
            missing: missing,
            nextActions: nextActions(for: deal, missing: missing),
            keyRisks: keyRisks(for: deal, missing: missing),
            bullCase: bullCase(for: deal),
            bearCase: bearCase(for: deal, missing: missing),
            whatMustBeTrue: whatMustBeTrue(for: deal),
            failureScenarios: failureScenarios(for: deal),
            alternativeStrategies: alternativeStrategies(for: deal)
        )
    }

    private func nextActions(for deal: Deal, missing: [String]) -> [String] {
        if missing.isEmpty {
            return ["Review contract terms.", "Confirm final financing and insurance.", "Save the decision memo before pursuing the property."]
        }
        return missing.map { "Add or verify \($0.lowercased())." }
    }

    private func keyRisks(for deal: Deal, missing: [String]) -> [String] {
        var risks = missing.map { "\($0) is not verified." }
        if [.brrrr, .hybridBrrrr, .fixAndFlip, .valueAdd, .development].contains(deal.strategy) {
            risks.append("Renovation scope, permits, timeline, and exit value can materially change the result.")
        }
        if deal.strategy == .shortTermRental || deal.strategy == .hybridRental {
            risks.append("Occupancy, local rules, HOA restrictions, and management burden must be verified.")
        }
        if risks.isEmpty { risks.append("Source quality and inspection findings remain the main decision risks.") }
        return Array(risks.prefix(6))
    }

    private func bullCase(for deal: Deal) -> [String] {
        var items = ["The property may fit the selected strategy if the captured facts verify."]
        if let price = deal.listPrice {
            items.append("Purchase price is captured at \(currency(price)), so affordability and offer structure can be tested.")
        }
        if deal.monthlyRent != nil { items.append("Rent support is available for cash flow and DSCR testing.") }
        return items
    }

    private func bearCase(for deal: Deal, missing: [String]) -> [String] {
        var items: [String] = []
        if !missing.isEmpty { items.append("Decision quality is limited by missing data: \(missing.prefix(3).joined(separator: ", ")).") }
        if deal.annualInsurance == nil { items.append("Insurance is not verified, so carrying cost may be understated.") }
        if deal.annualTaxes == nil { items.append("Taxes are not verified, so affordability may be overstated.") }
        if items.isEmpty { items.append("The strategy can fail if assumptions are too optimistic or inspection findings change the economics.") }
        return items
    }

    private func whatMustBeTrue(for deal: Deal) -> [String] {
        var items = ["Purchase price, taxes, insurance, financing, and condition must remain inside the user's tolerance."]
        if deal.strategy != .ownerOccupant { items.append("Market rent must support the selected strategy after vacancy and operating expenses.") }
        if [.brrrr, .hybridBrrrr, .fixAndFlip, .valueAdd].contains(deal.strategy) {
            items.append("Rehab budget, after repair value, and timeline must be verified before relying on projected upside.")
        }
        if deal.strategy == .ownerOccupant { items.append("Commute, neighborhood fit, HOA rules, and monthly payment must work for the household.") }
        return items
    }

    private func failureScenarios(for deal: Deal) -> [String] {
        switch deal.strategy {
        case .ownerOccupant:
            return ["Monthly payment exceeds comfort range.", "HOA, parking, commute, or local fit fails verification.", "Inspection reveals condition beyond tolerance."]
        case .brrrr, .hybridBrrrr:
            return ["Rehab exceeds budget.", "After repair value is overstated.", "Refinance or rent support does not verify."]
        case .fixAndFlip:
            return ["Resale value misses.", "Carrying costs and rehab overruns erase margin.", "Permits or resale timeline slip."]
        case .shortTermRental, .hybridRental:
            return ["Occupancy or daily rate underperforms.", "HOA or municipal rules restrict use.", "Management burden is higher than expected."]
        default:
            return ["Required data fails verification.", "Costs exceed tolerance.", "Market or exit assumptions weaken."]
        }
    }

    private func alternativeStrategies(for deal: Deal) -> [String] {
        switch deal.strategy {
        case .ownerOccupant:
            return ["Buy and Hold", "House Hack", "Hold"]
        case .fixAndFlip:
            return ["BRRRR", "Value Add", "Sell"]
        case .brrrr, .hybridBrrrr:
            return ["Buy and Hold", "Value Add", "Cash-Out Refinance"]
        default:
            return ["Owner Occupant", "Buy and Hold", "Sell"]
        }
    }

    private func missingFields(_ deal: Deal) -> [String] {
        var missing: [String] = []
        if deal.address.isEmpty { missing.append("Address") }
        if deal.listPrice == nil { missing.append("Purchase price") }
        if deal.annualTaxes == nil { missing.append("Annual taxes") }
        if deal.annualInsurance == nil { missing.append("Annual insurance") }
        if deal.strategy != .ownerOccupant && deal.monthlyRent == nil { missing.append("Monthly rent support") }
        if [.brrrr, .hybridBrrrr, .fixAndFlip, .valueAdd].contains(deal.strategy), deal.rehabBudget == nil { missing.append("Renovation budget") }
        return missing
    }

    private func nextStatus(after status: String) -> String {
        let stages = ["draft", "reviewing", "underwriting", "pursuing", "under_contract", "closed"]
        guard let index = stages.firstIndex(of: status) else { return "reviewing" }
        return stages[min(index + 1, stages.count - 1)]
    }

    private func monthlyPayment(for deal: Deal) -> Double? {
        guard let price = deal.listPrice else { return nil }
        let down = deal.downPayment ?? price * 0.20
        let principal = max(price - down, 0)
        let monthlyRate = 0.07 / 12
        let months = 360.0
        let debt = principal * (monthlyRate * pow(1 + monthlyRate, months)) / (pow(1 + monthlyRate, months) - 1)
        return rounded(debt + (deal.annualTaxes ?? 0) / 12 + (deal.annualInsurance ?? 0) / 12)
    }

    private func monthlyNOI(for deal: Deal) -> Double? {
        guard let rent = deal.monthlyRent else { return nil }
        let vacancy = rent * 0.06
        let maintenance = rent * 0.08
        let management = rent * 0.08
        return rounded(rent - vacancy - maintenance - management - ((deal.annualTaxes ?? 0) / 12) - ((deal.annualInsurance ?? 0) / 12))
    }

    private func rounded(_ value: Double) -> Double {
        (value * 100).rounded() / 100
    }

    private func currency(_ value: Double) -> String {
        value.formatted(.currency(code: "USD").precision(.fractionLength(0)))
    }

    func save() {
        if let encoded = try? JSONEncoder().encode(deals) {
            UserDefaults.standard.set(encoded, forKey: "brix.deals")
        }
    }

    private func load() {
        guard let data = UserDefaults.standard.data(forKey: "brix.deals"),
              let decoded = try? JSONDecoder().decode([Deal].self, from: data) else { return }
        deals = decoded
        selectedDealID = decoded.first?.id
    }
}
