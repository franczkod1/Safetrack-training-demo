# SafeTrack v0.24 runtime consolidation map

Status: APPROVED PLANNING DOCUMENT
Product version: SafeTrack v0.24
Goal: remove historical frontend runtime stacking without changing the user-visible product version or losing current behavior.

## 1. Current production architecture problem

The current production `index.html` still loads a historical chain of SafeTrack frontend assets.

### Active CSS chain
Base files:
- `styles.css`
- `employee-training-groups.css`

Historical/versioned production styles:
- `safetrack-v016.css`
- `safetrack-v017.css`
- `safetrack-v018.css`
- `safetrack-v018-printfix.css`
- `safetrack-v019.css`
- `safetrack-v019-iphone-pagefix.css`
- `safetrack-v020.css`
- `safetrack-v021.css`
- `safetrack-v022.css`
- `safetrack-v023.css`
- `safetrack-v023-dashboard-fix.css`
- `safetrack-v023-hierarchy-nav-fix.css`
- `safetrack-v024.css`
- `safetrack-v024-admin-delete.css`
- `safetrack-v024-print-recognition.css`
- `safetrack-v024-iphone-group-print.css`
- `safetrack-v024-employee-print.css`

This means production currently depends on a large cascade of historical styles and fixes.

### Active application/runtime JS chain
Data/vendor files are listed separately below. Active SafeTrack runtime layers are:
- `app-v016.js`
- `employee-training-groups-v017.js`
- `group-training-v018.js`
- `safetrack-v019-core-v023.js`
- `safetrack-v023.js`
- `safetrack-v023-dashboard-fix.js`
- `safetrack-v023-hierarchy-nav-fix.js`
- `safetrack-v024.js`
- `safetrack-v024-compat.js`
- `safetrack-v024-admin-delete.js`
- `safetrack-v024-group-print-compact.js`
- `safetrack-v024-employee-print.js`
- `safetrack-v024-group-print-controller.js`
- `safetrack-v023-qa.js`
- `safetrack-v024-qa.js`

Some additional old files exist in the AppDeploy snapshot but are not loaded by production `index.html`; those are not active runtime conflicts and should not be treated as active dependencies.

## 2. Current ownership conflicts

### Application shell / navigation / state
Current owners:
- `app-v016.js`: base application state, render, navigation, catalog and employee modal foundation.
- `safetrack-v023-dashboard-fix.js`: dashboard behavior repair.
- `safetrack-v023-hierarchy-nav-fix.js`: hierarchy/navigation repair.
- `safetrack-v024.js`: Documents navigation, menu interception, catalog-collapse behavior.
- `safetrack-v024-admin-delete.js`: additional top-back injection for Documents.

Target owner:
- `core.js`

### Employee hierarchy and employee training profile
Current owners:
- `app-v016.js`: base employee page/modal.
- `employee-training-groups-v017.js`: area → Tätigkeit → employee hierarchy, employee training categories, selection, individual print flow.
- `safetrack-v019-core-v023.js`: PNr normalization and hierarchy column enhancement.
- `safetrack-v023-hierarchy-nav-fix.js`: hierarchy/navigation fixes.
- `safetrack-v024-employee-print.js`: print-specific employee confirmation augmentation.

Target owners:
- `employees.js`
- `print.js` for print-only behavior.

### Training catalog
Current owners:
- `app-v016.js`: catalog render/editor/filter.
- `group-training-v018.js`: group-selection checkboxes and selection bar injected into catalog cards.
- `safetrack-v024.js`: category collapse implemented as post-render DOM enhancement.

Target owners:
- `trainings.js`
- `group-training.js` for group-selection state integrated through an explicit interface.

### Group training workflow
Current owners:
- `group-training-v018.js`: training selection, employee picker, setup, preview, legacy print root generation and legacy print execution.
- `safetrack-v019-core-v023.js`: pagination/document identity decoration from local prototype history.
- `safetrack-v023.js`: server ST-DOC/STPG preparation bridge and snapshot persistence.
- `safetrack-v024-group-print-compact.js`: header/QR/meta transformation.
- `safetrack-v024-group-print-controller.js`: current print execution/preflight.

Target owners:
- `group-training.js`: selection, participant assignment, setup and logical-page generation.
- `print.js`: ST-DOC/STPG preparation, print preflight and native print execution.

### Documents / uploads / OCR / review
Current owners:
- `safetrack-v023.js`: server document preparation, upload parsing, PDF/image processing, OCR upload pipeline, completions bridge and old registry UI.
- `safetrack-v024.js`: current Documents workspace, details, comparison, participant filtering and current document viewer.
- `safetrack-v024-compat.js`: redirects old v0.23 entry points into v0.24 UI and adds received-page compatibility.
- `safetrack-v024-admin-delete.js`: hard-delete UI and Documents top-back enhancement.

Target owners:
- `documents.js`: document workspace, upload/OCR, review, completion and viewer.
- `admin.js`: hard delete, later role-gated.
- No compatibility redirect module after migration.

### Version display
Current owners include historical modules that set `api.version`, footer version or title, plus v0.23/v0.24 sync functions.

Target owner:
- `core.js` reads one `PRODUCT_VERSION` constant and renders it everywhere.
- No historical module may set the visible product version.

### Print lifecycle
Active production currently contains multiple print-era owners. In particular `safetrack-v023.js`, `safetrack-v024-employee-print.js` and `safetrack-v024-group-print-controller.js` each interact with/replace `window.print`, while `group-training-v018.js` still contains the legacy print execution path.

Target owner:
- exactly one `print.js` browser-print dispatcher.
- employee and group printing use explicit functions on that dispatcher; no chained `window.print` replacement.

### QA
Current production loads both:
- `safetrack-v023-qa.js`
- `safetrack-v024-qa.js`

Target:
- QA code must not be part of the normal production runtime chain.
- Load QA only behind the explicit AppDeploy QA parameter or a dedicated test entry point.
- QA must not create persistent production test data unless the specific test is designed to do so and cleans it up.

## 3. Data/vendor assets that are not version-runtime layering

These may remain during the first consolidation phases if still required:
- `seed-base.js`
- `trainings-a.js`
- `trainings-b.js`
- `data-final.js`
- `safetrack-v017-data.js`
- `safetrack-v019-pnr-migration.js`
- `status-fixture-v017.js`
- `qrcode-generator`
- `jsQR`
- `pdfjs-dist`

However:
- data migrations must be idempotent;
- migrations must not own UI or events;
- obsolete fixture/migration files should later be folded into a canonical data bootstrap.

Backend table names such as `documents_v023` are explicitly NOT part of this frontend runtime problem and may remain for compatibility.

## 4. Target production load chain

Target shape after consolidation:

CSS:
- `styles.css` or `styles-core.css`
- `styles-components.css` if separation is useful
- `print.css`

JS:
- canonical data bootstrap
- required vendor libraries
- `core.js`
- `employees.js`
- `trainings.js`
- `group-training.js`
- `documents.js`
- `print.js`
- `admin.js`

QA must be conditionally loaded, not part of normal production startup.

No historical `v016...v024` runtime chain remains in production after final cutover.

## 5. Migration sequence

### Phase 0 — rules and baseline
- Preserve current AppDeploy v58 and Git rollback.
- Freeze creation of new version-overlay files.
- Reconcile stale project rules before implementation.
- Create load-chain and duplicate-owner automated checks.

### Phase 1 — canonical core shell
Extract from `app-v016.js` and later fixes:
- state model;
- render lifecycle;
- history/back behavior;
- topbar/sidebar navigation;
- dashboard;
- training catalog base/editor;
- version rendering.

Integrate current dashboard/nav fixes directly.
Do not remove legacy shell until parity tests pass.
At cutover, `app-v016.js`, dashboard-fix and hierarchy-nav-fix shell ownership leave production together.

### Phase 2 — employees and catalog
Extract current behavior from `employee-training-groups-v017.js`, PNr enhancements and v0.24 catalog-collapse logic into canonical modules.
Required parity:
- Bereich → Tätigkeit → Mitarbeitende;
- name/PNr search;
- collapsed hierarchy;
- status ordering;
- employee training categories collapsed;
- individual/bulk selection;
- stable ST-UW IDs.

Remove post-render override logic once canonical render produces the correct DOM directly.

### Phase 3 — group training
Move group selection/picker/setup/preview generation from `group-training-v018.js` into `group-training.js`.
Generate the CURRENT four-column participant table directly:
- Mitarbeitende Person
- PNr.
- Tätigkeit
- Unterschrift

Do not generate the historical Datum column and then remove it later.
Integrate 10 participants/logical page directly.

### Phase 4 — unified print subsystem
Create one `print.js`.
Absorb:
- individual confirmation preparation;
- group ST-DOC/STPG preparation;
- QR/meta decoration;
- system-print-root creation;
- print preflight;
- iPhone/WebKit lifecycle protection;
- snapshot persistence;
- printed-state acknowledgement.

Remove all historical print execution and all chained `window.print` overrides.
`PRINT_RULES.md` is the acceptance specification.

### Phase 5 — documents subsystem
Merge server document/upload logic from v0.23 with current v0.24 workspace/review/viewer into `documents.js`.
Remove old registry UIs and `safetrack-v024-compat.js` redirects after parity.
Keep backend table compatibility unchanged.

### Phase 6 — admin subsystem
Move hard-delete behavior into `admin.js`.
Keep the current warning/confirmation semantics.
When authentication exists, enforce Super Admin on frontend AND backend.

### Phase 7 — CSS consolidation
Build canonical component CSS from the verified final appearance.
Remove historical version stylesheets one domain at a time only after visual/mobile/print parity.
No `!important` should exist merely to beat an older SafeTrack stylesheet.

### Phase 8 — production index cutover
Production `index.html` must load only canonical runtime modules, canonical styles, data bootstrap and vendor libraries.
No historical runtime overlay chain.

## 6. Release gates for every migration phase

A phase is not complete until:
- old and new implementations are not simultaneously active for that migrated domain;
- no new duplicate action handler was added;
- no new duplicate MutationObserver owns the same component;
- production index load chain was audited;
- desktop and mobile regressions pass;
- print changes follow `PRINT_RULES.md` and real iPhone acceptance when applicable;
- live source is verified after deploy;
- rollback remains available.

## 7. Known stale rule requiring reconciliation

`PROJECT_RULES.md` currently contains an older group-print rule that specifies five columns including `Datum`. The current approved print architecture uses four columns and no employee Datum column. Before group-print consolidation, this stale rule must be corrected so `PRINT_RULES.md` and project rules do not conflict.

## 8. Recommended first implementation phase

Start with Phase 0 + Phase 1 only.
Do not attempt a big-bang rewrite.
The legacy-displacement approach should migrate one bounded domain, prove functional parity on the deployed artifact, then remove that domain's legacy owner before proceeding.
