# SafeTrack manual document QA

These checks are intentionally excluded from automatic AppDeploy E2E because they are long-running, depend on OCR/document fixtures, or require physical print/scan validation.

## Document return and OCR
- Create a fresh v0.24 training document.
- Print it and verify the physical/real device print preview.
- Sign the paper manually.
- Scan as PDF/JPG/PNG, including a multi-page PDF and optionally mixed page order.
- Upload to Dokumente.
- Verify STPG QR routing, ST-DOC fallback OCR, page x/y, Unterweisungs-ID, version and PNr matching.
- Verify uncertain pages use Digitales Original ↔ Hochgeladener Rücklauf before manual confirmation.
- Verify duplicate pages require Diese Seite verwenden.
- Verify hard identity conflict blocks completion.

## Missing pages
- Upload only pages 1/3 and 3/3.
- Confirm the document remains in Erwartete Rückläufe.
- Upload page 2/3 separately and verify it attaches to the same ST-DOC.

## Completion and employee document view
- Complete only when every expected page is verified.
- Verify completion records appear in Dokumentierte Abschlüsse.
- From an employee profile, open Dokument öffnen and verify only pages whose expectedPnrs include that employee are shown initially.
- Use Alle Seiten anzeigen and verify the full document becomes visible without horizontal overflow.

## Physical print validation
- Real iPhone print preview is required for final validation.
- Verify every page counted by the native iPhone print sheet contains visible SafeTrack content; a correct page count with blank page thumbnails is a release blocker.
- Check QR size/quiet zone, cropping, skew, contrast, page breaks and handwriting overlap.
- For Unterweisungen group confirmation, verify 14 participants stay on one physical A4 with the approximately 40 mm QR, all header metadata to its right, the larger writable signature-row height and unchanged supervisor/signature fields. For 100 participants verify exactly 8 physical A4 sheets for the 8 logical SafeTrack pages: every logical page must start at the top of its own physical sheet, no participant row may spill onto a neighboring sheet, no blank interstitial sheet may appear, and every printed page must have its own QR/STPG and Seite x/y identity.
- From Mitarbeitende, select one or more trainings, enter Durchgeführt am plus supervisor name and PNr before preview, and verify those values are printed and stored with the central document.
- For Nur Bestätigung und Unterschriften verify every employee/training confirmation occupies exactly one physical A4 page, including QR, compact metadata, both signature lines and the SafeTrack v0.24 footer.
- For multiple confirmations verify the native iPhone page count equals the number of confirmation documents rather than doubling because of a signature-page split.
