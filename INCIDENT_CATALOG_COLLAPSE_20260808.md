# Incident – Unterweisungskatalog categories visually open despite collapsed state

Date: 2026-08-08
Affected release: SafeTrack v0.24 / AppDeploy v61
Fixed release: SafeTrack v0.24 / AppDeploy v62 (`1786219299290`)

## Observed symptom
On iPhone/mobile, Unterweisungskatalog category headers showed a collapsed chevron/ARIA state, but the training cards remained visible. Tapping the category header could not reliably hide the cards.

## Root cause
The canonical `trainings.js` rendered each category body with the HTML `hidden` attribute only. A historical base stylesheet still loaded by production defines `.training-grid { display:grid }`. Per HTML/CSS behavior, an explicit author `display` declaration can override the rendering effect of the `hidden` attribute, so the DOM state and the visual state diverged.

## Incorrect assumption
During Phase 2 consolidation, it was assumed that setting/removing `hidden` alone would guarantee visual collapse while historical CSS remained loaded. That assumption was incorrect because the legacy `.training-grid` display rule still participates in the cascade.

## Corrective action
The canonical `trainings.js` now owns the complete category visibility state:
- initial closed markup: `hidden` plus inline `display:none`;
- open: `hidden=false`, `display:grid`, `aria-expanded=true`;
- closed: `hidden=true`, `display:none`, `aria-expanded=false`.
No new fix stylesheet or version-overlay module was added.

## Prevention check
Every collapsible component introduced while historical CSS is still loaded must be tested against the computed visual state, not only DOM attributes. Regression must verify all three states on the deployed artifact: initially closed, opened once, closed again. For the Unterweisungskatalog this is covered by `Test 4 - Unterweisungskatalog collapse remains real on mobile`.

## Validation
- AppDeploy v62 deployment: ready.
- Frontend errors: 0.
- Backend errors: 0.
- Target mobile Test 4: passed end-to-end.
- Desktop Phase-2 ownership/catalog Test 3: passed end-to-end.
- Historical print and document tests 1–2 were skipped after QA worker 300-second timeout with zero steps; they are not counted as passed.
