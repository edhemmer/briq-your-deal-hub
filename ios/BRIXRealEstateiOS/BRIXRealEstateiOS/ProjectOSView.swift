import SwiftUI

struct ProjectOSView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                BrixCard {
                    SectionHeader(title: "Project OS", subtitle: "Every strategy requires execution tracking.", symbol: "checklist")
                }

                ForEach(BrixDemoData.projectTasks) { task in
                    BrixCard {
                        HStack(alignment: .top) {
                            VStack(alignment: .leading, spacing: 5) {
                                Text(task.title).font(.headline)
                                Text("\(task.owner) - \(task.due)").font(.caption).foregroundStyle(.secondary)
                            }
                            Spacer()
                            SeverityBadge(text: task.severity.rawValue, severity: task.severity)
                        }
                    }
                }
            }
            .padding()
        }
        .background(Color.brixSurface)
    }
}
