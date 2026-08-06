# SafeTrack project rules

## Existing rules

1. Before every development step, describe the planned change and wait for the user's explicit approval.
2. Verify the intended solution against reliable sources when legal, accessibility, security, or technical best practices are involved.
3. Run self-checks and regression diagnostics after every modification.
4. Keep SafeTrack completely separate from `franczkod1/handyreparatur-lippe-platform`.

## Mandatory release validation

1. The production-facing GitHub Pages release must use normal static web files (`index.html`, `styles.css`, `app.js` and optional JSON data files).
2. Browser-side Base64 assembly, GZIP decompression or similar runtime reconstruction must not be the primary application loader.
3. Every deployable artifact must be regenerated from the current source. Old payload chunks must never be reused for a new release.
4. Before publication, compare the release files and their recorded SHA-256 hashes with the tested source.
5. After publication, test the actual public GitHub Pages URL in a real browser. Local tests and screenshots are not sufficient.
6. Startup must be tested separately in current desktop Chromium and mobile Safari/iOS. A blank page, loader loop or decoding error is a release blocker.
7. A function may only be reported as working after an end-to-end interaction verifies the expected state change on the deployed version.
8. For dashboard cards, the mandatory smoke test is: activate every card, verify navigation to the employee list, verify the correct status filter and count, then clear the filter.
9. Record the source SHA, deployment SHA, commit SHA, public test URL, browser and test result in the test report.
10. Never attribute a failure to the ChatGPT preview, Safari or another environment until the published source and its startup/event handlers have been inspected directly.
11. Never claim a test passed when it was run against a different artifact than the one actually deployed.
12. If automated deployment does not start, do not silently claim success. Record the blocked step and use a verified recovery path.
13. Dashboard tests must compare the filtered result with the employee count displayed on the selected card; they must not assume that a status can never contain all employees.
14. Presentation test data must contain meaningful representatives of every primary status. The default SafeTrack fixture is 5 critical, 10 due in 6–30 days and 30 fully current employees.
15. Generated CI result files must be staged and committed before `git pull --rebase`. A rebase must never run with unstaged or uncommitted generated artifacts.
16. Every workflow failure must persist the failing step, validation output and browser-test result whenever repository permissions allow it.
17. Employee training profiles must derive their groups exclusively from the categories already defined in the Unterweisungen catalog; a second independent category system is prohibited.
18. Employee-profile categories and their trainings must be sorted by worst status first, then by the earliest due date.
19. Category-level selection must expose checked, unchecked and mixed states and must be verified together with individual multi-selection, batch start and print output.

## Mandatory error-learning protocol

1. Every confirmed mistake must be recorded in an incident or lessons-learned file before the affected task is closed.
2. Each record must contain the observed symptom, root cause, incorrect assumption, corrective action and one automated or procedural prevention check.
3. Before changing an area that has a prior incident, review the relevant incident and verify that its prevention check is present in the new implementation.
4. Repeating a previously documented root cause is a release-blocking regression.
5. A deployment may only be described as published after the deployment action itself succeeds and the exact public artifact passes the browser test. Waiting for an external deployment is not equivalent to deploying it.
6. Workflow-generated commits must never be relied upon to trigger GitHub Pages, because commits made with the repository `GITHUB_TOKEN` do not trigger a Pages build.
