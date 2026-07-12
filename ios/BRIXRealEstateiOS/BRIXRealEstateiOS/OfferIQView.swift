import SwiftUI

struct OfferIQView: View {
    @Environment(BRIXAppState.self) private var appState

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if appState.authState.isSignedIn == false {
                    SignInRequiredCard(
                        title: "Sign in to open OfferIQ",
                        message: "OfferIQ turns DealIQ analysis into acquisition actions, terms, and communications."
                    )
                } else if let deal = appState.selectedDeal {
                    BrixCard {
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeader(title: "OfferIQ", subtitle: "How to pursue this opportunity.", symbol: "doc.text")
                            Text(deal.title)
                                .font(.title3.bold())
                            Text("Keep terms provisional until rent support, insurance, taxes, condition, financing, and exit assumptions are verified.")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                            HStack(spacing: 10) {
                                Button {
                                    appState.selectDeal(deal)
                                    appState.selectedTab = .deal
                                } label: {
                                    Label("Open DealIQ", systemImage: "chart.bar.xaxis")
                                        .frame(maxWidth: .infinity)
                                }
                                .buttonStyle(.borderedProminent)

                                Button {
                                    appState.selectedTab = .pipeline
                                } label: {
                                    Label("Pipeline", systemImage: "rectangle.stack")
                                        .frame(maxWidth: .infinity)
                                }
                                .buttonStyle(.bordered)
                            }
                        }
                    }

                    BrixCard {
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeader(title: "Offer Readiness", subtitle: "The missing facts that affect price and terms.", symbol: "checklist.checked")
                            if deal.missingInputs.isEmpty {
                                ActionLine(title: "Core deal facts are entered. Confirm source quality before sending terms.", severity: .info)
                            } else {
                                ForEach(deal.missingInputs.prefix(5), id: \.self) { input in
                                    ActionLine(title: "Confirm \(input.lowercased()) before generating an offer package.", severity: .caution)
                                }
                            }
                        }
                    }
                } else {
                    EmptyOperatingState(
                        title: "Select a deal",
                        message: "OfferIQ starts after a property exists in FindIQ or DealIQ.",
                        symbol: "doc.badge.plus"
                    )
                    Button {
                        appState.selectedTab = .find
                    } label: {
                        Label("Start in FindIQ", systemImage: "magnifyingglass")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                }

                if let error = appState.lastError {
                    ErrorCard(message: error)
                }
            }
            .padding()
        }
        .brixScreenBackground()
        .refreshable { await appState.refresh() }
    }
}

#Preview {
    OfferIQView()
        .environment(BRIXAppState())
}
