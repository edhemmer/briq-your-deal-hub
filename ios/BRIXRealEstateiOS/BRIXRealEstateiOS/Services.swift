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
            return "BRIX request failed \(status): \(message)"
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

    static var termsURL: URL {
        URL(string: "https://brixrealestate.app/terms")!
    }

    static var supportURL: URL {
        URL(string: "https://brixrealestate.app/support")!
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

    func createDeal(_ draft: CreateDealDraft, session: AuthSession?) async throws -> DealSummary {
        guard let session else {
            throw BRIXAPIError.missingConfiguration
        }

        try await ensureCurrentProfile(session: session)

        let request = CreateDealRequest(
            userID: session.userID,
            propertyAddress: draft.propertyAddress.trimmingCharacters(in: .whitespacesAndNewlines),
            city: draft.city.trimmingCharacters(in: .whitespacesAndNewlines),
            county: optionalText(draft.county),
            state: draft.state.trimmingCharacters(in: .whitespacesAndNewlines).uppercased(),
            zipCode: optionalText(draft.zipCode),
            propertyType: optionalText(draft.propertyType),
            purchasePrice: optionalNumber(draft.purchasePrice),
            estimatedARV: optionalNumber(draft.estimatedARV),
            monthlyRent: optionalNumber(draft.monthlyRent),
            annualPropertyTax: optionalNumber(draft.annualTaxes),
            taxes: optionalNumber(draft.annualTaxes),
            insurance: optionalNumber(draft.annualInsurance),
            beds: optionalNumber(draft.beds),
            baths: optionalNumber(draft.baths),
            squareFeet: optionalNumber(draft.squareFeet),
            yearBuilt: optionalNumber(draft.yearBuilt),
            strategyPrimary: optionalText(draft.strategy),
            listingURL: optionalText(draft.listingURL),
            listingPhotoURLs: optionalArray(draft.listingPhotoURLs),
            conditionNotes: optionalArray(draft.conditionNotes),
            visibleOrStatedRisks: optionalArray(draft.visibleOrStatedRisks),
            missingQuestions: optionalArray(draft.missingQuestions),
            listingRemarks: optionalText(draft.notes),
            sourceConfidence: draft.sourceConfidence
        )

        let data = try await send(path: "/rest/v1/deals?select=*", method: "POST", body: request, session: session)
        let createdDeals = try decode([DealSummary].self, from: data)
        guard let createdDeal = createdDeals.first else {
            throw BRIXAPIError.invalidResponse
        }
        return createdDeal
    }

    func ensureCurrentProfile(session: AuthSession?) async throws {
        _ = try await send(path: "/rest/v1/rpc/ensure_current_profile", method: "POST", body: EmptyRPCBody(), session: session)
    }

    func extractListing(from text: String, session: AuthSession?) async throws -> ExtractListingResponse {
        var body = ["listing_text": text]
        if let url = ListingTextParser.firstURL(in: text) {
            body["listing_url"] = url
        }
        let data = try await send(path: "/functions/v1/extract-deal-from-text", method: "POST", body: body, session: session)
        return try decode(ExtractListingResponse.self, from: data)
    }

    func fetchFieldCaptureAnalyses(dealID: String, session: AuthSession?) async throws -> [FieldCaptureAnalysis] {
        let encodedID = dealID.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? dealID
        let path = "/rest/v1/brix_field_captures?select=id,capture_type,ai_findings,confidence_score,severity,verification_recommendation,created_at&deal_id=eq.\(encodedID)&order=created_at.desc&limit=50"
        let data = try await send(path: path, method: "GET", session: session)
        return try decode([FieldCaptureAnalysis].self, from: data)
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

    func signInWithEmail(email: String, password: String) async throws -> AuthSession {
        let body = [
            "email": email.trimmingCharacters(in: .whitespacesAndNewlines),
            "password": password
        ]
        let data = try await send(path: "/auth/v1/token?grant_type=password", method: "POST", body: body, session: nil)
        return try decode(AuthSession.self, from: data)
    }

    func refreshSession(refreshToken: String) async throws -> AuthSession {
        let body = [
            "refresh_token": refreshToken
        ]
        let data = try await send(path: "/auth/v1/token?grant_type=refresh_token", method: "POST", body: body, session: nil)
        return try decode(AuthSession.self, from: data)
    }

    func signUpWithEmail(email: String, password: String) async throws -> AuthSession? {
        let body = [
            "email": email.trimmingCharacters(in: .whitespacesAndNewlines),
            "password": password
        ]
        let data = try await send(path: "/auth/v1/signup", method: "POST", body: body, session: nil)
        if let directSession = try? decode(AuthSession.self, from: data) {
            return directSession
        }
        return try decode(SignUpResponse.self, from: data).session
    }

    func sendPasswordReset(email: String) async throws {
        let body = [
            "email": email.trimmingCharacters(in: .whitespacesAndNewlines),
            "redirect_to": "https://brixrealestate.app/reset-password"
        ]
        _ = try await send(path: "/auth/v1/recover", method: "POST", body: body, session: nil)
    }

    func signOut(session: AuthSession?) async throws {
        _ = try await send(path: "/auth/v1/logout", method: "POST", session: session)
    }

    func requestAccountDeletion(reason: String?, session: AuthSession?) async throws {
        let body: [String: AnyEncodableValue] = [
            "reason": .string(reason ?? ""),
            "source": .string("ios"),
            "confirmDeletion": .bool(true)
        ]
        _ = try await send(path: "/functions/v1/request-account-deletion", method: "POST", body: body, session: session)
    }

    func uploadFieldCapture(propertyID: String, payload: FieldCapturePayload, imageData: Data?, session: AuthSession?) async throws {
        guard let session else {
            throw BRIXAPIError.missingConfiguration
        }

        let captureType = normalizeCaptureType(payload.captureType)
        let storagePath: String?

        if let imageData {
            let fileName = "\(payload.localIdentifier).jpg"
            let objectPath = "\(session.userID)/\(propertyID)/\(fileName)"
            storagePath = objectPath
            _ = try await sendRaw(path: "/storage/v1/object/field-captures/\(objectPath)", method: "POST", data: imageData, contentType: "image/jpeg", session: session)
        } else {
            storagePath = nil
        }

        let metadataPath = "/functions/v1/field-capture"
        let body: [String: String] = [
            "deal_id": propertyID,
            "local_identifier": payload.localIdentifier,
            "capture_type": captureType,
            "note": payload.note ?? "",
            "storage_path": storagePath ?? "",
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
        if path.hasPrefix("/rest/v1/"), method != "GET" {
            request.setValue("return=representation", forHTTPHeaderField: "Prefer")
        }
        request.httpBody = data

        let (responseData, response) = try await urlSession.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw BRIXAPIError.invalidResponse
        }

        guard (200..<300).contains(http.statusCode) else {
            let message = parseBackendMessage(responseData) ?? String(data: responseData, encoding: .utf8) ?? "No error body"
            throw BRIXAPIError.backend(status: http.statusCode, message: message)
        }

        return responseData
    }

    private func decode<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {
        try JSONDecoder.brix.decode(type, from: data)
    }

    private func parseBackendMessage(_ data: Data) -> String? {
        guard
            let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { return nil }

        for key in ["msg", "message", "error_description", "error"] {
            if let value = object[key] as? String, value.isEmpty == false {
                return value
            }
        }
        return nil
    }

    private func normalizeCaptureType(_ value: String) -> String {
        switch value.lowercased() {
        case "photo", "photos":
            return "photo"
        case "video":
            return "video"
        case "document", "scan", "document scan":
            return "document_scan"
        case "voice", "voice note":
            return "voice_note"
        default:
            return "photo"
        }
    }

    private func optionalText(_ value: String) -> String? {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }

    private func optionalNumber(_ value: String) -> Double? {
        let cleaned = value.replacingOccurrences(of: "$", with: "").replacingOccurrences(of: ",", with: "").trimmingCharacters(in: .whitespacesAndNewlines)
        guard let number = Double(cleaned), number > 0 else { return nil }
        return number
    }

    private func optionalArray(_ values: [String]) -> [String]? {
        let cleaned = values
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { $0.isEmpty == false }
        return cleaned.isEmpty ? nil : cleaned
    }
}

enum AnyEncodableValue: Encodable {
    case string(String)
    case bool(Bool)

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value):
            try container.encode(value)
        case .bool(let value):
            try container.encode(value)
        }
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

private struct EmptyRPCBody: Encodable {}

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
