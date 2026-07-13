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
                            Text(analysis.confidence >= 75 ? "Prepare terms after verification." : "Do not write terms until missing data is cleared.")
                            ForEach(analysis.nextActions, id: \.self) { action in Label(action, systemImage: "exclamationmark.triangle").foregroundStyle(Brix.amber) }
                        }
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
}
