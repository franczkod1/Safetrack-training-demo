# Physical acceptance: iPhone group print – SafeTrack v0.24 / AppDeploy v67

Date: 2026-08-09
Device class: real iPhone
Browser / print path: Safari/WebKit → native iOS system print preview
Product version: SafeTrack v0.24
Technical release: AppDeploy v67 (`1786235802513`)

## Scenario

- Unterweisung: `Allgemeine Sicherheitsunterweisung`
- Unterweisungs-ID: `ST-UW-001`
- Training version: `v3.2`
- Selected employees: 100
- Group pagination at time of test: 10 employees per SafeTrack logical page
- Expected logical pages: 10

## Physical result

PASS.

Observed in the real native iOS print preview:
- system preview opened successfully;
- system page count was 10;
- pages contained visible SafeTrack content rather than blank white thumbnails;
- page 9/10 was visibly rendered with 10 participant rows;
- ST-DOC was visible (`ST-DOC-2026-000057`);
- page identity showed `Seite 9/10`;
- QR was visible and large;
- participant table retained four columns (`Mitarbeitende Person`, `PNr.`, `Tätigkeit`, `Unterschrift`);
- SafeTrack v0.24 footer and document/page identity were visible;
- no HTTP 500 or snapshot error interrupted the final print handoff.

## Acceptance conclusion

The original iPhone blank-page release blocker is physically resolved for the v67 10-row group pagination configuration.

This acceptance is configuration-specific. Any future change to:
- employees per page;
- QR/header size;
- participant row/signature height;
- print margins;
- page-break CSS;
- print root lifecycle;
- print controller or snapshot preparation

requires new real-iPhone system-print validation before being considered physically accepted.

## Evidence note

User-provided iPhone screenshot on 2026-08-09 showed the native system preview at page 9/10 with the complete SafeTrack page rendered and neighboring printed pages also visible.

## Related records

- `INCIDENTS/2026-08-08-ios-group-print-blank-pages.md`
- `INCIDENTS/2026-08-09-ios-group-print-final-resolution.md`
- `PRINT_RULES.md`
