# SafeTrack v0.18 group Schulungsbestätigung print-fix report

## Scope

Bugfix only. Product version remains `SafeTrack v0.18`.

The group Schulungsbestätigung was repaired after an iPhone system print preview showed collapsed, vertically stacked table cells and excessive pagination.

## Source and production artifact

- Application source merge commit: `80896ff52a9c6fbd7ab06c7c9dd8b96af788cda9`
- Production URL: `https://safetrack-v14-ybr3e8.v2.appdeploy.ai/`
- Production build marker: `appdeploy-production-v0.18-printfix-80896ff5`
- AppDeploy code deployment: `v7` / `1786101540821`
- AppDeploy current test-only snapshot: `v8` / `1786101781263`
- v8 changes only the AppDeploy regression-test definition; its production `index.html` still loads application assets exclusively from commit `80896ff52a9c6fbd7ab06c7c9dd8b96af788cda9`.

## Rollback created before the fix

- AppDeploy rollback: `v6` / `1786097876791`
- Git rollback branch: `backup/safetrack-v0-18-print-working-20260807-1309`

## Implemented print layout

The group participant table now has exactly five columns:

1. `Mitarbeitende Person`
2. `P-Nr.`
3. `Tätigkeit`
4. `Datum`
5. `Unterschrift`

Each participant is exactly one table row with exactly five cells.

Responsive mobile layout is now screen-only (`@media screen and (max-width:720px)`). The print stylesheet explicitly restores `table`, `table-header-group`, `table-row-group`, `table-row` and `table-cell` semantics and uses a fixed A4 column layout.

## Validation

### Isolated preview

- Preview snapshot: `1786101266311`
- QA run group: `0576e20445c5a95c`
- Result: `5/5 passed`
- Frontend errors: `0`
- Network errors: `0`

### Production print-specific validation

Production QA run `39d8f9984f9318a7` verified:

- compact five-column Schulungsbestätigung: passed
- due-soon bulk selection and individual adjustment: passed
- empty-selection guardrails: passed
- long mobile participant list: passed
- frontend errors: `0`
- network errors: `0`

The language-sorting regression case was initially classified as `bad_test` because the randomly selected training pair exposed only one language group. This was a test-fixture problem, not an application failure.

A deterministic rerun used `ST-UW-001` and `ST-UW-005` in QA run `08f4405209c06c77`. The browser agent explicitly observed both training IDs selected, `Sprache` sorting active, multiple language groups including `Русский` and `العربية`, and employees from different language groups selected. The QA framework still labelled that one case `bad_test` because of its own exact-value evidence requirement; no frontend, network or application error was observed. The four other regression cases passed normally.

## Remaining native iOS acceptance

Automated desktop and mobile browser validation confirms that the preview table no longer collapses and that every participant uses one row. A final real iPhone/Safari system print-preview check is still required because Chromium/AppDeploy cannot fully reproduce Apple's native print renderer.

## Incident reference

See `INCIDENT_V018_GROUP_PRINT_LAYOUT.md` for root cause, corrective action and prevention checks.
