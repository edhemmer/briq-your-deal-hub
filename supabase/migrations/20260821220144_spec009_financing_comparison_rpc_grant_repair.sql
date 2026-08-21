-- Specification 009 Slice 4 repair: default function grants.
-- Supabase/Postgres grants EXECUTE broadly by default. Keep the helper private,
-- deny anon on all Slice 4 functions, and expose only workspace-authorized RPCs
-- to authenticated users.

revoke all on function public.financeiq_comparison_feasibility_rank(text) from public, anon, authenticated;
revoke all on function public.compare_financing_structures(uuid, uuid[], text[], timestamptz, text, text, uuid) from public, anon, authenticated;
revoke all on function public.load_financing_comparison(uuid) from public, anon, authenticated;

grant execute on function public.compare_financing_structures(uuid, uuid[], text[], timestamptz, text, text, uuid) to authenticated;
grant execute on function public.load_financing_comparison(uuid) to authenticated;
