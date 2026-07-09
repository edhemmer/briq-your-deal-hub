import SwiftUI

struct DigitalTwinView: View {
    @Environment(BRIXAppState.self) private var appState
    @State private var searchText = ""
    @State private var isAddingDeal = false
    @State private var draft = CreateDealDraft()

    var filteredDeals: [DealSummary] {
        guard searchText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false else {
            return appState.deals
        }
        let query = searchText.lowercased()
        return appState.deals.filter { deal in
            [deal.propertyAddress, deal.city, deal.state, deal.zipCode, deal.propertyType]
                .compactMap { $0?.lowercased() }
                .contains { $0.contains(query) }
        }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if appState.authState.isSignedIn == false {
                    SignInRequiredCard(
                        title: "Sign in to use FindIQ",
                        message: "Search, rank, and open your saved properties."
                    )
                } else {
                    BrixCard {
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeader(title: "FindIQ", subtitle: "Create, search, and rank properties.", symbol: "magnifyingglass")
                            TextField("", text: $searchText)
                                .textFieldStyle(.roundedBorder)

                            HStack {
                                Button {
                                    isAddingDeal = true
                                } label: {
                                    Label("Enter Property", systemImage: "plus")
                                        .frame(maxWidth: .infinity)
                                }
                                .buttonStyle(.borderedProminent)

                                Button {
                                    Task { await appState.refresh() }
                                } label: {
                                    Label("Refresh", systemImage: "arrow.clockwise")
                                        .frame(maxWidth: .infinity)
                                }
                                .buttonStyle(.bordered)
                            }
                        }
                    }

                    if filteredDeals.isEmpty {
                        EmptyOperatingState(
                            title: "No properties found",
                            message: "Add the first property to begin ranking, comparison, and analysis.",
                            symbol: "house"
                        )
                    } else {
                        ForEach(filteredDeals) { deal in
                            DealSearchRow(deal: deal)
                        }
                    }
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
        .brixScreenBackground()
        .sheet(isPresented: $isAddingDeal) {
            AddDealSheet(draft: $draft) {
                let saved = await appState.createDeal(draft)
                if saved {
                    draft = CreateDealDraft()
                    isAddingDeal = false
                }
            }
        }
    }
}

private struct AddDealSheet: View {
    @Binding var draft: CreateDealDraft
    let onSave: () async -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var isSaving = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Property") {
                    TextField("", text: $draft.propertyAddress)
                        .textContentType(.streetAddressLine1)
                    TextField("", text: $draft.city)
                        .textContentType(.addressCity)
                    TextField("", text: $draft.state)
                        .textInputAutocapitalization(.characters)
                    TextField("", text: $draft.zipCode)
                        .keyboardType(.numbersAndPunctuation)
                        .textContentType(.postalCode)
                }

                Section("Deal facts") {
                    TextField("", text: $draft.propertyType)
                    TextField("", text: $draft.purchasePrice)
                        .keyboardType(.decimalPad)
                    TextField("", text: $draft.monthlyRent)
                        .keyboardType(.decimalPad)
                    TextField("", text: $draft.annualTaxes)
                        .keyboardType(.decimalPad)
                    TextField("", text: $draft.annualInsurance)
                        .keyboardType(.decimalPad)
                    TextField("", text: $draft.strategy)
                }

                Section("Source") {
                    TextField("", text: $draft.listingURL)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    TextField("", text: $draft.notes, axis: .vertical)
                        .lineLimit(3...7)
                }

                Section {
                    if let readinessMessage = draft.saveReadinessMessage {
                        Text(readinessMessage)
                            .font(.footnote.weight(.semibold))
                            .foregroundStyle(.secondary)
                    }
                    Text("Save the property as soon as you have an address. Add rent, taxes, annual insurance, photos, and notes as you verify the deal.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Enter Property")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(isSaving ? "Saving..." : "Save") {
                        Task {
                            isSaving = true
                            await onSave()
                            isSaving = false
                        }
                    }
                    .disabled(isSaving || draft.isReadyToSave == false)
                }
            }
        }
    }
}

private struct DealSearchRow: View {
    @Environment(BRIXAppState.self) private var appState
    let deal: DealSummary

    var body: some View {
        BrixCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(deal.title)
                            .font(.headline.bold())
                        Text(deal.locationLine.isEmpty ? "Location incomplete" : deal.locationLine)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    SeverityBadge(text: "\(deal.mobileCompletenessScore)", severity: deal.mobileCompletenessScore >= 80 ? .positive : .caution)
                }

                HStack {
                    if let propertyType = deal.propertyType {
                        SeverityBadge(text: propertyType, severity: .info)
                    }
                    if let strategy = deal.strategyPrimary {
                        SeverityBadge(text: strategy, severity: .neutral)
                    }
                    SeverityBadge(text: deal.displayStatus, severity: .caution)
                }

                Button {
                    appState.selectDeal(deal)
                    appState.selectedTab = .deal
                } label: {
                    Label("Open in DealIQ", systemImage: "chart.bar.xaxis")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
            }
        }
    }
}
