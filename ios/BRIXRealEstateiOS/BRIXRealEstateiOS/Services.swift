import Foundation

struct BRIXAuthSession: Codable, Equatable {
    let accessToken: String
    let refreshToken: String
}

enum BRIXServiceError: Error, Equatable {
    case authenticationRequired
    case accessRevoked
    case badResponse(Int)
    case invalidCanonicalResponse
    case configurationMissing(String)
}

enum BRIXService {
    static let supabaseURL: URL = {
        let value = requiredInfoString("BRIX_SUPABASE_URL")
        guard let url = URL(string: value), url.scheme == "https" else {
            fatalError("Invalid required BRIX iOS configuration: BRIX_SUPABASE_URL")
        }
        return url
    }()

    static let publishableKey = requiredInfoString("BRIX_SUPABASE_PUBLISHABLE_KEY")
    private static let encoder = JSONEncoder()

    private static func requiredInfoString(_ key: String) -> String {
        guard let value = Bundle.main.object(forInfoDictionaryKey: key) as? String else {
            fatalError("Missing required BRIX iOS configuration: \(key)")
        }
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            fatalError("Missing required BRIX iOS configuration: \(key)")
        }
        return trimmed
    }

    static func invoke(function name: String, body: [String: Any]) async throws -> Data {
        var request = URLRequest(url: supabaseURL.appendingPathComponent("functions/v1/\(name)"))
        request.httpMethod = "POST"
        request.setValue(publishableKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(publishableKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, response) = try await URLSession.shared.data(for: request)
        try validateHTTP(response)
        return data
    }

    static func signIn(email: String, password: String) async throws -> BRIXAuthSession {
        try await auth(endpoint: "/auth/v1/token?grant_type=password", body: ["email": email, "password": password])
    }

    static func signUp(email: String, password: String) async throws -> BRIXAuthSession {
        try await auth(endpoint: "/auth/v1/signup", body: ["email": email, "password": password])
    }

    static func refreshSession(refreshToken: String) async throws -> BRIXAuthSession {
        try await auth(endpoint: "/auth/v1/token?grant_type=refresh_token", body: ["refresh_token": refreshToken])
    }

    static func resetPassword(email: String) async throws {
        _ = try await auth(endpoint: "/auth/v1/recover", body: [
            "email": email,
            "redirect_to": "https://brixrealestate.app/account?flow=reset-password"
        ])
    }

    static func validateSession(accessToken: String) async throws {
        var request = URLRequest(url: supabaseURL.appendingPathComponent("auth/v1/user"))
        request.httpMethod = "GET"
        authorize(&request, accessToken: accessToken)
        let (_, response) = try await URLSession.shared.data(for: request)
        try validateHTTP(response)
    }

    static func fetchDeals(accessToken: String) async throws -> [Deal] {
        let workspaceID = try await ensureWorkspaceID(accessToken: accessToken)
        let data = try await rpc("list_deal_projection", body: [
            "target_workspace_id": workspaceID,
            "page_size": 50,
            "page_offset": 0,
            "sort_key": "updated_desc",
            "search_query": NSNull(),
            "filter_input": [:],
            "include_archived": false
        ], accessToken: accessToken)
        let rows = jsonRows(data)
        var deals: [Deal] = []
        deals.reserveCapacity(rows.count)
        for row in rows {
            guard let id = string(row["deal_id"]) else { continue }
            if let deal = try await loadCanonicalDeal(id: id, accessToken: accessToken) { deals.append(deal) }
        }
        return deals
    }

    static func upsertDeal(_ deal: Deal, accessToken: String) async throws {
        let workspaceID = try await ensureWorkspaceID(accessToken: accessToken)
        let existing = try await loadCanonicalDealDetail(id: deal.id.uuidString, accessToken: accessToken)
        if let existing {
            let version = int(existing["deal_version"]) ?? 1
            _ = try await rpc("update_canonical_deal", body: [
                "target_deal_id": deal.id.uuidString,
                "expected_version": version,
                "idempotency_key": "ios:deal:update:\(deal.id.uuidString):\(UUID().uuidString)",
                "deal_input": try canonicalDealInput(for: deal)
            ], accessToken: accessToken)
            return
        }

        _ = try await rpc("create_canonical_deal", body: [
            "target_workspace_id": workspaceID,
            "idempotency_key": "ios:deal:create:\(deal.id.uuidString)",
            "property_input": canonicalPropertyInput(for: deal),
            "deal_input": try canonicalCreateDealInput(for: deal),
            "existing_property_id": NSNull()
        ], accessToken: accessToken)
    }

    static func updateDealLifecycle(id: UUID, stage: String, accessToken: String) async throws -> Deal {
        guard let detail = try await loadCanonicalDealDetail(id: id.uuidString, accessToken: accessToken) else {
            throw BRIXServiceError.badResponse(404)
        }
        guard let version = int(detail["deal_version"]) else {
            throw BRIXServiceError.invalidCanonicalResponse
        }

        _ = try await rpc("update_deal_lifecycle", body: [
            "target_deal_id": id.uuidString,
            "lifecycle_input": [
                "stage": stage,
                "reason": "ios_pipeline_advance"
            ],
            "expected_version": version,
            "idempotency_key": "ios:deal:lifecycle:\(id.uuidString):\(version):\(stage)"
        ], accessToken: accessToken)

        guard let updated = try await loadCanonicalDeal(id: id.uuidString, accessToken: accessToken) else {
            throw BRIXServiceError.invalidCanonicalResponse
        }
        return updated
    }

    static func softDeleteDeal(id: UUID, accessToken: String) async throws {
        guard let detail = try await loadCanonicalDealDetail(id: id.uuidString, accessToken: accessToken) else { return }
        let version = int(detail["deal_version"]) ?? 1
        _ = try await rpc("archive_deal", body: [
            "target_deal_id": id.uuidString,
            "expected_version": version,
            "idempotency_key": "ios:deal:archive:\(id.uuidString):\(UUID().uuidString)",
            "archive_reason": "ios_user_archive"
        ], accessToken: accessToken)
    }

    static func requestAccountDeletion(accessToken: String) async throws {
        var request = URLRequest(url: supabaseURL.appendingPathComponent("functions/v1/request-account-deletion"))
        request.httpMethod = "POST"
        request.setValue(publishableKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("ios", forHTTPHeaderField: "x-brix-client")
        request.httpBody = Data("{}".utf8)
        let (_, response) = try await URLSession.shared.data(for: request)
        try validateHTTP(response)
    }

    private static func ensureWorkspaceID(accessToken: String) async throws -> String {
        let data = try await rpc("ensure_workspace_context", body: [:], accessToken: accessToken)
        guard let row = jsonRows(data).first, let workspaceID = string(row["workspace_id"]) else {
            throw BRIXServiceError.invalidCanonicalResponse
        }
        return workspaceID
    }

    private static func loadCanonicalDeal(id: String, accessToken: String) async throws -> Deal? {
        guard let detail = try await loadCanonicalDealDetail(id: id, accessToken: accessToken) else { return nil }
        return dealFromDetailProjection(detail)
    }

    private static func loadCanonicalDealDetail(id: String, accessToken: String) async throws -> [String: Any]? {
        do {
            let data = try await rpc("load_deal_detail_projection", body: ["target_deal_id": id], accessToken: accessToken)
            return jsonRows(data).first
        } catch let error as BRIXServiceError {
            if error == .badResponse(404) { return nil }
            throw error
        }
    }

    private static func rpc(_ name: String, body: [String: Any], accessToken: String) async throws -> Data {
        var request = URLRequest(url: supabaseURL.appendingPathComponent("rest/v1/rpc/\(name)"))
        request.httpMethod = "POST"
        authorize(&request, accessToken: accessToken)
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, response) = try await URLSession.shared.data(for: request)
        try validateHTTP(response)
        return data
    }

    private static func canonicalPropertyInput(for deal: Deal) -> [String: Any] {
        [
            "display_address": deal.address,
            "address_line1": deal.address,
            "city": deal.city.isEmpty ? NSNull() : deal.city,
            "region": deal.state.isEmpty ? NSNull() : deal.state,
            "postal_code": deal.zip.isEmpty ? NSNull() : deal.zip,
            "country": "US",
            "source_identifiers": deal.sourceUrl.isEmpty ? [:] : ["listing_url": deal.sourceUrl]
        ]
    }

    private static func canonicalCreateDealInput(for deal: Deal) throws -> [String: Any] {
        var input = try canonicalDealInput(for: deal)
        input["id"] = deal.id.uuidString
        input["deal_type"] = "acquisition"
        input["source"] = deal.sourceUrl.isEmpty ? "manual" : "listing_url"
        return input
    }

    private static func canonicalDealInput(for deal: Deal) throws -> [String: Any] {
        let facts = try JSONSerialization.jsonObject(with: encoder.encode(deal)) as? [String: Any] ?? [:]
        return [
            "display_name": deal.address,
            "strategy_intent": deal.strategy.rawValue,
            "source_url": deal.sourceUrl.isEmpty ? NSNull() : deal.sourceUrl,
            "source_text": deal.sourceText.isEmpty ? NSNull() : deal.sourceText,
            "strategy_id": deal.strategy.rawValue,
            "facts": facts,
            "verification": [:]
        ]
    }

    private static func auth(endpoint: String, body: [String: Any]) async throws -> BRIXAuthSession {
        var request = URLRequest(url: URL(string: endpoint, relativeTo: supabaseURL)!.absoluteURL)
        request.httpMethod = "POST"
        authorize(&request, accessToken: publishableKey)
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, response) = try await URLSession.shared.data(for: request)
        try validateHTTP(response)
        let parsed = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
        return BRIXAuthSession(
            accessToken: parsed?["access_token"] as? String ?? "",
            refreshToken: parsed?["refresh_token"] as? String ?? ""
        )
    }

    private static func authorize(_ request: inout URLRequest, accessToken: String) {
        request.setValue(publishableKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    }

    private static func validateHTTP(_ response: URLResponse) throws {
        guard let http = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }
        if http.statusCode == 401 { throw BRIXServiceError.authenticationRequired }
        if http.statusCode == 403 { throw BRIXServiceError.accessRevoked }
        guard (200..<300).contains(http.statusCode) else { throw BRIXServiceError.badResponse(http.statusCode) }
    }

    private static func jsonRows(_ data: Data) -> [[String: Any]] {
        if let rows = (try? JSONSerialization.jsonObject(with: data)) as? [[String: Any]] { return rows }
        if let row = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] { return [row] }
        return []
    }

    private static func dealFromDetailProjection(_ row: [String: Any]) -> Deal {
        let facts = row["facts"] as? [String: Any] ?? [:]
        var deal = Deal()
        if let idText = string(row["deal_id"]), let id = UUID(uuidString: idText) { deal.id = id }
        deal.status = string(row["stage"]) ?? "lead"
        deal.sourceUrl = string(row["source_url"]) ?? string(facts["sourceUrl"]) ?? ""
        deal.sourceText = string(row["source_text"]) ?? string(facts["sourceText"]) ?? ""
        deal.address = string(row["primary_property_address"]) ?? string(facts["address"]) ?? string(row["display_name"]) ?? ""
        deal.city = string(row["primary_property_city"]) ?? string(facts["city"]) ?? ""
        deal.state = string(row["primary_property_region"]) ?? string(facts["state"]) ?? ""
        deal.zip = string(row["primary_property_postal_code"]) ?? string(facts["zip"]) ?? ""
        deal.strategy = StrategyId(rawValue: string(row["strategy_id"]) ?? string(row["strategy_intent"]) ?? string(facts["strategy"]) ?? string(facts["strategyId"]) ?? "") ?? .ownerOccupant
        deal.listPrice = double(facts["listPrice"])
        deal.beds = double(facts["beds"])
        deal.baths = double(facts["baths"])
        deal.squareFeet = double(facts["squareFeet"])
        deal.annualTaxes = double(facts["annualTaxes"])
        deal.annualInsurance = double(facts["annualInsurance"])
        deal.monthlyRent = double(facts["monthlyRent"])
        deal.rehabBudget = double(facts["rehabBudget"])
        deal.arv = double(facts["arv"])
        deal.downPayment = double(facts["downPayment"])
        deal.photoNames = facts["photoNames"] as? [String] ?? facts["uploadedPhotoNames"] as? [String] ?? []
        deal.notes = facts["notes"] as? [String] ?? []
        return deal
    }

    private static func string(_ value: Any?) -> String? {
        guard !(value is NSNull) else { return nil }
        return value as? String
    }

    private static func double(_ value: Any?) -> Double? {
        guard !(value is NSNull) else { return nil }
        if let value = value as? Double { return value }
        if let value = value as? Int { return Double(value) }
        if let value = value as? String { return Double(value) }
        return nil
    }

    private static func int(_ value: Any?) -> Int? {
        if let value = value as? Int { return value }
        if let value = value as? Double { return Int(value) }
        if let value = value as? String { return Int(value) }
        return nil
    }
}
