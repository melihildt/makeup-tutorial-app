# 041 — ScreenHeader toggle highlight: use --ease-in-out for its on-screen slide

- **Status**: TODO
- **Commit**: 2d86cf3
- **Severity**: MEDIUM
- **Category**: Easing & duration (AUDIT.md §2)
- **Estimated scope**: 2 files, 2 one-line edits

## Problem

The Search/Widget toggle highlight in `ScreenHeader.tsx` slides between two
fixed positions — a "moving/morphing on screen" motion by AUDIT.md §2's own
decision order, which calls for `--ease-in-out`. It currently uses
`--ease-out-quart` (the app's enter/exit curve) instead, both in the
same-instance CSS `transition` and in the View Transitions API override that
drives the cross-screen slide (StepScreen ↔ AllStepsView, each with its own
`<ScreenHeader>` instance — see `ScreenHeader.tsx:145-161`'s own comment for
why both codepaths exist for one visual element).

```tsx
/* src/components/ScreenHeader.tsx:162-171 — current (relevant line: 169) */
<div
  aria-hidden="true"
  className="header-toggle-highlight pointer-events-none absolute left-0 top-0 size-[44px] rounded-[--radius-filter-chip]"
  style={{
    background: 'var(--color-header-icon-bg)',
    boxShadow: 'inset 0 0 0 0.5px var(--color-header-icon-border)',
    transform: isListView ? 'translateX(100%)' : 'translateX(0)',
    transition: 'transform var(--duration-base) var(--ease-out-quart)',
  }}
/>
```

```css
/* src/index.css:319-322 — current */
::view-transition-group(header-toggle-highlight) {
  animation-duration: var(--duration-base);
  animation-timing-function: var(--ease-out-quart);
}
```

## Target

```tsx
/* src/components/ScreenHeader.tsx:169 — target */
    transition: 'transform var(--duration-base) var(--ease-in-out)',
```

```css
/* src/index.css:319-322 — target */
::view-transition-group(header-toggle-highlight) {
  animation-duration: var(--duration-base);
  animation-timing-function: var(--ease-in-out);
}
```

`--duration-base` (200ms) is unchanged in both places — this is an easing-only
fix.

## Repo conventions to follow

- `--ease-in-out` (tokens.css:122, `cubic-bezier(0.77, 0, 0.175, 1)`) is
  already this app's established curve for on-screen movement; its own token
  comment names CopyEmailButton's failure shake as the first use case
  ("a symmetric back-and-forth motion where ease-out-quart's asymmetric
  fast-start doesn't fit") — the same asymmetry problem applies to a slide
  between two fixed positions.
- Exemplar already using it correctly for a comparable case:
  `src/components/InfoOverlay.tsx:252` —
  `transform: { duration: 0.3, ease: EASE_IN_OUT }` on the mobile drawer's
  slide-down close.

## Steps

1. In `src/components/ScreenHeader.tsx`, on line 169, change
   `var(--ease-out-quart)` to `var(--ease-in-out)` inside the `transition`
   string. No other part of the `style` object changes.
2. In `src/index.css`, on line 321
   (`::view-transition-group(header-toggle-highlight)`), change
   `animation-timing-function: var(--ease-out-quart);` to
   `animation-timing-function: var(--ease-in-out);`. Line 320
   (`animation-duration`) is untouched.

## Boundaries

- Do NOT touch the `translateX(100%)` / `translateX(0)` logic, the
  `isListView` condition, or any other styling on this element.
- Do NOT touch `TutorialFlow.tsx`'s `document.startViewTransition` calls or
  any other `::view-transition-*` rule in `index.css`.
- Do NOT change `--duration-base` itself in `tokens.css` — that token is
  shared by other consumers and out of scope for this fix.
- If the cited lines don't match the Problem snippets above (drift since
  commit `2d86cf3`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npx tsc --noEmit` clean. `npm run build` clean.
- **Feel check**: on a step screen, tap the Widget icon (switches to All
  Steps list), then tap Search (switches back).
  - The highlight chip should still land in the correct button on each tap,
    just with a more symmetric ease-in/ease-out feel on the slide rather than
    a quick-start/slow-settle feel.
  - In DevTools' Animations panel, set playback to 10% while tapping the
    toggle and confirm the highlight decelerates gently into both ends of its
    travel (not a fast start that then coasts).
  - Trigger the *cross-screen* version specifically: from a step screen, tap
    Widget to jump to All Steps (this remounts a fresh `<ScreenHeader>` and
    goes through the View Transitions codepath, not the plain CSS
    `transition`). Confirm the highlight still visibly morphs from its old
    position to its new one rather than snapping.
  - Toggle `prefers-reduced-motion` (Rendering panel) and confirm the
    highlight still ends in the correct position (movement is already
    globally collapsed by `index.css`'s reduced-motion rule; this isn't a new
    concern for this specific fix).
- **Done when**: both occurrences of `--ease-out-quart` cited above read
  `--ease-in-out` instead, and the toggle highlight's slide (both
  same-instance and cross-screen) plays with the symmetric curve.
