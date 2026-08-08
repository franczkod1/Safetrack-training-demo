# Incident — Phase 3 QA newline formatting

Date: 2026-08-08
Product: SafeTrack v0.24
Affected artifact: AppDeploy v63 (`1786220832504`), tests only

## Observed symptom
After the Phase 3 runtime deployment, AppDeploy reported four QA jobs although `tests/tests.txt` was intended to contain five tests. The intended Test 5 appeared as literal `\n` text appended to Test 4 instead of as a separate test block.

## Root cause
The AppDeploy diff replacement encoded intended line breaks as escaped backslash-n sequences in the replacement string. The application runtime files were correct; only the QA text file formatting was wrong.

## Incorrect assumption
It was assumed that the escaped newline sequences in the update payload would be materialized as real line breaks in `tests/tests.txt`.

## Corrective action
A test-only AppDeploy v64 (`1786221273347`) replaced the literal `\n` sequences with real line breaks. AppDeploy then recognized five independent QA jobs. The canonical group-training Test 5 ran independently and passed.

## Prevention check
After every test-file modification, read back `tests/tests.txt` from the deployed snapshot before accepting the release and verify that:
- every intended `## Test N` appears on its own physical line;
- AppDeploy reports the expected `total_jobs` count;
- no literal `\\n` sequence appears where a structural newline is required.
