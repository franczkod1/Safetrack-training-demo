# Incident: obsolete version validator blocked GitHub Pages

Date: 2026-08-06
Severity: release blocking

## Observed symptom

SafeTrack v13 source files and cache-busting references were present on `main`, but the public GitHub Pages site continued to serve the previous version.

## Root cause

The deployment workflow still executed `.github/scripts/validate-static-v11.mjs` and the deployed browser test still executed `.github/scripts/live-test-v11.mjs`. The static validator explicitly required the `direct-static-v11` build marker and v11 print identifiers. The v13 source therefore failed validation before the Pages artifact could be deployed.

## Incorrect assumption

A successful source commit or merge was treated as evidence that the Pages workflow had deployed the new version. It was also incorrectly inferred from a connector query that no workflow had started, although that query only exposed pull-request-associated runs.

## Corrective action

- Add and use `validate-static-v13.mjs`.
- Add and use `live-test-v13.mjs`.
- Keep the Pages artifact file list synchronized with the release assets.
- Verify the exact public build marker, visible version badge and generated PDF pagination after deployment.

## Mandatory prevention check

Every version change must update, in the same release:

1. `index.html` build marker and cache-busting parameters;
2. runtime version badge and print version marker;
3. static validator referenced by the workflow;
4. deployed browser/PDF test referenced by the workflow;
5. GitHub Pages artifact file list.

A release is blocked if any workflow script expects an older version. Repository state alone must never be reported as a successful public deployment.
