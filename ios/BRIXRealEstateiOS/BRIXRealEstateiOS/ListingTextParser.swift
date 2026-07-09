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
            strategyPrimary: strategy(in: text),
            sourceConfidence: urlParts != nil || firstAddress(in: text) != nil ? "medium" : "low"
        )
    }

    static func firstURL(in text: String) -> String? {
        let pattern = #"https?://[^\s]+"#
        return firstCapture(in: text, pattern: pattern, group: 0)
    }

    private static func parseListingURL(_ urlString: String) -> (address: String?, city: String?, state: String?, zip: String?)? {
        guard let url = URL(string: urlString),
              let range = url.path.range(of: "/homedetails/") else { return nil }

        let slug = String(url.path[range.upperBound...])
            .split(separator: "/")
            .first?
            .replacingOccurrences(of: "_zpid", with: "") ?? ""

        let cleaned = slug
            .replacingOccurrences(of: "-", with: " ")
            .replacingOccurrences(of: "_", with: " ")
            .replacingOccurrences(of: #" \d+ zpid"#, with: "", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)

        guard cleaned.isEmpty == false else { return nil }
        let tokens = cleaned.split(separator: " ").map(String.init)
        guard tokens.count >= 5 else { return (cleaned, nil, nil, nil) }

        let zip = tokens.last.flatMap { $0.range(of: #"^\d{5}$"#, options: .regularExpression) == nil ? nil : $0 }
        let state = zip == nil ? nil : tokens.dropLast().last
        let city = zip == nil ? nil : tokens.dropLast(2).last
        let addressTokens = zip == nil ? tokens : Array(tokens.dropLast(3))
        return (addressTokens.joined(separator: " "), city, state, zip)
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
