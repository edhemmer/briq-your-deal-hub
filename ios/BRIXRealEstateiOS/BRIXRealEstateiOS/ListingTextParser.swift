import Foundation

enum ListingTextParser {
    static func parse(_ input: String, strategy: StrategyId) -> Deal {
        var deal = Deal(strategy: strategy)
        deal.sourceText = input.trimmingCharacters(in: .whitespacesAndNewlines)
        if deal.sourceText.lowercased().hasPrefix("http") {
            deal.sourceUrl = deal.sourceText
        }
        let decoded = deal.sourceText.removingPercentEncoding ?? deal.sourceText
        let cleaned = decoded.replacingOccurrences(of: "-", with: " ").replacingOccurrences(of: "_", with: " ")
        if let result = addressFromURLSlug(decoded) {
            deal.address = result.address
            deal.city = result.city
            deal.state = result.state
            deal.zip = result.zip
        } else if let result = matchAddress(cleaned) {
            deal.address = result.address
            deal.city = result.city
            deal.state = result.state
            deal.zip = result.zip
        } else {
            deal.address = cleaned.components(separatedBy: CharacterSet(charactersIn: "\n,")).first?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        }
        deal.listPrice = firstMoney(in: deal.sourceText)
        deal.beds = firstNumber(after: #"\s*(beds?|bd|bedrooms?)"#, in: deal.sourceText)
        deal.baths = firstNumber(after: #"\s*(baths?|ba|bathrooms?)"#, in: deal.sourceText)
        deal.squareFeet = firstNumber(before: #"(sqft|sq\.?\s*ft|square feet)"#, in: deal.sourceText)
        deal.annualTaxes = money(after: #"(tax|taxes|property tax)"#, in: deal.sourceText)
        deal.photoNames = imageURLs(in: deal.sourceText)
        return deal
    }

    private static func addressFromURLSlug(_ text: String) -> (address: String, city: String, state: String, zip: String)? {
        guard text.lowercased().hasPrefix("http") else { return nil }
        let parts = text.components(separatedBy: "/")
        guard let segment = parts.first(where: { $0.range(of: #"\d{5}"#, options: .regularExpression) != nil && $0.range(of: #"-[A-Za-z]{2}-\d{5}"#, options: .regularExpression) != nil }) else { return nil }
        let cleaned = segment
            .replacingOccurrences(of: #"_zpid.*"#, with: "", options: .regularExpression)
            .replacingOccurrences(of: #"\?.*"#, with: "", options: .regularExpression)
        let tokens = cleaned.components(separatedBy: "-").filter { !$0.isEmpty }
        guard let zipIndex = tokens.firstIndex(where: { $0.range(of: #"^\d{5}$"#, options: .regularExpression) != nil }),
              zipIndex >= 3 else { return nil }
        let state = tokens[zipIndex - 1].uppercased()
        let beforeState = Array(tokens[0..<(zipIndex - 1)])
        let suffixes: Set<String> = ["st", "street", "ave", "avenue", "rd", "road", "dr", "drive", "ln", "lane", "ct", "court", "cir", "circle", "blvd", "way", "pl", "place", "trl", "trail", "pkwy", "parkway", "ter", "terrace"]
        let suffixIndex = beforeState.firstIndex { token in suffixes.contains(token.lowercased()) }
        let addressEnd = suffixIndex.map { $0 + 1 } ?? max(2, beforeState.count - 1)
        let address = beforeState.prefix(addressEnd).joined(separator: " ")
        let city = beforeState.dropFirst(addressEnd).joined(separator: " ")
        return (titleCase(address), titleCase(city), state, tokens[zipIndex])
    }

    private static func matchAddress(_ text: String) -> (address: String, city: String, state: String, zip: String)? {
        let pattern = #"([0-9]{1,6}[\w\s.]+?)\s+([A-Za-z .'-]+)\s+([A-Z]{2})\s+(\d{5})"#
        guard let regex = try? NSRegularExpression(pattern: pattern),
              let match = regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)),
              match.numberOfRanges >= 5 else { return nil }
        func group(_ index: Int) -> String {
            guard let range = Range(match.range(at: index), in: text) else { return "" }
            return String(text[range]).trimmingCharacters(in: .whitespacesAndNewlines)
        }
        return (group(1), group(2), group(3), group(4))
    }

    private static func firstMoney(in text: String) -> Double? {
        money(after: #""#, in: text)
    }

    private static func money(after prefix: String, in text: String) -> Double? {
        let pattern = prefix.isEmpty ? #"\$[\d,]+"# : prefix + #"\D{0,35}(\$[\d,]+)"#
        guard let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]),
              let match = regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)) else { return nil }
        let index = match.numberOfRanges > 1 ? 1 : 0
        guard let range = Range(match.range(at: index), in: text) else { return nil }
        return Double(String(text[range]).replacingOccurrences(of: "$", with: "").replacingOccurrences(of: ",", with: ""))
    }

    private static func firstNumber(after suffix: String, in text: String) -> Double? {
        let pattern = #"(\d+(?:\.\d+)?)"# + suffix
        return number(pattern: pattern, group: 1, in: text)
    }

    private static func firstNumber(before suffix: String, in text: String) -> Double? {
        let pattern = #"([\d,]+)\s*"# + suffix
        return number(pattern: pattern, group: 1, in: text)
    }

    private static func number(pattern: String, group: Int, in text: String) -> Double? {
        guard let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]),
              let match = regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)),
              let range = Range(match.range(at: group), in: text) else { return nil }
        return Double(String(text[range]).replacingOccurrences(of: ",", with: ""))
    }

    private static func imageURLs(in text: String) -> [String] {
        let pattern = #"https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>]+)?"#
        guard let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]) else { return [] }
        return regex.matches(in: text, range: NSRange(text.startIndex..., in: text)).compactMap { match in
            guard let range = Range(match.range, in: text) else { return nil }
            return String(text[range])
        }
    }

    private static func titleCase(_ value: String) -> String {
        value.components(separatedBy: " ").filter { !$0.isEmpty }.map { token in
            token.prefix(1).uppercased() + token.dropFirst()
        }.joined(separator: " ")
    }
}
