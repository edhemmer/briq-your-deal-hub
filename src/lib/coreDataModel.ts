export type CoreEntity =
  | "Organization"
  | "User"
  | "AcquisitionProfile"
  | "Opportunity"
  | "Property"
  | "DealIQRecord"
  | "PipelineRecord"
  | "Offer"
  | "Asset"
  | "Task"
  | "Note"
  | "Document"
  | "ProviderRecord";

export interface EntityDefinition {
  entity: CoreEntity;
  purpose: string;
  owner: "Platform" | "Organization" | "User";
  primaryModule: "Core" | "FindIQ" | "DealIQ" | "PipelineIQ" | "OfferIQ" | "PortfolioIQ" | "Provider Layer";
  keyRelationships: string[];
}

export const coreEntities: EntityDefinition[] = [
  {
    entity: "Organization",
    purpose: "Account-level workspace for users, billing, permissions, and shared data.",
    owner: "Organization",
    primaryModule: "Core",
    keyRelationships: ["has many Users", "has many AcquisitionProfiles", "has many Properties"],
  },
  {
    entity: "User",
    purpose: "Authenticated person using BRIX across web and iOS.",
    owner: "User",
    primaryModule: "Core",
    keyRelationships: ["belongs to Organization", "creates Notes", "owns Tasks", "has role/permissions"],
  },
  {
    entity: "AcquisitionProfile",
    purpose: "Defines what FindIQ should search for and how opportunities should be ranked.",
    owner: "User",
    primaryModule: "FindIQ",
    keyRelationships: ["belongs to Organization", "has many Opportunities", "informs DealIQ assumptions"],
  },
  {
    entity: "Opportunity",
    purpose: "Discovery-stage property candidate surfaced by FindIQ.",
    owner: "Organization",
    primaryModule: "FindIQ",
    keyRelationships: ["belongs to AcquisitionProfile", "may create Property", "may create DealIQRecord", "has ProviderRecords"],
  },
  {
    entity: "Property",
    purpose: "Canonical property identity shared across all modules.",
    owner: "Organization",
    primaryModule: "Core",
    keyRelationships: ["has one or more Opportunities", "has DealIQRecords", "has PipelineRecords", "may become Asset"],
  },
  {
    entity: "DealIQRecord",
    purpose: "Acquisition underwriting and recommendation record.",
    owner: "Organization",
    primaryModule: "DealIQ",
    keyRelationships: ["belongs to Property", "consumes Opportunity", "creates Offer", "updates PipelineRecord"],
  },
  {
    entity: "PipelineRecord",
    purpose: "Workflow state from discovery through closing or rejection.",
    owner: "Organization",
    primaryModule: "PipelineIQ",
    keyRelationships: ["belongs to Property", "has Tasks", "has Notes", "receives Offer status", "creates Asset when Closed"],
  },
  {
    entity: "Offer",
    purpose: "Transaction strategy, offer terms, documents, communications, and negotiation history.",
    owner: "Organization",
    primaryModule: "OfferIQ",
    keyRelationships: ["belongs to DealIQRecord", "updates PipelineRecord", "has Documents", "has Notes"],
  },
  {
    entity: "Asset",
    purpose: "Owned property record after acquisition closes.",
    owner: "Organization",
    primaryModule: "PortfolioIQ",
    keyRelationships: ["created from PipelineRecord", "belongs to Property", "has Documents", "has maintenance Tasks"],
  },
  {
    entity: "Task",
    purpose: "Action item with owner, due date, priority, status, and module context.",
    owner: "User",
    primaryModule: "PipelineIQ",
    keyRelationships: ["belongs to PipelineRecord or Asset", "assigned to User", "may be automation-generated"],
  },
  {
    entity: "Note",
    purpose: "User or team annotation attached to acquisition or ownership records.",
    owner: "User",
    primaryModule: "Core",
    keyRelationships: ["belongs to User", "attaches to Opportunity, DealIQRecord, PipelineRecord, Offer, or Asset"],
  },
  {
    entity: "Document",
    purpose: "File, generated document, scanned item, photo, or supporting evidence.",
    owner: "Organization",
    primaryModule: "Core",
    keyRelationships: ["attaches to Property", "attaches to Offer", "attaches to Asset", "stores source and verification metadata"],
  },
  {
    entity: "ProviderRecord",
    purpose: "Normalized provider data with source, retrieval date, confidence, and raw reference.",
    owner: "Platform",
    primaryModule: "Provider Layer",
    keyRelationships: ["supports Opportunity", "supports Property", "supports Asset", "never consumed directly by UI modules"],
  },
];

export const coreDataModelRules = [
  "Property is the canonical identity across modules.",
  "Acquisition Profiles drive FindIQ opportunity ranking.",
  "Opportunities become DealIQ records without duplicate data entry.",
  "Closed PipelineIQ records create PortfolioIQ assets.",
  "Notes, tasks, documents, and provider records must attach to the relevant core entity.",
  "Web and iOS consume the same APIs and data model.",
];
