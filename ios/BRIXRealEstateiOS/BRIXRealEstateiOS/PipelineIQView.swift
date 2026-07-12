import SwiftUI

struct PipelineIQView: View {
    @Environment(BRIXAppState.self) private var appState

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if appState.authState.isSignedIn == false {
                    SignInRequiredCard(
                        title: "Sign in to open PipelineIQ",
                        message: "PipelineIQ tracks active opportunities, next actions, and closing risk across your BRIX account."
                    )
                } else {
                    BrixCard {
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeader(title: "PipelineIQ", subtitle: "Where each opportunity stands right now.", symbol: "rectangle.stack.badge.play")
                            if appState.deals.isEmpty {
                                Text("No active opportunities yet. Add a property in FindIQ to begin tracking it.")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                                Button {
                                    appState.selectedTab = .find
                                } label: {
                                    Label("Start in FindIQ", systemImage: "magnifyingglass")
                                        .frame(maxWidth: .infinity)
                                }
                                .buttonStyle(.borderedProminent)
                            } else {
                                ForEach(appState.deals) { deal in
                                    PipelineRow(deal: deal)
                                }
                            }
                        }
                    }
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

private struct PipelineRow: View {
    @Environment(BRIXAppState.self) private var appState
    let deal: DealSummary

    var body: some View {
        Button {
            appState.selectDeal(deal)
            appState.selectedTab = .deal
        } label: {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(deal.title)
                        .font(.headline.weight(.bold))
                    Spacer()
                    SeverityBadge(text: deal.displayStatus, severity: .caution)
                }
                Text(deal.locationLine.isEmpty ? "Location incomplete" : deal.locationLine)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                ProgressView(value: Double(deal.mobileCompletenessScore), total: 100)
                    .tint(deal.mobileCompletenessScore >= 80 ? .green : .orange)
            }
            .padding(12)
            .background(.background, in: RoundedRectangle(cornerRadius: 8))
            .overlay {
                RoundedRectangle(cornerRadius: 8).stroke(.quaternary)
            }
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    PipelineIQView()
        .environment(BRIXAppState())
}
