# FindIQ Deal Creation Audit - 2026-07-11

## Scope

Audited the web deal creation path as a user flow:

1. Open FindIQ.
2. Enter an address or listing link.
3. Choose an acquisition strategy.
4. Click Create deal file.
5. Create the Supabase deal row.
6. Route into the DealIQ cockpit for that deal.

Also checked duplicate creation entry points from Dashboard, DealIQ, PipelineIQ, OfferIQ, Deal Compare, legacy routes, and the shared app shell.

## Issues Found And Corrected

### 1. Deal creation could fail before inserting the deal

Cause:
`useCreateDeal` required a `profiles.single()` row. If Supabase auth existed but the profile row was missing, delayed, or blocked by metadata sync, the mutation failed before the deal insert.

Correction:
`useCreateDeal` now uses a resilient `loadBillingProfile` path with `maybeSingle()`, creates a safe default profile when possible, and falls back to free-tier access instead of failing the workflow. Deal limit lookup errors now return a clear message.

Additional backend correction:
Supabase enforces the free-plan cap with a `deals` insert trigger that requires a profile row. Added `public.ensure_current_profile()` as a security-definer RPC and wired web + iOS to call it before inserting a deal.

### 2. Developer account access was not resilient

Cause:
If the developer auth user was recreated without the matching profile flags, the app could treat the account as a free user.

Correction:
`edhemmer@gmail.com` now receives developer override inside the access profile resolution path so deal creation is not blocked by missing profile metadata.

### 3. Two deal creation paths existed

Cause:
FindIQ created deals, but `/dealiq/new` also rendered a separate NewDeal workflow. Multiple modules linked directly to `/dealiq/new`, creating inconsistent entry behavior.

Correction:
`/dealiq/new` and `/deals/new` now redirect to `/findiq`. Dashboard, DealIQ, PipelineIQ, OfferIQ, and Deal Compare now send users to FindIQ for new property intake.

### 4. Regression coverage did not protect the single-intake rule

Cause:
The routing regression test expected `/dealiq/new` to render before the optional DealIQ route, but did not enforce that it should redirect to FindIQ.

Correction:
Regression tests now verify the redirect, resilient profile loading, and FindIQ as the only user-facing deal creation path.

### 5. iOS had a dormant duplicate creation sheet

Cause:
The native project still contained a secondary add-property sheet in `DigitalTwinView`, separate from the main FindIQ intake.

Correction:
Removed the secondary sheet and changed that action to route to FindIQ. Native deal creation now prepares the profile through the same Supabase RPC before inserting.

## Remaining Manual Verification

After deployment, verify in browser with a signed-in user:

1. `/dealiq/new` redirects to `/findiq`.
2. FindIQ address/listing input advances to strategy.
3. Create deal file creates a Supabase `deals` row.
4. Successful creation opens `/dealiq/{dealId}`.
5. Dashboard, PipelineIQ, OfferIQ, and Deal Compare new-property buttons all land on FindIQ.
