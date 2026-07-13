import SwiftUI

struct AppView: View {
    @EnvironmentObject private var state: AppState
    var body: some View {
        if state.accessToken.isEmpty {
            AccountView()
        } else {
            TabView(selection: $state.tab) {
                FindIQView().tabItem { Label("Find", systemImage: "magnifyingglass") }.tag(AppTab.find)
                DealIQCockpitView().tabItem { Label("Deal", systemImage: "chart.bar.xaxis") }.tag(AppTab.deal)
                ContractIQView().tabItem { Label("Contract", systemImage: "doc.text.magnifyingglass") }.tag(AppTab.contract)
                PipelineIQView().tabItem { Label("Pipeline", systemImage: "rectangle.3.group") }.tag(AppTab.pipeline)
                OfferIQView().tabItem { Label("Offer", systemImage: "doc.text") }.tag(AppTab.offer)
                PortfolioOSView().tabItem { Label("Portfolio", systemImage: "building.2") }.tag(AppTab.portfolio)
                ReportsIQView().tabItem { Label("Reports", systemImage: "square.and.arrow.down") }.tag(AppTab.reports)
                AccountView().tabItem { Label("Account", systemImage: "person.crop.circle") }.tag(AppTab.account)
            }
            .tint(Brix.blue)
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
