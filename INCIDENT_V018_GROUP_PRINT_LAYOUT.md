# Incident: SafeTrack v0.18 group Schulungsbestätigung print layout

## Observed symptom

On iPhone system print preview, the group Schulungsbestätigung participant table collapsed into narrow stacked boxes. Header labels and participant values wrapped vertically, a single employee consumed multiple visual rows, and a list of roughly 34 participants expanded to about 10 print pages.

## Root cause

The responsive rule was declared as `@media(max-width:720px)` without a screen media type. On an iPhone-sized print viewport, those mobile table rules remained eligible during printing and combined with global responsive table behavior. The print stylesheet did not explicitly restore `table`, `table-row-group`, `table-row` and `table-cell` display semantics for every table layer.

The participant schema also used `Nr.`, language and a large signature cell, which was not the compact structure required for a group attendance confirmation.

## Incorrect assumption

A later `@media print` block was assumed to automatically neutralize all narrow-screen responsive rules. CSS media queries can overlap: a small print viewport may satisfy both `max-width` and `print` unless the responsive query is explicitly screen-only or the print rules fully reset the affected properties.

## Corrective action

1. The responsive block is now `@media screen and (max-width:720px)` so screen-only mobile layout cannot affect printing.
2. The print stylesheet explicitly forces the confirmation table hierarchy back to table semantics with `display: table`, `table-header-group`, `table-row-group`, `table-row` and `table-cell`.
3. The group confirmation participant schema is now exactly five columns: `Mitarbeitende Person`, `P-Nr.`, `Tätigkeit`, `Datum`, `Unterschrift`.
4. Each participant is rendered as exactly one `<tr>` containing exactly five `<td>` cells.
5. A fixed `colgroup` and compact row height are used to keep the layout stable and space-efficient on A4 portrait pages.

## Prevention checks

1. Any CSS intended only for responsive screen UI must use an explicit `screen` media type when the same component is printable.
2. Printable tables must explicitly restore table display semantics inside `@media print` when global/responsive CSS can alter table elements.
3. Group Schulungsbestätigung regression tests must assert exactly five participant columns and exactly one table row per participant.
4. A long participant list must be tested in a 375 × 667 mobile workflow before release.
5. Final acceptance of an iOS print-layout change still requires a real iPhone/Safari system print-preview check because Chromium preview cannot fully reproduce the native iOS print renderer.
