# 043 — CheckIndicator: consolidate its toggle choreography to fewer animated properties

- **Status**: TODO
- **Commit**: 2d86cf3
- **Severity**: MEDIUM
- **Category**: Purpose & frequency (AUDIT.md §1)
- **Estimated scope**: 1 file (CheckIndicator.tsx), possibly `tokens.css`/`index.css` if a new keyframe is added

## Problem

`CheckIndicator` is the single highest-frequency interactive control in the
app (every product row, every step, every list). AUDIT.md §1's frequency
table calls for "remove or drastically reduce" animation at the tens-of-
times/day usage tier. Every toggle currently plays **three concurrent CSS
animations** on the SVG that mounts in (see `src/index.css`'s
`check-pop`/`check-ring-in`/`check-draw` keyframes, driven from
`CheckIndicator.tsx`):

```tsx
/* src/components/CheckIndicator.tsx:54-107 — current */
export function CheckIndicator({ checked, animate = true }: CheckIndicatorProps) {
  return (
    <svg
      key={checked ? 'checked' : 'unchecked'}
      ...
      style={animate ? { animation: 'check-pop var(--duration-instant) var(--ease-out-quart)' } : undefined}
    >
      <circle cx={18} cy={18} r={18} fill="var(--check-fill)" />
      {checked ? (
        <>
          <circle
            ...
            style={animate ? { animation: 'check-ring-in var(--duration-base) var(--ease-out-quart)' } : undefined}
          />
          <path
            ...
            style={
              {
                strokeDasharray: CHECKMARK_PATH_LENGTH,
                ...(animate && {
                  '--check-draw-length': CHECKMARK_PATH_LENGTH,
                  animation: 'check-draw var(--duration-base) var(--ease-out-quart) forwards',
                }),
              } as CSSProperties
            }
          />
        </>
      ) : (
        <circle
          ...
          style={animate ? { animation: 'check-ring-in var(--duration-base) var(--ease-out-quart)' } : undefined}
        />
      )}
    </svg>
  )
}
```

Three separately-timed layers (outer pop at `--duration-instant`/150ms; ring
fade-in and checkmark stroke-draw, both at `--duration-base`/200ms) fire
together on every single click of the app's most-repeated control.

## Target

Consolidate to a single animated property that still reads as a positive
"checked" confirmation, dropping the separate ring-fade and stroke-draw
layers on the checked path. Keep the existing `check-pop` scale-in on the
whole SVG (already the quietest, most essential layer — it's what makes a
toggle register as "happened" at all) as the *only* animation on toggle; the
ring and checkmark render at their final state immediately rather than
animating in separately.

```tsx
/* src/components/CheckIndicator.tsx:54-107 — target */
export function CheckIndicator({ checked, animate = true }: CheckIndicatorProps) {
  return (
    <svg
      key={checked ? 'checked' : 'unchecked'}
      width={36}
      height={36}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={checked ? 'Checked' : 'Unchecked'}
      style={animate ? { animation: 'check-pop var(--duration-instant) var(--ease-out-quart)' } : undefined}
    >
      <circle cx={18} cy={18} r={18} fill="var(--check-fill)" />
      {checked ? (
        <>
          <circle
            cx={18}
            cy={18}
            r={16.5}
            stroke="var(--check-stroke-checked)"
            strokeWidth="var(--check-stroke-checked-width)"
          />
          <path
            d={CHECKMARK_PATH}
            fill="none"
            stroke="var(--check-stroke-checked)"
            strokeWidth="var(--check-stroke-checked-width)"
            strokeLinecap="round"
          />
        </>
      ) : (
        <circle
          cx={18}
          cy={18}
          r={17}
          stroke="var(--check-stroke-unchecked)"
          strokeWidth="var(--check-stroke-unchecked-width)"
          strokeDasharray="var(--check-stroke-unchecked-dash)"
          strokeLinecap="square"
        />
      )}
    </svg>
  )
}
```

`CHECKMARK_PATH_LENGTH` (line 20) stays — it's still used for the
`strokeDasharray` on the checked path's *static* final appearance (the path
was always fully drawn at rest; only the animated draw-in is being removed).
If, after removing the `check-draw`/`--check-draw-length` usage here, nothing
else in the codebase references `check-draw` or `--check-draw-length`, remove
the now-dead `@keyframes check-draw` rule from `src/index.css` too (grep
first — see Steps).

## Repo conventions to follow

- `animate` prop semantics are unchanged — this plan only reduces *what*
  plays when `animate` is true, not the gating logic itself. Keep the prop,
  its JSDoc comment (lines 5-9), and every other structural piece of this
  component exactly as-is.
- Removing an unused keyframe from `index.css` once its only consumer is
  gone matches this codebase's own cleanup precedent — see
  `@keyframes product-preview-fade-in` (`index.css:262-265`) for the *opposite*
  case (kept deliberately, "for the history"): that comment explicitly
  documents *why* it was kept, so absence of such a comment on `check-draw`
  means it's safe to remove outright once dead, not a pattern to imitate here.

## Steps

1. In `src/components/CheckIndicator.tsx`, remove the `style={animate ? {
   animation: 'check-ring-in ...' } : undefined}` prop from both the checked
   ring (`<circle>` inside the `checked` branch) and the unchecked ring
   (`<circle>` in the `else` branch) — leave every other prop on both
   circles untouched.
2. In the same file, remove the `style={{...}}` prop entirely from the
   checkmark `<path>` (the `strokeDasharray`/`--check-draw-length`/
   `animation` object) and replace it with a plain
   `strokeDasharray={CHECKMARK_PATH_LENGTH}` prop, so the checkmark still
   renders fully drawn at rest without the animated reveal.
3. Leave the outer `<svg>`'s `style={animate ? { animation: 'check-pop ...'
   } : undefined}` (line 65) completely untouched — this is the one
   animation kept.
4. Run `grep -rn "check-ring-in\|check-draw\|--check-draw-length" src/` to
   confirm `CheckIndicator.tsx` was the only consumer of these two keyframes
   and the custom property. If so, remove the now-unused
   `@keyframes check-ring-in { ... }` and `@keyframes check-draw { ... }`
   rules from `src/index.css`. If any other file still references them,
   STOP and report rather than removing a keyframe still in use elsewhere.

## Boundaries

- Do NOT touch `check-pop` (kept) or any other keyframe in `index.css`
  besides the two identified as dead in step 4.
- Do NOT change `--check-fill`, `--check-stroke-checked`,
  `--check-stroke-unchecked`, or any other token in `tokens.css`.
- Do NOT change the `animate` prop's default, its call sites (ProductCard,
  etc.), or the `key={checked ? 'checked' : 'unchecked'}` remount mechanism —
  those are unrelated to this fix and stay exactly as they are.
- Do NOT touch `CHECKMARK_PATH`, `CHECKMARK_PATH_LENGTH`'s value, or the
  measurement comment above it (lines 17-20) — only how the path length is
  consumed changes (plain attribute instead of an animated custom property).
- If the current code doesn't match the Problem snippet above (drift since
  commit `2d86cf3`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npx tsc --noEmit` clean (the `CSSProperties` import may
  become unused after removing the checkmark's cast — check and remove the
  import only if TypeScript actually flags it as unused). `npm run build`
  clean.
- **Feel check**: toggle a product row's check on a step screen, and again in
  All Steps view.
  - The circle should still visibly pop in (scale-in via `check-pop`) on
    every toggle — that's the one motion kept, confirm it still plays in
    both directions (checking and unchecking).
  - The ring and checkmark should now appear fully-formed the instant the
    pop finishes, with no separate fade-in or stroke-draw-in following it —
    confirm there's no longer a visible two-stage "pop, then draw" sequence.
  - In DevTools' Animations panel, set playback to 10% on a toggle and
    confirm only one animation (`check-pop`) is listed/playing, not three.
  - Confirm the "jumps when you switch views" guard still works: check a
    product on a step, switch to All Steps view (Widget icon) and back — the
    already-checked item should NOT replay its pop animation on either
    switch (this exercises the `animate=false` codepath, untouched by this
    plan).
  - Toggle `prefers-reduced-motion` and confirm the check still lands in the
    correct visual state instantly.
- **Done when**: toggling a check plays exactly one animation (`check-pop`)
  instead of three, the checked/unchecked rings and checkmark render at their
  final state immediately, and (if step 4's grep confirmed it) the dead
  `check-ring-in`/`check-draw` keyframes no longer exist in `index.css`.
