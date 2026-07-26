import Foundation
import UIKit
import UniformTypeIdentifiers

enum ShareIntakeStatus: String, Codable {
    case receivedLocally = "received_locally"
    case awaitingAppOpen = "awaiting_app_open"
    case importing
    case awaitingAuthentication = "awaiting_authentication"
    case awaitingWorkspace = "awaiting_workspace"
    case awaitingReview = "awaiting_review"
    case queued
    case syncing
    case complete
    case failed
    case conflicted
    case cancelled
    case expired
}

enum ShareIntakeContentType: String, Codable {
    case url
    case text
    case file
    case image
    case emailFile = "email_file"
    case mixedUrlText = "mixed_url_text"
}

struct ShareIntakeFileReference: Codable, Equatable {
    var localReference: String
    var originalFilename: String
    var declaredMimeType: String?
    var detectedMimeType: String?
    var byteSize: Int?
    var contentHash: String?
}

struct ShareIntakePayload: Codable, Equatable {
    static let schemaVersion = 1
    static let appGroupIdentifier = "group.BrixRE.BRIX-Real-Estate"
    static let storagePrefix = "brix.sharedIntake."
    static let maxTextCharacters = 8000
    static let maxFileBytes = 5 * 1024 * 1024

    var version = schemaVersion
    var handoffId: String
    var sourcePlatform: String
    var sourceApplicationName: String?
    var sourceApplicationIdentifier: String?
    var contentType: ShareIntakeContentType
    var originalUrl: String?
    var normalizedUrl: String?
    var originalText: String?
    var file: ShareIntakeFileReference?
    var createdAt: String
    var receivedAt: String?
    var authenticatedUserId: String?
    var workspaceId: String?
    var intendedDealId: String?
    var intendedPropertyId: String?
    var idempotencyKey: String
    var payloadHash: String
    var status: ShareIntakeStatus
    var safeErrorCategory: String

    static func make(url: URL?, text: String?, file: ShareIntakeFileReference?, sourceApplicationName: String?) throws -> ShareIntakePayload {
        let trimmedText = text?.trimmingCharacters(in: .whitespacesAndNewlines)
        if let trimmedText, trimmedText.count > maxTextCharacters {
            throw ShareIntakeError.unsupportedContent
        }

        let normalized = url.flatMap { normalize(url: $0) }
        let type = try detectType(url: normalized, text: trimmedText, file: file)
        let hashBasis = "\(type.rawValue)|\(normalized ?? "")|\(trimmedText?.hashValue ?? 0)|\(file?.contentHash ?? file?.originalFilename ?? "")"
        let payloadHash = stableHash(hashBasis)
        let handoffId = "share_\(UUID().uuidString)"
        let now = ISO8601DateFormatter().string(from: Date())
        return ShareIntakePayload(
            handoffId: handoffId,
            sourcePlatform: UIDevice.current.userInterfaceIdiom == .pad ? "ipados" : "ios",
            sourceApplicationName: sourceApplicationName,
            sourceApplicationIdentifier: nil,
            contentType: type,
            originalUrl: url?.absoluteString,
            normalizedUrl: normalized,
            originalText: trimmedText?.isEmpty == false ? trimmedText : nil,
            file: file,
            createdAt: now,
            receivedAt: now,
            idempotencyKey: "share-intake:\(payloadHash)",
            payloadHash: payloadHash,
            status: .receivedLocally,
            safeErrorCategory: "none"
        )
    }

    func deepLinkURL() -> URL? {
        URL(string: "brixrealestate://share-intake/\(handoffId)")
    }

    func saveForMainApp() throws {
        guard let defaults = UserDefaults(suiteName: Self.appGroupIdentifier) else {
            throw ShareIntakeError.sharedStorageUnavailable
        }
        let data = try JSONEncoder().encode(self)
        defaults.set(data, forKey: "\(Self.storagePrefix)\(handoffId)")
    }

    private static func detectType(url: String?, text: String?, file: ShareIntakeFileReference?) throws -> ShareIntakeContentType {
        if let file {
            try validate(file: file)
            let mime = (file.detectedMimeType ?? file.declaredMimeType ?? "").lowercased()
            let ext = URL(fileURLWithPath: file.originalFilename).pathExtension.lowercased()
            if ext == "eml" || mime == "message/rfc822" { return .emailFile }
            if mime.hasPrefix("image/") { return .image }
            return .file
        }
        if let url, let text, !text.replacingOccurrences(of: url, with: "").trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return .mixedUrlText
        }
        if url != nil { return .url }
        if text?.isEmpty == false { return .text }
        throw ShareIntakeError.unsupportedContent
    }

    private static func validate(file: ShareIntakeFileReference) throws {
        if let byteSize = file.byteSize, byteSize > maxFileBytes { throw ShareIntakeError.oversized }
        let ext = URL(fileURLWithPath: file.originalFilename).pathExtension.lowercased()
        if ["exe", "js", "mjs", "cjs", "html", "htm", "svg", "zip", "rar", "7z", "mp4", "mov", "mp3", "wav", "heic", "heif", "xlsm", "docm"].contains(ext) {
            throw ShareIntakeError.unsupportedContent
        }
        let mime = (file.detectedMimeType ?? file.declaredMimeType ?? "").lowercased()
        let supported = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "message/rfc822",
            "text/plain",
            "text/csv",
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/octet-stream"
        ]
        if !mime.isEmpty && !supported.contains(mime) { throw ShareIntakeError.unsupportedContent }
    }

    private static func normalize(url: URL) -> String? {
        guard url.scheme == "https" || url.scheme == "http" else { return nil }
        var components = URLComponents(url: url, resolvingAgainstBaseURL: false)
        components?.fragment = nil
        components?.user = nil
        components?.password = nil
        return components?.url?.absoluteString
    }

    private static func stableHash(_ value: String) -> String {
        var hash: UInt32 = 2166136261
        for byte in value.utf8 {
            hash ^= UInt32(byte)
            hash = hash &* 16777619
        }
        return String(format: "%08x", hash)
    }
}

enum ShareIntakeError: Error {
    case unsupportedContent
    case oversized
    case sharedStorageUnavailable
}
