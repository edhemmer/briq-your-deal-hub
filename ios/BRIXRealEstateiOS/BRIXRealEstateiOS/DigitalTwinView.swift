import SwiftUI

struct DigitalTwinView: View {
    private let property = BrixDemoData.property

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                BrixCard {
                    VStack(alignment: .leading, spacing: 12) {
                        SectionHeader(title: "Property Digital Twin", subtitle: "One property, one source of truth.", symbol: "house.and.flag")
                        Text(property.address)
                            .font(.title.bold())
                        HStack {
                            SeverityBadge(text: property.propertyType, severity: .info)
                            SeverityBadge(text: property.ownershipStatus, severity: .caution)
                            SeverityBadge(text: property.verificationStatus.rawValue, severity: .info)
                        }
                    }
                }

                BrixCard {
                    VStack(alignment: .leading, spacing: 12) {
                        SectionHeader(title: "Timeline", subtitle: "All events attach to the Digital Twin.", symbol: "timeline.selection")
                        ForEach(property.timeline) { event in
                            HStack(alignment: .top, spacing: 12) {
                                Circle()
                                    .fill(Color.brixBlue)
                                    .frame(width: 10, height: 10)
                                    .padding(.top, 5)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(event.title).font(.subheadline.weight(.semibold))
                                    Text("\(event.stage) - \(event.date)").font(.caption).foregroundStyle(.secondary)
                                }
                                Spacer()
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
