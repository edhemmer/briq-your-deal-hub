import Foundation

struct BRIXAPIClient {
    var baseURL = URL(string: "https://api.brix.realestate")!

    func fetchDecisionSnapshot(propertyID: String) async throws -> DecisionSnapshot {
        // Backend owns scoring, trust, strategy, and recommendation logic.
        // The native app consumes API results and renders them.
        _ = propertyID
        return BrixDemoData.decision
    }

    func uploadFieldCapture(propertyID: String, payload: FieldCapturePayload) async throws {
        // Upload photos, scans, videos, and voice notes to BRIX services when connected.
        _ = propertyID
        _ = payload
    }

    func requestAccountDeletion(reason: String?) async throws {
        // Backend must delete the full account record and associated personal data
        // unless legally required retention applies.
        _ = reason
    }

    func revokeSignInWithAppleToken(authorizationCode: Data?) async throws {
        // Backend should call Apple's Sign in with Apple REST API to revoke tokens.
        _ = authorizationCode
    }
}

struct FieldCapturePayload: Codable {
    let localIdentifier: String
    let captureType: String
    let note: String?
    let createdAt: Date
}
