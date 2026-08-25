create or replace function public.load_contract_detail(target_contract_id uuid)
returns table (
  record_type text,
  record_id uuid,
  record_version integer,
  workspace_id uuid,
  contract_id uuid,
  deal_id uuid,
  property_id uuid,
  label text,
  status text,
  verification_state text,
  source_evidence_id uuid,
  source_anchor jsonb,
  payload jsonb,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_contract public.contracts%rowtype;
begin
  target_contract := public.authorized_contract(target_contract_id);
  return query
  select 'contract'::text, target_contract.id, target_contract.version, target_contract.workspace_id, target_contract.id, target_contract.deal_id, target_contract.property_id, target_contract.title, target_contract.status, target_contract.verification_state, target_contract.source_evidence_id, '{}'::jsonb, jsonb_build_object('title', target_contract.title, 'contract_type', target_contract.contract_type, 'perspective', target_contract.perspective, 'status', target_contract.status, 'verification_state', target_contract.verification_state, 'analysis_state', target_contract.analysis_state, 'confidence', target_contract.confidence, 'source_evidence_id', target_contract.source_evidence_id, 'effective_date', target_contract.effective_date, 'execution_date', target_contract.execution_date, 'expiration_date', target_contract.expiration_date, 'closing_date', target_contract.closing_date), target_contract.updated_at
  union all
  select 'evidence_link'::text, link.id, link.version, link.workspace_id, link.contract_id, target_contract.deal_id, target_contract.property_id, link.link_role, link.link_role, link.verification_state, link.evidence_id, link.source_anchor, to_jsonb(link.*) - 'workspace_id' - 'contract_id', link.updated_at
  from public.contract_evidence_links link where link.workspace_id = target_contract.workspace_id and link.contract_id = target_contract.id and link.archived_at is null
  union all
  select 'party'::text, party.id, party.version, party.workspace_id, party.contract_id, target_contract.deal_id, target_contract.property_id, party.display_name, party.party_role, party.verification_state, party.source_evidence_id, party.source_anchor, to_jsonb(party.*) - 'workspace_id' - 'contract_id', party.updated_at
  from public.contract_parties party where party.workspace_id = target_contract.workspace_id and party.contract_id = target_contract.id and party.archived_at is null
  union all
  select 'term'::text, term.id, term.version, term.workspace_id, term.contract_id, target_contract.deal_id, target_contract.property_id, term.title, term.proposal_state, term.verification_state, term.source_evidence_id, term.source_anchor, to_jsonb(term.*) - 'workspace_id' - 'contract_id', term.updated_at
  from public.contract_terms term where term.workspace_id = target_contract.workspace_id and term.contract_id = target_contract.id and term.archived_at is null
  union all
  select 'deadline'::text, deadline.id, deadline.version, deadline.workspace_id, deadline.contract_id, target_contract.deal_id, target_contract.property_id, deadline.deadline_type, deadline.status, deadline.verification_state, deadline.source_evidence_id, deadline.source_anchor, to_jsonb(deadline.*) - 'workspace_id' - 'contract_id', deadline.updated_at
  from public.contract_deadlines deadline where deadline.workspace_id = target_contract.workspace_id and deadline.contract_id = target_contract.id and deadline.archived_at is null
  union all
  select 'finding'::text, finding.id, finding.version, finding.workspace_id, finding.contract_id, target_contract.deal_id, target_contract.property_id, finding.summary, finding.proposal_state, finding.verification_state, finding.source_evidence_id, finding.source_anchor, to_jsonb(finding.*) - 'workspace_id' - 'contract_id', finding.updated_at
  from public.contract_findings finding where finding.workspace_id = target_contract.workspace_id and finding.contract_id = target_contract.id and finding.archived_at is null
  union all
  select 'conflict'::text, conflict.id, conflict.version, conflict.workspace_id, conflict.contract_id, target_contract.deal_id, target_contract.property_id, conflict.summary, conflict.resolution_state, case when conflict.professional_review_required then 'unknown' else 'source_backed' end, conflict.source_a_evidence_id, conflict.source_a_anchor, to_jsonb(conflict.*) - 'workspace_id' - 'contract_id', conflict.updated_at
  from public.contract_conflicts conflict where conflict.workspace_id = target_contract.workspace_id and conflict.contract_id = target_contract.id and conflict.archived_at is null
  union all
  select 'relationship'::text, relationship.id, relationship.version, relationship.workspace_id, relationship.contract_id, target_contract.deal_id, target_contract.property_id, relationship.relationship_type, relationship.relationship_type, relationship.verification_state, relationship.source_evidence_id, relationship.source_anchor, to_jsonb(relationship.*) - 'workspace_id' - 'contract_id', relationship.updated_at
  from public.contract_relationships relationship where relationship.workspace_id = target_contract.workspace_id and relationship.contract_id = target_contract.id and relationship.archived_at is null
  union all
  select 'change_proposal'::text, proposal.id, proposal.version, proposal.workspace_id, proposal.contract_id, target_contract.deal_id, target_contract.property_id, proposal.proposal_type, proposal.status, case when proposal.professional_review_required then 'unknown' else 'source_backed' end, proposal.source_evidence_id, proposal.source_anchor, to_jsonb(proposal.*) - 'workspace_id' - 'contract_id', proposal.updated_at
  from public.contract_change_proposals proposal where proposal.workspace_id = target_contract.workspace_id and proposal.contract_id = target_contract.id and proposal.archived_at is null
  union all
  select 'question'::text, question.id, question.version, question.workspace_id, question.contract_id, target_contract.deal_id, target_contract.property_id, question.question, question.status, question.resolution_state, question.source_evidence_id, question.source_anchor, to_jsonb(question.*) - 'workspace_id' - 'contract_id', question.updated_at
  from public.contract_questions question where question.workspace_id = target_contract.workspace_id and question.contract_id = target_contract.id and question.archived_at is null;
end;
$$;
