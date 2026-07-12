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

    private let strategyOptions = brixStrategyDefinitions

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
                    subtitle: "Enter a listing link or property address, choose the strategy, and create the deal file.",
                    symbol: "magnifyingglass"
                )

                VStack(alignment: .leading, spacing: 12) {
                    Text("Property source")
                        .font(.subheadline.weight(.bold))
                    TextField("", text: $quickStart, axis: .vertical)
                        .textInputAutocapitalization(.words)
                        .autocorrectionDisabled()
                        .lineLimit(2...4)
                        .textFieldStyle(.roundedBorder)
                        .accessibilityLabel("Listing link or property address")

                    sourceModeStrip
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text("Strategy")
                        .font(.subheadline.weight(.bold))
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 142), spacing: 8)], spacing: 8) {
                        ForEach(strategyOptions) { strategy in
                            Button {
                                draft.strategy = strategy.name
                            } label: {
                                HStack {
                                    Text(strategy.name)
                                        .font(.caption.weight(.bold))
                                        .lineLimit(1)
                                    Spacer(minLength: 4)
                                    if draft.strategy == strategy.name {
                                        Image(systemName: "checkmark.circle.fill")
                                    }
                                }
                                .padding(.horizontal, 10)
                                .padding(.vertical, 9)
                                .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.plain)
                            .foregroundStyle(draft.strategy == strategy.name ? Color.white : Color.brixInk)
                            .background(draft.strategy == strategy.name ? Color.brixBlue : Color(uiColor: .secondarySystemBackground), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                        }
                    }
                }

                if draft.trimmedAddress.isEmpty == false {
                    extractedPreview
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
                        Task { await createQuickDeal() }
                    } label: {
                        Label(primaryActionTitle, systemImage: "arrow.right.circle.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(isSaving || isExtracting || quickStart.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || draft.strategy.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

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

    private var primaryActionTitle: String {
        if isExtracting { return "Reading Property..." }
        if isSaving { return "Creating..." }
        return "Create Deal File"
    }

    private var sourceModeStrip: some View {
        HStack(spacing: 8) {
            SourceModePill(symbol: "link", text: "Link")
            SourceModePill(symbol: "house", text: "Address")
            SourceModePill(symbol: "doc.text", text: "Listing text")
        }
    }

    private var extractedPreview: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: "checkmark.seal.fill")
                    .foregroundStyle(.green)
                Text("Deal packet ready")
                    .font(.subheadline.weight(.bold))
                Spacer()
            }
            Text(draft.propertyAddress)
                .font(.headline.weight(.bold))
            HStack {
                if draft.city.isEmpty == false || draft.state.isEmpty == false {
                    Text([draft.city, draft.state].filter { $0.isEmpty == false }.joined(separator: ", "))
                }
                if draft.purchasePrice.isEmpty == false {
                    Text("$\(draft.purchasePrice)")
                }
                if draft.beds.isEmpty == false || draft.baths.isEmpty == false {
                    Text("\(draft.beds) bed / \(draft.baths) bath")
                }
            }
            .font(.caption.weight(.semibold))
            .foregroundStyle(.secondary)
        }
        .padding(12)
        .background(Color.brixBlue.opacity(0.08), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(Color.brixBlue.opacity(0.20), lineWidth: 1)
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
            let response = try await appState.extractListing(from: text)
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

    private func createQuickDeal() async {
        let value = quickStart.trimmingCharacters(in: .whitespacesAndNewlines)
        guard value.isEmpty == false else { return }
        guard draft.strategy.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false else {
            intakeMessage = "Choose a strategy before creating the deal file."
            return
        }

        intakeMessage = nil
        if let url = ListingTextParser.firstURL(in: value) {
            draft.listingURL = url
            listingText = value
            await extractListing()
        } else if draft.trimmedAddress.isEmpty {
            draft.propertyAddress = value
        }

        if draft.trimmedAddress.isEmpty {
            let fallback = ListingTextParser.localExtract(from: value)
            draft.apply(fallback, originalText: value)
        }

        if draft.trimmedAddress.isEmpty {
            intakeMessage = "BRIX could not find a property address in that source."
            return
        }

        await saveProperty(openInDealIQ: true)
    }

    private func saveProperty(openInDealIQ: Bool = false) async {
        if let message = draft.saveReadinessMessage {
            intakeMessage = message
            return
        }

        isSaving = true
        intakeMessage = nil
        let saved = await appState.createDeal(draft, openInDealIQ: openInDealIQ)
        isSaving = false

        if saved {
            resetIntake()
            intakeMessage = "Deal file created."
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

private struct SourceModePill: View {
    let symbol: String
    let text: String

    var body: some View {
        HStack(spacing: 5) {
            Image(systemName: symbol)
            Text(text)
        }
        .font(.caption.weight(.bold))
        .foregroundStyle(Color.brixBlue)
        .padding(.horizontal, 9)
        .padding(.vertical, 6)
        .background(Color.brixBlue.opacity(0.10), in: Capsule())
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
