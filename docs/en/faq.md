# FAQ

Short answers to scope and boundary questions. Deeper detail linked inline.
中文版：[常见问题](../zh/faq.md)。

## Does my text leave my computer?

No. The app has no backend; your document lives in your browser's
`localStorage` and every export is generated locally. The only network
traffic is your browser fetching the app's own files (plus a one-time,
same-origin load of the mermaid library when you first use a diagram). See
[privacy](./privacy.md).

## Why don't my Mermaid diagrams render?

Two common reasons:

1. You opened `index.html` via `file://` — the lazy loader deliberately
   requires `http(s)`. Serve the folder (`python3 -m http.server 8765`) and
   diagrams appear. See
   [troubleshooting](./troubleshooting.md#diagrams-show-as-source-code).
2. The diagram syntax is invalid — then a red "Diagram syntax error" label
   with the raw source appears on purpose.

## Where is my document saved? Can I lose it?

In `localStorage` only, per browser and per site. There is no server, no
sync and no history. Clearing site data — or clicking `New` and confirming —
erases it. Use `Download .md` for anything valuable. See
[usage · Autosave and Storage](./usage.md#autosave-and-storage).

## Why does PDF export open the print dialog instead of saving a file?

By design: the print pipeline keeps text vector and selectable, which a
rasterized export cannot offer, and it lets the browser's own "Save as PDF"
handle pagination. Choose **Save as PDF** as the destination. See
[features/export-pipeline](./features/export-pipeline.md).

## Can I embed images in PNG exports?

Local images and data-URI images work. Remote images blocked by CORS cannot
be rasterized, so they are omitted from PNG exports; PDF/print is not
affected. See
[troubleshooting](./troubleshooting.md#remote-images-missing-from-png-exports).

## Which Markdown flavor is supported?

GitHub Flavored Markdown via marked 12 — tables, task lists, strikethrough,
fenced code. Mermaid diagrams via ` ```mermaid ` fences. See
[features/mermaid-diagrams](./features/mermaid-diagrams.md).

## Does it work offline?

Yes, once loaded. All libraries are vendored in the repository; there are no
CDN requests. Note this is not an installable offline app (no service
worker / PWA) — it is "the page keeps working", not "installs for offline
launch".

## Is there a dark mode or custom theme?

No — the Swiss design system (paper white, ink, one red accent) is fixed by
design. The tokens live at the top of `css/style.css` and the mermaid theme
in `js/markdown.js` if you want to fork the look for yourself.

## Can I use it on a phone?

Yes. Below 768 px the app collapses to Edit / Preview tabs. You can write,
export and switch language on mobile; split view is a desktop/tablet
layout. See [usage · On a Phone](./usage.md#on-a-phone).

## Can several people collaborate, or can I sync between devices?

No. There is no account system, no sync and no collaboration — that is a
deliberate non-goal (see
[features/split-editor-layout](./features/split-editor-layout.md) Non-Goals
context and [README_FOR_AI](../../README_FOR_AI.md)). Pass documents around
as `.md` files.

## Can I open a `.txt` file?

Yes — `Open .md` accepts `.md`, `.markdown` and `.txt`; content is treated
as Markdown either way.

## Is the code licensed? Can I reuse it?

The repository does not ship a LICENSE file yet, so no reuse rights are
formally granted. See the License Notes section in the
[README](../../README.md#license-notes).
