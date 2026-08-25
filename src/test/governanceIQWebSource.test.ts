import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("GovernanceIQ web source boundary", () => {
  it("renders the required workspace sections and uses governed server mutations", () => {
    const component = read("src/components/GovernanceIQWorkspace.tsx");

    expect(component).toContain("Overview");
    expect(component).toContain("Documents");
    expect(component).toContain("Restrictions");
    expect(component).toContain("Financials");
    expect(component).toContain("Conflicts");
    expect(component).toContain("Questions / Review");
    expect(component).toContain("Changes / Impact");
    expect(component).toContain("setGovernanceFindingAcceptance");
    expect(component).toContain("propagateAcceptedGovernanceFinding");
    expect(component).toContain("Prior Valid Result Preserved");
    expect(component).not.toContain("Legally Controlling");
    expect(component).not.toContain("budgetHealthScore");
    expect(component).not.toContain("HOA score");
  });

  it("loads canonical GovernanceIQ projections without a duplicate evidence or legal-analysis system", () => {
    const client = read("src/core/governanceIQClient.ts");

    expect(client).toContain("list_governance_record_projection");
    expect(client).toContain("load_governance_record_detail");
    expect(client).toContain("governance_questions");
    expect(client).toContain("governance_change_propagation_projection");
    expect(client).toContain("set_governance_finding_acceptance");
    expect(client).toContain("propagate_accepted_governance_change");
    expect(client).not.toContain("service_role");
    expect(client).not.toContain("legalConclusion");
    expect(client).not.toContain("isLegallyAllowed");
    expect(client).not.toContain("storage.from");
  });

  it("keeps GovernanceIQ inside Deal navigation and Cockpit safe links", () => {
    const app = read("src/App.tsx");
    const deepLinks = read("src/core/deepLinks.ts");
    const destinations = read("src/core/decisionCockpitDestinations.ts");

    expect(app).toContain("governanceiq");
    expect(app).toContain("<GovernanceIQWorkspace");
    expect(deepLinks).toContain('"governanceiq"');
    expect(deepLinks).toContain('"governance_finding"');
    expect(destinations).toContain('"GovernanceIQ"');
    expect(destinations).toContain('"decision_cockpit.governanceiq"');
    expect(destinations).toContain('section: governance ? "governanceiq" : "work"');
  });
});

function read(path: string) {
  return readFileSync(path, "utf8");
}
