# Supabase Rebuild Log

Date: 2026-06-18

## New Project

- Project name: BRIX Real Estate
- Project ref: `luwaqrkhmxcqsozmilbw`
- Supabase URL: `https://luwaqrkhmxcqsozmilbw.supabase.co`
- Region: `us-west-2`
- Status observed from CLI: `ACTIVE_HEALTHY`

## Local Changes

- Updated `supabase/config.toml` to `project_id = "luwaqrkhmxcqsozmilbw"`.
- Updated `.env` to the new Supabase URL, project ref, and publishable key.
- Updated `.env.example` with the new URL/project ref placeholders and Edge Function secret names.
- Regenerated `src/integrations/supabase/types.ts` from the rebuilt remote database.

## Database

Applied all migrations to the new project with:

```powershell
.\.supabase-cli\supabase.exe db push
```

Applied migration set:

- Existing BRIX foundation migrations from 2026-03-08 through 2026-04-27
- `20260618101500_brix_os_apple_compliance.sql`

Confirmed by remote type generation that the new database includes:

- `profiles`
- `deals`
- `contracts`
- `market_conditions`
- `user_roles`
- `admin_audit_log`
- `account_deletion_requests`
- `property_digital_twins`
- `brix_decisions`
- `brix_field_captures`
- `brix_visual_scope_items`
- `brix_project_tasks`
- `brix_portfolio_snapshots`

## Edge Functions

Deployed to project `luwaqrkhmxcqsozmilbw`:

- `extract-contract-from-document`
- `extract-deal-from-image`
- `extract-deal-from-text`
- `fetch-bls-employment`
- `fetch-fred-series`
- `fetch-census-acs`
- `geocode-address`
- `request-account-deletion`

Dashboard:

`https://supabase.com/dashboard/project/luwaqrkhmxcqsozmilbw/functions`

## Smoke Checks

REST schema check:

- `GET /rest/v1/property_digital_twins?select=id&limit=1`
- Result: `[]`
- Meaning: new BRIX OS table exists and is reachable with the new project URL/key.

Account deletion function:

- `POST /functions/v1/request-account-deletion`
- Result: `401 {"error":"Invalid session"}`
- Meaning: function is deployed and correctly rejects unauthenticated deletion.

Extraction function:

- `POST /functions/v1/extract-deal-from-text` with intentionally short text
- Result: `400 {"error":"Please paste more listing text"}`
- Meaning: function is deployed and validating input.

Frontend build:

```powershell
node .\node_modules\vite\bin\vite.js build
```

Result: passed.

## Live Provider Configuration

Current configured provider foundation:

- `OPENAI_API_KEY` for AI extraction.
- `FRED_API_KEY` for mortgage and macro-rate series.
- `CENSUS_API_KEY` for Census ACS data.
- BLS is intentionally allowed to run without `BLS_API_KEY` because the public API path works for beta usage.

Optional future secrets:

- `AI_GATEWAY_API_KEY` if BRIX moves from direct OpenAI-compatible calls to an AI gateway.
- `AI_GATEWAY_BASE_URL` if using a non-default OpenAI-compatible gateway.
- `AI_TEXT_MODEL`
- `AI_VISION_MODEL`
- `AI_CONTRACT_MODEL`
- `BLS_API_KEY` if validated key-based quota is needed.

Reliability note:

- `extract-deal-from-text` falls back to deterministic low-confidence parsing when AI is unavailable.
- `extract-contract-from-document` falls back to deterministic low-confidence term parsing when AI is unavailable.
- `extract-deal-from-image` still requires AI vision or future OCR support; users should paste listing text/URL when image extraction is unavailable.

Configure Apple provider in Supabase Auth before App Store submission:

- Apple Team ID
- Bundle ID: `com.brix.realestate.ios`
- Services ID / client secret if OAuth flow is used
- Callback URL: `https://luwaqrkhmxcqsozmilbw.supabase.co/auth/v1/callback`

Also configure production auth URLs and redirect URLs for the deployed web app/iOS app once final domains are known.

Production domain:

- `https://brixrealestate.app`
