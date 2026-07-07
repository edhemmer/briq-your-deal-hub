import SwiftUI

struct AppView: View {
    @Environment(BRIXAppState.self) private var appState

    var body: some View {
        @Bindable var appState = appState

        TabView(selection: $appState.selectedTab) {
            ForEach(AppTab.allCases) { tab in
                NavigationStack {
                    content(for: tab)
                        .navigationTitle(tab.rawValue)
                        .toolbarTitleDisplayMode(.inline)
                }
                .tabItem {
                    Label(tab.rawValue, systemImage: tab.symbol)
                }
                .tag(tab)
            }
        }
        .tint(.brixBlue)
        .task {
            await appState.restore()
        }
    }

    @ViewBuilder
    private func content(for tab: AppTab) -> some View {
        switch tab {
        case .dashboard:
            TodayDecisionView()
        case .find:
            FindIQView()
        case .deal:
            DealIQCockpitView()
        case .pipeline:
            PipelineIQView()
        case .offer:
            OfferIQView()
        case .field:
            FieldInvestorView()
        case .portfolio:
            PortfolioOSView()
        case .account:
            AccountView()
        }
    }
}

#Preview {
    AppView()
        .environment(BRIXAppState())
}
