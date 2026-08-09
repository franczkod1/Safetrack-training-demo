# Incident — iPhone print returned HTTP 500 before native print dialog

Date: 2026-08-09
Product version: SafeTrack v0.24
Affected deployment: AppDeploy v65
Corrective deployment: AppDeploy v66 (`1786233809407`)

## Symptom

On PC the group print workflow worked. On iPhone Safari the SafeTrack print preview itself rendered correctly (logical pages, QR, page numbering and participant table were visible), but tapping `Drucken` produced `Request failed with status code 500` before the native iOS print sheet opened.

## Confirmed architectural cause

The v65 `print.js` print-button path still performed asynchronous backend work before calling the browser's native print function:

`Drucken → document prepare → snapshot upload → layout stabilization → native print`

This violated the print ownership / iOS acceptance design because the final user gesture was coupled to network-dependent work and the native print call was delayed until after awaited operations.

The exact server-side sub-operation that produced the observed 500 could not be recovered from the available runtime error logs, so it is intentionally not claimed as proven. The most exposed server operation for a 100-person / 10-page document was snapshot persistence, which wrote the full document plus every page snapshot in one storage write request.

## Correction

AppDeploy v66 changes the flow to:

`open preview → prepare ST-DOC/STPG → decorate QR/page identities → persist snapshots → stabilize → preflight → enable Drucken`

The final `Drucken` click now performs only synchronous local checks, activates the prepared print root and directly invokes the captured native `window.print()` function. No document preparation or snapshot API request is made from that click path.

Backend snapshot storage writes are also chunked into batches of four files with retries and explicit failure logging. Snapshot failures now return a specific `snapshot storage write failed (N files)` error instead of the generic snapshot error.

## Prevention / release gate

1. `Drucken` must remain disabled until the prepared print root passes preflight.
2. The final native-print click path must contain no `await`, API request or delayed preparation.
3. Group print preview must visibly report `druckbereit` before the button becomes available.
4. Storage persistence for multi-page snapshots must use bounded batches.
5. Automated QA validates preview readiness and print-domain ownership, but actual iPhone Safari system-print rendering remains a physical-device acceptance gate.
6. Do not add a separate iPhone print override/fix module; corrections belong in canonical `print.js` and `backend/v024.ts`.
