-- Storage bucket for contract source documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('contract-uploads', 'contract-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: users can only access files in their own folder (first path segment = user id)
CREATE POLICY "Users can view own contract uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'contract-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own contract files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'contract-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own contract uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'contract-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Provenance columns on contracts
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS source_files jsonb,
  ADD COLUMN IF NOT EXISTS extraction_meta jsonb,
  ADD COLUMN IF NOT EXISTS extraction_confidence jsonb;