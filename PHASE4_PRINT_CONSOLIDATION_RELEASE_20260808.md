# SafeTrack v0.24 — Phase 4 print consolidation release

Date: 2026-08-08
Product version: SafeTrack v0.24
Live URL: https://safetrack-v14-ybr3e8.v2.appdeploy.ai/
AppDeploy release: v65
AppDeploy snapshot: 1786224771037
Hosting rollback: v64 / 1786221273347
Git rollback: backup/safetrack-v0-24-pre-phase4-print-consolidation-20260808

## Ownership result

The browser print domain now has one active runtime owner: `print.js`.

Production `index.html` no longer loads:
- `safetrack-v024-employee-print.js`
- `safetrack-v024-group-print-compact.js`
- `safetrack-v024-group-print-controller.js`

`employees.js` and `group-training.js` provide printable content and workflow context but do not own native print execution. `safetrack-v019-core-v023.js` no longer actively paginates group documents. `safetrack-v023.js` no longer overrides `window.print` or runs print enhancement from its observer schedule.

## Preserved print contract

- group pagination: 10 participants per logical page
- group participant columns: Mitarbeitende Person / PNr. / Tätigkeit / Unterschrift
- per-page ST-DOC/STPG and QR preparation
- group QR target remains approximately 40 mm through the approved print CSS
- signature areas remain subject to the minimum 8 mm rule
- employee supervisor signature remains left and employee signature right on the same row
- system print roots are created fresh as direct `body` children
- WebKit preparation includes fonts-ready, render frames and a short paint-settle step
- the print root is not removed from an `afterprint` callback; explicit print acknowledgement clears the prepared state

## Validation

Deployment status: ready
Frontend runtime errors: 0
Backend runtime errors: 0
Network errors: 0

AppDeploy E2E: 5 jobs total.
- 3 succeeded
- 2 skipped after the QA worker exceeded its 300-second limit with zero executed steps

The skipped jobs included the unified print sanity workflow, therefore automated QA is NOT evidence of native iPhone print acceptance.

## Remaining release gate

Per `PRINT_RULES.md`, Phase 4 print behavior is not physically accepted until a real iPhone/Safari system print preview verifies the relevant documents. For the group stress case, verify 100 participants -> 10 physical pages, all ten pages visibly rendered, no blank pages, correct unique QR/STPG per page. Also verify an individual confirmation remains exactly one A4 page with supervisor signature left and employee signature right.

Historical CSS files are still present in the production stylesheet chain. Their consolidation belongs to the later CSS consolidation phase and may still be relevant if iPhone system print remains blank.