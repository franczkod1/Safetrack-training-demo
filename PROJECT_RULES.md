# SafeTrack project rules

## Existing rules

1. Before every development step, describe the planned change and wait for the user's explicit approval.
2. Verify the intended solution against reliable sources when legal, accessibility, security, or technical best practices are involved.
3. Run self-checks and regression diagnostics after every modification.
4. Keep SafeTrack completely separate from `franczkod1/handyreparatur-lippe-platform`.

## Mandatory backups and rollback

1. Before any source, data, workflow, hosting or deployment change, create a recoverable backup of the latest confirmed working public release.
2. Every release backup must include both:
   - a source-control rollback point, using a dedicated Git branch, tag or immutable commit identifier; and
   - a hosting-platform rollback point or retained deployable version whenever the hosting platform supports version history.
3. Record the public URL, product version, source commit, hosting version identifier and backup creation time.
4. The latest confirmed working backup must not be deleted, overwritten or repointed until the replacement release passes the full live regression suite.
5. If a new release fails publication or live validation, restore the latest confirmed working backup before beginning unrelated feature work.
6. The backup rule applies even when the requested change is described as a small fix.

## Mandatory release validation

1. The production-facing public release, whether hosted by AppDeploy, GitHub Pages or another approved static host, must use normal static web files (`index.html`, CSS, JavaScript and optional JSON data files).
2. Browser-side Base64 assembly, GZIP decompression or similar runtime reconstruction must not be the primary application loader.
3. Every deployable artifact must be regenerated from the current source. Old payload chunks must never be reused for a new release.
4. Before publication, compare the release files and their recorded SHA-256 hashes with the tested source when the hosting path exposes artifact hashes.
5. After publication, test the exact public production URL in a real browser. Local tests, source inspection and repository screenshots are not sufficient.
6. Startup must be tested separately in current desktop Chromium and a narrow mobile viewport representative of Safari/iOS. A blank page, loader loop or decoding error is a release blocker.
7. A function may only be reported as working after an end-to-end interaction verifies the expected state change on the deployed version.
8. For dashboard cards, the mandatory smoke test is: activate every card, verify navigation to the employee list, verify the correct status filter and count, then clear the filter.
9. Record the source SHA, deployment/version identifier, public test URL, browser or viewport and test result in the test report.
10. Never attribute a failure to the ChatGPT preview, Safari or another environment until the published source and its startup/event handlers have been inspected directly.
11. Never claim a test passed when it was run against a different artifact than the one actually deployed.
12. If automated deployment does not start, do not silently claim success. Record the blocked step and use a verified recovery path.
13. Dashboard tests must compare the filtered result with the employee count displayed on the selected card; they must not assume that a status can never contain all employees.
14. Presentation test data must contain meaningful representatives of every primary status. The default 100-worker SafeTrack fixture is 10 critical, 20 due in 6–30 days and 70 fully current employees.
15. Generated CI result files must be staged and committed before `git pull --rebase`. A rebase must never run with unstaged or uncommitted generated artifacts.
16. Every workflow failure must persist the failing step, validation output and browser-test result whenever repository permissions allow it.
17. Employee training profiles must derive their groups exclusively from the categories already defined in the Unterweisungen catalog; a second independent training-category system is prohibited.
18. Employee-profile categories and their trainings must be sorted by worst status first, then by the earliest due date.
19. Category-level selection must expose checked, unchecked and mixed states and must be verified together with individual multi-selection, batch start and print output.
20. Every selected training must produce its own independent confirmation document with a separate employee signature and a separate instructor/supervisor signature.
21. Printing must offer both confirmation-only output and full training content followed by a separate confirmation page.
22. Critical and 6–30-day trainings must have separate bulk-selection controls, and each control must be verified to select only its own status.
23. A category toggle must synchronize `aria-expanded` and the controlled element's `hidden` state on the first activation.
24. One selected training must produce exactly one physical A4 confirmation page, verified by generating and counting pages in an actual PDF.
25. A signed confirmation page must contain completion date, supervisor name, supervisor personnel number, employee signature and supervisor signature, and must not contain operational `Fällig` or `Status` fields.
26. Every training category in an employee profile must start collapsed regardless of critical, due-soon or valid status.
27. The employee menu must first display the five broad organizational groups `Produktion`, `Reinigung`, `Logistik`, `Instandhaltung` and `Qualitätskontrolle`. Each broad group must start collapsed. Its assigned `Tätigkeit` groups must also start collapsed and must be derived from actual employee data.
28. Very similar job titles must be consolidated into one understandable role; for example, `Elektriker` and `Elektroniker` must not appear as separate job groups.
29. One user interaction domain may have only one active implementation module. Layered override modules for the same employee, category, selection, navigation or print behavior are prohibited.
30. Confirmation-page layout must use compact normal document flow. Fixed physical page heights, flexible spacer rows and bottom-pushing signature layouts are prohibited.
31. Chromium PDF page counts are necessary but not sufficient for iOS printing; confirmation pagination requires a final iPhone/Safari print-preview acceptance check when that environment is available.
32. The user-visible SafeTrack version number may increase only when a new user-visible function or materially changed user workflow is introduced.
33. Bug fixes, deployment repairs, workflow changes, refactoring, cache invalidation, diagnostics and test improvements must keep the current SafeTrack version number.
34. Technical releases must be distinguished with the Git commit SHA, build identifier or cache token instead of a new SafeTrack product version.
35. Deployment and validation must remain separable. A validation failure must not silently replace the last known working release.
36. Every non-dashboard menu, detail view, modal workflow and print-options view must provide a visible back action that returns to the immediately preceding application state rather than always jumping to the dashboard.
37. Back navigation must be tested across at least three consecutive states and in both desktop and mobile layouts.
38. The employee hierarchy must follow the exact order organizational area → assigned `Tätigkeit` group → employee. Expanding an organizational area must never show training content directly.
39. The employee page must provide live search by employee name and full or partial personnel number. Matching hierarchy levels must open automatically, and an explicit no-results state is mandatory.
40. Employee names and personnel numbers must be visually separated; a personnel number must never be concatenated directly to the employee name.
41. Every training must have one stable unique identifier in the `ST-UW-NNN` format. Editing the title, version, language content or assignment must not change that identifier, and duplicating or creating a training must allocate a new identifier.
42. The stable training identifier must be visible in the catalog, training editor, employee profile, saved records, complete printed training and every confirmation/Bestätigung page. A visible print preview must allow this identifier to be verified before system printing.
43. `Reinigung` is a first-class organizational area and must not be nested under `Produktion`. It must expose actual cleaning Tätigkeit groups derived from employee data, including hygiene/cleaning, production cleaning and building/social-area cleaning.
44. The 10 critical, 20 due-soon and 70 valid demonstration employees must be distributed across every organizational area. No area may be left without at least one critical and one due-soon employee.
45. The system print subtree must be a fresh, non-fixed, non-scrollable direct child of `body`; the on-screen preview overlay must never be reused as the system print root.
46. The prepared system print root must contain exactly one independent print document per selected training. Its document count must be checked for 1, 2 and 5 selected trainings in confirmation-only and full-training modes.
47. A release that changes printing cannot be accepted solely from an in-app preview. It requires Chromium PDF validation plus final iPhone/Safari system print-preview acceptance when available.

## Mandatory error-learning protocol

1. Every confirmed mistake must be recorded in an incident or lessons-learned file before the affected task is closed.
2. Each record must contain the observed symptom, root cause, incorrect assumption, corrective action and one automated or procedural prevention check.
3. Before changing an area that has a prior incident, review the relevant incident and verify that its prevention check is present in the new implementation.
4. Repeating a previously documented root cause is a release-blocking regression.
5. A deployment may only be described as published after the deployment action itself succeeds and the exact public artifact passes the browser test. Waiting for an external deployment is not equivalent to deploying it.
6. Workflow-generated commits must never be relied upon to trigger GitHub Pages, because commits made with the repository `GITHUB_TOKEN` do not trigger a Pages build.
