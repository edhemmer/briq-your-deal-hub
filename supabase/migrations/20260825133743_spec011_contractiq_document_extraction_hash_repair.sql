-- Specification 011 Slice 2 repair: staging initially received the analysis
-- functions with pgcrypto digest() calls and search_path = public. Keep the
-- functions security-definer and fixed-path while exposing the trusted
-- Supabase extensions schema that contains pgcrypto.

alter function public.start_contract_analysis_run(uuid, jsonb, text) set search_path = public, extensions;
alter function public.complete_contract_analysis_run(uuid, jsonb, integer, text) set search_path = public, extensions;
alter function public.record_contract_extraction_item(uuid, jsonb, text) set search_path = public, extensions;

revoke execute on function public.start_contract_analysis_run(uuid, jsonb, text) from public, anon;
revoke execute on function public.complete_contract_analysis_run(uuid, jsonb, integer, text) from public, anon;
revoke execute on function public.record_contract_extraction_item(uuid, jsonb, text) from public, anon;
grant execute on function public.start_contract_analysis_run(uuid, jsonb, text) to authenticated;
grant execute on function public.complete_contract_analysis_run(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.record_contract_extraction_item(uuid, jsonb, text) to authenticated;
