# SafeTrack – Canonical Print Rules

Status: mandatory project rule.

## Mandatory trigger

Before **any** change that can affect printing, print preview, PDF/A4 layout, QR/STPG identity, pagination/page breaks, headers, footers, participant tables, confirmation forms or signature fields, this entire file must be reviewed and used as a release checklist.

If this file conflicts with an older SafeTrack print rule, this file takes precedence.

## Canonical print rules

1. One SafeTrack logical page must map to exactly one physical A4 page.
2. No blank intermediary physical pages are allowed.
3. No content block may accidentally spill to a second physical page. If more than one page is genuinely required, SafeTrack must create explicit logical pages before invoking system print.
4. Every physical page must be independently identifiable and contain its own machine-readable identity: QR/STPG token, ST-DOC, Unterweisungs-ID and `Seite x/y`.
5. A physical continuation page without QR/STPG identity is prohibited.
6. The print QR must normally be about 40 mm with an adequate white quiet zone. It must not be reduced merely to make another block fit.
7. Mitarbeitende and Unterweisungen print workflows must use one consistent visual identity pattern: QR on the left, compact metadata/header on the right.
8. `Schulungsbestätigung` must be clearly visible on confirmation documents.
9. The compact metadata/header block may contain, as applicable: training title, Dokument-ID, Seite x/y, Unterweisungs-ID, Version, Durchgeführt am, participant count, employee name, employee PNr., Bereich/Tätigkeit.
10. Large duplicate metadata tables above the QR block are prohibited when the same data can be placed in the compact QR/meta header.
11. Signature areas must never be reduced simply to make a page fit.
12. In group participant tables, the employee signature area must remain at least 8 mm high.
13. In individual employee confirmations, supervisor name must be followed directly by the supervisor signature field. Employee signature must be a separate, clearly labelled field.
14. Individual confirmation field order must be unambiguous: Durchgeführt am; supervisor PNr.; supervisor name; supervisor signature; employee signature.
15. Group Schulungsbestätigung participant columns are exactly: `Mitarbeitende Person`, `PNr.`, `Tätigkeit`, `Unterschrift`. There is no per-employee `Datum` column.
16. Group documents must contain a separate supervisor block with supervisor name, supervisor PNr. and supervisor signature.
17. SafeTrack, not the browser, must decide group pagination. Large participant sets must be split into explicit logical SafeTrack pages before system print.
18. Each explicit group page must repeat the full QR/meta identity header and show the correct `Seite x/y`.
19. Never apply `break-inside: avoid` / `page-break-inside: avoid` to an entire A4 logical page container on iPhone/Safari. This can cause WebKit to generate blank pages.
20. Page-break rules must be deterministic: explicit break between logical pages; no extra break after the final logical page.
21. Smaller atomic blocks may remain non-breaking where appropriate: QR/meta header, one participant row, supervisor/signature block, footer.
22. Legacy print CSS may remain loaded for compatibility, but the current SafeTrack print layer must explicitly override conflicting legacy pagination or responsive rules.
23. Responsive CSS for printable components must use explicit screen-only media where necessary so narrow iPhone screen rules do not leak into print.
24. Printable tables must restore actual table semantics under `@media print` if any responsive layer can alter them.
25. Print footer must show the current SafeTrack product version. For the current branch this is `SafeTrack v0.24`.
26. ST-DOC/STPG identity and backend routing must never be altered only for visual convenience.
27. QR quiet zone, OCR-readable metadata, page identity and expected PNr. mapping take precedence over decorative layout.

## Mandatory validation for every print-layout change

A print-related release is not accepted until the following are checked:

1. SafeTrack browser print preview.
2. Desktop print/PDF layout.
3. Mobile SafeTrack preview.
4. Real iPhone/Safari system print preview when available.
5. SafeTrack logical page count equals physical system-print page count.
6. No blank physical pages.
7. No accidental spillover pages.
8. Every physical page contains its own QR/STPG identity.
9. Every page shows the correct `Seite x/y`.
10. QR physical size and quiet zone remain acceptable.
11. Signature field sizes are unchanged unless the user explicitly approves a change.
12. Header and footer content are correct.
13. SafeTrack version in footer is current.
14. ST-DOC/STPG/backend page mapping remains consistent.
15. Group participant table retains exactly four columns and one participant row per listed employee.
16. Individual confirmation keeps supervisor signature directly associated with supervisor identity and employee signature clearly separate.

## iPhone acceptance rule

Automated browser QA, Chromium PDF generation and source inspection are not sufficient to claim iPhone printing is valid. A print-layout change that affects iPhone must remain physically unvalidated until a real iPhone/Safari system print preview confirms it.
