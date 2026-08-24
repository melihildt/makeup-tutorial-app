# 014 — Clear justToggledKey synchronously on view switch, not just after a timeout

- **Status**: TODO
- **Commit**: 677c3d7
- **Severity**: MEDIUM
- **Category**: Interruptibility / Purpose & frequency
- **Screen impact**: Tutorial step, All steps view (the bug fires exactly when switching between them)
- **Estimated scope**: 1 file (`src/TutorialFlow.tsx`), 2 small edits

## Problem

`src/TutorialFlow.tsx` tracks which product key was *just* toggled by a
real click (`justToggledKey`), so `CheckIndicator`'s mount-triggered
draw-in/pop animation only plays on the one row the user actually touched
— not on every row when `StepScreen`/`AllStepsView` remount (they're two
entirely separate trees, so switching views remounts every `ProductCard`
wholesale):

```tsx
/* src/TutorialFlow.tsx:52-64 — current */
  const [justToggledKey, setJustToggledKey] = useState<string | null>(null)

  useEffect(() => {
    if (justToggledKey === null) return
    // 260ms: covers --duration-base's 200ms (tokens.css) plus a small
    // buffer, so the timeout can't race ahead of the animation and clear
    // the flag mid-play — that would mean nothing since the animation's
    // own end-state and the resting look are identical (see
    // CheckIndicator.tsx), but it also wouldn't show as motion at all,
    // which defeats the point.
    const id = setTimeout(() => setJustToggledKey(null), 260)
    return () => clearTimeout(id)
  }, [justToggledKey])
```

The clear is purely time-based (260ms after the toggle). It only guards
against a *later, unrelated* remount — not an *immediate* one caused by
switching views right after the click. Both view-switch points currently
leave `justToggledKey` untouched:

```tsx
/* src/TutorialFlow.tsx:92-98 — list → step, current */
  function handleSelectStepView() {
    if (lastToggledStep !== null) {
      setStep(lastToggledStep)
      setLastToggledStep(null)
    }
    setView('step')
  }
```

```tsx
/* src/TutorialFlow.tsx:145 — step → list, current */
      onSelectListView={() => setView('list')}
```

Both `StepScreen.tsx:689` and `AllStepsView.tsx:225` read the exact same
key format (`` `${step}-${product.brand}-${product.name}` ``) and pass
`animate={key === justToggledKey}` to their own `ProductCard`, so the
same key genuinely can match across both views for the same product+step.

**Why it matters**: toggle a product in `StepScreen`, then tap the header's
"All Steps" icon within 260ms — the matching row in the freshly-mounted
`AllStepsView` list replays `check-pop`/`check-draw`/`check-ring-in` even
though the user never touched that row in *this* view, signaling a state
change that didn't actually happen there. Same bug in reverse: toggle in
the All Steps list, then tap back to step view fast enough, and the
matching `StepScreen` row replays too.

## Target

```tsx
/* src/TutorialFlow.tsx:92-98 — target */
  function handleSelectStepView() {
    if (lastToggledStep !== null) {
      setStep(lastToggledStep)
      setLastToggledStep(null)
    }
    // Clear synchronously, not just after the 260ms timeout above — a
    // view switch is itself a full remount of every ProductCard (see
    // justToggledKey's own comment), so without this, switching views
    // within that 260ms window replays the animation on a row in the
    // *new* view that the user never actually touched there.
    setJustToggledKey(null)
    setView('step')
  }
```

```tsx
/* src/TutorialFlow.tsx:145 — target */
      onSelectListView={() => {
        // See handleSelectStepView's own comment (same reasoning,
        // opposite direction).
        setJustToggledKey(null)
        setView('list')
      }}
```

## Repo conventions to follow

- `handleSelectStepView` is already a named function handling exactly this
  kind of "switching view" bookkeeping (it already clears
  `lastToggledStep`) — add the new clear alongside the existing one,
  same function, same style.
- The `onSelectListView` prop is currently a bare inline arrow
  (`() => setView('list')`); this plan expands it to a multi-statement
  arrow with a block body, matching how other multi-step inline handlers
  already look elsewhere in this codebase (e.g. `TutorialCard.tsx`'s
  various `onClick={(e) => { e.stopPropagation(); ... }}` handlers).

## Steps

1. In `src/TutorialFlow.tsx`, inside `handleSelectStepView` (current lines
   92-98), add `setJustToggledKey(null)` as a new statement — placed
   after the `if (lastToggledStep !== null) { ... }` block and before
   `setView('step')`, as shown in **Target** above.
2. In the same file, on the `StepScreen`'s `onSelectListView` prop
   (current line 145), change the inline arrow from `() =>
   setView('list')` to the two-statement block form shown in **Target**
   above.
3. Run `npx tsc --noEmit` to confirm no type errors.

## Boundaries

- Do NOT touch `lastToggledStep`'s own clearing logic — only add the new
  `setJustToggledKey(null)` call alongside it.
- Do NOT change the 260ms `setTimeout` in the `useEffect` (lines 54-64) —
  it still correctly handles the *other* case (an unrelated remount well
  after the click, with no view switch involved). This plan adds a
  second, synchronous clearing path; it doesn't replace the existing one.
- Do NOT touch `AllStepsView.tsx` or `StepScreen.tsx` — both already read
  `justToggledKey` correctly; the fix is entirely in when the flag gets
  cleared, in `TutorialFlow.tsx`.
- If the current code at either target location doesn't match what's
  quoted above (drift since commit 677c3d7), STOP and report instead of
  improvising a different insertion point.

## Verification

- **Mechanical**: `npx tsc --noEmit` — expect no errors.
- **Feel check**: run the app, open a tutorial, and:
  - On a step with at least one unchecked product, tap to check it, then
    *immediately* (well within 260ms — as fast as you can) tap the
    header's list-view icon. Confirm the matching row in the All Steps
    view appears already in its checked resting state, with **no**
    draw-in/pop/ring animation replaying on it.
  - Reverse the test: in the All Steps list, toggle a product, then
    immediately switch back to step view (if that step is currently
    shown). Confirm the same — no spurious replay.
  - As a regression check, toggle a product and *wait* more than 260ms
    before switching views — confirm the row still shows correctly (this
    path was never broken, just confirming the new synchronous clear
    doesn't interfere with the existing timeout-based one).
  - Toggle a product and stay in the *same* view without switching —
    confirm the animation still plays normally on the row you actually
    touched (this plan must not suppress the legitimate case).
- **Done when**: switching views immediately after a toggle never replays
  the check animation on any row other than the one actually clicked, in
  either direction.
