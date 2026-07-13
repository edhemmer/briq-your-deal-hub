import SwiftUI

struct AccountView: View {
    @EnvironmentObject private var state: AppState
    @State private var password = ""
    @State private var isWorking = false
    var body: some View {
        NavigationStack {
            ScrollView {
                BrixCard {
                    VStack(alignment: .leading, spacing: 14) {
                        Text("Account").font(.largeTitle.bold())
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Email").font(.caption).foregroundStyle(Brix.muted)
                            TextField("", text: $state.email).textInputAutocapitalization(.never).keyboardType(.emailAddress).textFieldStyle(.roundedBorder)
                        }
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Password").font(.caption).foregroundStyle(Brix.muted)
                            SecureField("", text: $password).textFieldStyle(.roundedBorder)
                        }
                        Button("Sign in") { Task { await run { try await BRIXService.signIn(email: state.email, password: password); state.authMessage = "Signed in." } } }
                            .buttonStyle(.borderedProminent)
                            .tint(Brix.blue)
                            .disabled(isWorking)
                        Button("Create account") { Task { await run { try await BRIXService.signUp(email: state.email, password: password); state.authMessage = "Account created." } } }
                            .disabled(isWorking)
                        Button("Reset password") { Task { await run { try await BRIXService.resetPassword(email: state.email); state.authMessage = "Password reset email sent." } } }
                            .disabled(isWorking)
                        Button(role: .destructive) { state.authMessage = "Account deletion request captured." } label: { Text("Request account deletion") }
                        if !state.authMessage.isEmpty { Text(state.authMessage).foregroundStyle(Brix.muted) }
                    }
                }
                .padding()
            }
            .navigationTitle("Account")
            .brixScreen()
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
