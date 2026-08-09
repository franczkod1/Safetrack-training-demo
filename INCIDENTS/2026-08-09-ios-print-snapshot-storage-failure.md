# Incident — iPhone print snapshot storage failure

Date: 2026-08-09
Product version: SafeTrack v0.24
Affected technical versions: v66 and earlier print-preparation flow
Fixed technical version: v67 (1786235802513)

## Symptom
On a real iPhone, a Gruppenunterweisung preview for 100 Mitarbeitende rendered correctly with real ST-DOC, STPG, QR and 10 logical pages, but preparation stopped before native iOS printing with:

`snapshot storage write failed (11 files)`

Earlier the same backend failure surfaced only as `Request failed with status code 500`.

## Evidence
The physical-device screenshot showed a valid real document identity (`ST-DOC-2026-000057`), page `1/10`, QR and participant table. This proves document/page registration completed before the failure. The explicit v66 error then localized the failure to snapshot storage.

For a 10-page document the old implementation stored:
- one complete document HTML snapshot;
- ten separate page HTML snapshots.

It also sent the same page HTML twice over the API: once inside the complete document HTML and again in `pages[]`.

## Root cause
Confirmed application-side architectural defect: redundant snapshot persistence produced 11 HTML storage writes and duplicated the request payload for one 10-page logical document.

The exact AppDeploy platform threshold that caused `storage.write` to fail is not publicly documented. Therefore no undocumented file-count or size limit is asserted as the root cause.

## Correction
SafeTrack now persists exactly one canonical HTML snapshot per document. Every logical page keeps its own STPG token and uses that token as a DOM anchor inside the canonical snapshot. Page records reference the same canonical snapshot and review URLs add the STPG fragment when appropriate.

The frontend no longer sends duplicate per-page HTML snapshots. `Drucken` stays visibly disabled until snapshot preparation and print preflight succeed. The final Drucken tap remains synchronous and contains no document/snapshot API request.

## Prevention rule
For SafeTrack print documents:
1. Persist one canonical original snapshot per document unless a demonstrated requirement proves separate physical files are necessary.
2. Do not duplicate the same HTML content in both full-document and per-page storage payloads.
3. Preserve physical-page identity with STPG metadata/anchors rather than duplicate storage objects.
4. A print button must remain visibly disabled when persistent preparation fails.
5. Do not invent or code against undocumented infrastructure limits; first remove application-level redundancy and retain explicit failure diagnostics.

## Rollback
GitHub: `backup/safetrack-v0-24-pre-single-snapshot-20260809`
Hosting: AppDeploy v66 (`1786233809407`).
