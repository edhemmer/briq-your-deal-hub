import SwiftUI
import PhotosUI

struct DealIQCockpitView: View {
    @EnvironmentObject private var state: AppState
    @State private var selectedPhotos: [PhotosPickerItem] = []

    var body: some View {
        NavigationStack {
            Group {
                if var deal = state.selectedDeal {
                    let analysis = state.analysis(for: deal)
                    ScrollView {
                        VStack(alignment: .leading, spacing: 18) {
                            BrixCard {
                                VStack(alignment: .leading, spacing: 14) {
                                    Text(analysis.decision).font(.largeTitle.bold())
                                    Text(deal.address).foregroundStyle(Brix.muted)
                                    HStack { BrixMetric(title: "Confidence", value: analysis.confidence); BrixMetric(title: "Readiness", value: analysis.readiness) }
                                    VStack(alignment: .leading, spacing: 8) {
                                        Text("Monthly payment: \(currency(analysis.monthlyPayment))").foregroundStyle(Brix.muted)
                                        Text("Monthly cash flow: \(currency(analysis.monthlyCashFlow))").foregroundStyle(Brix.muted)
                                        Text("DSCR: \(dscr(analysis.dscr))").foregroundStyle(Brix.muted)
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
                                    Text("BRIX compares the selected strategy against alternatives and lowers confidence when required facts are missing.")
                                        .foregroundStyle(Brix.muted)
                                }
                            }
                            BrixCard {
                                VStack(alignment: .leading, spacing: 12) {
                                    Text("Strategy comparison").font(.title2.bold())
                                    Text(analysis.strategyHeadline).font(.headline)
                                    Text(analysis.strategyExplanation).foregroundStyle(Brix.muted)
                                    HStack {
                                        strategyFact("Selected", value: deal.strategy.title)
                                        strategyFact("Top fit", value: analysis.bestStrategyName)
                                        BrixMetric(title: "Gap", value: analysis.strategyScoreGap)
                                    }
                                    challengeSection("Tradeoffs", items: analysis.strategyTradeoffs)
                                    challengeSection("Verify before switching", items: analysis.strategyVerification)
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
                        }
                        .padding()
                    }
                } else {
                    ContentUnavailableView("No Deal File", systemImage: "house", description: Text("Start in FindIQ."))
                }
            }
            .navigationTitle("DealIQ")
            .brixScreen()
        }
    }

    private func money(_ label: String, value: Binding<Double?>) -> some View {
        TextField(label, value: value, format: .number)
            .keyboardType(.decimalPad)
            .textFieldStyle(.roundedBorder)
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
