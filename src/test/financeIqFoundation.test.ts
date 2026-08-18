import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  FINANCEIQ_NON_GOAL_CALCULATION_FIELDS,
  FINANCEIQ_PROJECTION_CONTRACT_VERSION,
  FINANCEIQ_STRUCTURE_CONTRACT_VERSION,
  assertFinanceIQFoundationIsStructuralOnly,
  type ActiveFinancingSelectionResult,
  type DebtTranche,
  type EquityTranche,
  type FinancingProjection,
  type FinancingStructure,
} from "../core/financeIQ";

const migration = readFileSync(
  "supabase/migrations/20260818143409_spec009_financing_structure_foundation.sql",
  "utf8",
);

describe("FinanceIQ Slice 1 canonical foundation", () => {
  it("defines structural contracts without creating calculation authority", () => {
    const structure: FinancingStructure = {
      contractVersion: FINANCEIQ_STRUCTURE_CONTRACT_VERSION,
      financingStructureId: "finance-1",
      financingStructureVersion: 1,
      workspaceId: "workspace-1",
      dealId: "deal-1",
      name: "Conventional 75% LTV quote",
      purpose: "acquisition",
      status: "quoted",
      currency: "USD",
      verificationState: "quoted",
      sourceClassification: "lender_provided",
      confidence: 80,
      isActive: false,
      activeContext: "current_deal",
      sourceEvidenceId: "evidence-1",
      sourceAnchor: { page: 1, section: "Loan terms" },
      createdAt: "2026-08-18T14:00:00.000Z",
      updatedAt: "2026-08-18T14:00:00.000Z",
    };

    const projection: FinancingProjection = {
      contractVersion: FINANCEIQ_PROJECTION_CONTRACT_VERSION,
      financingStructureId: structure.financingStructureId,
      financingStructureVersion: structure.financingStructureVersion,
      workspaceId: structure.workspaceId,
      dealId: structure.dealId,
      name: structure.name,
      purpose: structure.purpose,
      status: structure.status,
      currency: structure.currency,
      verificationState: structure.verificationState,
      sourceClassification: structure.sourceClassification,
      confidence: structure.confidence,
      isActive: structure.isActive,
      activeContext: structure.activeContext,
      isExpired: false,
      capitalSourceCount: 2,
      debtTrancheCount: 1,
      equityTrancheCount: 1,
      updatedAt: structure.updatedAt,
      loadedAt: "2026-08-18T14:00:01.000Z",
    };

    expect(structure.contractVersion).toBe("financeiq-structure-foundation-v1");
    expect(projection.contractVersion).toBe("financeiq-structure-projection-v1");
    expect(projection).not.toHaveProperty("dscr");
    expect(projection).not.toHaveProperty("monthlyPayment");
  });

  it("keeps debt and equity tranches as terms only", () => {
    const debt: DebtTranche = {
      debtTrancheId: "debt-1",
      debtTrancheVersion: 1,
      workspaceId: "workspace-1",
      financingStructureId: "finance-1",
      label: "Senior loan",
      principalAmount: 300000,
      commitmentAmount: 300000,
      rateType: "fixed",
      statedRate: 0.06875,
      amortizationMonths: 360,
      maturityMonths: 360,
      interestOnlyMonths: 0,
      paymentFrequency: "monthly",
      hasBalloon: false,
      fees: [{ label: "Origination", amount: 2500 }],
      prepaymentType: "unknown",
      recourseType: "full",
      drawMetadata: {},
      extensionMetadata: {},
      reserveEscrowMetadata: {},
      status: "quoted",
      verificationState: "quoted",
      sourceClassification: "lender_provided",
      confidence: 80,
    };

    const equity: EquityTranche = {
      equityTrancheId: "equity-1",
      equityTrancheVersion: 1,
      workspaceId: "workspace-1",
      financingStructureId: "finance-1",
      label: "Sponsor cash",
      contributorLabel: "Investor",
      contributionAmount: 100000,
      currency: "USD",
      contributionTiming: { due: "closing" },
      ownershipPercentage: 100,
      preferredReturnTerms: {},
      waterfallTerms: {},
      promoteTerms: {},
      distributionPriority: 1,
      fees: [],
      status: "committed",
      verificationState: "investor_provided",
      sourceClassification: "investor_provided",
      confidence: 90,
    };

    expect(debt).not.toHaveProperty("amortizationSchedule");
    expect(debt).not.toHaveProperty("payment");
    expect(equity).not.toHaveProperty("waterfallDistribution");
  });

  it("rejects accidental calculated outputs at the Slice 1 boundary", () => {
    expect(() => assertFinanceIQFoundationIsStructuralOnly({ statedRate: 0.07 })).not.toThrow();
    for (const field of FINANCEIQ_NON_GOAL_CALCULATION_FIELDS) {
      expect(() => assertFinanceIQFoundationIsStructuralOnly({ [field]: 1 })).toThrow(
        `FinanceIQ Slice 1 cannot accept calculated output field: ${field}`,
      );
    }
  });

  it("creates canonical FinanceIQ tables with RLS and direct-write denial", () => {
    for (const table of [
      "financing_structures",
      "capital_sources",
      "debt_tranches",
      "equity_tranches",
      "financing_structure_versions",
      "financing_command_requests",
    ]) {
      expect(migration).toContain(`create table if not exists public.${table}`);
      expect(migration).toContain(`alter table public.${table} enable row level security;`);
    }

    expect(migration).toContain("financing structures no direct insert");
    expect(migration).toContain("capital sources no direct update");
    expect(migration).toContain("debt tranches no direct delete");
    expect(migration).toContain("equity tranches no direct insert");
  });

  it("enforces Deal/workspace relationships, versioning, and one active structure", () => {
    expect(migration).toContain("constraint financing_structures_deal_fk foreign key (workspace_id, deal_id)");
    expect(migration).toContain("references public.brix_deals(workspace_id, id) on delete cascade");
    expect(migration).toContain("create trigger touch_financing_structures");
    expect(migration).toContain("create trigger record_financing_structure_version_on_update");
    expect(migration).toContain("idx_financing_structures_one_active_current");
    expect(migration).toContain("where is_active is true");

    const activation: ActiveFinancingSelectionResult = {
      financingStructureId: "finance-2",
      financingStructureVersion: 2,
      workspaceId: "workspace-1",
      dealId: "deal-1",
      previouslyActiveFinancingStructureId: "finance-1",
      activeContext: "current_deal",
    };
    expect(activation.previouslyActiveFinancingStructureId).toBe("finance-1");
  });

  it("exposes server-owned RPCs, projections, audit, and domain events", () => {
    for (const functionName of [
      "create_financing_structure",
      "update_financing_structure",
      "select_active_financing_structure",
      "archive_financing_structure",
      "upsert_capital_source",
      "upsert_debt_tranche",
      "upsert_equity_tranche",
      "list_financing_structure_projection",
      "load_financing_structure_detail",
    ]) {
      expect(migration).toContain(`create or replace function public.${functionName}`);
      expect(migration).toContain(`grant execute on function public.${functionName}`);
    }

    for (const eventName of [
      "financing.structure_created",
      "financing.terms_changed",
      "financing.active_structure_changed",
      "financing.superseded",
    ]) {
      expect(migration).toContain(eventName);
    }

    expect(migration).toContain("insert into public.audit_events");
    expect(migration).toContain("calculation_authority', 'underwriting_engine_only'");
  });

  it("makes child financing term writes idempotent and auditable", () => {
    for (const functionName of ["upsert_capital_source", "upsert_debt_tranche", "upsert_equity_tranche"]) {
      const functionBody = migration.slice(
        migration.indexOf(`create or replace function public.${functionName}`),
        migration.indexOf("$$;", migration.indexOf(`create or replace function public.${functionName}`)),
      );

      expect(migration).toContain(`grant execute on function public.${functionName}(uuid, jsonb, integer, text)`);
      expect(functionBody).toContain("idempotency_key text default null");
      expect(functionBody).toContain("public.ensure_financing_command");
      expect(functionBody).toContain("if command.result is not null then");
      expect(functionBody).toContain("insert into public.audit_events");
      expect(functionBody).toContain("update public.financing_command_requests");
    }
  });

  it("does not store authoritative FinanceIQ calculation outputs in the migration", () => {
    const forbiddenPatterns = [
      /\bmonthly_payment\b/i,
      /\bpayment_schedule\b/i,
      /\bamortization_schedule\b/i,
      /\bcalculated_dscr\b/i,
      /\bcalculated_ltv\b/i,
      /\bcalculated_ltc\b/i,
      /\bdebt_yield\b/i,
      /\bfunding_gap\b/i,
      /\bcash_required\b/i,
      /\bblended_cost\b/i,
      /\bwaterfall_distribution\b/i,
    ];

    for (const pattern of forbiddenPatterns) {
      expect(migration).not.toMatch(pattern);
    }

    expect(migration).toContain("only authoritative calculation engine");
  });
});
