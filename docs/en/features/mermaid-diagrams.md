# Mermaid Diagrams

## Summary

Fenced ` ```mermaid ` blocks in the document render as SVG diagrams in the
preview, with the mermaid library loaded only when first needed and every
failure contained to the individual diagram.

## Background

The preview pipeline is built on marked + highlight.js. Code fences are
either syntax-highlighted or escaped — Mermaid text would otherwise show as
plain code, and running mermaid eagerly at page load would add ~3.3 MB to
every visit for a feature many documents never use.

## Problem

Diagrams are central to technical documents (architecture sketches, flow
charts), but: (1) bundling mermaid into initial load makes a
"zero-dependency, instant-open" editor slow; (2) invalid diagram syntax in
mermaid's default mode throws asynchronously and can leave a broken page or
a stuck spinner; (3) diagrams must survive the export pipelines (print and
PNG), which rebuild the DOM in separate containers.

## Goals

- ` ```mermaid ` fences render live, in step with the rest of the preview.
- Zero diagram cost for documents without diagrams.
- A syntax error affects only that diagram: label + raw source, page keeps
  working.
- Diagrams re-render identically in print clones and PNG rebuilds.
- Works fully offline from the vendored bundle; no CDN.

## Non-Goals

- No support for other diagram languages (PlantUML, Graphviz, D2).
- No interactive diagram features — mermaid runs with click callbacks
  disabled (`securityLevel: 'strict'`).
- No diagram editor, live syntax checking, or error line numbers — the
  fallback is a generic error label plus the raw source.
- No per-diagram theme overrides; one neutral theme tuned to the design
  system applies to all diagrams.
- No caching of rendered SVGs across document edits beyond what mermaid
  itself does in-session.

## Solution Overview

The marked instance is configured with a custom `code` renderer: fences
tagged `mermaid` (case/whitespace-insensitive) become
`<div class="mermaid-block" data-src="encodeURIComponent(code)">` containing
the raw source as `<pre class="mermaid-raw">` — a visible fallback by
construction. After each render pass, `renderDiagrams(container)` walks
pending blocks and swaps each for its SVG. `ensureMermaid()` injects
`vendor/mermaid.min.js` (relative URL, same origin) exactly once, only if
the page protocol is http(s), then initializes mermaid with
`startOnLoad: false`, the neutral theme, strict security level and design
system theme variables.

## Detailed Behavior

- Fence detection: the info string is trimmed and lowercased; only exactly
  `mermaid` triggers the diagram path.
- Source encoding: diagram code is stored URI-encoded in `data-src` and
  decoded at render time, so HTML-sensitive characters survive round-trips.
- Lazy load: `ensureMermaid()` resolves immediately if mermaid is already
  present; otherwise injects once (a failed injection resets the promise so
  a later pass retries). Non-http(s) pages and the test override
  (`MD_ALLOW_LAZY = false`) reject, and blocks degrade to raw source.
- Rendering: blocks are rendered sequentially. On success the block's
  `innerHTML` becomes the SVG (mermaid's `height` attribute is removed so
  CSS `max-width: 100%` scales it) and `data-done="1"` is set. On failure,
  mermaid's leftover temporary element is removed, a localized red
  "Diagram syntax error" label plus the escaped raw source are shown, and
  `data-done="error"` is set.
- Re-render: only blocks without `data-done` are processed; typing does not
  re-render already-good diagrams unless the document changed (the preview
  HTML is rebuilt wholesale each pass, so all blocks are fresh by then).
- Exports: the PNG pipeline re-runs `renderDiagrams` inside its offscreen
  container, so diagrams rasterize as vectors at export resolution; the
  print clone carries the already-rendered SVGs.

## User Experience

![Rendered Mermaid flowchart in the preview pane](../../img/mermaid-diagram-en.webp)

The user types a Mermaid fence; within the normal 300 ms render debounce the
diagram appears, centered, styled to the document palette. A syntax error
shows a red label and the raw code right where the diagram would be.

## Compatibility and Historical Impact

Introduced with the initial release; earlier revisions of this repository
loaded mermaid eagerly at page start. Lazy loading changed startup behavior
(documents without diagrams no longer download 3.3 MB) but not any rendered
output; fallback behavior for missing mermaid was already present. No
historical behavior is affected beyond faster startup.

## Data and Privacy Impact

The only network effect is one same-origin fetch of
`vendor/mermaid.min.js` (a file shipped in the repository) when the first
diagram appears. No external requests, no new storage keys. Mermaid's
strict security level disables click interaction and sanitizes labels.

## Performance Impact

The mermaid bundle is ~3.3 MB (minified, vendored). Lazy loading means
documents without diagrams never pay for it; documents with diagrams pay
once per session. No published timing measurements — numbers were
deliberately left out of the docs until one can be reproduced.

## Current Limitations

- Under `file://`, diagrams never render (protocol guard) — raw source
  shows instead.
- Error messages are generic; mermaid's parser diagnostics are not
  surfaced.
- Very large diagrams render at the preview width; extremely wide diagrams
  scroll horizontally (`overflow-x: auto`).

## Release Information

Introduced: 1.0.0 · Status: Stable (summary version — see
[CHANGELOG](../../../CHANGELOG.md) versioning note).

## Related Documentation

- [usage · Diagrams](../usage.md#diagrams)
- [architecture · Render Pipeline](../architecture.md#render-pipeline)
- [troubleshooting · Diagrams Show as Source Code](../troubleshooting.md#diagrams-show-as-source-code)
- [export-pipeline](./export-pipeline.md) — how diagrams survive exports

## Feature Changelog

### 1.0.0

- Initial behavior: fence detection, lazy same-origin loading, strict
  security level, per-diagram error fallback, export re-rendering.
