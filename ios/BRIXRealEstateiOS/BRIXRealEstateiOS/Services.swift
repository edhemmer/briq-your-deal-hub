import Foundation

struct BRIXAuthSession: Codable, Equatable {
    let accessToken: String
    let refreshToken: String
}

enum BRIXServiceError: Error, Equatable {
    case authenticationRequired
    case accessRevoked
    case badResponse(Int)
}

enum BRIXService {
    static let supabaseURL = URL(string: "https://luwaqrkhmxcqsozmilbw.supabase.co")!
    static let publishableKey = "sb_publishable_gl6bNZ2T_sGmO7SbDlcdUA_9UzzNB3f"
    private static let encoder = JSONEncoder()

    static func invoke(function name: String, body: [String: Any]) async throws -> Data {
        var request = URLRequest(url: supabaseURL.appendingPathComponent("functions/v1/\(name)"))
        request.httpMethod = "POST"
        request.setValue(publishableKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(publishableKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
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
        _ = try await auth(
            endpoint: "/auth/v1/recover",
            body: [
                "email": email,
                "redirect_to": "https://brixrealestate.app/account?flow=reset-password"
            ]
        )
    }

    static func validateSession(accessToken: String) async throws {
        var request = URLRequest(url: supabaseURL.appendingPathComponent("auth/v1/user"))
        request.httpMethod = "GET"
        authorize(&request, accessToken: accessToken)
        let (_, response) = try await URLSession.shared.data(for: request)
        try validateHTTP(response)
    }

    static func fetchDeals(accessToken: String) async throws -> [Deal] {
        var components = URLComponents(url: supabaseURL.appendingPathComponent("rest/v1/brix_deals"), resolvingAgainstBaseURL: false)!
        components.queryItems = [
            URLQueryItem(name: "select", value: "*"),
            URLQueryItem(name: "deleted_at", value: "is.null"),
            URLQueryItem(name: "order", value: "updated_at.desc")
        ]
        var request = URLRequest(url: components.url!)
        request.httpMethod = "GET"
        authorize(&request, accessToken: accessToken)
        let (data, response) = try await URLSession.shared.data(for: request)
        try validateHTTP(response)
        let rows = (try JSONSerialization.jsonObject(with: data)) as? [[String: Any]] ?? []
        return rows.map(dealFromRow)
    }

    static func upsertDeal(_ deal: Deal, accessToken: String) async throws {
        var components = URLComponents(url: supabaseURL.appendingPathComponent("rest/v1/brix_deals"), resolvingAgainstBaseURL: false)!
        components.queryItems = [URLQueryItem(name: "on_conflict", value: "id")]
        var request = URLRequest(url: components.url!)
        request.httpMethod = "POST"
        authorize(&request, accessToken: accessToken)
        request.setValue("resolution=merge-duplicates,return=minimal", forHTTPHeaderField: "Prefer")
        request.httpBody = try JSONSerialization.data(withJSONObject: rowPayload(for: deal, accessToken: accessToken))
        let (_, response) = try await URLSession.shared.data(for: request)
        try validateHTTP(response)
    }

    static func softDeleteDeal(id: UUID, accessToken: String) async throws {
        var components = URLComponents(url: supabaseURL.appendingPathComponent("rest/v1/brix_deals"), resolvingAgainstBaseURL: false)!
        components.queryItems = [URLQueryItem(name: "id", value: "eq.\(id.uuidString)")]
        var request = URLRequest(url: components.url!)
        request.httpMethod = "PATCH"
        authorize(&request, accessToken: accessToken)
        request.httpBody = try JSONSerialization.data(withJSONObject: ["deleted_at": ISO8601DateFormatter().string(from: Date())])
        let (_, response) = try await URLSession.shared.data(for: request)
        try validateHTTP(response)
    }

    static func requestAccountDeletion(accessToken: String) async throws {
        var request = URLRequest(url: supabaseURL.appendingPathComponent("functions/v1/request-account-deletion"))
        request.httpMethod = "POST"
        request.setValue(publishableKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = Data("{}".utf8)
        let (_, response) = try await URLSession.shared.data(for: request)
        try validateHTTP(response)
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

    private static func rowPayload(for deal: Deal, accessToken: String) throws -> [String: Any] {
        let facts = try JSONSerialization.jsonObject(with: encoder.encode(deal)) as? [String: Any] ?? [:]
        guard let ownerID = userId(from: accessToken) else { throw URLError(.userAuthenticationRequired) }
        return [
            "id": deal.id.uuidString,
            "owner_id": ownerID,
            "status": deal.status,
            "source_url": deal.sourceUrl.isEmpty ? NSNull() : deal.sourceUrl,
            "source_text": deal.sourceText.isEmpty ? NSNull() : deal.sourceText,
            "address": deal.address,
            "city": deal.city.isEmpty ? NSNull() : deal.city,
            "state": deal.state.isEmpty ? NSNull() : deal.state,
            "zip": deal.zip.isEmpty ? NSNull() : deal.zip,
            "strategy_id": deal.strategy.rawValue,
            "facts": facts,
            "verification": [:],
            "updated_at": ISO8601DateFormatter().string(from: Date())
        ]
    }

    private static func userId(from jwt: String) -> String? {
        let parts = jwt.split(separator: ".")
        guard parts.count > 1 else { return nil }
        var payload = String(parts[1]).replacingOccurrences(of: "-", with: "+").replacingOccurrences(of: "_", with: "/")
        while payload.count % 4 != 0 { payload.append("=") }
        guard let data = Data(base64Encoded: payload),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return nil }
        return json["sub"] as? String
    }

    private static func dealFromRow(_ row: [String: Any]) -> Deal {
        let facts = row["facts"] as? [String: Any] ?? [:]
        var deal = Deal()
        if let idText = row["id"] as? String, let id = UUID(uuidString: idText) { deal.id = id }
        deal.status = string(row["status"]) ?? deal.status
        deal.sourceUrl = string(row["source_url"]) ?? string(facts["sourceUrl"]) ?? ""
        deal.sourceText = string(row["source_text"]) ?? string(facts["sourceText"]) ?? ""
        deal.address = string(row["address"]) ?? string(facts["address"]) ?? ""
        deal.city = string(row["city"]) ?? string(facts["city"]) ?? ""
        deal.state = string(row["state"]) ?? string(facts["state"]) ?? ""
        deal.zip = string(row["zip"]) ?? string(facts["zip"]) ?? ""
        deal.strategy = StrategyId(rawValue: string(row["strategy_id"]) ?? string(facts["strategy"]) ?? string(facts["strategyId"]) ?? "") ?? .ownerOccupant
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
}
