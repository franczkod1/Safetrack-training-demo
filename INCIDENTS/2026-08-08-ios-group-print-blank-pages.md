# Incident: iPhone group print produced blank physical pages

Date: 2026-08-08
Product version: SafeTrack v0.24
Status: **RESOLVED AND PHYSICALLY ACCEPTED ON IPHONE – 2026-08-09**
First physically accepted technical release: AppDeploy v67 (`1786235802513`)

## Observed symptom

The SafeTrack in-app Schulungsbestätigung preview rendered correctly and showed the expected logical page count. The native iPhone print sheet also counted the expected pages, but every physical page thumbnail was blank.

## Root cause

The group-print lifecycle was still controlled by multiple historical layers. The legacy v0.18 click handler was registered on `document` in capture phase before the v0.24 controller, so it could still activate `body.st-group-printing` and therefore the old v0.18/v0.19 print CSS before v0.24 took over. In addition, the v0.24 isolation rule used `body > *:not(#st-group-system-print-root) { display:none }`, a Safari-sensitive print pattern that can prune the printable tree and produce blank preview pages even when page count is correct. Earlier revisions also relied on whole-page `break-inside/page-break-inside: avoid` and `afterprint` cleanup, both known WebKit risk factors.

The final resolution also uncovered two additional downstream issues that were not visible until the blank-page architecture was removed:

1. The final `Drucken` interaction still performed asynchronous server preparation before native print, which could fail before iOS opened the print sheet.
2. A 10-page group document redundantly attempted to persist 11 snapshot files: one full-document HTML plus 10 per-page HTML snapshots. The real iPhone workflow exposed this as `snapshot storage write failed (11 files)`.

These were part of the complete incident chain and had to be fixed before physical acceptance was possible.

## Incorrect assumptions

1. A later `document` capture listener could override an earlier legacy `document` capture listener. It cannot: listeners on the same target run in registration order.
2. A correct logical page count in the iPhone print sheet was treated as evidence that the printable DOM would also be painted. This is not sufficient: WebKit can paginate first and paint later.
3. Hiding all non-print body children with `display:none` was assumed to be safe across browsers. Safari has documented blank-preview behavior with this pattern.
4. It was initially acceptable to perform snapshot/server work after the final user `Drucken` click. On iPhone this introduces avoidable failure and user-activation/lifecycle risk before the native print handoff.
5. Saving one full snapshot plus one snapshot per logical page was assumed to be harmless redundancy. The real 100-person workflow proved that the 11-file storage operation was a release blocker.

## Corrective action

1. The historical multi-owner print architecture was replaced by one canonical `print.js` owner.
2. Legacy `window.print` wrappers and competing execution controllers were removed from the active production load chain.
3. `display:none` body pruning was removed from the Safari/iPhone print path.
4. The print root remains fully laid out, in normal flow, and a direct child of `body` before native print.
5. Whole-page `break-inside/page-break-inside: avoid` is prohibited; only atomic blocks may be non-breaking.
6. ST-DOC/STPG/QR preparation, pagination, snapshot persistence, font readiness, layout stabilization and preflight all complete **before** the final `Drucken` action is enabled.
7. The final `Drucken` action performs only the synchronous native print handoff. No document/snapshot API request runs after that click.
8. Preflight blocks print if any logical page has zero layout size, missing QR/STPG, missing ST-DOC or missing `Seite x/y`.
9. Snapshot persistence was changed from `1 + pageCount` HTML storage objects to **one canonical HTML snapshot per SafeTrack document**.
10. Every logical page still keeps its own STPG identity; its DOM `id` is the STPG token and page review can address the shared snapshot with `#<STPG>`.
11. The `Drucken` button is visibly disabled during preparation and after any preparation failure, and becomes active only when the full document is ready.

## Final physical acceptance – 2026-08-09

Real iPhone/Safari test:

- Scenario: 1 Unterweisung, 100 selected employees.
- SafeTrack logical pages: 10.
- iOS system print physical pages: 10.
- Native system print preview opened successfully.
- Physical pages were visibly rendered, not blank.
- Page 9/10 visibly contained:
  - `Schulungsbestätigung`;
  - QR;
  - ST-DOC `ST-DOC-2026-000057`;
  - Unterweisungs-ID `ST-UW-001`;
  - version `v3.2`;
  - `Seite 9/10`;
  - the four-column participant table;
  - SafeTrack v0.24 footer.
- No HTTP 500 dialog occurred before native print.
- The user explicitly confirmed the result as successful.

This physically closes the blank-page incident.

## Prevention checks

- Review `RESEARCH_RULES.md` and `PRINT_RULES.md` before every future print change.
- One print interaction domain may have only one active runtime owner.
- Never add another `window.print` wrapper as a version/fix layer.
- Never place server/network preparation after the final user print action.
- Never enable `Drucken` until pagination, identity, snapshot persistence, staging and preflight have all succeeded.
- Persist one canonical snapshot per document unless an independently verified requirement demands separate storage files.
- Keep STPG identity per logical/physical page even if the storage object is shared.
- Never use `display:none` to prune the whole application around the SafeTrack print root on Safari/iOS.
- Never use a last-moment hidden-to-visible print root on iPhone/Safari.
- Never depend on `afterprint` to preserve the DOM needed by WebKit page drawing.
- Before native group print, preflight every logical page.
- Real iPhone/Safari system print preview remains mandatory; correct page count with blank thumbnails is a release blocker.
- Every future pagination-density change (for example employees per page) must be physically revalidated on iPhone because it can alter page breaks.

## External evidence reviewed

- WebKit bug 157924: iOS printing computes page count and draws pages in later phases; blank-page regression documented.
- WebKit bug 43658: calling print before render/load completion can produce blank output.
- WebKit bug 41532: `page-break-inside: avoid` caused missing content and blank pages.
- Safari community reproduction: hiding all body children with `display:none` can result in blank print preview; changing positioning/render strategy resolves it.
- MDN printing guidance: prefer print CSS for print presentation and treat print lifecycle events as lifecycle hooks rather than the primary layout mechanism.

## Detailed final-resolution record

See `INCIDENTS/2026-08-09-ios-group-print-final-resolution.md` for the complete multi-stage failure chain and final storage architecture.
