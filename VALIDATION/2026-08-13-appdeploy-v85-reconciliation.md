# SafeTrack AppDeploy v85 reconciliation

Date: 2026-08-13
AppDeploy app: safetrack-v14-ybr3e8
AppDeploy version: v85
Snapshot: 1786637329684
Live URL: https://safetrack-v14-ybr3e8.v2.appdeploy.ai/
GitHub baseline before reconciliation: 57ca43261b9f40bf52f7032edd17cc7b6d43e7c4 (v68-era state)
Linear governance rule: HAN-42

## Purpose

Bring GitHub and Linear back into agreement with the actual deployed SafeTrack v85 state. This reconciliation does not deploy or modify the running AppDeploy application.

## Material changes since the GitHub v68 baseline

- Mitarbeitende spacing and stable desktop PNr/status alignment.
- Dokumente post-print navigation and three-way print-result workflow.
- Dokumente category -> training -> ST-DOC hierarchy, collapsed by default.
- Dokumente search by PNr/name/ST-DOC/training/date and status filtering.
- Priority ordering and aggregated status chips; Rückupload status blue.
- Upload page orientation normalization from SafeTrack QR geometry with audit metadata and QR identity recheck.
- Standalone A4-like original snapshots for newly created documents.
- Green/red/neutral comparison-result indicators.
- Unterweisungen category count and chevron vertical alignment.
- Mobile expanded training-card overflow fix and compact selection bar.

## v85 QA evidence

AppDeploy deployment status: READY.

Targeted mobile Test 5 PASS:
- expanded Unterweisungen cards fit the viewport;
- no horizontal page overflow;
- category count badges and chevrons remain aligned;
- exactly two selected trainings update the floating bar;
- Auswahl aufheben and Mitarbeitende zuweisen remain visible;
- secondary explanatory sentence is hidden on mobile;
- compact selection bar remains usable.

Other v85 regression evidence:
- individual browser-observable print preparation PASS;
- canonical Mitarbeitende and Unterweisungskatalog ownership PASS;
- Dokumente hierarchy sanity test: INCONCLUSIVE/SKIPPED because QA worker exceeded 300 s with zero executed steps;
- comparison/orientation combined test: INCONCLUSIVE/SKIPPED because QA worker exceeded 300 s with zero executed steps.

No frontend or backend runtime errors were reported by the v85 deployment status.

## Manual acceptance gaps retained

- HAN-21 remains open for any not-yet-completed real iPhone post-print decision/retry acceptance.
- HAN-23 remains open until real uploaded rotated-page acceptance is completed.
- HAN-24 remains open until a newly generated real document is checked in Original <-> Rücklauf comparison.
- HAN-39 remains open until real-device user acceptance of the v85 compact mobile layout.

## Source synchronization target

The reconciliation branch must carry the v85 versions of at least:
- safetrack-v024.css
- safetrack-v024.js
- safetrack-v023.js
- backend/v024.ts
- print.js
- safetrack-v024-qa.js
- tests/tests.txt

GitHub is authoritative for code/history after reconciliation; AppDeploy v85 remains the runtime reference for this sync operation.