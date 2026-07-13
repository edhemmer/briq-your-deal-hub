import SwiftUI

struct ContractIQView: View {
    @EnvironmentObject private var state: AppState
    @State private var contractText = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    BrixCard {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("ContractIQ").font(.largeTitle.bold())
                            Text(state.selectedDeal?.address ?? "No active deal selected").foregroundStyle(Brix.muted)
                            TextEditor(text: $contractText)
                                .frame(minHeight: 180)
                                .scrollContentBackground(.hidden)
                                .padding(10)
                                .background(RoundedRectangle(cornerRadius: 16).fill(Color.black.opacity(0.18)))
                                .overlay(RoundedRectangle(cornerRadius: 16).stroke(Brix.line))
                        }
                    }
                    BrixCard {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Risk review").font(.title2.bold())
                            if contractText.isEmpty {
                                Text("Paste contract language to check inspection, financing, appraisal, HOA, earnest money, closing, and condition risk.")
                                    .foregroundStyle(Brix.muted)
                            } else {
                                ForEach(findings(), id: \.self) { finding in
                                    Label(finding, systemImage: "exclamationmark.triangle").foregroundStyle(Brix.amber)
                                }
                            }
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("ContractIQ")
            .brixScreen()
        }
    }

    private func findings() -> [String] {
        let text = contractText.lowercased()
        var output: [String] = []
        if text.contains("as-is") || text.contains("as is") { output.append("As-is language shifts condition risk. Verify inspection and cancellation rights.") }
        if text.contains("hoa") || text.contains("association") { output.append("HOA language may affect parking, rentals, fees, and use restrictions.") }
        if text.contains("inspection") { output.append("Inspection clause found. Confirm deadline and walk-away rights.") }
        if text.contains("financ") { output.append("Financing clause found. Confirm loan approval deadline and contingency terms.") }
        if text.contains("appraisal") { output.append("Appraisal clause found. Confirm shortfall protection.") }
        if text.contains("earnest") { output.append("Earnest money clause found. Confirm amount, due date, holder, and refund conditions.") }
        if output.isEmpty { output.append("No major deterministic signals found. Professional review is still required before signing.") }
        return output
    }
}
