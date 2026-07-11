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
                        title: "Sign in to use FindIQ",
                        message: "Search, rank, and open your saved properties."
                    )
                } else {
                    BrixCard {
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeader(title: "FindIQ", subtitle: "Create, search, and rank properties.", symbol: "magnifyingglass")
                            TextField("", text: $searchText)
                                .textFieldStyle(.roundedBorder)

                            HStack {
                                Button {
                                    appState.selectedTab = .find
                                } label: {
                                    Label("Start in FindIQ", systemImage: "plus")
                                        .frame(maxWidth: .infinity)
                                }
                                .buttonStyle(.borderedProminent)

                                Button {
                                    Task { await appState.refresh() }
                                } label: {
                                    Label("Refresh", systemImage: "arrow.clockwise")
                                        .frame(maxWidth: .infinity)
                                }
                                .buttonStyle(.bordered)
                            }
                        }
                    }

                    if filteredDeals.isEmpty {
                        EmptyOperatingState(
                            title: "No properties found",
                            message: "Add the first property to begin ranking, comparison, and analysis.",
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
        .brixScreenBackground()
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
