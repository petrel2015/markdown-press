# Troubleshooting

Real failure modes in MD·PRESS — symptom, what to check, what fixes it, and
where to go when it does not. Every entry maps to a guarded path in the code
(see [architecture](./architecture.md)). 中文版：[故障排查](../zh/troubleshooting.md)。

## Quick Table

| Symptom | Most likely cause | Fix |
|---------|-------------------|-----|
| Diagrams show as raw source | Page opened via `file://` | Serve over `http(s)` (below) |
| "Diagram syntax error" label | Invalid Mermaid syntax | Fix the fenced block's syntax |
| "Export failed — see console." | html-to-image missing or rasterization threw | Reload the page; check console details |
| Remote images missing from PNG | CORS blocked them | Host images locally or use data URIs |
| "Only .md, .markdown or .txt files are supported." | Wrong file type in `Open .md` | Use an accepted extension |
| "Could not read that file." | File unreadable | Re-select the file |
| "Some parts failed to start — reload the page." | A boot stage threw | Reload; if persistent, check console |
| Document gone after clearing site data | Only copy lived in `localStorage` | Keep external `.md` copies (Download .md) |
| Editor measures/overlaps after rotate or resize | CodeMirror needs a refresh (normally automatic) | Toggle view mode once, or resize again |

## Diagrams Show as Source Code

**Symptom** — ` ```mermaid ` fences display as a code block with no diagram;
other Markdown renders fine.

**Why** — the mermaid bundle is not loaded at page start. It is injected on
demand, and the injector deliberately refuses to run when the page protocol
is not `http(s)`. Opening `index.html` directly (URL starts with `file://`)
therefore keeps diagrams as raw source. This is by design, not a bug.

**Fix** — serve the folder over HTTP:

```sh
python3 -m http.server 8765
# → http://localhost:8765/
```

**If it persists over http(s)** — open the browser console: a failed
`vendor/mermaid.min.js` request (404, blocked) means the file is missing or
an extension/security software is blocking it; the app will keep working
with raw sources.

## Diagram Syntax Error Label

**Symptom** — a red "Diagram syntax error" label appears above the diagram's
raw source.

**Why** — mermaid rejected that specific diagram. The failure is contained:
the rest of the preview is unaffected, and fixing the syntax re-renders.

**Fix** — check the fence content: statement order, unbalanced brackets,
unsupported diagram types for mermaid 10.9.3. The label is the intended
error UX (see [features/mermaid-diagrams](./features/mermaid-diagrams.md)).

## Export Failed

**Symptom** — status bar shows "Export failed — see console." and no file
downloads.

**Check order** —

1. Console: `html-to-image` failing to load (`vendor/html-to-image.min.js`
   request error) → PNG export cannot run; PDF/print and `.md` do not need
   it.
2. Console error from rasterization (huge documents can exhaust memory) →
   try exporting a shorter document, or the A4 PDF path instead.
3. The document itself: an image that never resolves delays export up to 4 s
   per image and may abort the run.

## Remote Images Missing from PNG Exports

**Symptom** — PNG export works, but images from other domains are absent.

**Why** — canvas rasterization cannot read pixels from CORS-blocked remote
images; `html-to-image` excludes them.

**Fix** — reference local files or data URIs. PDF/print is unaffected
(the print pipeline is not canvas-based).

## File Open Rejected

**Symptom** — "Only .md, .markdown or .txt files are supported."

**Why/fix** — the picker's extension check is strict; rename the file or
paste its content directly. If a valid `.md` is rejected, check for a hidden
double extension.

## Boot Error Notice

**Symptom** — status bar shows "Some parts failed to start — reload the
page."; some controls may still work (boot stages are fault-isolated).

**Check** — the console line prefixed `MD·PRESS boot:` names the failing
stage. Reload first. If it reproduces on a plain reload over http(s), please
open an issue with that console line, browser and version.

## Document Lost

**Symptom** — the document is empty or reset to the sample.

**Why** — the only copy was in `localStorage`; clearing site data, private
mode, or storage quota pressure removes it. There is deliberately no server
copy.

**Prevention** — use `Download .md` for anything you care about. The
sample document reappears only when storage holds no document at all.

## Layout Looks Wrong After Resizing

**Symptom** — editor lines overlap or the pane is stale after rotating a
tablet or resizing across the phone breakpoint.

**Why** — CodeMirror must re-measure after its pane changes size or
visibility; the app schedules this on mode change, divider release and
window resize, but a missed event can slip through.

**Fix** — toggle Edit/Split/Preview once, or resize the window slightly.
If a specific sequence reproduces it reliably, that is a bug — please
report the sequence.

## Still Stuck?

Open an issue at <https://github.com/petrel2015/markdown-press/issues> with:

1. What you did and what you expected.
2. Browser name/version and the URL scheme (`http(s)://` or `file://`).
3. Console output (especially lines prefixed `MD·PRESS boot:`).
4. Whether the problem reproduces on the live demo — this separates app bugs
   from local serving issues.
