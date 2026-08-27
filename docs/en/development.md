# Development

Environment, commands (every command below was executed and its result
recorded), test suite, and project layout. 中文版：[开发](../zh/development.md)。

## Requirements

- A browser — that is all the app itself needs. No runtime dependencies are
  installed; the app has no build step.
- For the test suite only: Node.js. jsdom 30 declares
  `engines: ^22.22.2 || ^24.15.0 || >=26.0.0`; the verification below ran on
  Node v22.22.3.
- Any static file server for local serving (one is suggested below; none is
  shipped).

## Commands

| Command | Purpose | Verified result |
|---------|---------|-----------------|
| `cd test && npm install` | Install jsdom for the test suite | Clean install, 0 vulnerabilities |
| `cd test && npm test` | Run the logic suite (`node logic.test.js`) | **65 passed, 0 failed** (2026-08-27) |
| `python3 -m http.server 8765` | Serve the app at `http://localhost:8765/` | HTTP 200 for `index.html` |
| `open index.html` / `xdg-open index.html` | Open without a server | Standard platform commands; everything works except Mermaid rendering (needs `http(s)`, see [usage](./usage.md#diagrams)) |

There is **no build command** (the site ships as-is) and **no lint
configuration** in the repository — nothing to run, and no lint results to
report.

## Tests

`test/logic.test.js` loads the real `index.html` into jsdom, injects marked
plus the six app modules, and drives the page through DOM APIs — no GUI. The
optional vendor libraries (CodeMirror, highlight.js, mermaid,
html-to-image) are deliberately absent so their guarded degradation paths
are the ones under test. Coverage groups:

| Group | What it asserts |
|-------|-----------------|
| T0 Initial state | Default language detection, split mode, sample document rendered and persisted |
| T1 Render pipeline | GFM output, Mermaid fence → placeholder with encoded source, HTML escaping, fence detection, CJK-aware word count |
| T2 View modes | Mode switching and persistence, phone coercion (split → edit), invalid mode fallback |
| T3 Split ratio | Clamp bounds (25/75), ratio setting |
| T4 Export pure functions | PNG dimensions (780/1588 px), filename validation, `.md` suffix completion, filename sanitization |
| T5 Print export | Print container filled from preview, title swap and restore, container cleanup |
| T6 Language switch | Dictionary swap, persistence, sample document localization |
| T7 Open .md | Accept/reject by extension, editor + preview update, name and autosave follow-up |
| T8 PNG degradation | Missing html-to-image → failure notice and recovery of the save label |
| T9 Status bar | Position, words, chars, lines |
| T10 Mermaid degradation | Missing mermaid → safe skip, raw source fallback retained |

## Project Layout

```
markdown-press/
├── index.html            markup skeleton + boot-click capture script
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
├── vendor/               pinned libraries (offline, see versions below)
├── test/
│   ├── package.json      jsdom dependency
│   └── logic.test.js     DOM-driven logic tests
└── docs/                 this documentation + donate QR codes + screenshots
```

Vendored versions (verified against the bundle contents, not just names):
CodeMirror **5.65.16**, marked **12.0.2**, highlight.js **11.9.0**, mermaid
**10.9.3**, html-to-image **1.11** (bundle content-identical across
1.11.9–1.11.11).

## Local Development Notes

- There are **no environment variables** — the app reads nothing from the
  environment. The only switchable runtime flag is `window.MD_ALLOW_LAZY =
  false`, used by the test suite to forbid the mermaid lazy-load injection.
- After changing `index.html`'s pane structure or CSS layout, expect no
  rebuild: reload the tab. CodeMirror needs a `refresh()` after the editor
  pane changes visibility or width — the app already does this on mode
  change, divider drag end and window resize.
- The design system's tokens (ink/paper/hairline/red, fonts) live at the top
  of `css/style.css`; mermaid theme variables live in `js/markdown.js`
  (`initMermaid`).

## Verifying the Production Shape Locally

The deployed site is the repository root served as static files at a
**subpath** (`/markdown-press/`). To reproduce that shape locally (all asset
references are relative, so this verifies subpath correctness):

```sh
python3 -m http.server 8765
# serves the repo root at http://localhost:8765/ — flat path
```

To mimic the subpath exactly, serve the parent directory under a prefix, or
use any static server with a `--prefix` option; the app was verified under
`http://127.0.0.1:8766/markdown-press/` with zero console errors (this is
how the screenshots in `docs/img/` were produced).

## Deployment

See [deployment.md](./deployment.md) — GitHub Pages from the `main` branch
root, no CI pipeline.
