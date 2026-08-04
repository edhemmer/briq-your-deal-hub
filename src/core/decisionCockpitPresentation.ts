import type { PresentationMode } from "./presentationMode";
import type {
  DecisionCockpitPanelState,
  DecisionCockpitReadProjection,
  DecisionCockpitRecommendationStatus,
} from "./decisionCockpitProjection";

export const DECISION_COCKPIT_PRESENTATION_CONTRACT_VERSION = "decision-cockpit-presentation-contract-v1";

export type DecisionCockpitPlatformClass = "web" | "iphone" | "ipad";
export type DecisionCockpitOrientation = "portrait" | "landscape" | "unknown";
export type DecisionCockpitPointerMode = "none" | "coarse" | "fine";
export type DecisionCockpitDynamicType = "standard" | "large" | "accessibility";

export type DecisionCockpitLayoutMode =
  | "wide_desktop"
  | "desktop"
  | "compact_desktop"
  | "tablet"
  | "mobile"
  | "iphone_compact"
  | "iphone_regular"
  | "ipad_portrait"
  | "ipad_landscape";

export type DecisionCockpitSectionId =
  | "recommendation"
  | "deal_status"
  | "strongest_strategy"
  | "selected_strategy"
  | "key_numbers"
  | "risks"
  | "confidence"
  | "missing_inputs"
  | "deadlines"
  | "next_action"
  | "recent_changes"
  | "supporting_detail";

export type DecisionCockpitPresentationState =
  | "no_underwriting_yet"
  | "incomplete_blocking"
  | "processing"
  | "current"
  | "current_with_warnings"
  | "stale"
  | "conflict"
  | "partial_module_availability"
  | "failed_with_prior_valid"
  | "failed_without_prior_valid"
  | "offline_cached"
  | "permission_restricted"
  | "archived_closed";

export type DecisionCockpitViewportContext = {
  platform: DecisionCockpitPlatformClass;
  width?: number;
  height?: number;
  orientation?: DecisionCockpitOrientation;
  pointer?: DecisionCockpitPointerMode;
  touch?: boolean;
  safeArea?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  dynamicType?: DecisionCockpitDynamicType;
  reducedMotion?: boolean;
  online?: boolean;
  mode?: PresentationMode;
};

export type DecisionCockpitPresentationSection = {
  sectionId: DecisionCockpitSectionId;
  canonicalOrdinal: number;
  priority: "primary" | "secondary" | "supporting";
  visibility: "always" | "summary_first" | "collapsed_until_requested";
  compactBehavior: "pin" | "stack" | "collapse";
  guidedBehavior: "plain_language_summary" | "standard";
  professionalBehavior: "dense_detail" | "standard";
  sourceState:
    | DecisionCockpitRecommendationStatus
    | DecisionCockpitPanelState
    | DecisionCockpitReadProjection["freshness"]["state"]
    | "available"
    | "unavailable"
    | "archived_or_closed";
  destinationIds: string[];
  supportedInteractions: Array<"keyboard" | "pointer" | "touch">;
};

export type DecisionCockpitPresentationContract = {
  contractVersion: typeof DECISION_COCKPIT_PRESENTATION_CONTRACT_VERSION;
  sourceProjectionVersion: DecisionCockpitReadProjection["contractVersion"];
  dealId: string;
  workspaceId?: string;
  mode: PresentationMode;
  platformClass: DecisionCockpitPlatformClass;
  layoutMode: DecisionCockpitLayoutMode;
  shellPattern: "three_column_cockpit" | "two_column_workspace" | "single_column_decision_stack";
  columnCount: 1 | 2 | 3;
  density: "comfortable" | "compact" | "dense";
  readingOrder: DecisionCockpitSectionId[];
  sections: DecisionCockpitPresentationSection[];
  stateLayouts: Record<DecisionCockpitPresentationState, {
    supported: true;
    preservesPriorValidData: boolean;
    primaryUserAction: "read" | "retry" | "complete_inputs" | "resolve_conflict" | "none";
  }>;
  accessibility: {
    skipLinkRequired: true;
    focusRestoreRequired: true;
    landmarkLabelsRequired: true;
    keyboardNavigationRequired: true;
    dynamicTypeSupported: true;
    voiceOverSupported: true;
    reducedMotionHonored: boolean;
  };
  responsiveBehavior: {
    noHorizontalOverflow: true;
    safeAreaAware: true;
    touchTargetsMinimum44: boolean;
    pointerTargetsMinimum32: boolean;
    orientationAware: true;
  };
  progressiveDisclosure: {
    canonicalPriorityPreserved: true;
    guidedModeMayCollapseSupportingDetail: boolean;
    professionalModeMayShowDenseDetail: boolean;
    valuesRemainIdenticalAcrossModes: true;
  };
  sourceBoundary: {
    projectionReadOnly: true;
    noUnderwritingCalculation: true;
    noStrategyRanking: true;
    noRecommendationCalculation: true;
    noConfidenceMath: true;
    noStaleStateCalculation: true;
    noUrgencyCalculation: true;
    noAuthorizationLogic: true;
    noAi: true;
    noProviderCalls: true;
    noPersistence: true;
  };
};

const priorityOrder: DecisionCockpitSectionId[] = [
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

export function selectDecisionCockpitLayoutMode(context: DecisionCockpitViewportContext): DecisionCockpitLayoutMode {
  if (context.platform === "iphone") {
    return (context.width ?? 390) < 390 || context.dynamicType === "accessibility" ? "iphone_compact" : "iphone_regular";
  }
  if (context.platform === "ipad") {
    return context.orientation === "landscape" || (context.width ?? 0) >= 900 ? "ipad_landscape" : "ipad_portrait";
  }

  const width = context.width ?? 1440;
  if (width >= 1360) return "wide_desktop";
  if (width >= 1120) return "desktop";
  if (width >= 900) return "compact_desktop";
  if (width >= 700) return "tablet";
  return "mobile";
}

export function buildDecisionCockpitPresentationContract(
  projection: DecisionCockpitReadProjection,
  context: DecisionCockpitViewportContext,
): DecisionCockpitPresentationContract {
  const layoutMode = selectDecisionCockpitLayoutMode(context);
  const mode = context.mode ?? projection.mode;
  const interactions = supportedInteractions(context);
  return {
    contractVersion: DECISION_COCKPIT_PRESENTATION_CONTRACT_VERSION,
    sourceProjectionVersion: projection.contractVersion,
    dealId: projection.dealId,
    workspaceId: projection.workspaceId,
    mode,
    platformClass: context.platform,
    layoutMode,
    shellPattern: shellPatternForLayout(layoutMode),
    columnCount: columnCountForLayout(layoutMode),
    density: densityForLayout(layoutMode, mode, context.dynamicType),
    readingOrder: [...priorityOrder],
    sections: priorityOrder.map((sectionId, index) => ({
      sectionId,
      canonicalOrdinal: index + 1,
      priority: index < 5 ? "primary" : index < 10 ? "secondary" : "supporting",
      visibility: visibilityForSection(sectionId, layoutMode),
      compactBehavior: compactBehaviorForSection(sectionId),
      guidedBehavior: index >= 8 ? "plain_language_summary" : "standard",
      professionalBehavior: index >= 6 ? "dense_detail" : "standard",
      sourceState: sourceStateForSection(sectionId, projection),
      destinationIds: destinationIdsForSection(sectionId, projection),
      supportedInteractions: interactions,
    })),
    stateLayouts: buildStateLayouts(Boolean(context.online ?? true)),
    accessibility: {
      skipLinkRequired: true,
      focusRestoreRequired: true,
      landmarkLabelsRequired: true,
      keyboardNavigationRequired: true,
      dynamicTypeSupported: true,
      voiceOverSupported: true,
      reducedMotionHonored: Boolean(context.reducedMotion),
    },
    responsiveBehavior: {
      noHorizontalOverflow: true,
      safeAreaAware: true,
      touchTargetsMinimum44: context.touch === true || context.pointer === "coarse" || context.platform !== "web",
      pointerTargetsMinimum32: context.pointer !== "none",
      orientationAware: true,
    },
    progressiveDisclosure: {
      canonicalPriorityPreserved: true,
      guidedModeMayCollapseSupportingDetail: mode === "guided",
      professionalModeMayShowDenseDetail: mode === "professional",
      valuesRemainIdenticalAcrossModes: true,
    },
    sourceBoundary: presentationSourceBoundary(),
  };
}

function shellPatternForLayout(layoutMode: DecisionCockpitLayoutMode): DecisionCockpitPresentationContract["shellPattern"] {
  if (layoutMode === "wide_desktop" || layoutMode === "desktop") return "three_column_cockpit";
  if (layoutMode === "compact_desktop" || layoutMode === "tablet" || layoutMode === "ipad_landscape") return "two_column_workspace";
  return "single_column_decision_stack";
}

function columnCountForLayout(layoutMode: DecisionCockpitLayoutMode): 1 | 2 | 3 {
  if (layoutMode === "wide_desktop" || layoutMode === "desktop") return 3;
  if (layoutMode === "compact_desktop" || layoutMode === "tablet" || layoutMode === "ipad_landscape") return 2;
  return 1;
}

function densityForLayout(
  layoutMode: DecisionCockpitLayoutMode,
  mode: PresentationMode,
  dynamicType?: DecisionCockpitDynamicType,
): DecisionCockpitPresentationContract["density"] {
  if (dynamicType === "accessibility") return "comfortable";
  if (mode === "professional" && !["mobile", "iphone_compact", "iphone_regular"].includes(layoutMode)) return "dense";
  if (["mobile", "iphone_compact", "iphone_regular"].includes(layoutMode)) return "comfortable";
  return "compact";
}

function visibilityForSection(sectionId: DecisionCockpitSectionId, layoutMode: DecisionCockpitLayoutMode): DecisionCockpitPresentationSection["visibility"] {
  const isCompact = ["mobile", "iphone_compact", "iphone_regular"].includes(layoutMode);
  if (!isCompact) return "always";
  if (sectionId === "recommendation" || sectionId === "deal_status" || sectionId === "next_action") return "always";
  return priorityOrder.indexOf(sectionId) < 8 ? "summary_first" : "collapsed_until_requested";
}

function compactBehaviorForSection(sectionId: DecisionCockpitSectionId): DecisionCockpitPresentationSection["compactBehavior"] {
  if (sectionId === "recommendation" || sectionId === "next_action") return "pin";
  if (sectionId === "recent_changes" || sectionId === "supporting_detail") return "collapse";
  return "stack";
}

function supportedInteractions(context: DecisionCockpitViewportContext): Array<"keyboard" | "pointer" | "touch"> {
  const interactions: Array<"keyboard" | "pointer" | "touch"> = ["keyboard"];
  if (context.pointer !== "none") interactions.push("pointer");
  if (context.touch || context.platform !== "web") interactions.push("touch");
  return interactions;
}

function sourceStateForSection(
  sectionId: DecisionCockpitSectionId,
  projection: DecisionCockpitReadProjection,
): DecisionCockpitPresentationSection["sourceState"] {
  switch (sectionId) {
  case "recommendation":
  case "deal_status":
  case "strongest_strategy":
  case "selected_strategy":
    return projection.recommendation.status;
  case "key_numbers":
  case "supporting_detail":
    return projection.underwriting.available ? "available" : "unavailable";
  case "risks":
    return projection.risks.state;
  case "confidence":
    return projection.confidence.state;
  case "missing_inputs":
    return projection.missingInputs.state;
  case "deadlines":
    return projection.deadlines.state;
  case "next_action":
    return projection.nextActions.state;
  case "recent_changes":
    return projection.changeHistory.state;
  default:
    return projection.freshness.state;
  }
}

function destinationIdsForSection(sectionId: DecisionCockpitSectionId, projection: DecisionCockpitReadProjection): string[] {
  const destinations = projection.destinations.destinations;
  const ids = destinations
    .filter((destination) => destination.routeParams.section === destinationSection(sectionId))
    .map((destination) => destination.destinationId);
  return ids.length > 0 ? ids : [];
}

function destinationSection(sectionId: DecisionCockpitSectionId) {
  switch (sectionId) {
  case "recommendation":
  case "deal_status":
    return "overview";
  case "risks":
    return "overview";
  case "missing_inputs":
    return "underwriting";
  case "deadlines":
    return "work";
  case "next_action":
    return "overview";
  case "recent_changes":
    return "history";
  case "strongest_strategy":
  case "selected_strategy":
    return "strategies";
  case "key_numbers":
    return "underwriting";
  default:
    return "overview";
  }
}

function buildStateLayouts(online: boolean): DecisionCockpitPresentationContract["stateLayouts"] {
  return {
    no_underwriting_yet: { supported: true, preservesPriorValidData: false, primaryUserAction: "complete_inputs" },
    incomplete_blocking: { supported: true, preservesPriorValidData: false, primaryUserAction: "complete_inputs" },
    processing: { supported: true, preservesPriorValidData: true, primaryUserAction: "read" },
    current: { supported: true, preservesPriorValidData: true, primaryUserAction: "read" },
    current_with_warnings: { supported: true, preservesPriorValidData: true, primaryUserAction: "complete_inputs" },
    stale: { supported: true, preservesPriorValidData: true, primaryUserAction: "retry" },
    conflict: { supported: true, preservesPriorValidData: true, primaryUserAction: "resolve_conflict" },
    partial_module_availability: { supported: true, preservesPriorValidData: true, primaryUserAction: "complete_inputs" },
    failed_with_prior_valid: { supported: true, preservesPriorValidData: true, primaryUserAction: online ? "retry" : "read" },
    failed_without_prior_valid: { supported: true, preservesPriorValidData: false, primaryUserAction: online ? "retry" : "none" },
    offline_cached: { supported: true, preservesPriorValidData: true, primaryUserAction: "read" },
    permission_restricted: { supported: true, preservesPriorValidData: false, primaryUserAction: "none" },
    archived_closed: { supported: true, preservesPriorValidData: true, primaryUserAction: "read" },
  };
}

function presentationSourceBoundary() {
  return {
    projectionReadOnly: true,
    noUnderwritingCalculation: true,
    noStrategyRanking: true,
    noRecommendationCalculation: true,
    noConfidenceMath: true,
    noStaleStateCalculation: true,
    noUrgencyCalculation: true,
    noAuthorizationLogic: true,
    noAi: true,
    noProviderCalls: true,
    noPersistence: true,
  } as const;
}
