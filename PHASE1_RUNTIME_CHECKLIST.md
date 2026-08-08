# Phase 1 runtime checklist

Before cutover:
- research-first sources reviewed
- runtime architecture rules reviewed
- ownership map reviewed
- employee domain confirmed out of scope
- hosting rollback retained

After cutover:
- `core.js` is loaded
- `app-v016.js` is not loaded
- `safetrack-v023-dashboard-fix.js` is not loaded
- `safetrack-v023-hierarchy-nav-fix.js` is not loaded
- dashboard current-date rendering works
- KPI navigation works
- no admin language selector is present
- Nachweise is absent from main navigation
- Menü/Zurück behavior remains available
- `window.__SafeTrack` compatibility API remains available
- Documents and training catalog still open
- desktop/mobile startup has no runtime/network errors
