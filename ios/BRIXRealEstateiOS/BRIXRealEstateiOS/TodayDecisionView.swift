import SwiftUI

struct TodayDecisionView: View {
    @Environment(BRIXAppState.self) private var appState

    var body: some View {
        @Bindable var appState = appState

        ScrollView {
            VStack(spacing: 16) {
                if appState.authState.isSignedIn == false {
                    SignInRequiredCard(
                        title: "Sign in to run BRIX on iPhone or iPad",
                        message: "Your mobile app connects to the same BRIX backend as the web app. Deals, field captures, decisions, and portfolio records stay tied to your account."
                    )
                } else if appState.isLoading {
                    ProgressView("Loading BRIX deal files")
                        .frame(maxWidth: .infinity)
                        .padding(32)
                } else if let deal = appState.selectedDeal {
                    DecisionBoard(deal: deal, snapshot: appState.selectedDecisionSnapshot)

                    BrixCard {
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeader(title: "Next Best Actions", subtitle: "Work that improves confidence fastest.", symbol: "checklist")
                            let missing = deal.missingInputs
                            if missing.isEmpty {
                                ActionRow(title: "Run source review, stress case, and professional diligence before committing capital.", severity: .info)
                            } else {
                                ForEach(missing.prefix(4), id: \.self) { item in
                                    ActionRow(title: "Verify \(item.lowercased()).", severity: .caution)
                                }
                            }
                        }
                    }

                    BrixCard {
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeader(title: "Mentor Mode", subtitle: "Guidance adapts to investor experience.", symbol: "graduationcap")
                            Picker("Investor level", selection: $appState.investorLevel) {
                                ForEach(InvestorLevel.allCases) { level in
                                    Text(level.rawValue).tag(level)
                                }
                            }
                            .pickerStyle(.segmented)
                            Text(appState.investorLevel.mentorMessage)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    }

                    DealListCard()
                } else {
                    EmptyOperatingState(
                        title: "No deal files yet",
                        message: "Add or import a property in BRIX web, then refresh here. Mobile deal creation can be added after the backend intake endpoint is available.",
                        symbol: "tray"
                    )
                }

                if let error = appState.lastError {
                    ErrorCard(message: error)
                }
            }
            .padding()
        }
        .refreshable {
            await appState.refresh()
        }
        .background(Color.brixSurface)
    }
}

private struct DecisionBoard: View {
    let deal: DealSummary
    let snapshot: DecisionSnapshot?

    var body: some View {
        BrixCard {
            VStack(alignment: .leading, spacing: 14) {
                SectionHeader(title: "Deal Dashboard", subtitle: "Current mobile decision view.", symbol: "target")

                VStack(alignment: .leading, spacing: 4) {
                    Text(deal.title)
                        .font(.largeTitle.weight(.black))
                        .foregroundStyle(Color.brixInk)
                    if deal.locationLine.isEmpty == false {
                        Text(deal.locationLine)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }

                if let snapshot {
                    Text(snapshot.recommendation)
                        .font(.title3.weight(.bold))
                    Text(snapshot.primaryRisk)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                } else {
                    Text("No backend recommendation has been generated for this deal yet.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                    ScorePill(label: "Mobile file", value: "\(deal.mobileCompletenessScore)/100", severity: deal.mobileCompletenessScore >= 80 ? .positive : .caution)
                    ScorePill(label: "Trust", value: snapshot.map { "\($0.trustScore)/100" } ?? "Pending", severity: snapshot == nil ? .neutral : .info)
                    ScorePill(label: "Readiness", value: snapshot.map { "\($0.readinessScore)/100" } ?? "Pending", severity: snapshot == nil ? .neutral : .caution)
                    ScorePill(label: "Confidence", value: snapshot.map { "\($0.confidence)%" } ?? "Pending", severity: snapshot == nil ? .neutral : .caution)
                }
            }
        }
    }
}

private struct DealListCard: View {
    @Environment(BRIXAppState.self) private var appState

    var body: some View {
        BrixCard {
            VStack(alignment: .leading, spacing: 12) {
                SectionHeader(title: "Active Deal Files", subtitle: "Tap a property to work it on mobile.", symbol: "list.bullet.rectangle")
                ForEach(appState.deals) { deal in
                    Button {
                        appState.selectDeal(deal)
                    } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: 3) {
                                Text(deal.title)
                                    .font(.subheadline.weight(.semibold))
                                Text(deal.locationLine.isEmpty ? "Location incomplete" : deal.locationLine)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            SeverityBadge(text: "\(deal.mobileCompletenessScore)", severity: deal.mobileCompletenessScore >= 80 ? .positive : .caution)
                        }
                        .padding(12)
                        .background(.background, in: RoundedRectangle(cornerRadius: 8))
                        .overlay {
                            RoundedRectangle(cornerRadius: 8).stroke(.quaternary)
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

private struct ActionRow: View {
    let title: String
    let severity: Severity

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: severity == .risk ? "exclamationmark.triangle.fill" : "checkmark.circle.fill")
                .foregroundStyle(severity.color)
            Text(title)
                .font(.subheadline.weight(.medium))
            Spacer()
        }
        .padding(12)
        .background(severity.color.opacity(0.08), in: RoundedRectangle(cornerRadius: 8))
    }
}

#Preview {
    TodayDecisionView()
        .environment(BRIXAppState())
}
