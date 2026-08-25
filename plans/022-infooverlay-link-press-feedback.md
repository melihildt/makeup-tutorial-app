# 022 — Add press feedback to InfoOverlay's Portfolio/Email link rows

- **Status**: DONE
- **Commit**: 9f1aa24
- **Severity**: MEDIUM
- **Category**: Physicality & origin
- **Estimated scope**: 1 file — `src/components/InfoOverlay.tsx` (one shared class-string constant + one new inline style)

## Problem

`src/components/InfoOverlay.tsx` renders two pressable link rows — the
Portfolio `<a>` and the Email `<button>` (`CopyEmailButton`) — and **neither
has any press or hover feedback**. Both share the same class constant,
which carries no `active:`/`hover:` utility and no `transition`:

```tsx
/* src/components/InfoOverlay.tsx:109 — current */
const LINK_ROW_CLASS = 'flex items-center gap-3 py-3'
```

```tsx
/* src/components/InfoOverlay.tsx:334-345 — Portfolio link, current */
              <a
                href="https://melisahildt.com"
                target="_blank"
                rel="noreferrer"
                className={LINK_ROW_CLASS}
              >
                <LinkIcon />
                <span className={`${LINK_LABEL_CLASS} underline`} style={LINK_LABEL_STYLE}>
                  Portfolio
                </span>
                <TrailingSpacer />
              </a>
```

```tsx
/* src/components/InfoOverlay.tsx:202 — Email button, current */
    <button type="button" onClick={handleCopy} className={LINK_ROW_CLASS}>
```

**Why it matters**: these two rows are this screen's only real actions —
everything else (the header's "About" label, the close button aside) is
static. Every other pressable control on this screen (the Close ✕ button,
and the info icon that opens this overlay in the first place) gets
`.header-icon-button`'s `scale(1.05)` hover / `scale(0.93)` active feedback
(`src/index.css:177-189`). These two rows get none — a tap just sits there
until something else happens. It's worst on Email specifically: the only
acknowledgment of a tap is the "Copied!" label swap
(`src/components/InfoOverlay.tsx:204-216`), which waits on an async
clipboard call (`copyToClipboard`, line 161) before it can even start —
so there's a real window, however short, where the tap feels unregistered.
`<button>` elements also don't reliably get a pointer cursor for free in
every browser's UA stylesheet the way `<a href>` does, so Email additionally
lacks the passive "this is clickable" cue Portfolio gets from being a real
link.

## Target

Extend the shared class constant with Tailwind's `active:scale-[0.97]` —
the exact value AUDIT.md specifies for press feedback (`transform:
scale(0.97)` on `:active`, target range 0.95–0.98) — plus a `cursor-pointer`
utility so the button reads as clickable on desktop, and add the
`transform` transition via each element's own `style` prop (Portfolio has
no existing `style` prop to extend; Email's button currently has none
either, so both need one added):

```tsx
/* src/components/InfoOverlay.tsx:109 — target */
const LINK_ROW_CLASS = 'flex items-center gap-3 py-3 cursor-pointer active:scale-[0.97]'
const LINK_ROW_STYLE = { transition: 'transform var(--duration-instant) var(--ease-out-quart)' } as const
```

```tsx
/* src/components/InfoOverlay.tsx — Portfolio link, target */
              <a
                href="https://melisahildt.com"
                target="_blank"
                rel="noreferrer"
                className={LINK_ROW_CLASS}
                style={LINK_ROW_STYLE}
              >
                <LinkIcon />
                <span className={`${LINK_LABEL_CLASS} underline`} style={LINK_LABEL_STYLE}>
                  Portfolio
                </span>
                <TrailingSpacer />
              </a>
```

```tsx
/* src/components/InfoOverlay.tsx — Email button, target */
    <button type="button" onClick={handleCopy} className={LINK_ROW_CLASS} style={LINK_ROW_STYLE}>
```

## Repo conventions to follow

- `LookSelectorChip` (`src/components/HomeScreen.tsx:251-256`) is the exact
  exemplar this plan copies — a whole-element `active:scale-[0.97]`
  Tailwind utility, paired with an inline `style.transition` string built
  from `var(--duration-instant)`/`var(--ease-out-quart)` (not hand-typed
  ms/curve values):
  ```tsx
  className="... active:scale-[0.97]"
  style={{
    ...
    transition:
      'border-color var(--duration-instant) var(--ease-out-quart), box-shadow var(--duration-instant) var(--ease-out-quart), transform var(--duration-instant) var(--ease-out-quart)',
  }}
  ```
  This plan's version is simpler (`transform` is the only property that
  needs transitioning here — these rows have no border-color/box-shadow
  swap) but pulls the same two tokens from `src/styles/tokens.css:92-93`.
- This is a **whole-row** scale, not `.header-icon-button`'s
  icon-only-child scale (`src/index.css:177-189`, which scales just the
  child `<svg>`) — deliberately different from that pattern because these
  rows are icon **and** text together; scaling only the icon would move it
  independently of the label it's attached to, which reads as broken, not
  tactile. Whole-row scale (this plan's approach) keeps icon and text
  moving together as one unit, same as `LookSelectorChip` scales its whole
  button rather than just its icon.
- Tailwind utility classes and inline `style` transitions coexist
  throughout this codebase already (`LookSelectorChip` itself does exactly
  this) — no new pattern introduced.

## Steps

1. In `src/components/InfoOverlay.tsx`, change the `LINK_ROW_CLASS` constant
   (current line 109) to add `cursor-pointer active:scale-[0.97]`, and add a
   new `LINK_ROW_STYLE` constant immediately after it, exactly as shown in
   **Target** above.
2. On the Portfolio `<a>` (current lines 334-345), add `style={LINK_ROW_STYLE}`
   right after the existing `className={LINK_ROW_CLASS}`.
3. On the Email `<button>` (current line 202), add `style={LINK_ROW_STYLE}`
   right after the existing `className={LINK_ROW_CLASS}`.
4. Run `npx tsc -b` to confirm no type errors.

## Boundaries

- Do NOT add a `hover:` scale — AUDIT.md's press-feedback rule only
  specifies `:active`; `LookSelectorChip`, this plan's own exemplar, has no
  hover scale either (only `.header-icon-button`, a different pattern for a
  different element shape, has one). Underline + `cursor-pointer` is enough
  hover affordance for a text link.
- Do NOT touch `CopyEmailButton`'s label crossfade (`AnimatePresence`/
  `motion.span`, lines 204-216) or its clipboard logic (lines 136-172) —
  those are correct and out of scope for this plan.
- Do NOT touch `.header-icon-button` in `src/index.css` or the Close/info
  buttons that use it — they already have press feedback, this plan only
  covers the two link rows.
- Do NOT add `LINK_ROW_STYLE`'s transition property to any other
  element in this file.
- If the current code at either location doesn't match what's quoted above
  (drift since commit 9f1aa24), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npx tsc -b` — expect no errors. `grep -n
  "active:scale-\[0.97\]" src/components/InfoOverlay.tsx` — expect exactly
  one match (on `LINK_ROW_CLASS`, shared by both rows).
- **Feel check**: run the app, open the About overlay (tap the info icon),
  and:
  - Press-and-hold the Portfolio row — confirm it visibly shrinks slightly
    and releases back to full size, both icon and text moving together as
    one unit.
  - Press-and-hold the Email row the same way, both in its idle state and
    right as a tap lands (before the label swaps to "Copied!") — confirm
    the same visible press response, so the tap is acknowledged instantly
    even before the async clipboard result comes back.
  - Hover the Email button on a mouse-capable device — confirm the cursor
    shows as a pointer, not the default arrow.
  - In DevTools, set Animations playback to 10% and confirm the press/
    release transform transition is smooth, not a hard snap.
  - Toggle `prefers-reduced-motion` (Rendering panel) and confirm the press
    feedback becomes instant (no visible scale animation duration) rather
    than disappearing outright — this relies on the same global
    `prefers-reduced-motion` CSS rule (`src/index.css`) that already covers
    every other plain-CSS-transition press effect in this app, so no extra
    work should be needed here.
- **Done when**: both the Portfolio and Email rows visibly respond to press
  using the app's own duration/easing tokens, matching `.header-icon-button`
  and `LookSelectorChip`'s existing feel on the same and adjacent screens.
