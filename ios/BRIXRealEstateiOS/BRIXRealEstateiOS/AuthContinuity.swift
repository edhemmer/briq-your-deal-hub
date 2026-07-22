import Foundation
import Security

enum NativeAuthStatus: Equatable {
    case restoring
    case signedOut
    case refreshing
    case ready
    case recoveryValidating
    case invitationValidating
    case authRequired
    case offlineRecoverable
    case offlineUnavailable
    case expired
    case revokedUser
    case revokedWorkspace
    case bootstrapFailed
    case retrying

    var userMessage: String {
        switch self {
        case .restoring: return "Restoring your session."
        case .signedOut: return "Sign in to access your BRIX account."
        case .refreshing: return "Refreshing secure access."
        case .ready: return "Account ready."
        case .recoveryValidating: return "Opening password reset."
        case .invitationValidating: return "Opening workspace invitation."
        case .authRequired: return "Sign in to continue."
        case .offlineRecoverable: return "Network unavailable. Your last valid session is preserved."
        case .offlineUnavailable: return "Network unavailable. Sign in when connection returns."
        case .expired: return "Session expired. Sign in again."
        case .revokedUser: return "Account access is no longer active."
        case .revokedWorkspace: return "Workspace access is no longer active."
        case .bootstrapFailed: return "Workspace setup needs attention."
        case .retrying: return "Retrying secure access."
        }
    }
}

enum NativeAuthDestination: Equatable {
    case passwordRecovery(token: String?)
    case invitation(token: String)
    case account

    var requiresAuthentication: Bool {
        switch self {
        case .passwordRecovery: return false
        case .invitation, .account: return true
        }
    }
}

enum NativeDeepLinkRouter {
    private static let allowedHosts = Set(["brixrealestate.app", "www.brixrealestate.app"])
    private static let allowedSchemes = Set(["https", "brixrealestate"])

    static func destination(from url: URL) -> NativeAuthDestination? {
        guard let scheme = url.scheme?.lowercased(), allowedSchemes.contains(scheme) else { return nil }
        if scheme == "https" {
            guard let host = url.host?.lowercased(), allowedHosts.contains(host) else { return nil }
        }

        let components = URLComponents(url: url, resolvingAgainstBaseURL: false)
        let path = url.path.lowercased()
        let query = allItems(from: components)

        if let invite = query.first(where: { $0.name == "invite" })?.value, !invite.isEmpty {
            return .invitation(token: invite)
        }

        if query.first(where: { $0.name == "flow" })?.value == "reset-password" ||
            query.first(where: { $0.name == "type" })?.value == "recovery" ||
            path.contains("reset-password") {
            return .passwordRecovery(token: query.first(where: { $0.name == "code" || $0.name == "token" })?.value)
        }

        if path == "/account" || url.host?.lowercased() == "account" {
            return .account
        }

        return nil
    }

    private static func allItems(from components: URLComponents?) -> [URLQueryItem] {
        var items = components?.queryItems ?? []
        if let fragment = components?.fragment,
           let fragmentComponents = URLComponents(string: "brix://callback?\(fragment)") {
            items.append(contentsOf: fragmentComponents.queryItems ?? [])
        }
        return items
    }
}

protocol AuthSessionStoring {
    func loadSession() throws -> BRIXAuthSession?
    func saveSession(_ session: BRIXAuthSession) throws
    func clearSession() throws
}

struct KeychainAuthSessionStore: AuthSessionStoring {
    private let service = "app.brixrealestate.auth"
    private let account = "supabase-session"

    func loadSession() throws -> BRIXAuthSession? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess, let data = item as? Data else {
            throw KeychainSessionError.unavailable(status)
        }
        return try JSONDecoder().decode(BRIXAuthSession.self, from: data)
    }

    func saveSession(_ session: BRIXAuthSession) throws {
        let data = try JSONEncoder().encode(session)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        let attributes: [String: Any] = [
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        ]
        let updateStatus = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
        if updateStatus == errSecSuccess { return }
        if updateStatus != errSecItemNotFound {
            throw KeychainSessionError.unavailable(updateStatus)
        }
        var insert = query
        attributes.forEach { insert[$0.key] = $0.value }
        let insertStatus = SecItemAdd(insert as CFDictionary, nil)
        guard insertStatus == errSecSuccess else {
            throw KeychainSessionError.unavailable(insertStatus)
        }
    }

    func clearSession() throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainSessionError.unavailable(status)
        }
    }
}

enum KeychainSessionError: Error, Equatable {
    case unavailable(OSStatus)
}
