-- Native iOS App Store required functionality support.
-- Exposes mobile-safe decision snapshots through a RLS-aware view consumed by the iOS app.

CREATE OR REPLACE VIEW public.mobile_decision_snapshots
WITH (security_invoker = true)
AS
SELECT
  bd.id,
  bd.deal_id,
  bd.recommendation_class AS recommendation,
  CASE lower(bd.confidence_level)
    WHEN 'high' THEN 85
    WHEN 'moderate' THEN 70
    WHEN 'medium' THEN 70
    WHEN 'low' THEN 50
    ELSE GREATEST(0, LEAST(100, bd.trust_score))
  END AS confidence,
  bd.trust_score,
  bd.decision_readiness_score AS readiness_score,
  COALESCE(
    CASE
      WHEN jsonb_typeof(bd.key_risks) = 'array' AND jsonb_array_length(bd.key_risks) > 0
        THEN COALESCE(bd.key_risks->0->>'risk', bd.key_risks->0->>'title', bd.key_risks->>0)
      ELSE NULL
    END,
    'Review risks and missing information before relying on this recommendation.'
  ) AS primary_risk,
  COALESCE(
    CASE
      WHEN jsonb_typeof(bd.next_actions) = 'array' AND jsonb_array_length(bd.next_actions) > 0
        THEN COALESCE(bd.next_actions->0->>'action', bd.next_actions->0->>'title', bd.next_actions->>0)
      ELSE NULL
    END,
    'Open DealIQ and complete required verification.'
  ) AS next_action,
  bd.recommendation_summary AS evidence_summary,
  bd.created_at,
  bd.updated_at
FROM public.brix_decisions bd;

GRANT SELECT ON public.mobile_decision_snapshots TO authenticated;

-- Ensure the iOS field-capture endpoint has the private bucket it writes to.
INSERT INTO storage.buckets (id, name, public)
VALUES ('field-captures', 'field-captures', false)
ON CONFLICT (id) DO NOTHING;
