-- 1) user_roles: explicitly deny INSERT/UPDATE/DELETE from clients (admins manage roles via service role)
CREATE POLICY "No client inserts on user_roles"
  ON public.user_roles FOR INSERT TO authenticated, anon
  WITH CHECK (false);

CREATE POLICY "No client updates on user_roles"
  ON public.user_roles FOR UPDATE TO authenticated, anon
  USING (false) WITH CHECK (false);

CREATE POLICY "No client deletes on user_roles"
  ON public.user_roles FOR DELETE TO authenticated, anon
  USING (false);

-- 2) profiles: explicitly block all client deletes (no policy = deny under RLS, but make it explicit)
CREATE POLICY "No client deletes on profiles"
  ON public.profiles FOR DELETE TO authenticated, anon
  USING (false);

-- 3) contract-uploads storage: add UPDATE policy scoped to file owner (matches existing select/insert/delete)
CREATE POLICY "Users can update own contract uploads"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'contract-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'contract-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );