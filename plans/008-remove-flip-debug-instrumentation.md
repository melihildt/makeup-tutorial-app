# 008 — Remove leftover flip-debug console logging from TutorialCard.tsx

- **Status**: DONE
- **Commit**: 677c3d7
- **Severity**: HIGH
- **Category**: Performance
- **Estimated scope**: 1 file, 2 small deletions (~24 lines total)

## Problem

`src/components/TutorialCard.tsx` has two leftover debug blocks from
diagnosing the "CardBack stays in place during fly-off" bug (documented as
already root-caused — see the memory note `cardback-flyoff-abrupt.md` and
`docs/home-stack-handoff.md`'s "Known deferred issues" — the cause was a
*contrast* problem, not a missing-translation bug). Both blocks say "remove
once diagnosed" in their own comments, but were never removed.

**Block 1** — `src/components/TutorialCard.tsx:1392-1410`, inside every
tutorial card's own component body (so it mounts once per card in the
stack, for that card's entire lifetime):

```tsx
  // TEMP DEBUG — remove once the CardBack-stays-in-place bug is diagnosed.
  // Real on-device evidence showed flightOpacity/flightScale animating
  // correctly, but the card visually not traveling anywhere — this checks
  // the one thing not yet directly observed: does the actual translation
  // (dragX/dragY) run at all for a flipped card's fly-off?
  useEffect(() => {
    if (variant.kind !== 'tutorial') return
    const unsubX = dragX.on('change', (v) => {
      console.log('[flip-debug] dragX change', v.toFixed(1), performance.now().toFixed(0))
    })
    const unsubY = dragY.on('change', (v) => {
      console.log('[flip-debug] dragY change', v.toFixed(1), performance.now().toFixed(0))
    })
    return () => {
      unsubX()
      unsubY()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- TEMP DEBUG only, subscribed once for this card instance's lifetime.
  }, [])
```

**Block 2** — `src/components/TutorialCard.tsx:1529-1538`, inside the
`flyOff()` function, which runs on every real swipe commit and every
Start-Over-triggered advance:

```tsx
    // TEMP DEBUG — remove once the CardBack-stays-in-place bug is diagnosed.
    console.log('[flip-debug] flyOff translate targets', {
      isFlipped,
      angle,
      velocity,
      targetX: (Math.cos(angle) * FLY_OFF_DISTANCE).toFixed(1),
      targetY: (Math.sin(angle) * FLY_OFF_DISTANCE).toFixed(1),
      currentDragX: dragX.get().toFixed(1),
      currentDragY: dragY.get().toFixed(1),
    })
```

**Why it matters**: Block 1's `dragX`/`dragY` subscriptions fire on
*every* change to those motion values — not just during a real drag, but
during the idle swipe-hint nudge (`TutorialStackCard`'s own hint-nudge
effect, which repeats roughly every 4 seconds while a card sits untouched)
and during every cancelled-drag settle spring. That means `console.log`
calls (with `.toFixed()` string formatting on every invocation) are firing
continuously, indefinitely, on the exact same frames the drag/spring
system is trying to stay smooth on — a real, standing runtime cost with
zero product value, on the app's single most gesture-sensitive surface.

## Target

Both blocks deleted entirely. No replacement code — the diagnostic
question they were answering has already been answered (per the handoff
doc), so there's nothing to preserve.

```tsx
/* src/components/TutorialCard.tsx — target, around line 1390 */
  const dragX = useMotionValue(0)
  const dragY = useMotionValue(0)
  // "Picked up" feedback — see MotionTuning.gripScale. Also part of the
  // one-continuous-transform composition, same reasoning as totalRotate
  // below: never a second, separately-bound style value.
  const gripScale = useMotionValue(1)
```

```tsx
/* src/components/TutorialCard.tsx — target, around line 1528, inside flyOff() */
    // Fly-off continues in whatever direction was actually given (any
    // angle, not just left/right) — momentum-driven when there is any, so
    // a little bounce, and the release velocity is handed straight to the
    // spring (apple-design's "velocity handoff") so there's no seam
    // between the finger letting go and the card continuing on its own.
    // Not captured into a variable (used to be, for Promise.all below) —
    // see the fade-gates-onAdvance comment further down for why waiting
    // on these specifically was the actual cause of the lingering.
    animateValue(dragX, Math.cos(angle) * FLY_OFF_DISTANCE, {
```

## Repo conventions to follow

- This codebase does not ship any other `console.log` calls in `src/` —
  confirm with `grep -rn "console\.\(log\|debug\)" src/` before and after
  to be sure this is the only cleanup needed and that the count goes to
  zero.
- `useEffect` hooks in this file that become empty/pointless after a
  removal should be deleted wholesale, not left as an empty shell.

## Steps

1. In `src/components/TutorialCard.tsx`, delete the entire `useEffect`
   block at (current) lines 1392-1410 — from the `// TEMP DEBUG` comment
   through the closing `}, [])`, inclusive. Leave the surrounding
   `dragX`/`dragY`/`gripScale` declarations exactly as they are (only the
   effect itself goes).
2. In the same file, inside `flyOff()`, delete the `// TEMP DEBUG` comment
   and the `console.log('[flip-debug] flyOff translate targets', {...})`
   statement at (current) lines 1529-1538 — from the comment through the
   closing `})`, inclusive. Leave the `animateValue(dragX, ...)` call
   immediately after it untouched.
3. Run `grep -n "flip-debug\|TEMP DEBUG" src/components/TutorialCard.tsx`
   — expect zero matches.

## Boundaries

- Do NOT touch any other `useEffect` in this file — only the one block
  named above.
- Do NOT remove or rename `dragX`/`dragY`/`gripScale` themselves — they're
  actively used elsewhere in the drag/fly-off system, only their debug
  subscription goes.
- Do NOT touch `docs/home-stack-handoff.md` or the memory note referenced
  above — this plan is a pure code cleanup, not a documentation update.
- If either block's surrounding code doesn't match what's quoted above
  (drift since commit 677c3d7), STOP and report instead of improvising —
  don't guess at what else might have changed nearby.

## Verification

- **Mechanical**: `npx tsc --noEmit` — expect no errors. `grep -rn
  "console\.\(log\|debug\)" src/` — expect zero matches anywhere in the
  repo (confirms this was the only leftover instrumentation).
- **Feel check**: run the app, open the tutorial card stack, and:
  - Open the browser DevTools console, leave the home screen open and
    idle for ~10 seconds (long enough for at least two swipe-hint nudges
    to fire) — confirm zero `[flip-debug]` log lines appear (there should
    be none at all now, but specifically confirm the idle case, since
    that's the worst offender being fixed).
  - Perform a real swipe/fly-off on a card — confirm it still flies off
    correctly (this removal must not change any visible behavior, only
    remove logging) and the console stays empty.
  - Rapidly cancel a few drags (drag partway, release without committing)
    — confirm the settle-back motion is unchanged and silent.
- **Done when**: the app's drag/fly-off/hint-nudge behavior is
  pixel-for-pixel unchanged, and the console produces zero `[flip-debug]`
  output under any interaction, including idle.
