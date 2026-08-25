select
  (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'contract_analysis_runs',
        'contract_extraction_items',
        'contract_party_match_proposals',
        'contract_base_match_candidates',
        'contract_supersession_candidates'
      )
  ) as rls_policy_count,
  (
    select count(*)
    from pg_proc proc
    join pg_namespace namespace on namespace.oid = proc.pronamespace
    where namespace.nspname = 'public'
      and proc.proname in (
        'start_contract_analysis_run',
        'complete_contract_analysis_run',
        'record_contract_document_classification',
        'record_contract_extraction_item',
        'propose_contract_party_match',
        'propose_contract_base_match',
        'record_contract_supersession_candidate',
        'mark_contract_analysis_stale'
      )
      and has_function_privilege('anon', proc.oid, 'EXECUTE')
  ) as anon_executable_count,
  (
    select count(*)
    from pg_indexes
    where schemaname = 'public'
      and indexname in (
        'idx_contract_analysis_runs_workspace_fk',
        'idx_contract_analysis_runs_evidence_fk',
        'idx_contract_analysis_runs_prior_fk',
        'idx_contract_extraction_items_workspace_fk',
        'idx_contract_extraction_items_evidence_fk',
        'idx_contract_extraction_items_run_fk',
        'idx_contract_extraction_items_verification_state_fk',
        'idx_contract_extraction_items_applicable_perspective_fk',
        'idx_contract_party_match_workspace_fk',
        'idx_contract_party_match_contact_fk',
        'idx_contract_party_match_org_fk',
        'idx_contract_party_match_status_fk',
        'idx_contract_base_match_workspace_fk',
        'idx_contract_base_match_base_fk',
        'idx_contract_base_match_status_fk',
        'idx_contract_supersession_workspace_fk',
        'idx_contract_supersession_old_term_fk',
        'idx_contract_supersession_replacement_term_fk',
        'idx_contract_supersession_status_fk'
      )
  ) as slice2_fk_index_count;
