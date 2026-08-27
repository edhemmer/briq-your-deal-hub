import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migrationPath = "supabase/migrations/20260826221732_spec011_contract_change_propagation.sql";
const migration = readFileSync(migrationPath, "utf8");
const core = readFileSync("src/core/contractIQ.ts", "utf8");
const client = readFileSync("src/core/contractIQClient.ts", "utf8");
const authorityGuard = readFileSync("scripts/production-authority-check.mjs", "utf8");

describe("ContractIQ Slice 5 propagation source boundaries", () => {
  it("adds strict propagation contracts, deterministic routing, and source-version graph support", () => {
    for (const symbol of [
      "CONTRACTIQ_CHANGE_PROPAGATION_VERSION",
      "ContractChangePropagationRequest",
      "ContractChangePropagationResult",
      "classifyContractChangeTargetDomain",
      "buildContractChangePropagationRequest",
      "buildContractChangePropagationResult",
      "CONTRACTIQ_CHANGE_VERSION_GRAPH_VERSION",
      "contractChangePropagationStateAfterFailure",
    ]) {
      expect(core).toContain(symbol);
    }

    for (const domain of [
      "deal_fact",
      "property_fact",
      "finance",
      "underwriting_input",
      "strategy_requirement",
      "governance_reference",
      "task_deadline",
      "cockpit_attention",
      "reporting_candidate",
      "offer_candidate",
      "none",
    ]) {
      expect(core).toContain(`"${domain}"`);
      expect(migration).toContain(`'${domain}'`);
    }
  });

  it("persists propagation and downstream proposal state without direct authoritative result mutation", () => {
    for (const table of [
      "public.contract_change_propagations",
      "public.contract_downstream_change_proposals",
    ]) {
      expect(migration).toContain(`create table if not exists ${table}`);
      expect(migration).toContain(`alter table ${table} enable row level security`);
      expect(migration).toContain(`revoke insert, update, delete on ${table} from authenticated`);
    }

    expect(migration).toContain("create or replace view public.contract_change_propagation_projection");
    expect(migration).toContain("create or replace function public.propagate_accepted_contract_change");
    expect(migration).toContain("set search_path = public, pg_temp");
    expect(migration).toContain("public.authorized_contract");
    expect(migration).toContain("public.has_workspace_permission");
    expect(migration).toContain("public.ensure_contract_command");
    expect(migration).toContain("contract.change_propagation_requested");
    expect(migration).toContain("calculation_authority', 'spec005_underwriting_only");
    expect(migration).toContain("strategy_authority', 'spec006_strategy_only");
    expect(migration).toContain("cockpit_authority', 'spec007_projection_only");
    expect(migration).not.toMatch(/insert into public\.underwriting_results|update public\.underwriting_results|insert into public\.strategy_results|update public\.strategy_results|insert into public\.tasks|insert into public\.deadlines/i);
  });

  it("blocks silent propagation from unaccepted, unverified, conflicted, stale, superseded, or low-materiality sources", () => {
    for (const guard of [
      "accepted_proposal.status <> 'accepted'",
      "target_term.proposal_state <> 'accepted'",
      "target_term.verification_state not in ('source_backed','verified','professional_verified')",
      "target_term.materiality in ('immaterial','informational','unknown')",
      "target_term.superseded_by_term_id is not null",
      "target_finding.proposal_state in ('rejected','disputed','superseded','expired')",
      "target_finding.verification_state = 'conflicted'",
      "ContractIQ propagation input may not copy raw document text.",
    ]) {
      expect(migration).toContain(guard);
    }
  });

  it("indexes every FK and operational lookup path in the same migration", () => {
    for (const indexName of [
      "idx_contract_change_propagations_deal",
      "idx_contract_change_propagations_property",
      "idx_contract_change_propagations_contract",
      "idx_contract_change_propagations_term",
      "idx_contract_change_propagations_finding",
      "idx_contract_change_propagations_proposal",
      "idx_contract_change_propagations_source_evidence",
      "idx_contract_change_propagations_triggering_event",
      "idx_contract_downstream_change_proposals_propagation",
      "idx_contract_downstream_change_proposals_deal",
      "idx_contract_downstream_change_proposals_contract",
      "idx_contract_downstream_change_proposals_term",
      "idx_contract_downstream_change_proposals_finding",
      "idx_contract_downstream_change_proposals_accepted_proposal",
      "idx_contract_downstream_change_proposals_source_evidence",
      "idx_contract_downstream_change_proposals_target",
    ]) {
      expect(migration).toMatch(new RegExp(`create\\s+(unique\\s+)?index\\s+if\\s+not\\s+exists\\s+${indexName}`, "i"));
    }
  });

  it("exposes only RPC/projection client paths and extends the production authority guard", () => {
    expect(client).toContain("propagate_accepted_contract_change");
    expect(client).toContain("contract_change_propagation_projection");
    expect(client).not.toMatch(/from\("contract_change_propagations"\).*insert|from\("contract_downstream_change_proposals"\).*insert/s);

    for (const guard of [
      "contract_change_propagations",
      "insert into public.underwriting_results",
      "update public.strategy_results",
      "propagateAcceptedContractChange",
      "duplicate ContractIQ propagation authority",
    ]) {
      expect(authorityGuard).toContain(guard);
    }
  });
});
