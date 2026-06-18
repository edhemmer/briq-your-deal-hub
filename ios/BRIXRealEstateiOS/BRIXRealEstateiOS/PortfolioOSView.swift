import SwiftUI

struct PortfolioOSView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                BrixCard {
                    VStack(alignment: .leading, spacing: 12) {
                        SectionHeader(title: "Portfolio OS", subtitle: "The portfolio is the investment.", symbol: "chart.pie")
                        Text("This acquisition improves cash flow but increases insurance exposure. Verify carrier pricing before capital allocation.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    ForEach(BrixDemoData.portfolioMetrics) { metric in
                        ScorePill(label: metric.label, value: metric.value, severity: metric.severity)
                    }
                }
            }
            .padding()
        }
        .background(Color.brixSurface)
    }
}
