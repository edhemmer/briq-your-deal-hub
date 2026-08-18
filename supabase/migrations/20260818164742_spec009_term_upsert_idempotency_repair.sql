-- Spec 009 staging smoke repair: child term upserts must not treat a new
-- idempotency request's empty result object as a completed retry.

do $$
declare
  target_signature regprocedure;
  target_definition text;
  replacements jsonb := jsonb_build_array(
    jsonb_build_object(
      'signature', 'public.upsert_capital_source(uuid,jsonb,integer,text)',
      'needle', 'if command.result is not null then',
      'replacement', 'if command.result ? ''capital_source_id'' then'
    ),
    jsonb_build_object(
      'signature', 'public.upsert_debt_tranche(uuid,jsonb,integer,text)',
      'needle', 'if command.result is not null then',
      'replacement', 'if command.result ? ''debt_tranche_id'' then'
    ),
    jsonb_build_object(
      'signature', 'public.upsert_equity_tranche(uuid,jsonb,integer,text)',
      'needle', 'if command.result is not null then',
      'replacement', 'if command.result ? ''equity_tranche_id'' then'
    )
  );
  replacement jsonb;
begin
  for replacement in select * from jsonb_array_elements(replacements) loop
    target_signature := (replacement ->> 'signature')::regprocedure;
    target_definition := pg_get_functiondef(target_signature);

    if position(replacement ->> 'needle' in target_definition) = 0 then
      raise exception 'Expected idempotency guard was not found for %.', replacement ->> 'signature';
    end if;

    target_definition := replace(
      target_definition,
      replacement ->> 'needle',
      replacement ->> 'replacement'
    );

    execute target_definition;
  end loop;
end;
$$;
