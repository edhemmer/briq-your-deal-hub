-- Spec 009 Slice 1 follow-up hardening.
-- Keep FinanceIQ's server-owned RPC surface callable by authenticated users only
-- and add covering indexes for new FinanceIQ foreign keys surfaced by advisors.

revoke execute on function public.create_financing_structure(uuid, jsonb, text) from public, anon;
revoke execute on function public.update_financing_structure(uuid, jsonb, integer, text) from public, anon;
revoke execute on function public.select_active_financing_structure(uuid, integer, text) from public, anon;
revoke execute on function public.archive_financing_structure(uuid, integer, text, text) from public, anon;
revoke execute on function public.upsert_capital_source(uuid, jsonb, integer, text) from public, anon;
revoke execute on function public.upsert_debt_tranche(uuid, jsonb, integer, text) from public, anon;
revoke execute on function public.upsert_equity_tranche(uuid, jsonb, integer, text) from public, anon;
revoke execute on function public.list_financing_structure_projection(uuid) from public, anon;
revoke execute on function public.load_financing_structure_detail(uuid) from public, anon;

grant execute on function public.create_financing_structure(uuid, jsonb, text) to authenticated;
grant execute on function public.update_financing_structure(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.select_active_financing_structure(uuid, integer, text) to authenticated;
grant execute on function public.archive_financing_structure(uuid, integer, text, text) to authenticated;
grant execute on function public.upsert_capital_source(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.upsert_debt_tranche(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.upsert_equity_tranche(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.list_financing_structure_projection(uuid) to authenticated;
grant execute on function public.load_financing_structure_detail(uuid) to authenticated;

create index if not exists idx_financing_structures_workspace_deal_fk on public.financing_structures(workspace_id, deal_id);
create index if not exists idx_financing_structures_status_fk on public.financing_structures(status);
create index if not exists idx_financing_structures_verification_state_fk on public.financing_structures(verification_state);
create index if not exists idx_financing_structures_source_classification_fk on public.financing_structures(source_classification);
create index if not exists idx_financing_structures_source_evidence_fk on public.financing_structures(source_evidence_id) where source_evidence_id is not null;
create index if not exists idx_financing_structures_workspace_source_evidence_fk on public.financing_structures(workspace_id, source_evidence_id) where source_evidence_id is not null;
create index if not exists idx_financing_structures_source_record_fk on public.financing_structures(source_record_id) where source_record_id is not null;
create index if not exists idx_financing_structures_active_underwriting_snapshot_fk on public.financing_structures(active_underwriting_snapshot_id) where active_underwriting_snapshot_id is not null;
create index if not exists idx_financing_structures_supersedes_fk on public.financing_structures(supersedes_financing_structure_id) where supersedes_financing_structure_id is not null;
create index if not exists idx_financing_structures_superseded_by_fk on public.financing_structures(superseded_by_financing_structure_id) where superseded_by_financing_structure_id is not null;
create index if not exists idx_financing_structures_created_by_fk on public.financing_structures(created_by) where created_by is not null;
create index if not exists idx_financing_structures_updated_by_fk on public.financing_structures(updated_by) where updated_by is not null;

create index if not exists idx_capital_sources_provider_contact_fk on public.capital_sources(provider_contact_id) where provider_contact_id is not null;
create index if not exists idx_capital_sources_provider_organization_fk on public.capital_sources(provider_organization_id) where provider_organization_id is not null;
create index if not exists idx_capital_sources_source_classification_fk on public.capital_sources(source_classification);
create index if not exists idx_capital_sources_verification_state_fk on public.capital_sources(verification_state);
create index if not exists idx_capital_sources_source_evidence_fk on public.capital_sources(source_evidence_id) where source_evidence_id is not null;
create index if not exists idx_capital_sources_workspace_source_evidence_fk on public.capital_sources(workspace_id, source_evidence_id) where source_evidence_id is not null;
create index if not exists idx_capital_sources_source_record_fk on public.capital_sources(source_record_id) where source_record_id is not null;
create index if not exists idx_capital_sources_created_by_fk on public.capital_sources(created_by) where created_by is not null;
create index if not exists idx_capital_sources_updated_by_fk on public.capital_sources(updated_by) where updated_by is not null;

create index if not exists idx_debt_tranches_workspace_structure_fk on public.debt_tranches(workspace_id, financing_structure_id);
create index if not exists idx_debt_tranches_capital_source_fk on public.debt_tranches(workspace_id, financing_structure_id, capital_source_id) where capital_source_id is not null;
create index if not exists idx_debt_tranches_lender_contact_fk on public.debt_tranches(lender_contact_id) where lender_contact_id is not null;
create index if not exists idx_debt_tranches_lender_organization_fk on public.debt_tranches(lender_organization_id) where lender_organization_id is not null;
create index if not exists idx_debt_tranches_source_classification_fk on public.debt_tranches(source_classification);
create index if not exists idx_debt_tranches_verification_state_fk on public.debt_tranches(verification_state);
create index if not exists idx_debt_tranches_source_evidence_fk on public.debt_tranches(source_evidence_id) where source_evidence_id is not null;
create index if not exists idx_debt_tranches_workspace_source_evidence_fk on public.debt_tranches(workspace_id, source_evidence_id) where source_evidence_id is not null;
create index if not exists idx_debt_tranches_source_record_fk on public.debt_tranches(source_record_id) where source_record_id is not null;
create index if not exists idx_debt_tranches_created_by_fk on public.debt_tranches(created_by) where created_by is not null;
create index if not exists idx_debt_tranches_updated_by_fk on public.debt_tranches(updated_by) where updated_by is not null;

create index if not exists idx_equity_tranches_workspace_structure_fk on public.equity_tranches(workspace_id, financing_structure_id);
create index if not exists idx_equity_tranches_capital_source_fk on public.equity_tranches(workspace_id, financing_structure_id, capital_source_id) where capital_source_id is not null;
create index if not exists idx_equity_tranches_contributor_contact_fk on public.equity_tranches(contributor_contact_id) where contributor_contact_id is not null;
create index if not exists idx_equity_tranches_contributor_organization_fk on public.equity_tranches(contributor_organization_id) where contributor_organization_id is not null;
create index if not exists idx_equity_tranches_source_classification_fk on public.equity_tranches(source_classification);
create index if not exists idx_equity_tranches_verification_state_fk on public.equity_tranches(verification_state);
create index if not exists idx_equity_tranches_source_evidence_fk on public.equity_tranches(source_evidence_id) where source_evidence_id is not null;
create index if not exists idx_equity_tranches_workspace_source_evidence_fk on public.equity_tranches(workspace_id, source_evidence_id) where source_evidence_id is not null;
create index if not exists idx_equity_tranches_source_record_fk on public.equity_tranches(source_record_id) where source_record_id is not null;
create index if not exists idx_equity_tranches_created_by_fk on public.equity_tranches(created_by) where created_by is not null;
create index if not exists idx_equity_tranches_updated_by_fk on public.equity_tranches(updated_by) where updated_by is not null;

create index if not exists idx_financing_structure_versions_workspace_id_fk on public.financing_structure_versions(workspace_id);
create index if not exists idx_financing_structure_versions_workspace_deal_fk on public.financing_structure_versions(workspace_id, deal_id);
create index if not exists idx_financing_structure_versions_changed_by_fk on public.financing_structure_versions(changed_by) where changed_by is not null;
