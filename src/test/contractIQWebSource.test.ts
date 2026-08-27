import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const app = read("src/App.tsx");
const workspace = read("src/components/ContractIQWorkspace.tsx");
const client = read("src/core/contractIQClient.ts");
const presentation = read("src/core/contractIQPresentation.ts");
const deepLinks = read("src/core/deepLinks.ts");
const cockpitDestinations = read("src/core/decisionCockpitDestinations.ts");

describe("ContractIQ web source boundary", () => {
  it("adds ContractIQ to the Deal workspace and safe deep links without reviving a top-level module", () => {
    expect(app).toContain("{ id: \"contractiq\", label: \"ContractIQ\" }");
    expect(app).toContain("<ContractIQWorkspace");
    expect(app).not.toContain('"/contractiq"');
    expect(deepLinks).toContain("\"contractiq\"");
    expect(deepLinks).toContain("\"contract_deadline\"");
    expect(deepLinks).toContain("\"contract_propagation\"");
    expect(cockpitDestinations).toContain("\"ContractIQ\"");
    expect(cockpitDestinations).toContain("decision_cockpit.contractiq");
    expect(cockpitDestinations).toContain('section: contract ? "contractiq" : governance ? "governanceiq" : "work"');
  });

  it("loads canonical ContractIQ projections, detail, deadlines, perspective analysis, amendments, and propagation state", () => {
    for (const source of [
      "contract_projection",
      "load_contract_detail",
      "contract_perspective_analysis_items",
      "contract_deadline_results",
      "contract_amendment_impact_results",
      "contract_change_propagation_projection",
      "propagate_accepted_contract_change",
    ]) {
      expect(client).toContain(source);
    }
    expect(client).not.toContain("service_role");
    expect(client).not.toContain("storage.from");
    expect(client).not.toContain("rawDocumentText");
    expect(client).not.toContain("documentText");
  });

  it("keeps the web experience read-only except for server-backed accepted-change propagation", () => {
    expect(workspace).toContain("Propagate accepted change");
    expect(workspace).toContain("proposal.status === \"accepted\"");
    expect(workspace).toContain("Perspective changes interpretation and questions. It does not rewrite source facts.");
    expect(workspace).toContain("DISCUSSION DRAFT");
    expect(workspace).toContain("FOR LICENSED PROFESSIONAL REVIEW");
    expect(workspace).toContain("role=\"region\"");
    expect(workspace).toContain("role=\"tablist\"");
    expect(workspace).toContain("aria-selected");
    expect(workspace).toContain("Reload");
    expect(workspace).toContain("offline");
    expect(workspace).not.toContain("setContract");
    expect(workspace).not.toContain("acceptContract");
    expect(workspace).not.toContain("rejectContract");
    expect(workspace).not.toContain("e-sign");
    expect(workspace).not.toContain("signature packet");
  });

  it("does not implement deferred reports, OfferIQ, document sending, or client-owned deadline math", () => {
    const uiSource = `${workspace}\n${presentation}\n${client}`;
    expect(uiSource).not.toContain("full_due_diligence_report");
    expect(uiSource).not.toContain("buyer_due_diligence_summary_report");
    expect(uiSource).not.toContain("OfferIQ");
    expect(uiSource).not.toContain("sendContract");
    expect(uiSource).not.toContain("calculateContractDeadline");
    expect(uiSource).not.toContain("addBusinessDays");
    expect(uiSource).not.toContain("businessDayOffset");
    expect(uiSource).not.toContain("isLegallyEnforceable");
    expect(uiSource).not.toContain("legalConclusion");
  });
});

function read(path: string) {
  return readFileSync(path, "utf8");
}
