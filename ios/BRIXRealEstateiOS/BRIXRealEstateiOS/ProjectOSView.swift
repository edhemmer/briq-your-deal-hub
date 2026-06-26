import SwiftUI

struct ProjectOSView: View {
    @Environment(BRIXAppState.self) private var appState

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if appState.projectTasks.isEmpty {
                    EmptyOperatingState(
                        title: "No execution tasks",
                        message: "Due diligence, offer, inspection, financing, and closing tasks should come from PipelineIQ and Project OS backend services.",
                        symbol: "checklist"
                    )
                } else {
                    ForEach(appState.projectTasks) { task in
                        BrixCard {
                            HStack(alignment: .top) {
                                VStack(alignment: .leading, spacing: 5) {
                                    Text(task.title).font(.headline)
                                    Text([task.owner, task.due].compactMap { $0 }.joined(separator: " - "))
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                SeverityBadge(text: task.severity.rawValue, severity: task.severity)
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
