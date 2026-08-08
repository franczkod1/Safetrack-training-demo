# Incident – repeated temporary marker write to main before rollback branch

Date: 2026-08-08
Status: corrected before application code change or deployment

## Observed symptom
While preparing the rollback point for the catalog-collapse bugfix, a temporary preflight marker file was created on `main` before the rollback branch was created.

## Root cause
The backup procedure incorrectly used a temporary write as an implicit way to discover the current repository state instead of reading the current commit first and creating the rollback branch directly from that immutable commit.

## Incorrect assumption
A harmless temporary file on `main` was treated as an acceptable preflight aid. This contradicts the mandatory backup/error-learning rules and repeated an earlier Phase-2 workflow mistake.

## Corrective action
- Identified the last clean commit before the marker: `a50a52fd40b45894335d36994e978707a2b9bb77`.
- Created rollback branch `backup/safetrack-v0-24-pre-catalog-collapse-fix-20260808` from that clean commit.
- Deleted the temporary marker from `main` before any SafeTrack application code change or deployment.
- AppDeploy v61 remained unchanged throughout.

## Prevention check
For every future rollback branch:
1. Use a read-only commit/branch lookup first (`search_commits`, branch/ref read, or equivalent).
2. Create the rollback branch directly from the resolved clean SHA or `main` ref.
3. Never create a temporary marker file to discover or anchor repository state.
4. Any pre-backup write to `main` blocks the release until corrected and documented.
