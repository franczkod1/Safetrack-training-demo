# SafeTrack v0.24 — iPhone group print v68 physical validation

Date: 2026-08-09
AppDeploy version: v68
Snapshot: 1786259898830
Status: PHYSICALLY VALIDATED ON REAL IPHONE

## Change validated

Canonical group Schulungsbestätigung pagination changed from 10 to 15 Mitarbeitende per logical A4 page in `print.js`.

The following constraints remained unchanged:
- QR target size: 40 mm in print.
- Employee signature row: minimum 8 mm.
- Four participant columns: Mitarbeitende Person, PNr., Tätigkeit, Unterschrift.
- Explicit SafeTrack logical pagination before native system print.
- One ST-DOC per document and one unique STPG/QR per logical/physical page.
- Single canonical snapshot per document.
- Canonical `print.js` remains the only active print-execution owner.

## Automated validation

- AppDeploy deployment reached `ready`.
- No frontend runtime errors reported.
- No backend runtime errors reported.
- Test 1 sanity workflow passed with 15-person logical pagination.
- The sanity test requires at least 31 selected Mitarbeitende, at least three logical pages, and no page with more than 15 participant rows.
- Two older QA workers did not produce complete results and were not counted as passed.

## Physical iPhone acceptance

The user tested v68 on a real iPhone/Safari system print flow on 2026-08-09 and explicitly confirmed: `Működik` / works.

Accepted physical behavior:
- The native iPhone print flow opens successfully.
- The previous blank-page failure is not reproduced.
- The previous snapshot/storage preparation failure is not reproduced.
- 15-person logical pagination is accepted for real iPhone printing.
- The existing 40 mm QR, minimum 8 mm signature row, four-column participant table, ST-DOC/STPG identity and explicit logical pagination remain the canonical print rules.

For 100 participants, the canonical expected pagination is 7 logical pages: 15 + 15 + 15 + 15 + 15 + 15 + 10.

A separate 90-participant / 6x15 full-final-page stress case remains optional regression coverage; it is not required to keep v68 accepted unless a future layout change affects the final supervisor block or row height.

## Regression rule

Any future modification to participant row height, QR/header height, supervisor block, page margins, table typography, print CSS or pagination count invalidates this physical acceptance for the affected layout and requires a new real iPhone/Safari system print preview check before claiming iPhone print support.
