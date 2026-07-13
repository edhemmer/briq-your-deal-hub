import SwiftUI

struct FindIQView: View {
    @EnvironmentObject private var state: AppState
    @State private var intake = ""
    @State private var strategy = StrategyId.ownerOccupant
    @State private var message = ""
    @State private var isCreating = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    BrixCard {
                        VStack(alignment: .leading, spacing: 14) {
                            Text("Start the deal file").font(.largeTitle.bold())
                            HStack(spacing: 10) {
                                FindStep(number: "1", title: "Property")
                                FindStep(number: "2", title: "Strategy")
                                FindStep(number: "3", title: "Analyze")
                            }
                            Text("Enter one property and choose the strategy BRIX should evaluate first.")
                                .foregroundStyle(Brix.muted)
                            if state.accessToken.isEmpty {
                                Label("You can start now. Sign in from Account when you want this deal available on every device.", systemImage: "iphone.and.arrow.forward")
                                    .font(.subheadline)
                                    .foregroundStyle(Brix.cyan)
                                    .padding(12)
                                    .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(Brix.cyan.opacity(0.10)))
                            }
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
                                Task {
                                    let cleaned = intake.trimmingCharacters(in: .whitespacesAndNewlines)
                                    guard !cleaned.isEmpty else {
                                        message = "Enter a property first."
                                        return
                                    }
                                    message = ""
                                    isCreating = true
                                    await state.createDeal(from: cleaned, strategy: strategy)
                                    isCreating = false
                                    if state.tab != .deal {
                                        message = state.authMessage.isEmpty ? "Deal was not created." : state.authMessage
                                    }
                                }
                            } label: {
                                Label(isCreating ? "Creating Deal File" : "Create Deal File", systemImage: "plus.circle.fill").frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(Brix.blue)
                            .disabled(isCreating)
                            if !message.isEmpty { Text(message).foregroundStyle(Brix.amber) }
                        }
                    }
                    BrixCard {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Next").font(.headline)
                            Text("DealIQ opens after the deal file saves. Add photos, missing facts, and verification items there.")
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

private struct FindStep: View {
    let number: String
    let title: String

    var body: some View {
        VStack(spacing: 6) {
            Text(number)
                .font(.caption.bold())
                .frame(width: 26, height: 26)
                .background(Circle().fill(Brix.blue))
            Text(title)
                .font(.caption.bold())
                .foregroundStyle(Brix.muted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(Brix.ink.opacity(0.46)))
    }
}
