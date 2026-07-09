import SwiftUI

struct PortfolioOSView: View {
    @Environment(BRIXAppState.self) private var appState

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if appState.authState.isSignedIn == false {
                    SignInRequiredCard(
                        title: "PortfolioIQ requires sign-in",
                        message: "Review owned assets, equity, debt, cash flow, and performance records in one account."
                    )
                } else if appState.portfolioMetrics.isEmpty {
                    EmptyOperatingState(
                        title: "No portfolio assets yet",
                        message: "Add an owned property to review equity, debt, cash flow, risk, and next actions.",
                        symbol: "chart.pie"
                    )
                } else {
                    BrixCard {
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeader(title: "PortfolioIQ", subtitle: "Asset performance and risk visibility.", symbol: "chart.pie")
                            Text("Review portfolio performance, risk exposure, and next actions.")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    }

                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                        ForEach(appState.portfolioMetrics) { metric in
                            ScorePill(label: metric.label, value: metric.value, severity: metric.severity)
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
