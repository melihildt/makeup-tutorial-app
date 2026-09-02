# 050 — Give Back the same rapid-tap guard Next already has

- **Status**: TODO
- **Commit**: 3ecf622
- **Severity**: HIGH
- **Category**: Interruptibility (AUDIT.md §4)
- **Estimated scope**: 1 file, ~10 lines

## Problem

`StepScreen.tsx` already guards Next against rapid double/triple-tapping:
`handleNextClick` checks `isAnimatingContentRef` before calling `onNextStep`,
specifically because the badge/title/description swap plays as a CSS
`animation` (`step-fade-in`/`step-content-in`, not a `transition`) — and a
keyframe animation that gets remounted mid-play by a second `step` change
restarts from zero, reading as a strobe rather than a continuation (see the
guard's own comment). Back changes `step` through the exact same content
remount (it's the same `step` prop driving the same keyed elements), but
`onBack` is wired straight through with no guard at all:

```tsx
/* src/components/StepScreen.tsx:200-226 — current */
const isAnimatingContentRef = useRef(false)
useEffect(() => {
  isAnimatingContentRef.current = true
  // 350ms matches --duration-layout, the exact duration step-fade-in/
  // step-content-in themselves already run at (see their own
  // `animation` values below).
  const id = setTimeout(() => {
    isAnimatingContentRef.current = false
  }, 350)
  return () => clearTimeout(id)
}, [step])

// ...

function handleNextClick() {
  if (isAnimatingContentRef.current) return
  onNextStep?.()
}
```

```tsx
/* src/components/StepScreen.tsx:334-339 — current */
<ScreenHeader
  activeView="step"
  onBack={onBack}
  onDone={onDone}
  onSelectListView={onSelectListView}
/>
```

`onBack` (from `TutorialFlow.tsx:215-225`'s `handleBack`) fires
unconditionally on every tap: `setStep((current) => Math.max(1, current -
1))`, or `onExit?.()` at step 1. Every tap changes `step` (or exits) with
zero debounce, so rapid-tapping Back can retrigger the content keyframes
before they finish, producing the same strobe Next's own guard exists to
prevent — on the other half of the same nav pair, at the same ~7x-per-
tutorial frequency.

## Target

```tsx
/* src/components/StepScreen.tsx — target, added next to handleNextClick */
function handleNextClick() {
  if (isAnimatingContentRef.current) return
  onNextStep?.()
}

function handleBackClick() {
  if (isAnimatingContentRef.current) return
  onBack?.()
}
```

```tsx
/* src/components/StepScreen.tsx:334-339 — target */
<ScreenHeader
  activeView="step"
  onBack={handleBackClick}
  onDone={onDone}
  onSelectListView={onSelectListView}
/>
```

No changes to `TutorialFlow.tsx` — `handleBack`'s own step-1-exits,
otherwise-decrements logic is untouched; this only gates *how often* it can
be called from the step-view header, exactly mirroring how `handleNextClick`
gates `onNextStep` without changing `handleNextStep` itself.

## Repo conventions to follow

- Exact pattern to mirror: `handleNextClick` (`src/components/StepScreen.tsx:223-226`)
  — a thin wrapper that checks `isAnimatingContentRef.current` and returns
  early, otherwise calls through to the prop. `handleBackClick` follows the
  same shape, reusing the same ref (no new state, no new timer — the
  existing `useEffect` on `[step]` already re-arms on every step change,
  regardless of whether that change came from Next or Back).
- `ScreenHeader`'s `onBack` prop is already just `() => void`
  (`src/components/ScreenHeader.tsx:7`) — no signature change needed there.

## Steps

1. In `src/components/StepScreen.tsx`, immediately after `handleNextClick`
   (lines 223-226), add `handleBackClick` exactly as shown in Target above.
2. On line 336, change `onBack={onBack}` to `onBack={handleBackClick}`.

## Boundaries

- Do NOT touch `TutorialFlow.tsx`'s `handleBack` — its step-1-exits logic is
  correct and out of scope.
- Do NOT touch `handleNextClick`, `isAnimatingContentRef`, or the `useEffect`
  that arms/disarms it (lines 200-210) — only add the new sibling function
  and rewire one prop.
- Do NOT add a guard to `onDone` or `onSelectListView` — those navigate away
  from the step-content area entirely (Done exits the flow, Widget switches
  to a different view/tree), neither retriggers the badge/title/description
  keyframes the way Back and Next both do.
- If the cited lines don't match the Problem snippets above (drift since
  commit `3ecf622`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npx tsc --noEmit` clean. `npm run build` clean.
- **Feel check**: open a tutorial, advance to around step 4, then tap the
  Back arrow as fast as possible several times in a row.
  - The title/description should slide in cleanly on each accepted tap, with
    no flash/strobe from a restarted keyframe — compare directly against
    doing the same rapid-tap test on Next (already guarded), the two should
    now feel identical in how they absorb spam taps.
  - Confirm Back still works correctly at normal, un-rushed tap speed: each
    single tap moves back exactly one step.
  - Confirm tapping Back at step 1 still exits the tutorial flow back to
    Home (this codepath is unchanged, just now also gated by the gap-taps
    guard like every other Back tap).
  - In DevTools' Animations panel, set playback to 10%, spam Back, and
    confirm only one `step-content-in`/`step-fade-in` animation plays per
    accepted tap, never a restarted one.
  - Toggle `prefers-reduced-motion` and confirm Back still functions
    correctly (the guard only affects animation timing, not step logic).
- **Done when**: `handleBackClick` exists and gates `onBack` the same way
  `handleNextClick` gates `onNextStep`, and rapid-tapping Back no longer
  visibly restarts the step-content animation mid-play.
