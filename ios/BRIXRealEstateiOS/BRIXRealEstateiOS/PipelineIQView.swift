import SwiftUI

struct PipelineIQView: View {
    @EnvironmentObject private var state: AppState
    var body: some View {
        NavigationStack {
            List {
                ForEach(state.deals) { deal in
                    Button {
                        state.selectedDealID = deal.id
                        state.tab = .deal
                    } label: {
                        VStack(alignment: .leading) {
                            Text(deal.address.isEmpty ? "Untitled property" : deal.address).font(.headline)
                            Text(deal.status.replacingOccurrences(of: "_", with: " ")).foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .navigationTitle("PipelineIQ")
            .scrollContentBackground(.hidden)
            .brixScreen()
        }
    }
}
