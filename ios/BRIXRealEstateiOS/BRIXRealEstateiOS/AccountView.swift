import AuthenticationServices
import SwiftUI

struct AccountView: View {
    @Environment(BRIXAppState.self) private var appState
    @State private var isShowingDeleteConfirmation = false
    @State private var deletionReason = ""
    @State private var deletionStatus: String?
    private let apiClient = BRIXAPIClient()

    var body: some View {
        @Bindable var appState = appState

        ScrollView {
            VStack(spacing: 16) {
                BrixCard {
                    VStack(alignment: .leading, spacing: 14) {
                        SectionHeader(title: "Account", subtitle: "Authentication, privacy, and data controls.", symbol: "person.crop.circle")

                        if appState.authState.isSignedIn {
                            VStack(alignment: .leading, spacing: 6) {
                                Text("Signed in")
                                    .font(.headline)
                                Text(appState.authState.displayEmail)
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }

                            Button(role: .destructive) {
                                appState.signOut()
                            } label: {
                                Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.bordered)
                        } else {
                            SignInWithAppleButton(.signIn) { request in
                                request.requestedScopes = [.fullName, .email]
                            } onCompletion: { result in
                                handleAppleSignIn(result)
                            }
                            .signInWithAppleButtonStyle(.black)
                            .frame(height: 48)

                            Text("You can browse the BRIX OS demo without signing in. Saved deals, sync, field uploads, and portfolio data require an account.")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                BrixCard {
                    VStack(alignment: .leading, spacing: 12) {
                        SectionHeader(title: "Privacy", subtitle: "Data collection must be visible and controllable.", symbol: "hand.raised")
                        PrivacyDisclosureRow(title: "Photos and videos", detail: "Used to attach evidence to a Property Digital Twin and generate preliminary visual findings.")
                        PrivacyDisclosureRow(title: "Location", detail: "Optional. Used to tag field captures to a property visit when you allow access.")
                        PrivacyDisclosureRow(title: "Microphone", detail: "Optional. Used only when you record a property voice note.")
                        PrivacyDisclosureRow(title: "Documents", detail: "Used for OCR and extraction from inspections, bids, leases, and closing files.")

                        Link(destination: URL(string: "https://brix.realestate/privacy")!) {
                            Label("Open Privacy Policy", systemImage: "safari")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                    }
                }

                BrixCard {
                    VStack(alignment: .leading, spacing: 12) {
                        SectionHeader(title: "Delete Account", subtitle: "Users must be able to initiate deletion in app.", symbol: "trash")
                        Text("Deletion removes your BRIX account and associated personal data, except information BRIX is legally required to retain. If subscriptions are added later, this screen must also link to Apple subscription management.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)

                        TextField("Optional reason", text: $deletionReason, axis: .vertical)
                            .textFieldStyle(.roundedBorder)

                        Button(role: .destructive) {
                            isShowingDeleteConfirmation = true
                        } label: {
                            Label("Request Account Deletion", systemImage: "trash.fill")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(!appState.authState.isSignedIn)

                        if let deletionStatus {
                            Text(deletionStatus)
                                .font(.footnote.weight(.medium))
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .padding()
        }
        .background(Color.brixSurface)
        .confirmationDialog("Delete BRIX account?", isPresented: $isShowingDeleteConfirmation, titleVisibility: .visible) {
            Button("Delete Account", role: .destructive) {
                Task { await requestDeletion() }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This starts deletion of the full account record and associated personal data. This is not temporary deactivation.")
        }
    }

    private func handleAppleSignIn(_ result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let authorization):
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential else { return }
            appState.signInWithApple(userID: credential.user, email: credential.email)
        case .failure(let error):
            deletionStatus = "Sign in failed: \(error.localizedDescription)"
        }
    }

    private func requestDeletion() async {
        do {
            try await apiClient.requestAccountDeletion(reason: deletionReason.isEmpty ? nil : deletionReason)
            appState.signOut()
            deletionStatus = "Deletion request submitted. BRIX will confirm when deletion is complete."
        } catch {
            deletionStatus = "Could not submit deletion request. Try again or contact support."
        }
    }
}

private struct PrivacyDisclosureRow: View {
    let title: String
    let detail: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.subheadline.weight(.semibold))
            Text(detail)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 8))
    }
}

#Preview {
    AccountView()
        .environment(BRIXAppState())
}
