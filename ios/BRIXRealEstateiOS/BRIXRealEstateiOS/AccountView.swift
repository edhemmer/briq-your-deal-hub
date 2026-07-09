import AuthenticationServices
import SwiftUI

struct AccountView: View {
    @Environment(BRIXAppState.self) private var appState
    @State private var isShowingDeleteConfirmation = false
    @State private var deletionReason = ""
    @State private var deletionStatus: String?
    @State private var authStatus: String?
    @State private var email = ""
    @State private var password = ""
    @State private var isAuthWorking = false
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
                                Text("\(appState.deals.count) deal file\(appState.deals.count == 1 ? "" : "s") synced.")
                                    .font(.caption.weight(.semibold))
                                    .foregroundStyle(.green)
                                if let lastSyncDate = appState.lastSyncDate {
                                    Text("Last sync \(lastSyncDate.formatted(date: .abbreviated, time: .shortened))")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                            }

                            Button(role: .destructive) {
                                Task { await appState.signOut() }
                            } label: {
                                Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.bordered)
                        } else {
                            VStack(alignment: .leading, spacing: 10) {
                                TextField("Email", text: $email)
                                    .textContentType(.username)
                                    .keyboardType(.emailAddress)
                                    .textInputAutocapitalization(.never)
                                    .autocorrectionDisabled()
                                    .textFieldStyle(.roundedBorder)

                                SecureField("Password", text: $password)
                                    .textContentType(.password)
                                    .textFieldStyle(.roundedBorder)

                                HStack {
                                    Button {
                                        Task { await signInWithEmail() }
                                    } label: {
                                        Label("Sign In", systemImage: "person.fill.checkmark")
                                            .frame(maxWidth: .infinity)
                                    }
                                    .buttonStyle(.borderedProminent)
                                    .disabled(isAuthWorking || email.isEmpty || password.isEmpty)

                                    Button {
                                        Task { await createEmailAccount() }
                                    } label: {
                                        Text("Create")
                                            .frame(maxWidth: .infinity)
                                    }
                                    .buttonStyle(.bordered)
                                    .disabled(isAuthWorking || email.isEmpty || password.count < 6)
                                }

                                Button {
                                    Task { await sendPasswordReset() }
                                } label: {
                                    Text("Send password reset")
                                        .frame(maxWidth: .infinity)
                                }
                                .buttonStyle(.plain)
                                .disabled(isAuthWorking || email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                            }

                            HStack {
                                Rectangle().frame(height: 1).foregroundStyle(.quaternary)
                                Text("or")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                Rectangle().frame(height: 1).foregroundStyle(.quaternary)
                            }

                            SignInWithAppleButton(.signIn) { request in
                                request.requestedScopes = [.fullName, .email]
                            } onCompletion: { result in
                                handleAppleSignIn(result)
                            }
                            .signInWithAppleButtonStyle(.black)
                            .frame(height: 48)

                            Text("Use the same BRIX account as web to sync saved deals, field uploads, portfolio data, and account deletion controls.")
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
                        SectionHeader(title: "Privacy", subtitle: "Data collection is visible, purposeful, and not used for tracking.", symbol: "hand.raised")
                        PrivacyDisclosureRow(title: "No cross-app tracking", detail: "BRIX does not track you across other companies' apps or websites and does not use advertising identifiers.")
                        PrivacyDisclosureRow(title: "Photos and videos", detail: "Used to attach evidence to a Property Digital Twin and generate preliminary visual findings.")
                        PrivacyDisclosureRow(title: "Location", detail: "Optional. Used to tag field captures to a property visit when you allow access.")
                        PrivacyDisclosureRow(title: "Microphone", detail: "Optional. Used only when you record a property voice note.")
                        PrivacyDisclosureRow(title: "Property and deal content", detail: "Used to save listing details, notes, documents, inspections, bids, leases, and due diligence records.")

                        Link(destination: BRIXAppConfig.privacyPolicyURL) {
                            Label("Open Privacy Policy", systemImage: "safari")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)

                        Link(destination: BRIXAppConfig.termsURL) {
                            Label("Open Terms of Use", systemImage: "doc.text")
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

                BrixCard {
                    VStack(alignment: .leading, spacing: 12) {
                        SectionHeader(title: "Support", subtitle: "Apple Review and users need a clear contact path.", symbol: "questionmark.circle")
                        Text("Use support for account access, deletion questions, data export requests, or production issues.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Link(destination: BRIXAppConfig.supportURL) {
                            Label("Contact BRIX Support", systemImage: "envelope")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
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

    private func signInWithEmail() async {
        isAuthWorking = true
        authStatus = "Signing in..."
        defer { isAuthWorking = false }

        do {
            let session = try await apiClient.signInWithEmail(email: email, password: password)
            await appState.signIn(with: session)
            password = ""
            authStatus = "Signed in. Your deal files are ready."
        } catch {
            authStatus = "Sign in failed: \(brixAuthMessage(error))"
        }
    }

    private func createEmailAccount() async {
        isAuthWorking = true
        authStatus = "Creating account..."
        defer { isAuthWorking = false }

        do {
            if let session = try await apiClient.signUpWithEmail(email: email, password: password) {
                await appState.signIn(with: session)
                authStatus = "Account created. Your deal files are ready."
            } else {
                authStatus = "Account created. Check your email to confirm it, then sign in."
            }
            password = ""
        } catch {
            authStatus = "Account creation failed: \(brixAuthMessage(error))"
        }
    }

    private func sendPasswordReset() async {
        isAuthWorking = true
        authStatus = "Sending password reset..."
        defer { isAuthWorking = false }

        do {
            try await apiClient.sendPasswordReset(email: email)
            authStatus = "Password reset sent. Check your email, then return to sign in."
        } catch {
            authStatus = "Password reset failed: \(brixAuthMessage(error))"
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
                    authStatus = "Sign in failed: \(brixAuthMessage(error))"
                }
            }
        case .failure(let error):
            authStatus = "Sign in failed: \(brixAuthMessage(error))"
        }
    }

    private func requestDeletion() async {
        do {
            try await apiClient.requestAccountDeletion(reason: deletionReason.isEmpty ? nil : deletionReason, session: appState.session)
            await appState.signOut()
            deletionStatus = "Account deletion was started. BRIX will remove your account and associated personal data except records legally required to retain. You have been signed out."
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
