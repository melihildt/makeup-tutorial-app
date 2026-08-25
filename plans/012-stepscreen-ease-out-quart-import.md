# 012 — Import the shared EASE_OUT_QUART constant in StepScreen instead of hand-typing it

- **Status**: DONE
- **Commit**: 677c3d7
- **Severity**: LOW
- **Category**: Cohesion & tokens
- **Screen impact**: Tutorial step (StepScreen.tsx)
- **Estimated scope**: 1 file, 2 line edits

## Problem

`src/components/StepScreen.tsx:199` hand-types the ease-out-quart curve as
a raw array instead of importing the shared `EASE_OUT_QUART` constant that
`src/App.tsx` and `src/components/TutorialCard.tsx` both already use for
the exact same curve.

```tsx
/* src/components/StepScreen.tsx:199 — current */
  const cardExitTransition = prefersReducedMotion ? { duration: 0 } : { duration: 0.15, ease: [0.25, 1, 0.5, 1] as const }
```

```tsx
/* src/components/TutorialCard.tsx:39 — the shared constant this should import */
export const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const
```

```tsx
/* src/App.tsx:3 — the exemplar of importing it correctly */
import { EASE_OUT_QUART } from './components/TutorialCard'
```

**Why it matters**: The file's own comment on this line acknowledges "Same
curve as --ease-out-quart... just expressed as plain numbers" — it already
knows this should be the shared curve, it just doesn't import it. If
`--ease-out-quart`'s curve is ever retuned in `tokens.css`, `EASE_OUT_QUART`
in `TutorialCard.tsx` would need updating too, but this third hand-typed
copy has no mechanism forcing it to stay in sync — exactly the
"near-duplicate hand-typed value" consolidation case AUDIT.md's Cohesion &
tokens category calls out.

## Target

```tsx
/* src/components/StepScreen.tsx — target, import added at the top */
import { EyeIllustration } from './EyeIllustration'
import { ProductCard } from './ProductCard'
import { ScreenHeader } from './ScreenHeader'
import { ActionButton } from './ActionButton'
import { EASE_OUT_QUART } from './TutorialCard'
import radialNoiseUrl from '../assets/icons/v2/radial-noise.svg'
import { STEP_CONTENT, TOTAL_STEPS } from '../data/stepContent'
```

```tsx
/* src/components/StepScreen.tsx:199 — target */
  const cardExitTransition = prefersReducedMotion ? { duration: 0 } : { duration: 0.15, ease: EASE_OUT_QUART }
```

## Repo conventions to follow

- `App.tsx:3`'s `import { EASE_OUT_QUART } from './components/TutorialCard'`
  is the exact exemplar — `StepScreen.tsx` lives inside
  `src/components/`, alongside `TutorialCard.tsx`, so its own import path
  is the shorter sibling form: `from './TutorialCard'` (not
  `'./components/TutorialCard'` — that prefix is only needed from
  `App.tsx`, which sits one directory up).
- Keep the new import alongside the other same-directory component
  imports (`EyeIllustration`, `ProductCard`, `ScreenHeader`,
  `ActionButton`), immediately after them, before the asset/data imports.

## Steps

1. In `src/components/StepScreen.tsx`, add `import { EASE_OUT_QUART } from
   './TutorialCard'` after the existing `import { ActionButton } from
   './ActionButton'` line (and before the `radialNoiseUrl` import).
2. On line 199, replace `[0.25, 1, 0.5, 1] as const` with `EASE_OUT_QUART`
   (drop the now-redundant `as const` — the imported constant is already
   typed as a readonly tuple).
3. Run `npx tsc --noEmit` to confirm the import resolves and the type
   still satisfies Framer Motion's `transition.ease` prop.

## Boundaries

- Do NOT touch any other line in `StepScreen.tsx` — this is a pure
  substitution, no other easing/duration values change.
- Do NOT modify `TutorialCard.tsx`'s own `EASE_OUT_QUART` export.
- Do NOT introduce a circular import concern — `TutorialCard.tsx` does not
  import anything from `StepScreen.tsx`, so this one-directional import is
  safe; if you find it does (drift since commit 677c3d7), STOP and report
  instead of restructuring exports to work around it.

## Verification

- **Mechanical**: `npx tsc --noEmit` — expect no errors. `grep -n "0.25, 1, 0.5, 1" src/components/StepScreen.tsx` — expect zero matches (confirms the hand-typed array is gone).
- **Feel check**: run the app, open a tutorial, tap "Finish" on step 7, and
  confirm the product card's exit animation looks and times identically
  to before this change (this is a pure refactor — the curve's actual
  numeric values are unchanged, only where they come from).
- **Done when**: `StepScreen.tsx` imports and uses `EASE_OUT_QUART` instead
  of a third hand-typed copy of the same array, with no visible behavior
  change.
