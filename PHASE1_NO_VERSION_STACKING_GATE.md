# Phase 1 no-version-stacking gate

The Phase 1 release is blocked if production index loads any of the following shell owners after `core.js` is active:
- app-v016.js
- safetrack-v023-dashboard-fix.js
- safetrack-v023-hierarchy-nav-fix.js

The purpose of this gate is to make the new canonical owner exclusive, not an additional overlay.
