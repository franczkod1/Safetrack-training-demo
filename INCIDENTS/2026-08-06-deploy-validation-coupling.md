# Incident: Pages deployment coupled to validation

Date: 2026-08-06
Product version: SafeTrack v14

## Observed symptom

The current source files and requested functionality were present on the `main` branch, but the public GitHub Pages site continued serving an older build. The combined deploy-and-validation workflow could not be started manually from the Actions interface and did not provide a verified deployment result.

## Root cause / failure mode

Deployment, static validation, browser testing and PDF regression testing were combined into one large workflow. This created multiple failure points before and after the Pages deployment and made it impossible to distinguish a registration, build, deploy or post-deploy test failure from the public-site symptom.

## Incorrect assumption

A commit to `main`, the presence of a workflow file, or the presence of the new source files was incorrectly treated as sufficient evidence that GitHub Pages would publish the new artifact.

## Corrective action

1. Replace the combined workflow with a minimal `Deploy SafeTrack Pages` workflow that only prepares, uploads and deploys the static artifact.
2. Run browser, PDF and regression validation in a separate `Validate SafeTrack Pages` workflow after successful deployment.
3. Preserve SafeTrack v14 because this is a deployment repair, not a new user-visible feature.
4. Add `BUILD.txt` containing the exact commit SHA to every deployed artifact.

## Prevention checks

- The deployment workflow must not install Playwright, generate PDFs or run application regression tests.
- The validation workflow must not be a dependency of the deployment job.
- A release is not reported as published until the deploy action succeeds and the public `BUILD.txt` and application build marker match the intended commit.
- Product version numbers are increased only for new user-visible functionality; technical releases use commit/build identifiers.
