import SwiftUI
import PhotosUI
import UIKit

enum DecisionCockpitNativeLayoutMode: String {
    case iphoneCompact
    case iphoneRegular
    case ipadPortrait
    case ipadLandscape
}

struct DecisionCockpitNativePresentationContract {
    let contractVersion = "decision-cockpit-presentation-contract-v1"
    let layoutMode: DecisionCockpitNativeLayoutMode
    let columnCount: Int
    let horizontalPadding: CGFloat
    let cardSpacing: CGFloat
    let priorityOrder = [
        "recommendation",
        "deal_status",
        "strongest_strategy",
        "selected_strategy",
        "key_numbers",
        "risks",
        "confidence",
        "missing_inputs",
        "deadlines",
        "next_action",
        "recent_changes",
        "supporting_detail",
    ]
    let sourceBoundary = DecisionCockpitNativeSourceBoundary()
    let supportsSafeArea = true
    let supportsDynamicType = true
    let supportsVoiceOver = true
    let supportsTouch = true
    let preservesCanonicalPriority = true

    static func build(horizontalSizeClass: UserInterfaceSizeClass?, dynamicTypeSize: DynamicTypeSize) -> DecisionCockpitNativePresentationContract {
        let isPad = UIDevice.current.userInterfaceIdiom == .pad
        let accessibilityText = dynamicTypeSize.isAccessibilitySize
        if isPad {
            let landscape = horizontalSizeClass == .regular
            return DecisionCockpitNativePresentationContract(
                layoutMode: landscape ? .ipadLandscape : .ipadPortrait,
                columnCount: landscape && !accessibilityText ? 2 : 1,
                horizontalPadding: landscape ? 28 : 22,
                cardSpacing: 16
            )
        }
        return DecisionCockpitNativePresentationContract(
            layoutMode: accessibilityText ? .iphoneCompact : .iphoneRegular,
            columnCount: 1,
            horizontalPadding: 16,
            cardSpacing: 14
        )
    }
}

struct DecisionCockpitNativeSourceBoundary {
    let projectionReadOnly = true
    let noUnderwritingCalculation = true
    let noStrategyRanking = true
    let noRecommendationCalculation = true
    let noConfidenceMath = true
    let noStaleStateCalculation = true
    let noUrgencyCalculation = true
    let noProviderCalls = true
    let noPersistence = true
}

struct DealIQCockpitView: View {
    @EnvironmentObject private var state: AppState
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var selectedPhotos: [PhotosPickerItem] = []

    var body: some View {
        NavigationStack {
            Group {
                if var deal = state.selectedDeal {
                    let analysis = state.analysis(for: deal)
                    let presentation = DecisionCockpitNativePresentationContract.build(
                        horizontalSizeClass: horizontalSizeClass,
                        dynamicTypeSize: dynamicTypeSize
                    )
                    ScrollView {
                        VStack(alignment: .leading, spacing: presentation.cardSpacing) {
                            decisionHeader(deal: deal, analysis: analysis)
                            LazyVGrid(columns: gridColumns(for: presentation), alignment: .leading, spacing: presentation.cardSpacing) {
                                BrixCard {
                                    VStack(alignment: .leading, spacing: 12) {
                                        Text("Key numbers").font(.title2.bold())
                                        statLine("Monthly payment", value: currency(analysis.monthlyPayment))
                                        statLine("Monthly cash flow", value: currency(analysis.monthlyCashFlow))
                                        statLine("DSCR", value: dscr(analysis.dscr))
                                        HStack {
                                            BrixMetric(title: "Confidence", value: analysis.confidence)
                                            BrixMetric(title: "Readiness", value: analysis.readiness)
                                        }
                                    }
                                }
                                BrixCard {
                                    VStack(alignment: .leading, spacing: 12) {
                                        Text("Deal facts").font(.title2.bold())
                                        money("Purchase price", value: Binding(get: { deal.listPrice }, set: { deal.listPrice = $0; state.selectedDeal = deal }))
                                        money("Annual taxes", value: Binding(get: { deal.annualTaxes }, set: { deal.annualTaxes = $0; state.selectedDeal = deal }))
                                        money("Annual insurance", value: Binding(get: { deal.annualInsurance }, set: { deal.annualInsurance = $0; state.selectedDeal = deal }))
                                        money("Monthly rent", value: Binding(get: { deal.monthlyRent }, set: { deal.monthlyRent = $0; state.selectedDeal = deal }))
                                        money("Rehab budget", value: Binding(get: { deal.rehabBudget }, set: { deal.rehabBudget = $0; state.selectedDeal = deal }))
                                    }
                                }
                                BrixCard {
                                    VStack(alignment: .leading, spacing: 10) {
                                        Text("Strategy").font(.title2.bold())
                                        Picker("Strategy", selection: Binding(get: { deal.strategy }, set: { deal.strategy = $0; state.selectedDeal = deal })) {
                                            ForEach(StrategyId.allCases) { item in Text(item.title).tag(item) }
                                        }
                                        .pickerStyle(.navigationLink)
                                        Text(analysis.strategyHeadline).font(.headline)
                                        Text(analysis.strategyExplanation).foregroundStyle(Brix.muted)
                                    }
                                }
                                BrixCard {
                                    VStack(alignment: .leading, spacing: 12) {
                                        Text("Strategy comparison").font(.title2.bold())
                                        HStack {
                                            strategyFact("Selected", value: deal.strategy.title)
                                            strategyFact("Top fit", value: analysis.bestStrategyName)
                                            BrixMetric(title: "Gap", value: analysis.strategyScoreGap)
                                        }
                                        challengeSection("Tradeoffs", items: analysis.strategyTradeoffs)
                                        challengeSection("Verify before switching", items: analysis.strategyVerification)
                                    }
                                }
                            }
                            BrixCard {
                                VStack(alignment: .leading, spacing: 10) {
                                    Text("Next actions").font(.title2.bold())
                                    ForEach(analysis.nextActions, id: \.self) { action in Label(action, systemImage: "checkmark.seal").foregroundStyle(Brix.muted) }
                                }
                            }
                            BrixCard {
                                VStack(alignment: .leading, spacing: 12) {
                                    Text("Decision challenge").font(.title2.bold())
                                    challengeSection("Key risks", items: analysis.keyRisks)
                                    challengeSection("Bull case", items: analysis.bullCase)
                                    challengeSection("Bear case", items: analysis.bearCase)
                                    challengeSection("What must be true", items: analysis.whatMustBeTrue)
                                    challengeSection("Failure scenarios", items: analysis.failureScenarios)
                                    challengeSection("Alternatives", items: analysis.alternativeStrategies)
                                }
                            }
                            BrixCard {
                                VStack(alignment: .leading, spacing: 10) {
                                    Text("Photos").font(.title2.bold())
                                    PhotosPicker(selection: $selectedPhotos, maxSelectionCount: 20, matching: .images) {
                                        Label("Add Property Photos", systemImage: "camera.fill")
                                            .frame(maxWidth: .infinity)
                                    }
                                    .buttonStyle(.borderedProminent)
                                    .tint(Brix.blue)
                                    .onChange(of: selectedPhotos) { _, newItems in
                                        deal.photoNames = newItems.enumerated().map { "Property photo \($0.offset + 1)" }
                                        state.selectedDeal = deal
                                    }
                                    if !deal.photoNames.isEmpty {
                                        ForEach(deal.photoNames, id: \.self) { name in
                                            Label(name, systemImage: "photo").foregroundStyle(Brix.muted)
                                        }
                                    }
                                }
                            }
                            Button(role: .destructive) { state.deleteSelectedDeal() } label: { Label("Delete Deal", systemImage: "trash") }
                                .frame(minHeight: 44)
                        }
                        .padding(.horizontal, presentation.horizontalPadding)
                        .padding(.vertical, 16)
                        .animation(reduceMotion ? nil : .easeInOut(duration: 0.18), value: presentation.layoutMode.rawValue)
                    }
                } else {
                    ContentUnavailableView("No Deal File", systemImage: "house", description: Text("Start in FindIQ."))
                }
            }
            .navigationTitle("DealIQ")
            .brixScreen()
        }
    }

    private func decisionHeader(deal: Deal, analysis: DealAnalysis) -> some View {
        BrixCard {
            VStack(alignment: .leading, spacing: 14) {
                Text(analysis.decision)
                    .font(.largeTitle.bold())
                    .minimumScaleFactor(0.78)
                    .accessibilityAddTraits(.isHeader)
                Text(deal.address.isEmpty ? "Address not saved" : deal.address)
                    .foregroundStyle(Brix.muted)
                if !analysis.missing.isEmpty {
                    Label("\(analysis.missing.count) item\(analysis.missing.count == 1 ? "" : "s") need completion", systemImage: "exclamationmark.triangle")
                        .foregroundStyle(Brix.amber)
                        .font(.headline)
                }
            }
        }
    }

    private func gridColumns(for presentation: DecisionCockpitNativePresentationContract) -> [GridItem] {
        Array(repeating: GridItem(.flexible(), spacing: presentation.cardSpacing, alignment: .top), count: presentation.columnCount)
    }

    private func money(_ label: String, value: Binding<Double?>) -> some View {
        TextField(label, value: value, format: .number)
            .keyboardType(.decimalPad)
            .textFieldStyle(.roundedBorder)
            .frame(minHeight: 44)
    }

    private func statLine(_ label: String, value: String) -> some View {
        HStack {
            Text(label).foregroundStyle(Brix.muted)
            Spacer()
            Text(value).fontWeight(.semibold)
        }
    }

    private func currency(_ value: Double?) -> String {
        guard let value else { return "Missing" }
        return value.formatted(.currency(code: "USD").precision(.fractionLength(0)))
    }

    private func dscr(_ value: Double?) -> String {
        guard let value else { return "Missing" }
        return "\(value)x"
    }

    private func strategyFact(_ title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.caption).foregroundStyle(Brix.muted)
            Text(value).font(.headline).foregroundStyle(.white).lineLimit(2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(Brix.panel))
    }

    private func challengeSection(_ title: String, items: [String]) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).font(.headline)
            ForEach(items, id: \.self) { item in
                Label(item, systemImage: "exclamationmark.triangle")
                    .font(.subheadline)
                    .foregroundStyle(Brix.muted)
            }
        }
    }
}
