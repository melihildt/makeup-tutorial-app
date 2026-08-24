# 009 — Add press/hover feedback to ScreenHeader's four buttons

- **Status**: DONE
- **Commit**: 677c3d7
- **Severity**: HIGH
- **Category**: Physicality & origin (cross-referenced with Cohesion & tokens)
- **Estimated scope**: 2 files — `src/index.css` (new shared class), `src/components/ScreenHeader.tsx` (apply it to 4 buttons)

## Problem

`src/components/ScreenHeader.tsx` renders four pressable `<button>`
elements — Back, the Search toggle, the Widget toggle, and Done — and
**none of them have any press or hover feedback at all**. Confirmed by
grepping the file: no `active:`, `hover:`, or `transition` anywhere in
`src/components/ScreenHeader.tsx`.

```tsx
/* src/components/ScreenHeader.tsx:186-193 — Back button, current */
        <button
          type="button"
          onClick={onBack}
          className="flex size-[40px] shrink-0 items-center justify-center rounded-[--radius-filter-chip] border-[0.5px] border-solid"
          style={HEADER_CHIP_STYLE}
        >
          <BackIcon />
        </button>
```

```tsx
/* src/components/ScreenHeader.tsx:201-206 — Search toggle button, current */
        <button
          type="button"
          onClick={onSelectStepView}
          aria-pressed={!isListView}
          className="relative flex size-[40px] items-center justify-center rounded-[--radius-filter-chip]"
        >
```

```tsx
/* src/components/ScreenHeader.tsx:224-229 — Widget toggle button, current */
        <button
          type="button"
          onClick={onSelectListView}
          aria-pressed={isListView}
          className="relative flex size-[40px] items-center justify-center rounded-[--radius-filter-chip]"
        >
```

```tsx
/* src/components/ScreenHeader.tsx:241-246 — Done button, current */
      <button
        type="button"
        onClick={onDone}
        className="flex size-[40px] shrink-0 items-center justify-center rounded-[--radius-filter-chip] border-[0.5px] border-solid"
        style={HEADER_CHIP_STYLE}
      >
        <DoneIcon />
      </button>
```

**Why it matters**: These four buttons sit on the exact same screens as
`ActionButton` ("Next"/"Finish"), which gets careful, token-driven press
feedback (`src/index.css:106-116`, `.action-button` class). A tap on
"Next" visibly acknowledges itself; a tap on Back, Search, Widget, or Done
— used just as often, on every step navigation and every view switch —
gives zero visual acknowledgment. Half the screen's controls feel "alive"
and half feel inert, directly working against this app's own established
"warm, tactile" personality (every other persistent control in the app —
`TutorialLookCard`'s root, `StartTutorialButton`, the Day/Night/Glam
filter chips — has press feedback of some kind).

## Target

A new shared CSS class, `.header-icon-button`, added to `src/index.css`
right after the existing `.action-button` block, using the exact same
tokens and structure:

```css
/* src/index.css — target, inserted immediately after the existing
   .action-button block (after line 116) */

/* ScreenHeader's four buttons (Back, Search/Widget toggle, Done) — same
   press/hover feedback pattern as .action-button above, extracted as its
   own class since these buttons don't share ActionButton's component but
   should feel identical to press. */
.header-icon-button {
  transition: transform var(--duration-instant) var(--ease-out-quart);
}
@media (hover: hover) {
  .header-icon-button:hover {
    transform: scale(1.05);
  }
}
.header-icon-button:active {
  transform: scale(0.93);
}
```

Note the hover/active values are **not** identical to `.action-button`'s
(`1.02`/`0.97`) — these are small 40×40px icon buttons, not a full-width
bar, and AUDIT.md's press-feedback guidance (`0.95–0.98` for press) is a
band, not one fixed number; a slightly larger relative scale
(`0.93`/`1.05`) reads better on a small icon target without going outside
that band's spirit. Both values are still within AUDIT's stated "keep it
subtle (0.95–0.98)" *general* guidance for press feedback — `0.93` is
deliberately just outside that on the low end because a 40px icon button
needs a bit more visible travel than a 335px-wide bar for the same press
to register at all; if you want to stay strictly inside 0.95–0.98, use
`0.96` instead of `0.93` — either is acceptable, pick one and apply it
consistently to all four buttons.

Then apply `header-icon-button` to all four buttons' `className`:

```tsx
/* src/components/ScreenHeader.tsx — Back button, target */
        <button
          type="button"
          onClick={onBack}
          className="header-icon-button flex size-[40px] shrink-0 items-center justify-center rounded-[--radius-filter-chip] border-[0.5px] border-solid"
          style={HEADER_CHIP_STYLE}
        >
          <BackIcon />
        </button>
```

```tsx
/* src/components/ScreenHeader.tsx — Search toggle button, target */
        <button
          type="button"
          onClick={onSelectStepView}
          aria-pressed={!isListView}
          className="header-icon-button relative flex size-[40px] items-center justify-center rounded-[--radius-filter-chip]"
        >
```

```tsx
/* src/components/ScreenHeader.tsx — Widget toggle button, target */
        <button
          type="button"
          onClick={onSelectListView}
          aria-pressed={isListView}
          className="header-icon-button relative flex size-[40px] items-center justify-center rounded-[--radius-filter-chip]"
        >
```

```tsx
/* src/components/ScreenHeader.tsx — Done button, target */
      <button
        type="button"
        onClick={onDone}
        className="header-icon-button flex size-[40px] shrink-0 items-center justify-center rounded-[--radius-filter-chip] border-[0.5px] border-solid"
        style={HEADER_CHIP_STYLE}
      >
        <DoneIcon />
      </button>
```

## Repo conventions to follow

- `.action-button` (`src/index.css:106-116`) is the exact exemplar this
  plan copies: plain CSS `transition` on a persistent element reacting to
  its own pseudo-class state (correct here too — none of these four
  buttons remount), hover gated behind `@media (hover: hover)` so a tap on
  a touch device never leaves a stuck `:hover` state, both durations/
  easing pulled from `--duration-instant`/`--ease-out-quart`
  (`src/styles/tokens.css:76-77`) rather than hand-typed.
- Tailwind utility classes and a plain CSS class coexist on the same
  element throughout this codebase (e.g. `ActionButton.tsx:26` puts
  `action-button` first in a Tailwind class string) — put
  `header-icon-button` first in each `className`, matching that ordering
  convention.
- Global `prefers-reduced-motion` handling in `src/index.css:160-169`
  already collapses all `transition-duration` to `0.01ms` — this new
  class needs no separate reduced-motion handling, it's covered
  automatically since it's a plain CSS transition, not Framer Motion.

## Steps

1. In `src/index.css`, immediately after the closing `}` of the existing
   `.action-button:active { transform: scale(0.97); }` block (current
   line 116), insert the new `.header-icon-button` block shown in
   **Target** above (comment + 3 rules).
2. In `src/components/ScreenHeader.tsx`, add `header-icon-button ` (with
   a trailing space, prepended to the existing className string) to all
   four buttons: Back (~line 189), the Search toggle (~line 205), the
   Widget toggle (~line 228), and Done (~line 244). Do not change any
   other class on these elements.
3. Run `npx tsc --noEmit` to confirm no type errors from the edit.

## Boundaries

- Do NOT add press feedback to `SearchIcon`/`WidgetIcon`'s own
  `opacity`-based active/inactive styling (`ScreenHeader.tsx:100-136`) —
  that's a separate, already-correct "which tab is selected" signal, not
  a press cue. This plan only touches the four `<button>` wrapper elements
  and `src/index.css`.
- Do NOT touch the `check-ring-in` chip overlay (`ScreenHeader.tsx:215-221,
  230-236`) — that's the active-tab settle animation, already correct and
  out of scope.
- Do NOT change `HEADER_CHIP_STYLE` or any inline `style` prop — this is
  a `className`-only addition plus one new CSS block.
- Do NOT apply `.header-icon-button` to any button outside
  `ScreenHeader.tsx` in this pass, even if you notice a similar bare
  button elsewhere (e.g. `HomeScreen.tsx`'s header icons) — that's a
  separate, unaudited surface; out of scope here.
- If any of the four buttons' current code doesn't match what's quoted
  above (drift since commit 677c3d7), STOP and report instead of
  improvising a different className string.

## Verification

- **Mechanical**: `npx tsc --noEmit` — expect no errors. `grep -c
  "header-icon-button" src/components/ScreenHeader.tsx` — expect `4`.
- **Feel check**: run the app on a per-step screen (has all four buttons:
  Back, Search, Widget, Done) and:
  - Press-and-hold each of the four buttons on a touch device or via
    mouse-down — confirm each visibly shrinks slightly, and releases back
    to full size.
  - On a mouse-capable device, hover over each button without clicking —
    confirm each grows very slightly, and confirm this does NOT happen on
    a touch tap (test in a mobile emulation mode, or confirm the
    `@media (hover: hover)` gate is present in the CSS).
  - Compare side-by-side against the "Next"/"Finish" `ActionButton` on
    the same screen — both should now visibly acknowledge a press, even
    if the exact scale amount differs.
  - In DevTools, set Animations playback to 10% and confirm the press/
    release transition is smooth, not a hard snap.
  - Toggle `prefers-reduced-motion` (Rendering panel) and confirm the
    press feedback becomes instant (no visible scale animation duration)
    rather than disappearing outright — the global CSS rule
    (`index.css:160-169`) should handle this without any extra work.
- **Done when**: all four `ScreenHeader` buttons visibly respond to press
  (and, where applicable, hover) using the app's own duration/easing
  tokens, matching `ActionButton`'s existing feel on the same screen.
