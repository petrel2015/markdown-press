# Privacy

What MD·PRESS stores, sends and asks for — item by item, verified against
the source code on 2026-08-27. 中文版：[隐私](../zh/privacy.md)。

## Summary

The app is a set of static files. It has no backend, no accounts and no
analytics. The only data it touches is what you type, kept in your browser's
`localStorage`. The only runtime network traffic is same-origin (the app's
own files, including a one-time lazy load of its vendored mermaid library).

## What Is Stored

All persistence is `localStorage`, scoped to the site origin in your
browser. Nothing is stored anywhere else; there are no cookies.

| Key | Contents | Written when | Lifetime |
|-----|----------|--------------|----------|
| `mdpress-doc` | Your document text (plaintext) | ~400 ms after typing stops; on page unload; on file open / New | Until you clear site data or replace the document |
| `mdpress-name` | Document base name | With the document | Same |
| `mdpress-lang` | UI language (`en` / `zh`) | When you switch language | Until cleared |
| `mdpress-mode` | View mode (`edit` / `split` / `preview`) | When you change mode | Until cleared |
| `mdpress-split` | Split ratio percentage | ~300 ms after divider adjustment | Until cleared |

Every access is wrapped in `try/catch`: if storage is blocked (private mode,
quota), the app continues in memory and nothing persists.

Clearing the site's data in your browser deletes the document permanently —
there is no server copy.

## Network Behavior

Verified by reading every network-touching line of code and by watching a
full UI session in a browser with an empty network log apart from these:

- Initial load: your browser fetches the app's own static files (HTML, CSS,
  JS, vendored libraries) from the site origin.
- One-time lazy load: when your document first contains a ` ```mermaid `
  fence, the app injects `vendor/mermaid.min.js` — a file from **the same
  origin**, part of the repository. Documents without diagrams never load
  it; under `file://` it is not loaded at all.
- That is all. **No** third-party hosts, **no** CDN fonts, **no** analytics
  or telemetry, **no** version checks, **no** error reporting.

Images you embed are fetched by your browser from wherever they point (that
is how `<img>` works); the app itself makes no requests beyond the two
categories above.

## Third Parties

- At runtime, the app contacts no third party.
- External links inside your document open in a new tab when clicked —
  the destination site sees a normal visit from your browser.
- The hosting provider (GitHub Pages for the live demo) serves the files and
  necessarily logs the requests involved; that is outside this project's
  control. For fully local use, download the repository and open it from
  disk or your own server.

## Browser Permissions and Dialogs

| Request | When | Scope |
|---------|------|-------|
| File picker | `Open .md` | Reads only the file you select, locally via `FileReader`; nothing is uploaded |
| `confirm()` dialog | `New` document | Built-in browser dialog |
| `prompt()` dialog | Insert link | Built-in browser dialog, asks for the URL |

No geolocation, notifications, camera, microphone, clipboard or other
permission is ever requested. Exports are plain local downloads.

## Security Notes

- Mermaid runs with `securityLevel: 'strict'` (labels sanitized, click
  interaction disabled).
- Rendered Markdown goes through marked 12's sanitizer-free pipeline but the
  custom code renderer escapes fence content; treat the preview like any
  Markdown renderer when pasting untrusted content.

## Honest Scope

This page describes what **this repository's code** does. It cannot speak
for your browser, your operating system, or the hosting provider. Claims
here are verifiable in the source: storage keys in `js/app.js`, `js/i18n.js`,
`js/layout.js`; network injections in `js/markdown.js`; file handling in
`js/export.js`.
