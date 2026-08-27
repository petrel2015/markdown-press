# Export Pipeline

## Summary

Four local export paths — A4 PDF through the browser print dialog,
phone-length and A4-width PNG images at 2× pixel ratio, and `.md` source
download/open — all generated in the browser with the document name driving
file names.

## Background

A Markdown editor is only useful if its output can leave the browser in a
form other people can consume. Markdown source serves technical readers;
PDF and images serve everyone else. The app had a live preview from the
start; the design work was making each export faithful, deterministic and
dependency-light.

## Problem

1. **PDF**: producing a true PDF in-browser usually means either a heavy
   library (pdfkit/jsPDF + layout reimplementation) or a server — both
   violate the project's zero-dependency, zero-backend constraint.
2. **Images**: a long "phone-readable" image and a paged A4 image must be
   rasterized from the *rendered* document — including diagrams — at
   controlled widths, on white, at a sharp pixel ratio.
3. **Round-tripping**: users need the source back too — save it, and open
   it again later without data mangling.

## Goals

- PDF with vector, selectable text; diagrams as native SVG; no new
  dependencies.
- PNG exports at fixed logical widths (390 px phone, 794 px A4) × 2 device
  pixel ratio, white background, on document-derived filenames.
- `.md` download and open with extension validation and cross-platform
  filename sanitization.
- Every path works offline.

## Non-Goals

- No server-side rendering or headless-browser PDF; the browser print
  dialog is the PDF engine.
- No pagination control UI beyond what the print dialog offers; margins and
  page size follow browser + `@page` rules.
- No PDF-specific theming — the print stylesheet is a fixed A4 sheet.
- No export of the editor pane; exports always render from source.
- No image format options (JPEG/WebP); PNG only, 2× only.

## Solution Overview

- **Print**: the live preview's HTML is cloned into a `#print-root`
  container; `document.title` is temporarily swapped to the document name
  (becoming the suggested PDF filename); `window.print()` runs inside a
  `requestAnimationFrame`. `css/print.css` styles the clone as an A4 sheet
  with unbreakable blocks. `afterprint` restores the title and empties the
  container; a 60 s timer is the safety net for browsers that never fire
  `afterprint`.
- **PNG**: a hidden `#png-root` container is set to the spec width; a fresh
  `marked.parse` of the source fills it; diagrams re-render inside; all
  `<img>` elements are awaited (4 s cap each); `html-to-image.toPng`
  rasterizes at `pixelRatio: 2` on white; the data URL downloads as
  `<name>-phone.png` or `<name>-a4.png`.
- **.md**: `Blob` + object URL + `a[download]`, revoked after 1 s. **Open**:
  a hidden file input accepts `.md`/`.markdown`/`.txt`; `FileReader` reads
  it locally; the name (sanitized, extension stripped) becomes the document
  name.

## Detailed Behavior

| Path | Output name | Dimensions / notes |
|------|-------------|--------------------|
| A4 PDF (print) | `<name>.pdf` (suggested by title) | A4 pages per `@page`; vector text |
| Phone PNG | `<name>-phone.png` | 390 px logical × 2 = 780 px wide, 20 px padding |
| A4 PNG | `<name>-a4.png` | 794 px logical × 2 = 1588 px wide, 60 px padding |
| `.md` download | `<name>.md` | Raw source as-is |
| Open | — | Replaces current document; autosaves immediately |

Filename rules: the document base name is sanitized
(`\ / : * ? " < > |` → `_`, whitespace collapsed); a `.md` suffix is
appended on download if missing; open rejects any other extension with a
localized notice.

Status bar shows "Rendering image…" while a PNG runs, "Exported" on
success, "Export failed — see console." on failure (each clears after 4 s).
A failed PNG run never leaves content in `#png-root`.

CORS-blocked remote images are excluded from PNG output (canvas cannot read
their pixels); local and data-URI images are awaited and included.

## User Experience

![Export menu with the three export targets](../../img/export-menu-en.webp)

One menu, three export targets plus the `.md` button beside it. PDF feels
like printing (because it is), which is also why its text remains
selectable.

## Compatibility and Historical Impact

All four paths shipped with the initial release. "No historical behavior is
affected" — there is no earlier exported format to stay compatible with.
The `.md` open/save contract (extension set, sanitization) is the stable
interface going forward.

## Data and Privacy Impact

All exports are generated and downloaded locally; nothing is uploaded and
no new storage keys are introduced. The file picker reads only the
user-selected file. Object URLs are revoked after use.

## Performance Impact

PNG export cost scales with document length (full re-parse + rasterization
at 2×); image waits cap at 4 s each. No published measurements.

## Current Limitations

- Pagination inside PDF export is browser-controlled within the `@page`
  rules; no per-page fine tuning.
- PNG is the only raster format and is always 2×.
- CORS-locked remote images drop out of PNGs (see
  [troubleshooting](../troubleshooting.md#remote-images-missing-from-png-exports)).
- Very large documents can exhaust memory during rasterization — the
  failure surfaces as the standard export-failed notice.

## Release Information

Introduced: 1.0.0 · Status: Stable (summary version — see
[CHANGELOG](../../../CHANGELOG.md) versioning note).

## Related Documentation

- [usage · Exporting](../usage.md#exporting)
- [usage · Files](../usage.md#files)
- [architecture · Export Pipelines](../architecture.md#export-pipelines)
- [mermaid-diagrams](./mermaid-diagrams.md) — diagram survival across exports

## Feature Changelog

### 1.0.0

- Initial behavior: print-clone PDF, dual-width PNG rasterizer, `.md`
  round-trip with validation and sanitization.
