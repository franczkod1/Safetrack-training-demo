# SafeTrack v0.24 Phase 1 runtime ownership

Status: implementation gate

Canonical Phase 1 owner: `core.js`

Owned by core after cutover:
- application state and render lifecycle
- history/back behavior
- sidebar/topbar shell
- dashboard rendering
- main page navigation
- admin language shell (German only)
- visible product version
- global inner-view Menu affordance

Explicitly not migrated in Phase 1:
- employee hierarchy/profile enhancements
- group-training workflow
- Documents/OCR/review
- individual/group print controllers
- hard-delete admin behavior

Legacy production owners to remove together after parity:
- `app-v016.js`
- `safetrack-v023-dashboard-fix.js`
- `safetrack-v023-hierarchy-nav-fix.js`

Compatibility contract retained for later domains:
- `window.__SafeTrack.catalog`
- `window.__SafeTrack.records`
- `window.__SafeTrack.state`
- `window.__SafeTrack.render()`
- `window.__SafeTrack.back()`
- `window.__SafeTrack.pushHistory()`
- `window.__SafeTrack.openEmployee()`
- `window.__SafeTrack.nextTrainingNumber()`
- `window.__SafeTrack.ensureTrainingNumbers()`
