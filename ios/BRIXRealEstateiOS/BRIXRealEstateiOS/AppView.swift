import AuthenticationServices
import SwiftUI

struct AppView: View {
    @Environment(BRIXAppState.self) private var appState
    @State private var didStartRestore = false

    var body: some View {
        @Bindable var appState = appState

        Group {
            if appState.didRestoreSession == false {
                NativeLaunchView()
            } else if appState.authState.isSignedIn == false {
                AuthGateView()
            } else {
                TabView(selection: $appState.selectedTab) {
                    ForEach(AppTab.allCases) { tab in
                        NavigationStack {
                            content(for: tab)
                                .navigationTitle(tab.rawValue)
                                .toolbarTitleDisplayMode(.inline)
                        }
                        .tabItem {
                            Label(tab.rawValue, systemImage: tab.symbol)
                        }
                        .tag(tab)
                    }
                }
                .tint(Color.brixBlue)
            }
        }
        .task {
            if didStartRestore == false {
                didStartRestore = true
                await appState.restore()
            }
        }
    }

    @ViewBuilder
    private func content(for tab: AppTab) -> some View {
        switch tab {
        case .dashboard:
            TodayDecisionView()
        case .find:
            FindIQView()
        case .deal:
            DealIQCockpitView()
        case .pipeline:
            PipelineIQView()
        case .offer:
            OfferIQView()
        case .field:
            FieldInvestorView()
        case .portfolio:
            PortfolioOSView()
        case .account:
            AccountView()
        }
    }
}

private struct NativeLaunchView: View {
    var body: some View {
        ZStack {
            Color.brixSurface.ignoresSafeArea()
            VStack(spacing: 14) {
                Image(systemName: "square.grid.3x3.fill")
                    .font(.system(size: 44, weight: .bold))
                    .foregroundStyle(Color.brixBlue)
                Text("BRIX Real Estate")
                    .font(.title2.weight(.black))
                ProgressView("Preparing BRIX")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

private struct AuthGateView: View {
    @Environment(BRIXAppState.self) private var appState
    @State private var email = ""
    @State private var password = ""
    @State private var isCreatingAccount = false
    @State private var isAppleWorking = false
    @State private var authMessage: String?
    private let apiClient = BRIXAPIClient()

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                VStack(spacing: 10) {
                    Image(systemName: "square.grid.3x3.fill")
                        .font(.system(size: 38, weight: .bold))
                        .foregroundStyle(Color.brixBlue)
                    Text("BRIX Real Estate")
                        .font(.largeTitle.weight(.black))
                    Text("Run deals, capture field notes, and keep your acquisition work with you.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(.top, 22)

                BrixCard {
                    VStack(alignment: .leading, spacing: 14) {
                        Text("Sign in")
                            .font(.title3.weight(.bold))
                        Text("Use your BRIX account to continue.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)

                        TextField("Email", text: $email)
                            .textContentType(.username)
                            .keyboardType(.emailAddress)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .textFieldStyle(.roundedBorder)

                        SecureField("Password", text: $password)
                            .textContentType(.password)
                            .textFieldStyle(.roundedBorder)

                        Button {
                            Task { await signIn() }
                        } label: {
                            Text(appState.isLoading ? "Signing in..." : "Sign In")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(appState.isLoading || email.isEmpty || password.isEmpty)

                        Button {
                            Task { await createAccount() }
                        } label: {
                            Text(isCreatingAccount ? "Creating..." : "Create Account")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                        .disabled(isCreatingAccount || appState.isLoading || email.isEmpty || password.count < 6)

                        Button {
                            Task { await sendPasswordReset() }
                        } label: {
                            Text("Send password reset")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.plain)
                        .disabled(email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

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
                        .disabled(isAppleWorking)

                        if let notice = appState.lastNotice {
                            AuthNoticeCard(message: notice, systemImage: "checkmark.seal.fill", color: .green)
                        }

                        if let authMessage {
                            Text(authMessage)
                                .font(.footnote.weight(.medium))
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                if let error = appState.lastError {
                    ErrorCard(message: error)
                }
            }
            .padding()
        }
        .brixScreenBackground()
    }

    private func signIn() async {
        authMessage = nil
        _ = await appState.signInWithEmail(email: email, password: password)
        password = ""
    }

    private func createAccount() async {
        isCreatingAccount = true
        authMessage = nil
        defer { isCreatingAccount = false }
        _ = await appState.createAccountWithEmail(email: email, password: password)
        password = ""
    }

    private func sendPasswordReset() async {
        authMessage = "Sending password reset..."
        do {
            try await apiClient.sendPasswordReset(email: email)
            authMessage = "Password reset sent. Check your email, then return to sign in."
        } catch {
            authMessage = brixAuthMessage(error)
        }
    }

    private func handleAppleSignIn(_ result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let authorization):
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                  let identityToken = credential.identityToken else {
                appState.lastError = "Apple did not return an identity token."
                return
            }

            isAppleWorking = true
            Task {
                defer { isAppleWorking = false }
                do {
                    let session = try await apiClient.signInWithApple(identityToken: identityToken)
                    await appState.signIn(with: session)
                } catch {
                    appState.lastError = brixAuthMessage(error)
                }
            }
        case .failure(let error):
            appState.lastError = brixAuthMessage(error)
        }
    }
}

private struct AuthNoticeCard: View {
    let message: String
    let systemImage: String
    let color: Color

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: systemImage)
                .foregroundStyle(color)
            Text(message)
                .font(.footnote.weight(.medium))
                .foregroundStyle(.primary)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .padding(12)
        .background(color.opacity(0.12), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .stroke(color.opacity(0.25), lineWidth: 1)
        )
    }
}

#Preview {
    AppView()
        .environment(BRIXAppState())
}
