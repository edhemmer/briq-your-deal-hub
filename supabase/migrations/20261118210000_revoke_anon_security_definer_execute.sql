-- Defense in depth: signed-out (anon) callers must not be able to execute
-- SECURITY DEFINER functions in the exposed public schema.
--
-- Every function below already rejects unauthenticated callers internally
-- (verified: list_deal_projection raises 42501 "Authentication required" as anon),
-- so this removes attack surface without changing signed-in behavior.
--
-- Grants for `authenticated` and `service_role` are preserved exactly as they were:
-- if a role could execute a function before (directly or via PUBLIC), it is granted
-- explicitly after PUBLIC is revoked. Functions that earlier migrations deliberately
-- restricted from `authenticated` stay restricted.

do $$
declare
  fn record;
  had_authenticated boolean;
  had_service_role boolean;
begin
  for fn in
    select p.oid, p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and has_function_privilege('anon', p.oid, 'execute')
  loop
    had_authenticated := has_function_privilege('authenticated', fn.oid, 'execute');
    had_service_role := has_function_privilege('service_role', fn.oid, 'execute');

    execute format('revoke execute on function %s from public, anon', fn.signature);

    if had_authenticated then
      execute format('grant execute on function %s to authenticated', fn.signature);
    end if;
    if had_service_role then
      execute format('grant execute on function %s to service_role', fn.signature);
    end if;
  end loop;
end $$;

-- Future functions created by migrations no longer default to anon/PUBLIC execute.
-- Supabase's own default grants to `authenticated` and `service_role` remain.
alter default privileges for role postgres in schema public revoke execute on functions from public;
alter default privileges for role postgres in schema public revoke execute on functions from anon;
