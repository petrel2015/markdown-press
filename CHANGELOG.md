# Changelog

All notable user-visible changes to MD·PRESS are documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/); this project
does not yet assign semantic versions per release.

中文版见 [CHANGELOG.zh.md](CHANGELOG.zh.md)。

> **Versioning note** — as of 2026-08-27 this repository has **no Git tags**
> (checked `git tag`), **no GitHub Releases** (checked `gh release list`) and
> **no root `package.json`** with a version field. Rather than inventing a
> fictional 0.x history, the complete current capability set is recorded once
> as the summary version **1.0.0**, dated to the first public deployment on
> GitHub Pages (2026-08-22). Finer-grained history is available in
> [Git log](https://github.com/petrel2015/markdown-press/commits/main). Once
> the maintainer cuts a first tag, subsequent changes will be recorded under
> `[Unreleased]` and split into real versions.

## [Unreleased]

Nothing yet.

## [1.0.0] - 2026-08-22

First public release on GitHub Pages
(https://petrel2015.github.io/markdown-press/). This entry summarizes the
complete capability set as shipped on the live site (including refinements
landed through 2026-08-27).

### Added

- Split-view Markdown editor: Edit / Split / Preview modes, draggable divider
  (25%–75%, double-click reset, arrow keys when focused), proportional
  two-way scroll sync with a toggle in the preview head.
- Markdown rendering pipeline: marked 12 (GFM) + highlight.js 11 syntax
  highlighting in a monochrome palette; render re-runs 300 ms after typing
  stops.
- Mermaid diagram support: ` ```mermaid ` fences render as SVG (strict
  security level, neutral theme tuned to the design system); invalid
  diagrams fall back to a red error label plus raw source; the 3.3 MB
  mermaid bundle is lazy-loaded once on first use instead of at page load.
- Export paths:
  - A4 PDF via the browser print dialog (vector, selectable text; print
    styles keep headings with following content and avoid breaking code
    blocks, tables and diagrams where possible);
  - Phone-length PNG (390 px logical width, 780 px at 2×);
  - A4-width PNG (794 px logical width, 1588 px at 2×);
  - `.md` source download, and `.md` / `.markdown` / `.txt` open with the
    loaded file name becoming the export base name.
- Bilingual UI (English / 简体中文): browser-language detection, manual
  switch in the masthead, persisted choice, fully localized chrome, ARIA
  labels, page title and first-run sample document.
- Autosave: document text, file name, language, view mode and split ratio
  persist to `localStorage` (~400 ms after typing stops and on page unload).
- Responsive layout: desktop split view, tablet single-pane or split, phone
  (below 768 px) collapses to Edit / Preview tabs with split hidden.
- Status bar: cursor position, CJK-aware word count, character count, line
  count, save state and transient notices (exporting / exported / failed).
- Formatting toolbar (bold, italic, code, link, list, Mermaid snippet) plus
  keyboard shortcuts `Cmd/Ctrl+B`, `Cmd/Ctrl+I`, `Cmd/Ctrl+K`, and list
  continuation on `Enter`.
- Swiss-design system: white paper, near-black ink, hairline rules, single
  red accent (`#d52b1e`), Helvetica system stack; no gradients, shadows or
  border radii.
- Startup resilience: an inline head script marks the boot phase and captures
  clicks that arrive before listeners exist; boot runs in fault-isolated
  stages and replays the most recent captured click once instead of letting
  it vanish; a status-bar notice appears if a stage fails.
- jsdom logic test suite driving the real `index.html` through DOM APIs
  (65 assertions covering i18n, rendering, degradation paths, view modes,
  split clamping, export sizing and filename rules, print build, file
  open/reject, status bar).

[Unreleased]: https://github.com/petrel2015/markdown-press/compare/main
[1.0.0]: https://github.com/petrel2015/markdown-press/tree/main
