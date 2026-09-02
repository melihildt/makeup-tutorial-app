# 042 — Gate hover feedback on `(pointer: fine)` as well as `(hover: hover)`

- **Status**: TODO
- **Commit**: 2d86cf3
- **Severity**: MEDIUM
- **Category**: Accessibility (AUDIT.md §6)
- **Estimated scope**: 1 file, 2 media-query edits

## Problem

`.action-button:hover` and `.header-icon-button:hover svg` — the two shared
press/hover classes used across nearly every button in the app — gate hover
feedback behind `@media (hover: hover)` alone. AUDIT.md §6 calls for
`@media (hover: hover) and (pointer: fine)` specifically: `(hover: hover)`
alone is true on some hybrid/stylus-capable devices that report "can hover"
but don't have a fine mouse-like pointer, so those devices can still see a
transform-triggering hover state stick after a tap the way this class's own
comment already describes touch devices doing. The existing comment above
`.action-button` explains *why* `(hover: hover)` was added (touch leaving
`:hover` "stuck"), but never discusses the `pointer: fine` half of the fix.

```css
/* src/index.css:133-143 — current */
.action-button {
  transition: transform var(--duration-instant) var(--ease-out-quart);
}
@media (hover: hover) {
  .action-button:hover {
    transform: scale(1.02);
  }
}
.action-button:active {
  transform: scale(0.97);
}
```

```css
/* src/index.css:177-189 — current */
.header-icon-button svg {
  transition:
    transform var(--duration-instant) var(--ease-out-quart),
    opacity var(--duration-base) var(--ease-out-quart);
}
@media (hover: hover) {
  .header-icon-button:hover svg {
    transform: scale(1.05);
  }
}
.header-icon-button:active svg {
  transform: scale(0.93);
}
```

## Target

```css
/* src/index.css:136 — target */
@media (hover: hover) and (pointer: fine) {
  .action-button:hover {
    transform: scale(1.02);
  }
}
```

```css
/* src/index.css:182 — target */
@media (hover: hover) and (pointer: fine) {
  .header-icon-button:hover svg {
    transform: scale(1.05);
  }
}
```

Only the two `@media` query strings change. The `:active` rules, the base
`transition` declarations, and everything else in both blocks stay exactly
as they are.

## Repo conventions to follow

- AUDIT.md §6 states this exact compound query
  (`@media (hover: hover) and (pointer: fine)`) as the correct hover gate for
  transform-driven hover feedback, precisely to exclude touch devices that
  report a false "can hover."
- This codebase already writes compound/deliberate media queries elsewhere —
  e.g. `src/index.css:341` (`@media (prefers-reduced-motion: reduce)`) shows
  the same one-purpose-per-query style; no new pattern is being introduced,
  just adding the missing clause to an existing query.

## Steps

1. In `src/index.css` line 136, change `@media (hover: hover) {` to
   `@media (hover: hover) and (pointer: fine) {`.
2. In `src/index.css` line 182, change `@media (hover: hover) {` to
   `@media (hover: hover) and (pointer: fine) {`.

## Boundaries

- Do NOT touch any other `@media (hover: hover)` block in this file if one
  exists elsewhere — search first (`grep -n "hover: hover" src/index.css`)
  and only touch the two blocks cited above; if a third exists that this plan
  didn't account for, STOP and report it rather than guessing whether it
  should change too.
- Do NOT change the `:active` scale values (0.97, 0.93) — those are
  deliberate, documented choices per this file's own comments and are exempt
  under Hard Rule 5.
- Do NOT touch the `transition` property declarations in either block.
- If the cited lines don't match the Problem snippets above (drift since
  commit `2d86cf3`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npx tsc --noEmit` clean (CSS-only change, but confirms
  nothing else broke). `npm run build` clean.
- **Feel check**: this fix is only observable on a device/emulation that
  reports `hover: hover` but not `pointer: fine` — a real touchscreen laptop,
  or DevTools' device toolbar with hover simulated, is the practical way to
  check. On a normal mouse-driven desktop browser, hover feedback should look
  completely unchanged (mouse pointers are `hover: hover` and `pointer:
  fine`, so nothing regresses there):
  - With a real mouse: hovering an `.action-button` or a `ScreenHeader` icon
    button should still scale up (1.02 / 1.05) exactly as before.
  - With DevTools' device emulation set to a touch device: tapping (not
    hovering) either button should never trigger the hover scale-up at all.
  - Toggle `prefers-reduced-motion` and confirm press (`:active`) feedback
    still collapses to near-instant per the global rule — unaffected by this
    fix, just a sanity check nothing else broke.
- **Done when**: both media queries cited above read
  `@media (hover: hover) and (pointer: fine)`, and mouse-driven hover
  feedback is visually unchanged.
