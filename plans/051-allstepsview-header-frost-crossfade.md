# 051 — AllStepsView sticky header: cross-fade the frost via opacity, not background-color/backdrop-filter

- **Status**: TODO
- **Commit**: 3ecf622
- **Severity**: HIGH
- **Category**: Performance (AUDIT.md §5)
- **Estimated scope**: 1 file, ~1 new element + edits to the existing sticky wrapper's style

## Problem

`AllStepsView.tsx`'s sticky header animates `background-color` and
`backdrop-filter` directly, alongside `transform`/`opacity`, on every
scroll-direction change (this view's own scroll listener flips `isScrolled`
frequently as the user scrolls up/down):

```tsx
/* src/components/AllStepsView.tsx:244-262 — current */
<div
  className="sticky top-0 z-10 pb-2 pt-[--space-2xs] md:pt-6"
  style={{
    background: isScrolled ? 'var(--color-list-header-bg)' : 'transparent',
    // 'blur(0px)', not 'none', for the off state — both render
    // identically (no visible blur), but only the former lets the
    // backdrop-filter transition below actually animate: 'none' and
    // a blur() function aren't interpolatable, so animating between
    // them would just snap instead of smoothly fading the frost in.
    backdropFilter: isScrolled ? 'blur(var(--blur-list-header))' : 'blur(0px)',
    WebkitBackdropFilter: isScrolled ? 'blur(var(--blur-list-header))' : 'blur(0px)',
    transform: isHeaderHidden ? 'translateY(-100%)' : 'translateY(0)',
    opacity: isHeaderHidden ? 0 : 1,
    pointerEvents: isHeaderHidden ? 'none' : 'auto',
    transition:
      'transform var(--duration-base) var(--ease-out-quart), opacity var(--duration-base) var(--ease-out-quart), background-color var(--duration-base) var(--ease-out-quart), backdrop-filter var(--duration-base) var(--ease-out-quart)',
  }}
  inert={isHeaderHidden}
>
  <ScreenHeader
    activeView="list"
    onBack={onBack}
    onDone={onDone}
    onSelectStepView={onSelectStepView}
  />
</div>
```

`background-color` and `backdrop-filter` are both paint-triggering — the
browser has to recompute pixels under the element on every animated frame,
not just re-composite an existing layer the way `transform`/`opacity`
changes can. `backdrop-filter` in particular is one of the more expensive
properties to animate at all (AUDIT.md §5). This fires every time the user
reverses scroll direction while browsing the All Steps list — not rare.

## Target

Split the frost effect into its own absolutely-positioned layer that stays
at a **constant** `background`/`backdrop-filter` value and only cross-fades
via `opacity` — a compositor-only property — instead of animating the paint
properties themselves. The outer sticky wrapper keeps animating
`transform`/`opacity` exactly as before, for the hide-on-scroll-down
behavior; only the "is this the frosted or transparent state" transition
moves to the new inner layer.

```tsx
/* src/components/AllStepsView.tsx:244-269 — target */
<div
  className="sticky top-0 z-10 pb-2 pt-[--space-2xs] md:pt-6"
  style={{
    transform: isHeaderHidden ? 'translateY(-100%)' : 'translateY(0)',
    opacity: isHeaderHidden ? 0 : 1,
    pointerEvents: isHeaderHidden ? 'none' : 'auto',
    transition:
      'transform var(--duration-base) var(--ease-out-quart), opacity var(--duration-base) var(--ease-out-quart)',
  }}
  inert={isHeaderHidden}
>
  {/* Frost layer, separated out (plans/051): background/backdrop-filter
      are both paint-triggering properties, expensive to animate directly
      and fired on every scroll-direction change. This layer's own
      background+blur are now CONSTANT — only its opacity cross-fades
      in/out, a compositor-only property, same as the wrapper's own
      transform/opacity above. Absolutely positioned behind ScreenHeader
      (DOM order — a plain sibling before it, no z-index needed) so the
      header's own buttons stay visually on top and fully interactive. */}
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0"
    style={{
      background: 'var(--color-list-header-bg)',
      backdropFilter: 'blur(var(--blur-list-header))',
      WebkitBackdropFilter: 'blur(var(--blur-list-header))',
      opacity: isScrolled ? 1 : 0,
      transition: 'opacity var(--duration-base) var(--ease-out-quart)',
    }}
  />
  <ScreenHeader
    activeView="list"
    onBack={onBack}
    onDone={onDone}
    onSelectStepView={onSelectStepView}
  />
</div>
```

The outer wrapper needs `relative` added to its className so the new frost
layer's `absolute inset-0` positions against it, not some further-out
ancestor.

## Repo conventions to follow

- `opacity`-only cross-fades for a "toggle between two visual states"
  effect are already this app's established fix for exactly this class of
  problem — see `ScreenHeader.tsx`'s own sliding highlight (a single
  persistent element, never re-painting background/border directly) and
  this codebase's broader "animate transform/opacity only" discipline
  (AUDIT.md §5, already followed by every other transition in this file
  after `plans/020-allstepsview-scroll-shadow-tokens.md`).
- Absolutely-positioned decorative layers with `aria-hidden="true"` and
  `pointer-events-none` are the established pattern for a purely-visual
  overlay in this app — see the filter chip's own texture/tint layer,
  `src/components/HomeScreen.tsx:242` (`<div aria-hidden="true"
  className="pointer-events-none absolute inset-0">`).

## Steps

1. In `src/components/AllStepsView.tsx`, add `relative` to the sticky
   wrapper's `className` (line 245): `"sticky top-0 z-10 pb-2 pt-[--space-2xs]
   md:pt-6"` → `"relative sticky top-0 z-10 pb-2 pt-[--space-2xs] md:pt-6"`.
2. Remove `background`, `backdropFilter`, and `WebkitBackdropFilter` from the
   wrapper's `style` object, and remove `background-color, backdrop-filter`
   from its `transition` string, leaving only the `transform`/`opacity`
   transition shown in Target above.
3. Immediately after the wrapper's opening tag and before `<ScreenHeader
   .../>`, insert the new frost-layer `<div>` exactly as shown in Target
   above.

## Boundaries

- Do NOT change `isScrolled`/`isHeaderHidden`'s own computation (the scroll
  listener logic) — this plan only changes how those two booleans are
  rendered, not how they're derived.
- Do NOT change `ScreenHeader`'s own props or behavior.
- Do NOT touch the `inert={isHeaderHidden}` attribute or its placement — it
  stays on the outer wrapper.
- This is the one plan in this batch where adding a new DOM element is
  in-scope (an inert, `aria-hidden`, `pointer-events-none` decorative frost
  layer) — do not add any other markup beyond that single element.
- If the cited lines don't match the Problem snippet above (drift since
  commit `3ecf622`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npx tsc --noEmit` clean. `npm run build` clean.
- **Feel check**: open a tutorial, switch to All Steps view (Widget icon),
  then scroll down past the point where the header frosts, and back up.
  - The frost should still visually fade in/out exactly as before —
    same timing, same look, background blurring in behind the header text
    and Back/Search/Done buttons.
  - Scroll up and down repeatedly, reversing direction quickly several
    times, and confirm no visible stutter — this is the actual perf fix,
    though on a fast machine the difference may not be perceptible; the
    real check is in DevTools' Performance panel (see below).
  - In DevTools' Performance panel, record a few seconds of repeated
    up/down scrolling and confirm the frost's animated frames are handled
    by compositing (opacity) rather than triggering paint on every frame —
    look for "Paint" events tied to the header shrinking or disappearing
    compared to a pre-fix recording.
  - Confirm the header's buttons (Back, Search/Widget, Done) are still
    fully clickable and visually on top of the frost layer at every scroll
    position.
  - Toggle `prefers-reduced-motion` and confirm the frost's opacity crossfade
    still lands in the correct end state (collapsed to near-instant per the
    global rule, same as every other transition in this app).
- **Done when**: the sticky header's `background`/`backdropFilter` are no
  longer animated directly — only the new frost layer's `opacity` is — and
  the header's visual appearance and interactivity are unchanged from
  before this edit.
