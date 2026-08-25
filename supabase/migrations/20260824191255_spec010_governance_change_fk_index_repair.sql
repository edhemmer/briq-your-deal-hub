-- Specification 010 Slice 4 repair: add leading-column indexes for FK paths
-- reported by the staging missing-FK-index audit.

create index if not exists idx_governance_change_propagations_accepted_by
  on public.governance_change_propagations(accepted_by)
  where accepted_by is not null;
create index if not exists idx_governance_change_propagations_category
  on public.governance_change_propagations(category);
create index if not exists idx_governance_change_propagations_created_by
  on public.governance_change_propagations(created_by)
  where created_by is not null;
create index if not exists idx_governance_change_propagations_source_evidence_id
  on public.governance_change_propagations(source_evidence_id)
  where source_evidence_id is not null;
create index if not exists idx_governance_change_propagations_triggering_event_id
  on public.governance_change_propagations(triggering_event_id)
  where triggering_event_id is not null;
create index if not exists idx_governance_change_propagations_updated_by
  on public.governance_change_propagations(updated_by)
  where updated_by is not null;
create index if not exists idx_governance_change_propagations_verification_state
  on public.governance_change_propagations(verification_state);

create index if not exists idx_governance_downstream_proposals_created_by
  on public.governance_downstream_proposals(created_by)
  where created_by is not null;
create index if not exists idx_governance_downstream_proposals_source_evidence_id
  on public.governance_downstream_proposals(source_evidence_id)
  where source_evidence_id is not null;
create index if not exists idx_governance_downstream_proposals_updated_by
  on public.governance_downstream_proposals(updated_by)
  where updated_by is not null;
