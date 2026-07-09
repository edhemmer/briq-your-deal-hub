import SwiftUI

struct DealIQCockpitView: View {
    @Environment(BRIXAppState.self) private var appState
    @State private var selectedPanel: DealPanel = .overview

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if appState.authState.isSignedIn == false {
                    SignInRequiredCard(
                        title: "Sign in to open DealIQ",
                        message: "Open your BRIX deal files, review assumptions, compare strategies, and keep verification visible before making a decision."
                    )
                } else if let deal = appState.selectedDeal {
                    cockpitHeader(deal)
                    panelPicker
                    panelContent(deal)
                } else {
                    EmptyOperatingState(
                        title: "Choose a property",
                        message: "Start in FindIQ, enter a listing, then open it here for underwriting and strategy review.",
                        symbol: "chart.bar.doc.horizontal"
                    )
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

    private func cockpitHeader(_ deal: DealSummary) -> some View {
        BrixCard {
            VStack(alignment: .leading, spacing: 14) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(deal.title)
                            .font(.title.bold())
                            .foregroundStyle(Color.brixInk)
                        Text(deal.locationLine.isEmpty ? "Location incomplete" : deal.locationLine)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    SeverityBadge(text: deal.displayStatus, severity: .caution)
                }

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                    ScorePill(label: "File readiness", value: "\(deal.mobileCompletenessScore)/100", severity: deal.mobileCompletenessScore >= 80 ? .positive : .caution)
                    ScorePill(label: "Recommendation", value: appState.selectedDecisionSnapshot?.recommendation ?? "Pending", severity: .neutral)
                    ScorePill(label: "Trust", value: appState.selectedDecisionSnapshot.map { "\($0.trustScore)/100" } ?? "Pending", severity: .info)
                    ScorePill(label: "Next", value: appState.selectedDecisionSnapshot?.nextAction ?? "Verify inputs", severity: .caution)
                }
            }
        }
    }

    private var panelPicker: some View {
        Picker("DealIQ panel", selection: $selectedPanel) {
            ForEach(DealPanel.allCases) { panel in
                Text(panel.rawValue).tag(panel)
            }
        }
        .pickerStyle(.segmented)
    }

    @ViewBuilder
    private func panelContent(_ deal: DealSummary) -> some View {
        switch selectedPanel {
        case .overview:
            overview(deal)
        case .inputs:
            inputs(deal)
        case .strategy:
            strategies(deal)
        case .risk:
            risk(deal)
        }
    }

    private func overview(_ deal: DealSummary) -> some View {
        VStack(spacing: 16) {
            BrixCard {
                VStack(alignment: .leading, spacing: 12) {
                    SectionHeader(title: "Underwriting Snapshot", subtitle: "What BRIX can evaluate right now.", symbol: "gauge.with.dots.needle.50percent")
                    MetricLine(label: "Purchase price", value: deal.purchasePrice?.formatted(.currency(code: "USD").precision(.fractionLength(0))) ?? "Missing")
                    MetricLine(label: "Monthly rent", value: deal.monthlyRent?.formatted(.currency(code: "USD").precision(.fractionLength(0))) ?? "Missing")
                    MetricLine(label: "Annual taxes", value: deal.annualTaxesForDisplay?.formatted(.currency(code: "USD").precision(.fractionLength(0))) ?? "Missing")
                    MetricLine(label: "Annual insurance", value: deal.insurance?.formatted(.currency(code: "USD").precision(.fractionLength(0))) ?? "Missing")
                    MetricLine(label: "Beds / Baths", value: formatBedsBaths(deal))
                    MetricLine(label: "Size", value: deal.squareFeet.map { "\($0.formatted(.number.precision(.fractionLength(0)))) sq ft" } ?? "Missing")
                }
            }

            BrixCard {
                VStack(alignment: .leading, spacing: 12) {
                    SectionHeader(title: "Quick Math", subtitle: "Directional math from entered facts. Verify source quality before relying on the result.", symbol: "function")
                    let math = DealQuickMath(deal: deal)
                    MetricLine(label: "Annual gross rent", value: money(math.annualGrossRent))
                    MetricLine(label: "Gross rent ratio", value: math.grossRentRatio.map { "\(($0 * 100).formatted(.number.precision(.fractionLength(2))))%" } ?? "Missing")
                    MetricLine(label: "Known monthly tax + insurance", value: money(math.knownMonthlyCarry))
                    MetricLine(label: "Known NOI before debt", value: money(math.knownAnnualNOIBeforeDebt))
                }
            }

            BrixCard {
                VStack(alignment: .leading, spacing: 12) {
                    SectionHeader(title: "Continue Workflow", subtitle: "Move from analysis to action without leaving the selected deal.", symbol: "arrow.forward.circle")
                    HStack {
                        Button {
                            appState.selectedTab = .offer
                        } label: {
                            Label("OfferIQ", systemImage: "doc.text")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)

                        Button {
                            appState.selectedTab = .pipeline
                        } label: {
                            Label("PipelineIQ", systemImage: "rectangle.stack.badge.play")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                    }
                }
            }
        }
    }

    private func inputs(_ deal: DealSummary) -> some View {
        BrixCard {
            VStack(alignment: .leading, spacing: 12) {
                SectionHeader(title: "Verification Checklist", subtitle: "Complete these before relying on the recommendation.", symbol: "checkmark.shield")
                if deal.missingInputs.isEmpty {
                    ActionLine(title: "Core mobile fields are complete. Confirm all numbers with source documents.", severity: .positive)
                } else {
                    ForEach(deal.missingInputs, id: \.self) { input in
                        ActionLine(title: "\(input) needs verification.", severity: .caution)
                    }
                }
            }
        }
    }

    private func strategies(_ deal: DealSummary) -> some View {
        BrixCard {
            VStack(alignment: .leading, spacing: 12) {
                SectionHeader(title: "Strategy Fit", subtitle: "Compare the selected strategy with credible alternatives.", symbol: "arrow.triangle.branch")
                StrategyFitRow(name: deal.strategyPrimary ?? "Buy & Hold", detail: "Primary strategy for this deal file.", status: "Selected")
                StrategyFitRow(name: "Long-Term Rental", detail: "Requires verified rent, taxes, insurance, vacancy, and repairs.", status: "Needs inputs")
                StrategyFitRow(name: "BRRRR", detail: "Requires ARV, rehab scope, refinance terms, and seasoning assumptions.", status: "Check fit")
                StrategyFitRow(name: "Flip", detail: "Requires resale comps, rehab timeline, selling costs, and holding costs.", status: "Check fit")
            }
        }
    }

    private func risk(_ deal: DealSummary) -> some View {
        BrixCard {
            VStack(alignment: .leading, spacing: 12) {
                SectionHeader(title: "Risk Inspector", subtitle: "Keep the decision tied to evidence.", symbol: "exclamationmark.shield")
                ActionLine(title: "Verify rent with comps, lease data, or market evidence.", severity: deal.monthlyRent == nil ? .caution : .info)
                ActionLine(title: "Enter insurance as an annual quote.", severity: deal.insurance == nil ? .caution : .info)
                ActionLine(title: "Support condition and rehab scope with photos, inspection, or contractor bid.", severity: .caution)
            }
        }
    }
}

private func money(_ value: Double?) -> String {
    value?.formatted(.currency(code: "USD").precision(.fractionLength(0))) ?? "Missing"
}

private func formatBedsBaths(_ deal: DealSummary) -> String {
    let beds = deal.beds.map { "\($0.formatted(.number.precision(.fractionLength(1)))) bd" }
    let baths = deal.baths.map { "\($0.formatted(.number.precision(.fractionLength(1)))) ba" }
    let value = [beds, baths].compactMap { $0 }.joined(separator: " / ")
    return value.isEmpty ? "Missing" : value.replacingOccurrences(of: ".0", with: "")
}

private enum DealPanel: String, CaseIterable, Identifiable {
    case overview = "Overview"
    case inputs = "Inputs"
    case strategy = "Strategy"
    case risk = "Risk"

    var id: String { rawValue }
}

private struct MetricLine: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .fontWeight(.bold)
        }
        .font(.subheadline)
        .padding(.vertical, 4)
    }
}

struct ActionLine: View {
    let title: String
    let severity: Severity

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: severity == .positive ? "checkmark.circle.fill" : "exclamationmark.triangle.fill")
                .foregroundStyle(severity.color)
            Text(title)
                .font(.subheadline.weight(.medium))
            Spacer()
        }
        .padding(12)
        .background(severity.color.opacity(0.08), in: RoundedRectangle(cornerRadius: 8))
    }
}

private struct StrategyFitRow: View {
    let name: String
    let detail: String
    let status: String

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(name)
                    .font(.subheadline.weight(.bold))
                Spacer()
                SeverityBadge(text: status, severity: status == "Selected" ? .positive : .caution)
            }
            Text(detail)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(12)
        .background(.background, in: RoundedRectangle(cornerRadius: 8))
        .overlay {
            RoundedRectangle(cornerRadius: 8).stroke(.quaternary)
        }
    }
}

#Preview {
    DealIQCockpitView()
        .environment(BRIXAppState())
}
