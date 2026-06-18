import Foundation

@MainActor
@Observable
final class BRIXAppState {
    var selectedTab: AppTab = .today
    var authState: AuthState = .signedOut
    var queuedOfflineActions: [OfflineAction] = [
        OfflineAction(title: "Kitchen photo batch", detail: "12 images queued for upload"),
        OfflineAction(title: "Voice note", detail: "Master bath needs full remodel")
    ]
    var investorLevel: InvestorLevel = .firstDeal

    func signInWithApple(userID: String, email: String?) {
        authState = .signedIn(userID: userID, email: email)
    }

    func signOut() {
        authState = .signedOut
    }
}

enum AuthState: Equatable {
    case signedOut
    case signedIn(userID: String, email: String?)

    var isSignedIn: Bool {
        if case .signedIn = self { return true }
        return false
    }

    var displayEmail: String {
        switch self {
        case .signedOut:
            return "Not signed in"
        case .signedIn(_, let email):
            return email ?? "Private relay email"
        }
    }
}

enum InvestorLevel: String, CaseIterable, Identifiable {
    case explorer = "Explorer"
    case firstDeal = "First Deal"
    case active = "Active"
    case operatorLevel = "Operator"

    var id: String { rawValue }

    var mentorMessage: String {
        switch self {
        case .explorer:
            return "BRIX defines terms, explains calculations, and surfaces common mistakes."
        case .firstDeal:
            return "BRIX walks you through verification, financing, due diligence, and first-deal risk."
        case .active:
            return "BRIX emphasizes tradeoffs, strategy fit, and portfolio impact."
        case .operatorLevel:
            return "BRIX focuses on execution variance, capital allocation, and optimization."
        }
    }
}

struct OfflineAction: Identifiable {
    let id = UUID()
    let title: String
    let detail: String
}

enum AppTab: String, CaseIterable, Identifiable {
    case today = "Today"
    case field = "Field"
    case twin = "Twin"
    case strategy = "Strategy"
    case project = "Project"
    case portfolio = "Portfolio"
    case account = "Account"

    var id: String { rawValue }

    var symbol: String {
        switch self {
        case .today: return "target"
        case .field: return "camera.viewfinder"
        case .twin: return "house.and.flag"
        case .strategy: return "rectangle.3.group"
        case .project: return "checklist"
        case .portfolio: return "chart.pie"
        case .account: return "person.crop.circle"
        }
    }
}
