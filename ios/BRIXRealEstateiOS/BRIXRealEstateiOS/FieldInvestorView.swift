import SwiftUI

struct FieldInvestorView: View {
    @Environment(BRIXAppState.self) private var appState
    @State private var selectedCapture = "Photos"

    private let captureTypes = ["Photos", "Video", "Scan", "Voice"]

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                BrixCard {
                    VStack(alignment: .leading, spacing: 14) {
                        SectionHeader(title: "Field Investor Mode", subtitle: "Capture evidence from the property.", symbol: "camera.viewfinder")
                        Picker("Capture type", selection: $selectedCapture) {
                            ForEach(captureTypes, id: \.self) { type in
                                Text(type).tag(type)
                            }
                        }
                        .pickerStyle(.segmented)

                        Button {
                            appState.queuedOfflineActions.append(
                                OfflineAction(title: "\(selectedCapture) capture", detail: "Queued locally until sync is available")
                            )
                        } label: {
                            Label("Add \(selectedCapture)", systemImage: "plus.circle.fill")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                    }
                }

                BrixCard {
                    VStack(alignment: .leading, spacing: 12) {
                        SectionHeader(title: "Offline Queue", subtitle: "Uploads automatically when connected.", symbol: "icloud.and.arrow.up")
                        ForEach(appState.queuedOfflineActions) { action in
                            VStack(alignment: .leading, spacing: 3) {
                                Text(action.title).font(.subheadline.weight(.semibold))
                                Text(action.detail).font(.caption).foregroundStyle(.secondary)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(12)
                            .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 8))
                        }
                    }
                }

                BrixCard {
                    VStack(alignment: .leading, spacing: 12) {
                        SectionHeader(title: "Visual Scope Builder", subtitle: "Photos become preliminary scope intelligence.", symbol: "wrench.and.screwdriver")
                        ForEach(BrixDemoData.findings) { finding in
                            VisualFindingRow(finding: finding)
                        }
                    }
                }
            }
            .padding()
        }
        .background(Color.brixSurface)
    }
}

private struct VisualFindingRow: View {
    let finding: VisualFinding

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(finding.area).font(.headline)
                Spacer()
                SeverityBadge(text: "\(finding.confidence)%", severity: finding.severity)
            }
            Text(finding.finding)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Text(finding.estimate)
                .font(.subheadline.weight(.bold))
        }
        .padding(12)
        .background(.background, in: RoundedRectangle(cornerRadius: 8))
        .overlay {
            RoundedRectangle(cornerRadius: 8).stroke(.quaternary)
        }
    }
}

#Preview {
    FieldInvestorView()
        .environment(BRIXAppState())
}
