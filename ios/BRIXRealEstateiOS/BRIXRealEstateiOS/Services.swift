import Foundation

enum BRIXService {
    static let supabaseURL = URL(string: "https://luwaqrkhmxcqsozmilbw.supabase.co")!
    static let publishableKey = "sb_publishable_gl6bNZ2T_sGmO7SbDlcdUA_9UzzNB3f"

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

    static func signIn(email: String, password: String) async throws -> String {
        try await auth(path: "token?grant_type=password", body: ["email": email, "password": password])
    }

    static func signUp(email: String, password: String) async throws -> String {
        try await auth(path: "signup", body: ["email": email, "password": password])
    }

    static func resetPassword(email: String) async throws {
        try await auth(path: "recover", body: ["email": email])
    }

    static func requestAccountDeletion(accessToken: String) async throws {
        var request = URLRequest(url: supabaseURL.appendingPathComponent("functions/v1/request-account-deletion"))
        request.httpMethod = "POST"
        request.setValue(publishableKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = Data("{}".utf8)
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.userAuthenticationRequired)
        }
    }

    private static func auth(path: String, body: [String: Any]) async throws -> String {
        var request = URLRequest(url: supabaseURL.appendingPathComponent("auth/v1/\(path)"))
        request.httpMethod = "POST"
        request.setValue(publishableKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(publishableKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.userAuthenticationRequired)
        }
        let parsed = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
        return parsed?["access_token"] as? String ?? ""
    }
}
