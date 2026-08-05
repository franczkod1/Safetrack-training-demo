# SafeTrack project rules

## Existing rules

1. Before every development step, describe the planned change and wait for the user's explicit approval.
2. Verify the intended solution against reliable sources when legal, accessibility, security, or technical best practices are involved.
3. Run self-checks and regression diagnostics after every modification.
4. Keep SafeTrack completely separate from `franczkod1/handyreparatur-lippe-platform`.

## Mandatory release validation

1. `safetrack-demo.html` is the single source of truth for the application.
2. Every deployable payload must be regenerated from the current source. Old payload chunks must never be reused.
3. Before publication, reconstruct the deployable artifact and compare its SHA-256 hash byte-for-byte with the source.
4. After publication, test the actual public GitHub Pages URL in a real browser. Local tests and screenshots are not sufficient.
5. A function may only be reported as working after an end-to-end interaction verifies the expected state change on the deployed version.
6. For dashboard cards, the mandatory smoke test is: activate every card, verify navigation to the employee list, verify the correct status filter and count, then clear the filter.
7. Record the source SHA, deployment SHA, commit SHA, public test URL, and test result in the test report.
8. Never attribute a failure to the ChatGPT preview, Safari, or another environment until the published source and its event handlers have been inspected directly.
9. Never claim a test passed when it was run against a different artifact than the one actually deployed.
