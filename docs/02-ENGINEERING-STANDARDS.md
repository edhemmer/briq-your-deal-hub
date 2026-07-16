# BRIX Real Estate — Engineering Standards

## 1. Authority

These standards govern the BRIX rebuild. They apply to web, Supabase, shared packages, native iPhone, native iPad, reports, exports, admin, CI/CD, and operations.

## 2. Architecture laws

1. One canonical repository.
2. One canonical Supabase backend.
3. One canonical Deal model.
4. One canonical Property model.
5. One canonical deterministic financial engine.
6. One canonical strategy registry.
7. One canonical evidence and audit model.
8. No competing client-side business engines.
9. No hidden local-only production state.
10. No duplicate schemas, parsers, calculators, or background workflows.

## 3. Required boundaries

### Clients

Web, iPhone, and iPad own presentation, interaction, local drafts, offline queues, and platform-specific capabilities. They do not own authoritative calculations, authorization, workspace isolation, or permanent business truth.

### Backend

Supabase Postgres, RLS, Storage, and Edge Functions own persistence, authorization, canonical validation, deterministic calculations, versioning, domain events, background workflow state, and protected provider integrations.

### Shared contracts

All clients and services must use versioned contracts for canonical entities, enums, calculation requests, calculation results, job states, and errors.

## 4. Required repository quality

- TypeScript strict mode
- Explicit domain types
- No `any` in canonical contracts without documented exception
- Swift concurrency safety
- Version-controlled migrations
- Environment separation
- Feature flags for incomplete work
- Structured logging
- Correlation IDs
- Idempotency keys for retryable writes and jobs
- Optimistic concurrency for material records
- No secrets in browser or iOS
- No service-role key in clients
- No production behavior that depends on mock data

## 5. Canonical data path

Every material workflow must implement and document:

`User action → client validation → authenticated boundary → server authorization → canonical persistence → domain logic → versioned output → domain event/audit → client refresh → report/export dependency`

A workflow is incomplete if any step is missing or exists only in the UI.

## 6. Background work standard

Uploads, extraction, image analysis, transcription, underwriting, strategy ranking, market retrieval, report generation, email ingestion, notifications, and sync jobs must have durable state.

Minimum states:

- Queued
- Running
- Awaiting input
- Complete
- Partially complete
- Failed
- Retry scheduled
- Blocked
- Cancelled
- Superseded

Every job must include:

- Job ID
- Workspace ID
- Deal ID where applicable
- Job type
- Input version
- Idempotency key
- Attempt count
- Started and completed timestamps
- Provider metadata where applicable
- Error class
- User-safe error message
- Correlation ID
- Output references

Jobs must not fail silently or remain indefinitely in a generic processing state.

## 7. Freshness and consistency

- Every material output carries an `as_of` timestamp.
- Underwriting references the exact assumption-set version.
- Strategy rankings reference the exact underwriting version.
- Recommendations reference exact evidence, risk, and ranking versions.
- Reports reference the versions used to generate them.
- Stale outputs remain visible only when clearly labeled stale.
- Newer results cannot be overwritten by older retries.
- Conflicts must be detected before overwrite.
- Web and iOS must reconcile to the same canonical state.

## 8. Error standard

Errors must identify:

- What failed
- What data was preserved
- Whether the Deal decision is affected
- Whether retry is safe
- The next recovery action
- A support reference when appropriate

Do not expose secrets, raw stack traces, provider credentials, SQL, or internal-only details.

Distinguish:

- Validation error
- Authentication error
- Authorization error
- Conflict
- Offline condition
- Timeout
- Provider outage
- Rate limit
- Processing failure
- Internal error

## 9. Security standard

- Enforce workspace isolation through RLS and server authorization.
- Test cross-workspace denial.
- Use signed or authenticated file access.
- Isolate Storage paths by workspace and canonical entity.
- Audit platform-admin actions.
- Rate-limit expensive and abuse-prone operations.
- Validate all external inputs.
- Sanitize rendered content.
- Protect against prompt injection in uploaded content.
- Keep sensitive data out of logs.
- Support account deletion and documented retention.
- Use least privilege for integrations and deployment credentials.

## 10. Testing standard

Required layers where applicable:

- Domain unit tests
- Formula golden tests
- Contract tests
- Database tests
- Migration tests
- RLS tests
- Storage authorization tests
- Edge Function tests
- Integration tests
- Web component tests
- Web E2E tests
- iOS unit tests
- iOS UI tests
- Offline/sync tests
- Accessibility tests
- Performance tests
- Security tests
- Backup/restore tests

No command may be reported as passing unless it was run and passed.

## 11. Definition of done

A feature is done only when:

- The full user workflow works.
- The full data path works.
- Save and reopen work.
- Refresh and relaunch work.
- Permissions work.
- Loading, empty, error, stale, offline, conflict, and retry states work.
- Every visible control works.
- Background work exposes durable status.
- Canonical outputs reconcile across clients and reports.
- Tests pass.
- Production build succeeds.
- No unrelated behavior changed.
- No placeholder behavior remains visible.
