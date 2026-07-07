import PhotosUI
import SwiftUI
import UIKit

struct FieldInvestorView: View {
    @Environment(BRIXAppState.self) private var appState
    @State private var selectedCapture = "Photo"
    @State private var note = ""
    @State private var photoPickerItem: PhotosPickerItem?
    @State private var isCameraPresented = false

    private let captureTypes = ["Photo", "Document", "Voice Note", "General Note"]
    private var cameraAvailable: Bool {
        UIImagePickerController.isSourceTypeAvailable(.camera)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if appState.authState.isSignedIn == false {
                    SignInRequiredCard(
                        title: "Field capture sync requires sign-in",
                        message: "Photos, documents, and notes attach to your BRIX deal files and upload to the backend when available."
                    )
                } else {
                    BrixCard {
                        VStack(alignment: .leading, spacing: 14) {
                            SectionHeader(title: "Field Capture", subtitle: "Capture evidence from the property and attach it to the selected deal.", symbol: "camera.viewfinder")

                            if let deal = appState.selectedDeal {
                                Text("Selected: \(deal.title)")
                                    .font(.subheadline.weight(.semibold))
                            } else {
                                Text("Select a deal in FindIQ before uploading field evidence.")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }

                            Picker("Capture type", selection: $selectedCapture) {
                                ForEach(captureTypes, id: \.self) { type in
                                    Text(type).tag(type)
                                }
                            }
                            .pickerStyle(.segmented)

                            TextField("Optional note for this capture", text: $note, axis: .vertical)
                                .textFieldStyle(.roundedBorder)

                            HStack {
                                Button {
                                    isCameraPresented = true
                                } label: {
                                    Label("Use Camera", systemImage: "camera")
                                        .frame(maxWidth: .infinity)
                                }
                                .buttonStyle(.borderedProminent)
                                .disabled(appState.selectedDeal == nil || cameraAvailable == false)

                                PhotosPicker(selection: $photoPickerItem, matching: .images) {
                                    Label("Upload Photo", systemImage: "photo")
                                        .frame(maxWidth: .infinity)
                                }
                                .buttonStyle(.bordered)
                                .disabled(appState.selectedDeal == nil)
                            }

                            Button {
                                Task {
                                    await appState.uploadFieldCapture(imageData: nil, captureType: selectedCapture, note: note.isEmpty ? nil : note)
                                    note = ""
                                }
                            } label: {
                                Label("Save Note", systemImage: "square.and.arrow.up")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.bordered)
                            .disabled(appState.selectedDeal == nil || note.isEmpty)
                        }
                    }

                    BrixCard {
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeader(title: "Upload Queue", subtitle: "Captures sync to BRIX and remain visible if an upload needs retry.", symbol: "icloud.and.arrow.up")
                            if appState.queuedOfflineActions.isEmpty {
                                Text("No queued captures.")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            } else {
                                ForEach(appState.queuedOfflineActions) { action in
                                    HStack {
                                        VStack(alignment: .leading, spacing: 3) {
                                            Text(action.title).font(.subheadline.weight(.semibold))
                                            Text(action.detail).font(.caption).foregroundStyle(.secondary)
                                        }
                                        Spacer()
                                        SeverityBadge(text: action.uploadState.rawValue, severity: action.uploadState == .uploaded ? .positive : action.uploadState == .failed ? .risk : .caution)
                                    }
                                    .padding(12)
                                    .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 8))
                                }
                            }
                        }
                    }

                    BrixCard {
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeader(title: "Visual Findings", subtitle: "Photo observations returned by BRIX. Verify before relying on them.", symbol: "wrench.and.screwdriver")
                            if appState.fieldCaptureAnalyses.flatMap(\.aiFindings).isEmpty {
                                Text("No visual findings yet. Upload a property photo to attach it to the deal and run visual review when AI is configured.")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            } else {
                                ForEach(appState.fieldCaptureAnalyses) { analysis in
                                    ForEach(Array(analysis.aiFindings.enumerated()), id: \.offset) { _, finding in
                                        VisualFindingRow(analysis: analysis, finding: finding)
                                    }
                                }
                            }
                        }
                    }
                }

                if let error = appState.lastError {
                    ErrorCard(message: error)
                }
            }
            .padding()
        }
        .background(Color.brixSurface)
        .sheet(isPresented: $isCameraPresented) {
            CameraCaptureSheet { imageData in
                Task {
                    await appState.uploadFieldCapture(imageData: imageData, captureType: selectedCapture, note: note.isEmpty ? nil : note)
                    note = ""
                }
            }
        }
        .onChange(of: photoPickerItem) { _, newItem in
            guard let newItem else { return }
            Task {
                if let data = try? await newItem.loadTransferable(type: Data.self) {
                    await appState.uploadFieldCapture(imageData: data, captureType: selectedCapture, note: note.isEmpty ? nil : note)
                    note = ""
                }
                photoPickerItem = nil
            }
        }
    }
}

private struct VisualFindingRow: View {
    let analysis: FieldCaptureAnalysis
    let finding: CaptureFinding

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .top) {
                Text(finding.area ?? "Photo")
                    .font(.subheadline.weight(.bold))
                Spacer()
                SeverityBadge(text: displaySeverity, severity: severity)
            }
            Text(finding.finding ?? "Visible condition requires verification.")
                .font(.subheadline)
            if let evidence = finding.evidence, evidence.isEmpty == false {
                Text("Evidence: \(evidence)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            if let limitation = finding.limitation, limitation.isEmpty == false {
                Text("Limit: \(limitation)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Text(finding.recommendedAction ?? analysis.verificationRecommendation ?? "Verify during due diligence before relying on this observation.")
                .font(.caption)
                .foregroundStyle(.secondary)
            if let confidence = finding.confidence ?? analysis.confidenceScore {
                Text("Confidence \(confidence)%")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.secondary)
            }
        }
        .padding(12)
        .background(.background, in: RoundedRectangle(cornerRadius: 8))
        .overlay {
            RoundedRectangle(cornerRadius: 8).stroke(.quaternary)
        }
    }

    private var displaySeverity: String {
        (finding.severity ?? analysis.severity ?? "informational")
            .replacingOccurrences(of: "_", with: " ")
            .capitalized
    }

    private var severity: Severity {
        switch (finding.severity ?? analysis.severity ?? "").lowercased() {
        case "critical":
            return .risk
        case "important":
            return .caution
        default:
            return .info
        }
    }
}

private struct CameraCaptureSheet: UIViewControllerRepresentable {
    let onImageData: (Data) -> Void
    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.delegate = context.coordinator
        picker.allowsEditing = false
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(onImageData: onImageData, dismiss: dismiss)
    }

    final class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let onImageData: (Data) -> Void
        let dismiss: DismissAction

        init(onImageData: @escaping (Data) -> Void, dismiss: DismissAction) {
            self.onImageData = onImageData
            self.dismiss = dismiss
        }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            if let image = info[.originalImage] as? UIImage,
               let data = image.jpegData(compressionQuality: 0.84) {
                onImageData(data)
            }
            dismiss()
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            dismiss()
        }
    }
}

#Preview {
    FieldInvestorView()
        .environment(BRIXAppState())
}
