import SwiftUI

struct AppView: View {
    @EnvironmentObject private var state: AppState
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    var body: some View {
        Group {
            if horizontalSizeClass == .regular {
                iPadShell
            } else {
                iPhoneShell
            }
        }
        .tint(Brix.blue)
    }

    private var iPhoneShell: some View {
        TabView(selection: $state.tab) {
            screen(for: .find).tabItem { Label("Find", systemImage: AppTab.find.systemImage) }.tag(AppTab.find)
            screen(for: .deal).tabItem { Label("Deal", systemImage: AppTab.deal.systemImage) }.tag(AppTab.deal)
            screen(for: .contract).tabItem { Label("Contract", systemImage: AppTab.contract.systemImage) }.tag(AppTab.contract)
            screen(for: .pipeline).tabItem { Label("Pipeline", systemImage: AppTab.pipeline.systemImage) }.tag(AppTab.pipeline)
            screen(for: .offer).tabItem { Label("Offer", systemImage: AppTab.offer.systemImage) }.tag(AppTab.offer)
            screen(for: .portfolio).tabItem { Label("Portfolio", systemImage: AppTab.portfolio.systemImage) }.tag(AppTab.portfolio)
            screen(for: .reports).tabItem { Label("Reports", systemImage: AppTab.reports.systemImage) }.tag(AppTab.reports)
            screen(for: .account).tabItem { Label("Account", systemImage: AppTab.account.systemImage) }.tag(AppTab.account)
        }
    }

    private var iPadShell: some View {
        NavigationSplitView {
            List {
                Section("BRIX") {
                    ForEach(AppTab.allCases) { tab in
                        Button {
                            state.tab = tab
                        } label: {
                            HStack(spacing: 12) {
                                Image(systemName: tab.systemImage)
                                    .frame(width: 24)
                                    .foregroundStyle(state.tab == tab ? Brix.blue : Brix.muted)
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(tab.title)
                                        .font(.headline)
                                        .foregroundStyle(state.tab == tab ? .white : Brix.muted)
                                    Text(tab.purpose)
                                        .font(.caption)
                                        .foregroundStyle(Brix.muted)
                                }
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.vertical, 6)
                        }
                        .buttonStyle(.plain)
                        .listRowBackground(state.tab == tab ? Brix.blue.opacity(0.16) : Color.clear)
                        .accessibilityLabel(tab.title)
                        .accessibilityHint(tab.purpose)
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(Brix.ink)
            .navigationTitle("BRIX")
        } detail: {
            screen(for: state.tab)
                .toolbar {
                    ToolbarItem(placement: .principal) {
                        VStack(spacing: 2) {
                            Text(state.tab.title)
                                .font(.headline)
                            if let deal = state.selectedDeal {
                                Text(deal.address.isEmpty ? "Current Deal" : deal.address)
                                    .font(.caption)
                                    .foregroundStyle(Brix.muted)
                            }
                        }
                    }
                }
        }
        .navigationSplitViewStyle(.balanced)
    }

    @ViewBuilder
    private func screen(for tab: AppTab) -> some View {
        switch tab {
        case .find:
            FindIQView()
        case .deal:
            DealIQCockpitView()
        case .contract:
            ContractIQView()
        case .pipeline:
            PipelineIQView()
        case .offer:
            OfferIQView()
        case .portfolio:
            PortfolioOSView()
        case .reports:
            ReportsIQView()
        case .account:
            AccountView()
        }
    }
}

private extension AppTab {
    var systemImage: String {
        switch self {
        case .find: "magnifyingglass"
        case .deal: "chart.bar.xaxis"
        case .contract: "doc.text.magnifyingglass"
        case .pipeline: "rectangle.3.group"
        case .offer: "doc.text"
        case .portfolio: "building.2"
        case .reports: "square.and.arrow.down"
        case .account: "person.crop.circle"
        }
    }

    var purpose: String {
        switch self {
        case .find: "Start or import a property"
        case .deal: "Review the current decision"
        case .contract: "Read contract risk"
        case .pipeline: "Track Deal stage"
        case .offer: "Prepare pursuit"
        case .portfolio: "Review owned assets"
        case .reports: "Export current work"
        case .account: "Account and security"
        }
    }
}

struct ReportsIQView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        NavigationStack {
            ScrollView {
                if let deal = state.selectedDeal {
                    let analysis = state.analysis(for: deal)
                    VStack(alignment: .leading, spacing: 16) {
                        BrixCard {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Decision memo").font(.largeTitle.bold())
                                Text(deal.address).foregroundStyle(Brix.muted)
                                HStack {
                                    BrixMetric(title: "Confidence", value: analysis.confidence)
                                    BrixMetric(title: "Readiness", value: analysis.readiness)
                                }
                            }
                        }
                        BrixCard {
                            VStack(alignment: .leading, spacing: 10) {
                                Text("Financial read").font(.title2.bold())
                                Label("Monthly payment: \(currency(analysis.monthlyPayment))", systemImage: "creditcard")
                                Label("Monthly cash flow: \(currency(analysis.monthlyCashFlow))", systemImage: "chart.line.uptrend.xyaxis")
                                Label("DSCR: \(dscr(analysis.dscr))", systemImage: "gauge")
                            }
                            .foregroundStyle(Brix.muted)
                        }
                        BrixCard {
                            VStack(alignment: .leading, spacing: 10) {
                                Text("Strategy comparison").font(.title2.bold())
                                Text(analysis.strategyHeadline).font(.headline)
                                ForEach(analysis.strategyTradeoffs, id: \.self) { item in
                                    Label(item, systemImage: "arrow.triangle.branch").foregroundStyle(Brix.muted)
                                }
                            }
                        }
                        BrixCard {
                            VStack(alignment: .leading, spacing: 10) {
                                Text("Decision challenge").font(.title2.bold())
                                ForEach(analysis.keyRisks + analysis.whatMustBeTrue + analysis.failureScenarios, id: \.self) { item in
                                    Label(item, systemImage: "checkmark.seal").foregroundStyle(Brix.muted)
                                }
                            }
                        }
                    }
                    .padding()
                } else {
                    ContentUnavailableView("No Report Available", systemImage: "doc.text", description: Text("Create or open a deal first."))
                }
            }
            .navigationTitle("Reports")
            .brixScreen()
        }
    }

    private func currency(_ value: Double?) -> String {
        guard let value else { return "Missing" }
        return value.formatted(.currency(code: "USD").precision(.fractionLength(0)))
    }

    private func dscr(_ value: Double?) -> String {
        guard let value else { return "Missing" }
        return "\(value)x"
    }
}
