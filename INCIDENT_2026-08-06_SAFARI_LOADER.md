# Incident report: Safari application loader failure

## What failed

The published SafeTrack site did not serve the application as ordinary static web files. Instead, the browser had to download multiple Base64 text fragments, join them, decode them, decompress a GZIP payload, verify it, and replace the entire document at runtime.

On iPhone Safari this process first failed with `Failed to Decode Data` and later with a generic application loading error. The application itself never started.

## Process failures

- A complex client-side packaging mechanism was used where standard static files were sufficient.
- A fallback kept the same fragile architecture instead of removing it.
- The public iPhone result was not confirmed before the release was described as fixed.
- The temporary loader introduced an unnecessary dependency on an external CDN.

## Corrective action

SafeTrack is now published directly from normal static files:

- `index.html`
- `styles.css`
- `seed-base.js`
- `trainings-a.js`
- `trainings-b.js`
- `data-final.js`
- `app.js`

No Base64 decoding, GZIP decompression, runtime document replacement, or external CDN is required to start the application.

## Prevention rule

The production entry page must directly reference ordinary HTML, CSS, and JavaScript files. Client-side archive decoding or decompression is prohibited unless a documented technical requirement exists and a real-device compatibility test has passed before publication.
