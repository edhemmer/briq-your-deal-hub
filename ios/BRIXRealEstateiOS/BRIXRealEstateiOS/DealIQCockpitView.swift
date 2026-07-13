import SwiftUI

struct DealIQCockpitView: View {
    @EnvironmentObject private var state: AppState

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
                                VStack(alignment: .leading, spacing: 10) {
                                    Text("Next actions").font(.title2.bold())
                                    ForEach(analysis.nextActions, id: \.self) { action in Label(action, systemImage: "checkmark.seal").foregroundStyle(Brix.muted) }
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
}
