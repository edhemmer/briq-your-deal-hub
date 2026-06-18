# Supabase Ownership Migration

This app should run against a Supabase project owned by BRIX, not a Lovable-managed backend, before Lovable is cancelled or removed from the critical path.

## Current State

- The repo contains Supabase migrations in `supabase/migrations`.
- The repo contains Edge Functions in `supabase/functions`.
- The frontend reads Supabase connection values from `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- The current `supabase/config.toml` points to the rebuilt BRIX-owned project ref:

```toml
project_id = "luwaqrkhmxcqsozmilbw"
```

Rebuild details are tracked in `docs/SUPABASE_REBUILD_LOG.md`.

## New Project Setup Checklist

1. In Supabase, open the `BRIX Real Estate` project.
2. Copy the project ref from the dashboard URL:

```text
https://supabase.com/dashboard/project/<project-ref>
```

3. Update `supabase/config.toml`:

```toml
project_id = "<project-ref>"
```

4. In Supabase Project Settings -> API, copy:

```env
VITE_SUPABASE_URL=https://luwaqrkhmxcqsozmilbw.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
```

5. Put those values in the frontend deployment environment, and in local `.env.local` for local development.
6. In Supabase Edge Function secrets, add backend-only secrets:

```env
FRED_API_KEY=<fred-key>
LOVABLE_API_KEY=<only if still using Lovable AI extraction>
GOOGLE_MAPS_API_KEY=<if geocoding requires direct Google fallback>
BLS_API_KEY=<optional; BLS can work without one but key improves reliability>
CENSUS_API_KEY=<required for Census calls>
```

Do not prefix backend secrets with `VITE_`.

## GitHub Integration

Supabase GitHub integration can deploy from the repo when the `supabase/` folder is present.

Expected deployment inputs:

- Database migrations: `supabase/migrations`
- Edge Functions: `supabase/functions`
- Supabase config: `supabase/config.toml`

Supabase docs state that migrations in the `migrations` subdirectory are automatically run, and Edge Functions declared/configured through the Supabase config are deployed by the GitHub integration.

## Data Migration

Before switching production users:

1. Export existing data from the Lovable-managed backend if access is available.
2. Import data into the BRIX-owned Supabase project.
3. Confirm these tables exist and have RLS policies applied:

- `profiles`
- `deals`
- `market_conditions`
- `contracts`
- `admin_audit_log`
- `user_roles`

4. Recreate auth users if direct auth export is not available.
5. Validate saved deals can be created, edited, deleted, and loaded from the new project.

## Cutover Test

Use a non-production branch or preview deployment first.

1. Point the frontend env vars to the new Supabase project.
2. Sign up a new test user.
3. Create a deal.
4. Upload listing text and an image.
5. Run analysis.
6. Generate a PDF report.
7. Save and reopen the deal.
8. Call `fetch-fred-series` with `MORTGAGE30US`.
9. Confirm no calls are still hitting the Lovable-managed Supabase project.

## Do Not Cancel Lovable Until

- The new Supabase project owns the schema.
- Secrets are set in the new project.
- Edge Functions are deployed and tested.
- Frontend env vars point to the new project.
- Existing deal data has been exported or accepted as disposable.
- Login, saved deals, analysis, uploads, and reports work end to end.
