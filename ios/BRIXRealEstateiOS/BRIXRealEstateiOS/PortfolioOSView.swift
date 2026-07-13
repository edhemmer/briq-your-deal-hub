import SwiftUI

struct PortfolioOSView: View {
    @EnvironmentObject private var state: AppState
    var body: some View {
        NavigationStack {
            List {
                ForEach(state.deals.filter { $0.status == "closed" }) { deal in
                    VStack(alignment: .leading) {
                        Text(deal.address).font(.headline)
                        Text("Purchase price: \(currency(deal.listPrice))").foregroundStyle(.secondary)
                    }
                }
            }
            .overlay {
                if state.deals.filter({ $0.status == "closed" }).isEmpty {
                    ContentUnavailableView("No Portfolio Assets", systemImage: "building.2", description: Text("Closed acquisitions will appear here."))
                }
            }
            .navigationTitle("PortfolioIQ")
            .scrollContentBackground(.hidden)
            .brixScreen()
        }
    }

    private func currency(_ value: Double?) -> String {
        guard let value else { return "Missing" }
        return value.formatted(.currency(code: "USD").precision(.fractionLength(0)))
    }
}
