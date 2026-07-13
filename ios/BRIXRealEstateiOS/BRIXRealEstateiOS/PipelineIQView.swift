import SwiftUI

struct PipelineIQView: View {
    @EnvironmentObject private var state: AppState
    private let stages = ["draft", "reviewing", "underwriting", "pursuing", "under_contract", "closed", "passed"]

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
                                                    Button("Advance") { state.advance(deal) }
                                                        .buttonStyle(.borderedProminent)
                                                        .tint(Brix.blue)
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

    private func label(_ status: String) -> String {
        switch status {
        case "draft": "New"
        case "reviewing": "Reviewing"
        case "underwriting": "Underwriting"
        case "pursuing": "Pursuing"
        case "under_contract": "Under contract"
        case "closed": "Closed"
        case "passed": "Passed"
        default: status.replacingOccurrences(of: "_", with: " ")
        }
    }
}
