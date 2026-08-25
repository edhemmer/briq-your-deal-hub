-- Specification 010 Slice 4 repair: align new propagation tables with the
-- existing touch_versioned_record trigger contract.

alter table public.governance_change_propagations
  add column if not exists version integer not null default 1 check (version > 0);

alter table public.governance_downstream_proposals
  add column if not exists version integer not null default 1 check (version > 0);
