import UIKit
import UniformTypeIdentifiers

final class ShareViewController: UIViewController {
    private let statusLabel = UILabel()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor.systemBackground
        statusLabel.translatesAutoresizingMaskIntoConstraints = false
        statusLabel.numberOfLines = 0
        statusLabel.textAlignment = .center
        statusLabel.text = "Preparing BRIX intake..."
        view.addSubview(statusLabel)
        NSLayoutConstraint.activate([
            statusLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 24),
            statusLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -24),
            statusLabel.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
        Task { await prepareHandoff() }
    }

    private func prepareHandoff() async {
        do {
            let payload = try await buildPayload()
            try payload.saveForMainApp()
            statusLabel.text = "Opening BRIX..."
            openMainApp(payload)
        } catch {
            statusLabel.text = "BRIX cannot import this shared item."
            extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
        }
    }

    private func buildPayload() async throws -> ShareIntakePayload {
        guard let item = extensionContext?.inputItems.first as? NSExtensionItem,
              let providers = item.attachments,
              !providers.isEmpty else {
            throw ShareIntakeError.unsupportedContent
        }

        if let urlProvider = providers.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.url.identifier) }) {
            let url = try await loadURL(from: urlProvider)
            let text = try await loadOptionalText(from: providers)
            return try ShareIntakePayload.make(url: url, text: text, file: nil, sourceApplicationName: item.attributedContentText?.string)
        }

        if let textProvider = providers.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) }) {
            let text = try await loadText(from: textProvider)
            let detectedURL = firstURL(in: text)
            return try ShareIntakePayload.make(url: detectedURL, text: text, file: nil, sourceApplicationName: item.attributedContentText?.string)
        }

        if let imageProvider = providers.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.image.identifier) }) {
            let file = try await loadFileReference(from: imageProvider, preferredType: UTType.image.identifier)
            return try ShareIntakePayload.make(url: nil, text: nil, file: file, sourceApplicationName: item.attributedContentText?.string)
        }

        if let fileProvider = providers.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.data.identifier) || $0.hasItemConformingToTypeIdentifier("message/rfc822") }) {
            let file = try await loadFileReference(from: fileProvider, preferredType: "message/rfc822")
            return try ShareIntakePayload.make(url: nil, text: nil, file: file, sourceApplicationName: item.attributedContentText?.string)
        }

        throw ShareIntakeError.unsupportedContent
    }

    private func loadURL(from provider: NSItemProvider) async throws -> URL {
        try await withCheckedThrowingContinuation { continuation in
            provider.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) { item, error in
                if let error { continuation.resume(throwing: error); return }
                if let url = item as? URL { continuation.resume(returning: url); return }
                if let string = item as? String, let url = URL(string: string) { continuation.resume(returning: url); return }
                continuation.resume(throwing: ShareIntakeError.unsupportedContent)
            }
        }
    }

    private func loadText(from provider: NSItemProvider) async throws -> String {
        try await withCheckedThrowingContinuation { continuation in
            provider.loadItem(forTypeIdentifier: UTType.plainText.identifier, options: nil) { item, error in
                if let error { continuation.resume(throwing: error); return }
                if let text = item as? String { continuation.resume(returning: text); return }
                if let data = item as? Data, let text = String(data: data, encoding: .utf8) { continuation.resume(returning: text); return }
                continuation.resume(throwing: ShareIntakeError.unsupportedContent)
            }
        }
    }

    private func loadOptionalText(from providers: [NSItemProvider]) async throws -> String? {
        guard let provider = providers.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) }) else { return nil }
        return try await loadText(from: provider)
    }

    private func loadFileReference(from provider: NSItemProvider, preferredType: String) async throws -> ShareIntakeFileReference {
        try await withCheckedThrowingContinuation { continuation in
            provider.loadFileRepresentation(forTypeIdentifier: preferredType) { url, error in
                if let error { continuation.resume(throwing: error); return }
                guard let url else {
                    continuation.resume(throwing: ShareIntakeError.unsupportedContent)
                    return
                }
                let values = try? url.resourceValues(forKeys: [.fileSizeKey, .typeIdentifierKey])
                continuation.resume(returning: ShareIntakeFileReference(
                    localReference: url.lastPathComponent,
                    originalFilename: url.lastPathComponent,
                    declaredMimeType: values?.typeIdentifier,
                    detectedMimeType: values?.typeIdentifier,
                    byteSize: values?.fileSize,
                    contentHash: nil
                ))
            }
        }
    }

    private func firstURL(in text: String) -> URL? {
        let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue)
        let range = NSRange(location: 0, length: text.utf16.count)
        return detector?.firstMatch(in: text, options: [], range: range)?.url
    }

    private func openMainApp(_ payload: ShareIntakePayload) {
        guard let url = payload.deepLinkURL() else {
            extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
            return
        }
        extensionContext?.open(url) { [weak self] _ in
            self?.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
        }
    }
}
