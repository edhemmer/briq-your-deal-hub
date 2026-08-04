import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  DECISION_COCKPIT_PRESENTATION_CONTRACT_VERSION,
  buildDecisionCockpitPresentationContract,
  selectDecisionCockpitLayoutMode,
  type DecisionCockpitPresentationState,
} from "../core/decisionCockpitPresentation";
import {
  DECISION_COCKPIT_READ_PROJECTION_CONTRACT_VERSION,
  buildDecisionCockpitReadProjection,
} from "../core/decisionCockpitProjection";

const expectedPriorityOrder = [
  "recommendation",
  "deal_status",
  "strongest_strategy",
  "selected_strategy",
  "key_numbers",
  "risks",
  "confidence",
  "missing_inputs",
  "deadlines",
  "next_action",
  "recent_changes",
  "supporting_detail",
];

describe("decision cockpit presentation contract", () => {
  it("selects web, iPhone, and iPad layouts without using investment values", () => {
    expect(selectDecisionCockpitLayoutMode({ platform: "web", width: 1440 })).toBe("wide_desktop");
    expect(selectDecisionCockpitLayoutMode({ platform: "web", width: 1200 })).toBe("desktop");
    expect(selectDecisionCockpitLayoutMode({ platform: "web", width: 980 })).toBe("compact_desktop");
    expect(selectDecisionCockpitLayoutMode({ platform: "web", width: 760 })).toBe("tablet");
    expect(selectDecisionCockpitLayoutMode({ platform: "web", width: 390, touch: true })).toBe("mobile");
    expect(selectDecisionCockpitLayoutMode({ platform: "iphone", width: 375 })).toBe("iphone_compact");
    expect(selectDecisionCockpitLayoutMode({ platform: "iphone", width: 430 })).toBe("iphone_regular");
    expect(selectDecisionCockpitLayoutMode({ platform: "ipad", width: 820, orientation: "portrait" })).toBe("ipad_portrait");
    expect(selectDecisionCockpitLayoutMode({ platform: "ipad", width: 1024, orientation: "landscape" })).toBe("ipad_landscape");
  });

  it("preserves canonical priority and values across guided and professional presentation modes", () => {
    const projection = buildDecisionCockpitReadProjection({
      dealId: "deal-responsive",
      dealName: "Responsive Deal",
      mode: "guided",
    });

    const guided = buildDecisionCockpitPresentationContract(projection, {
      platform: "web",
      width: 390,
      touch: true,
      mode: "guided",
    });
    const professional = buildDecisionCockpitPresentationContract(projection, {
      platform: "web",
      width: 1440,
      pointer: "fine",
      mode: "professional",
    });

    expect(guided.contractVersion).toBe(DECISION_COCKPIT_PRESENTATION_CONTRACT_VERSION);
    expect(guided.sourceProjectionVersion).toBe(DECISION_COCKPIT_READ_PROJECTION_CONTRACT_VERSION);
    expect(guided.readingOrder).toEqual(expectedPriorityOrder);
    expect(professional.readingOrder).toEqual(expectedPriorityOrder);
    expect(guided.sections.map((section) => section.canonicalOrdinal)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(professional.sections.map((section) => section.sectionId)).toEqual(guided.sections.map((section) => section.sectionId));
    expect(guided.progressiveDisclosure.valuesRemainIdenticalAcrossModes).toBe(true);
    expect(professional.progressiveDisclosure.valuesRemainIdenticalAcrossModes).toBe(true);
    expect(guided.columnCount).toBe(1);
    expect(professional.columnCount).toBe(3);
  });

  it("covers required loading, stale, partial, failure, offline, permission, and archived presentation states", () => {
    const projection = buildDecisionCockpitReadProjection({ dealId: "deal-states", dealName: "State Deal" });
    const contract = buildDecisionCockpitPresentationContract(projection, {
      platform: "web",
      width: 900,
      online: false,
    });
    const states: DecisionCockpitPresentationState[] = [
      "no_underwriting_yet",
      "incomplete_blocking",
      "processing",
      "current",
      "current_with_warnings",
      "stale",
      "conflict",
      "partial_module_availability",
      "failed_with_prior_valid",
      "failed_without_prior_valid",
      "offline_cached",
      "permission_restricted",
      "archived_closed",
    ];

    for (const state of states) {
      expect(contract.stateLayouts[state]?.supported).toBe(true);
    }
    expect(contract.stateLayouts.failed_with_prior_valid.preservesPriorValidData).toBe(true);
    expect(contract.stateLayouts.failed_without_prior_valid.preservesPriorValidData).toBe(false);
    expect(contract.stateLayouts.offline_cached.primaryUserAction).toBe("read");
    expect(contract.stateLayouts.permission_restricted.primaryUserAction).toBe("none");
  });

  it("exposes accessibility, touch, pointer, safe-area, and orientation requirements in the contract", () => {
    const projection = buildDecisionCockpitReadProjection({ dealId: "deal-access", dealName: "Access Deal" });
    const contract = buildDecisionCockpitPresentationContract(projection, {
      platform: "iphone",
      width: 390,
      height: 844,
      touch: true,
      pointer: "coarse",
      orientation: "portrait",
      dynamicType: "accessibility",
      reducedMotion: true,
      safeArea: { top: 47, right: 0, bottom: 34, left: 0 },
    });

    expect(contract.layoutMode).toBe("iphone_compact");
    expect(contract.responsiveBehavior).toMatchObject({
      noHorizontalOverflow: true,
      safeAreaAware: true,
      touchTargetsMinimum44: true,
      orientationAware: true,
    });
    expect(contract.accessibility).toMatchObject({
      skipLinkRequired: true,
      focusRestoreRequired: true,
      keyboardNavigationRequired: true,
      dynamicTypeSupported: true,
      voiceOverSupported: true,
      reducedMotionHonored: true,
    });
    expect(contract.sections[0].supportedInteractions).toEqual(["keyboard", "pointer", "touch"]);
  });

  it("keeps the presentation layer runtime-neutral and free of client business logic", () => {
    const contractSource = readFileSync("src/core/decisionCockpitPresentation.ts", "utf8");
    const forbidden = [
      "supabase",
      "fetch(",
      "insert(",
      "update(",
      "delete(",
      "localStorage",
      "sessionStorage",
      "OpenAI",
      "analyzeDeal",
      "executeFormula",
      "calculate",
      "scoreStrategy",
      "rankStrategies",
      "confidenceScore",
    ];
    for (const term of forbidden) {
      expect(contractSource).not.toContain(term);
    }
  });

  it("declares native presentation behavior without native-only scoring or provider work", () => {
    const nativeSource = readFileSync("ios/BRIXRealEstateiOS/BRIXRealEstateiOS/DealIQCockpitView.swift", "utf8");
    expect(nativeSource).toContain("DecisionCockpitNativePresentationContract");
    expect(nativeSource).toContain("iphoneCompact");
    expect(nativeSource).toContain("ipadLandscape");
    expect(nativeSource).toContain("supportsSafeArea = true");
    expect(nativeSource).toContain("supportsVoiceOver = true");
    expect(nativeSource).toContain("preservesCanonicalPriority = true");
    expect(nativeSource).toContain("noUnderwritingCalculation = true");
    expect(nativeSource).toContain("noStrategyRanking = true");
    expect(nativeSource).not.toContain("URLSession");
    expect(nativeSource).not.toContain("Supabase");
    expect(nativeSource).not.toContain("OpenAI");
  });
});
