import Foundation

enum BRIXAPIError: LocalizedError {
    case missingConfiguration
    case invalidResponse
    case backend(status: Int, message: String)
    case missingAppleIdentityToken

    var errorDescription: String? {
        switch self {
        case .missingConfiguration:
            return "BRIX API configuration is missing."
        case .invalidResponse:
            return "BRIX returned an invalid response."
        case .backend(let status, let message):
            return "BRIX backend error \(status): \(message)"
        case .missingAppleIdentityToken:
            return "Apple did not return an identity token."
        }
    }
}

struct BRIXAppConfig {
    static var supabaseURL: URL {
        if let value = Bundle.main.object(forInfoDictionaryKey: "BRIX_SUPABASE_URL") as? String,
           let url = URL(string: value) {
            return url
        }
        return URL(string: "https://luwaqrkhmxcqsozmilbw.supabase.co")!
    }

    static var publishableKey: String {
        if let value = Bundle.main.object(forInfoDictionaryKey: "BRIX_SUPABASE_PUBLISHABLE_KEY") as? String,
           value.isEmpty == false {
            return value
        }
        return "sb_publishable_gl6bNZ2T_sGmO7SbDlcdUA_9UzzNB3f"
    }

    static var privacyPolicyURL: URL {
        URL(string: "https://brixrealestate.app/privacy")!
    }
}

struct BRIXAPIClient {
    var supabaseURL = BRIXAppConfig.supabaseURL
    var publishableKey = BRIXAppConfig.publishableKey
    var urlSession: URLSession = .shared

    func fetchDeals(session: AuthSession?) async throws -> [DealSummary] {
        let path = "/rest/v1/deals?select=*&order=updated_at.desc&limit=100"
        let data = try await send(path: path, method: "GET", session: session)
        return try decode([DealSummary].self, from: data)
    }

    func fetchDecisionSnapshot(dealID: String, session: AuthSession?) async throws -> DecisionSnapshot? {
        let encodedID = dealID.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? dealID
        let path = "/rest/v1/mobile_decision_snapshots?select=*&deal_id=eq.\(encodedID)&order=updated_at.desc&limit=1"
        let data = try await send(path: path, method: "GET", session: session)
        return try decode([DecisionSnapshot].self, from: data).first
    }

    func signInWithApple(identityToken: Data) async throws -> AuthSession {
        guard let token = String(data: identityToken, encoding: .utf8), token.isEmpty == false else {
            throw BRIXAPIError.missingAppleIdentityToken
        }

        let body = [
            "provider": "apple",
            "id_token": token
        ]
        let data = try await send(path: "/auth/v1/token?grant_type=id_token", method: "POST", body: body, session: nil)
        return try decode(AuthSession.self, from: data)
    }

    func signOut(session: AuthSession?) async throws {
        _ = try await send(path: "/auth/v1/logout", method: "POST", session: session)
    }

    func requestAccountDeletion(reason: String?, session: AuthSession?) async throws {
        let body = ["reason": reason ?? ""]
        _ = try await send(path: "/functions/v1/request-account-deletion", method: "POST", body: body, session: session)
    }

    func uploadFieldCapture(propertyID: String, payload: FieldCapturePayload, imageData: Data?, session: AuthSession?) async throws {
        if let imageData {
            let fileName = "\(payload.localIdentifier).jpg"
            let storagePath = "/storage/v1/object/property-captures/\(propertyID)/\(fileName)"
            _ = try await sendRaw(path: storagePath, method: "POST", data: imageData, contentType: "image/jpeg", session: session)
        }

        let metadataPath = "/functions/v1/field-capture"
        let body: [String: String] = [
            "property_id": propertyID,
            "local_identifier": payload.localIdentifier,
            "capture_type": payload.captureType,
            "note": payload.note ?? "",
            "created_at": ISO8601DateFormatter().string(from: payload.createdAt)
        ]
        _ = try await send(path: metadataPath, method: "POST", body: body, session: session)
    }

    private func send(path: String, method: String, body: Encodable? = Optional<String>.none, session: AuthSession?) async throws -> Data {
        let bodyData = try body.map { try JSONEncoder.brix.encode(AnyEncodable($0)) }
        return try await sendRaw(path: path, method: method, data: bodyData, contentType: "application/json", session: session)
    }

    private func sendRaw(path: String, method: String, data: Data? = nil, contentType: String, session: AuthSession?) async throws -> Data {
        guard let url = URL(string: path, relativeTo: supabaseURL) else {
            throw BRIXAPIError.missingConfiguration
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue(publishableKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(session?.accessToken ?? publishableKey)", forHTTPHeaderField: "Authorization")
        request.setValue(contentType, forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.httpBody = data

        let (responseData, response) = try await urlSession.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw BRIXAPIError.invalidResponse
        }

        guard (200..<300).contains(http.statusCode) else {
            let message = String(data: responseData, encoding: .utf8) ?? "No error body"
            throw BRIXAPIError.backend(status: http.statusCode, message: message)
        }

        return responseData
    }

    private func decode<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {
        try JSONDecoder.brix.decode(type, from: data)
    }
}

private struct AnyEncodable: Encodable {
    private let encodeHandler: (Encoder) throws -> Void

    init(_ wrapped: Encodable) {
        encodeHandler = wrapped.encode
    }

    func encode(to encoder: Encoder) throws {
        try encodeHandler(encoder)
    }
}

extension JSONDecoder {
    static var brix: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }
}

extension JSONEncoder {
    static var brix: JSONEncoder {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        return encoder
    }
}
