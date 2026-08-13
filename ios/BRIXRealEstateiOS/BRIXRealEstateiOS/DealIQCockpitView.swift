import SwiftUI
import PhotosUI
import UIKit

enum DecisionCockpitNativeLayoutMode: String {
    case iphoneCompact
    case iphoneRegular
    case ipadPortrait
    case ipadLandscape
}

struct DecisionCockpitNativePresentationContract {
    let contractVersion = "decision-cockpit-presentation-contract-v1"
    let layoutMode: DecisionCockpitNativeLayoutMode
    let columnCount: Int
    let horizontalPadding: CGFloat
    let cardSpacing: CGFloat
    let priorityOrder = [
        "deal_identity",
        "deal_status",
        "captured_facts",
        "verification",
        "evidence",
    ]
    let sourceBoundary = DecisionCockpitNativeSourceBoundary()
    let supportsSafeArea = true
    let supportsDynamicType = true
    let supportsVoiceOver = true
    let supportsTouch = true
    let preservesCanonicalPriority = true

    static func build(horizontalSizeClass: UserInterfaceSizeClass?, dynamicTypeSize: DynamicTypeSize) -> DecisionCockpitNativePresentationContract {
        let isPad = UIDevice.current.userInterfaceIdiom == .pad
        let accessibilityText = dynamicTypeSize.isAccessibilitySize
        if isPad {
            let landscape = horizontalSizeClass == .regular
            return DecisionCockpitNativePresentationContract(
                layoutMode: landscape ? .ipadLandscape : .ipadPortrait,
                columnCount: landscape && !accessibilityText ? 2 : 1,
                horizontalPadding: landscape ? 28 : 22,
                cardSpacing: 16
            )
        }
        return DecisionCockpitNativePresentationContract(
            layoutMode: accessibilityText ? .iphoneCompact : .iphoneRegular,
            columnCount: 1,
            horizontalPadding: 16,
            cardSpacing: 14
        )
    }
}

struct DecisionCockpitNativeSourceBoundary {
    let projectionReadOnly = true
    let noUnderwritingCalculation = true
    let noStrategyRanking = true
    let noRecommendationCalculation = true
    let noConfidenceMath = true
    let noStaleStateCalculation = true
    let noUrgencyCalculation = true
    let noProviderCalls = true
    let noPersistence = true
}

struct DealIQCockpitView: View {
    @EnvironmentObject private var state: AppState
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var selectedPhotos: [PhotosPickerItem] = []

    var body: some View {
        NavigationStack {
            Group {
                if var deal = state.selectedDeal {
                    let presentation = DecisionCockpitNativePresentationContract.build(
                        horizontalSizeClass: horizontalSizeClass,
                        dynamicTypeSize: dynamicTypeSize
                    )
                    ScrollView {
                        VStack(alignment: .leading, spacing: presentation.cardSpacing) {
                            identityHeader(deal: deal)

                            LazyVGrid(columns: gridColumns(for: presentation), alignment: .leading, spacing: presentation.cardSpacing) {
                                BrixCard {
                                    VStack(alignment: .leading, spacing: 12) {
                                        Text("Captured facts").font(.title2.bold())
                                        money("Purchase price", value: Binding(get: { deal.listPrice }, set: { deal.listPrice = $0; state.selectedDeal = deal }))
                                        money("Annual taxes", value: Binding(get: { deal.annualTaxes }, set: { deal.annualTaxes = $0; state.selectedDeal = deal }))
                                        money("Annual insurance", value: Binding(get: { deal.annualInsurance }, set: { deal.annualInsurance = $0; state.selectedDeal = deal }))
                                        money("Monthly rent", value: Binding(get: { deal.monthlyRent }, set: { deal.monthlyRent = $0; state.selectedDeal = deal }))
                                        money("Rehab budget", value: Binding(get: { deal.rehabBudget }, set: { deal.rehabBudget = $0; state.selectedDeal = deal }))
                                    }
                                }

                                BrixCard {
                                    VStack(alignment: .leading, spacing: 12) {
                                        Text("Strategy intent").font(.title2.bold())
                                        Picker("Strategy", selection: Binding(get: { deal.strategy }, set: { deal.strategy = $0; state.selectedDeal = deal })) {
                                            ForEach(StrategyId.allCases) { item in Text(item.title).tag(item) }
                                        }
                                        .pickerStyle(.navigationLink)
                                        Text("Saved as deal intent. BRIX does not calculate a separate native ranking or recommendation.")
                                            .font(.subheadline)
                                            .foregroundStyle(Brix.muted)
                                    }
                                }

                                BrixCard {
                                    VStack(alignment: .leading, spacing: 10) {
                                        Text("Verification").font(.title2.bold())
                                        verificationLine("Address", complete: !deal.address.isEmpty)
                                        verificationLine("Purchase price", complete: deal.listPrice != nil)
                                        verificationLine("Annual taxes", complete: deal.annualTaxes != nil)
                                        verificationLine("Annual insurance", complete: deal.annualInsurance != nil)
                                        if deal.strategy != .ownerOccupant {
                                            verificationLine("Monthly rent support", complete: deal.monthlyRent != nil)
                                        }
                                    }
                                }
                            }

                            BrixCard {
                                VStack(alignment: .leading, spacing: 10) {
                                    Text("Photos").font(.title2.bold())
                                    PhotosPicker(selection: $selectedPhotos, maxSelectionCount: 20, matching: .images) {
                                        Label("Add Property Photos", systemImage: "camera.fill")
                                            .frame(maxWidth: .infinity)
                                    }
                                    .buttonStyle(.borderedProminent)
                                    .tint(Brix.blue)
                                    .onChange(of: selectedPhotos) { _, newItems in
                                        deal.photoNames = newItems.enumerated().map { "Property photo \($0.offset + 1)" }
                                        state.selectedDeal = deal
                                    }
                                    if !deal.photoNames.isEmpty {
                                        ForEach(deal.photoNames, id: \.self) { name in
                                            Label(name, systemImage: "photo").foregroundStyle(Brix.muted)
                                        }
                                    }
                                }
                            }

                            Button(role: .destructive) { state.deleteSelectedDeal() } label: { Label("Delete Deal", systemImage: "trash") }
                                .frame(minHeight: 44)
                        }
                        .padding(.horizontal, presentation.horizontalPadding)
                        .padding(.vertical, 16)
                        .animation(reduceMotion ? nil : .easeInOut(duration: 0.18), value: presentation.layoutMode.rawValue)
                    }
                } else {
                    ContentUnavailableView("No Deal File", systemImage: "house", description: Text("Start in FindIQ."))
                }
            }
            .navigationTitle("DealIQ")
            .brixScreen()
        }
    }

    private func identityHeader(deal: Deal) -> some View {
        BrixCard {
            VStack(alignment: .leading, spacing: 12) {
                Text(deal.address.isEmpty ? "Deal file" : deal.address)
                    .font(.largeTitle.bold())
                    .minimumScaleFactor(0.78)
                    .accessibilityAddTraits(.isHeader)
                HStack(spacing: 10) {
                    Label(deal.status.replacingOccurrences(of: "_", with: " ").capitalized, systemImage: "folder")
                    Text(deal.strategy.title)
                }
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Brix.muted)
            }
        }
    }

    private func gridColumns(for presentation: DecisionCockpitNativePresentationContract) -> [GridItem] {
        Array(repeating: GridItem(.flexible(), spacing: presentation.cardSpacing, alignment: .top), count: presentation.columnCount)
    }

    private func money(_ label: String, value: Binding<Double?>) -> some View {
        TextField(label, value: value, format: .number)
            .keyboardType(.decimalPad)
            .textFieldStyle(.roundedBorder)
            .frame(minHeight: 44)
    }

    private func verificationLine(_ label: String, complete: Bool) -> some View {
        Label(label, systemImage: complete ? "checkmark.circle.fill" : "circle")
            .foregroundStyle(complete ? Brix.green : Brix.muted)
    }
}
