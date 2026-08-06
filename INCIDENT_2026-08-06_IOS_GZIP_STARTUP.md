# Incident report: iOS Safari could not start the 50-training catalog

## User-visible failure

The public GitHub Pages site stopped at the SafeTrack loading screen and displayed `Failed to Decode Data.` on iPhone Safari.

## Root cause

The application was not published as normal static web files. Instead, `index.html` fetched seven Base64 text chunks, joined them in the browser, decoded them, and passed the resulting GZIP stream through the browser's `DecompressionStream` implementation. The application could not start when this browser-side decompression failed.

## Process failure

- A complex runtime packaging mechanism was introduced although GitHub Pages can serve ordinary HTML, CSS and JavaScript files directly.
- The new 50-training release was reported before successful startup had been verified on the actual public URL in mobile Safari.
- Desktop/local artifact checks did not validate the complete mobile startup path.

## Immediate recovery

- Replaced the failing native GZIP path with a Safari-compatible decompression fallback so the public demo can start while direct-static publication is prepared.
- Added a direct-static build script and deployment workflow to generate `index.html`, `styles.css` and `app.js` from the verified catalog source.

## Permanent prevention

1. Normal static files are mandatory for the primary GitHub Pages release.
2. Browser-side Base64/GZIP reconstruction is forbidden as the primary startup mechanism.
3. Public startup must be tested on mobile Safari/iOS before a release is called successful.
4. Loader errors, blank pages and decoding failures are release blockers.
5. The exact deployed artifact, not a local substitute, must pass the startup and interaction tests.
