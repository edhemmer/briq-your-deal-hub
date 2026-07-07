import SwiftUI
import UIKit

extension Color {
    static let brixBlue = Color(red: 0.20, green: 0.47, blue: 0.92)
    static let brixSurface = Color(uiColor: UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 0.03, green: 0.06, blue: 0.11, alpha: 1.0)
            : UIColor(red: 0.96, green: 0.97, blue: 0.98, alpha: 1.0)
    })
    static let brixInk = Color.primary
}

struct ScorePill: View {
    let label: String
    let value: String
    let severity: Severity

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.headline.weight(.black))
                .foregroundStyle(severity.color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(.background, in: RoundedRectangle(cornerRadius: 8))
        .overlay {
            RoundedRectangle(cornerRadius: 8)
                .stroke(.quaternary)
        }
    }
}

struct BrixCard<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        content
            .padding(16)
            .background(.background, in: RoundedRectangle(cornerRadius: 8))
            .overlay {
                RoundedRectangle(cornerRadius: 8)
                    .stroke(.quaternary)
            }
    }
}

struct SectionHeader: View {
    let title: String
    let subtitle: String
    let symbol: String

    var body: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline.weight(.bold))
                    .foregroundStyle(Color.brixInk)
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Image(systemName: symbol)
                .font(.headline)
                .foregroundStyle(.brixBlue)
                .frame(width: 34, height: 34)
                .background(.blue.opacity(0.10), in: RoundedRectangle(cornerRadius: 8))
        }
    }
}

struct SeverityBadge: View {
    let text: String
    let severity: Severity

    var body: some View {
        Text(text)
            .font(.caption.weight(.semibold))
            .padding(.horizontal, 8)
            .padding(.vertical, 5)
            .foregroundStyle(severity.color)
            .background(severity.color.opacity(0.12), in: RoundedRectangle(cornerRadius: 6))
    }
}

struct EmptyOperatingState: View {
    let title: String
    let message: String
    let symbol: String

    var body: some View {
        BrixCard {
            VStack(spacing: 12) {
                Image(systemName: symbol)
                    .font(.title2)
                    .foregroundStyle(.brixBlue)
                    .frame(width: 44, height: 44)
                    .background(.blue.opacity(0.10), in: RoundedRectangle(cornerRadius: 10))
                Text(title)
                    .font(.headline.weight(.bold))
                    .foregroundStyle(Color.brixInk)
                Text(message)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
        }
    }
}

struct SignInRequiredCard: View {
    let title: String
    let message: String

    var body: some View {
        BrixCard {
            VStack(alignment: .leading, spacing: 12) {
                SectionHeader(title: title, subtitle: "Apple-compliant account access.", symbol: "lock.shield")
                Text(message)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text("Sign in from the BRIX launch screen to sync this device with BRIX Cloud. BRIX does not track users across apps or websites.")
                    .font(.footnote.weight(.medium))
                    .foregroundStyle(.secondary)
            }
        }
    }
}

struct ErrorCard: View {
    let message: String

    var body: some View {
        BrixCard {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundStyle(.orange)
                VStack(alignment: .leading, spacing: 4) {
                    Text("Connection issue")
                        .font(.subheadline.weight(.bold))
                    Text(message)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }
}
