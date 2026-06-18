import SwiftUI

struct StrategyLabView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                BrixCard {
                    SectionHeader(title: "Strategy Lab", subtitle: "Analyze strategies, not just properties.", symbol: "rectangle.3.group")
                }

                ForEach(BrixDemoData.strategies) { strategy in
                    BrixCard {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack(alignment: .top) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(strategy.name).font(.headline.bold())
                                    Text(strategy.nextAction).font(.subheadline).foregroundStyle(.secondary)
                                }
                                Spacer()
                                SeverityBadge(text: strategy.risk.rawValue, severity: strategy.risk)
                            }
                            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                                ScorePill(label: "Score", value: "\(strategy.score)", severity: strategy.risk)
                                ScorePill(label: "Trust", value: "\(strategy.trust)", severity: strategy.trust >= 75 ? .positive : .caution)
                                ScorePill(label: "Capital", value: strategy.capitalRequired, severity: .info)
                            }
                        }
                    }
                }
            }
            .padding()
        }
        .background(Color.brixSurface)
    }
}
