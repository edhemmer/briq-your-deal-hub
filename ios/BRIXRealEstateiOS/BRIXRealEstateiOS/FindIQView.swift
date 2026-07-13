import SwiftUI

struct FindIQView: View {
    @EnvironmentObject private var state: AppState
    @State private var intake = ""
    @State private var strategy = StrategyId.ownerOccupant
    @State private var message = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    BrixCard {
                        VStack(alignment: .leading, spacing: 14) {
                            Text("Start with one property").font(.largeTitle.bold())
                            Text("Enter an address, paste a listing URL, or paste listing text. Choose the strategy BRIX should evaluate first.")
                                .foregroundStyle(Brix.muted)
                            TextEditor(text: $intake)
                                .frame(minHeight: 140)
                                .scrollContentBackground(.hidden)
                                .padding(10)
                                .background(RoundedRectangle(cornerRadius: 16).fill(Color.black.opacity(0.18)))
                                .overlay(RoundedRectangle(cornerRadius: 16).stroke(Brix.line))
                            Picker("Strategy", selection: $strategy) {
                                ForEach(StrategyId.allCases) { item in Text(item.title).tag(item) }
                            }
                            .pickerStyle(.navigationLink)
                            Button {
                                let cleaned = intake.trimmingCharacters(in: .whitespacesAndNewlines)
                                guard !cleaned.isEmpty else {
                                    message = "Enter a property first."
                                    return
                                }
                                state.createDeal(from: cleaned, strategy: strategy)
                            } label: {
                                Label("Create Deal File", systemImage: "plus.circle.fill").frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(Brix.blue)
                            if !message.isEmpty { Text(message).foregroundStyle(Brix.amber) }
                        }
                    }
                    BrixCard {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Photo capture").font(.headline)
                            Text("After a deal file is created, open DealIQ to add listing photos, field photos, and drive-by observations.")
                                .foregroundStyle(Brix.muted)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("FindIQ")
            .brixScreen()
        }
    }
}
