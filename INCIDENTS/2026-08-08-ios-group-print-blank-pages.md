# Incident: iPhone group print produced blank physical pages

Date: 2026-08-08
Product version: SafeTrack v0.24

## Observed symptom

The SafeTrack in-app Schulungsbestätigung preview rendered correctly and showed the expected logical page count. The native iPhone print sheet also counted the expected pages, but every physical page thumbnail was blank.

## Root cause

The group-print lifecycle was controlled by multiple historical layers. The system-print root was normally `display:none` and depended on the legacy `body.st-group-printing` state becoming visible only at print time. A legacy `afterprint` cleanup could remove that body state before WebKit had completed its later page-drawing phase. In parallel, a v0.24 print CSS layer still applied whole-page `break-inside/page-break-inside: avoid`, a pattern known to cause missing/blank print output in WebKit.

## Incorrect assumption

A correct logical page count in the iPhone print sheet was treated as evidence that the printable DOM would also remain available during WebKit's later drawing phase. This is not sufficient: WebKit can compute page count first and draw pages later.

## Corrective action

1. Group native print execution is owned by one v0.24 controller.
2. The v0.23 layer no longer executes group native print; it only exposes document/ST-DOC/STPG preparation through a bridge.
3. The system-print root is kept as a direct body child in normal flow and is fully laid out before native print.
4. A stable `html.st-v024-group-print-active` state controls print CSS and is not removed by the legacy body `afterprint` cleanup.
5. Whole-page `break-inside/page-break-inside: avoid` is removed; only atomic blocks may be non-breaking.
6. A preflight blocks print if any logical page has zero layout size, missing QR/STPG, missing ST-DOC or missing `Seite x/y`.

## Prevention checks

- Review `RESEARCH_RULES.md` and `PRINT_RULES.md` before every future print change.
- Before native group print, preflight every logical page.
- Never use a last-moment hidden-to-visible print root on iPhone/Safari.
- Never depend on `afterprint` to preserve the DOM needed by WebKit page drawing.
- Real iPhone/Safari system print preview remains mandatory; correct page count with blank thumbnails is a release blocker.

## External evidence reviewed

- WebKit bug 157924: iOS printing computes page count and draws pages in later phases; blank-page regression documented.
- WebKit bug 19937: beforeprint/afterprint handling can occur multiple times/deep in the print lifecycle.
- WebKit bug 41532: `page-break-inside: avoid` caused missing content and blank pages.
- WebKit bug 268687 / 69384: positioned content has known Safari print rendering failures.
- MDN: `page-break-inside` is deprecated in favor of `break-inside`.
