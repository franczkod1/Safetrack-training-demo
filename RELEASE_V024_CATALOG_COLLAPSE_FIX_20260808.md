# SafeTrack v0.24 – catalog collapse bugfix release record

Release time: 2026-08-08 22:10 Europe/Berlin
Public URL: https://safetrack-v14-ybr3e8.v2.appdeploy.ai/
Product version: SafeTrack v0.24
Hosting release: AppDeploy v62
AppDeploy snapshot: `1786219299290`
Rollback hosting version: AppDeploy v61 (`1786216154120`)
Rollback source branch: `backup/safetrack-v0-24-pre-catalog-collapse-fix-20260808`
Runtime source commit (`trainings.js`): `c38578ce6e69cd35b1f70f8dd72cb1e5de16fd12`
QA test sync commit: `5772b4c93c63e2881e351b94faab3e98f0dcd99a`

## Change
Canonical `trainings.js` now synchronizes catalog category `aria-expanded`, `hidden`, and explicit visual `display` state. Closed categories use `display:none`; open categories use `display:grid`. No new version/fix/compat runtime layer was added.

## Live validation
- Deployment status: ready.
- Frontend runtime errors: 0.
- Backend runtime errors: 0.
- Network errors in deployment snapshot: 0.
- Desktop E2E Test 3: passed; canonical Mitarbeitende/Unterweisungskatalog workflow and collapsed catalog opening remained functional.
- Mobile E2E Test 4: passed; category verified closed by default, opened on first tap, and fully closed again on second tap.
- Tests 1 and 2: QA worker timed out after 300 seconds with zero executed steps; not counted as passed.

## Acceptance
The catalog collapse bug is accepted at browser E2E level on the exact deployed public artifact. This release does not change printing, backend data, ST-DOC/STPG behavior, or the SafeTrack product version.
