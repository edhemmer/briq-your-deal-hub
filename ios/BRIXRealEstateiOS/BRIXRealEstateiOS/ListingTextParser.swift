import Foundation

enum ListingTextParser {
    static func localExtract(from rawText: String) -> ExtractedListingDeal {
        let text = rawText.replacingOccurrences(of: "\n", with: " ")
        let url = firstURL(in: text)
        let urlParts = url.flatMap(parseListingURL)

        return ExtractedListingDeal(
            propertyAddress: firstAddress(in: text) ?? urlParts?.address,
            city: cityStateZip(in: text)?.city ?? urlParts?.city,
            county: county(in: text),
            state: cityStateZip(in: text)?.state ?? urlParts?.state,
            zipCode: cityStateZip(in: text)?.zip ?? urlParts?.zip,
            propertyType: propertyType(in: text),
            purchasePrice: firstMoney(in: text, labels: ["price", "list price", "asking", "for sale"]) ?? firstStandalonePrice(in: text),
            estimatedARV: firstMoney(in: text, labels: ["arv", "after repair value"]),
            monthlyRent: firstMoney(in: text, labels: ["rent", "rental income", "market rent"]),
            annualPropertyTax: firstMoney(in: text, labels: ["taxes", "property tax", "annual tax"]),
            taxes: firstMoney(in: text, labels: ["taxes", "property tax", "annual tax"]),
            insurance: firstMoney(in: text, labels: ["insurance", "premium"]),
            beds: firstNumber(in: text, pattern: #"(\d+(?:\.\d+)?)\s*(?:beds?|bedrooms?)\b"#),
            baths: firstNumber(in: text, pattern: #"(\d+(?:\.\d+)?)\s*(?:baths?|bathrooms?)\b"#),
            squareFeet: firstNumber(in: text, pattern: #"([\d,]{3,6})\s*(?:sq\.?\s*ft\.?|sqft|square feet)\b"#),
            yearBuilt: firstNumber(in: text, pattern: #"(?:built|year built)[^\d]{0,12}(\d{4})"#),
            conditionNotes: conditionNotes(in: text),
            visibleOrStatedRisks: riskNotes(in: text),
            missingQuestions: [
                "Verify rent support.",
                "Verify taxes from official records.",
                "Get an annual insurance quote.",
                "Check map/street context for road noise, access friction, parking, and nearby traffic corridors before visiting.",
                "Verify condition with photos, inspection, or contractor review."
            ],
            photoURLs: photoURLs(in: text),
            strategyPrimary: strategy(in: text),
            sourceConfidence: urlParts != nil || firstAddress(in: text) != nil ? "medium" : "low"
        )
    }

    static func firstURL(in text: String) -> String? {
        let pattern = #"https?://[^\s]+"#
        return firstCapture(in: text, pattern: pattern, group: 0)
    }

    private static func parseListingURL(_ urlString: String) -> (address: String?, city: String?, state: String?, zip: String?)? {
        guard let url = URL(string: urlString) else { return nil }

        let genericWords = #"\b(?:home|homes|details|property|real-estate|for-sale|listing|listings|house|houses)\b"#
        let segments = url.path
            .removingPercentEncoding?
            .split(separator: "/")
            .map(String.init) ?? []

        let candidates = segments
            .map { segment in
                segment
                    .replacingOccurrences(of: #"_zpid.*$"#, with: "", options: .regularExpression)
                    .replacingOccurrences(of: #"\d+_zpid.*$"#, with: "", options: .regularExpression)
                    .replacingOccurrences(of: genericWords, with: " ", options: [.regularExpression, .caseInsensitive])
                    .replacingOccurrences(of: #"[-_]+"#, with: " ", options: .regularExpression)
                    .replacingOccurrences(of: #"\s+"#, with: " ", options: .regularExpression)
                    .trimmingCharacters(in: .whitespacesAndNewlines)
            }
            .filter { candidate in
                candidate.range(of: #"\d{1,6}\s+\S+"#, options: .regularExpression) != nil ||
                candidate.range(of: #"\b[A-Z]{2}\s+\d{5}\b"#, options: [.regularExpression, .caseInsensitive]) != nil
            }

        guard var slug = candidates.first(where: { $0.range(of: #"\d{1,6}\s+\S+"#, options: .regularExpression) != nil }) ?? candidates.last else {
            return nil
        }

        slug = slug
            .replacingOccurrences(of: #"\b(?:zpid|mls|pid)\b.*$"#, with: "", options: [.regularExpression, .caseInsensitive])
            .replacingOccurrences(of: #"\s+"#, with: " ", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)

        guard slug.isEmpty == false else { return nil }
        let tokens = slug.split(separator: " ").map(String.init)
        let zipIndex = tokens.lastIndex { $0.range(of: #"^\d{5}$"#, options: .regularExpression) != nil }
        let zip = zipIndex.map { tokens[$0] }
        let stateCandidate = zipIndex.flatMap { $0 > 0 ? tokens[$0 - 1].uppercased() : nil }
        let state = stateCandidate.flatMap { stateCodes.contains($0) ? $0 : nil }
        let city = (zipIndex != nil && state != nil && zipIndex! > 1) ? tokens[zipIndex! - 2] : nil
        let addressTokens = (zipIndex != nil && state != nil) ? Array(tokens.prefix(max(0, zipIndex! - 2))) : tokens

        return (titleCase(addressTokens.joined(separator: " ")), titleCase(city), state, zip)
    }

    private static let stateCodes: Set<String> = [
        "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA",
        "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK",
        "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"
    ]

    private static func titleCase(_ value: String?) -> String? {
        guard let value, value.isEmpty == false else { return nil }
        return value
            .lowercased()
            .split(separator: " ")
            .map { part in
                let text = String(part)
                if text.count <= 2, stateCodes.contains(text.uppercased()) {
                    return text.uppercased()
                }
                return text.prefix(1).uppercased() + String(text.dropFirst())
            }
            .joined(separator: " ")
    }

    private static func firstAddress(in text: String) -> String? {
        firstCapture(in: text, pattern: #"\b(\d{1,6}\s+[A-Za-z0-9.' -]+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Ct|Court|Cir|Circle|Way|Blvd|Boulevard|Pl|Place|Ter|Terrace|Trl|Trail)\b)"#)
    }

    private static func cityStateZip(in text: String) -> (city: String?, state: String?, zip: String?)? {
        guard let match = firstMatch(in: text, pattern: #"\b([A-Za-z .'-]+),\s*([A-Z]{2})\s+(\d{5})(?:-\d{4})?\b"#) else { return nil }
        return (capture(match, in: text, group: 1), capture(match, in: text, group: 2), capture(match, in: text, group: 3))
    }

    private static func county(in text: String) -> String? {
        guard let value = firstCapture(in: text, pattern: #"\b([A-Za-z][A-Za-z .'-]{1,40})\s+County\b"#) else { return nil }
        return value
            .replacingOccurrences(of: #"(?i)\b(county|il|illinois)\b"#, with: "", options: .regularExpression)
            .replacingOccurrences(of: #"[,\.-]"#, with: " ", options: .regularExpression)
            .replacingOccurrences(of: #"\s+"#, with: " ", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private static func propertyType(in text: String) -> String? {
        let lower = text.lowercased()
        if lower.contains("duplex") { return "Duplex" }
        if lower.contains("triplex") { return "Triplex" }
        if lower.contains("fourplex") || lower.contains("4-plex") { return "Fourplex" }
        if lower.contains("multi-family") || lower.contains("multifamily") { return "Small Multifamily" }
        if lower.contains("commercial") || lower.contains("retail") || lower.contains("office") { return "Commercial" }
        if lower.contains("land") || lower.contains(" lot ") { return "Land" }
        if lower.contains("mixed use") || lower.contains("mixed-use") { return "Mixed Use" }
        if lower.contains("single family") || lower.contains("home") || lower.contains("house") { return "Single Family" }
        return nil
    }

    private static func strategy(in text: String) -> String? {
        let lower = text.lowercased()
        if lower.contains("owner occupant") || lower.contains("owner-occupant") || lower.contains("primary residence") || lower.contains("live in") || lower.contains("live-in") || lower.contains("home search") { return "Owner Occupant" }
        if lower.contains("brrrr") { return "BRRRR" }
        if lower.contains("flip") || lower.contains("resale") { return "Fix & Flip" }
        if lower.contains("wholesale") { return "Wholesale" }
        if lower.contains("development") { return "Development" }
        return nil
    }

    private static func conditionNotes(in text: String) -> [String] {
        var notes: [String] = []
        if text.range(of: "cosmetic|paint|flooring|update|refresh", options: .regularExpression) != nil { notes.append("Cosmetic updates mentioned.") }
        if text.range(of: "roof", options: .caseInsensitive) != nil { notes.append("Roof mentioned; verify age and condition.") }
        if text.range(of: "as-is|as is", options: [.regularExpression, .caseInsensitive]) != nil { notes.append("As-is sale language mentioned.") }
        if text.range(of: "fixer|rehab|needs work|tlc", options: [.regularExpression, .caseInsensitive]) != nil { notes.append("Repair or rehab need mentioned.") }
        return notes
    }

    private static func riskNotes(in text: String) -> [String] {
        var notes: [String] = []
        if text.range(of: "flood|foundation|mold|water damage|structural|fire damage", options: [.regularExpression, .caseInsensitive]) != nil {
            notes.append("Material condition concern mentioned.")
        }
        if text.range(of: "short sale|foreclosure|auction|probate|estate", options: [.regularExpression, .caseInsensitive]) != nil {
            notes.append("Special transaction context mentioned.")
        }
        if text.range(of: "busy road|busy street|main road|main street|high traffic|traffic noise|road noise|commuter route", options: [.regularExpression, .caseInsensitive]) != nil {
            notes.append("Location access concern: listing text suggests busy-road or traffic-noise exposure. Verify street context before visiting.")
        }
        if text.range(of: "highway|expressway|interstate|state route|county highway|us route|il route|route \\d+|rt\\.?\\s*\\d+", options: [.regularExpression, .caseInsensitive]) != nil {
            notes.append("Location access concern: possible highway or route exposure. Check ingress, egress, noise, and tenant/resale impact.")
        }
        if text.range(of: "railroad|rail line|train tracks|tracks nearby", options: [.regularExpression, .caseInsensitive]) != nil {
            notes.append("Location friction concern: nearby rail exposure mentioned. Verify noise, safety, and resale impact.")
        }
        if text.range(of: "no parking|limited parking|shared driveway|easement|private road", options: [.regularExpression, .caseInsensitive]) != nil {
            notes.append("Access/parking constraint mentioned. Verify daily usability, tenant demand, and resale impact.")
        }
        return notes
    }

    private static func photoURLs(in text: String) -> [String] {
        guard let regex = try? NSRegularExpression(pattern: #"https?://[^\s"'<>]+?\.(?:jpg|jpeg|png|webp|avif)(?:\?[^\s"'<>]*)?"#, options: [.caseInsensitive]) else {
            return []
        }
        let matches = regex.matches(in: text, range: NSRange(text.startIndex..., in: text))
        var seen = Set<String>()
        return matches.compactMap { match in
            guard let range = Range(match.range, in: text) else { return nil }
            let value = String(text[range])
            guard seen.insert(value).inserted else { return nil }
            return value
        }
    }

    private static func firstMoney(in text: String, labels: [String]) -> Double? {
        for label in labels {
            let escaped = NSRegularExpression.escapedPattern(for: label)
            if let value = firstCapture(in: text, pattern: #"(?i)(?:\#(escaped))[^\d$]{0,25}\$?\s*([\d,]{3,9})"#) {
                return number(value)
            }
        }
        return nil
    }

    private static func firstStandalonePrice(in text: String) -> Double? {
        firstCapture(in: text, pattern: #"\$\s*([\d,]{5,9})\b"#).flatMap(number)
    }

    private static func firstNumber(in text: String, pattern: String) -> Double? {
        firstCapture(in: text, pattern: pattern).flatMap(number)
    }

    private static func number(_ text: String) -> Double? {
        Double(text.replacingOccurrences(of: ",", with: "").trimmingCharacters(in: .whitespacesAndNewlines))
    }

    private static func firstCapture(in text: String, pattern: String, group: Int = 1) -> String? {
        guard let match = firstMatch(in: text, pattern: pattern) else { return nil }
        return capture(match, in: text, group: group)
    }

    private static func firstMatch(in text: String, pattern: String) -> NSTextCheckingResult? {
        guard let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]) else { return nil }
        return regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text))
    }

    private static func capture(_ match: NSTextCheckingResult, in text: String, group: Int) -> String? {
        guard match.numberOfRanges > group,
              let range = Range(match.range(at: group), in: text) else { return nil }
        return String(text[range]).trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
