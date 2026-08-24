-- Spec 010 Slice 2 repair: preserve Slice 1's security-invoker posture after
-- the Slice 2 projection extension replaced the view.

alter view public.governance_record_projection set (security_invoker = true);
