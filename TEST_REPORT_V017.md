# SafeTrack v0.17 test report

## Isolated preview

- Tested source commit: `f736e7ecd7154fa37c2bf6fceb4fc7721e20e3e2`
- AppDeploy preview app: `safetrack-v0-16-preview-u9b9co`
- AppDeploy snapshot: `1786063325025`
- Public preview URL: `https://safetrack-v0-16-preview-u9b9co.v2.appdeploy.ai/`
- Automated browser result: `5/5 passed`
- Desktop viewport: passed
- Mobile viewport representative of iPhone width: passed
- Frontend errors: `0`
- Network errors: `0`

## Verified workflows

1. Five collapsed organizational areas with Reinigung as an independent area.
2. Reinigung contains Hygiene und Reinigung, Produktionsreinigung and Gebäude- und Sozialraumreinigung.
3. Employee distribution is 40/10/25/10/15.
4. Every organizational area contains critical and 6–30-day employees; totals remain 10/20/70.
5. Two selected trainings produce two visible confirmation documents.
6. Five selected trainings produce five full training documents, each followed by a confirmation page.
7. Mobile hierarchy, selection, preview and back navigation work without horizontal page scrolling.

## Remaining platform acceptance

The exact iPhone/Safari system print dialog cannot be fully validated by Chromium automation. Final acceptance requires opening the production release on an iPhone and confirming that the native print preview contains all selected documents with complete text.
