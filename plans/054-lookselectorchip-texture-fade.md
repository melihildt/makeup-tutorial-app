# 054 — Fade the selected chip's texture/tint layer in and out instead of hard-mounting it

- **Status**: TODO
- **Commit**: 3ecf622
- **Severity**: LOW-MEDIUM
- **Category**: Missed opportunity (AUDIT.md §8)
- **Estimated scope**: 1 file, one block converted from a conditional mount to an `AnimatePresence`-wrapped fade

## Problem

`LookSelectorChip`'s border and shadow already cross-fade smoothly on
selection (see `plans/052`), but the chip's own photo-texture/tint layer —
its dominant visual content — hard-mounts and unmounts via a plain
`{selected && (...)}` conditional, teleporting in and out instantly:

```tsx
/* src/components/HomeScreen.tsx:241-254 — current */
{selected && (
  <div aria-hidden="true" className="pointer-events-none absolute inset-0">
    <div className="absolute inset-0 bg-white" />
    <img alt="" src={texture} className="absolute inset-0 size-full object-cover object-bottom" />
    <div className="absolute inset-0" style={{ background: overlayTint, mixBlendMode: overlayBlend }} />
    <div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(to left, ${gradient.from}, ${gradient.to})`,
        mixBlendMode: gradient.blend,
      }}
    />
  </div>
)}
```

The frame around this layer (border, glow) eases in; the content inside it
pops. That mismatch is the actual seam worth fixing — chrome tweens, content
cuts.

## Target

Wrap the layer in Framer Motion's `AnimatePresence`/`motion.div` so both its
entrance *and* its exit get a real opacity fade, instead of an instant
mount/unmount — this keeps the texture image lazily-loaded (only once a
chip is first selected, same as today), unlike a plain "always render, toggle
opacity" approach, which would force all three chips' texture images to load
eagerly on first paint regardless of selection.

```tsx
/* src/components/HomeScreen.tsx:241-254 — target */
<AnimatePresence>
  {selected && (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      // Opacity-only, so this stays correct even under prefers-reduced-
      // motion without a separate branch — AUDIT.md's Accessibility
      // category calls for keeping opacity/color feedback and dropping
      // movement, not zeroing every animation; there's no movement here to
      // drop. duration-instant/ease-out-quart match the chip's own border/
      // glow crossfade (plans/052, the same tap), so both halves of the
      // selection change land in sync rather than at two different speeds.
      transition={{ duration: DURATION.instant, ease: EASE_OUT_QUART }}
    >
      <div className="absolute inset-0 bg-white" />
      <img alt="" src={texture} className="absolute inset-0 size-full object-cover object-bottom" />
      <div className="absolute inset-0" style={{ background: overlayTint, mixBlendMode: overlayBlend }} />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to left, ${gradient.from}, ${gradient.to})`,
          mixBlendMode: gradient.blend,
        }}
      />
    </motion.div>
  )}
</AnimatePresence>
```

If `plans/052` has already landed in this codebase, this exact block sits
one level deeper — inside the content-clip `<div className="... overflow-
hidden rounded-[--radius-filter-chip]">` that plan introduces — but the
conversion shown here is identical either way; just apply it to the
`{selected && (...)}` block wherever it currently sits.

## Repo conventions to follow

- `AnimatePresence` + `motion.div` with `initial`/`animate`/`exit` is this
  app's own established tool for "this needs a real exit animation, not just
  an entrance" — see `Toast.tsx`, `InfoOverlay.tsx`, `ProductDetailOverlay.tsx`
  for the same `AnimatePresence` wrapping a conditionally-rendered
  `motion.div` pattern.
- `DURATION` and `EASE_OUT_QUART` (`src/components/TutorialCard.tsx`) are
  this app's shared motion primitives — reuse them rather than hand-typing
  `0.15`/a new easing array (see `plans/044`).

## Steps

1. In `src/components/HomeScreen.tsx`, add `AnimatePresence` and `motion` to
   this file's imports from `'framer-motion'` (add a new
   `import { AnimatePresence, motion } from 'framer-motion'` line near the
   top of the file, alongside the existing `import { useState } from
   'react'`).
2. Add `DURATION` and `EASE_OUT_QUART` to this file's existing import from
   `./TutorialCard` (currently `import { TUTORIALS, TutorialStack } from
   './TutorialCard'` on line 2) → `import { DURATION, EASE_OUT_QUART,
   TUTORIALS, TutorialStack } from './TutorialCard'`.
3. Replace the `{selected && (...)}` block (lines 241-254, or wherever it
   currently sits if `plans/052` has already landed) exactly as shown in
   Target above — wrap it in `<AnimatePresence>`, change the inner `<div>`
   to `<motion.div>` with the `initial`/`animate`/`exit`/`transition` props
   shown, and leave every child inside it (the four layered `<div>`s/`<img>`)
   completely unchanged.

## Boundaries

- Do NOT change `texture`, `overlayTint`, `overlayBlend`, `gradient`, or any
  other value/prop this layer reads — only how its mount/unmount is
  animated.
- Do NOT touch the press-flash sweep block or any other part of
  `LookSelectorChip` — this plan is scoped to the texture/tint layer only.
- Do NOT add `AnimatePresence`/`motion` usage anywhere else in this file —
  scope the import and the change to this one layer.
- If the current code doesn't match the Problem snippet above (drift since
  commit `3ecf622` — including if `plans/052` has landed and moved this
  block one level deeper), STOP and report instead of improvising, unless
  the only difference is exactly that relocation, in which case apply the
  same conversion at its new location.

## Verification

- **Mechanical**: `npx tsc --noEmit` clean. `npm run build` clean.
- **Feel check**: on the Home screen, tap between Day/Night/Glam repeatedly.
  - The texture/tint layer should now visibly fade in as a chip becomes
    selected, and fade out as it becomes deselected — no more instant
    pop/cut. It should feel synchronized with the border/glow crossfade
    around it (both ~150ms), not offset or racing it.
  - Confirm the texture image for a given filter type is not fetched/loaded
    until that chip is selected at least once (check the Network panel on
    first Home-screen load — before tapping anything, only the initially-
    selected chip's texture should have loaded, not all three).
  - In DevTools' Animations panel, set playback to 10% on a chip switch and
    confirm the outgoing chip's texture layer fades out (not disappears
    instantly) while the incoming chip's texture layer fades in.
  - Toggle `prefers-reduced-motion` and confirm the fade still plays (this
    is intentional per the Target's own comment — opacity-only motion stays
    even under reduced motion).
- **Done when**: the texture/tint layer fades in and out via
  `AnimatePresence` instead of hard-mounting/unmounting, texture images stay
  lazily loaded, and the fade timing matches the chip's own border/glow
  crossfade.
