import SwiftUI

struct OfferIQView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        NavigationStack {
            ScrollView {
                if let deal = state.selectedDeal {
                    VStack(alignment: .leading, spacing: 14) {
                        BrixCard {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("OfferIQ").font(.largeTitle.bold())
                                Text(deal.address.isEmpty ? "Current Deal" : deal.address)
                                    .foregroundStyle(Brix.muted)
                                Text("Offer terms are not calculated independently on this device. Native BRIX preserves the Deal and verification record until canonical OfferIQ output is available.")
                                    .foregroundStyle(Brix.muted)
                            }
                        }

                        BrixCard {
                            VStack(alignment: .leading, spacing: 10) {
                                Text("Deal basis").font(.title2.bold())
                                factLine("Strategy intent", value: deal.strategy.title)
                                factLine("Purchase price", value: currency(deal.listPrice))
                                verificationLine("Annual taxes", complete: deal.annualTaxes != nil)
                                verificationLine("Annual insurance", complete: deal.annualInsurance != nil)
                                if deal.strategy != .ownerOccupant {
                                    verificationLine("Monthly rent support", complete: deal.monthlyRent != nil)
                                }
                            }
                        }

                        BrixCard {
                            VStack(alignment: .leading, spacing: 10) {
                                Text("Before offer terms").font(.title2.bold())
                                Label("Verify material facts and source conflicts.", systemImage: "checkmark.shield")
                                Label("Review the canonical underwriting and strategy output.", systemImage: "chart.bar.doc.horizontal")
                                Label("Generate or approve terms through the canonical OfferIQ workflow.", systemImage: "doc.badge.gearshape")
                            }
                            .foregroundStyle(Brix.muted)
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

    private func factLine(_ label: String, value: String) -> some View {
        HStack {
            Text(label).foregroundStyle(Brix.muted)
            Spacer()
            Text(value).fontWeight(.semibold)
        }
    }

    private func verificationLine(_ label: String, complete: Bool) -> some View {
        Label(label, systemImage: complete ? "checkmark.circle.fill" : "circle")
            .foregroundStyle(complete ? Brix.green : Brix.muted)
    }

    private func currency(_ value: Double?) -> String {
        guard let value, value > 0 else { return "Missing" }
        return value.formatted(.currency(code: "USD").precision(.fractionLength(0)))
    }
}
