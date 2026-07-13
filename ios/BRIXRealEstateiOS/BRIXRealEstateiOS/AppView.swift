import SwiftUI

struct AppView: View {
    @EnvironmentObject private var state: AppState
    var body: some View {
        TabView(selection: $state.tab) {
            FindIQView().tabItem { Label("Find", systemImage: "magnifyingglass") }.tag(AppTab.find)
            DealIQCockpitView().tabItem { Label("Deal", systemImage: "chart.bar.xaxis") }.tag(AppTab.deal)
            ContractIQView().tabItem { Label("Contract", systemImage: "doc.text.magnifyingglass") }.tag(AppTab.contract)
            PipelineIQView().tabItem { Label("Pipeline", systemImage: "rectangle.3.group") }.tag(AppTab.pipeline)
            OfferIQView().tabItem { Label("Offer", systemImage: "doc.text") }.tag(AppTab.offer)
            PortfolioOSView().tabItem { Label("Portfolio", systemImage: "building.2") }.tag(AppTab.portfolio)
            AccountView().tabItem { Label("Account", systemImage: "person.crop.circle") }.tag(AppTab.account)
        }
        .tint(Brix.blue)
    }
}
