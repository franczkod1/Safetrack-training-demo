# SafeTrack v0.24 — Phase 3 group-training cutover

Date: 2026-08-08
Product version: SafeTrack v0.24
Live URL: https://safetrack-v14-ybr3e8.v2.appdeploy.ai/
Final technical release: AppDeploy v64 (`1786221273347`)
Runtime cutover release: AppDeploy v63 (`1786220832504`)
Rollback hosting version: AppDeploy v62 (`1786219299290`)
Rollback source branch: `backup/safetrack-v0-24-pre-phase3-group-training-20260808`

## Ownership change
Removed from the production runtime load chain:
- historical `group-training-v018.js`

Canonical owner added:
- `group-training.js`

`trainings.js` remains the owner of the Unterweisungskatalog and its group-selection controls.
`employees.js` remains the owner of employee assignment/status derivation.
`group-training.js` owns group selection state, eligible employee assignment, bulk selection, sorting, the metadata step and raw confirmation-preview generation.
The existing v0.24 print controller remains the owner of native group print execution and ST-DOC/STPG preflight.

## Canonical group confirmation structure
The raw confirmation participant table is now generated directly with exactly four columns:
1. Mitarbeitende Person
2. PNr.
3. Tätigkeit
4. Unterschrift

The completion date is document metadata and is not generated as a participant-row column.

## Legacy behavior removed from the group workflow owner
The canonical module does not:
- inject group-selection UI into catalog cards;
- use a MutationObserver;
- synchronize or overwrite the product version;
- call or replace `window.print`;
- create the historical `body.st-group-printing` execution mode.

## Validation
Final AppDeploy v64 runtime errors:
- frontend: 0
- backend: 0
- network snapshot errors: 0

QA jobs: 5 total.
- Test 3 — canonical Mitarbeitende/catalog ownership: passed.
- Test 4 — mobile catalog collapse: passed.
- Test 5 — canonical group-training workflow: passed independently.
- Test 1 — print-layout combined workflow: skipped after 300-second QA worker timeout with 0 executed steps.
- Test 2 — Documents guardrail/navigation: skipped after 300-second QA worker timeout with 0 executed steps.

The Phase 3 group-training test verified on mobile:
- selecting two trainings;
- eligible employee picker;
- critical and 6–30-day bulk selection;
- language sorting and language headings;
- dedicated date/supervisor name/supervisor PNr. metadata step;
- two independent preview documents for two selected trainings;
- exactly four participant columns.

## Remaining limitation
This phase did not change or re-accept the physical iPhone/Safari system print rendering. The previously observed iPhone blank-page problem is not claimed fixed by this cutover. Print runtime/CSS consolidation remains a later phase and must follow `PRINT_RULES.md` including real-device acceptance.
