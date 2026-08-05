# Incident report: dashboard cards were not clickable

## What failed

The local canonical HTML had already been updated with interactive dashboard cards, but the GitHub Pages payload was generated from an older snapshot. The public site therefore still contained static KPI `<div>` elements without click handlers.

## Where the process failed

- I tested the updated local file instead of the exact artifact deployed to GitHub Pages.
- I did not reconstruct the compressed public payload and compare its hash with the canonical source.
- I reported the feature as working before exercising the real public URL end to end.
- I initially attributed the problem to the embedded ChatGPT/Safari preview without first inspecting the deployed source.
- The test report therefore described a result that did not apply to the published artifact.

## Corrective actions

- Added an immediate compatibility hotfix for the four dashboard cards.
- Added persistent release rules in `PROJECT_RULES.md`.
- Established `safetrack-demo.html` as the single source of truth.
- Added mandatory source-to-deployment hash verification.
- Added mandatory public-URL interaction testing before reporting success.
- Added a required dashboard smoke test for all four status cards and filter clearing.

## Prevention rule

A feature is not considered delivered until the exact deployed artifact has been tested through the public URL and the expected state change has been verified.
