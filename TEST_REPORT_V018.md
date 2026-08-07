# SafeTrack v0.18 test report

## Isolated AppDeploy preview

- Tested application source commit: `6bc4635e5d427b55110cd63e9c342cba7bbe92e1`
- Documentation/rules commits after tested code do not alter the application runtime.
- Preview app: `safetrack-v0-16-preview-u9b9co`
- Preview snapshot: `1786097479126`
- Preview URL: `https://safetrack-v0-16-preview-u9b9co.v2.appdeploy.ai/`
- QA run group: `79a62702274308f3`
- Automated browser result: `5/5 passed`
- Frontend errors: `0`
- Network errors: `0`
- Desktop workflows: passed
- Mobile 375 × 667 workflow: passed

## Verified workflows

1. One training can be selected and all matching critical employees can be assigned in bulk.
2. Multiple trainings can be selected before entering one shared employee-assignment workflow.
3. Only employees matching at least one selected training are offered.
4. Employees can be grouped consecutively by language with visible language headings.
5. The 6–30-day bulk selector works and the result can be adjusted with individual employee checkboxes.
6. Empty training and empty employee selections block continuation.
7. Each selected training receives its own Schulungsbestätigung participant list containing only selected employees to whom that training applies.
8. Participant lists contain employee name, P-number, language and signature field, plus training ID/version/date and trainer/supervisor fields.
9. The group system print root remains separate from the visible preview.
10. On mobile, the employee picker remains within the viewport, only the employee list scrolls, the continuation action remains visible and the confirmation table does not introduce horizontal page scrolling.

## Regressions found and corrected before release

- A global MutationObserver caused a repeated DOM refresh loop and prevented QA interaction. It was removed in favor of event-driven enhancement.
- The first mobile layout allowed the employee list to make the continuation footer unreachable. The picker is now viewport-bounded with a scrollable list and persistent footer.

See `INCIDENT_V018_GROUP_WORKFLOW.md` for root-cause and prevention details.

## Release gate

The preview is accepted for merge because the exact application code passed all five browser workflows. Production must be redeployed from the final merged `main` commit and the same five workflows must pass again on the production URL before SafeTrack v0.18 is reported as published.
