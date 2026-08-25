# 004 — Replace Start Over's linear drag damping with real rubber-band friction

- **Status**: TODO
- **Commit**: 628b8b7
- **Severity**: LOW
- **Category**: Physicality & origin
- **Estimated scope**: 1 file, ~5 edits (new helper function, 4 call sites, MotionTuning)

## Problem

`src/components/TutorialCard.tsx` — the Start Over card's drag "resistance"
is a flat linear multiplier, not friction that rises the further you pull:

```tsx
// src/components/TutorialCard.tsx:599-607 — current
/** How much of the raw drag distance actually reaches the Start Over
 *  card's own position while it's being dragged — that card can never
 *  commit (see TutorialStackCard's handleDrag/handleDragEnd), so a 1:1
 *  drag would either do nothing (looking broken/unresponsive) or move
 *  exactly like a real swipe right up until it doesn't commit (a
 *  confusing bait-and-switch). Damping it to a fraction of the real
 *  travel — "light rubber-band" per the user's own call — reads as the
 *  card visibly resisting instead of either extreme. */
const START_OVER_RESIST_FACTOR = 0.35
```

```tsx
// src/components/TutorialCard.tsx:897-899 — current, handleDrag's start-over branch
dragX.set(info.offset.x * START_OVER_RESIST_FACTOR)
dragY.set(info.offset.y * START_OVER_RESIST_FACTOR)
```

```tsx
// src/components/TutorialCard.tsx:1030-1039 — current, handleDragEnd's start-over branch
animateValue(dragX, 0, {
  type: 'spring',
  velocity: info.velocity.x * START_OVER_RESIST_FACTOR,
  bounce: 0,
  duration: tuning.cancelDuration,
})
animateValue(dragY, 0, {
  type: 'spring',
  velocity: info.velocity.y * START_OVER_RESIST_FACTOR,
  bounce: 0,
  duration: tuning.cancelDuration,
})
```

A real rubber-band (iOS `UIScrollView` overscroll-style) gets *harder* to
pull the further you drag, asymptotically approaching a soft cap — a small
drag moves almost freely, a large drag barely moves further at all. This
implementation instead scales every offset by the same flat `0.35`
regardless of distance: a 100px drag moves the card 35px, a 1000px drag
moves it 350px — proportional, not resisted. It reads as "everything is
slow," not "this is pushing back."

## Target

Replace the flat multiplier with the standard rubber-band formula (the same
one `UIScrollView`'s bounce and most rubber-band ports, e.g. Rebound, are
built on): `f(x, d, c) = (x·d·c) / (d + c·x)`, applied to the signed offset.
As `x → ∞`, `f(x) → d` — the card asymptotically approaches, but never
exceeds, a fixed visual travel distance `d`, with resistance rising smoothly
the whole way there.

```tsx
/* target — new helper, placed near START_OVER_RESIST_FACTOR's current location */
/** Classic rubber-band curve (UIScrollView-style overscroll): resistance
 *  rises smoothly as `offset` grows, asymptotically approaching `dimension`
 *  px of visual travel no matter how far the raw drag goes — a small drag
 *  moves almost freely, a large one is strongly damped, and there's a real
 *  soft cap instead of unbounded proportional movement. `coefficient` is
 *  the standard constant cited for this exact formula (WebKit/UIKit's own
 *  overscroll uses ~0.55); lower = more resistance, higher = looser. */
function rubberBand(offset: number, dimension: number, coefficient: number) {
  const sign = offset < 0 ? -1 : 1
  const distance = Math.abs(offset)
  return sign * ((distance * dimension * coefficient) / (dimension + coefficient * distance))
}

/** How far (px) the Start Over card can ever visually travel under
 *  resistance, no matter how far the raw drag goes — see rubberBand above.
 *  A size-derived cap, not a feel dial (same status as FLY_OFF_DISTANCE):
 *  CARD_WIDTH * 0.4 keeps the card's visible "give" comfortably inside its
 *  own footprint. */
const START_OVER_RUBBER_BAND_DIMENSION = CARD_WIDTH * 0.4
```

```tsx
/* target — src/components/TutorialCard.tsx, handleDrag's start-over branch */
dragX.set(rubberBand(info.offset.x, START_OVER_RUBBER_BAND_DIMENSION, tuning.startOverRubberBandCoefficient))
dragY.set(rubberBand(info.offset.y, START_OVER_RUBBER_BAND_DIMENSION, tuning.startOverRubberBandCoefficient))
```

```tsx
/* target — src/components/TutorialCard.tsx, handleDragEnd's start-over branch */
animateValue(dragX, 0, {
  type: 'spring',
  velocity: rubberBand(info.velocity.x, START_OVER_RUBBER_BAND_DIMENSION, tuning.startOverRubberBandCoefficient),
  bounce: 0,
  duration: tuning.cancelDuration,
})
animateValue(dragY, 0, {
  type: 'spring',
  velocity: rubberBand(info.velocity.y, START_OVER_RUBBER_BAND_DIMENSION, tuning.startOverRubberBandCoefficient),
  bounce: 0,
  duration: tuning.cancelDuration,
})
```

```tsx
/* target — MotionTuning type, new field after gripScale (or after this
   plan's own additions if plan 003 already landed — see Boundaries) */
  /** rubberBand's coefficient for the Start Over card's drag resistance
   *  (see the rubberBand helper's own comment) — lower means more
   *  resistance, higher means looser. 0.55 is the commonly-cited WebKit/
   *  UIKit constant for this exact formula; kept as a starting point. */
  startOverRubberBandCoefficient: number
```

```tsx
/* target — DEFAULT_MOTION_TUNING, new default */
  startOverRubberBandCoefficient: 0.55,
```

## Repo conventions to follow

- `FLY_OFF_DISTANCE` (`src/components/TutorialCard.tsx:591-597`) is this
  file's existing example of a size-derived constant that is explicitly
  *not* part of `MotionTuning` ("this is a geometry constant... not a feel
  choice") — `START_OVER_RUBBER_BAND_DIMENSION` follows that same pattern
  and placement style (a `const` near where it's used, with a doc comment
  explaining why it's not a tuning field).
- Every tunable "feel" number lives in `MotionTuning`/`DEFAULT_MOTION_TUNING`
  — `startOverRubberBandCoefficient` follows that convention exactly (see
  every existing field, e.g. `gripScale`, `src/components/TutorialCard.tsx:634-640`
  and `650`).
- `MotionTuner`'s `rows` array mirrors every tunable field 1:1
  (`src/components/TutorialCard.tsx:1161-1169`) — add a matching row:
  ```tsx
  { key: 'startOverRubberBandCoefficient', label: 'resist coeff', min: 0.15, max: 1, step: 0.05 },
  ```

## Steps

1. Open `src/components/TutorialCard.tsx`. Locate `START_OVER_RESIST_FACTOR`
   (search `const START_OVER_RESIST_FACTOR = 0.35`, currently line 607).
   Replace the entire block — its doc comment and the constant itself —
   with the `rubberBand` function and `START_OVER_RUBBER_BAND_DIMENSION`
   constant shown in Target's first code block.
2. Locate `handleDrag`'s start-over branch (search `dragX.set(info.offset.x
   * START_OVER_RESIST_FACTOR)`, currently lines 898-899). Replace both
   lines with Target's second code block.
3. Locate `handleDragEnd`'s start-over branch (search `velocity:
   info.velocity.x * START_OVER_RESIST_FACTOR`, currently around lines
   1032 and 1038). Replace the two `animateValue(dragX, 0, {...})` /
   `animateValue(dragY, 0, {...})` calls with Target's third code block —
   only the `velocity` line inside each changes; `type`, `bounce`, and
   `duration` stay as they are.
4. Add `startOverRubberBandCoefficient: number` to the `MotionTuning` type
   (see Boundaries for where, depending on whether plan 003 has already
   landed) and `startOverRubberBandCoefficient: 0.55,` to
   `DEFAULT_MOTION_TUNING`, matching Target's fourth and fifth code blocks.
5. Add the `MotionTuner` row shown in Repo conventions, after whatever the
   current last row is.
6. Search the whole file for any remaining reference to
   `START_OVER_RESIST_FACTOR` and confirm there are none left — every call
   site should now go through `rubberBand(...)`.

## Boundaries

- Do NOT change `handleDragEnd`'s "never commits" logic for the Start Over card, `cancelDuration`, or `bounce: 0` — only the `velocity` values feeding those two `animateValue` calls change.
- Do NOT change any *other* card's drag handling (`dragX.set(info.offset.x)` in the non-start-over branch of `handleDrag` stays exactly as-is) — this plan only touches the Start Over card's resistance.
- If plan 003 (folding flip values into `MotionTuning`) has already been executed, add `startOverRubberBandCoefficient` after its `flightFadeFraction` field/default instead of after `gripScale` — same field, just appended after whatever plan 003 already added, so the type and defaults stay in sync with each other.
- Do NOT fold `START_OVER_RUBBER_BAND_DIMENSION` into `MotionTuning` — it's a size-derived constant, not a feel dial (see Target's own comment on it).
- If the code at these line numbers has drifted from what's quoted above, STOP and report the mismatch instead of improvising.

## Verification

- **Mechanical**: `npm run build` (`tsc -b && vite build`) — expect the same pre-existing warnings this file already had, no new errors. `npx oxlint src/components/TutorialCard.tsx` — expect the same 4 pre-existing warnings, no new ones.
- **Feel check**: gesture-driven — per this file's own documented testing limitation (`docs/home-stack-handoff.md`, "Testing notes"), browser automation here cannot trigger Framer Motion's drag gesture. Verify on a real phone or with a real mouse drag:
  - Swipe through all 4 tutorials and reach the Start Over card.
  - Drag it a short distance (~50-80px) — it should still move visibly, similar responsiveness to before.
  - Drag it a *long* distance (as far as your screen allows) — unlike before, it should visibly resist harder the further you pull, and should not keep moving proportionally forever; confirm it feels like it's approaching a soft limit rather than just being slow.
  - Release at various points and confirm it always settles back to center (never commits) regardless of drag distance or speed — same as before this plan.
  - Confirm ordinary tutorial cards (not Start Over) are completely unaffected — their drag should feel identical to before this change.
- **Done when**: `START_OVER_RESIST_FACTOR` no longer exists anywhere in the file, all four Start Over drag/release call sites use `rubberBand(...)`, `startOverRubberBandCoefficient` is a `MotionTuning` field with a matching `DEFAULT_MOTION_TUNING` default and `MotionTuner` row, the build/lint baseline is unchanged, and a real-device drag confirms resistance now visibly rises with distance instead of staying proportional.
