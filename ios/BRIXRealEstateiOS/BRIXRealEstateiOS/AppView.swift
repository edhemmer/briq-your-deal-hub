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
    }

    @ViewBuilder
    private func content(for tab: AppTab) -> some View {
        switch tab {
        case .today:
            TodayDecisionView()
        case .field:
            FieldInvestorView()
        case .twin:
            DigitalTwinView()
        case .strategy:
            StrategyLabView()
        case .project:
            ProjectOSView()
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
