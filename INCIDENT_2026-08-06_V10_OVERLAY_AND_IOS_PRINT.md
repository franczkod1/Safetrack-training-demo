# Incident: v10 overlay and iOS print failure

Date: 2026-08-06
Status: confirmed

## Observed symptoms

- The v10 release did not provide the requested stable result.
- The confirmation sheet could still paginate differently in iPhone/Safari print preview.
- Employee grouping, category collapsing and printing were implemented by an additional override module rather than the existing interaction module.

## Root cause

The release loaded both `employee-training-groups.js` and a second `safetrack-v10.js` interaction layer. Both modules observed and handled overlapping employee, category and print behavior. The v10 print CSS also used a fixed 245 mm page height and a flexible spacer layout, which did not reliably match the printable area used by iOS/Safari.

## Incorrect assumption

A later override module and a Chromium-generated one-page PDF were treated as sufficient proof that the existing behavior had been replaced and that iOS print pagination would match Chromium.

## Corrective action

- Replace the original employee-training module directly with one unified implementation.
- Remove the v10 JavaScript and CSS overlay files from the deployed artifact and repository.
- Use compact normal document flow for the confirmation page without fixed page height or flexible spacer rows.
- Keep the signature fields directly after the confirmation text.
- Validate the exact deployed artifact and require final iPhone/Safari print-preview confirmation.

## Prevention checks

1. The public artifact must contain only one employee-training interaction module.
2. Static validation must reject `safetrack-v10.js`, `safetrack-v10.css`, fixed 245 mm confirmation heights and `grid-template-rows: auto 1fr auto`.
3. The deployed browser test must verify one selected confirmation produces one PDF page and two selections produce two PDF pages.
4. iPhone/Safari print preview remains a mandatory release acceptance check for confirmation pagination.
