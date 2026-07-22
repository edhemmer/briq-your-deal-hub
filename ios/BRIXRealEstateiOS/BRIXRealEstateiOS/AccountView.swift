import SwiftUI

struct AccountView: View {
    @EnvironmentObject private var state: AppState
    @State private var password = ""
    @State private var isWorking = false
    private let privacyURL = URL(string: "https://brixrealestate.app/privacy")!
    private let termsURL = URL(string: "https://brixrealestate.app/terms")!
    private let supportURL = URL(string: "https://brixrealestate.app/support")!

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    BrixCard {
                        VStack(alignment: .leading, spacing: 14) {
                            Text("Account").font(.largeTitle.bold())
                            authStateView
                            VStack(alignment: .leading, spacing: 6) {
                                Text("Email").font(.caption).foregroundStyle(Brix.muted)
                                TextField("", text: $state.email)
                                    .textInputAutocapitalization(.never)
                                    .textContentType(.username)
                                    .keyboardType(.emailAddress)
                                    .autocorrectionDisabled()
                                    .textFieldStyle(.roundedBorder)
                            }
                            VStack(alignment: .leading, spacing: 6) {
                                Text("Password").font(.caption).foregroundStyle(Brix.muted)
                                SecureField("", text: $password)
                                    .textContentType(.password)
                                    .textFieldStyle(.roundedBorder)
                            }
                            Button("Sign in") {
                                Task {
                                    await run {
                                        let session = try await BRIXService.signIn(email: state.email, password: password)
                                        state.completeAuthentication(session: session, message: "Signed in.")
                                    }
                                }
                            }
                                .buttonStyle(.borderedProminent)
                                .tint(Brix.blue)
                                .disabled(isWorking || !canSubmitCredentials)
                            Button("Create account") {
                                Task {
                                    await run {
                                        let session = try await BRIXService.signUp(email: state.email, password: password)
                                        state.completeAuthentication(session: session, message: session.accessToken.isEmpty ? "Account created. Check email if confirmation is required." : "Account created.")
                                    }
                                }
                            }
                                .disabled(isWorking || !canSubmitCredentials)
                            Button("Reset password") { Task { await run { try await BRIXService.resetPassword(email: state.email); state.authMessage = "Password reset email sent." } } }
                                .disabled(isWorking || state.email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                            Button("Sign out") {
                                state.signOut()
                                password = ""
                            }
                            .disabled(state.accessToken.isEmpty)
                            Button(role: .destructive) {
                                Task {
                                    guard !state.accessToken.isEmpty else {
                                        state.authMessage = "Sign in before requesting account deletion."
                                        return
                                    }
                                    await run { try await BRIXService.requestAccountDeletion(accessToken: state.accessToken); state.authMessage = "Account deletion request recorded." }
                                }
                            } label: { Text("Request account deletion") }
                            if !state.authMessage.isEmpty { Text(state.authMessage).foregroundStyle(Brix.muted) }
                        }
                    }
                    BrixCard {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Privacy and support").font(.title3.bold())
                            Text("BRIX uses your account and property content to operate your deal files. It does not use app tracking.")
                                .foregroundStyle(Brix.muted)
                            Link("Privacy Policy", destination: privacyURL)
                            Link("Terms of Use", destination: termsURL)
                            Link("Support", destination: supportURL)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Account")
            .brixScreen()
        }
    }

    private var canSubmitCredentials: Bool {
        !state.email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !password.isEmpty
    }

    @ViewBuilder
    private var authStateView: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: iconName)
                .foregroundStyle(state.authStatus == .ready ? Brix.green : Brix.blue)
            VStack(alignment: .leading, spacing: 4) {
                Text(statusTitle).font(.headline)
                Text(state.authStatus.userMessage).font(.caption).foregroundStyle(Brix.muted)
                if state.authStatus == .bootstrapFailed || state.authStatus == .offlineRecoverable {
                    Button("Retry") { state.retrySessionRestore() }
                        .buttonStyle(.bordered)
                }
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Brix.panel.opacity(0.72))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .accessibilityElement(children: .combine)
    }

    private var iconName: String {
        switch state.authStatus {
        case .ready: return "checkmark.seal.fill"
        case .expired, .revokedUser, .revokedWorkspace: return "exclamationmark.triangle.fill"
        case .restoring, .refreshing, .retrying: return "arrow.triangle.2.circlepath"
        default: return "lock.shield"
        }
    }

    private var statusTitle: String {
        switch state.authStatus {
        case .ready: return "Secure access active"
        case .recoveryValidating: return "Password reset"
        case .invitationValidating: return "Workspace invitation"
        case .expired: return "Sign in required"
        case .revokedUser, .revokedWorkspace: return "Access changed"
        case .offlineRecoverable, .offlineUnavailable: return "Connection needed"
        default: return "Secure account access"
        }
    }

    private func run(_ action: () async throws -> Void) async {
        isWorking = true
        defer { isWorking = false }
        do {
            try await action()
        } catch {
            state.authMessage = "Account request failed. Check email, password, and network access."
        }
    }
}
