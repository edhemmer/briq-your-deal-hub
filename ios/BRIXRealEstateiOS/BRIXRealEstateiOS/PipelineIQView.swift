import SwiftUI

struct PipelineIQView: View {
    @EnvironmentObject private var state: AppState
    @State private var advancingDealID: UUID?

    private let stages = [
        "lead", "screening", "research", "visit_planned", "visited", "underwriting",
        "negotiation", "offer_preparation", "offer_submitted", "under_contract",
        "due_diligence", "financing", "closing", "owned", "stabilizing", "operating",
        "refinancing", "disposition", "sold", "passed", "archived"
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    if state.deals.isEmpty {
                        ContentUnavailableView("No Active Properties", systemImage: "rectangle.3.group", description: Text("Create a deal in FindIQ."))
                    } else {
                        ForEach(stages, id: \.self) { stage in
                            let items = state.deals.filter { $0.status == stage }
                            if !items.isEmpty {
                                BrixCard {
                                    VStack(alignment: .leading, spacing: 12) {
                                        Text(label(stage)).font(.headline)
                                        ForEach(items) { deal in
                                            VStack(alignment: .leading, spacing: 8) {
                                                Button {
                                                    state.selectedDealID = deal.id
                                                    state.tab = .deal
                                                } label: {
                                                    Text(deal.address.isEmpty ? "Untitled property" : deal.address).font(.title3.bold())
                                                }
                                                HStack {
                                                    Button("Open DealIQ") {
                                                        state.selectedDealID = deal.id
                                                        state.tab = .deal
                                                    }
                                                    .buttonStyle(.bordered)

                                                    if nextStage(after: deal.status) != nil {
                                                        Button(advancingDealID == deal.id ? "Advancing…" : "Advance") {
                                                            Task { await advanceCanonical(deal) }
                                                        }
                                                        .buttonStyle(.borderedProminent)
                                                        .tint(Brix.blue)
                                                        .disabled(advancingDealID != nil)
                                                    }
                                                }
                                            }
                                            .padding(.vertical, 6)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("PipelineIQ")
            .brixScreen()
        }
    }

    @MainActor
    private func advanceCanonical(_ deal: Deal) async {
        guard !state.accessToken.isEmpty else {
            state.authMessage = "Sign in before changing a Deal's pipeline stage so BRIX can preserve canonical history."
            state.tab = .account
            return
        }
        guard let next = nextStage(after: deal.status) else { return }

        advancingDealID = deal.id
        defer { advancingDealID = nil }

        do {
            let updated = try await BRIXService.updateDealLifecycle(id: deal.id, stage: next, accessToken: state.accessToken)
            if let index = state.deals.firstIndex(where: { $0.id == updated.id }) {
                state.deals[index] = updated
            } else {
                state.deals.insert(updated, at: 0)
            }
            state.selectedDealID = updated.id
            state.authMessage = ""
        } catch {
            state.authMessage = "BRIX did not change the pipeline stage. Reload the Deal and try again."
        }
    }

    private func nextStage(after stage: String) -> String? {
        let active = Array(stages.prefix(19))
        guard let index = active.firstIndex(of: stage), index + 1 < active.count else { return nil }
        return active[index + 1]
    }

    private func label(_ status: String) -> String {
        switch status {
        case "lead": "Lead"
        case "screening": "Screening"
        case "research": "Research"
        case "visit_planned": "Visit planned"
        case "visited": "Visited"
        case "underwriting": "Underwriting"
        case "negotiation": "Negotiation"
        case "offer_preparation": "Offer preparation"
        case "offer_submitted": "Offer submitted"
        case "under_contract": "Under contract"
        case "due_diligence": "Due diligence"
        case "financing": "Financing"
        case "closing": "Closing"
        case "owned": "Owned"
        case "stabilizing": "Stabilizing"
        case "operating": "Operating"
        case "refinancing": "Refinancing"
        case "disposition": "Disposition"
        case "sold": "Sold"
        case "passed": "Passed"
        case "archived": "Archived"
        default: status.replacingOccurrences(of: "_", with: " ")
        }
    }
}
