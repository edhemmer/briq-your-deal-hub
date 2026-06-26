import SwiftUI

struct DigitalTwinView: View {
    @Environment(BRIXAppState.self) private var appState
    @State private var searchText = ""

    var filteredDeals: [DealSummary] {
        guard searchText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false else {
            return appState.deals
        }
        let query = searchText.lowercased()
        return appState.deals.filter { deal in
            [deal.propertyAddress, deal.city, deal.state, deal.zipCode, deal.propertyType]
                .compactMap { $0?.lowercased() }
                .contains { $0.contains(query) }
        }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if appState.authState.isSignedIn == false {
                    SignInRequiredCard(
                        title: "FindIQ uses your BRIX deal records",
                        message: "Sign in to search, rank, and open properties from the same backend used by the web app."
                    )
                } else {
                    BrixCard {
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeader(title: "FindIQ", subtitle: "Search real deal files and open the strongest candidates.", symbol: "magnifyingglass")
                            TextField("Search address, city, ZIP, or property type", text: $searchText)
                                .textFieldStyle(.roundedBorder)
                            Button {
                                Task { await appState.refresh() }
                            } label: {
                                Label("Refresh from BRIX", systemImage: "arrow.clockwise")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.borderedProminent)
                        }
                    }

                    if filteredDeals.isEmpty {
                        EmptyOperatingState(
                            title: "No properties found",
                            message: "Add or import listings in BRIX, then refresh. FindIQ will only show real records from your account.",
                            symbol: "house"
                        )
                    } else {
                        ForEach(filteredDeals) { deal in
                            DealSearchRow(deal: deal)
                        }
                    }
                }

                if let error = appState.lastError {
                    ErrorCard(message: error)
                }
            }
            .padding()
        }
        .refreshable {
            await appState.refresh()
        }
        .background(Color.brixSurface)
    }
}

private struct DealSearchRow: View {
    @Environment(BRIXAppState.self) private var appState
    let deal: DealSummary

    var body: some View {
        BrixCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(deal.title)
                            .font(.headline.bold())
                        Text(deal.locationLine.isEmpty ? "Location incomplete" : deal.locationLine)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    SeverityBadge(text: "\(deal.mobileCompletenessScore)", severity: deal.mobileCompletenessScore >= 80 ? .positive : .caution)
                }

                HStack {
                    if let propertyType = deal.propertyType {
                        SeverityBadge(text: propertyType, severity: .info)
                    }
                    if let strategy = deal.strategyPrimary {
                        SeverityBadge(text: strategy, severity: .neutral)
                    }
                    SeverityBadge(text: deal.displayStatus, severity: .caution)
                }

                Button {
                    appState.selectDeal(deal)
                    appState.selectedTab = .deal
                } label: {
                    Label("Open in DealIQ", systemImage: "chart.bar.xaxis")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
            }
        }
    }
}
