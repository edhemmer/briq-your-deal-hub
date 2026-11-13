# BRIX Supabase hibernation and reactivation

BRIX is currently on Supabase Free. **Do not pause or delete the active BRIX backend as part of this documentation change.** This is a future recovery procedure, not a production migration.

Source-controlled blueprint: `supabase/migrations/` (schema, SQL functions, triggers and RLS), `supabase/functions/` (Edge Functions), and `supabase/config.toml` (project configuration). These files need a clean-environment test before they can be treated as a complete restoration guarantee.

## Local rehearsal

1. Clone the repository and install Docker and the Supabase CLI.
2. Run `bash scripts/rebuild-supabase.sh test`. It starts local Supabase and runs `supabase db reset --local`, **deleting any local test data** and replaying tracked migrations.
3. Validate the resulting schema, RLS/workspace isolation, SQL functions, triggers, storage policies, and representative application flows. Compare with the current hosted schema for drift.
4. Log any missing migrations in source control and repeat the clean local replay.

## Reactivation to a NEW hosted project

1. Create a new Supabase project and get its project reference.
2. Run `bash scripts/rebuild-supabase.sh deploy NEW_PROJECT_REF` after checking the project reference. This links the repository, pushes SQL migrations and deploys Edge Functions.
3. Set up authentication URLs and providers, secrets (outside Git), email/SMS delivery, webhooks, cron jobs, storage buckets/objects, and any non-versioned settings.
4. Update Vercel and other app clients with the **new** Supabase URL and keys.
5. Test permissions, login, create/edit/save/reopen, uploads, Edge Functions, and error/retry behavior on web and iOS.

## Hibernation readiness — not yet verified

- [ ] Clean migration replay succeeds with no missing dependencies
- [ ] Hosted schema and checked-in migrations match
- [ ] Edge Functions deploy to an isolated test project
- [ ] RLS and cross-workspace access tests pass
- [ ] Secrets and external provider configuration documented securely
- [ ] Important data, Auth identities and uploaded files retained separately or confirmed disposable
- [ ] Hosting, apps and integrations that will stop working are identified
- [ ] End-to-end rebuild and reactivation tests pass

**No data is backed up by this procedure.** Deleted project data and Auth users do not automatically return. This runbook preserves the construction plan, not a copy of the live project. No live project should be deleted on the strength of this document alone.
