-- Spec 010 Slice 3 repair: add the remaining covering FK index.

create index if not exists idx_governance_restriction_intelligence_results_verification_state_fk
  on public.governance_restriction_intelligence_results(verification_state);
