import AuthenticationServices
import SwiftUI

struct AccountView: View {
    @Environment(BRIXAppState.self) private var appState
    @State private var isShowingDeleteConfirmation = false
    @State private var deletionReason = ""
    @State private var deletionStatus: String?
    @State private var authStatus: String?
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
                                Task { await appState.signOut() }
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

                            Text("Sign in is required for saved deals, sync, field uploads, portfolio data, and account deletion controls.")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }

                        if let authStatus {
                            Text(authStatus)
                                .font(.footnote.weight(.medium))
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

                        Link(destination: BRIXAppConfig.privacyPolicyURL) {
                            Label("Open Privacy Policy", systemImage: "safari")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                    }
                }

                BrixCard {
                    VStack(alignment: .leading, spacing: 12) {
                        SectionHeader(title: "Delete Account", subtitle: "Permanently remove your BRIX account and personal data.", symbol: "trash")
                        Text("Deletion removes your BRIX account and associated personal data, except information BRIX is legally required to retain. This is not temporary deactivation. Active Apple subscriptions, if any, must be managed through your Apple account.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)

                        TextField("Optional reason", text: $deletionReason, axis: .vertical)
                            .textFieldStyle(.roundedBorder)

                        Button(role: .destructive) {
                            isShowingDeleteConfirmation = true
                        } label: {
                            Label("Permanently Delete Account", systemImage: "trash.fill")
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
            guard let identityToken = credential.identityToken else {
                authStatus = "Apple did not return an identity token."
                return
            }

            Task {
                do {
                    let session = try await apiClient.signInWithApple(identityToken: identityToken)
                    await appState.signIn(with: session)
                    authStatus = "Signed in securely with Apple."
                } catch {
                    authStatus = "Sign in failed: \(error.localizedDescription)"
                }
            }
        case .failure(let error):
            authStatus = "Sign in failed: \(error.localizedDescription)"
        }
    }

    private func requestDeletion() async {
        do {
            try await apiClient.requestAccountDeletion(reason: deletionReason.isEmpty ? nil : deletionReason, session: appState.session)
            await appState.signOut()
            deletionStatus = "Account deletion completed or is being finalized by BRIX. You have been signed out."
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
