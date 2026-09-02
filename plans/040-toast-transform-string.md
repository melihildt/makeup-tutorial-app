# 040 — Toast entrance: use a full transform string, not the `y` shorthand

- **Status**: TODO
- **Commit**: 2d86cf3
- **Severity**: MEDIUM
- **Category**: Performance (AUDIT.md §5)
- **Estimated scope**: 1 file, ~4 lines

## Problem

`Toast.tsx`'s entrance/exit animation uses Framer Motion's `y` shorthand
instead of an explicit `transform` string. AUDIT.md §5 calls out that Framer
Motion's `x`/`y`/`scale` shorthands are **not** hardware-accelerated the same
way a full `transform` string is — Motion has to compose them into a
transform on every frame rather than handing the browser one compositor-only
value up front. Every other entrance/exit animation in this app (InfoOverlay,
ProductDetailOverlay, BookmarksScreen's EmptyState, TutorialCard's
TutorialStack entrance) already uses a full `transform: '...'` string — Toast
is the one exception.

```tsx
/* src/components/Toast.tsx:84-86 — current */
initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
animate={{ opacity: 1, y: 0 }}
exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
```

## Target

```tsx
/* target */
initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'translateY(-16px)' }}
animate={{ opacity: 1, transform: 'translateY(0px)' }}
exit={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'translateY(-16px)' }}
```

Nothing else on lines 84-93 changes — the `transition` prop on line 93
(`{ duration: reduceMotion ? 0.15 : 0.35, ease: EASE_OUT_QUART }`) is
untouched, it already applies correctly to a `transform` key exactly as it
did to `y`.

## Repo conventions to follow

- Full `transform` strings, not shorthands, for every Framer Motion
  entrance/exit in this app. Exemplar:
  `src/components/BookmarksScreen.tsx:234-236` —
  `initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.97)' }}`,
  `animate={{ opacity: 1, transform: 'scale(1)' }}`.
- Another exemplar with a translate specifically:
  `src/components/TutorialCard.tsx:2542-2545` — the `TutorialStack` entrance
  uses `transform: 'translateY(16px) scale(0.96)'` / `'translateY(0px) scale(1)'`.

## Steps

1. In `src/components/Toast.tsx`, replace lines 84-86 exactly as shown in
   Target above. Keep the surrounding `motion.div` props, the comment block
   on lines 87-92, and line 93's `transition` prop untouched.

## Boundaries

- Do NOT touch `useToast`, the `show`/`hide` logic, or any other part of this
  file.
- Do NOT change the duration/easing values — only the shorthand-to-string
  swap on `initial`/`animate`/`exit`.
- Do NOT touch any other file. AccountScreen.tsx and MyProductsScreen.tsx
  consume `Toast` but never touch its internal transition — out of scope.
- If lines 84-93 don't match the Problem snippet above (drift since commit
  `2d86cf3`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npx tsc --noEmit` — no new errors. `npm run build` — clean.
- **Feel check**: trigger a "coming soon" toast (tap Bookmarks row in
  AccountScreen, or "+"/"⋮" in MyProductsScreen).
  - The toast should look and move identically to before — same slide-down
    distance (16px), same fade, same 350ms duration. This is a
    compositor-path change, not a visual one; if the motion looks different
    at all, something regressed.
  - In DevTools' Animations panel, set playback to 10% and confirm the toast
    slides straight down from -16px to 0 with no horizontal drift or jump.
  - Toggle `prefers-reduced-motion` (Rendering panel) and confirm the toast
    only fades (no slide) at the faster 0.15s duration.
  - In the Performance panel, record while opening/closing the toast a few
    times and confirm the animated frames show `transform`/`opacity` as
    composited properties (no layout/paint triggered by this element).
- **Done when**: `Toast.tsx`'s `initial`/`animate`/`exit` all use `transform:
  '...'` strings instead of the `y` shorthand, and the toast's visual motion
  is unchanged from before the edit.
