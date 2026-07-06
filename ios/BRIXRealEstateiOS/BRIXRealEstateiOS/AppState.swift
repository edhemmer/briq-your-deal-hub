import Foundation

@MainActor
@Observable
final class BRIXAppState {
    var selectedTab: AppTab = .dashboard
    var authState: AuthState = .signedOut
    var deals: [DealSummary] = []
    var selectedDealID: String?
    var selectedDecisionSnapshot: DecisionSnapshot?
    var strategyOptions: [StrategyOption] = []
    var visualFindings: [VisualFinding] = []
    var projectTasks: [ProjectTask] = []
    var portfolioMetrics: [PortfolioMetric] = []
    var queuedOfflineActions: [OfflineAction] = []
    var investorLevel: InvestorLevel = .firstDeal
    var isLoading = false
    var lastError: String?
    var lastSyncDate: Date?

    private let apiClient = BRIXAPIClient()

    var session: AuthSession? {
        if case .signedIn(let session) = authState { return session }
        return nil
    }

    var selectedDeal: DealSummary? {
        if let selectedDealID,
           let match = deals.first(where: { $0.id == selectedDealID }) {
            return match
        }
        return deals.first
    }

    var hasRealDealData: Bool {
        deals.isEmpty == false
    }

    func restore() async {
        await refresh()
    }

    func refresh() async {
        guard authState.isSignedIn else {
            deals = []
            selectedDealID = nil
            selectedDecisionSnapshot = nil
            return
        }

        isLoading = true
        lastError = nil
        defer { isLoading = false }

        do {
            let fetchedDeals = try await apiClient.fetchDeals(session: session)
            deals = fetchedDeals
            if selectedDealID == nil || deals.contains(where: { $0.id == selectedDealID }) == false {
                selectedDealID = deals.first?.id
            }
            lastSyncDate = Date()
            await loadSelectedDecision()
        } catch {
            lastError = error.localizedDescription
        }
    }

    func selectDeal(_ deal: DealSummary) {
        selectedDealID = deal.id
        Task { await loadSelectedDecision() }
    }

    func loadSelectedDecision() async {
        guard let dealID = selectedDealID, authState.isSignedIn else {
            selectedDecisionSnapshot = nil
            return
        }

        do {
            selectedDecisionSnapshot = try await apiClient.fetchDecisionSnapshot(dealID: dealID, session: session)
        } catch {
            selectedDecisionSnapshot = nil
        }
    }

    func signIn(with session: AuthSession) async {
        authState = .signedIn(session)
        await refresh()
    }

    func signOut() async {
        do {
            try await apiClient.signOut(session: session)
        } catch {
            lastError = error.localizedDescription
        }
        authState = .signedOut
        deals = []
        selectedDealID = nil
        selectedDecisionSnapshot = nil
    }

    func enqueueFieldCapture(title: String, detail: String) {
        queuedOfflineActions.append(OfflineAction(title: title, detail: detail))
    }

    func uploadFieldCapture(imageData: Data?, captureType: String, note: String?) async {
        guard let selectedDeal else {
            enqueueFieldCapture(title: "\(captureType) capture", detail: "Select a deal before uploading.")
            return
        }

        let localID = UUID().uuidString
        let payload = FieldCapturePayload(localIdentifier: localID, captureType: captureType, note: note, createdAt: Date())
        queuedOfflineActions.append(OfflineAction(id: UUID(uuidString: localID) ?? UUID(), title: "\(captureType) capture", detail: selectedDeal.title, uploadState: .uploading))

        do {
            try await apiClient.uploadFieldCapture(propertyID: selectedDeal.id, payload: payload, imageData: imageData, session: session)
            updateQueue(localIdentifier: localID, state: .uploaded)
        } catch {
            updateQueue(localIdentifier: localID, state: .failed)
            lastError = error.localizedDescription
        }
    }

    func createDeal(_ draft: CreateDealDraft) async -> Bool {
        guard authState.isSignedIn else {
            lastError = "Sign in before creating a BRIX deal file."
            return false
        }

        isLoading = true
        lastError = nil
        defer { isLoading = false }

        do {
            let createdDeal = try await apiClient.createDeal(draft, session: session)
            deals.insert(createdDeal, at: 0)
            selectedDealID = createdDeal.id
            selectedTab = .deal
            lastSyncDate = Date()
            await loadSelectedDecision()
            return true
        } catch {
            lastError = error.localizedDescription
            return false
        }
    }

    private func updateQueue(localIdentifier: String, state: UploadState) {
        guard let uuid = UUID(uuidString: localIdentifier),
              let index = queuedOfflineActions.firstIndex(where: { $0.id == uuid }) else { return }
        queuedOfflineActions[index].uploadState = state
    }
}

enum AuthState: Equatable {
    case signedOut
    case signedIn(AuthSession)

    var isSignedIn: Bool {
        if case .signedIn = self { return true }
        return false
    }

    var displayEmail: String {
        switch self {
        case .signedOut:
            return "Not signed in"
        case .signedIn(let session):
            return session.email ?? "Private relay email"
        }
    }
}
