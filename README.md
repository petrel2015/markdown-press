# MD·PRESS — Markdown Editor

[English](README.md) | [中文](README.zh-CN.md)

![Live](https://img.shields.io/badge/live-GitHub_Pages-d52b1e?link=https://petrel2015.github.io/markdown-press/)
![Pure Frontend](https://img.shields.io/badge/pure_frontend-no_backend-111111)
![Zero Build](https://img.shields.io/badge/zero_build-open_index.html-111111)
![Offline](https://img.shields.io/badge/offline-vendored_libs-111111)
![Diagrams](https://img.shields.io/badge/diagrams-mermaid-d52b1e)
![i18n](https://img.shields.io/badge/i18n-EN_%7C_%E4%B8%AD%E6%96%87-111111)

MD·PRESS is a browser-only Markdown editor and previewer in the Swiss / German
typographic tradition: white paper, near-black ink, hairline rules, one red
accent, no gradients or shadows.

> 💡 **Core goal** — Write on the left, read on the right, export when it is
> done. Everything runs locally in your browser; nothing is sent anywhere.

**Try it online: <https://petrel2015.github.io/markdown-press/>**

## Exports

| Export | Target | Format | Notes |
|--------|--------|--------|-------|
| Print | A4 | PDF | Browser print dialog ("Save as PDF"), vector selectable text, SVG diagrams print natively |
| Long image | Phone (390px × 2 = 780px) | PNG | Full-height image sized for phone screens |
| Image | A4 (794px × 2 = 1588px) | PNG | A4-width alternative to the PDF |
| Download | — | `.md` | Raw source; `Open .md` loads a local file back in |

## Features

- **Split view** — editor and preview side by side; drag the divider
  (25%–75%, double-click to reset), or switch Edit / Split / Preview at any time
- **Proportional scroll sync** between panes, toggleable from the preview head
- **Mermaid diagrams** — ` ```mermaid ` fences render live; syntax errors fall
  back to the source with an error label instead of breaking the page
- **Syntax highlighting** in both the editor (CodeMirror markdown mode) and the
  rendered preview (highlight.js, monochrome palette with one red accent)
- **Bilingual UI** — EN / 中文 switch in the masthead; defaults to the browser
  language, choice is remembered
- **Responsive** — desktop split view; tablet split or single pane; phone
  collapses to Edit / Preview tabs (split is hidden below 768px)
- **Autosave** — document, file name, language, view mode and split ratio are
  persisted to `localStorage`; refresh-safe
- **Status bar** — cursor line/column, CJK-aware word count, character count,
  line count, save state
- **First-run sample document** showcasing headings, lists, tables, code and a
  Mermaid flowchart, so every feature is one glance away

## Run

No build step, no dependencies to install:

```sh
open index.html        # macOS
xdg-open index.html    # Linux
```

or serve it statically:

```sh
python3 -m http.server 8765
# → http://localhost:8765/
```

All third-party libraries are vendored under `vendor/` at pinned versions —
the page works fully offline with zero runtime network requests.

## Usage Notes

- Documents autosave ~400ms after you stop typing; the status bar shows the
  save time. `New` clears the document after a confirmation.
- `Open .md` accepts `.md`, `.markdown` and `.txt`; the file name becomes the
  base name for all exports.
- The A4 PDF export opens the print dialog — choose "Save as PDF" as the
  destination. Headings avoid page-break separation; code blocks, tables and
  diagrams are kept unbroken where possible.

### Keyboard

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + B` | Bold |
| `Cmd/Ctrl + I` | Italic |
| `Cmd/Ctrl + K` | Insert link |
| `Enter` (in a list) | Continue the list |
| `←` / `→` (divider focused) | Adjust split ratio |
| Double-click divider | Reset to 50 / 50 |

## Development

### Project Structure

```
markdown-press/
├── index.html            markup skeleton
├── css/
│   ├── style.css         design tokens + app shell (Swiss system)
│   ├── editor.css        CodeMirror skin
│   ├── preview.css       rendered-document typography + highlight palette
│   └── print.css         A4 print sheet (@page rules)
├── js/
│   ├── i18n.js           EN / 中文 dictionaries, detection + persistence
│   ├── markdown.js       marked + highlight.js + mermaid pipeline
│   ├── editor.js         CodeMirror wrapper + formatting commands
│   ├── layout.js         view modes, divider, responsive coercion, scroll sync
│   ├── export.js         print / PNG / .md io
│   └── app.js            wiring, autosave, status bar, sample document
├── vendor/               pinned libraries (offline)
└── test/
    ├── package.json      jsdom
    └── logic.test.js     DOM-driven logic tests
```

### Running Tests

```sh
cd test
npm install
node logic.test.js
```

The suite loads the real `index.html` into jsdom, drives it through DOM APIs
and covers: language detection and switching, the render pipeline, Mermaid
fence detection and degradation, view modes and phone coercion, split clamping,
export sizing and file-name validation, the print build, file open/reject, and
status-bar statistics.

### Architecture Notes

- **Render flow** — `CodeMirror → debounce(300ms) → marked.parse → preview
  innerHTML → mermaid.render swaps fenced placeholders for SVG`. Mermaid code
  is stored URI-encoded in `data-src`; if the mermaid library is missing the
  raw source stays visible as a graceful fallback.
- **Export pipelines** — print clones the live preview into `#print-root` and
  calls `window.print()`; PNG builds a hidden offscreen container at the
  target width, re-renders diagrams, waits for images, then rasterizes with
  html-to-image at 2× and triggers a download.
- **Layout** — view modes are expressed on `<body data-mode>`; CSS resolves
  pane visibility per breakpoint. JavaScript coerces `split → edit` below
  768px via `matchMedia` + resize listeners; the CSS phone rules are the
  safety net if events never fire.
- **Module pattern** — every module is an IIFE hanging off a single `MD`
  namespace, optional vendor libraries are guarded, so the whole app also
  boots under jsdom without CodeMirror / mermaid / html-to-image.

### Design System

Tokens live in `css/style.css`: ink `#111111`, paper `#ffffff`, hairline
`#e4e4e4`, a single red accent `#d52b1e`, the Helvetica system stack,
`01 —`-numbered section labels, uppercase micro-labels with wide tracking.
No gradients, no shadows, no border radii — hierarchy comes from weight,
rules and whitespace alone.

## Tech Stack

- Vanilla HTML / CSS / JavaScript (ES5-style IIFEs) — no framework, no build
- [CodeMirror 5.65](https://codemirror.net/) for editing
- [marked 12](https://marked.js.org/) + [highlight.js 11](https://highlightjs.org/) for rendering
- [mermaid 10](https://mermaid.js.org/) for diagrams
- [html-to-image 1.11](https://github.com/bubkoo/html-to-image) for PNG export
- [jsdom](https://github.com/jsdom/jsdom) for the test suite

## Notes & Limitations

- ⚠️ Remote images blocked by CORS cannot be embedded in PNG exports; local
  and data-URI images work fine.
- The A4 PDF path goes through the browser print dialog by design — it keeps
  text vector and selectable, which rasterized alternatives cannot offer.
