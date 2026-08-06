#!/usr/bin/env python3
from __future__ import annotations

import base64
import gzip
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PAYLOAD_DIR = ROOT / "catalog50-v1"
EXPECTED_SOURCE_SHA256 = "8c4ee57d1dbd6e2e56190db9b5870e387f07157ca8ac2245051bf3eb2d01fb6c"
BUILD_ID = "catalog50-direct-static-20260806-1"


def fail(message: str) -> None:
    raise SystemExit(message)


def read_source() -> bytes:
    files = sorted(PAYLOAD_DIR.glob("part*.txt"))
    if len(files) != 7:
        fail(f"Expected 7 payload files, found {len(files)}")

    encoded = "".join(re.sub(r"\s+", "", path.read_text(encoding="ascii")) for path in files)
    try:
        compressed = base64.b64decode(encoded, validate=True)
    except Exception as exc:
        fail(f"Base64 payload validation failed: {exc}")

    try:
        source = gzip.decompress(compressed)
    except Exception as exc:
        fail(f"GZIP payload validation failed: {exc}")

    digest = hashlib.sha256(source).hexdigest()
    if digest != EXPECTED_SOURCE_SHA256:
        fail(f"Source SHA-256 mismatch: expected {EXPECTED_SOURCE_SHA256}, got {digest}")
    return source


def split_document(source: bytes) -> tuple[str, str, str]:
    html = source.decode("utf-8")

    style_pattern = re.compile(r"<style(?:\s[^>]*)?>([\s\S]*?)</style>", re.IGNORECASE)
    script_pattern = re.compile(r"<script(?![^>]*\bsrc\s*=)(?:\s[^>]*)?>([\s\S]*?)</script>", re.IGNORECASE)

    styles = style_pattern.findall(html)
    scripts = script_pattern.findall(html)
    if not styles:
        fail("No inline style block found")
    if not scripts:
        fail("No inline script block found")

    style_seen = False
    def replace_style(_: re.Match[str]) -> str:
        nonlocal style_seen
        if style_seen:
            return ""
        style_seen = True
        return '<link rel="stylesheet" href="styles.css?v=' + BUILD_ID + '">'

    script_seen = False
    def replace_script(_: re.Match[str]) -> str:
        nonlocal script_seen
        if script_seen:
            return ""
        script_seen = True
        return '<script src="app.js?v=' + BUILD_ID + '"></script>'

    index_html = style_pattern.sub(replace_style, html)
    index_html = script_pattern.sub(replace_script, index_html)
    index_html = index_html.replace(
        "<head>",
        f'<head>\n  <meta name="safetrack-build" content="{BUILD_ID}">',
        1,
    )

    styles_css = "\n\n".join(block.strip() for block in styles).strip() + "\n"
    app_js = "\n\n".join(block.strip() for block in scripts).strip() + "\n"

    forbidden = ("DecompressionStream", "catalog50-v1/part", "atob(", "Failed to Decode Data")
    for token in forbidden:
        if token in index_html:
            fail(f"Direct index still contains loader token: {token}")

    if "trainingCatalog" not in app_js and "50" not in app_js:
        fail("Generated app.js does not appear to contain the training catalog")

    return index_html, styles_css, app_js


def main() -> None:
    source = read_source()
    index_html, styles_css, app_js = split_document(source)

    (ROOT / "index.html").write_text(index_html, encoding="utf-8", newline="\n")
    (ROOT / "styles.css").write_text(styles_css, encoding="utf-8", newline="\n")
    (ROOT / "app.js").write_text(app_js, encoding="utf-8", newline="\n")

    manifest = {
        "build": BUILD_ID,
        "source_sha256": hashlib.sha256(source).hexdigest(),
        "index_sha256": hashlib.sha256(index_html.encode("utf-8")).hexdigest(),
        "styles_sha256": hashlib.sha256(styles_css.encode("utf-8")).hexdigest(),
        "app_sha256": hashlib.sha256(app_js.encode("utf-8")).hexdigest(),
        "index_bytes": len(index_html.encode("utf-8")),
        "styles_bytes": len(styles_css.encode("utf-8")),
        "app_bytes": len(app_js.encode("utf-8")),
    }
    (ROOT / "STATIC_BUILD.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
