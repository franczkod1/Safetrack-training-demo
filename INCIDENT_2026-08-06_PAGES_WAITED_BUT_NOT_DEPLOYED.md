# Incident: workflow waited for GitHub Pages but never deployed it

Date: 2026-08-06
Repository: `franczkod1/Safetrack-training-demo`

## Observed symptom

The repository contained the `direct-static-v8` files, but the public GitHub Pages site continued serving the older release. The new files `employee-training-groups.css`, `status-fixture.js` and `employee-training-groups.js` returned HTTP 404, while the deployed `index.html` did not match the current `main` branch.

## Root cause

The validation workflow did not contain a GitHub Pages deployment action. It only polled the public URL and waited for some other process to publish the repository files. No such reliable publishing process existed for the new commits.

The previous workflow also committed diagnostics back with the repository `GITHUB_TOKEN`. GitHub documents that commits created by a workflow using `GITHUB_TOKEN` do not trigger a GitHub Pages build.

## Incorrect assumption

It was incorrectly assumed that updating files on `main`, or increasing the polling timeout, was equivalent to publishing the exact static artifact to GitHub Pages.

## Corrective action

Replace the polling-only workflow with an explicit custom GitHub Pages workflow using:

- `actions/configure-pages@v5`
- `actions/upload-pages-artifact@v4`
- `actions/deploy-pages@v4`
- the `github-pages` deployment environment
- `contents: read`, `pages: write` and `id-token: write` permissions

The workflow must package only the approved public static files into `_site`, deploy that artifact, and run the browser test only after the deployment job succeeds.

Diagnostics must be stored as GitHub Actions artifacts rather than committed back to `main`.

## Prevention checks

1. The workflow must contain `actions/deploy-pages@v4`.
2. The browser-test job must have `needs: deploy`.
3. The deployment job must expose and record the Pages URL.
4. The workflow must not contain `git push`, `git pull --rebase` or `contents: write` for test-result persistence.
5. A release is blocked unless the deployed page reports the expected build marker and the exact end-to-end tests pass.
6. Extending a polling timeout is prohibited as a substitute for adding a missing deployment step.
