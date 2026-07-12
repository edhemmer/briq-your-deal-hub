import SwiftUI

struct AccountView: View {
    @Environment(BRIXAppState.self) private var appState
    @State private var isShowingDeleteConfirmation = false
    @State private var deletionReason = ""
    @State private var deletionStatus: String?

    var body: some View {
        @Bindable var appState = appState

        ScrollView {
            VStack(spacing: 16) {
                BrixCard {
                    VStack(alignment: .leading, spacing: 14) {
                        SectionHeader(title: "Account", subtitle: "Sign in, privacy, and support.", symbol: "person.crop.circle")

                        if appState.authState.isSignedIn {
                            VStack(alignment: .leading, spacing: 6) {
                                Text("Signed in")
                                    .font(.headline)
                                Text(appState.authState.displayEmail)
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                                Text("\(appState.deals.count) deal file\(appState.deals.count == 1 ? "" : "s") available.")
                                    .font(.caption.weight(.semibold))
                                    .foregroundStyle(.green)
                                if let lastSyncDate = appState.lastSyncDate {
                                    Text("Last updated \(lastSyncDate.formatted(date: .abbreviated, time: .shortened))")
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
                            Text("Sign in to manage your account.")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                BrixCard {
                    VStack(alignment: .leading, spacing: 12) {
                        SectionHeader(title: "Privacy", subtitle: "Review app policies and data controls.", symbol: "hand.raised")
                        PrivacyDisclosureRow(title: "Photos and documents", detail: "Used only for the deals you add to BRIX.")
                        PrivacyDisclosureRow(title: "Location and microphone", detail: "Used only when you choose those capture tools.")

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
                        Text("Deletion is permanent. Any active Apple subscription must be managed through your Apple account.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)

                        TextField("", text: $deletionReason, axis: .vertical)
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
                        SectionHeader(title: "Support", subtitle: "Get help with account access, data, or app questions.", symbol: "questionmark.circle")
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
        .brixScreenBackground()
        .confirmationDialog("Delete BRIX account?", isPresented: $isShowingDeleteConfirmation, titleVisibility: .visible) {
            Button("Delete Account", role: .destructive) {
                Task { await requestDeletion() }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This permanently removes your BRIX account and personal data, except records BRIX is legally required to retain.")
        }
    }

    private func requestDeletion() async {
        let submitted = await appState.requestAccountDeletion(reason: deletionReason.isEmpty ? nil : deletionReason)
        if submitted {
            await appState.signOut()
            deletionStatus = "Account deletion started. You have been signed out."
        } else {
            deletionStatus = appState.lastError ?? "Could not submit deletion request. Try again or contact support."
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
