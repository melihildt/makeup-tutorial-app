# 024 — Give CopyEmailButton's "Couldn't copy" failure state its own motion cue

- **Status**: DONE
- **Commit**: 9f1aa24
- **Severity**: LOW (missed opportunity)
- **Category**: Missed opportunity (cross-referenced with Easing & duration, Accessibility)
- **Estimated scope**: 2 files — `src/styles/tokens.css` (one new easing token), `src/components/InfoOverlay.tsx` (one new local constant, one conditional branch in an existing `motion.span`)

## Problem

`src/components/InfoOverlay.tsx`'s `CopyEmailButton` has three label
states — `'idle'` ("Email"), `'copied'` ("Copied!"), `'failed'` ("Couldn't
copy") — and all three cross-fade identically:

```tsx
/* src/components/InfoOverlay.tsx:186-227 — current, full component */
function CopyEmailButton() {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timeoutRef.current), [])

  async function handleCopy() {
    const succeeded = await copyToClipboard(EMAIL)
    setStatus(succeeded ? 'copied' : 'failed')
    window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setStatus('idle'), 1600)
  }

  const label = status === 'copied' ? 'Copied!' : status === 'failed' ? "Couldn't copy" : 'Email'

  return (
    <button type="button" onClick={handleCopy} className={LINK_ROW_CLASS}>
      <AtIcon />
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={label}
          className={`${LINK_LABEL_CLASS} ${status === 'idle' ? 'underline' : ''}`}
          style={LINK_LABEL_STYLE}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE_OUT_QUART }}
        >
          {label}
        </motion.span>
      </AnimatePresence>
      <TrailingSpacer />
      <span className="sr-only" aria-live="polite">
        {status === 'copied'
          ? 'Email address copied to clipboard'
          : status === 'failed'
            ? 'Could not copy email address'
            : ''}
      </span>
    </button>
  )
}
```

**Why it matters**: a failed copy (clipboard permission denied, or both the
modern API and the `execCommand` fallback unavailable — see `copyToClipboard`,
lines 161-172) is communicated by text alone, in the exact same visual
language as the success state. A failure is the one state on this screen
where the user might actually need to *notice* something went wrong (so
they know to select-and-copy the email manually instead) — right now
"Couldn't copy" fades in exactly like "Copied!" does, with nothing to make
it register faster than reading the words. This app has no existing
error/danger color token or icon asset to reach for (confirmed: no
`--color-*` token or `*.svg` in this repo carries "error"/"danger"/"warn" in
its name), and per this project's own established convention, a new icon
must come from a real Figma source, not be hand-authored — so this plan
adds the distinction with **motion alone**, not a new color or icon.

## Target

A brief horizontal shake on the label, playing only when it lands in the
`'failed'` state, respecting `prefers-reduced-motion` (a shake is pure
movement with no comprehension value beyond what the text swap already
provides, so AUDIT.md's "remove position changes" reduced-motion rule
applies directly — under reduced motion this falls back to the exact same
plain opacity fade every other label state already uses).

First, add a new easing token to `src/styles/tokens.css`, in the existing
Motion section, immediately after `--ease-out-quart`:

```css
/* src/styles/tokens.css:92 — current */
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
```

```css
/* src/styles/tokens.css — target, inserted immediately after --ease-out-quart */
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1); /* AUDIT.md's strong ease-in-out for on-screen movement — first use: CopyEmailButton's failure shake (InfoOverlay.tsx), a symmetric back-and-forth motion where ease-out-quart's asymmetric fast-start doesn't fit. */
```

Then in `src/components/InfoOverlay.tsx`, add a local JS-array mirror of
that token (same "CSS token + JS array mirror" pattern `EASE_OUT_QUART`
already uses, imported from `TutorialCard.tsx` at the top of this file) and
wire the shake into the existing label `motion.span`:

```tsx
/* src/components/InfoOverlay.tsx — target, added near the top of the file,
   directly below the existing `import { EASE_OUT_QUART } from './TutorialCard'` */
// Local mirror of tokens.css's --ease-in-out, same "CSS var + JS-array
// mirror" pattern EASE_OUT_QUART (imported above) uses for its own
// --ease-out-quart token — kept local rather than exported from
// TutorialCard.tsx since this file is currently the only consumer; promote
// it to a shared location the same way EASE_OUT_QUART itself was only once
// a second file actually needed it (see plans/006, plans/README.md).
const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const
```

```tsx
/* src/components/InfoOverlay.tsx — CopyEmailButton, target */
function CopyEmailButton() {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timeoutRef = useRef<number | undefined>(undefined)
  const reduceMotion = useReducedMotion()

  useEffect(() => () => window.clearTimeout(timeoutRef.current), [])

  async function handleCopy() {
    const succeeded = await copyToClipboard(EMAIL)
    setStatus(succeeded ? 'copied' : 'failed')
    window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setStatus('idle'), 1600)
  }

  const label = status === 'copied' ? 'Copied!' : status === 'failed' ? "Couldn't copy" : 'Email'
  // Only the *first* time a given mount lands on 'failed' plays the shake —
  // see Boundaries for the accepted repeat-tap limitation.
  const shakeOnFailure = status === 'failed' && !reduceMotion

  return (
    <button type="button" onClick={handleCopy} className={LINK_ROW_CLASS}>
      <AtIcon />
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={label}
          className={`${LINK_LABEL_CLASS} ${status === 'idle' ? 'underline' : ''}`}
          style={LINK_LABEL_STYLE}
          initial={{ opacity: 0 }}
          animate={
            shakeOnFailure
              ? {
                  opacity: 1,
                  transform: [
                    'translateX(0px)',
                    'translateX(-4px)',
                    'translateX(4px)',
                    'translateX(-3px)',
                    'translateX(3px)',
                    'translateX(0px)',
                  ],
                }
              : { opacity: 1 }
          }
          exit={{ opacity: 0 }}
          transition={
            shakeOnFailure
              ? {
                  opacity: { duration: 0.2, ease: EASE_OUT_QUART },
                  transform: { duration: 0.3, ease: EASE_IN_OUT },
                }
              : { duration: 0.2, ease: EASE_OUT_QUART }
          }
        >
          {label}
        </motion.span>
      </AnimatePresence>
      <TrailingSpacer />
      <span className="sr-only" aria-live="polite">
        {status === 'copied'
          ? 'Email address copied to clipboard'
          : status === 'failed'
            ? 'Could not copy email address'
            : ''}
      </span>
    </button>
  )
}
```

## Repo conventions to follow

- `EASE_OUT_QUART` (`src/components/TutorialCard.tsx`, exported as
  `[0.25, 1, 0.5, 1] as const`, imported into this file already) is the
  exact exemplar for "a CSS easing token also needs a JS-array mirror for
  Framer Motion" — `EASE_IN_OUT` in this plan follows the identical shape
  and naming convention, just colocated in `InfoOverlay.tsx` instead of
  exported, since (per `plans/006-consolidate-ease-out-quart-array.md` and
  `plans/README.md`'s note on it) this codebase only promotes a constant to
  a shared file once a *second* call site actually needs it — don't
  preemptively export `EASE_IN_OUT` from `TutorialCard.tsx` in this pass.
- Per-property `transition` objects (`{ opacity: {...}, transform: {...} }`
  instead of one flat object) are standard Framer Motion for animating two
  properties on different curves/durations within the same `animate` call —
  no precedent needed beyond Framer Motion's own API; this file doesn't
  already do this elsewhere, but it's the only correct way to give
  `opacity` and `transform` different timing on the same element.
- `useReducedMotion()` is already imported at the top of this file
  (`src/components/InfoOverlay.tsx:2`) and used inside the top-level
  `InfoOverlay` component (line 249) — this plan calls the same hook a
  second time, inside `CopyEmailButton`, which is a separate function
  component and needs its own call (hooks aren't shareable across sibling
  components).

## Steps

1. In `src/styles/tokens.css`, insert the new `--ease-in-out` line
   immediately after the existing `--ease-out-quart` line (current line 92),
   exactly as shown in **Target** above.
2. In `src/components/InfoOverlay.tsx`, add the `EASE_IN_OUT` constant
   immediately below the existing `import { EASE_OUT_QUART } from
   './TutorialCard'` line (current line 3), exactly as shown in **Target**
   above.
3. In `CopyEmailButton` (current lines 186-227), add
   `const reduceMotion = useReducedMotion()` as the first line inside the
   function body, after the existing `useState`/`useRef` declarations.
4. Add the `shakeOnFailure` constant (as shown in **Target**) right after
   the existing `label` constant.
5. Replace the `motion.span`'s `animate`, `exit`, and `transition` props
   with the conditional versions shown in **Target** above. Leave every
   other prop (`key`, `className`, `style`, `initial`) unchanged.
6. Run `npx tsc -b` to confirm no type errors.

## Boundaries

- Do NOT add a color or icon change to the failure state — this plan is
  motion-only, per the reasoning in Problem above (no error color token
  exists yet, and a new icon needs a real Figma source per this project's
  own convention — introducing either is a separate, larger decision, not
  part of this plan).
- Do NOT change the shake amplitude/duration values without re-reading
  AUDIT.md — this plan's values (±4px/±3px over 300ms, `ease-in-out`) are a
  reasonable default for a "moving on screen" cue per AUDIT.md §2's easing
  decision order, but are a genuine feel-check call, not a value copied
  verbatim from AUDIT.md's table (which has no shake-specific entry) — see
  Verification below.
- **Known, accepted limitation, do not try to fix in this plan**: if the
  user taps Email again while already in the `'failed'` state (within the
  1.6s window), `setStatus('failed')` is called with the same value React
  already has, so no re-render is triggered and the shake does not replay.
  This mirrors the exact same pre-existing limitation on repeat taps during
  `'copied'` (the label similarly doesn't "re-pop") — solving it (e.g. via a
  monotonic attempt counter folded into the `key`) is a separate,
  self-contained follow-up if ever wanted, not part of this plan.
- Do NOT touch `copyToClipboard`/`copyText` (lines 136-172) — the clipboard
  logic itself is correct and out of scope.
- Do NOT apply `EASE_IN_OUT` or the shake pattern to any other element in
  this file (e.g. don't "improve" the Portfolio/Email press feedback from
  plan 022, or the backdrop/card entrance from plan 023 — those are
  separate plans).
- If the current code doesn't match what's quoted above (drift since commit
  9f1aa24), STOP and report instead of improvising — in particular, if
  plan 022 has already landed, `CopyEmailButton`'s `<button>` opening tag
  will carry an added `style={LINK_ROW_STYLE}` prop; that's a different
  region of the same function and doesn't conflict with this plan's edits,
  but confirm the `motion.span` block itself still matches before editing.

## Verification

- **Mechanical**: `npx tsc -b` — expect no errors. `grep -n "ease-in-out"
  src/styles/tokens.css` — expect one match. `grep -n "EASE_IN_OUT"
  src/components/InfoOverlay.tsx` — expect at least two matches (the
  constant declaration and its use in `transition`).
- **Feel check**: run the app, open the About overlay, and force a failure
  to actually see it — the easiest way is temporarily patching
  `copyToClipboard` (or stubbing `navigator.clipboard` and
  `document.execCommand`) to always resolve `false`/return `false`, tapping
  Email, then reverting the temporary patch before finishing (confirm no
  test-only code remains via `git diff` on this file before considering the
  plan done). With that forced:
  - Confirm the label visibly shakes side-to-side as it reads "Couldn't
    copy" — a quick, small wobble, not a large or cartoonish swing.
  - In DevTools, set Animations playback to 10% and confirm the shake is a
    smooth `ease-in-out` oscillation, not a linear snap between positions.
  - Toggle `prefers-reduced-motion` (Rendering panel), force another
    failure, and confirm the label still swaps to "Couldn't copy" (readable,
    functional) but with no shake — a plain opacity fade only, matching
    every other label state.
  - Confirm a successful copy ("Copied!") and the idle "Email" state are
    completely unaffected — no shake, same plain opacity crossfade as
    before this plan.
  - Confirm the screen-reader-only `aria-live` announcement ("Could not
    copy email address") still fires on failure — this plan doesn't touch
    that `<span>`, but verify it wasn't accidentally broken by the
    surrounding edit.
- **Done when**: a failed copy visibly reads differently from a successful
  one before the user even finishes reading the words, reduced-motion users
  get the same information via the text swap alone with no movement, and
  every other label state (idle, copied) is pixel-for-pixel unchanged from
  before this plan.
