# Incident: unbalanced status fixture and CI rebase failure

Date: 2026-08-06

## Symptoms

1. The live dashboard placed all 45 test employees in the `Kritisch` group.
2. Every department therefore showed 0% fully current employees.
3. The browser test rejected the critical card because the filtered list contained all 45 employees.
4. The workflow then failed while saving diagnostics with:
   `cannot pull with rebase: You have unstaged changes`.

## Root causes

### Test-data model

The 50-training expansion reused a date-offset generator designed for a much smaller catalog. With many job-assigned trainings, every employee received at least one critical training. The employee status correctly used the worst assigned-training status, so all 45 employees became critical.

### Browser test

The test assumed that a status filter must return fewer than 45 employees. It did not compare the filtered result with the employee count actually displayed on the selected dashboard card.

### Git workflow

The workflow generated `LIVE_TEST_RESULT.json`, `LIVE_TEST_SCREENSHOT.png` and `STATIC_VALIDATION_RESULT.txt`, then executed `git pull --rebase` before staging and committing them. Git correctly refused to rebase a dirty working tree.

## Corrective actions

1. Added a versioned demo fixture that creates a stable distribution:
   - 12 critical employees;
   - 15 employees due in 6–30 days;
   - 18 fully current employees.
2. Preserved non-fixture completion records when applying the demo fixture.
3. Changed the live browser test to read the displayed employee count from each dashboard card and require the filtered list to match it exactly.
4. Added explicit assertions for the 12/15/18 presentation distribution.
5. Changed the workflow order to stage and commit generated diagnostics before `git pull --rebase`.
6. Added static validation of the fixture distribution before the public browser test.

## Prevention rules

The permanent rules are recorded in `PROJECT_RULES.md`. In particular:

- status tests compare UI counts with filtered results;
- presentation fixtures must represent every primary status;
- CI-generated files are committed before a rebase;
- a successful browser interaction is required before a release is reported as working.
