import SwiftUI

@main
struct BRIXRealEstateiOSApp: App {
    @StateObject private var state = AppState()
    var body: some Scene {
        WindowGroup {
            AppView()
                .environmentObject(state)
                .onOpenURL { url in
                    state.handleIncomingURL(url)
                }
        }
    }
}
