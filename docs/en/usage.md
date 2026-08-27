# Usage

How to operate MD·PRESS, step by step. For what the project is, see the
[README](../../README.md); for why it behaves the way it does at the edges,
see [features](./features/index.md) and [architecture](./architecture.md).
中文版：[使用说明](../zh/usage.md)。

## First Run

1. Open the app (online at
   <https://petrel2015.github.io/markdown-press/>, locally via `open
   index.html` or a static server).
2. A localized sample document loads, showing headings, lists, tables, code
   and a Mermaid flowchart. It is saved to `localStorage` immediately, so a
   refresh brings it back.
3. The interface language defaults to your browser language; switch with the
   EN / 中文 buttons in the masthead. Your choice is remembered.

## Writing

### View Modes

- **Edit** — editor only.
- **Split** (default on desktop) — editor left, preview right.
- **Preview** — preview only.

Switch with the Edit / Split / Preview tabs below the brand. The choice is
persisted. Below 768 px viewport width, Split is unavailable: the app
coerces it to Edit and hides the option (see [On a Phone](#on-a-phone)).

### Split Divider

- Drag the divider between the panes; the split ratio clamps to 25%–75%.
- With the divider focused (it is a keyboard-reachable separator):
  `←` / `→` adjust the ratio by 2 points.
- Double-click resets to 50 / 50.
- The ratio persists ~300 ms after you finish adjusting.

### Formatting

The toolbar above the editor inserts or toggles syntax around the selection:
Bold, Italic, Code, Link (prompts for a URL), List (toggles `- ` prefixes on
selected lines), and Diagram (inserts a Mermaid starter fence).

Keyboard shortcuts (while the editor is focused):

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + B` | Bold |
| `Cmd/Ctrl + I` | Italic |
| `Cmd/Ctrl + K` | Insert link |
| `Enter` (in a list) | Continue the list |

Bold and italic toggle off when the selection already carries the markers.

### Diagrams

A fenced code block tagged `mermaid` renders as an SVG diagram:

    ```mermaid
    flowchart LR
      A --> B
    ```

- Diagrams re-render with the rest of the preview (~300 ms debounce).
- The mermaid library (~3.3 MB) loads once, on demand, when your document
  first contains a diagram; documents without diagrams never load it.
- Invalid diagram syntax shows a red "Diagram syntax error" label above the
  raw source — the rest of the page keeps working. Fix the syntax and it
  re-renders.
- Diagrams require the page to be served over `http(s)`. Under `file://`
  they stay as raw source (see
  [troubleshooting](./troubleshooting.md#diagrams-show-as-source-code)).

## Files

### Open a Local File

`Open .md` opens a file picker accepting `.md`, `.markdown` and `.txt`. The
content replaces the current document (which is autosaved first, so the
previous document is overwritten in storage), and the file name (sans
extension) becomes the document name used by all exports.

### Download the Source

`Download .md` saves the raw Markdown as `<document>.md`. Invalid filename
characters (`\ / : * ? " < > |`) are replaced with `_`; a missing extension
gets `.md` appended.

### Autosave and Storage

- The document saves to `localStorage` ~400 ms after you stop typing and on
  page unload; the status bar shows the save time.
- Also persisted: document name, language, view mode, split ratio.
- If `localStorage` is unavailable, everything still works in memory for the
  session — nothing persists, no error is shown.
- There is no server copy. Clearing site data in your browser deletes the
  document. `New` (after a confirmation dialog) clears it immediately.

## Exporting

All exports are generated locally and downloaded; nothing is uploaded.
Export file names derive from the document name: `<name>.pdf` /
`<name>-phone.png` / `<name>-a4.png` / `<name>.md`.

### A4 PDF (print)

1. `Export` → `A4 · PDF (print)`. The preview is cloned into a print-only
   container and the browser print dialog opens.
2. Set the destination to **Save as PDF**.
3. Margins and pagination follow the browser controls plus the shipped
   `@page` rules; headings stay with following content, and code blocks,
   tables and diagrams are not split across pages where possible.
4. Text stays vector and selectable — this is why the PDF path goes through
   the print dialog instead of rasterizing.
5. After printing (or closing the dialog) the print container is removed and
   the document title is restored. A 60 s safety timer cleans up even if the
   browser never reports the print completion.

### Phone image (PNG)

`Export` → `Phone image · PNG` rasterizes the whole rendered document at
390 px logical width (780 px output at 2×) with 20 px padding — a long image
sized for phone screens.

### A4 image (PNG)

`Export` → `A4 image · PNG` rasterizes at 794 px logical width (1588 px
output at 2×) with 60 px padding — the image-based alternative to the PDF.

### Images inside exports

Local images and data-URI images export fine. Remote images blocked by CORS
cannot be embedded in PNG exports (see
[troubleshooting](./troubleshooting.md#remote-images-missing-from-png-exports)).

## Language

- The EN / 中文 switch re-labels the entire chrome instantly, updates the
  page title, `lang` attribute and ARIA labels, and swaps the first-run
  sample document text.
- The choice persists in `localStorage` and wins over browser-language
  detection on later visits.

## On a Phone

Below 768 px viewport width the app switches to single-pane tabs: Edit /
Preview (Split is hidden). Formatting, export and language controls remain
available from the masthead and toolbar. The layout also reacts to rotation
and window resize without a reload.

## Error Handling

| Situation | Behavior |
|-----------|----------|
| Mermaid syntax error | Red "Diagram syntax error" label + raw source shown; page unaffected |
| Export target missing (e.g. html-to-image failed to load) | Status-bar notice "Export failed — see console."; nothing downloads |
| PNG rasterization error | Same failure notice; details logged to the browser console |
| `Open .md` with unsupported extension | Status-bar notice "Only .md, .markdown or .txt files are supported."; nothing loads |
| File cannot be read | Status-bar notice "Could not read that file." |
| A boot stage fails | Status-bar notice "Some parts failed to start — reload the page."; other stages still run |
| `localStorage` unavailable | Silent in-memory fallback; nothing persists |
| Image that never loads in PNG export | Export continues after a 4 s timeout per image |

Notices appear in the status bar (right side) and clear themselves after
4 seconds.

## Boundary Behavior

- One document at a time; there is no document list or tabs.
- No undo for `New` — it clears after a `confirm()` dialog.
- The preview is read-only; clicking links opens them normally (no editor
  integration).
- Split ratio survives orientation changes; the mode itself re-coerces if
  the viewport crosses the phone breakpoint.
- `Sync scroll` only applies in Split mode.
- Autosave writes locally only — there is deliberately no sync, no backup
  and no version history beyond what `localStorage` holds.
