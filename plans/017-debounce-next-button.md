# 017 — Ignore rapid repeat taps on Next while the badge/content animation is in flight

- **Status**: DONE
- **Commit**: 677c3d7
- **Severity**: MEDIUM
- **Category**: Interruptibility
- **Screen impact**: Tutorial step
- **Estimated scope**: 1 file (`src/components/StepScreen.tsx`), 1 new ref + 1 new handler + 1 prop change

## Problem

`src/components/StepScreen.tsx`'s badge and title/description blocks are
keyed by `step` and remount fresh on every step change, replaying their
CSS `@keyframes` (`step-fade-in`/`step-content-in`) — a deliberate
"animation, not transition" choice documented in the file's own comments,
since a plain re-render wouldn't restart a CSS `animation`. But nothing
guards the button that triggers a step change against being tapped faster
than that animation's own duration:

```tsx
/* src/components/StepScreen.tsx:694-698 — current */
                  <ActionButton
                    label={isFinalStep ? 'Finish' : 'Next'}
                    variant={isFinalStep ? 'final' : 'default'}
                    onClick={isFinalStep ? handleFinishClick : onNextStep}
                  />
```

```tsx
/* src/components/StepScreen.tsx:443-446 — badge, remounts and replays on every step change */
          <div
            key={`badge-${step}`}
            className={`flex items-center gap-1 ${isDoneScreen ? 'invisible' : ''}`}
            style={{ animation: 'step-fade-in var(--duration-layout) var(--ease-out-quart)' }}
          >
```

```tsx
/* src/components/StepScreen.tsx:511-518 — content (title/description), same pattern */
          <div
            key={`content-${step}`}
            className="flex flex-1 flex-col items-center justify-center gap-2 text-center"
            style={
              hasKnownDirection
                ? ({
                    '--content-slide-from': direction === 'forward' ? '16px' : '-16px',
                    animation: 'step-content-in var(--duration-layout) var(--ease-out-quart)',
                  } as CSSProperties)
                : { animation: 'view-fade-in var(--duration-layout) var(--ease-out-quart)' }
            }
          >
```

**Why it matters**: AUDIT.md's Interruptibility category is explicit that
`@keyframes` restart from zero on interruption, and flags exactly this
shape — "keyframes on rapidly-triggered UI" — as something to hunt for.
`onNextStep` has no debounce or disabled-while-animating guard, so a user
double/triple-tapping "Next" faster than `--duration-layout` (350ms) apart
remounts the badge and title/description blocks on every tap, snapping
their in-flight opacity/translateX back to each keyframe's 0% starting
point and restarting — a visible strobe/flicker on the step text, on the
one screen the user is most likely to rapid-tap through during a real
run-through.

## Target

A ref-based guard (not state — it only needs to gate a callback, never
needs to trigger its own re-render) that blocks a repeat `Next` tap until
the current step's content animation has had time to finish:

```tsx
/* src/components/StepScreen.tsx — target, inserted near the other step-tracking refs/effects (after the existing prevStepRef effect, before the isFinishing state) */

  // Guards against rapid double/triple-tapping Next before the badge/
  // content's own step-content-in keyframe finishes playing — see
  // AUDIT.md's Interruptibility category: a keyframe (not a transition)
  // getting remounted mid-play by a second tap restarts it from zero,
  // reading as a strobe rather than a continuation. Ref, not state: this
  // only needs to gate a callback, never needs to trigger a re-render of
  // its own.
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

  function handleNextClick() {
    if (isAnimatingContentRef.current) return
    onNextStep?.()
  }
```

```tsx
/* src/components/StepScreen.tsx:694-698 — target */
                  <ActionButton
                    label={isFinalStep ? 'Finish' : 'Next'}
                    variant={isFinalStep ? 'final' : 'default'}
                    onClick={isFinalStep ? handleFinishClick : handleNextClick}
                  />
```

## Repo conventions to follow

- `prevStepRef`/`stepRef` (this same file, near the top of the component)
  are the existing exemplars for a plain `useRef` tracking something
  step-related without triggering its own render — match that pattern.
- `handleFinishClick`'s own existing guard (`if (!isFinishing)
  setIsFinishing(true)`) is the file's own precedent for "ignore a repeat
  tap while something is in flight" — this plan applies the same idea to
  the `Next` path specifically, which didn't have an equivalent guard.
- Don't add a `disabled` prop to `ActionButton` itself — that component
  is shared with `AllStepsView`'s own "Finish" button, and this plan's
  fix (ignoring the repeat call, not visually disabling the button) stays
  scoped to `StepScreen.tsx` only, per the original finding's own "ignore
  repeat clicks" phrasing.

## Steps

1. In `src/components/StepScreen.tsx`, locate this exact current block
   (lines 145-157):

   ```tsx
     const prevStepRef = useRef<number | null>(null)
     const hasKnownDirection = prevStepRef.current !== null
     const direction = prevStepRef.current !== null && step < prevStepRef.current ? 'backward' : 'forward'
     useEffect(() => {
       prevStepRef.current = step
     }, [step])

     // Whether the product card is mid-exit after tapping Finish on step 7 —
     // see the card's JSX below for the full reasoning. `false` the rest of
     // the time; TutorialFlow's actual step-8 transition only fires once the
     // exit animation genuinely finishes (AnimatePresence's onExitComplete),
     // not on an assumed/guessed duration.
     const [isFinishing, setIsFinishing] = useState(false)
   ```

   Insert the `isAnimatingContentRef` `useRef` and its companion
   `useEffect` shown in **Target** above between the `useEffect(() => {
   prevStepRef.current = step }, [step])` block and the `isFinishing`
   comment/declaration — i.e., right after line 150's `}, [step])` and
   before line 152's comment.
2. Add the `handleNextClick` function shown in **Target** above,
   immediately after `handleFinishClick`'s own definition (current lines
   159-161).
3. On the `ActionButton` element (current lines 694-698), change
   `onClick={isFinalStep ? handleFinishClick : onNextStep}` to
   `onClick={isFinalStep ? handleFinishClick : handleNextClick}`.
4. Run `npx tsc --noEmit` to confirm no type errors.

## Boundaries

- Do NOT touch `handleFinishClick` or its own existing `isFinishing`
  guard — already correctly debounced, out of scope.
- Do NOT touch the header's `Back` button (`onBack` prop, wired in
  `ScreenHeader.tsx`) — a separate control, not part of this finding
  (which is specifically about the `ActionButton`/`Next` path).
- Do NOT add a `disabled` prop to `ActionButton.tsx` itself — the fix
  stays as a silently-ignored repeat call, not a visually-disabled
  button, per this plan's own scope above.
- If the current code at either target location doesn't match what's
  quoted above (drift since commit 677c3d7), STOP and report instead of
  guessing at a different insertion point.

## Verification

- **Mechanical**: `npx tsc --noEmit` — expect no errors.
- **Feel check**: run the app, open a tutorial, and:
  - Tap "Next" once, normally — confirm the step advances exactly as
    before (badge fades in, content slides in, no change to the normal
    single-tap case).
  - Rapidly tap "Next" 3-4 times as fast as possible — confirm the step
    only actually advances once per ~350ms window (i.e., the extra taps
    within that window are silently ignored), and confirm the badge/
    title/description no longer visibly strobe or flicker the way they
    did before this fix.
  - Wait for the animation to finish, then tap "Next" again — confirm it
    advances normally (the guard must not get stuck permanently blocking
    input).
  - Navigate to step 7 and rapid-tap "Finish" — confirm this path is
    unaffected (still uses its own separate `isFinishing` guard, untouched
    by this plan).
- **Done when**: rapid repeat taps on "Next" no longer restart the badge/
  content keyframes mid-play, while a single normal tap still advances
  the step immediately with no added latency.
