-- Specification 010 Slice 1 repair: GovernanceIQ helper/trigger functions are
-- internal implementation details and must not be directly callable by clients.

revoke execute on function public.validate_governance_scope() from public, anon, authenticated;
revoke execute on function public.record_governance_version() from public, anon, authenticated;
revoke execute on function public.ensure_governance_command(uuid, uuid, uuid, uuid, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.authorized_governance_record(uuid) from public, anon, authenticated;
