# BRIX Release Training

## Core Workflow

BRIX now uses one primary deal path:

1. Open FindIQ.
2. Enter an address, listing URL, or listing text.
3. Choose the first strategy to evaluate.
4. Create the deal file.
5. Work the deal in DealIQ.

FindIQ starts the file. DealIQ performs the underwriting and strategy comparison. PipelineIQ tracks pursuit. OfferIQ helps decide how to pursue. PortfolioIQ starts after acquisition.

## What BRIX Must Never Do

- Present missing data as verified.
- Treat estimates as facts.
- Recommend a visit or offer when required facts are missing.
- Hide insurance, tax, rent, condition, or strategy gaps.

## Required Deal Facts

Minimum facts before relying on output:

- Address
- Purchase price
- Annual taxes
- Annual insurance
- Strategy

Rental strategies also require rent support.

Renovation strategies also require rehab budget and after repair value support.

## Reports

DealIQ and Reports can export:

- PDF decision memo
- XLS underwriting workbook

Reports include recommendation, confidence, readiness, evidence, missing information, and next actions.

## Photos

Users can attach listing or field photos. BRIX flags possible areas of concern from image names and notes, and the Supabase photo evidence endpoint provides the same triage surface for native/mobile flows.

Photo triage is not an inspection. It identifies concerns that require verification.

## Tax And Area Review

BRIX provides tax-source and map-review actions when direct county/provider data is unavailable.

Tax records must be verified against county or official records before relying on cash flow.

Area convenience review should consider the strategy. Owner-occupied deals care more about hospital, grocery, pharmacy, highway, airport, and daily-life proximity than some pure investment strategies.

## Free User Limit

Free users are capped at 15 created deal files. Deleting a deal does not reset the lifetime free counter.

Paid users are not subject to the free cap.

## Admin

`edhemmer@gmail.com` is bootstrapped as `superadmin` through the rebuild migration and receives the admin plan.
