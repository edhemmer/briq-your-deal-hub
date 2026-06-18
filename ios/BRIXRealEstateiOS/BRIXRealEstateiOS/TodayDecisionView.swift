import SwiftUI

struct TodayDecisionView: View {
    @Environment(BRIXAppState.self) private var appState
    private let decision = BrixDemoData.decision

    var body: some View {
        @Bindable var appState = appState

        ScrollView {
            VStack(spacing: 16) {
                BrixCard {
                    VStack(alignment: .leading, spacing: 14) {
                        SectionHeader(title: "Decision Board", subtitle: "What should I do next?", symbol: "target")

                        Text(decision.recommendation)
                            .font(.largeTitle.weight(.black))
                            .foregroundStyle(Color.brixInk)

                        Text("Promising deal, but not decision-ready until key risks are verified.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)

                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                            ScorePill(label: "Trust", value: "\(decision.trustScore)/100", severity: .positive)
                            ScorePill(label: "Readiness", value: "\(decision.readinessScore)/100", severity: .caution)
                            ScorePill(label: "Confidence", value: "\(decision.confidence)%", severity: .caution)
                            ScorePill(label: "Risk", value: "Moderate", severity: .caution)
                        }
                    }
                }

                BrixCard {
                    VStack(alignment: .leading, spacing: 12) {
                        SectionHeader(title: "Next Actions", subtitle: "Verification before recommendation upgrade.", symbol: "checklist")
                        ActionRow(title: decision.nextAction, severity: .risk)
                        ActionRow(title: "Request itemized contractor bid.", severity: .caution)
                        ActionRow(title: "Use conservative rent in stress case.", severity: .info)
                    }
                }

                BrixCard {
                    VStack(alignment: .leading, spacing: 12) {
                        SectionHeader(title: "Mentor Mode", subtitle: "Adaptive investor education.", symbol: "graduationcap")
                        Picker("Investor level", selection: $appState.investorLevel) {
                            ForEach(InvestorLevel.allCases) { level in
                                Text(level.rawValue).tag(level)
                            }
                        }
                        .pickerStyle(.segmented)
                        Text(appState.investorLevel.mentorMessage)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .padding()
        }
        .background(Color.brixSurface)
    }
}

private struct ActionRow: View {
    let title: String
    let severity: Severity

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "checkmark.circle.fill")
                .foregroundStyle(severity.color)
            Text(title)
                .font(.subheadline.weight(.medium))
            Spacer()
        }
        .padding(12)
        .background(severity.color.opacity(0.08), in: RoundedRectangle(cornerRadius: 8))
    }
}

#Preview {
    TodayDecisionView()
        .environment(BRIXAppState())
}
