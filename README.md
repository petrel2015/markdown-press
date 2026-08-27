# MD·PRESS — Markdown Editor

[English](README.md) | [简体中文](./README.zh.md)

![Live](https://img.shields.io/badge/live-GitHub_Pages-d52b1e?link=https://petrel2015.github.io/markdown-press/)
![Pure Frontend](https://img.shields.io/badge/pure_frontend-no_backend-111111)
![Zero Build](https://img.shields.io/badge/zero_build-open_index.html-111111)
![Offline](https://img.shields.io/badge/offline-vendored_libs-111111)
![Diagrams](https://img.shields.io/badge/diagrams-mermaid-d52b1e)
![i18n](https://img.shields.io/badge/i18n-EN_%7C_%E4%B8%AD%E6%96%87-111111)

MD·PRESS is a browser-only Markdown editor and previewer in the Swiss / German
typographic tradition: white paper, near-black ink, hairline rules, one red
accent, no gradients or shadows.

Most Markdown tools either lock your document in a cloud account or bury the
writing surface under toolbars and chrome. MD·PRESS takes the opposite bet: one
HTML file you can open anywhere, a quiet split view where you write on the left
and read on the right, and exports (A4 PDF, phone-length PNG) that produce
something you can hand to someone. There is no account, no server and no build
step — your text never leaves your browser.

> 🤖 AI assistants and agents: for a structured, machine-friendly description
> of this project, see [README_FOR_AI.md](./README_FOR_AI.md).

## Live Demo

**[Open the online editor →](https://petrel2015.github.io/markdown-press/)**

No installation, no sign-up. The page works fully offline once loaded.

## Exports

| Export | Target | Format | Notes |
|--------|--------|--------|-------|
| Print | A4 | PDF | Browser print dialog ("Save as PDF"), vector selectable text, SVG diagrams print natively |
| Long image | Phone (390px × 2 = 780px) | PNG | Full-height image sized for phone screens |
| Image | A4 (794px × 2 = 1588px) | PNG | A4-width alternative to the PDF |
| Download | — | `.md` | Raw source; `Open .md` loads a local file back in |

![MD·PRESS desktop split view — editor on the left, rendered preview on the right](docs/img/desktop-overview-en.webp)

## Features

- **Split view that stays out of the way** — editor and preview side by side;
  drag the divider (25%–75%, double-click to reset), or switch Edit / Split /
  Preview at any time. Proportional scroll sync keeps both panes aligned and
  can be toggled from the preview head.
  → How to use: [usage · Writing](docs/en/usage.md#writing) — Design notes:
  [features/split-editor-layout](docs/en/features/split-editor-layout.md)
- **Mermaid diagrams with graceful degradation** — ` ```mermaid ` fences render
  live as SVG. Syntax errors fall back to the source with a red error label
  instead of breaking the page. The 3.3 MB mermaid bundle is lazy-loaded once,
  only when your document actually contains a diagram.
  → [usage · Diagrams](docs/en/usage.md#diagrams) ·
  [features/mermaid-diagrams](docs/en/features/mermaid-diagrams.md)

  ![Rendered Mermaid flowchart in the preview pane](docs/img/mermaid-diagram-en.webp)

- **Four export paths** — A4 PDF through the browser print dialog (vector,
  selectable text), phone-length PNG, A4-width PNG, and plain `.md` download /
  open. Filenames derive from the document name; diagrams and code survive all
  four paths.
  → [usage · Exporting](docs/en/usage.md#exporting) ·
  [features/export-pipeline](docs/en/features/export-pipeline.md)

  ![Export menu with the three export targets](docs/img/export-menu-en.webp)

- **Bilingual UI** — EN / 中文 switch in the masthead; defaults to the browser
  language, choice is remembered. The first-run sample document is localized
  too.
  → [usage · Language](docs/en/usage.md#language) ·
  [features/bilingual-interface](docs/en/features/bilingual-interface.md)
- **Responsive** — desktop split view; tablet split or single pane; phone
  collapses to Edit / Preview tabs (split is hidden below 768px).
  → [usage · On a Phone](docs/en/usage.md#on-a-phone)

  ![Phone layout with Edit / Preview tabs](docs/img/mobile-tabs-zh.webp)

- **Autosave** — document, file name, language, view mode and split ratio are
  persisted to `localStorage`; refresh-safe, nothing is synced anywhere.
  → [usage · Autosave and Storage](docs/en/usage.md#autosave-and-storage) ·
  [privacy](docs/en/privacy.md)
- **Status bar** — cursor line/column, CJK-aware word count, character count,
  line count, save state
- **First-run sample document** showcasing headings, lists, tables, code and a
  Mermaid flowchart, so every feature is one glance away

## Quick Start

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

> **Note** — diagrams need the page served over `http(s)`. When you open
> `index.html` directly via `file://`, editing, preview and exports still work,
> but Mermaid fences intentionally stay as raw source (see
> [troubleshooting](docs/en/troubleshooting.md#diagrams-show-as-source-code)).

All third-party libraries are vendored under `vendor/` at pinned versions —
the page makes zero runtime requests to third-party hosts
([details](docs/en/privacy.md#network-behavior)).

## Basic Usage

- Type on the left, read on the right; everything autosaves ~400ms after you
  stop typing.
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

Full walkthrough: [docs/en/usage.md](docs/en/usage.md).

## Tech Stack

- Vanilla HTML / CSS / JavaScript (ES5-style IIFEs) — no framework, no build
- [CodeMirror 5.65.16](https://codemirror.net/5/) for editing
- [marked 12.0.2](https://marked.js.org/) + [highlight.js 11.9.0](https://highlightjs.org/) for rendering
- [mermaid 10.9.3](https://mermaid.js.org/) for diagrams (lazy-loaded)
- [html-to-image 1.11](https://github.com/bubkoo/html-to-image) for PNG export
- [jsdom 30](https://github.com/jsdom/jsdom) for the test suite

All five runtime libraries are vendored in `vendor/` — versions were verified
against the bundle contents, not just package names.

## Architecture Summary

Six small IIFE modules hang off a single `MD` namespace: `i18n` → `markdown` →
`editor` → `layout` → `export` → `app`. Rendering flows
`CodeMirror → debounce(300ms) → marked.parse → preview innerHTML → mermaid.render`
swaps fenced placeholders for SVG. Boot runs in fault-isolated stages; clicks
that arrive before listeners exist are captured and replayed once instead of
vanishing. Optional vendor libraries are guarded, so the whole app also boots
under jsdom without CodeMirror / mermaid / html-to-image — which is what the
test suite drives.

→ Full module map, state model and pipelines:
[docs/en/architecture.md](docs/en/architecture.md)

## Documentation

| Document (EN) | 文档（中文） | Contents |
|---------------|--------------|----------|
| [docs/en/index](docs/en/index.md) | [docs/zh/index](docs/zh/index.md) | Documentation index |
| [usage](docs/en/usage.md) | [使用](docs/zh/usage.md) | Step-by-step operation, exports, error behavior |
| [development](docs/en/development.md) | [开发](docs/zh/development.md) | Environment, commands, tests, project layout |
| [architecture](docs/en/architecture.md) | [架构](docs/zh/architecture.md) | Modules, render pipeline, state model |
| [deployment](docs/en/deployment.md) | [部署](docs/zh/deployment.md) | GitHub Pages hosting, subpath verification |
| [troubleshooting](docs/en/troubleshooting.md) | [故障排查](docs/zh/troubleshooting.md) | Symptom → cause → fix table |
| [privacy](docs/en/privacy.md) | [隐私](docs/zh/privacy.md) | Storage keys, network behavior, verified facts |
| [faq](docs/en/faq.md) | [常见问题](docs/zh/faq.md) | Scope and boundary questions |
| [features index](docs/en/features/index.md) | [功能设计索引](docs/zh/features/index.md) | Design documents per major feature |

## Compatibility

No build targets and no polyfills are shipped; the app uses widely supported
DOM APIs (pointer events, `matchMedia`, `Blob`/`URL.createObjectURL`, CSS
custom properties) and targets current evergreen browsers. The logic suite is
verified under jsdom and the UI was verified in headless Chromium; no formal
cross-browser matrix has been run yet.

## Changelog

See [CHANGELOG.md](CHANGELOG.md). The repository has no Git tags or GitHub
Releases yet; the changelog records the complete current capability set as the
summary version 1.0.0 (first published 2026-08-22) until the first tag is cut.

## Contributing

Issues and pull requests are welcome. There is no formal contribution process
yet; please keep PRs small and describe the user-visible behavior you changed.
Before opening a PR, run the test suite:

```sh
cd test && npm install && npm test
```

## License Notes

⚠️ This repository does **not** ship a LICENSE file yet. Until one is added,
all rights default to the author under copyright law — you can read the code
but the terms for reuse, modification and redistribution are not formally
granted. (Maintainer note: picking a license is a decision only the project
owner can make.)

## Buy Me a Coffee

**Buy me a coffee ￥4.9** ☕

<table>
  <tr>
    <td align="center"><img src="docs/donate/alipay-qr.png" width="200" alt="Alipay QR"><br>Alipay</td>
    <td align="center"><img src="docs/donate/wechat-qr.png" width="200" alt="WeChat QR"><br>WeChat</td>
  </tr>
</table>
