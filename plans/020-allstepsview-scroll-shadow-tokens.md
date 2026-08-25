# 020 — Move AllStepsView's scroll-shadow transition onto the app's own duration/easing tokens

- **Status**: TODO
- **Commit**: 677c3d7
- **Severity**: LOW
- **Category**: Cohesion & tokens
- **Screen impact**: All steps view
- **Estimated scope**: 1 file, 1 line edit

## Problem

`AllStepsView.tsx`'s sticky-header scroll shadow uses Tailwind's built-in
`transition-opacity duration-200` utilities instead of this codebase's own
duration/easing tokens, which every other transition/animation in this
file (and its siblings) consistently references instead:

```tsx
/* src/components/AllStepsView.tsx:134-139 — current */
          <div
            className="pointer-events-none absolute inset-x-0 top-full h-8 transition-opacity duration-200"
            style={{
              background: 'linear-gradient(180deg, #e6d6d1 0%, rgba(230,214,209,0) 100%)',
              opacity: isScrolled ? 1 : 0,
            }}
          />
```

The duration happens to numerically match `--duration-base` (200ms —
tokens.css), but the *easing curve* does not: Tailwind's default
`transition-opacity` timing function is `cubic-bezier(0.4, 0, 0.2, 1)`,
not this app's own `--ease-out-quart`
(`cubic-bezier(0.25, 1, 0.5, 1)`). This is the one entrance/exit
transition in the file that silently diverges from the token system —
AUDIT.md's Cohesion & tokens category calls this out directly: "a
hand-typed value that almost matches" is a consolidation finding, and per
AUDIT's own easing decision order, an entering/exiting fade like this one
belongs on `ease-out`, i.e. the shared token, not Tailwind's default.

## Target

```tsx
/* src/components/AllStepsView.tsx:134-139 — target */
          <div
            className="pointer-events-none absolute inset-x-0 top-full h-8"
            style={{
              background: 'linear-gradient(180deg, #e6d6d1 0%, rgba(230,214,209,0) 100%)',
              opacity: isScrolled ? 1 : 0,
              transition: 'opacity var(--duration-base) var(--ease-out-quart)',
            }}
          />
```

## Repo conventions to follow

- `TutorialCard.tsx`'s various card roots (e.g. `TutorialLookCard`'s
  `style={{ ..., transition: 'transform var(--duration-instant)
  var(--ease-out-quart)' }}`) are the established exemplar for a plain CSS
  `transition` expressed as an inline `style` string using the app's own
  tokens — this plan follows that exact same shape, just for `opacity`
  instead of `transform`, and at `--duration-base` (200ms, "hover, small
  state changes" — tokens.css) rather than `--duration-instant`, since a
  scroll-shadow fade is closer to that category than a button press.

## Steps

1. In `src/components/AllStepsView.tsx`, on the scroll-shadow `div`
   (current lines 134-139), remove `transition-opacity duration-200` from
   the `className` string, leaving `"pointer-events-none absolute
   inset-x-0 top-full h-8"`.
2. Add `transition: 'opacity var(--duration-base) var(--ease-out-quart)'`
   as a new property inside the existing `style` object, alongside
   `background` and `opacity`.
3. No import changes needed — this is a plain CSS custom property
   reference, already available globally via `tokens.css`.

## Boundaries

- Do NOT touch the `background` gradient or the `opacity: isScrolled ? 1
  : 0` logic — only how the opacity change is transitioned.
- Do NOT touch `isScrolled`'s own state/scroll-listener logic elsewhere
  in this file — out of scope.
- Do NOT change `h-8`, positioning, or any other class on this element.
- If the current code at this element doesn't match what's quoted above
  (drift since commit 677c3d7), STOP and report instead of guessing at a
  different edit.

## Verification

- **Mechanical**: no build step needed beyond a sanity `npx tsc --noEmit`
  (this file is `.tsx`, so worth confirming the edit didn't break JSX
  syntax) — expect no errors.
- **Feel check**: run the app, open the All Steps list view, and scroll
  the list up/down past the point where the sticky header's shadow should
  appear — confirm the shadow still fades in/out smoothly on scroll, with
  no visible change in speed (200ms either way) but a very slightly
  different easing character (matching the app's own snappier
  `--ease-out-quart` instead of Tailwind's softer default `ease`-like
  curve) — this is a subtle, intentional cohesion improvement, not
  expected to be dramatically noticeable.
- **Done when**: the scroll shadow's fade uses `--duration-base`/
  `--ease-out-quart` via an inline `transition` style, with no Tailwind
  `transition-*`/`duration-*` utility classes left on this element.
