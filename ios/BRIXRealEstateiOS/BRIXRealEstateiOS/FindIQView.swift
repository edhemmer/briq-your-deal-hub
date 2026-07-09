import SwiftUI

struct FindIQView: View {
    @Environment(BRIXAppState.self) private var appState
    @State private var queueSearch = ""
    @State private var quickStart = ""
    @State private var intakeStep: FindIQIntakeStep = .property
    @State private var draft = CreateDealDraft()
    @State private var listingText = ""
    @State private var isExtracting = false
    @State private var isSaving = false
    @State private var intakeMessage: String?

    private var filteredDeals: [DealSummary] {
        let trimmed = queueSearch.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
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
                        message: "FindIQ ranks properties saved to your BRIX account so you know which opportunities deserve attention first."
                    )
                } else {
                    intakePanel
                    queuePanel
                    if appState.selectedDeal != nil {
                        PropertyCapturePanel()
                    }
                }

                if let error = appState.lastError {
                    ErrorCard(message: error)
                }
            }
            .padding()
        }
        .brixScreenBackground()
        .refreshable { await appState.refresh() }
    }

    private var intakePanel: some View {
        BrixCard {
            VStack(alignment: .leading, spacing: 16) {
                SectionHeader(
                    title: "FindIQ",
                    subtitle: "Add a property, review the queue, open DealIQ.",
                    symbol: "magnifyingglass"
                )

                if intakeStep == .property {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Address or listing link")
                            .font(.subheadline.weight(.bold))
                        TextField("", text: $quickStart)
                            .textInputAutocapitalization(.words)
                            .autocorrectionDisabled()
                            .textFieldStyle(.roundedBorder)
                            .accessibilityLabel("Address or listing URL")

                        Button {
                            Task { await startQuickProperty() }
                        } label: {
                            Label(isExtracting ? "Reading Property..." : "Next", systemImage: "arrow.right.circle.fill")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(isExtracting || quickStart.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    }
                } else {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Strategy to test")
                            .font(.subheadline.weight(.bold))
                        TextField("", text: $draft.strategy)
                            .textFieldStyle(.roundedBorder)
                            .accessibilityLabel("Strategy to test")
                        HStack(spacing: 10) {
                            Button {
                                intakeStep = .property
                            } label: {
                                Label("Back", systemImage: "chevron.left")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.bordered)

                            Button {
                                intakeMessage = "Add any known details, then save the property."
                            } label: {
                                Label("Continue", systemImage: "arrow.right")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.borderedProminent)
                        }
                    }
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text("Property")
                        .font(.subheadline.weight(.bold))

                    TextField("", text: $draft.propertyAddress)
                        .textContentType(.streetAddressLine1)
                        .textFieldStyle(.roundedBorder)

                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                        TextField("", text: $draft.city)
                            .textContentType(.addressCity)
                            .textFieldStyle(.roundedBorder)
                        TextField("", text: $draft.state)
                            .textInputAutocapitalization(.characters)
                            .textFieldStyle(.roundedBorder)
                        TextField("", text: $draft.zipCode)
                            .keyboardType(.numbersAndPunctuation)
                            .textContentType(.postalCode)
                            .textFieldStyle(.roundedBorder)
                        TextField("", text: $draft.county)
                            .textFieldStyle(.roundedBorder)
                    }
                }

                DisclosureGroup {
                    VStack(alignment: .leading, spacing: 10) {
                        TextEditor(text: $listingText)
                            .frame(minHeight: 112)
                            .padding(10)
                            .background(Color(uiColor: .secondarySystemBackground), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                            .overlay {
                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                    .stroke(Color.brixBlue.opacity(0.18), lineWidth: 1)
                            }
                            .accessibilityLabel("Listing text or property notes")

                        Button {
                            Task { await extractListing() }
                        } label: {
                            Label(isExtracting ? "Reading Property..." : "Read Pasted Details", systemImage: "sparkle.magnifyingglass")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                        .disabled(isExtracting || listingText.trimmingCharacters(in: .whitespacesAndNewlines).count < 8)
                    }
                    .padding(.bottom, 10)

                    VStack(spacing: 10) {
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                            TextField("", text: $draft.propertyType)
                                .textFieldStyle(.roundedBorder)
                            TextField("", text: $draft.strategy)
                                .textFieldStyle(.roundedBorder)
                            TextField("", text: $draft.purchasePrice)
                                .keyboardType(.decimalPad)
                                .textFieldStyle(.roundedBorder)
                            TextField("", text: $draft.monthlyRent)
                                .keyboardType(.decimalPad)
                                .textFieldStyle(.roundedBorder)
                            TextField("", text: $draft.annualTaxes)
                                .keyboardType(.decimalPad)
                                .textFieldStyle(.roundedBorder)
                            TextField("", text: $draft.annualInsurance)
                                .keyboardType(.decimalPad)
                                .textFieldStyle(.roundedBorder)
                            TextField("", text: $draft.beds)
                                .keyboardType(.decimalPad)
                                .textFieldStyle(.roundedBorder)
                            TextField("", text: $draft.baths)
                                .keyboardType(.decimalPad)
                                .textFieldStyle(.roundedBorder)
                            TextField("", text: $draft.squareFeet)
                                .keyboardType(.decimalPad)
                                .textFieldStyle(.roundedBorder)
                            TextField("", text: $draft.yearBuilt)
                                .keyboardType(.numberPad)
                                .textFieldStyle(.roundedBorder)
                        }

                        TextField("", text: $draft.listingURL)
                            .keyboardType(.URL)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .textFieldStyle(.roundedBorder)
                        TextField("", text: $draft.notes, axis: .vertical)
                            .lineLimit(3...8)
                            .textFieldStyle(.roundedBorder)
                    }
                    .padding(.top, 8)
                } label: {
                    Label("Add details, notes, or deal facts", systemImage: "slider.horizontal.3")
                        .font(.subheadline.weight(.bold))
                }

                if let readinessMessage = draft.saveReadinessMessage {
                    Text(readinessMessage)
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(.secondary)
                }

                if let intakeMessage {
                    Text(intakeMessage)
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(.orange)
                }

                HStack(spacing: 10) {
                    Button {
                        Task { await saveProperty() }
                    } label: {
                        Label(isSaving ? "Saving..." : "Save Property", systemImage: "checkmark.circle.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(isSaving || draft.isReadyToSave == false)

                    Button {
                        resetIntake()
                    } label: {
                        Label("Clear", systemImage: "xmark.circle")
                    }
                    .buttonStyle(.bordered)
                    .disabled(isSaving || (draft.trimmedAddress.isEmpty && listingText.isEmpty))
                }
            }
        }
    }

    private var queuePanel: some View {
        BrixCard {
            VStack(alignment: .leading, spacing: 14) {
                SectionHeader(
                    title: "Opportunity Queue",
                    subtitle: "Saved properties ready for review.",
                    symbol: "line.3.horizontal.decrease.circle"
                )

                if appState.deals.isEmpty == false {
                    TextField("", text: $queueSearch)
                        .textInputAutocapitalization(.words)
                        .textFieldStyle(.roundedBorder)
                }

                if filteredDeals.isEmpty {
                    FindIQEmptyQueue()
                } else {
                    ForEach(filteredDeals) { deal in
                        OpportunityRow(deal: deal)
                    }
                }
            }
        }
    }

    private func extractListing() async {
        let text = listingText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard text.count >= 8 else { return }

        isExtracting = true
        intakeMessage = nil
        defer { isExtracting = false }

        do {
            let response = try await BRIXAPIClient().extractListing(from: text, session: appState.session)
            draft.apply(response.extracted, originalText: text)
            intakeMessage = response.warning ?? "Fields filled from the listing. Review before saving."
        } catch {
            let fallback = ListingTextParser.localExtract(from: text)
            draft.apply(fallback, originalText: text)
            intakeMessage = "BRIX filled the fields it could read. Review before saving."
        }
    }

    private func startQuickProperty() async {
        let value = quickStart.trimmingCharacters(in: .whitespacesAndNewlines)
        guard value.isEmpty == false else { return }

        intakeMessage = nil
        if let url = ListingTextParser.firstURL(in: value) {
            draft.listingURL = url
            listingText = value
            await extractListing()
            if draft.trimmedAddress.isEmpty {
                intakeMessage = "Listing link added. Enter the property address, then save."
            } else {
                intakeStep = .strategy
            }
        } else {
            draft.propertyAddress = value
            intakeStep = .strategy
            intakeMessage = "Address added."
        }
    }

    private func saveProperty() async {
        if let message = draft.saveReadinessMessage {
            intakeMessage = message
            return
        }

        isSaving = true
        intakeMessage = nil
        let saved = await appState.createDeal(draft, openInDealIQ: false)
        isSaving = false

        if saved {
            resetIntake()
            intakeMessage = "Property saved. Select it below to open DealIQ or add photos."
        } else {
            intakeMessage = appState.lastError ?? "BRIX could not save this property. Check your connection and try again."
        }
    }

    private func resetIntake() {
        quickStart = ""
        intakeStep = .property
        draft = CreateDealDraft()
        listingText = ""
        intakeMessage = nil
    }
}

private struct OpportunityRow: View {
    @Environment(BRIXAppState.self) private var appState
    let deal: DealSummary

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
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
            }
            .buttonStyle(.plain)

            HStack(spacing: 10) {
                Button {
                    appState.selectDeal(deal)
                } label: {
                    Label("Select", systemImage: "target")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)

                Button {
                    appState.selectDeal(deal)
                    appState.selectedTab = .deal
                } label: {
                    Label("Open DealIQ", systemImage: "chart.bar.xaxis")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .padding(12)
        .background(.background, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(.quaternary)
        }
    }
}

private struct FindIQEmptyQueue: View {
    var body: some View {
        VStack(spacing: 18) {
            EmptyOperatingState(
                title: "No saved properties yet",
                message: "Enter an address or paste a listing link above.",
                symbol: "house.and.flag"
            )

            HStack(spacing: 10) {
                WorkflowCue(symbol: "link", title: "Paste", detail: "URL or listing text")
                WorkflowCue(symbol: "square.and.pencil", title: "Enter", detail: "Address and facts")
                WorkflowCue(symbol: "camera", title: "Capture", detail: "Photos after save")
            }
        }
        .padding(18)
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(Color.brixBlue.opacity(0.18), lineWidth: 1)
        }
    }
}

private struct WorkflowCue: View {
    let symbol: String
    let title: String
    let detail: String

    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: symbol)
                .font(.headline)
                .foregroundStyle(Color.brixBlue)
            Text(title)
                .font(.caption.weight(.bold))
            Text(detail)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(10)
        .background(.background, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

private enum FindIQIntakeStep {
    case property
    case strategy
}

#Preview {
    FindIQView()
        .environment(BRIXAppState())
}
