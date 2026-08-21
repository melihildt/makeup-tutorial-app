# 003 — Fold the restart flip's feel values into MotionTuning

- **Status**: TODO
- **Commit**: 628b8b7
- **Severity**: MEDIUM
- **Category**: Cohesion & tokens
- **Estimated scope**: 1 file, ~6 small edits (type, defaults, 2 call sites, MotionTuner rows)

## Problem

`src/components/TutorialCard.tsx` — every feel-tuned physics number in this
file lives in one place, `MotionTuning`/`DEFAULT_MOTION_TUNING`, specifically
so it can be tuned from the (currently hidden, not removed) `MotionTuner`
panel instead of being hunted down through the file:

```tsx
// src/components/TutorialCard.tsx:609-611 — current, unchanged by this plan
/** Every value below was a hardcoded guess before — now a single object so
 *  they can come from the (temporary) MotionTuner sliders instead. See
 *  MotionTuner's own comment for the "temporary" half of that story. */
```

Two values introduced by the restart-flip feature don't follow that
convention — they're hardcoded directly at their call sites instead of
living in `MotionTuning`:

```tsx
// src/components/TutorialCard.tsx:1012 — current (inside the flipTrigger useEffect)
const flip = animateValue(flipRotateY, 180, { type: 'spring', bounce: 0.15, duration: 0.7 })
```

```tsx
// src/components/TutorialCard.tsx:941 — current (inside flyOff())
const FLIGHT_FADE_DURATION = tuning.flyOffDuration * 0.45
```

`0.15`/`0.7` (the flip's bounce/duration) and `0.45` (what fraction of
`flyOffDuration` the disappear-faster fade takes) are exactly the kind of
number `MotionTuning` exists to hold — they're feel choices, not geometry
(contrast with `FLY_OFF_DISTANCE`, which the file explicitly documents as
"Not part of MotionTuning: this is a geometry constant... not a feel
choice," `src/components/TutorialCard.tsx:591-594` — these two are the
opposite case). Leaving them as literals means they're unreachable from the
tuning panel even once it's un-hidden, and a future reader has no reason to
expect two of the file's ~9 feel-tuned numbers to live somewhere different
from the other 7.

Note: `START_OVER_RESIST_FACTOR` (`src/components/TutorialCard.tsx:607`) is
the same kind of value but is **deliberately excluded from this plan** — see
Boundaries below.

## Target

Add two new fields to `MotionTuning`, give them defaults matching the
current hardcoded values exactly (this plan relocates values, it does not
change behavior), and update the two call sites to read from `tuning`
instead of literals:

```tsx
/* target — src/components/TutorialCard.tsx, inside the MotionTuning type,
   after the existing gripScale field */
  /** Restart flip's spring duration (seconds) — see the flipTrigger-
   *  watching useEffect in TutorialStackCard. Same "settled on by feel"
   *  status as flyOffDuration. */
  flipDuration: number
  /** Restart flip's spring bounce (0 = no overshoot) — same considerations
   *  as flyOffBounce. */
  flipBounce: number
  /** Fraction of flyOffDuration the disappear-faster fade/shrink/z-dive
   *  actually takes (see flyOff's FLIGHT_FADE_DURATION) — smaller means the
   *  card visually vanishes sooner relative to how long the physical
   *  fly-off itself runs. */
  flightFadeFraction: number
```

```tsx
/* target — DEFAULT_MOTION_TUNING, after the existing gripScale line */
  flipDuration: 0.7, // settled on by feel
  flipBounce: 0.15, // settled on by feel
  flightFadeFraction: 0.45, // settled on by feel
```

```tsx
/* target — src/components/TutorialCard.tsx:1012, inside the flipTrigger useEffect */
const flip = animateValue(flipRotateY, 180, { type: 'spring', bounce: tuning.flipBounce, duration: tuning.flipDuration })
```

```tsx
/* target — src/components/TutorialCard.tsx:941, inside flyOff() */
const FLIGHT_FADE_DURATION = tuning.flyOffDuration * tuning.flightFadeFraction
```

## Repo conventions to follow

- Every existing `MotionTuning` field has a matching row in `MotionTuner`'s
  `rows` array (`src/components/TutorialCard.tsx:1161-1169`) — 7 fields, 7
  rows, 1:1. Add two more rows for `flipDuration`/`flipBounce` (not
  `flightFadeFraction` — see Steps) following the exact same shape,
  min/max/step chosen to mirror the closest sibling field:
  ```tsx
  /* target — new rows in MotionTuner's `rows` array, after the gripScale row */
    { key: 'flipDuration', label: 'flip dur', min: 0.2, max: 1.5, step: 0.05 },
    { key: 'flipBounce', label: 'flip bounce', min: 0, max: 0.6, step: 0.05 },
  ```
  (`flyOffDuration`'s row uses the identical `min: 0.2, max: 1.5, step:
  0.05`, `src/components/TutorialCard.tsx:1164`; `flyOffBounce`'s row uses
  the identical `min: 0, max: 0.6, step: 0.05`, line 1165 — these two new
  rows copy those ranges exactly since they're the same kind of value.)
- `DEFAULT_MOTION_TUNING`'s existing fields use a trailing `// settled on by
  feel` comment for values that came from feel-testing rather than a
  calculation (`src/components/TutorialCard.tsx:645-650`) — match that on
  the two new default values, as shown in Target above.
- Field doc comments in the `MotionTuning` type follow a `/** ... */` block
  above each field (see every existing field) — match that format exactly,
  not a trailing `//` comment.

## Steps

1. Open `src/components/TutorialCard.tsx`. Locate the `MotionTuning` type
   (search `export type MotionTuning = {`, currently line 612). After the
   `gripScale: number` field (currently line 640, immediately before the
   type's closing `}`), add the three new fields exactly as shown in
   Target's first code block.
2. Locate `DEFAULT_MOTION_TUNING` (search `export const DEFAULT_MOTION_TUNING:
   MotionTuning = {`, currently line 643). After the `gripScale: 0.96, //
   settled on by feel (unchanged from the first guess)` line (currently
   line 650), add the three new default lines exactly as shown in Target's
   second code block.
3. Locate the `flipTrigger`-watching `useEffect` inside `TutorialStackCard`
   (search `const flip = animateValue(flipRotateY, 180`, currently line
   1012). Replace that line with the version in Target's third code block —
   only `bounce`/`duration`'s values change (from literals to `tuning.*`
   reads); everything else on the line stays the same.
4. Locate `flyOff()`'s `FLIGHT_FADE_DURATION` line (search `const
   FLIGHT_FADE_DURATION = tuning.flyOffDuration * 0.45`, currently line
   941). Replace `0.45` with `tuning.flightFadeFraction` as shown in
   Target's fourth code block.
5. Locate `MotionTuner`'s `rows` array (search `const rows: Array<{ key:
   keyof MotionTuning`, currently line 1161). After the `gripScale` row
   (currently line 1168, the last row before the closing `]`), add the two
   new rows shown in the Repo conventions section above. Do **not** add a
   row for `flightFadeFraction` — see the note in Steps item 6.
6. Do not add a `MotionTuner` row for `flightFadeFraction`. Every existing
   row controls an absolute, independently-meaningful value; `flightFadeFraction`
   is a multiplier of `flyOffDuration` specifically, and exposing it as a
   separate 0–1 slider risks producing confusing combinations (e.g. a fade
   fraction longer than the fly-off itself) without the same guardrails the
   type's own doc comment provides. The field still belongs in
   `MotionTuning` (so it's not a stray literal), it just doesn't need a
   live slider the way the seven original fields do.

## Boundaries

- Do NOT add `START_OVER_RESIST_FACTOR` (or a `startOverResistFactor` field) to `MotionTuning` in this plan. Plan 004 (Physicality — Start Over's rubber-band) replaces the entire linear-damping mechanism that constant belongs to with a different formula, and folds *its own* new tunable values into `MotionTuning` as part of that change. Folding the soon-to-be-obsolete `START_OVER_RESIST_FACTOR` here would be wasted work that plan 004 immediately supersedes.
- Do NOT change the numeric values themselves (`0.7`, `0.15`, `0.45`) — this plan relocates where they live, it does not retune them.
- Do NOT touch `flyOffDuration`, `flyOffBounce`, `cancelDuration`, `rotationRange`, `gripScale`, `commitDistance`, or `commitVelocity` — only the three new fields are in scope.
- Do NOT uncomment or otherwise re-enable the `<MotionTuner>` panel itself — it stays hidden per the existing "Hidden for now" comment; this plan only makes the underlying values reachable from it once someone else re-enables it.
- If the code at these line numbers has drifted from what's quoted above, STOP and report the mismatch instead of improvising.

## Verification

- **Mechanical**: `npm run build` (`tsc -b && vite build`) — expect the same pre-existing warnings this file already had, no new errors (in particular, no "missing property" error on `DEFAULT_MOTION_TUNING` — if one appears, a required field was added to the type but not given a default, or vice versa). `npx oxlint src/components/TutorialCard.tsx` — expect the same 4 pre-existing warnings, no new ones.
- **Feel check**: this plan is a pure relocation — no animation should look or feel any different before and after.
  - Swipe a tutorial card away and confirm the fly-off/disappear timing feels identical to before this change.
  - Swipe through all 4 tutorials and tap Start Over; confirm the restart flip's speed/bounce feels identical to before this change.
  - (Optional, only if verifying the tuning panel itself) Temporarily uncomment `<MotionTuner tuning={tuning} onChange={setTuning} />` in `TutorialStack` (search "Hidden for now"), confirm the two new "flip dur" / "flip bounce" sliders appear and actually change the restart flip's feel when dragged, then re-comment the line before finishing — do not leave the panel enabled.
- **Done when**: `flipDuration`, `flipBounce`, and `flightFadeFraction` are `MotionTuning` fields with matching `DEFAULT_MOTION_TUNING` defaults; the flip's `animateValue` call and `FLIGHT_FADE_DURATION` read from `tuning` instead of literals; `MotionTuner` has matching rows for the two slider-appropriate fields; the build/lint baseline is unchanged; and the feel-check confirms no behavior actually changed.
