import { describe, expect, it } from "vitest";

import {
  CONTRACTIQ_FOUNDATION_CONTRACT_VERSION,
  CONTRACTIQ_PROJECTION_CONTRACT_VERSION,
  CONTRACT_ANALYSIS_STATES,
  CONTRACT_DEADLINE_STATUSES,
  CONTRACT_PERSPECTIVES,
  CONTRACT_PROPOSAL_STATES,
  CONTRACT_RELATIONSHIP_TYPES,
  CONTRACT_STATUSES,
  CONTRACT_SOURCE_ANCHOR_KINDS,
  CONTRACT_TYPES,
  CONTRACT_VERIFICATION_STATES,
  assertContractIQSourceBoundary,
  isContractSourceAnchor,
} from "../core/contractIQ";

describe("ContractIQ foundation contract", () => {
  it("defines the canonical Slice 1 vocabulary without legal analysis or report authority", () => {
    expect(CONTRACTIQ_FOUNDATION_CONTRACT_VERSION).toBe("contractiq-foundation-v1");
    expect(CONTRACTIQ_PROJECTION_CONTRACT_VERSION).toBe("contractiq-projection-v1");
    expect(CONTRACT_TYPES).toContain("purchase_agreement");
    expect(CONTRACT_TYPES).toContain("commercial_lease");
    expect(CONTRACT_TYPES).toContain("loan_agreement");
    expect(CONTRACT_TYPES).toContain("title_commitment");
    expect(CONTRACT_STATUSES).toEqual([
      "draft",
      "proposed",
      "submitted",
      "countered",
      "partially_executed",
      "executed",
      "under_review",
      "contingent",
      "amended",
      "superseded",
      "terminated",
      "cancelled",
      "expired",
      "closed",
      "unknown",
    ]);
    expect(CONTRACT_PERSPECTIVES).toEqual(["buyer", "seller", "landlord", "tenant", "borrower", "lender", "developer", "investor", "guarantor"]);
    expect(CONTRACT_VERIFICATION_STATES).toEqual(["unverified", "source_backed", "verified", "professional_verified", "conflicted", "unknown"]);
    expect(CONTRACT_ANALYSIS_STATES).toContain("failed_with_prior_analysis");
    expect(CONTRACT_PROPOSAL_STATES).toEqual(["proposed", "accepted", "rejected", "disputed", "superseded", "expired"]);
    expect(CONTRACT_DEADLINE_STATUSES).toContain("pending_verification");
    expect(CONTRACT_RELATIONSHIP_TYPES).toEqual(["amends", "amended_by", "supersedes", "superseded_by", "supplements", "restates", "related_to"]);
  });

  it("accepts source anchors and rejects unanchored or unsupported references", () => {
    expect(CONTRACT_SOURCE_ANCHOR_KINDS).toContain("clause");
    expect(CONTRACT_SOURCE_ANCHOR_KINDS).toContain("email_message");
    expect(isContractSourceAnchor({ kind: "page", page: 4, evidenceId: "evidence-1" })).toBe(true);
    expect(isContractSourceAnchor({ kind: "clause", clause: "10(b)" })).toBe(true);
    expect(isContractSourceAnchor({ page: 4 })).toBe(false);
    expect(isContractSourceAnchor({ kind: "raw_full_text" })).toBe(false);
  });

  it("guards the foundation slice from deferred systems", () => {
    expect(() => assertContractIQSourceBoundary("create table if not exists public.contract_terms (source_anchor jsonb);")).not.toThrow();
    expect(() => assertContractIQSourceBoundary("create table public.contract_people (id uuid);")).toThrow(/deferred boundary/);
    expect(() => assertContractIQSourceBoundary("alter table public.contracts add column contract_risk_score numeric;")).toThrow(/deferred boundary/);
    expect(() => assertContractIQSourceBoundary("select 'buyer_due_diligence_summary_report';")).toThrow(/deferred boundary/);
  });
});
