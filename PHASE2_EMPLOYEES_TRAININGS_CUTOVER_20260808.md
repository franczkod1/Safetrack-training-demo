# SafeTrack v0.24 – Phase 2 Employees + Trainings cutover

Date: 2026-08-08
Status: COMPLETED WITH QA LIMITATION NOTED
Product version: SafeTrack v0.24
AppDeploy technical release: v61
AppDeploy snapshot: 1786216154120
Live app: https://safetrack-v14-ybr3e8.v2.appdeploy.ai/

## Scope completed

Phase 2 replaced historical employee/catalog runtime ownership with semantic canonical modules.

### Canonical owners now active
- `core.js` – shell, shared state, navigation and persistence interface
- `employees.js` – Mitarbeitende hierarchy, employee profile training grouping/selection and the legacy-compatible base individual print-preview DOM
- `trainings.js` – Unterweisungskatalog rendering, filtering/editing/import/export and integrated group-selection controls

### Legacy runtime displaced
`employee-training-groups-v017.js` is no longer loaded by production `index.html`.

The v0.24 catalog post-render collapse behavior is no longer active. Catalog categories are rendered collapsed directly by `trainings.js`.

## Verified behavior

The Phase 2 E2E ownership test completed successfully and verified:
- Bereich → Tätigkeit → Mitarbeitende hierarchy
- broad organizational groups collapsed initially
- Tätigkeit groups collapsed initially
- employee name and PNr. visually separated
- live PNr. search and automatic hierarchy expansion
- employee training categories collapsed initially
- employee trainings sorted worst status before better status
- Unterweisungskatalog categories collapsed initially
- group-training checkbox integrated directly into the catalog DOM
- group selection count updates correctly
- `Mitarbeitende zuweisen` enables after training selection

AppDeploy reported no frontend runtime errors, backend runtime errors or network errors for v61.

## QA limitation

The two older QA jobs covering print/document workflows did not execute application steps. Both hit the AppDeploy worker 300-second execution limit with zero test steps. This is an infrastructure/test-execution timeout and is not evidence that those workflows passed or failed.

The Phase 2 domain-specific test did execute and pass.

Native iPhone print rendering remains explicitly unvalidated by automated QA and still requires physical-device acceptance under `PRINT_RULES.md`.

## Rollback

Git rollback branch created from the last confirmed pre-Phase-2 source state:
`backup/safetrack-v0-24-pre-phase2-employees-trainings-20260808`

Rollback source commit:
`8071a19e9ebda98fab81e84b3b2fbdd29ab1e360`

Hosting rollback immediately preceding Phase 2:
AppDeploy v60 / snapshot `1786214449792`

## Backup-sequence incident

A non-runtime temporary marker was accidentally committed to `main` before the Phase 2 branch was created. The rollback branch was therefore explicitly created from the last confirmed stable commit before that write, the temporary marker was removed, and the prevention rule was documented in `INCIDENT_PHASE2_BACKUP_SEQUENCE_20260808.md`.

## Remaining legacy layers – intentional, not forgotten

The following are not Phase 2 responsibilities and remain for controlled later displacement:
- `group-training-v018.js` – Phase 3 group-training workflow owner
- historical print execution/decorators and multiple print-era modules – Phase 4 unified print subsystem
- v0.23/v0.24 documents compatibility layers – Phase 5 documents consolidation
- admin delete module – Phase 6
- historical CSS chain including v0.16–v0.24 print/layout styles – Phase 7
- final production index cleanup and QA-only conditional loading – Phase 8

These remaining layers must not receive new version-overlay fixes. Any change in their domains must follow `RUNTIME_ARCHITECTURE_RULES.md` and preferentially consolidate ownership.

## Next planned phase

Phase 3: migrate `group-training-v018.js` into canonical `group-training.js`, preserving the current workflow and direct four-column participant-table architecture. This phase requires a new explicit user approval before coding.
