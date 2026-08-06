# Incident: grouped print output and inverted category toggle

Date: 2026-08-06
Repository: `franczkod1/Safetrack-training-demo`

## Observed symptoms

1. Printing multiple selected trainings produced one combined document with only one employee signature area.
2. The user could not choose between printing only confirmation pages and printing the complete training content.
3. There was no one-click selector for trainings due in 6–30 days.
4. A collapsed training category required two activations before its content became visible.

## Root causes

1. The print renderer grouped selected trainings by category and appended one shared footer after the entire group.
2. The print action called `window.print()` directly and had no explicit print-mode decision.
3. Only the `critical` bulk-selection action existed.
4. The category toggle updated `aria-expanded` correctly but assigned the `hidden` property using the inverse of the required value: `body.hidden = !expanded` instead of hiding only when the previous state was expanded.

## Incorrect assumptions

- A grouped list with one signature footer was treated as sufficient documentation for several distinct training records.
- The visual chevron state was treated as evidence that the category body had changed visibility.
- The initial automated print test verified row count, not document separation and independent signatures.

## Corrective actions

- Render every selected training as an independent print document.
- Provide two print modes: confirmation/signatures only, or complete training content followed by a separate confirmation page.
- Put separate employee and instructor/supervisor signature fields on every training confirmation page.
- Add a dedicated selector for trainings due in 6–30 days.
- Synchronize `aria-expanded` and `hidden` on the first activation.

## Prevention checks

1. Two selected trainings must create exactly two independent confirmation documents.
2. Every confirmation page must contain both an employee signature and an instructor/supervisor signature.
3. Full-print mode must contain the employee-language training, a German reference for non-German employees, and a separate confirmation page.
4. The 6–30 day selector must select only `soon` items.
5. One category activation must invert both `aria-expanded` and the controlled element's `hidden` state.
6. The public Chromium test must verify all five checks on the deployed Pages artifact.
