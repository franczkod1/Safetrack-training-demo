# SafeTrack v0.24 — Phase 1 consolidation completion

Date: 2026-08-08
Product version: SafeTrack v0.24
Live URL: https://safetrack-v14-ybr3e8.v2.appdeploy.ai/
AppDeploy technical version: v60
AppDeploy snapshot: 1786214449792

## Completed ownership cutover

Canonical shell/runtime owner: `core.js`.

The production JavaScript load chain no longer loads:
- `app-v016.js`
- `safetrack-v023-dashboard-fix.js`
- `safetrack-v023-hierarchy-nav-fix.js`

`core.js` now owns:
- application shell and base render lifecycle;
- dashboard rendering;
- sidebar/topbar navigation;
- German-only admin shell;
- visible SafeTrack product version;
- global inner-view Menü affordance;
- stable `window.__SafeTrack` compatibility interface for later domain migrations.

The `window.__SafeTrack.version` property is canonical and write-protected through a no-op setter so legacy domain modules cannot downgrade the visible/runtime product version.

Legacy local compatibility layers that remain loaded no longer own global version/title state where Phase 1 touched them. They remain only for their not-yet-migrated domains and are scheduled for later phases.

## Release-gate results

- AppDeploy status: ready.
- Frontend runtime errors: 0.
- Backend runtime errors: 0.
- Network errors: 0.
- Production index audit: no script reference to the three removed shell owners.
- E2E run group: 3 jobs registered; AppDeploy reported the suite as passed but only 1 job as actually passed. This is not treated as three executed tests.
- Real iPhone system-print acceptance remains separate and is not claimed by this Phase 1 shell refactor.

## Rollback

Git rollback branch before cutover:
`backup/safetrack-v0-24-pre-phase1-core-cutover-20260808`

Hosting rollback:
AppDeploy v58 remains available as the pre-consolidation working release.

## Remaining consolidation phases

Phase 2: employee hierarchy/profile ownership.
Phase 3: group-training ownership.
Phase 4: print ownership and removal of historical print wrappers/styles.
Phase 5: Documents/upload/OCR ownership.
Phase 6: admin/destructive-action ownership.
Phase 7: CSS consolidation and removal of historical version stylesheet stacking.

Historical CSS is intentionally still present after Phase 1; Phase 1 removed shell JavaScript stacking, not the entire legacy runtime in one step.

## Repository synchronization note

`index.html`, canonical `core.js`, and the critical pagination/version behavior in `safetrack-v019-core-v023.js` have been synchronized back to GitHub main. Remaining legacy domain files are migrated and normalized only within their bounded consolidation phases to avoid a big-bang rewrite.
