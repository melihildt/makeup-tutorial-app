# 048 — Promote EASE_IN_OUT to a shared export, matching EASE_OUT_QUART's pattern

- **Status**: TODO
- **Commit**: 2d86cf3
- **Severity**: LOW
- **Category**: Cohesion & tokens (AUDIT.md §7)
- **Estimated scope**: 2 files, 1 export moved + 1 import updated (plus any files plan 041 adds as a second consumer)

## Problem

`InfoOverlay.tsx` defines a local, unexported mirror of `--ease-in-out`:

```ts
/* src/components/InfoOverlay.tsx:9-15 — current */
// Local mirror of tokens.css's --ease-in-out, same "CSS var + JS-array
// mirror" pattern EASE_OUT_QUART (imported above) uses for its own
// --ease-out-quart token — kept local rather than exported from
// TutorialCard.tsx since this file is currently the only consumer; promote
// it to a shared location the same way EASE_OUT_QUART itself was only once
// a second file actually needed it (see plans/006, plans/README.md).
const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const
```

The comment already documents the intended promotion trigger ("once a second
file actually needed it") — that trigger has now been met: plan 041
(ScreenHeader toggle easing fix) introduces a second consumer of
`--ease-in-out`'s JS mirror, in `ScreenHeader.tsx`'s own `transition` string
today, but a *component-level* Framer Motion consumer of this exact curve as
a JS array would need the same import `InfoOverlay.tsx` already has. Even
independent of plan 041, `EASE_OUT_QUART` (the file's sibling token) already
lives in the shared location — `EASE_IN_OUT` is the one motion primitive in
this app still following the "define locally until a second consumer shows
up" holding pattern past its own stated trigger.

## Target

```ts
/* src/components/TutorialCard.tsx — new, placed immediately after
   EASE_OUT_QUART (line 81) */
// --ease-in-out (tokens.css) — AUDIT.md's strong ease-in-out for on-screen
// movement and symmetric back-and-forth motion. Promoted here from its
// original home in InfoOverlay.tsx (CopyEmailButton's failure shake, the
// first consumer) once a second consumer needed it — see plans/048.
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const
```

```ts
/* src/components/InfoOverlay.tsx:9-15 — target: removed entirely, replaced
   by importing it from TutorialCard.tsx alongside EASE_OUT_QUART */
import { EASE_OUT_QUART, EASE_IN_OUT } from './TutorialCard'
```

## Repo conventions to follow

- This is the exact promotion this codebase has already done once for
  `EASE_OUT_QUART` itself (per `plans/006` and `plans/README.md`, cited by
  `EASE_IN_OUT`'s own comment) — same target file (`TutorialCard.tsx`), same
  "define locally, promote once a second consumer needs it" lifecycle.

## Steps

1. In `src/components/TutorialCard.tsx`, immediately after the
   `EASE_OUT_QUART` export (line 81), add the `EASE_IN_OUT` export exactly as
   shown in Target above.
2. In `src/components/InfoOverlay.tsx`, remove lines 9-15 (the comment block
   and the local `const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const`
   declaration) in their entirety.
3. In the same file, change the existing `import { EASE_OUT_QUART } from
   './TutorialCard'` line to `import { EASE_OUT_QUART, EASE_IN_OUT } from
   './TutorialCard'`.
4. Run `grep -n "EASE_IN_OUT" src/components/InfoOverlay.tsx` to confirm
   every remaining usage in the file (e.g. the mobile-drawer close transition
   around line 252) still resolves correctly against the imported binding —
   no call-site changes should be needed since the identifier name is
   unchanged, only its source.

## Boundaries

- Do NOT change `EASE_IN_OUT`'s value (`[0.77, 0, 0.175, 1]`) — this is a
  relocation, not a retune.
- Do NOT touch `ScreenHeader.tsx` or `index.css` in this plan even if plan
  041 (which changes `ScreenHeader.tsx` to use `--ease-in-out`) has already
  landed — that plan operates on the CSS custom property directly, not this
  JS array, and has no dependency on this export existing.
- Do NOT touch any other export in `TutorialCard.tsx`.
- If `InfoOverlay.tsx` lines 9-15 don't match the Problem snippet above
  (drift since commit `2d86cf3`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npx tsc --noEmit` clean — confirms every `EASE_IN_OUT`
  usage in `InfoOverlay.tsx` still resolves. `npm run build` clean.
- **Feel check**: this is a pure code-location refactor with zero value
  change — trigger InfoOverlay's CopyEmailButton failure-shake (attempt to
  copy the email when copying is unsupported/fails, or however this file's
  own test path exercises it) and confirm the shake looks and times exactly
  as before.
- **Done when**: `EASE_IN_OUT` is exported once from `TutorialCard.tsx`,
  `InfoOverlay.tsx` imports it rather than declaring its own copy, and every
  existing consumer in `InfoOverlay.tsx` still works unchanged.
