-- Spec 009 final gate: classify-and-repair active pre-existing PL/pgSQL lint findings.
-- These functions belong to Specs 001-008 active canonical paths. The repair is
-- intentionally narrow: recompile the existing function definitions with
-- #variable_conflict use_column so unqualified SQL names prefer table columns
-- when they collide with output variables or parameters.

do $$
declare
  target_identity text;
  target_oid oid;
  target_definition text;
begin
  foreach target_identity in array array[
    'public.record_source_conflict(uuid,text,jsonb)',
    'public.record_source_conflict_resolution(uuid,text,text,jsonb)',
    'public.create_underwriting_snapshot(uuid,uuid,text,jsonb)',
    'public.create_underwriting_core_output_run(uuid,uuid,uuid,text,text,jsonb)',
    'public.create_underwriting_scenario_run(uuid,uuid,uuid,uuid,text,text,text,jsonb)',
    'public.create_underwriting_sensitivity_run(uuid,uuid,uuid,uuid,text,text,text,jsonb)',
    'public.record_email_intake_result(uuid,text,jsonb,jsonb,jsonb)',
    'public.record_file_evidence_intake_result(uuid,text,jsonb,jsonb)',
    'public.attach_file_evidence_to_deal(uuid,uuid,uuid,uuid,uuid)',
    'public.attach_email_source_to_deal(uuid,uuid,uuid,uuid,uuid)',
    'public.complete_manual_property_intake(uuid,text,jsonb,text,uuid)',
    'public.record_listing_url_import_result(uuid,uuid,uuid,jsonb,jsonb)',
    'public.record_intake_batch_review(uuid,text,jsonb,jsonb)',
    'public.record_duplicate_decision(uuid,text,jsonb)',
    'public.record_source_classification(uuid,text,text,uuid,jsonb)',
    'public.create_brix_contact(uuid,jsonb,text)',
    'public.create_brix_organization(uuid,jsonb,text)',
    'public.attach_contact_to_deal(uuid,uuid,jsonb,text)',
    'public.attach_organization_to_deal(uuid,uuid,jsonb,text)',
    'public.list_deal_relationships(uuid)',
    'public.load_brix_contact(uuid)',
    'public.load_brix_organization(uuid)',
    'public.list_deal_work(uuid)'
  ]
  loop
    target_oid := target_identity::regprocedure::oid;
    target_definition := pg_get_functiondef(target_oid);

    if position('#variable_conflict use_column' in target_definition) = 0 then
      target_definition := regexp_replace(
        target_definition,
        '(AS \$function\$\s*)',
        E'\\1#variable_conflict use_column\n',
        'n'
      );
    end if;

    execute target_definition;
  end loop;
end;
$$;

alter function public.safe_event_jsonb(jsonb) stable;
alter function public.normalize_manual_location(jsonb) stable;
