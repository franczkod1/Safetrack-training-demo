# Incident: iOS print preview lost content and selected documents

## Observed symptom

On SafeTrack v0.16, the iPhone system print preview displayed a partially empty sheet. Selecting multiple trainings still produced only one visible training document.

## Root cause

The printable sheet was nested inside the fixed, scrollable on-screen preview overlay. At print time, an older rule hid every direct `body` child except a direct `#st-print-sheet`, while the actual sheet was no longer a direct child. iOS/Safari therefore received a hidden or clipped nested print subtree.

## Incorrect assumption

A Chromium-visible in-app preview and successful DOM count were treated as sufficient evidence that the same nested subtree would paginate correctly in the iOS system print pipeline.

## Corrective action

SafeTrack v0.17 builds a fresh print-only root as a direct child of `body`. It contains one independent print document for every selected training and is the only visible body child during system printing. The on-screen preview remains separate and is never used as the system print root.

## Prevention check

For every print change:

1. Verify the prepared system print root is a direct `body` child.
2. Verify its `data-document-count` equals the selected training count for 1, 2 and 5 selections.
3. Verify confirmation-only and full-training modes separately.
4. Generate and count PDF pages in Chromium.
5. Require final iPhone/Safari system print-preview acceptance before declaring the regression closed.
