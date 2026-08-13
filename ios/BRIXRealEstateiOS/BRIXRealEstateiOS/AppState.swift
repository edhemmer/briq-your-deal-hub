import Foundation
import SwiftUI

@MainActor
final class AppState: ObservableObject {
    @Published var tab: AppTab = .find
    @Published var deals: [Deal] = []
    @Published var selectedDealID: UUID?
    @Published var email = ""
    @Published var authMessage = ""
    @Published private(set) var accessToken = ""
    @Published private(set) var refreshToken = ""
    @Published var authStatus: NativeAuthStatus = .restoring
    @Published var pendingAuthDestination: NativeAuthDestination?

    private let sessionStore: AuthSessionStoring
    private let anonymousDraftsKey = "brix.anonymousDrafts"

    var selectedDeal: Deal? {
        get { deals.first { $0.id == selectedDealID } ?? deals.first }
        set {
            guard let newValue else { return }
            if let index = deals.firstIndex(where: { $0.id == newValue.id }) {
                deals[index] = newValue
            } else {
                deals.insert(newValue, at: 0)
            }
            selectedDealID = newValue.id
            save()
            syncDeal(newValue)
        }
    }

    init(sessionStore: AuthSessionStoring = KeychainAuthSessionStore()) {
        self.sessionStore = sessionStore
        load()
    }

    func createDeal(from input: String, strategy: StrategyId) async {
        var deal = ListingTextParser.parse(input, strategy: strategy)
        deal.updatedAt = Date()
        guard !accessToken.isEmpty else {
            if let index = deals.firstIndex(where: { $0.id == deal.id }) {
                deals[index] = deal
            } else {
                deals.insert(deal, at: 0)
            }
            selectedDealID = deal.id
            saveAnonymousDrafts()
            authMessage = "Deal created on this device. Sign in from Account to keep it across devices."
            tab = .deal
            return
        }
        do {
            try await BRIXService.upsertDeal(deal, accessToken: accessToken)
            if let index = deals.firstIndex(where: { $0.id == deal.id }) {
                deals[index] = deal
            } else {
                deals.insert(deal, at: 0)
            }
            selectedDealID = deal.id
            authMessage = ""
            tab = .deal
        } catch {
            authMessage = "Deal was not created. Check account access and network connection."
        }
    }

    func deleteSelectedDeal() {
        guard let selectedDealID else { return }
        deals.removeAll { $0.id == selectedDealID }
        self.selectedDealID = deals.first?.id
        if accessToken.isEmpty { saveAnonymousDrafts() }
        syncDelete(selectedDealID)
    }

    func advance(_ deal: Deal) {
        var updated = deal
        updated.status = nextStatus(after: deal.status)
        updated.updatedAt = Date()
        selectedDeal = updated
    }

    func completeAuthentication(session: BRIXAuthSession, message: String) {
        guard !session.accessToken.isEmpty else {
            authStatus = .authRequired
            authMessage = message
            tab = .account
            return
        }
        setSession(session)
        authMessage = message
        authStatus = .refreshing
        clearProtectedDealState()
        Task { await restoreAuthenticatedContext() }
    }

    func signOut() {
        clearSessionMaterial()
        clearProtectedDealState()
        loadAnonymousDrafts()
        authStatus = .signedOut
        authMessage = "Signed out."
    }

    func loadCloudDeals() async {
        guard !accessToken.isEmpty else { return }
        do {
            try await BRIXService.validateSession(accessToken: accessToken)
            let remoteDeals = try await BRIXService.fetchDeals(accessToken: accessToken)
            deals = remoteDeals
            selectedDealID = remoteDeals.first?.id
            authStatus = .ready
        } catch {
            failClosedAfterAuthenticatedLoad(error)
        }
    }

    func handleIncomingURL(_ url: URL) {
        guard let destination = NativeDeepLinkRouter.destination(from: url) else {
            authMessage = "This BRIX link could not be opened safely."
            return
        }

        pendingAuthDestination = destination
        switch destination {
        case .passwordRecovery:
            authStatus = .recoveryValidating
            authMessage = "Open the secure password reset from your BRIX account screen."
            tab = .account
        case .invitation:
            authStatus = accessToken.isEmpty ? .authRequired : .invitationValidating
            authMessage = accessToken.isEmpty ? "Sign in with the invited email address to accept this workspace invitation." : "Workspace invitation ready for secure validation."
            tab = .account
        case .sharedIntake:
            authStatus = accessToken.isEmpty ? .authRequired : .ready
            authMessage = accessToken.isEmpty ? "Sign in to review the shared property source." : "Shared property source is ready for review."
            tab = accessToken.isEmpty ? .account : .find
        case .account:
            authStatus = accessToken.isEmpty ? .authRequired : .ready
            tab = .account
        }
    }

    func retrySessionRestore() {
        authStatus = .retrying
        Task { await restoreAuthenticatedContext() }
    }

    private func nextStatus(after status: String) -> String {
        if status == "passed" || status == "closed" { return status }
        let stages = ["draft", "reviewing", "underwriting", "pursuing", "under_contract", "closed"]
        guard let index = stages.firstIndex(of: status) else { return "reviewing" }
        return stages[min(index + 1, stages.count - 1)]
    }

    func save() {
        if accessToken.isEmpty { saveAnonymousDrafts() }
    }

    private func saveAnonymousDrafts() {
        if let encoded = try? JSONEncoder().encode(deals) {
            UserDefaults.standard.set(encoded, forKey: anonymousDraftsKey)
        }
    }

    private func load() {
        removeLegacyTokenStorage()
        do {
            if let session = try sessionStore.loadSession() {
                accessToken = session.accessToken
                refreshToken = session.refreshToken
                authStatus = .restoring
                clearProtectedDealState()
                Task { await refreshAndLoadCloudDeals() }
                return
            }
        } catch {
            authStatus = .expired
            authMessage = "Secure session storage needs a fresh sign in."
        }
        loadAnonymousDrafts()
        authStatus = .signedOut
    }

    private func refreshAndLoadCloudDeals() async {
        do {
            let session = try await BRIXService.refreshSession(refreshToken: refreshToken)
            setSession(session)
            await restoreAuthenticatedContext()
        } catch {
            clearSessionMaterial()
            clearProtectedDealState()
            loadAnonymousDrafts()
            authStatus = isOfflineError(error) ? .offlineUnavailable : .expired
            authMessage = authStatus.userMessage
        }
    }

    private func restoreAuthenticatedContext() async {
        guard !accessToken.isEmpty else {
            authStatus = .signedOut
            return
        }
        await loadCloudDeals()
        if pendingAuthDestination?.requiresAuthentication == true, authStatus == .ready {
            authMessage = "Authenticated return complete."
        }
    }

    private func syncDeal(_ deal: Deal) {
        guard !accessToken.isEmpty else { return }
        Task {
            do {
                try await BRIXService.upsertDeal(deal, accessToken: accessToken)
            } catch {
                authMessage = "Deal saved on this device. Cloud sync needs attention."
            }
        }
    }

    private func syncDelete(_ id: UUID) {
        guard !accessToken.isEmpty else { return }
        Task {
            do {
                try await BRIXService.softDeleteDeal(id: id, accessToken: accessToken)
            } catch {
                authMessage = "Deal removed on this device. Cloud sync needs attention."
            }
        }
    }

    private func setSession(_ session: BRIXAuthSession) {
        accessToken = session.accessToken
        refreshToken = session.refreshToken
        do {
            try sessionStore.saveSession(session)
        } catch {
            authStatus = .bootstrapFailed
            authMessage = "BRIX could not save secure session access. Sign in again."
        }
    }

    private func clearSessionMaterial() {
        accessToken = ""
        refreshToken = ""
        try? sessionStore.clearSession()
        removeLegacyTokenStorage()
    }

    private func clearProtectedDealState() {
        deals = []
        selectedDealID = nil
    }

    private func loadAnonymousDrafts() {
        if let data = UserDefaults.standard.data(forKey: anonymousDraftsKey),
           let decoded = try? JSONDecoder().decode([Deal].self, from: data) {
            deals = decoded
            selectedDealID = decoded.first?.id
        } else {
            deals = []
            selectedDealID = nil
        }
    }

    private func removeLegacyTokenStorage() {
        UserDefaults.standard.removeObject(forKey: "brix.accessToken")
        UserDefaults.standard.removeObject(forKey: "brix.refreshToken")
    }

    private func failClosedAfterAuthenticatedLoad(_ error: Error) {
        if let serviceError = error as? BRIXServiceError, serviceError == .accessRevoked {
            clearSessionMaterial()
            clearProtectedDealState()
            loadAnonymousDrafts()
            authStatus = .revokedWorkspace
            authMessage = authStatus.userMessage
            tab = .account
            return
        }
        if isAuthError(error) {
            clearSessionMaterial()
            clearProtectedDealState()
            loadAnonymousDrafts()
            authStatus = .expired
            authMessage = authStatus.userMessage
            tab = .account
            return
        }
        if isOfflineError(error) {
            authStatus = refreshToken.isEmpty ? .offlineUnavailable : .offlineRecoverable
            authMessage = authStatus.userMessage
            return
        }
        authStatus = .bootstrapFailed
        authMessage = "Could not prepare your BRIX workspace. Retry when your connection is stable."
    }

    private func isAuthError(_ error: Error) -> Bool {
        if let serviceError = error as? BRIXServiceError, serviceError == .authenticationRequired { return true }
        let code = (error as? URLError)?.code
        return code == .userAuthenticationRequired || code == .userCancelledAuthentication
    }

    private func isOfflineError(_ error: Error) -> Bool {
        let code = (error as? URLError)?.code
        return code == .notConnectedToInternet || code == .networkConnectionLost || code == .cannotFindHost || code == .timedOut
    }
}
