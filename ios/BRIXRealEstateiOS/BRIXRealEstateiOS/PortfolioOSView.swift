import SwiftUI

struct PortfolioOSView: View {
    @Environment(BRIXAppState.self) private var appState

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if appState.authState.isSignedIn == false {
                    SignInRequiredCard(
                        title: "PortfolioIQ requires sign-in",
                        message: "Owned assets, equity, debt, cash flow, and performance records are private account data from the BRIX backend."
                    )
                } else if appState.portfolioMetrics.isEmpty {
                    EmptyOperatingState(
                        title: "No portfolio assets yet",
                        message: "Closed PipelineIQ acquisitions should create PortfolioIQ records. When assets exist, mobile will show equity, debt, cash flow, risk, and next actions.",
                        symbol: "chart.pie"
                    )
                } else {
                    BrixCard {
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeader(title: "PortfolioIQ", subtitle: "Asset performance and risk visibility.", symbol: "chart.pie")
                            Text("Portfolio recommendations are rendered from BRIX backend analysis so mobile stays consistent with web.")
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
        .background(Color.brixSurface)
    }
}
