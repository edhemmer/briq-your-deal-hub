-- Specification 010 Slice 4 repair: use valid Postgres array appends in the
-- GovernanceIQ impact-domain classifier.

create or replace function public.governance_impact_domains(category text, normalized_value jsonb, effective_at timestamptz, expires_at timestamptz)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  domains text[] := array['cockpit','reporting'];
  assessment_status text := upper(coalesce(normalized_value ->> 'assessmentStatus', normalized_value ->> 'status', ''));
begin
  if effective_at is not null and effective_at > now() then
    return to_jsonb(domains);
  end if;
  if expires_at is not null and expires_at <= now() then
    return '["none"]'::jsonb;
  end if;

  if category = 'dues' then
    domains := domains || array['underwriting'];
  elsif category = 'assessment' then
    if assessment_status in ('ADOPTED','BILLED','PAID') then
      domains := domains || array['underwriting'];
    else
      domains := domains || array['task_deadline'];
    end if;
  elsif category = 'insurance' then
    domains := domains || array['underwriting','finance'];
  elsif category in ('rental','short_term_rental','room_rental','occupancy','trailer','rv','boat','parking','commercial_vehicle','pickup_truck','architectural_approval','renovation','contractor_requirement','work_hours','materials_colors','entity_ownership') then
    domains := domains || array['strategy'];
    if category in ('architectural_approval','renovation') then
      domains := domains || array['task_deadline'];
    end if;
    if category = 'entity_ownership' then
      domains := domains || array['finance'];
    end if;
  elsif category in ('litigation','lender_requirement','governance_financing_risk','board_approval','right_of_first_refusal','transfer') then
    domains := domains || array['finance'];
    if category in ('board_approval','right_of_first_refusal') then
      domains := domains || array['task_deadline'];
    end if;
  end if;

  if array_length(domains, 1) = 2 then
    return '["none"]'::jsonb;
  end if;
  return (
    select jsonb_agg(value order by
      case value
        when 'underwriting' then 10
        when 'strategy' then 20
        when 'finance' then 30
        when 'cockpit' then 40
        when 'task_deadline' then 50
        when 'reporting' then 60
        else 70
      end)
    from (select distinct unnest(domains) as value) ordered
  );
end;
$$;

revoke all on function public.governance_impact_domains(text, jsonb, timestamptz, timestamptz) from public, anon, authenticated;
