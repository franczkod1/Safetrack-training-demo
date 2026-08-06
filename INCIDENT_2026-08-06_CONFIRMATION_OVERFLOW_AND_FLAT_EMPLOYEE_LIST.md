# Incident: confirmation signatures overflowed and employee navigation was flat

Date: 2026-08-06
Repository: `franczkod1/Safetrack-training-demo`

## Observed symptoms

1. The supervisor name and signature fields moved to a second printed page even though the first page contained substantial unused space.
2. The printed confirmation displayed due-date and status information, but did not provide a dedicated completion-date field or a supervisor personnel-number field.
3. Critical and 6–30-day training categories opened automatically when an employee profile was opened.
4. The employee menu displayed a flat list of all employees instead of first presenting the actually assigned job titles as collapsed groups.

## Root causes

1. The confirmation page used a large fixed minimum height together with a flex layout and a bottom-aligned signature section. Browser print headers, footers and page margins reduced the usable page area, forcing the signature section onto the next page.
2. The print header reused operational scheduling fields (`Fällig` and `Status`) instead of a purpose-built completion confirmation layout.
3. Category initial expansion was derived from training status rather than an explicit collapsed-default rule.
4. The employee page rendered the source employee table directly and had no presentation layer grouping by the existing employee `Tätigkeit` value.

## Incorrect assumptions

- It was incorrectly assumed that a visual amount of free space in the HTML preview guaranteed that the browser print engine would keep the signature section on the same physical page.
- It was incorrectly assumed that due status belonged on the signed completion record.
- It was incorrectly assumed that critical categories should open automatically.
- It was incorrectly assumed that the flat employee table remained usable as the number of employees increased.

## Corrective actions

1. Use a compact, bounded A4 confirmation layout with dedicated completion and signature fields.
2. Remove `Fällig` and `Status` from the signed print confirmation.
3. Add `Durchgeführt am`, supervisor name, supervisor personnel number, employee signature and supervisor signature to every confirmation page.
4. Collapse every employee training category by default, regardless of status.
5. Group the employee menu only by the job-title values already assigned to employees and keep every group collapsed initially.
6. Keep the original source table hidden for compatibility, while the visible interface uses the grouped job-title view.

## Prevention checks

1. The deployed browser test must generate an actual A4 PDF and verify that one selected training produces exactly one confirmation page and two selected trainings produce exactly two pages.
2. The confirmation print text must contain the completion date and both supervisor identity fields, and must not contain `Fällig` or `Status`.
3. Every training category must have `aria-expanded="false"` and a hidden body when an employee profile first opens.
4. Every employee job group must have `aria-expanded="false"` and a hidden body on first render.
5. The set of rendered job-group names must be a subset of the `Tätigkeit` values actually assigned to employees.
6. A repeat of this overflow, automatic expansion or flat-list root cause is a release-blocking regression.
