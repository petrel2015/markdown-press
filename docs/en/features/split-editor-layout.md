# Split-Editor Layout

## Summary

Edit / Split / Preview view modes with a draggable, keyboard-reachable
divider, phone-width coercion, and proportional two-way scroll sync —
expressed as a `data-mode` attribute on `<body>` that CSS resolves
per-breakpoint.

## Background

The core experience is "write left, read right". That requires a layout
system that stays correct across desktop widths, tablets, phones, rotation,
and a code editor (CodeMirror) that must re-measure whenever its pane
changes size or visibility.

## Problem

1. Split panes need a user-adjustable ratio that is discoverable by mouse,
   touch and keyboard, clamped to sane bounds, and persistent.
2. On phone widths a side-by-side split is unusable — the mode must
   degrade without losing the user's desktop preference.
3. Editor and preview must scroll together *proportionally* (not
   line-by-line) in both directions, without feedback loops.
4. CodeMirror measures wrongly in hidden or resized containers; misses here
   show as overlapping lines or blank panes.

## Goals

- Three modes, one source of truth, switchable instantly with no reload.
- Divider: drag (pointer events), arrow keys (±2%), double-click reset,
  clamped 25%–75%, persisted ~300 ms after the last adjustment.
- Phone (≤767 px): `split` coerces to `edit`; the split button hides; the
  stored desktop preference survives.
- Scroll sync: proportional, two-way, toggleable, loop-safe.
- No CodeMirror measurement glitches on mode change, divider release or
  window resize.

## Non-Goals

- No multi-pane (3+) layouts, no vertical stacking option.
- No per-document layout memory — mode and ratio are app-level preferences.
- No draggable preview-width handle on phones (single-pane tabs instead).
- No independent scroll positions per pane when sync is on; disabling sync
  is the escape hatch.
- No layout animation; changes are immediate by design.

## Solution Overview

Modes live on `<body data-mode>`; CSS decides pane visibility per media
query — JavaScript only flips the attribute. The requested mode is stored
raw; the *effective* mode is computed (`effectiveMode`): on phone viewports
`split` becomes `edit`, invalid values fall back to `split`. The divider is
a `role="separator"` element with pointer capture during drag, writing the
ratio into CSS custom property `--split` and persisting (debounced) to
`mdpress-split`. Scroll sync listens to both scrollers, maps scroll
*ratios* (not pixels), and locks the loop for 120 ms after each programmatic
move. `matchMedia('(max-width: 767px)')` change events and window resize
re-apply the effective mode; the CSS phone rules are the safety net if
events never fire.

## Detailed Behavior

- Mode switch: sets attribute, updates `aria-pressed` on the three buttons,
  persists, notifies listeners. CodeMirror is refreshed on the next tick
  because it may have been hidden.
- Divider drag: pointer capture on the divider; body gets a `col-resizing`
  class (text selection off, column resize cursor). Drag maps pointer X to
  a workspace-relative percentage.
- Keyboard: `←`/`→` while the divider is focused adjust by 2 points;
  double-click resets to 50. The divider's aria-label explains this.
- Scroll sync: ratio = scrollTop / scrollable-height, applied to the other
  pane's scrollable range; only active in split mode and when enabled; the
  "Sync scroll" toggle flips `aria-pressed` and takes effect immediately.
- Phone coercion: requested mode stays `split` in storage; enlarging the
  window restores split automatically on the next media-query evaluation.
- Known timing: mode changes, divider release and window resize all
  schedule `editor.refresh()` (0–50 ms) to force CodeMirror re-measure.

## User Experience

![MD·PRESS desktop split view](../../img/desktop-overview-en.webp)

Desktop: tabs above the workspace switch modes; the hairline divider drags
with pointer or keyboard. Phone: the same app becomes two tabs with the
full toolbar intact.

![Phone layout with Edit / Preview tabs](../../img/mobile-tabs-zh.webp)

## Compatibility and Historical Impact

Shipped with the initial release. The phone-coercion refinement (split →
edit below 768 px with stored preference) and the scroll-sync lock landed
as part of the pre-tag polish; no historical behavior outside this feature
is affected.

## Data and Privacy Impact

Introduces `mdpress-mode` and `mdpress-split` in `localStorage` —
preference data only, no document content beyond what `mdpress-doc`
already stores.

## Performance Impact

Scroll sync is O(1) per event with a 120 ms lock to prevent ping-pong;
mode switches are attribute flips plus one CodeMirror refresh. No
measurements published.

## Current Limitations

- Ratio granularity is integer percent.
- Divider cannot be dragged while in Edit or Preview mode (only panes are
  visible — by definition).
- Sync maps scroll *proportions*, not element positions: a short document
  in a tall pane can drift slightly at the extremes.

## Release Information

Introduced: 1.0.0 · Status: Stable (summary version — see
[CHANGELOG](../../../CHANGELOG.md) versioning note).

## Related Documentation

- [usage · Writing](../usage.md#writing)
- [usage · On a Phone](../usage.md#on-a-phone)
- [architecture · Responsive Strategy](../architecture.md#responsive-strategy)
- [troubleshooting · Layout Looks Wrong After Resizing](../troubleshooting.md#layout-looks-wrong-after-resizing)

## Feature Changelog

### 1.0.0

- Initial behavior: three modes, pointer+keyboard divider, phone coercion,
  proportional two-way scroll sync with toggle.
