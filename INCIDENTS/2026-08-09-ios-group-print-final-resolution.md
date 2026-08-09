# Incident resolution: iPhone group printing – blank pages, server 500 and snapshot storage failure

Date resolved: 2026-08-09
Product version: SafeTrack v0.24
First fully physically accepted technical release: AppDeploy v67 (`1786235802513`)
Rollback before final storage change: AppDeploy v66

## Final user-visible acceptance

A real iPhone/Safari system print preview was tested with one group training and 100 selected employees.

Physical acceptance result:
- 100 employees were split into 10 explicit SafeTrack logical pages.
- iOS system print preview showed 10 physical pages.
- Page content was visibly rendered; pages were not blank.
- Each page retained its own ST-DOC, STPG/QR identity and `Seite x/y` metadata.
- The participant table retained exactly four columns: `Mitarbeitende Person`, `PNr.`, `Tätigkeit`, `Unterschrift`.
- No HTTP 500 dialog appeared before system print.
- The final `Drucken` action reached the native iOS print preview successfully.

This is the first physical iPhone acceptance evidence that closes the original blank-page incident.

## Failure sequence

### 1. Blank physical pages

Earlier revisions rendered the in-app preview and produced the correct iOS page count, but the native iPhone print thumbnails were blank.

Contributing architectural causes included:
- multiple historical modules owning the same print lifecycle;
- legacy capture handlers and CSS participating in the same print path;
- Safari-sensitive whole-app pruning with `display:none`;
- whole-page `break-inside/page-break-inside: avoid` behavior;
- lifecycle cleanup that could invalidate the printable DOM before WebKit completed painting.

### 2. HTTP 500 after `Drucken`

After the print subsystem was consolidated, the native print call was still preceded by asynchronous server work. On iPhone the user saw `Request failed with status code 500` instead of reaching the system print sheet.

The print flow was then changed so all ST-DOC/STPG/QR/snapshot preparation occurs before the final user print action. `Drucken` now performs only the synchronous native print handoff and no longer starts document or snapshot API work.

### 3. Exact storage failure identified

After the asynchronous print-path issue was removed, the remaining backend failure became explicit:

`snapshot storage write failed (11 files)`

For a 10-page group document the backend was redundantly attempting to store:
- 1 full-document HTML snapshot; plus
- 10 per-page HTML snapshots.

The 11-file write failed on the real iPhone workflow.

## Final corrective architecture

### Single print owner

`print.js` is the only active SafeTrack print execution owner.

The production path no longer depends on historical `window.print` wrappers or multiple competing print controllers.

### Preview-time preparation

Before `Drucken` becomes available, SafeTrack completes:
1. group pagination;
2. ST-DOC creation;
3. STPG creation for every logical page;
4. QR generation;
5. snapshot persistence;
6. DOM staging as a direct `body` child;
7. font/layout stabilization;
8. print preflight.

Only after all steps succeed is `Drucken` enabled.

### Synchronous final print handoff

The final user click performs the native print call directly. No document preparation, snapshot write, network request, `await`, or artificial delay is placed between the user activation and the native print call.

### One canonical snapshot per document

AppDeploy v67 changed storage from 11 duplicated files to exactly one canonical HTML snapshot per SafeTrack document.

For a 10-page group document:
- snapshot files written: 1;
- logical pages: 10;
- every page keeps its own STPG token;
- each page DOM element uses its STPG as its anchor/id;
- all page records reference the same canonical snapshot path;
- page review URLs can target the page with `#<STPG>`.

This preserves page-level identity without duplicating the full page HTML into separate storage objects.

### Print-button guardrail

`Drucken` is visibly disabled while preparation is running or after preparation fails. It becomes active only after successful snapshot persistence and print preflight.

## Why the final solution worked

The final fix removed three independent classes of failure rather than adding another override layer:

1. **Runtime ownership conflict** – consolidated to one canonical `print.js` owner.
2. **Safari user-activation/lifecycle risk** – all asynchronous work moved before the final print click.
3. **Redundant snapshot storage** – reduced 1+N snapshot writes to one canonical document snapshot while preserving page identity with STPG anchors.

The final real-device test confirmed the complete chain, not only the browser preview.

## Prevention rules

- Never add a second print lifecycle owner.
- Never wrap `window.print()` in multiple historical/versioned modules.
- Never perform server/network preparation after the final `Drucken` user action.
- `Drucken` must remain disabled until the complete printable document is ready.
- Persist one canonical snapshot per document unless a verified requirement explicitly needs independent storage objects.
- Keep STPG identity per logical/physical page even when storage is shared.
- Do not prune the rest of the application with Safari-sensitive `display:none` patterns around the print root.
- Do not apply whole-page `break-inside: avoid` on iPhone/Safari.
- Keep the print root in stable normal flow and as a direct child of `body` before invoking native print.
- Real iPhone/Safari system print preview is mandatory for every future change that affects group pagination, print CSS, print lifecycle or page size.
- Correct logical page count alone is not acceptance; every physical page must visibly render its content.

## Evidence

Physical user test on 2026-08-09:
- iPhone/Safari native print preview opened successfully;
- indicator showed 10 total pages;
- visible page 9/10 contained the complete SafeTrack confirmation content, QR, ST-DOC `ST-DOC-2026-000057`, Unterweisungs-ID `ST-UW-001`, version `v3.2`, participant table and footer;
- adjacent pages were also visibly rendered in the native system preview.

The user explicitly confirmed the result as successful.

## Related project records

- `INCIDENTS/2026-08-08-ios-group-print-blank-pages.md`
- `PRINT_RULES.md`
- `RUNTIME_ARCHITECTURE_RULES.md`
- canonical runtime owner: `print.js`
- backend snapshot implementation: `backend/v024.ts`
