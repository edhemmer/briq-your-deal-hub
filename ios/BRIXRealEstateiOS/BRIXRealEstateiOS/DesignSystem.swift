import SwiftUI

enum Brix {
    static let blue = Color(red: 0.23, green: 0.51, blue: 0.97)
    static let cyan = Color(red: 0.11, green: 0.79, blue: 0.72)
    static let green = Color(red: 0.09, green: 0.85, blue: 0.52)
    static let amber = Color(red: 0.96, green: 0.68, blue: 0.19)
    static let red = Color(red: 0.94, green: 0.33, blue: 0.33)
    static let ink = Color(red: 0.03, green: 0.05, blue: 0.09)
    static let panel = Color(red: 0.06, green: 0.10, blue: 0.17)
    static let line = Color(red: 0.13, green: 0.20, blue: 0.31)
    static let muted = Color(red: 0.58, green: 0.67, blue: 0.78)
}

struct BrixCard<Content: View>: View {
    let content: Content
    init(@ViewBuilder content: () -> Content) { self.content = content() }
    var body: some View {
        content
            .padding(18)
            .background(
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .fill(Brix.panel)
                    .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).stroke(Brix.line))
            )
    }
}

struct BrixMetric: View {
    let title: String
    let value: Int
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.caption).foregroundStyle(Brix.muted)
            Text("\(value)").font(.title.bold()).foregroundStyle(value >= 70 ? Brix.green : Brix.amber)
            ProgressView(value: Double(value), total: 100).tint(Brix.blue)
        }
    }
}

extension View {
    func brixScreen() -> some View {
        self
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Brix.ink.ignoresSafeArea())
            .foregroundStyle(.white)
    }
}
