-- PostgreSQL classifies locale-aware text normalization and JSON assembly as
-- stable. Match the helper declarations to the expressions they contain.
alter function public.contractiq_full_report_section_for(text, jsonb) stable;

create or replace function public.contractiq_full_report_source_refs(item_kind text, item jsonb)
returns jsonb
language plpgsql
stable
parallel safe
set search_path = public, pg_temp
as $$
declare
  record_id text;
  record_version integer;
  record_type text;
begin
  if jsonb_typeof(item -> 'sourceRefs') = 'array' and jsonb_array_length(item -> 'sourceRefs') > 0 then
    return item -> 'sourceRefs';
  end if;
  if item_kind = 'conflict' then
    return coalesce((
      select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'evidenceId', source_side ->> 'evidenceId',
        'documentId', source_side ->> 'contractId',
        'sourceAnchor', case when coalesce(source_side -> 'sourceAnchor','{}'::jsonb) <> '{}'::jsonb then source_side -> 'sourceAnchor' end,
        'recordType', 'conflict',
        'recordId', item ->> 'conflictId',
        'recordVersion', coalesce(nullif(item ->> 'version','')::integer, 1),
        'verificationState', coalesce(item ->> 'resolutionState', 'unresolved')
      )))
      from jsonb_array_elements(jsonb_build_array(item -> 'sourceA', item -> 'sourceB')) source_side
      where source_side is not null
        and source_side <> 'null'::jsonb
        and (
          nullif(source_side ->> 'evidenceId','') is not null
          or nullif(source_side ->> 'contractId','') is not null
          or coalesce(source_side -> 'sourceAnchor','{}'::jsonb) <> '{}'::jsonb
        )
    ), '[]'::jsonb);
  end if;
  record_id := coalesce(item ->> 'contractId', item ->> 'contractEvidenceLinkId', item ->> 'partyId', item ->> 'termId', item ->> 'deadlineId', item ->> 'findingId', item ->> 'conflictId', item ->> 'questionId', item ->> 'amendmentImpactId', item ->> 'proposalId', item ->> 'itemId');
  record_version := coalesce(nullif(item ->> 'version','')::integer, nullif(item ->> 'deadlineVersion','')::integer, nullif(item ->> 'calculationVersion','')::integer, 1);
  record_type := case item_kind when 'term' then 'term' when 'finding' then 'finding' when 'conflict' then 'conflict' when 'deadline' then 'deadline' when 'question' then 'question' when 'party' then 'party' when 'external_research' then 'external_research' when 'cross_module' then 'cross_module' else 'contract' end;
  if record_id is null or (
    nullif(coalesce(item ->> 'evidenceId', item ->> 'sourceEvidenceId'),'') is null
    and item_kind <> 'document'
    and coalesce(item -> 'sourceAnchor', item -> 'responseAnchor', '{}'::jsonb) = '{}'::jsonb
  ) then return '[]'::jsonb; end if;
  return jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
    'evidenceId', coalesce(item ->> 'evidenceId', item ->> 'sourceEvidenceId'),
    'documentId', case when item_kind = 'document' then item ->> 'contractId' else null end,
    'sourceAnchor', coalesce(item -> 'sourceAnchor', item -> 'responseAnchor'),
    'recordType', record_type,
    'recordId', record_id,
    'recordVersion', record_version,
    'verificationState', coalesce(item ->> 'verificationState', item ->> 'status', 'snapshot_frozen')
  )));
end;
$$;
