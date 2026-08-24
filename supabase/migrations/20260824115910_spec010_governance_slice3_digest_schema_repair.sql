-- Spec 010 Slice 3 repair: Supabase installs pgcrypto helpers in the
-- extensions schema, so deterministic hashes must qualify digest().

do $$
declare
  function_definition text;
begin
  select pg_get_functiondef('public.run_governance_financial_analysis(uuid,jsonb,text)'::regprocedure)
  into function_definition;
  execute replace(function_definition, 'encode(digest(', 'encode(extensions.digest(');

  select pg_get_functiondef('public.run_governance_restriction_intelligence(uuid,jsonb,text)'::regprocedure)
  into function_definition;
  execute replace(function_definition, 'encode(digest(', 'encode(extensions.digest(');
end $$;

revoke all on function public.run_governance_financial_analysis(uuid, jsonb, text) from public;
revoke all on function public.run_governance_restriction_intelligence(uuid, jsonb, text) from public;
revoke execute on function public.run_governance_financial_analysis(uuid, jsonb, text) from public, anon;
revoke execute on function public.run_governance_restriction_intelligence(uuid, jsonb, text) from public, anon;
grant execute on function public.run_governance_financial_analysis(uuid, jsonb, text) to authenticated;
grant execute on function public.run_governance_restriction_intelligence(uuid, jsonb, text) to authenticated;
