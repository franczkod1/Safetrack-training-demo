# Incident: iPhone group print produced blank physical pages

Date: 2026-08-08
Product version: SafeTrack v0.24

## Observed symptom

The SafeTrack in-app Schulungsbestätigung preview rendered correctly and showed the expected logical page count. The native iPhone print sheet also counted the expected pages, but every physical page thumbnail was blank.

## Root cause

The group-print lifecycle was still controlled by multiple historical layers. The legacy v0.18 click handler was registered on `document` in capture phase before the v0.24 controller, so it could still activate `body.st-group-printing` and therefore the old v0.18/v0.19 print CSS before v0.24 took over. In addition, the v0.24 isolation rule used `body > *:not(#st-group-system-print-root) { display:none }`, a Safari-sensitive print pattern that can prune the printable tree and produce blank preview pages even when page count is correct. Earlier revisions also relied on whole-page `break-inside/page-break-inside: avoid` and `afterprint` cleanup, both known WebKit risk factors.

## Incorrect assumptions

1. A later `document` capture listener could override an earlier legacy `document` capture listener. It cannot: listeners on the same target run in registration order.
2. A correct logical page count in the iPhone print sheet was treated as evidence that the printable DOM would also be painted. This is not sufficient: WebKit can paginate first and paint later.
3. Hiding all non-print body children with `display:none` was assumed to be safe across browsers. Safari has documented blank-preview behavior with this pattern.

## Corrective action

1. Group `Drucken` is intercepted in `window` capture phase, before the historical `document` capture handler can run.
2. If legacy code still manages to set `body.st-group-printing`, the v0.24 `window.print` fallback removes it before printing.
3. The legacy v0.18/v0.19 group-print CSS therefore does not participate in the v0.24 native print path.
4. `display:none` body pruning was removed. Non-print UI is moved off-screen as tiny absolutely positioned invisible content while the SafeTrack print root stays in the render tree.
5. The print root and all descendants are explicitly `visibility:visible`, `opacity:1`, and `content-visibility:visible` during print.
6. Whole-page `break-inside/page-break-inside: avoid` is removed; only atomic blocks may be non-breaking.
7. After ST-DOC/STPG/QR preparation, fonts are awaited, two animation frames are rendered, a short WebKit paint-stabilization delay runs, then another two frames precede native `print()`.
8. Preflight blocks print if any logical page has zero layout size, missing QR/STPG, missing ST-DOC or missing `Seite x/y`.

## Prevention checks

- Review `RESEARCH_RULES.md` and `PRINT_RULES.md` before every future print change.
- Search both AppDeploy-local files and historical CDN/GitHub print layers before changing printing.
- Prefer interception at an earlier event-path target (`window` capture) when legacy capture handlers cannot be removed immediately.
- Never use `display:none` to prune the whole application around the SafeTrack print root on Safari/iOS.
- Never use a last-moment hidden-to-visible print root on iPhone/Safari.
- Never depend on `afterprint` to preserve the DOM needed by WebKit page drawing.
- Before native group print, preflight every logical page.
- Real iPhone/Safari system print preview remains mandatory; correct page count with blank thumbnails is a release blocker.

## External evidence reviewed

- WebKit bug 157924: iOS printing computes page count and draws pages in later phases; blank-page regression documented.
- WebKit bug 43658: calling print before render/load completion can produce blank output.
- WebKit bug 41532: `page-break-inside: avoid` caused missing content and blank pages.
- Safari community reproduction: hiding all body children with `display:none` can result in blank print preview; changing positioning/render strategy resolves it.
- MDN printing guidance: prefer print CSS for print presentation and treat print lifecycle events as lifecycle hooks rather than the primary layout mechanism.
