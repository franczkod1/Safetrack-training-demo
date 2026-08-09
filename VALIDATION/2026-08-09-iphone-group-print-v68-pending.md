# SafeTrack v0.24 — iPhone group print v68 validation status

Date: 2026-08-09
AppDeploy version: v68
Snapshot: 1786259898830
Status: PHYSICAL IPHONE VALIDATION PENDING

## Change under validation

Canonical group Schulungsbestätigung pagination changed from 10 to 15 Mitarbeitende per logical A4 page in `print.js`.

The following print constraints were intentionally left unchanged:
- QR target size: 40 mm in print.
- Employee signature row: minimum 8 mm.
- Four participant columns: Mitarbeitende Person, PNr., Tätigkeit, Unterschrift.
- Explicit SafeTrack logical pagination before native system print.
- One ST-DOC per document and one unique STPG/QR per logical/physical page.
- Single canonical snapshot per document.
- Canonical `print.js` remains the only active print-execution owner.

## Automated validation completed

- AppDeploy deployment reached `ready`.
- No frontend runtime errors reported.
- No backend runtime errors reported.
- Test 1 sanity workflow passed with 15-person logical pagination.
- The sanity test now requires at least 31 selected Mitarbeitende, at least three logical pages, and no page with more than 15 participant rows.
- Two older QA workers did not produce complete results and are not counted as passed.

## Required physical acceptance

This layout change is NOT physically accepted yet because row density changed after the previously successful v67 iPhone test.

Required real iPhone/Safari system print checks:
1. No blank physical pages.
2. No 500/storage preparation error.
3. Physical page count equals SafeTrack logical page count.
4. Every page contains visible content and its own QR/STPG/ST-DOC/Seite x/y identity.
5. Full 15-row pages fit on one physical A4 page without spillover.
6. Signature cells remain usable and at least 8 mm high.
7. QR remains approximately 40 mm with adequate quiet zone.
8. The final logical page including the supervisor block must remain on one A4 page.

Recommended acceptance cases:
- 100 participants: expected 7 logical pages (15 + 15 + 15 + 15 + 15 + 15 + 10).
- Targeted full-last-page case when practical: a participant count divisible by 15, e.g. 90 participants → 6 pages of 15, so the final page tests 15 signatures together with the supervisor block.

After a real iPhone system print preview confirms these conditions, update this file to PHYSICALLY VALIDATED and record the observed page count and evidence.