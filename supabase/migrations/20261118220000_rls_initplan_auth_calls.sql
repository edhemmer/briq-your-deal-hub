-- Performance: evaluate auth.uid()/auth.jwt()/auth.role() once per query instead of once per row.
--
-- Supabase advisor lint 0003 (auth_rls_initplan) flagged 73 public RLS policies that call auth
-- functions directly. Wrapping each call as (select auth.<fn>()) lets Postgres hoist it into an
-- InitPlan. The security meaning of every policy is unchanged: only the call form is rewritten,
-- and already-wrapped calls are left alone.
-- https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

do $$
declare
  pol record;
  new_qual text;
  new_check text;
  stmt text;
begin
  for pol in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and coalesce(qual, '') || coalesce(with_check, '') ~ '(?<!SELECT )auth\.(uid|jwt|role)\(\)'
  loop
    new_qual := regexp_replace(pol.qual, '(?<!SELECT )auth\.(uid|jwt|role)\(\)', '(select auth.\1())', 'g');
    new_check := regexp_replace(pol.with_check, '(?<!SELECT )auth\.(uid|jwt|role)\(\)', '(select auth.\1())', 'g');
    stmt := format('alter policy %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    if pol.qual is not null then
      stmt := stmt || format(' using (%s)', new_qual);
    end if;
    if pol.with_check is not null then
      stmt := stmt || format(' with check (%s)', new_check);
    end if;
    execute stmt;
  end loop;
end $$;
