import SwiftUI
import UIKit

extension Color {
    static let brixBlue = Color(red: 0.20, green: 0.47, blue: 0.92)
    static let brixMint = Color(red: 0.00, green: 0.78, blue: 0.68)
    static let brixGold = Color(red: 1.00, green: 0.68, blue: 0.18)
    static let brixViolet = Color(red: 0.45, green: 0.36, blue: 0.95)
    static let brixSurface = Color(uiColor: UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 0.025, green: 0.045, blue: 0.085, alpha: 1.0)
            : UIColor(red: 0.94, green: 0.965, blue: 0.985, alpha: 1.0)
    })
    static let brixInk = Color.primary
}

struct ScorePill: View {
    @Environment(\.colorScheme) private var colorScheme
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
        .padding(13)
        .background(scoreBackground, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(severity.color.opacity(colorScheme == .dark ? 0.32 : 0.22), lineWidth: 1)
        }
    }

    private var scoreBackground: LinearGradient {
        LinearGradient(
            colors: [
                severity.color.opacity(colorScheme == .dark ? 0.18 : 0.12),
                Color.brixBlue.opacity(colorScheme == .dark ? 0.10 : 0.06),
                Color(uiColor: .systemBackground).opacity(colorScheme == .dark ? 0.18 : 0.72)
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
}

struct BrixCard<Content: View>: View {
    @Environment(\.colorScheme) private var colorScheme
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        content
            .padding(17)
            .background(cardFill, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(cardStroke, lineWidth: 1)
            }
            .shadow(color: Color.brixBlue.opacity(colorScheme == .dark ? 0.13 : 0.08), radius: 18, x: 0, y: 10)
    }

    private var cardFill: LinearGradient {
        LinearGradient(
            colors: colorScheme == .dark
                ? [
                    Color(red: 0.055, green: 0.085, blue: 0.145),
                    Color(red: 0.035, green: 0.055, blue: 0.105),
                    Color.brixBlue.opacity(0.08)
                ]
                : [
                    Color.white,
                    Color(red: 0.965, green: 0.985, blue: 1.0),
                    Color.brixMint.opacity(0.06)
                ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    private var cardStroke: Color {
        colorScheme == .dark ? Color.white.opacity(0.10) : Color.brixBlue.opacity(0.13)
    }
}

struct BrixScreenBackground: View {
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        ZStack {
            Color.brixSurface
            LinearGradient(
                colors: colorScheme == .dark
                    ? [Color.brixBlue.opacity(0.18), Color.clear, Color.brixMint.opacity(0.08)]
                    : [Color.brixBlue.opacity(0.10), Color.white.opacity(0.45), Color.brixMint.opacity(0.10)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            RadialGradient(
                colors: [Color.brixViolet.opacity(colorScheme == .dark ? 0.14 : 0.08), Color.clear],
                center: .topTrailing,
                startRadius: 20,
                endRadius: 420
            )
        }
        .ignoresSafeArea()
    }
}

extension View {
    func brixScreenBackground() -> some View {
        background(BrixScreenBackground())
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
            ZStack {
                RoundedRectangle(cornerRadius: 13, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [Color.brixBlue.opacity(0.95), Color.brixMint.opacity(0.85)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .shadow(color: Color.brixBlue.opacity(0.25), radius: 12, x: 0, y: 6)
                Image(systemName: symbol)
                    .font(.headline.weight(.bold))
                    .foregroundStyle(.white)
            }
            .frame(width: 38, height: 38)
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
    @State private var pulse = false

    var body: some View {
        VStack(spacing: 16) {
            ZStack {
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [Color.brixBlue.opacity(0.18), Color.cyan.opacity(0.10)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 82, height: 82)
                    .scaleEffect(pulse ? 1.06 : 0.96)
                    .opacity(pulse ? 1 : 0.82)
                Image(systemName: symbol)
                    .font(.system(size: 34, weight: .semibold))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [Color.brixBlue, Color.brixMint],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            }
            Text(title)
                .font(.title3.weight(.black))
                .foregroundStyle(Color.brixInk)
                .multilineTextAlignment(.center)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .lineSpacing(3)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 34)
        .padding(.horizontal, 18)
        .onAppear {
            withAnimation(.easeInOut(duration: 1.8).repeatForever(autoreverses: true)) {
                pulse = true
            }
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
                Text("BRIX does not track users across apps or websites.")
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
                    Text("Needs attention")
                        .font(.subheadline.weight(.bold))
                    Text(message)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }
}
