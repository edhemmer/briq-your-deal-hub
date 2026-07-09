import SwiftUI

struct StrategyLabView: View {
    @Environment(BRIXAppState.self) private var appState

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if appState.authState.isSignedIn == false {
                    SignInRequiredCard(
                        title: "DealIQ requires your BRIX account",
                        message: "Sign in to review deal records, missing inputs, strategy fit, and recommendations."
                    )
                } else if let deal = appState.selectedDeal {
                    BrixCard {
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeader(title: "DealIQ", subtitle: "Underwriting, strategy fit, and verification stay attached to the deal.", symbol: "chart.bar.xaxis")
                            Text(deal.title)
                                .font(.title2.bold())
                            Text(deal.locationLine.isEmpty ? "Location incomplete" : deal.locationLine)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    }

                    BrixCard {
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeader(title: "Required Inputs", subtitle: "Missing facts lower confidence until verified.", symbol: "checklist")
                            if deal.missingInputs.isEmpty {
                                Text("Core mobile deal inputs are present. Continue with source review and stress-case analysis.")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            } else {
                                ForEach(deal.missingInputs, id: \.self) { item in
                                    HStack {
                                        Image(systemName: "exclamationmark.triangle.fill")
                                            .foregroundStyle(.orange)
                                        Text(item)
                                        Spacer()
                                    }
                                    .font(.subheadline.weight(.medium))
                                    .padding(12)
                                    .background(.orange.opacity(0.08), in: RoundedRectangle(cornerRadius: 8))
                                }
                            }
                        }
                    }

                    if let snapshot = appState.selectedDecisionSnapshot {
                        BrixCard {
                            VStack(alignment: .leading, spacing: 12) {
                                SectionHeader(title: "Backend Recommendation", subtitle: "Decision support from BRIX services.", symbol: "brain")
                                Text(snapshot.recommendation)
                                    .font(.title3.bold())
                                Text(snapshot.nextAction)
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                                    ScorePill(label: "Trust", value: "\(snapshot.trustScore)", severity: .info)
                                    ScorePill(label: "Confidence", value: "\(snapshot.confidence)%", severity: .caution)
                                }
                            }
                        }
                    } else {
                        EmptyOperatingState(
                            title: "No DealIQ memo yet",
                            message: "Open DealIQ to generate recommendations, scenarios, and strategy comparisons for this property.",
                            symbol: "doc.text.magnifyingglass"
                        )
                    }
                } else {
                    EmptyOperatingState(
                        title: "Select a deal",
                        message: "Open a property from FindIQ or the Dashboard to review its underwriting status.",
                        symbol: "chart.bar"
                    )
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
