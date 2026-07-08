import AuthenticationServices
import SwiftUI

struct AppView: View {
    @Environment(BRIXAppState.self) private var appState

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
                                .toolbar {
                                    ToolbarItem(placement: .topBarTrailing) {
                                        ConnectionChip()
                                    }
                                }
                        }
                        .tabItem {
                            Label(tab.rawValue, systemImage: tab.symbol)
                        }
                        .tag(tab)
                    }
                }
                .tint(.brixBlue)
            }
        }
        .task {
            if appState.didRestoreSession == false {
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
                    .foregroundStyle(.brixBlue)
                Text("BRIX Real Estate")
                    .font(.title2.weight(.black))
                ProgressView("Connecting to BRIX Cloud")
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
                        .font(.system(size: 42, weight: .bold))
                        .foregroundStyle(.brixBlue)
                    Text("BRIX Real Estate")
                        .font(.largeTitle.weight(.black))
                    Text("Sign in to connect your iPhone or iPad to the same deal files, field photos, and acquisition work you use on the web.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(.top, 28)

                BrixCard {
                    VStack(alignment: .leading, spacing: 14) {
                        SectionHeader(title: "Connect BRIX Cloud", subtitle: "Use your BRIX account to sync deals across devices.", symbol: "lock.shield")

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
                            Label(appState.isLoading ? "Connecting..." : "Sign In", systemImage: "person.fill.checkmark")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(appState.isLoading || email.isEmpty || password.isEmpty)

                        Button {
                            Task { await createAccount() }
                        } label: {
                            Text(isCreatingAccount ? "Creating..." : "Create BRIX Account")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                        .disabled(isCreatingAccount || appState.isLoading || email.isEmpty || password.count < 6)

                        Button {
                            Task { await sendPasswordReset() }
                        } label: {
                            Text("Forgot password?")
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

                        if let authMessage {
                            Text(authMessage)
                                .font(.footnote.weight(.medium))
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                BrixCard {
                    VStack(alignment: .leading, spacing: 10) {
                        Label("Live backend", systemImage: "checkmark.seal.fill")
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(.green)
                        Text("BRIX saves real deal files to Supabase, restores your session from Keychain, and keeps mobile work available on the web.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }

                if let error = appState.lastError {
                    ErrorCard(message: error)
                }
            }
            .padding()
        }
        .background(Color.brixSurface)
    }

    private func signIn() async {
        _ = await appState.signInWithEmail(email: email, password: password)
        password = ""
    }

    private func createAccount() async {
        isCreatingAccount = true
        defer { isCreatingAccount = false }
        _ = await appState.createAccountWithEmail(email: email, password: password)
        password = ""
    }

    private func sendPasswordReset() async {
        authMessage = "Sending password reset..."
        do {
            try await apiClient.sendPasswordReset(email: email)
            authMessage = "Password reset sent. Check your email and continue through the secure BRIX reset page."
        } catch {
            authMessage = "Password reset failed: \(error.localizedDescription)"
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
                    appState.lastError = error.localizedDescription
                }
            }
        case .failure(let error):
            appState.lastError = error.localizedDescription
        }
    }
}

private struct ConnectionChip: View {
    @Environment(BRIXAppState.self) private var appState

    var body: some View {
        HStack(spacing: 5) {
            Circle()
                .fill(appState.lastError == nil ? Color.green : Color.orange)
                .frame(width: 7, height: 7)
            Text(appState.lastError == nil ? "Live" : "Check")
                .font(.caption.weight(.semibold))
        }
        .padding(.horizontal, 9)
        .padding(.vertical, 5)
        .background(.thinMaterial, in: Capsule())
        .accessibilityLabel(appState.lastError == nil ? "BRIX Cloud connected" : "BRIX Cloud connection needs attention")
    }
}

#Preview {
    AppView()
        .environment(BRIXAppState())
}
