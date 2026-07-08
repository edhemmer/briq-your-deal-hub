import SwiftUI

struct FindIQView: View {
    @Environment(BRIXAppState.self) private var appState
    @State private var query = ""
    @State private var isShowingAddProperty = false
    @State private var draft = CreateDealDraft()

    private var filteredDeals: [DealSummary] {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard trimmed.isEmpty == false else { return appState.deals }
        return appState.deals.filter { deal in
            [deal.propertyAddress, deal.city, deal.county, deal.state, deal.zipCode, deal.propertyType, deal.listingURL]
                .compactMap { $0?.lowercased() }
                .contains { $0.contains(trimmed) }
        }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if appState.authState.isSignedIn == false {
                    SignInRequiredCard(
                        title: "Sign in to use FindIQ",
                        message: "FindIQ searches and ranks properties saved to your BRIX account. Live listing feeds can plug into the same queue when paid provider access is connected."
                    )
                } else {
                    searchPanel
                    queuePanel
                }

                if let error = appState.lastError {
                    ErrorCard(message: error)
                }
            }
            .padding()
        }
        .background(Color.brixSurface)
        .refreshable { await appState.refresh() }
        .sheet(isPresented: $isShowingAddProperty) {
            AddPropertySheet(draft: $draft) {
                let saved = await appState.createDeal(draft)
                if saved {
                    draft = CreateDealDraft()
                    isShowingAddProperty = false
                }
            }
        }
    }

    private var searchPanel: some View {
        BrixCard {
            VStack(alignment: .leading, spacing: 14) {
                SectionHeader(
                    title: "FindIQ",
                    subtitle: "Add a property, paste a listing URL, or search the properties already in BRIX.",
                    symbol: "magnifyingglass"
                )

                TextField("Address, city, ZIP, county, listing URL, or note", text: $query)
                    .textInputAutocapitalization(.words)
                    .textFieldStyle(.roundedBorder)

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                    Button {
                        isShowingAddProperty = true
                    } label: {
                        Label("Enter Property", systemImage: "square.and.pencil")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)

                    Button {
                        Task { await appState.refresh() }
                    } label: {
                        Label("Sync", systemImage: "arrow.clockwise")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                }

                Text("Live provider search is intentionally separated from manual entry. Until a paid listing provider is connected, only properties you add or import appear here.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private var queuePanel: some View {
        BrixCard {
            VStack(alignment: .leading, spacing: 14) {
                SectionHeader(
                    title: "Opportunity Queue",
                    subtitle: "Ranked from real properties saved to your account.",
                    symbol: "line.3.horizontal.decrease.circle"
                )

                if filteredDeals.isEmpty {
                    EmptyOperatingState(
                        title: "No properties in the queue",
                        message: "Enter the first property from a showing, listing URL, spreadsheet, or notes. BRIX will carry it into DealIQ without duplicate entry.",
                        symbol: "tray"
                    )
                } else {
                    ForEach(filteredDeals) { deal in
                        OpportunityRow(deal: deal)
                    }
                }
            }
        }
    }
}

private struct OpportunityRow: View {
    @Environment(BRIXAppState.self) private var appState
    let deal: DealSummary

    var body: some View {
        Button {
            appState.selectDeal(deal)
            appState.selectedTab = .deal
        } label: {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "house.lodge")
                    .font(.title3)
                    .foregroundStyle(Color.brixBlue)
                    .frame(width: 44, height: 44)
                    .background(.blue.opacity(0.10), in: RoundedRectangle(cornerRadius: 10))

                VStack(alignment: .leading, spacing: 6) {
                    Text(deal.title)
                        .font(.headline.weight(.bold))
                        .foregroundStyle(Color.brixInk)
                    Text(deal.locationLine.isEmpty ? "Location needs completion" : deal.locationLine)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    HStack {
                        if let price = deal.purchasePrice {
                            SeverityBadge(text: price.formatted(.currency(code: "USD").precision(.fractionLength(0))), severity: .neutral)
                        }
                        SeverityBadge(text: "\(deal.mobileCompletenessScore)/100", severity: deal.mobileCompletenessScore >= 80 ? .positive : .caution)
                    }
                }

                Spacer()
                Image(systemName: "chevron.right")
                    .foregroundStyle(.secondary)
            }
            .padding(12)
            .background(.background, in: RoundedRectangle(cornerRadius: 10))
            .overlay {
                RoundedRectangle(cornerRadius: 10).stroke(.quaternary)
            }
        }
        .buttonStyle(.plain)
    }
}

private struct AddPropertySheet: View {
    @Binding var draft: CreateDealDraft
    let onSave: () async -> Void
    @Environment(BRIXAppState.self) private var appState
    @Environment(\.dismiss) private var dismiss
    @State private var isSaving = false
    @State private var listingText = ""
    @State private var isExtracting = false
    @State private var extractionMessage: String?
    private let apiClient = BRIXAPIClient()

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Paste a listing")
                            .font(.headline)
                        Text("Paste a real estate listing URL, listing description, agent notes, or copied property facts. BRIX will prefill the deal file, then you verify before saving.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)

                        TextEditor(text: $listingText)
                            .frame(minHeight: 120)
                            .padding(8)
                            .background(Color.brixSurface, in: RoundedRectangle(cornerRadius: 10))
                            .overlay {
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(.quaternary)
                            }
                            .accessibilityLabel("Pasted listing text or URL")

                        Button {
                            Task { await extractListing() }
                        } label: {
                            Label(isExtracting ? "Extracting..." : "Extract Listing Details", systemImage: "sparkle.magnifyingglass")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(isExtracting || listingText.trimmingCharacters(in: .whitespacesAndNewlines).count < 8)

                        if let extractionMessage {
                            Text(extractionMessage)
                                .font(.footnote.weight(.medium))
                                .foregroundStyle(.secondary)
                        }
                    }
                } header: {
                    Text("Fast intake")
                }

                Section("Property") {
                    TextField("Property address", text: $draft.propertyAddress)
                        .textContentType(.streetAddressLine1)
                    TextField("City", text: $draft.city)
                        .textContentType(.addressCity)
                    TextField("County", text: $draft.county)
                        .textContentType(.addressCity)
                    TextField("State", text: $draft.state)
                        .textInputAutocapitalization(.characters)
                    TextField("ZIP", text: $draft.zipCode)
                        .keyboardType(.numbersAndPunctuation)
                        .textContentType(.postalCode)
                    TextField("Property type", text: $draft.propertyType)
                }

                Section("Acquisition facts") {
                    TextField("Purchase price", text: $draft.purchasePrice)
                        .keyboardType(.decimalPad)
                    TextField("Monthly rent estimate", text: $draft.monthlyRent)
                        .keyboardType(.decimalPad)
                    TextField("Annual property taxes", text: $draft.annualTaxes)
                        .keyboardType(.decimalPad)
                    TextField("Annual insurance quote", text: $draft.annualInsurance)
                        .keyboardType(.decimalPad)
                    TextField("Beds", text: $draft.beds)
                        .keyboardType(.decimalPad)
                    TextField("Baths", text: $draft.baths)
                        .keyboardType(.decimalPad)
                    TextField("Square feet", text: $draft.squareFeet)
                        .keyboardType(.decimalPad)
                    TextField("Year built", text: $draft.yearBuilt)
                        .keyboardType(.numberPad)
                    TextField("Primary strategy", text: $draft.strategy)
                }

                Section("Listing source") {
                    TextField("Listing URL", text: $draft.listingURL)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    TextField("Listing text, agent notes, or showing notes", text: $draft.notes, axis: .vertical)
                        .lineLimit(4...10)
                }

                Section {
                    Text("BRIX saves this as \(draft.sourceConfidence.replacingOccurrences(of: "_", with: " ")) until source-backed records, rent support, insurance, taxes, and condition evidence are verified. Insurance should be entered as an annual quote.")
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

    private func extractListing() async {
        let text = listingText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard text.count >= 8 else { return }

        isExtracting = true
        extractionMessage = nil
        defer { isExtracting = false }

        do {
            let response = try await apiClient.extractListing(from: text, session: appState.session)
            draft.apply(response.extracted, originalText: text)
            extractionMessage = response.warning ?? "Listing details extracted. Review every field before saving."
        } catch {
            let fallback = ListingTextParser.localExtract(from: text)
            draft.apply(fallback, originalText: text)
            extractionMessage = "BRIX used on-device parsing because live extraction was unavailable. Review every field before saving."
        }
    }
}

#Preview {
    FindIQView()
        .environment(BRIXAppState())
}
