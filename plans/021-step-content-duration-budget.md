# 021 — Give StepScreen's per-step badge/content swap its own faster duration, inside AUDIT's UI budget

- **Status**: DONE
- **Commit**: 677c3d7
- **Severity**: LOW
- **Category**: Easing & duration
- **Screen impact**: Tutorial step
- **Estimated scope**: 2 files (`src/styles/tokens.css`, `src/components/StepScreen.tsx`), 1 new token + 2 line edits

## Problem

`StepScreen.tsx`'s badge and title/description entrance animations both
run at `--duration-layout` (350ms):

```tsx
/* src/components/StepScreen.tsx:446 — badge, current */
            style={{ animation: 'step-fade-in var(--duration-layout) var(--ease-out-quart)' }}
```

```tsx
/* src/components/StepScreen.tsx:511-520 — content (title/description), current */
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

```css
/* src/styles/tokens.css:79 — the token both reference */
  --duration-layout: 350ms;  /* larger layout/content changes */
```

AUDIT.md's Easing & duration category keeps UI animations under 300ms as
a hard budget. `--duration-layout` is a *shared* token also used for
`AllStepsView`'s own mount fade and (via the same value, inlined) `App.tsx`'s
Home↔Tutorial screen slide — both of which are rare, larger transitions
that legitimately earn the slower pace. `StepScreen`'s own badge/content
swap is a different case: it fires on **every** Next/Back, ~7 times per
tutorial completion — a fast, frequent content swap, not a modal- or
screen-scale change, and AUDIT's own budget table treats those
differently ("Dropdowns, selects: 150–250ms" vs. "Modals, drawers:
200–500ms" — this is closer to the former in frequency even though it's
visually more like the latter in scale).

**Why it matters**: changing the *shared* `--duration-layout` token's
value would also speed up `AllStepsView`'s mount fade and (conceptually)
`App.tsx`'s screen slide — both of which are fine at the current pace, and
the screen slide in particular is explicitly framed elsewhere as "rare,
can be more expressive." The fix needs its own, narrower token so the
frequent case gets faster without dragging the rare ones down with it.

## Target

A new token, scoped specifically to this per-step content swap:

```css
/* src/styles/tokens.css — target, added immediately after --duration-shimmer (current line 80) */
  --duration-step-content: 280ms; /* StepScreen's badge/title/description swap on every Next/Back — faster than --duration-layout (350ms, for rarer/larger changes like screen transitions and view mounts) since this fires ~7x per tutorial completion and AUDIT.md keeps interactive UI animations under 300ms. */
```

```tsx
/* src/components/StepScreen.tsx:446 — target */
            style={{ animation: 'step-fade-in var(--duration-step-content) var(--ease-out-quart)' }}
```

```tsx
/* src/components/StepScreen.tsx:511-520 — target (only the step-content-in branch changes; the view-fade-in fallback stays on --duration-layout — see Boundaries) */
          <div
            key={`content-${step}`}
            className="flex flex-1 flex-col items-center justify-center gap-2 text-center"
            style={
              hasKnownDirection
                ? ({
                    '--content-slide-from': direction === 'forward' ? '16px' : '-16px',
                    animation: 'step-content-in var(--duration-step-content) var(--ease-out-quart)',
                  } as CSSProperties)
                : { animation: 'view-fade-in var(--duration-layout) var(--ease-out-quart)' }
            }
          >
```

## Repo conventions to follow

- `tokens.css`'s existing duration tokens (`--duration-instant`,
  `--duration-base`, `--duration-layout`, `--duration-shimmer`) each carry
  a short trailing comment naming what they're for — match that exact
  style for the new token.
- `--duration-shimmer` is this codebase's own precedent for adding a
  token scoped to a single component's specific need (it exists only for
  `HomeScreen.tsx`'s chip-flash-sweep) rather than reusing/retuning a
  broader shared token — this plan follows that same precedent.

## Steps

1. In `src/styles/tokens.css`, add the new `--duration-step-content: 280ms;`
   line shown in **Target** above, immediately after the existing
   `--duration-shimmer` line (current line 80).
2. In `src/components/StepScreen.tsx`, on the badge's `animation` value
   (current line 446), change `var(--duration-layout)` to
   `var(--duration-step-content)`.
3. In the same file, on the `step-content-in` branch only (current line
   518, inside the `hasKnownDirection ? (...)` block), change
   `var(--duration-layout)` to `var(--duration-step-content)`. **Do not**
   change line 520's `view-fade-in` branch — see Boundaries.

## Boundaries

- Do NOT change the `view-fade-in` fallback branch (current line 520,
  used when `!hasKnownDirection` — i.e. on true first mount or returning
  from the All Steps list) — that's a rarer "view just mounted" case,
  semantically identical to `AllStepsView.tsx`'s own use of the exact same
  `view-fade-in` keyframe at the exact same `--duration-layout` pace; it
  should stay paired with that, not speed up independently.
- Do NOT change `--duration-layout`'s own value in `tokens.css` — it
  must keep serving `AllStepsView.tsx`'s mount fade and `App.tsx`'s
  screen-slide comment/inlined value correctly, unaffected by this plan.
- Do NOT touch `AllStepsView.tsx` or `App.tsx` — this plan only narrows
  StepScreen's own two frequent-swap call sites onto a new token, nothing
  else changes.
- If the current code at either target location in `StepScreen.tsx`
  doesn't match what's quoted above (drift since commit 677c3d7), STOP
  and report instead of guessing at a different edit.

## Verification

- **Mechanical**: no build step needed beyond `npx tsc --noEmit` (sanity
  check only, this is a pure CSS-in-string value swap) — expect no
  errors.
- **Feel check**: run the app, open a tutorial, and:
  - Tap Next/Back a few times — confirm the badge and title/description
    still animate in the same direction/shape as before, just noticeably
    snappier (280ms vs. the old 350ms — a modest, not drastic, speed-up).
  - Return to the app fresh (reload) and land on step 1 — confirm the
    *first* badge/content entrance (no known direction yet, so it's still
    on `view-fade-in`/`--duration-layout`) is unaffected by this change.
  - Open the All Steps list view and confirm its own mount fade is
    completely unaffected (still 350ms, untouched).
  - Trigger `App.tsx`'s Home↔Tutorial screen slide (open/close a
    tutorial) and confirm it's unaffected (still its own separate,
    inlined 350ms, untouched).
- **Done when**: only `StepScreen`'s per-step badge and direction-aware
  content slide run faster (280ms), with every other use of
  `--duration-layout` elsewhere in the app completely unchanged.
