# Architecture

How MD·PRESS is built: modules, pipelines, state and degradation paths.
中文版：[架构](../zh/architecture.md)。

## High-Level Shape

```
┌─────────────────────────── index.html ───────────────────────────┐
│  inline head script: md-booting flag + pre-boot click queue      │
│                                                                  │
│  ┌───────────── workspace ─────────────┐                         │
│  │ pane-editor            pane-preview │   <body data-mode>      │
│  │ CodeMirror  │ 300ms debounce │  preview innerHTML + mermaid SVG│
│  └─────────────────────────────────────┘                         │
│  status bar · export menu · hidden file input                    │
│  #print-root (print clone)   #png-root (offscreen raster target) │
└──────────────────────────────────────────────────────────────────┘
        │ all state via localStorage          no server, ever
        ▼
  mdpress-doc / mdpress-name / mdpress-lang / mdpress-mode / mdpress-split
```

Six IIFE modules attach to a single global `MD` namespace. Load order is the
dependency order: `i18n` → `markdown` → `editor` → `layout` → `export` →
`app`. Nothing is imported — scripts are plain `<script>` tags, and optional
vendor libraries are feature-tested at call time, never assumed.

## Module Responsibilities

| Module | File | Responsibility |
|--------|------|----------------|
| `MD.i18n` | `js/i18n.js` | EN/中文 dictionaries; detection (saved choice → browser language → `en`); applies `data-i18n` / `data-i18n-aria-label` attributes; persists `mdpress-lang` |
| `MD.markdown` | `js/markdown.js` | marked 12 instance with custom code renderer; highlight.js integration; Mermaid fence detection, lazy library injection, diagram rendering; `escapeHtml`, `countWords` |
| `MD.editor` | `js/editor.js` | CodeMirror 5 wrapper (markdown mode, active line, continue-list); formatting commands; falls back to a textarea shim when CodeMirror is absent |
| `MD.layout` | `js/layout.js` | View modes on `<body data-mode>`; divider drag/keyboard/double-click; phone coercion via `matchMedia`; proportional two-way scroll sync |
| `MD.exporter` | `js/export.js` | Print clone pipeline; PNG offscreen raster; `.md` download; file open with validation; filename helpers |
| `MD.app` | `js/app.js` | Boot sequencing; render/save debounces; status bar; export menu; language switch wiring; sample document |

## Render Pipeline

```
CodeMirror change
  └─ debounce 300ms → MD.markdown.render(source)
       ├─ marked.parse: GFM → HTML
       │    └─ custom code renderer:
       │         · ```mermaid → <div class="mermaid-block"
       │            data-src="encodeURIComponent(code)"><pre>raw</pre></div>
       │         · other fences → hljs.highlight / highlightAuto / escape
       └─ preview.innerHTML = html
            └─ MD.markdown.renderDiagrams(preview)
                 ├─ no .mermaid-block pending → resolve(0)
                 ├─ ensureMermaid(): already loaded? / inject
                 │    vendor/mermaid.min.js once (http/https only)
                 └─ per block: mermaid.render(id, code)
                      ├─ ok → innerHTML = svg (height attr removed)
                      └─ err → red label + raw source, data-done="error"
```

Autosave runs on its own 400 ms debounce, off the same change events; page
unload persists once more.

## Boot Sequence

1. Inline head script (runs before any vendor library) marks
   `<html class="md-booting">` — CSS dims controls — and queues `click`s on
   buttons by id (ring buffer of 12).
2. `DOMContentLoaded` → `MD.app.boot()` clears the boot flag and runs three
   fault-isolated `try` blocks (i18n+editor; layout; exporter+wiring+menus).
   A thrown error is logged and surfaced as a status-bar notice; remaining
   stages still execute.
3. After boot, the most recent queued click whose timestamp is within 15 s is
   replayed once — pre-boot clicks are not lost on slow connections.
4. `beforeunload` and `resize` listeners are registered last.

## State Model

| State | Where | Key / location |
|-------|-------|----------------|
| Document text | `localStorage` | `mdpress-doc` |
| Document name | `localStorage` | `mdpress-name` |
| UI language | `localStorage` | `mdpress-lang` |
| View mode | `localStorage` + `<body data-mode>` | `mdpress-mode` |
| Split ratio | `localStorage` + CSS `--split` | `mdpress-split` |
| Transient UI (notices) | in-memory only | — |

Every `localStorage` access is wrapped in `try/catch`: with storage blocked,
the app runs from defaults and in-memory state, and nothing persists.

Effective view mode is `effectiveMode(requested, isPhone)`: below 768 px,
requested `split` becomes `edit`; anything invalid falls back to `split`.
The raw choice is stored, so enlarging the window restores split.

## Diagram Lazy Loading

`ensureMermaid()` refuses to inject the library when the page protocol is
not `http(s)` (this is why `file://` keeps raw sources) and honors a test
override `MD_ALLOW_LAZY = false`. Injection happens once; a failed load
resets the promise so a later render can retry.

## Export Pipelines

- **Print (A4 PDF)** — clone `#preview`'s HTML into `#print-root`, swap
  `document.title` to the document name (it becomes the suggested PDF
  filename), `requestAnimationFrame` → `window.print()`. `afterprint`
  restores the title and empties the container; a 60 s timer does the same
  if `afterprint` never fires. `css/print.css` (`@page` A4, unbreakable
  blocks) styles the clone.
- **PNG** — `#png-root` (hidden, fixed to spec width) receives a fresh
  `marked.parse` of the source; diagrams re-render inside it; every `<img>`
  is awaited (4 s cap each); `htmlToImage.toPng` rasterizes at
  `pixelRatio: 2` on white; the data URL downloads as `<name>-phone.png` /
  `<name>-a4.png`.
- **.md** — `Blob` + object URL + `a[download]`; URL revoked after 1 s.
- **Open** — hidden `<input type="file">` filtered by extension; content
  read with `FileReader` and pushed through the same
  `replaceDocument` path as `New`.

## Responsive Strategy

`matchMedia('(max-width: 767px)')` change events and `window.resize` both
re-apply the effective mode; CSS phone rules are the safety net if events
never fire. CodeMirror measures wrongly while its pane is `display:none`, so
mode changes, divider drags and resizes schedule `editor.refresh()`.

## Testability Design

The whole app boots without any vendor library: CodeMirror falls back to a
textarea shim; `highlight.js`/`html-to-image` absence routes to guarded
branches; mermaid absence leaves raw sources visible. This is what lets
`test/logic.test.js` drive the real page in jsdom (with
`MD_ALLOW_LAZY=false`) and still exercise every pipeline end-to-end.
