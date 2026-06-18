import SwiftUI

@main
struct BRIXRealEstateiOSApp: App {
    @State private var appState = BRIXAppState()

    var body: some Scene {
        WindowGroup {
            AppView()
                .environment(appState)
        }
    }
}
