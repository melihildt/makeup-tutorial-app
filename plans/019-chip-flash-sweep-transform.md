# 019 — Drive the filter chip's press-flash sweep via transform instead of background-position

- **Status**: TODO
- **Commit**: 677c3d7
- **Severity**: MEDIUM
- **Category**: Performance
- **Screen impact**: Home (the Day/Night/Glam filter chips)
- **Estimated scope**: 2 files (`src/index.css`, `src/components/HomeScreen.tsx`), 1 keyframe rewritten + 1 element split into two

## Problem

`HomeScreen.tsx`'s `chip-flash-sweep` animates `background-position` on a
div that's also run through `mixBlendMode`, layered on top of the chip's
own photo-texture `<img>` + a separate tint blend-mode layer:

```css
/* src/index.css:94-97 — current */
@keyframes chip-flash-sweep {
  0% { background-position: 100% 0; opacity: 1; }
  100% { background-position: 0% 0; opacity: 1; }
}
```

```tsx
/* src/components/HomeScreen.tsx:321-334 — current, full block */
      {flash && flashCount > 0 && (
        <div
          key={flashCount}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[--radius-filter-chip]"
          style={{
            backgroundImage: `linear-gradient(90deg, transparent 35%, ${flash.peak} 50%, transparent 65%)`,
            backgroundSize: '300% 100%',
            mixBlendMode: blend,
            opacity: 0,
            animation: 'chip-flash-sweep var(--duration-shimmer) linear',
          }}
        />
      )}
```

AUDIT.md's Performance category is explicit: "Animate `transform` and
`opacity` only... `width`/`height`/`margin`/`padding`/`top`/`left`
trigger layout + paint + composite" — `background-position` is the same
class of paint-triggering property, recomputed every frame rather than
handed to the compositor. This animates on top of two other paint/
compositing-heavy layers already stacked on the same chip (the photo-
texture `<img>` and its own tint blend-mode layer, `HomeScreen.tsx:263-267`)
— three paint-heavy layers repainting every frame for the sweep's
duration, on every chip press.

## Target

Split the single background-position-animated div into an outer clipping
wrapper (unchanged: `overflow-hidden`, the chip's own rounded corners,
sized to the chip) and an inner strip that's actually 300% wide (matching
the *same* gradient geometry as before, at the *same* 35%/50%/65% stops)
and animates via `transform: translateX(...)` instead of repositioning
its background paint:

```css
/* src/index.css:94-97 — target */
@keyframes chip-flash-sweep {
  /* Same sweep as before, now driven by transform instead of
     background-position — see AUDIT.md's Performance category
     (background-position is paint-triggering, transform is compositor-
     only). -66.6667% is the exact equivalent of the old
     background-position: 100% → 0% motion at this element's own 300%
     width: the old rule moved the background's own offset from -2×(chip
     width) to 0; at 300% width, -2/3 of this element's own width is the
     same -2×(chip width) offset, expressed as a percentage of itself
     (which is what CSS transform percentages are always relative to). */
  0% { transform: translateX(-66.6667%); opacity: 1; }
  100% { transform: translateX(0%); opacity: 1; }
}
```

```tsx
/* src/components/HomeScreen.tsx:321-334 — target */
      {flash && flashCount > 0 && (
        <div
          key={flashCount}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[--radius-filter-chip]"
        >
          <div
            className="absolute inset-y-0 left-0 h-full"
            style={{
              width: '300%',
              backgroundImage: `linear-gradient(90deg, transparent 35%, ${flash.peak} 50%, transparent 65%)`,
              mixBlendMode: blend,
              opacity: 0,
              animation: 'chip-flash-sweep var(--duration-shimmer) linear',
            }}
          />
        </div>
      )}
```

The outer div keeps every property it had before (`overflow-hidden`,
`rounded-[--radius-filter-chip]`, `absolute inset-0`, `key={flashCount}`)
— it's still what clips the sweep to the chip's own rounded shape (the
same cross-browser "mix-blend-mode child needs its own clipping via a
parent's overflow+radius" fix this file's own comment already documents,
now performed by the outer wrapper instead of the div doing double duty).
The inner div carries everything that was previously animated/blended:
`backgroundImage` (now sized to 100% of *itself*, since it's already the
correct 300% width rather than needing `backgroundSize: '300% 100%'` to
fake it), `mixBlendMode`, resting `opacity: 0`, and the animation.

## Repo conventions to follow

- Keep `key={flashCount}` on the *outer* div — that's what forces a fresh
  mount (and CSS `animation` replay) on every press, per this file's own
  existing comment on why a re-render alone wouldn't restart it.
- Keep the resting `opacity: 0` on the *inner* div (not the outer) — same
  reasoning as before, it's what hides the sweep both before the first
  press and after each flash finishes.
- Don't touch the `borderRadius` cross-browser-bleed reasoning in this
  file's own comment above this block — it still applies, now to the
  outer wrapper specifically (which already carries
  `rounded-[--radius-filter-chip]`, unchanged).

## Steps

1. In `src/index.css`, replace the `chip-flash-sweep` keyframe (current
   lines 94-97) with the target version shown above — same two keyframe
   stops, now animating `transform` instead of `background-position`.
2. In `src/components/HomeScreen.tsx`, replace the single `<div
   key={flashCount} ... />` block (current lines 321-334) with the
   two-level structure shown in **Target** above — the outer div keeps
   `key={flashCount}`, `aria-hidden`, and its existing `className`
   unchanged (drop only its `style` object); the inner div is new, and
   carries the `style` object that used to live on the single div (minus
   `backgroundSize`, which is replaced by the inner div's own literal
   `width: '300%'`).
3. Run `npx tsc --noEmit` to confirm no type errors.

## Boundaries

- Do NOT change the gradient's own color stops (`transparent 35%`,
  `${flash.peak} 50%`, `transparent 65%`) — only how the resulting strip
  is positioned/animated.
- Do NOT touch `--duration-shimmer` or the `linear` easing — both already
  correct per this file's own extensive existing comment on why a
  traveling sweep should stay linear, not `--ease-out-quart`.
- Do NOT touch the chip's other two background layers (the photo-texture
  `<img>` and its tint overlay, `HomeScreen.tsx:263-267`) — unrelated,
  out of scope.
- If the current code at either target location doesn't match what's
  quoted above (drift since commit 677c3d7), STOP and report instead of
  improvising a different structure.

## Verification

- **Mechanical**: `npx tsc --noEmit` — expect no errors.
- **Feel check**: run the app, and on the Home screen:
  - Tap a filter chip that has a `flash` defined (Day, Night, or Glam —
    all three do per `LOOK_TYPES`) and confirm the sweep still looks the
    same: a narrow bright band crossing the chip left-to-right, fading in
    and out at the edges, same speed and shape as before this change.
  - Tap the same chip repeatedly in quick succession — confirm each press
    replays the sweep cleanly (via the `key={flashCount}` remount,
    unchanged by this plan).
  - In DevTools Performance panel, record while pressing a chip, and
    confirm the sweep now shows as compositor-only work (`transform`)
    rather than repeated paint/composite work tied to
    `background-position`.
  - In DevTools Animations panel, set playback to 10% and step through
    one sweep in slow motion — confirm the band's position and the
    gradient's own shape look identical to the pre-fix version (this is a
    pure mechanism swap, not a visual redesign).
- **Done when**: the press-flash sweep is visually indistinguishable from
  before this change, but driven by `transform` instead of
  `background-position`.
