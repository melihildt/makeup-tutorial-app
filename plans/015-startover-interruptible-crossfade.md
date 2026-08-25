# 015 — Replace StartOverCard's keyframe-restart filter swap with an interruptible crossfade

- **Status**: TODO
- **Commit**: 677c3d7
- **Severity**: MEDIUM
- **Category**: Interruptibility
- **Screen impact**: Home (the tutorial card stack's terminal "Start Over" slot)
- **Estimated scope**: 1 file (`src/components/TutorialCard.tsx`), 1 component rewritten (~25 lines net)

## Problem

`StartOverCard`'s filter-color image swap uses `key={lookType}` on a plain
`<img>`, forcing a full remount — and therefore a from-scratch keyframe
replay — on every filter tap:

```tsx
/* src/components/TutorialCard.tsx:875-887 — current, full block */
      {/* key={lookType} + check-ring-in — see CardBehind's own comment for
          why a bare src swap needs an animation, not a transition, and
          GHOST_TEXTURES for which asset goes with which filter. This front
          face recolors with the selected filter same as CardBehind (per
          the user's own call — StartOverCard isn't exempt just because
          it's not literally "a look"). */}
      <img
        key={lookType}
        alt=""
        src={GHOST_TEXTURES[lookType]}
        className="absolute inset-0 size-full object-cover"
        style={{ animation: 'check-ring-in var(--duration-base) var(--ease-out-quart)' }}
      />
```

AUDIT.md's Interruptibility category is explicit: "CSS transitions
retarget from the current state mid-animation; keyframes restart from
zero. Anything triggered rapidly... must use transitions or springs." This
same class of bug already existed on `CardBehind` (the peeking card's own
ghost texture) and was fixed there with a JS-driven, interruptible
crossfade — the fix below applies that exact established pattern to
`StartOverCard`, which was left on the older keyframe approach:

```tsx
/* src/components/TutorialCard.tsx:737-820 — CardBehind, the pattern to reuse (already correct, do not modify) */
export function CardBehind({
  opacity,
  lookType,
  parentRotate,
  className,
}: {
  opacity?: MotionValue<number>
  lookType: LookType
  parentRotate: MotionValue<number>
  className?: string
}) {
  const behindRotate = useMotionValue(0)
  const imgOpacity = useMotionValue(1)
  const [displayedLookType, setDisplayedLookType] = useState(lookType)
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    let cancelled = false
    const duck = animateValue(behindRotate, -parentRotate.get(), {
      duration: 0.2,
      ease: EASE_OUT_QUART,
    })
    animateValue(imgOpacity, 0, { duration: 0.2, ease: EASE_OUT_QUART })
    duck.then(() => {
      if (cancelled) return
      setDisplayedLookType(lookType)
      animateValue(behindRotate, 0, { duration: 0.2, ease: EASE_OUT_QUART })
      animateValue(imgOpacity, 1, { duration: 0.2, ease: EASE_OUT_QUART })
    })
    return () => {
      cancelled = true
    }
  }, [lookType])
  return (
    <motion.div ...>
      <motion.img alt="" src={GHOST_TEXTURES[displayedLookType]} className="size-full object-cover" style={{ opacity: imgOpacity }} />
    </motion.div>
  )
}
```

**Why it matters**: the Start Over card is reachable and visible any time
the deck is on its terminal slot, and its own filter chips (Day/Night/
Glam) sit right above it on `HomeScreen`, tappable as fast as the user's
thumb allows. Tapping Day→Night→Glam quickly restarts the ring-pop from
scratch on every tap instead of resolving smoothly to the last-tapped
color — a visible stutter on a control the user can trigger arbitrarily
fast, unlike `CardBehind`'s peeking card (already fixed) right next to it
in the same file.

## Target

`StartOverCard` gets its own `imgOpacity` motion value and
`displayedLookType` state, mirroring `CardBehind`'s pattern but without
the duck/rotate part (`StartOverCard` has no "duck behind the front card"
spatial gesture — it's a plain crossfade):

```tsx
/* src/components/TutorialCard.tsx:841-851 — signature, unchanged */
function StartOverCard({
  onSelect,
  disabled,
  detailsOpacity,
  lookType,
}: {
  onSelect?: () => void
  disabled?: boolean
  detailsOpacity?: MotionValue<number>
  lookType: LookType
}) {
  // Interruptible crossfade, replacing the old key={lookType} +
  // check-ring-in keyframe swap below — same pattern as CardBehind's own
  // imgOpacity dance (this file, above), minus the duck/rotate part
  // (StartOverCard has no spatial "behind the front card" gesture, it's a
  // plain crossfade). A JS-driven animateValue retargets smoothly from
  // wherever it currently is if lookType changes again mid-fade, unlike a
  // CSS keyframe forced to restart from 0 by the remount below.
  const imgOpacity = useMotionValue(1)
  const [displayedLookType, setDisplayedLookType] = useState(lookType)
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    // Guards against a newer effect run's callback superseding this one
    // — same reasoning as CardBehind's own `cancelled` flag (this file,
    // above): without it, rapid filter switching could let a stale run's
    // callback fire after a newer one already landed the correct color.
    let cancelled = false
    animateValue(imgOpacity, 0, { duration: 0.2, ease: EASE_OUT_QUART }).then(() => {
      if (cancelled) return
      setDisplayedLookType(lookType)
      animateValue(imgOpacity, 1, { duration: 0.2, ease: EASE_OUT_QUART })
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on lookType alone, same as CardBehind's own equivalent effect.
  }, [lookType])
  return (
```

```tsx
/* src/components/TutorialCard.tsx:875-887 — target */
      {/* Interruptible crossfade — see this component's own imgOpacity/
          displayedLookType state above for why this isn't a bare
          key={lookType} remount any more (that restarted a CSS keyframe
          from zero on every rapid filter tap; see AUDIT.md's
          Interruptibility category). */}
      <motion.img
        alt=""
        src={GHOST_TEXTURES[displayedLookType]}
        className="absolute inset-0 size-full object-cover"
        style={{ opacity: imgOpacity }}
      />
```

## Repo conventions to follow

- `CardBehind` (this same file, lines 737-820) is the exact exemplar —
  reuse its `imgOpacity`/`displayedLookType`/`isFirstRender`/`cancelled`
  shape verbatim, just without `behindRotate`/`parentRotate`/the duck
  step, since `StartOverCard` has no equivalent spatial gesture.
- `EASE_OUT_QUART` and `animateValue` are already imported/used elsewhere
  in this file (including inside `CardBehind` itself) — no new imports
  needed.
- Keep the 0.2s-per-leg duration, matching `CardBehind`'s own values
  exactly (reusing an established number rather than inventing a third).

## Steps

1. In `src/components/TutorialCard.tsx`, inside `StartOverCard` (current
   lines 841-851), immediately after the function's opening `{`, add the
   `imgOpacity`/`displayedLookType`/`isFirstRender`/`useEffect` block
   shown in **Target** above — before the `return (` that starts the
   JSX.
2. Replace the `<img key={lookType} ... />` element (current lines
   875-887) with the `<motion.img>` version shown in **Target** above —
   same `className`, `alt`, and `src` (now reading `displayedLookType`
   instead of `lookType` directly), `style` now sets `opacity: imgOpacity`
   instead of the old `animation` string.
3. Run `npx tsc --noEmit` to confirm no type errors.

## Boundaries

- Do NOT modify `CardBehind` itself — it's the exemplar being copied
  from, already correct, out of scope.
- Do NOT add a duck/rotate gesture to `StartOverCard` — this plan is
  scoped to fixing the interruptibility bug via a plain crossfade, not
  extending the duck-and-reveal treatment here (per this file's own
  existing comment: "Scope: only this component gets the treatment...
  StartOverCard keeps its own separate, plain fade+pop swap... per the
  user's own explicit call not to extend this there too" — a crossfade is
  still "plain," it doesn't duck/rotate, so this stays consistent with
  that call).
- Do NOT change the `RotateRightIcon`/"Start Over" label section
  (`detailsOpacity`-driven `motion.div`, below the image) — untouched,
  out of scope.
- If the current code at either target location doesn't match what's
  quoted above (drift since commit 677c3d7), STOP and report instead of
  improvising.

## Verification

- **Mechanical**: `npx tsc --noEmit` — expect no errors.
- **Feel check**: swipe through the tutorial stack to reach the Start
  Over slot, then:
  - Tap a single Day/Night/Glam filter chip and confirm the ghost image
    still crossfades to the new color (should look the same as before —
    fade out, swap, fade in).
  - Tap Day → Night → Glam as fast as possible in succession — confirm
    the image smoothly settles on Glam's texture with no visible flash,
    stutter, or reversion to an intermediate color (this is the actual
    regression test; before this fix, rapid taps would restart the pop
    from scratch each time).
  - In DevTools Animations panel, set playback to 10% and trigger one
    filter change in slow motion — confirm a smooth opacity crossfade,
    no scale/ring pop (the visual character changes slightly from the old
    check-ring-in's scale+opacity pop to a pure opacity crossfade — this
    is expected and intentional, not a regression).
- **Done when**: rapid filter switching on the Start Over card always
  resolves cleanly to the last-tapped color, with no keyframe-restart
  stutter.
