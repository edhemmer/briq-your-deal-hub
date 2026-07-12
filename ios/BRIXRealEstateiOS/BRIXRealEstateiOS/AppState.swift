import Foundation
import Security

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
    var fieldCaptureAnalyses: [FieldCaptureAnalysis] = []
    var projectTasks: [ProjectTask] = []
    var portfolioMetrics: [PortfolioMetric] = []
    var queuedOfflineActions: [OfflineAction] = []
    var investorLevel: InvestorLevel = .firstDeal
    var didRestoreSession = false
    var isLoading = false
    var lastError: String?
    var lastNotice: String?
    var lastSyncDate: Date?

    private let apiClient = BRIXAPIClient()
    private let sessionStore = KeychainSessionStore()

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
        if let savedSession = sessionStore.loadSession() {
            if let freshSession = await refreshStoredSession(savedSession) {
                authState = .signedIn(freshSession)
            } else {
                sessionStore.clear()
                authState = .signedOut
            }
            didRestoreSession = true
            await refresh()
            return
        }
        didRestoreSession = true
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
            let fetchedDeals = try await authenticatedRequest { session in
                try await apiClient.fetchDeals(session: session)
            }
            deals = fetchedDeals
            if selectedDealID == nil || deals.contains(where: { $0.id == selectedDealID }) == false {
                selectedDealID = deals.first?.id
            }
            lastSyncDate = Date()
            await loadSelectedDecision()
            await loadFieldCaptureAnalyses()
        } catch {
            lastError = brixAppMessage(error)
        }
    }

    func selectDeal(_ deal: DealSummary) {
        selectedDealID = deal.id
        Task {
            await loadSelectedDecision()
            await loadFieldCaptureAnalyses()
        }
    }

    func loadSelectedDecision() async {
        guard let dealID = selectedDealID, authState.isSignedIn else {
            selectedDecisionSnapshot = nil
            return
        }

        do {
            selectedDecisionSnapshot = try await authenticatedRequest { session in
                try await apiClient.fetchDecisionSnapshot(dealID: dealID, session: session)
            }
        } catch {
            selectedDecisionSnapshot = nil
            if isExpiredAuthError(error) {
                lastNotice = "Sign in to continue."
            }
        }
    }

    func loadFieldCaptureAnalyses() async {
        guard let dealID = selectedDealID, authState.isSignedIn else {
            fieldCaptureAnalyses = []
            return
        }

        do {
            fieldCaptureAnalyses = try await authenticatedRequest { session in
                try await apiClient.fetchFieldCaptureAnalyses(dealID: dealID, session: session)
            }
        } catch {
            fieldCaptureAnalyses = []
            if isExpiredAuthError(error) {
                lastNotice = "Sign in to continue."
            }
        }
    }

    func signIn(with session: AuthSession) async {
        sessionStore.save(session)
        authState = .signedIn(session)
        await refresh()
    }

    func signInWithEmail(email: String, password: String) async -> Bool {
        isLoading = true
        lastError = nil
        lastNotice = nil
        defer { isLoading = false }

        do {
            let session = try await apiClient.signInWithEmail(email: email, password: password)
            await signIn(with: session)
            return true
        } catch {
            lastError = brixAuthMessage(error)
            return false
        }
    }

    func createAccountWithEmail(email: String, password: String) async -> Bool {
        isLoading = true
        lastError = nil
        lastNotice = nil
        defer { isLoading = false }

        do {
            if let session = try await apiClient.signUpWithEmail(email: email, password: password) {
                await signIn(with: session)
            } else {
                lastNotice = "Account created. Check your email to confirm it, then sign in."
            }
            return true
        } catch {
            lastError = brixAuthMessage(error)
            return false
        }
    }

    func signOut() async {
        do {
            try await apiClient.signOut(session: session)
        } catch {
            if isExpiredAuthError(error) == false {
                lastError = brixAppMessage(error)
            }
        }
        sessionStore.clear()
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
            try await authenticatedRequest { session in
                try await apiClient.uploadFieldCapture(propertyID: selectedDeal.id, payload: payload, imageData: imageData, session: session)
            }
            updateQueue(localIdentifier: localID, state: .uploaded)
            await loadFieldCaptureAnalyses()
        } catch {
            updateQueue(localIdentifier: localID, state: .failed)
            lastError = brixAppMessage(error)
        }
    }

    func createDeal(_ draft: CreateDealDraft, openInDealIQ: Bool = true) async -> Bool {
        guard authState.isSignedIn else {
            lastError = "Sign in before creating a BRIX deal file."
            return false
        }

        isLoading = true
        lastError = nil
        defer { isLoading = false }

        do {
            let createdDeal = try await authenticatedRequest { session in
                try await apiClient.createDeal(draft, session: session)
            }
            deals.insert(createdDeal, at: 0)
            selectedDealID = createdDeal.id
            if openInDealIQ {
                selectedTab = .deal
            }
            lastSyncDate = Date()
            await loadSelectedDecision()
            return true
        } catch {
            lastError = brixAppMessage(error)
            return false
        }
    }

    func extractListing(from text: String) async throws -> ExtractListingResponse {
        try await authenticatedRequest { session in
            try await apiClient.extractListing(from: text, session: session)
        }
    }

    func requestAccountDeletion(reason: String?) async -> Bool {
        guard authState.isSignedIn else {
            lastError = "Sign in to continue."
            return false
        }

        isLoading = true
        lastError = nil
        defer { isLoading = false }

        do {
            try await authenticatedRequest { session in
                try await apiClient.requestAccountDeletion(reason: reason, session: session)
            }
            lastNotice = "Account deletion request submitted."
            return true
        } catch {
            lastError = brixAppMessage(error)
            return false
        }
    }

    private func updateQueue(localIdentifier: String, state: UploadState) {
        guard let uuid = UUID(uuidString: localIdentifier),
              let index = queuedOfflineActions.firstIndex(where: { $0.id == uuid }) else { return }
        queuedOfflineActions[index].uploadState = state
    }

    private func authenticatedRequest<T>(_ operation: (AuthSession?) async throws -> T) async throws -> T {
        do {
            return try await operation(session)
        } catch {
            if await recoverExpiredSessionIfNeeded(from: error) {
                return try await operation(session)
            }
            throw error
        }
    }

    private func refreshStoredSession(_ savedSession: AuthSession) async -> AuthSession? {
        guard let refreshToken = savedSession.refreshToken, refreshToken.isEmpty == false else {
            return nil
        }

        do {
            let freshSession = try await apiClient.refreshSession(refreshToken: refreshToken)
            sessionStore.save(freshSession)
            return freshSession
        } catch {
            return nil
        }
    }

    private func recoverExpiredSessionIfNeeded(from error: Error) async -> Bool {
        guard isExpiredAuthError(error),
              let currentSession = session,
              let refreshToken = currentSession.refreshToken,
              refreshToken.isEmpty == false
        else {
            if isExpiredAuthError(error) {
                await expireSession()
            }
            return false
        }

        do {
            let freshSession = try await apiClient.refreshSession(refreshToken: refreshToken)
            sessionStore.save(freshSession)
            authState = .signedIn(freshSession)
            return true
        } catch {
            await expireSession()
            return false
        }
    }

    private func expireSession() async {
        sessionStore.clear()
        authState = .signedOut
        deals = []
        selectedDealID = nil
        selectedDecisionSnapshot = nil
        fieldCaptureAnalyses = []
        lastError = nil
        lastNotice = "Sign in to continue."
    }
}

func isExpiredAuthError(_ error: Error) -> Bool {
    guard let apiError = error as? BRIXAPIError else {
        let message = error.localizedDescription.lowercased()
        return message.contains("jwt") || message.contains("expired") || message.contains("401")
    }

    switch apiError {
    case .backend(let status, let message):
        let lower = message.lowercased()
        return status == 401 || lower.contains("jwt") || lower.contains("expired") || lower.contains("invalid token")
    default:
        return false
    }
}

func brixAppMessage(_ error: Error) -> String {
    if let apiError = error as? BRIXAPIError {
        switch apiError {
        case .backend(let status, let backendMessage):
            let lower = backendMessage.lowercased()
            if status == 401 || lower.contains("jwt") || lower.contains("expired") {
                return "Sign in to continue."
            }
            if lower.contains("free plan includes 15 deal files") {
                return "Free plan includes 15 deal files. Upgrade to create more deal files."
            }
            if lower.contains("permission") || lower.contains("not authorized") {
                return "BRIX could not complete that action for this account."
            }
        default:
            break
        }
    }

    let message = error.localizedDescription
    if message.localizedCaseInsensitiveContains("free plan includes 15 deal files") {
        return "Free plan includes 15 deal files. Upgrade to create more deal files."
    }
    if message.localizedCaseInsensitiveContains("network") || message.localizedCaseInsensitiveContains("offline") || message.localizedCaseInsensitiveContains("internet") {
        return "BRIX could not complete the request. Check internet access and try again."
    }
    return message
}

func brixAuthMessage(_ error: Error) -> String {
    if let apiError = error as? BRIXAPIError {
        switch apiError {
        case .backend(let status, let backendMessage):
            let lower = backendMessage.lowercased()
            if status == 429 || lower.contains("rate") || lower.contains("too many") {
                return "Too many attempts. Wait a few minutes before trying again."
            }
            if lower.contains("invalid") || lower.contains("credentials") {
                return "The email or password was not accepted. Check the password or use password reset."
            }
            if lower.contains("email not confirmed") || lower.contains("confirm") {
                return "Confirm your email address, then sign in again."
            }
            if lower.contains("already") || lower.contains("registered") || lower.contains("exists") {
                return "That email already has a BRIX account. Sign in or use password reset."
            }
        default:
            break
        }
    }

    let message = error.localizedDescription
    if message.localizedCaseInsensitiveContains("invalid") || message.localizedCaseInsensitiveContains("credentials") {
        return "The email or password was not accepted. Check the password or use password reset."
    }
    if message.localizedCaseInsensitiveContains("email not confirmed") {
        return "Confirm your email address, then sign in again."
    }
    if message.localizedCaseInsensitiveContains("429") || message.localizedCaseInsensitiveContains("rate") || message.localizedCaseInsensitiveContains("too many") {
        return "Too many attempts. Wait a few minutes before trying again."
    }
    if message.localizedCaseInsensitiveContains("network") || message.localizedCaseInsensitiveContains("offline") || message.localizedCaseInsensitiveContains("internet") {
        return "BRIX could not complete the request. Check internet access and try again."
    }
    return message
}

struct KeychainSessionStore {
    private let service = "BrixRealEstate.SupabaseSession"
    private let account = "current"

    func save(_ session: AuthSession) {
        guard let data = try? JSONEncoder.brix.encode(session) else { return }
        clear()
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
            kSecValueData as String: data
        ]
        SecItemAdd(query as CFDictionary, nil)
    }

    func loadSession() -> AuthSession? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return try? JSONDecoder.brix.decode(AuthSession.self, from: data)
    }

    func clear() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        SecItemDelete(query as CFDictionary)
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
