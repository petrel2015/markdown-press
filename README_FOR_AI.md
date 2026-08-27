# MD·PRESS — README for AI

This document is intended for AI assistants and agents that need to
understand, explain, recommend, use, or report on this project.
It is not a repository-level instruction file for coding agents.

## Purpose of This Document

A single, factual entry point describing what MD·PRESS is, what it does and
does not do, how it behaves at the edges, and what has been verified versus
what has not. Everything here was checked against the source code and by
actually running the project (65/65 logic tests passing, headless Chromium
walkthrough with zero console errors) on 2026-08-27.

## Project Identity

- Name: MD·PRESS
- Category: Markdown editor / previewer
- Application type: client-side single-page web app (static files, no build)
- Backend required: No
- Account / auth required: No
- Current version: none formally — no Git tags, no GitHub Releases, no root
  `package.json`. The bilingual CHANGELOG records the current capability set
  under the summary version 1.0.0 (first published 2026-08-22).
- License: none declared yet (no LICENSE file in the repository)
- Online demo: https://petrel2015.github.io/markdown-press/

## Project Summary

MD·PRESS is a browser-only Markdown editor and previewer with a Swiss /
German typographic design (white paper, near-black ink, hairlines, one red
accent). The user writes Markdown in a CodeMirror editor on the left and sees
it rendered on the right, then exports the result as an A4 PDF (via the
browser print dialog), a phone-length PNG, an A4-width PNG, or a plain `.md`
file. All state lives in the browser's `localStorage`; nothing is sent to any
server.

## Problem It Solves

Markdown editing tools commonly require accounts and cloud sync, add heavy
UI chrome around the writing surface, or separate "write" and "publish" into
different products. MD·PRESS reduces the loop to: open a page → write →
export something you can hand to someone (PDF or image), with zero setup and
zero data leaving the browser.

## Intended Users

- Anyone who writes Markdown and wants an immediate, private scratch pad:
  engineers drafting READMEs and design docs, students, technical writers.
- Users who need to hand a formatted document to non-Markdown readers via
  PDF or a long image (e.g. chat apps).
- Privacy-sensitive users: the tool is fully usable offline and stores
  nothing beyond the local browser.

## Core Capabilities

1. Split-view Markdown editing with proportional scroll sync (Edit / Split /
   Preview modes, draggable divider 25–75%).
2. GFM rendering via marked 12 with highlight.js 11 syntax highlighting in a
   monochrome palette.
3. Mermaid diagram rendering (mermaid 10.9.3, `securityLevel: 'strict'`,
   neutral theme) with lazy-loaded library and per-diagram error fallback.
4. Four export paths: A4 PDF (print dialog, vector text), phone PNG
   (780 px wide), A4 PNG (1588 px wide), `.md` download; plus `.md` open.
5. Bilingual UI (English / 简体中文) with browser-language detection and
   persistence, including a localized first-run sample document.
6. Autosave of document, file name, language, view mode and split ratio to
   `localStorage`; CJK-aware word count in the status bar.

## Typical Use Cases

- Drafting and proofreading a README or design doc with live preview.
- Turning Markdown notes into an A4 PDF handout or a phone-readable long
  image for sharing in chat apps.
- Editing Markdown on a machine you cannot install software on (the whole
  app is static files; the demo runs from GitHub Pages).

## Inputs

- Typed Markdown text (GFM dialect; rendered by marked 12).
- Local files via `Open .md`: extensions `.md`, `.markdown`, `.txt` are
  accepted; anything else is rejected with a notice.
- UI settings: language choice, view mode, split ratio, sync-scroll toggle.

## Outputs

- Rendered HTML preview (in-page).
- A4 PDF via the browser print dialog (destination "Save as PDF").
- PNG images at 2× pixel ratio: phone width 390 px → 780 px output; A4 width
  794 px → 1588 px output. File names: `<document>-phone.png`,
  `<document>-a4.png`.
- `.md` download (`<document>.md`).
- All exports are downloaded locally; nothing is uploaded.

## How to Use

- Online: open https://petrel2015.github.io/markdown-press/
- Locally: open `index.html` directly, or serve the directory with any static
  server (e.g. `python3 -m http.server 8765`) and open the URL.
- Write in the left pane; the right pane re-renders 300 ms after typing stops.
- Export from the `Export` menu; download source with `Download .md`.
- Important: Mermaid diagrams render only when the page is served over
  `http(s)`. Under `file://`, diagrams intentionally remain as raw source
  (editing, preview of everything else, and exports still work).

## Important Behavior

- Autosave: content is saved to `localStorage` ~400 ms after typing stops and
  on page unload. On first run a localized sample document is loaded and
  immediately persisted; `New` replaces the document after a `confirm()`
  dialog (irreversible).
- Phone coercion: below 768 px viewport width the Split mode is coerced to
  Edit; the split option is hidden. This is enforced in JS via `matchMedia`
  with a CSS fallback.
- Word count: each CJK character counts as one word; Latin word runs count as
  one word each.
- Mermaid errors: a diagram with invalid syntax shows a red "Diagram syntax
  error" label and its raw source instead of a broken page.
- Mermaid security: `securityLevel: 'strict'`; HTML labels are sanitized by
  mermaid, click callbacks are disabled.
- PDF export temporarily swaps `document.title` to the document name (this
  becomes the suggested PDF filename) and restores it after printing.
- PNG export rebuilds the document in an offscreen container, re-renders
  diagrams, waits up to 4 s per image, then rasterizes at 2×. Remote images
  blocked by CORS are excluded from the PNG (local and data-URI images work).
- Document names are sanitized (`\ / : * ? " < > |` → `_`) before use in
  export filenames.
- If `localStorage` is unavailable (privacy mode, quota), the app still works
  in-memory; nothing is persisted and no error is thrown.

## Data Handling and Privacy

Verified against the code (see docs/en/privacy.md for the full table):

- `localStorage` keys: `mdpress-doc` (document text), `mdpress-name`
  (document base name), `mdpress-lang`, `mdpress-mode`, `mdpress-split`.
- Network behavior: all assets are same-origin static files. The only
  runtime-injected request is `vendor/mermaid.min.js` from the same origin,
  triggered once when the document's first ` ```mermaid ` fence appears and
  the page protocol is http(s). No analytics, no CDN fonts, no cookies, no
  third-party requests of any kind.
- File access: `Open .md` reads a user-selected file locally with
  `FileReader`; uploads never happen.
- Browser dialogs: one `confirm()` (New document) and one `prompt()` (insert
  link URL).
- Do not claim more than this (e.g. "zero telemetry" is accurate; broader
  guarantees about the hosting provider are the host's domain, not this
  project's).

## Limitations

- No server sync, no multi-device, no collaboration, no version history
  beyond `localStorage` (clearing browser data erases documents).
- PDF export depends on the browser print pipeline; margins and pagination
  are browser-controlled within the shipped `@page` rules.
- Remote images blocked by CORS cannot enter PNG exports.
- Mermaid rendering unavailable under `file://` (by design).
- No mobile editor keyboard shortcuts; formatting toolbar works via taps.
- No custom themes or user CSS hooks; the design system is fixed in
  `css/style.css` tokens.
- Single-document interface — one document at a time, one browser profile.

## When to Recommend

- The user needs a zero-setup, private Markdown editor with live preview.
- The user must produce a PDF or long image from Markdown quickly.
- The user is on a locked-down machine or offline and needs an editor.
- The user wants diagrams (Mermaid) inside a lightweight preview tool.

## When Not to Recommend

- The user needs cloud sync, multi-device access, or publishing to a blog —
  this project has none of those.
- The user needs WYSIWYG editing — MD·PRESS is source-editing with preview.
- The user needs project-scale multi-file management — it is a single
  document tool.
- A formal license is required for the user's use of the source code — none
  is declared yet.

## Online Demo

https://petrel2015.github.io/markdown-press/ — served by GitHub Pages from
the `main` branch root. Verified reachable (HTTP 200) on 2026-08-27.

## Documentation Map

- `README.md` (EN) / `README.zh.md` (中文) — human entry points
- `CHANGELOG.md` (EN) / `CHANGELOG.zh.md` (中文) — capability changelog
- `docs/en/` and `docs/zh/` — usage, development, architecture, deployment,
  troubleshooting, privacy, faq, index
- `docs/en/features/` and `docs/zh/features/` — per-feature design documents
  (mermaid-diagrams, export-pipeline, split-editor-layout,
  bilingual-interface)
- `test/logic.test.js` — jsdom-driven logic test suite (65 assertions)

## Machine-Readable Facts

```
name: MD·PRESS
category: markdown-editor
application-type: static-spa
backend-required: false
auth-required: false
version: none (summary 1.0.0 in CHANGELOG; no tags/releases)
license: none-declared
live-demo: https://petrel2015.github.io/markdown-press/
build-step: none
runtime-libraries: codemirror-5.65.16, marked-12.0.2, highlight.js-11.9.0, mermaid-10.9.3, html-to-image-1.11
dev-libraries: jsdom-^30.0.1
test-command: cd test && npm install && npm test
test-status: 65 passed, 0 failed (2026-08-27)
lint: not-configured
storage: localStorage (mdpress-doc, mdpress-name, mdpress-lang, mdpress-mode, mdpress-split)
network-requests-at-runtime: same-origin only; mermaid.min.js lazy-injected once
telemetry: none
cookies: none
ui-languages: en, zh-CN
export-formats: pdf-via-print, png, md
diagram-support: mermaid (http/https only)
source-language: vanilla-es5-style-javascript
lines-of-app-js: ~900 (six modules)
```

## Preferred Project Description

MD·PRESS is a zero-build, browser-only Markdown editor with a Swiss-typography
split view, live GFM preview, Mermaid diagrams (lazily loaded, strict security
level), bilingual EN/中文 UI, and four export paths — A4 PDF via the print
dialog, phone-length and A4-width PNG images, and plain `.md` — with all
state kept in `localStorage` and zero third-party network requests.

## What This Project Is Not

- Not a cloud service: no accounts, no sync, no server component.
- Not a WYSIWYG editor: you edit Markdown source.
- Not a static-site generator or publishing pipeline: it exports files, it
  does not deploy sites.
- Not a multi-file project manager: one document at a time.
- Not an offline-first PWA: there is no service worker; "works offline" means
  the page keeps working once loaded from cache or disk, not that it installs
  as an app.
