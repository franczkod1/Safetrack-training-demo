# SafeTrack – Mandatory Research-First Rule

Status: mandatory project rule.

## Trigger

Before **every SafeTrack modification**, including bug fixes, CSS/layout changes, printing, backend changes, refactors, deployment changes, diagnostics and test changes, research must happen **before implementation**.

## Required research sequence

1. Identify the exact user-visible symptom and the affected SafeTrack workflow.
2. Inspect the currently deployed/live SafeTrack source that actually controls the workflow. Do not reason only from old repository code or memory.
3. Research the relevant technical behavior using multiple reliable external sources whenever external platform/browser/framework behavior is involved.
4. Prefer primary sources: browser/vendor bug trackers and documentation, standards, official framework/platform documentation. Use secondary sources only as supporting evidence.
5. Compare the external findings against the current live SafeTrack implementation and identify the concrete conflicting code/rule before proposing a fix.
6. Review `PROJECT_RULES.md`, `PRINT_RULES.md` and any prior incident/lessons file relevant to the affected area.
7. Only after steps 1–6 may implementation begin, and only after the user's required explicit `Mehet` approval.

## Release rule

A fix may not be described as proven merely because it matches external guidance. It must still pass SafeTrack regression checks and, where the behavior depends on a physical environment such as iPhone/Safari system printing, the real-device acceptance check required by the project rules.
