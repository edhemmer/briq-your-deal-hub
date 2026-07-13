import SwiftUI

struct OfferIQView: View {
    @EnvironmentObject private var state: AppState
    var body: some View {
        NavigationStack {
            ScrollView {
                if let deal = state.selectedDeal {
                    let analysis = state.analysis(for: deal)
                    BrixCard {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Offer plan").font(.largeTitle.bold())
                            Text(deal.address).foregroundStyle(Brix.muted)
                            Text(analysis.confidence >= 75 ? "Prepare terms after verification." : "Keep terms conditional until missing data is cleared.")
                            ForEach(analysis.nextActions, id: \.self) { action in Label(action, systemImage: "exclamationmark.triangle").foregroundStyle(Brix.amber) }
                        }
                    }
                    .padding(.horizontal)
                    VStack(spacing: 12) {
                        offerCard(name: "Conservative", price: (deal.listPrice ?? 0) * 0.94, note: "Protects cash and leaves room for verification.")
                        offerCard(name: "Balanced", price: (deal.listPrice ?? 0) * 0.98, note: "Closer to list price with standard inspection and financing protection.")
                        offerCard(name: "Competitive", price: deal.listPrice, note: "Use only when confidence and readiness are strong.")
                    }
                    .padding()
                } else {
                    ContentUnavailableView("No Deal Selected", systemImage: "doc.text", description: Text("Create or open a deal first."))
                }
            }
            .navigationTitle("OfferIQ")
            .brixScreen()
        }
    }

    private func offerCard(name: String, price: Double?, note: String) -> some View {
        BrixCard {
            VStack(alignment: .leading, spacing: 8) {
                Text(name).font(.title3.bold())
                Text(currency(price)).font(.title2.bold()).foregroundStyle(Brix.green)
                Text(note).foregroundStyle(Brix.muted)
            }
        }
    }

    private func currency(_ value: Double?) -> String {
        guard let value, value > 0 else { return "Price missing" }
        return value.formatted(.currency(code: "USD").precision(.fractionLength(0)))
    }
}
