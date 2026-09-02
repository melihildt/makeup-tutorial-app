# 047 — TutorialCard idle-hint nudge: align spring bounce to the file's 0.15 convention

- **Status**: TODO
- **Commit**: 2d86cf3
- **Severity**: LOW
- **Category**: Cohesion & tokens (AUDIT.md §7)
- **Estimated scope**: 1 file, 2 lines

## Problem

Every tuned spring in `TutorialCard.tsx`'s `DEFAULT_MOTION_TUNING`
(`flyOffBounce`, `flipBounce`, `tapFlipBounce`) is `0.15`, each marked
`// settled on by feel`. The idle swipe-hint nudge — a separate, ad hoc
spring pair not part of `MotionTuning` — breaks that convention with no
"settled on by feel" comment or other justification for the divergence:

```ts
/* src/components/TutorialCard.tsx:2002-2010 — current (relevant lines: 2005, 2007) */
useEffect(() => {
  if (!isFrontCard || variant.kind !== 'tutorial' || hintTrigger === 0) return
  const NUDGE_DISTANCE = 18
  const nudge = animateValue(dragY, -NUDGE_DISTANCE, { type: 'spring', bounce: 0.35, duration: 0.35 })
  nudge.then(() => {
    animateValue(dragY, 0, { type: 'spring', bounce: 0.25, duration: 0.4 })
  })
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on hintTrigger alone: isFrontCard/dragY are stable-enough refs for this component instance, re-running on their identity isn't the intent here.
}, [hintTrigger])
```

`bounce: 0.35` on the up-nudge and `bounce: 0.25` on the return both exceed
the file's own `0.15` ceiling, and AUDIT.md §4 keeps spring bounce in the
0.1-0.3 range generally — `0.35` is outside that band entirely.

## Target

```ts
/* src/components/TutorialCard.tsx:2005-2007 — target */
  const nudge = animateValue(dragY, -NUDGE_DISTANCE, { type: 'spring', bounce: 0.15, duration: 0.35 })
  nudge.then(() => {
    animateValue(dragY, 0, { type: 'spring', bounce: 0.15, duration: 0.4 })
  })
```

Only the two `bounce` values change (`0.35` → `0.15`, `0.25` → `0.15`) — both
`duration` values (`0.35`, `0.4`) and `NUDGE_DISTANCE` are untouched.

## Repo conventions to follow

- `DEFAULT_MOTION_TUNING`'s own `0.15` bounce convention, e.g.
  `src/components/TutorialCard.tsx:1441` (`flyOffBounce: 0.15, // settled on
  by feel`) — the exemplar this fix aligns the nudge to.

## Steps

1. In `src/components/TutorialCard.tsx`, on line 2005, change `bounce: 0.35`
   to `bounce: 0.15`.
2. On line 2007, change `bounce: 0.25` to `bounce: 0.15`.

## Boundaries

- Do NOT change either `duration` value (`0.35` on line 2005, `0.4` on line
  2007) — only `bounce`.
- Do NOT change `NUDGE_DISTANCE`, the `hintTrigger`/`isFrontCard`/
  `variant.kind` guard condition, or the surrounding comment block.
- Do NOT touch `DEFAULT_MOTION_TUNING` itself or any other spring in this
  file.
- If lines 2005/2007 don't match the Problem snippet above (drift since
  commit `2d86cf3`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npx tsc --noEmit` clean. `npm run build` clean.
- **Feel check**: leave a tutorial card stack idle on the home screen for
  ~4+ seconds (the hint re-fires roughly every 4s of continued idleness per
  the effect's own comment) and watch the front card's idle nudge.
  - The nudge should still be clearly visible (a small tug up and a springy
    settle back down) but with noticeably less overshoot/wobble than before
    — a calmer settle, not a flatter one (bounce 0.15 is still a real spring,
    not a linear ease).
  - In DevTools' Animations panel, set playback to 10% while the nudge fires
    and confirm both the up-nudge and the return-to-rest show a gentle single
    overshoot rather than a pronounced bounce-back.
  - Confirm grabbing the card mid-nudge still smoothly interrupts it (this
    behavior is untouched by this plan, just a sanity check nothing else
    regressed).
- **Done when**: both `bounce` values on lines 2005 and 2007 read `0.15`, and
  the idle nudge visibly settles with less overshoot than before.
