# Incident: SafeTrack v0.18 group-training preview regressions

## Incident A — MutationObserver render loop

### Observed symptom

The first SafeTrack v0.18 AppDeploy preview builds loaded, but all five browser QA workers executed zero actions and hit the 300-second limit.

### Root cause

`group-training-v018.js` used a global `MutationObserver` over the full document. Its enhancement path wrote to DOM nodes from inside the observer flow. An unconditional selected-training counter update replaced a text node and retriggered the observer. Even after guarding that one write, using a global observer for this feature remained unnecessarily fragile.

### Incorrect assumption

Assigning the same visible value to an existing DOM node was treated as operationally idempotent. Under a `childList` observer, replacing an unchanged text node still creates a new mutation.

### Corrective action

The unconditional counter write was guarded, and then the global `MutationObserver` was removed completely. SafeTrack v0.18 now schedules group-training enhancement only after user-driven click, change and input events.

### Prevention check

1. Any enhancement function invoked by a DOM observer must be run twice with unchanged application state and produce zero new child-list mutations.
2. Unconditional `textContent`, `innerHTML`, append, remove or replace operations are prohibited inside a global mutation-observer path.
3. A browser QA run with zero trace actions and a full timeout must be investigated as a possible render loop before being attributed to test infrastructure.

## Incident B — Mobile continuation action became unreachable

### Observed symptom

After the render-loop fix, four preview tests progressed, but the mobile group-training flow could not locate `Schulungsbestätigung vorbereiten`. The employee list expanded to a very tall document and the continuation footer was effectively unreachable in the iPhone-sized workflow.

### Root cause

The group picker allowed the complete employee list to determine the dialog height. The footer relied on sticky positioning while the overall dialog structure was not constrained to the mobile viewport.

### Incorrect assumption

A sticky footer inside an otherwise unbounded dialog was assumed to remain discoverable and usable on narrow mobile viewports with long employee lists.

### Corrective action

The group picker is now a viewport-bounded flex container. Only the employee-list region scrolls, the footer remains permanently visible, and the confirmation metadata form is presented as a dedicated overlay step inside the same dialog.

### Prevention check

1. Mobile group-training QA must select several employees from a long list and verify that the continuation button remains visible without page-level scrolling.
2. The employee-list region must be the only vertically flexible/scrollable region in the picker.
3. Confirmation setup must never be appended below an unbounded employee list.
