-- Repair staging function body produced by an overly broad email hash rename.
-- Fresh databases already keep email_body_hash as the VALUES expression, so this
-- migration is intentionally idempotent.

do $$
declare
  target_definition text;
begin
  target_definition := pg_get_functiondef('public.record_email_intake_result(uuid,text,jsonb,jsonb,jsonb)'::regprocedure);
  target_definition := replace(
    target_definition,
$needle$
      body_hash,
      nullif(safe_meta ->> 'plainTextBody', ''),
$needle$,
$replacement$
      email_body_hash,
      nullif(safe_meta ->> 'plainTextBody', ''),
$replacement$
  );

  execute target_definition;
end;
$$;
