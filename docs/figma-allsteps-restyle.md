# AllStepsView restyle — diff & implementation plan

**STATUS: DONE AND SHIPPED (2026-08-24), plus two follow-up rounds.** All
five confirmed changes below are implemented (tokens.css, ScreenHeader.tsx,
ActionButton.tsx, AllStepsView.tsx). Both stale-content items were also
resolved directly in Figma by the user before implementation — see their
own updated notes below. See "Follow-up round" further down for a second
pass of fixes (desktop scroll, gradient extent, letter-spacing, bottom
fade) reported after using the shipped version, and its own item 5 for the
third: sticky-header show/hide-on-scroll-direction with a frosted-glass
background, now also shipped.

This is the "fresh Figma pull"
that `docs/figma-step-screen-restyle.md` said `AllStepsView.tsx` needed
before any of that pass's changes could be safely extended to it ("still
on V2 styling... explicitly deferred by the user... don't extend any of
this plan's changes to `AllStepsView.tsx` without a fresh Figma pull to
confirm it matches"). That pull has now happened (node below). This doc
records the diff and the steps to close it.

Source: https://www.figma.com/design/6Mr7K0RONTS8SltZRJtqYj/Tech-Experimentation?node-id=702-2694
File key `6Mr7K0RONTS8SltZRJtqYj`.

## Node ID reference

| Frame | Node ID | Pulled |
|---|---|---|
| All_Steps--View | `702:2694` | Full design context + screenshot |

## Scope

Shell/token restyle only, same framing as the step-screen pass — no
content redesign. `AllStepsView.tsx` already reuses the shared
`ScreenHeader`, `ProductCard`, `CheckIndicator`, and `ActionButton`
components the step-screen pass (V5) already brought up to date, so most
of the per-product-row visuals (image size/radius, check icon, name/shade
typography, card shadow/radius, Finish button chrome) already match this
pull with no changes needed — confirmed line-by-line below. What's left
is specific to `AllStepsView.tsx` and `ScreenHeader.tsx`'s own
list-view-only behavior.

## Confirmed changes

### 1. Background gradient — wrong gradient family entirely — DONE

`AllStepsView.tsx`'s root currently paints `--gradient-bg-screen` (the
pinkish step-screen gradient: `#e6d6d1 → #f5e7de → #fbf7f5`), and its
sticky header hardcodes `#e6d6d1` as a solid backing color plus a
matching scroll-fade tail.

The fresh pull's own `Background` node (`702:2695`) is a completely
different, already-tokenized gradient:

```
bg-gradient-to-b from-[#f7e9ca] to-[#f9f3eb] to-[2.582%]
```

Same two hex values as the existing `--gradient-bg-home` token
(`linear-gradient(180deg, #f7e9ca 0%, #f9f3eb 7.179%)`, defined in
tokens.css for the home screen) — just a slightly different stop percent,
which is immaterial at these pixel heights (both fade out within roughly
the first 50-60px and are flat thereafter). AllStepsView should reuse
`--gradient-bg-home` rather than `--gradient-bg-screen`.

**Fix:**
- `AllStepsView.tsx` root: `style={{ background: 'var(--gradient-bg-home)' }}`.
- Sticky header's hardcoded `background: '#e6d6d1'` → `'#f7e9ca'` (the new
  gradient's own first stop, so the sticky header reads as a seamless
  continuation of the background at scroll position 0, not a mismatched
  patch).
- Sticky header's fade-tail gradient: `linear-gradient(180deg, #e6d6d1 0%, rgba(230,214,209,0) 100%)` → `linear-gradient(180deg, #f7e9ca 0%, rgba(247,233,202,0) 100%)`.

### 2. Header — back button incorrectly hidden on the list view — DONE

`ScreenHeader.tsx` currently renders an invisible `size-[40px]` spacer
instead of a real back button whenever `activeView === 'list'`, per a
comment explaining this was a V2-era assumption ("no back button on the
All Steps list view — it's reached by switching the toggle, so there's
nothing to go back from").

The fresh pull's `Top Header` (`702:2698`) shows a real back-arrow button
(`702:2699`, same `fi-rr-arrow-small-left` glyph/chip as the per-step
header) on the left, ahead of the Search/Widget toggle and the Done
button — same three-slot layout as `StepScreen`'s header, not a
two-slot-plus-spacer layout.

**Fix:** remove the `isListView ? <spacer> : <BackButton>` branch in
`ScreenHeader.tsx` and always render the real back button. No prop
plumbing needed — `TutorialFlow.tsx` already passes `onBack={handleBack}`
into `AllStepsView`, and `handleBack` already has sensible behavior from
this view (steps back one step in the flow, or exits if already at step
1); it's only ever been visually unreachable from here.

### 3. Per-step description text — missing entirely — DONE

Every group in the fresh pull has a `Header + Description` block
(e.g. `704:3241`) containing both the short title/badge row **and** the
step's instruction sentence directly beneath it (12px,
`rgba(44,41,38,0.5)`, Inter Medium — same "dimmed caption" treatment
already used for the badge/steps text next to it).

`AllStepsView.tsx` currently renders only the title + badge row; the
description is never read from `STEP_CONTENT[step].description` at all
in this view (it's already there in the data, just unused here — see
`ProductCard`'s sibling per-step screen for the equivalent text on
`StepScreen`, which uses a different, larger treatment for its own
single top-of-screen title).

**Fix:** add a `<p>` under the title/badge row, before the products list,
styled at 12px / `rgba(44,41,38,0.5)` (i.e. `--color-text-primary` +
`opacity-50`, matching the badge's own established pattern in this same
file) / `--font-weight-medium`, rendering `content.description`.

### 4. Group title — wrong opacity, weight, size, and tracking — DONE

Current: `opacity-50`, `--font-weight-semibold` (600),
`--font-size-step-title` (16px, shared with `StepScreen`'s big title), no
letter-spacing.

Fresh pull (`704:2880`, "Concealer"): full-opacity `#2c2926` (no dimming
at all), `font-['Inter_18pt:Medium']` (500, not 600), `text-[15px]`,
`tracking-[-0.3px]`.

**Fix:**
- Drop `opacity-50` from the title `<p>`.
- Change `fontWeight` from `--font-weight-semibold` to
  `--font-weight-medium`.
- Introduce a dedicated size token (don't repoint
  `--font-size-step-title` — that 16px value is shared with, and already
  confirmed correct for, `StepScreen`'s own top title). Suggest
  `--font-size-list-group-title: 15px;` in tokens.css, next to the
  existing `--font-size-*` block.
- Add `letter-spacing: -0.3px` (either a new
  `--letter-spacing-list-group-title` token, matching the existing
  `--letter-spacing-tight`/`--letter-spacing-shade` naming convention, or
  inline — existing tokens are all named per-usage rather than by value,
  so a new token matches the file's own convention better than reusing
  `--letter-spacing-tight`, which is a different value: -0.14px).

### 5. "N/7 steps" badge + label — wrong opacity and badge background — DONE

Current: both the numeral pill and the "steps" label apply Tailwind's
`opacity-50` on top of `--color-text-primary` (`#2c2926` at full alpha),
and the pill background is `--color-badge-bg` = `rgba(44,41,38,0.05)`.

Fresh pull (`704:2883`-`704:2885`): pill background is
`rgba(44,41,38,0.1)` (10%, double the current token), and *both* text
runs are already `rgba(44,41,38,0.8)` — i.e. the 80%-alpha is baked into
the color itself, with no additional opacity utility stacked on top. The
current code's extra `opacity-50` on top of a solid color reads at
roughly 40% effective darkness — noticeably lighter than the intended
80%.

**Fix:**
- Remove `opacity-50` from both the badge `<span>` and the "steps"
  `<span>`; set their color directly to `rgba(44,41,38,0.8)` (or a new
  token, since `--color-text-primary` is the *solid* ink and this needs
  the pre-dimmed 80% variant — e.g. reuse `--color-text-product`, which
  is already exactly `rgba(44, 41, 38, 0.8)` and currently only used by
  `ProductCard.tsx`).
- Bump the badge pill's background. `--color-badge-bg` (5%) is shared
  with `StepScreen`'s own top-of-screen "N/7 steps" badge, which *was*
  separately confirmed during the V5 pass — don't repoint that shared
  token. Either add a new `--color-badge-bg-list` (10%) token for this
  instance, or confirm with a side-by-side screenshot whether
  `StepScreen`'s badge should *also* be 10% (i.e. the 5% value was never
  actually re-checked against a badge-specific pull). Recommend the new
  token unless that check says otherwise, since `StepScreen`'s badge was
  the one node V5 explicitly pulled and verified.

## Stale-content notes — flagged, then fixed directly in Figma

Both items below were flagged in the original version of this doc as
Figma content that looked stale/duplicated and shouldn't be blindly
copied into code. The user fixed both directly in the Figma file rather
than having the app diverge from it; a second `get_design_context` pull
confirmed both, so the values below are now taken at face value like
every other finding in this doc.

### "Depth Shadow" (step 3) description — was a duplicate of "Blend"'s, now fixed

Originally, the pull's step-3 description text (`704:3261`) was
byte-for-byte identical to step 4's (`704:3271`) — a copy/paste artifact.
The re-pull now shows step 3 reading *"Using a smaller brush, sweep a
darker shade into the outer corner and crease with a back-and-forth
motion."* — which matches `stepContent.ts`'s existing copy exactly (that
copy was already independently verified in the V5 pass), so no code
change was needed here; the fix landed entirely on the Figma side.

### AllStepsView's own "Finish" button — was pre-V5 colors, now V5 colors plus a new pill radius

Originally `bg-[#0e0b06]` / `text-[#f9f1ec]` — the pre-V5 flat-black
palette, while the shared `ActionButton` component already carried the
V5 colors (confirmed against Step 7's own pull in the earlier pass). The
re-pull now shows `bg-[#2c2926]` / `text-white` — matching `ActionButton`'s
existing defaults exactly, so no color change was needed there either.

One genuine new change did come out of the re-pull, though:
**`border-radius: 24px`** (was `12px`), a real pill shape at this
button's 44px height (`--height-action-button`), and different from
`StepScreen`'s own step-7 Finish button, which stays at the shared
component's default 12px. Implemented as a per-call-site style override
on `ActionButton` (see its own doc comment) rather than changing the
component's default, so `StepScreen`'s Finish is unaffected.

## Already correct — no change needed

Confirmed identical (or within established rounding tolerance) to the
fresh pull, all via already-shared, already-V5-verified components:

- Product row layout, image size (56×63 vs pulled 57×64), image radius
  (8px), hairline border color, brand/name typography and weights, shade
  line styling and opacity.
- Checked/unchecked check-circle size (36px), stroke widths, checkmark
  glyph.
- Card container: white surface, 20px radius, `p-4` padding, and the
  exact shadow value (`0px 0px 8px 2px rgba(14,11,6,0.03)`).
- Header icon set, sizing, and frosted-chip chrome (`fi-rr-arrow-small-left`,
  `fi-rr-search`, `fi-rr-list-check`, `fi-rr-check`) — only the
  *visibility* of the back button (item 2 above) is wrong, not its shape.
- Vertical gap between step groups (`gap-10` / 40px).
- Horizontal card inset (`px-[--space-xs]` / 12px).

## Implementation plan — all steps done

1. **tokens.css**: added `--font-size-list-group-title: 15px`,
   `--letter-spacing-list-group-title: -0.3px`, and
   `--color-badge-bg-list: rgba(44,41,38,0.1)`. Updated the
   `--gradient-bg-screen`/`--gradient-bg-home` comments so neither still
   claims AllStepsView shares the step-screen gradient.
2. **`ScreenHeader.tsx`**: removed the list-view spacer branch; the back
   button now always renders.
3. **`ActionButton.tsx`**: added an optional `style` prop, merged on top
   of the variant's computed style, so a single call site can override
   without touching the shared default.
4. **`AllStepsView.tsx`**:
   - Root background → `var(--gradient-bg-home)`.
   - Sticky header's solid background + fade-tail gradient →
     `#f7e9ca`-based colors.
   - Group's title/badge/description restructured into one "Header +
     Description" wrapper (own `pb-4`) so spacing matches Figma's nested
     padding + gap, with the description `<p>` added, the title's
     classes/style updated (item 4), and the badge/"steps" spans updated
     (item 5).
   - Finish button gets `style={{ borderRadius: 24 }}` via the new
     `ActionButton` override.
5. **Verified** in the browser preview against the Figma screenshot for
   `702:2694` (background, header back button, per-group descriptions,
   title/badge weight and opacity, Finish button shape) — see the
   screenshot sent alongside this doc's implementation.
6. **`docs/figma-step-screen-restyle.md`**'s top-of-file note updated to
   point at this doc instead of reading as still-deferred.

## Boundaries

- No changes to `StepScreen.tsx`, `EyeIllustration.tsx`, or the
  per-step flow — this pull only covers the All Steps list frame.
  `ActionButton`'s own default styling (used by `StepScreen`'s step-7
  Finish) is untouched; only `AllStepsView`'s call site overrides it.
- No changes to `stepContent.ts` copy — the Figma-side duplicate was
  fixed at the source instead (see stale-content note above).
- No changes to product images, check-icon assets, or card shadow/radius
  — already correct.

## Follow-up round — user-reported gaps after using the shipped version

Five items reported after living with the shipped version; four fixed
here, the fifth (sticky-header show/hide-on-scroll-direction) tracked
separately per the user's own call to split it out — it's a distinct
interaction pattern, not a diff-against-Figma fix like the rest of this
doc.

### 1. Desktop: couldn't scroll the list at all — DONE, real bug, not desktop-only in effect

Root cause was in `App.tsx`, not `AllStepsView.tsx`: its outermost
wrapper had `overflow-x-hidden` with no matching `overflow-y` class. Per
the CSS Overflow spec, setting only one axis silently promotes the
*other*, still-default axis from `visible` to `auto` — this wrapper
became an accidental (empty-range) scroll container. Below the `md`
breakpoint it's `min-h-dvh` with content that exactly fills it, so the
accidental `auto` never had anything to scroll and stayed invisible; at
`md:justify-center md:py-10` (desktop), a real mouse-wheel gesture over
the app got captured by that empty scroll range instead of ever reaching
`AllStepsView`'s own nested `overflow-y-auto` list. Fixed by switching
`overflow-x-hidden` to the `overflow-hidden` shorthand (hides both axes).
Verified: patching just `overflow-y` to `hidden` at runtime fixed a real,
reproducible wheel-scroll test before the code fix landed; confirmed
again after.

### 2. Background gradient didn't extend correctly over the taller list — DONE

`--gradient-bg-home` was reused directly, including its `7.179%` second
stop — a percentage relative to *that* token's own (single-viewport-tall)
element. The user's Figma source sizes the background to the full
flattened list export (2065px, covering every group), so its equivalent
stop is a much smaller `2.582%` — same actual pixel distance (~53px) from
the top, just expressed against a much taller element. Reusing the home
screen's percentage as-is would have measured that percentage against
AllStepsView's own shorter root instead, landing the fade noticeably
earlier than intended. Fixed with a new `--gradient-bg-list` token using a
fixed `53px` second stop instead of a percentage, so the fade covers the
same real distance from the top regardless of the element's own height —
robust by construction, not dependent on matching container heights
between screens.

### 3. Letter-spacing: description too loose, titles too tight — DONE

Re-pulled node `702:2694` after the user adjusted both in Figma:
- Group title: `-0.3px` → `-0.15px` (less negative = more open).
  `--letter-spacing-list-group-title` updated.
- Per-group description: unset (`0`) → `-0.12px` (tighter). Also applied
  to the "N/7 steps" badge/label, which picked up the same `-0.12px` in
  the same re-pull — all three (shade line, description, badge/label)
  turned out to share one Figma text style ("BeautyNotes/p-12"), so this
  reuses the existing `--letter-spacing-shade` token rather than adding a
  near-duplicate.

### 4. Bottom fade overlay stayed visible past the true end of the list — DONE

The fade-hint overlay (rounded bottom corners + white fade) is pinned to
the viewport bottom as a sibling of the scroll region, not inside it —
correct for "hint more content below," wrong once the list is actually
scrolled all the way to its real end, where it just sat over the card's
already-flat white bottom edge as a stray rounded-corner band (reported as
seeing rounded corners at the end of the page). Fixed with the same
"derive from live scroll position" pattern the header's own top fade tail
already uses: a `hasReachedBottom` state (±1px tolerance for sub-pixel
rounding), computed on every scroll event and once up front via
`useLayoutEffect` (covers a list short enough to start already at the
bottom, since `onScroll` never fires without an actual scroll gesture),
fading the overlay's opacity to 0 once reached — same opacity-transition
treatment as the header's tail, not an abrupt hide.

### 5. Sticky header: hide on scroll down, reappear on scroll up — DONE, with a frosted-glass treatment

Explicitly flagged by the user as possibly worth its own pass rather than
folding into the round above. Design decisions below, then an
implementation sketch.

**Scope: `AllStepsView.tsx` only, not `ScreenHeader.tsx` globally.**
`ScreenHeader` is shared with `StepScreen`, but `StepScreen` has no
scrollable region at all (fixed single-viewport layout, reserved-height
product sheet) — there's nothing for a scroll-driven header to react to
there. Building this as `AllStepsView`-local state driving a style
override on the existing sticky wrapper (the same pattern already used
for the Finish button's radius override) keeps `StepScreen` untouched,
same reasoning as every other AllStepsView-only change in this doc.

**Trigger logic — asymmetric thresholds, not a raw "any scroll" toggle.**
A header that hides on any single pixel of downward movement (or reveals
only after a large upward one) reads as jittery under real trackpad/mouse-
wheel input, which fires many small, noisy scroll events per gesture, not
one clean delta. Standard fix, and what's proposed here: compare each
scroll event's position to the *previous* one (not to a fixed origin),
with different thresholds for hiding vs. revealing:

- **Hide** once cumulative downward movement since the last state change
  exceeds ~12px — small enough to feel responsive, large enough to ignore
  single-event noise.
- **Reveal** on much less upward movement (~4px) — deliberately easier to
  bring back than to dismiss, the standard convention for this pattern
  (iOS Safari, Twitter/X, Medium): a user who starts scrolling back up is
  almost always looking for the header (search/list-toggle/back), so it
  should come back fast, not need convincing.
- **Always visible near the top** — forced visible whenever `scrollTop` is
  at or below roughly one header height (~64px), regardless of direction,
  so a small scroll right at the very top of the list can never hide it.
  This reuses the same "near the top" zone `isScrolled` already tracks.

These three numbers (12px / 4px / 64px) are starting points to tune by
feel once it's actually scrolling on a real device — same "ship a first
guess, adjust after looking at it" approach this codebase's other
hand-tuned values went through (WASH_TUNING in StepScreen.tsx, the
removed MotionTuner/WashTuner dev panels), not values to treat as final.

**Visual treatment.** The existing sticky wrapper (header row + its fade
tail, already one unit) gets `transform: translateY(-100%)` + `opacity: 0`
when hidden, `translateY(0)` + `opacity: 1` when visible, transitioned on
`var(--duration-base)`/`var(--ease-out-quart)` — the same duration/easing
pair already used for this same wrapper's existing fade-tail opacity
transition, for consistency rather than inventing new timing. `transform`
over `display`/`height` toggling: `position: sticky` elements keep their
normal-flow footprint regardless of a transform applied to them, so
translating won't reflow the list underneath or fight with the scroll
container's own `scrollHeight` math (no risk of the hide/show itself
triggering more scroll events). While hidden: `pointer-events: none` plus
the `inert` HTML attribute (removes the header's buttons from tab order
and blocks interaction while off-screen — cleaner than manually managing
`tabIndex` on each of the four header buttons individually).

**Reduced motion: no extra handling needed.** This uses a plain CSS
`transition`, not Framer Motion — index.css's global
`prefers-reduced-motion` rule already collapses every `transition-duration`
to ~0 app-wide (confirmed: `transition-duration: 0.01ms !important` under
`@media (prefers-reduced-motion: reduce)`). The hide/show *behavior*
itself stays (it's functional, not decorative — same reasoning StepScreen
already applies to card fades vs. slides), it just snaps instead of
sliding, automatically, with no bespoke `useReducedMotion()` check.

**Implementation sketch** (in `AllStepsView.tsx`, alongside the existing
`isScrolled`/`hasReachedBottom` state):

```ts
const HEADER_HIDE_MIN_SCROLL = 64  // px — always visible at/under this
const HEADER_HIDE_DELTA = 12       // px downward since last event, to hide
const HEADER_REVEAL_DELTA = 4      // px upward since last event, to reveal

const lastScrollTopRef = useRef(0)
const [isHeaderHidden, setIsHeaderHidden] = useState(false)

function updateScrollState(el: HTMLDivElement) {
  const { scrollTop } = el
  const delta = scrollTop - lastScrollTopRef.current
  lastScrollTopRef.current = scrollTop

  setIsScrolled(scrollTop > 0)
  setHasReachedBottom(el.scrollHeight - scrollTop - el.clientHeight <= 1)

  if (scrollTop <= HEADER_HIDE_MIN_SCROLL) setIsHeaderHidden(false)
  else if (delta > HEADER_HIDE_DELTA) setIsHeaderHidden(true)
  else if (delta < -HEADER_REVEAL_DELTA) setIsHeaderHidden(false)
  // else: small delta, leave the current state alone (avoids jitter)
}
```

folded into the existing `updateScrollState` function (already called from
both `onScroll` and the mount-time `useLayoutEffect`), with the sticky
wrapper's `style` reading `isHeaderHidden` for the transform/opacity/
pointer-events/`inert` values described above.

**Open item for verification, not for before starting:** the 12px/4px/
64px thresholds above are a reasoned starting guess, not measured against
a real device — plan to sanity-check the feel on an actual trackpad scroll
once built (the same "wrote a number, then looked at it" loop as items
1-4 in this doc) rather than treating them as settled.

**Shipped, with one deliberate deviation from the plan above:** all of the
trigger logic, transform/opacity/`inert` treatment, and implementation
sketch landed exactly as planned (`AllStepsView.tsx`'s `updateScrollState`
now also owns `isHeaderHidden` alongside `hasReachedBottom`). The one
addition: the user asked for a frosted-glass look on the header itself,
not sourced from Figma (this frame's own header pull is a flat opaque
`#f7e9ca`) — an explicit "try your best" request. Implemented as two new
tokens, `--color-list-header-bg` and `--blur-list-header` (`16px`),
applied via `background` + `backdropFilter`/`WebkitBackdropFilter` on the
sticky wrapper.

**First pass, then a same-day color correction.** The first pass reused
the page's own cream (`rgba(247, 233, 202, 0.72)`) for
`--color-list-header-bg`, plus a fade-tail strip below the header (same
cream, fading to transparent) carried over from the pre-frosted design.
Once live, the user reported both reading as an unwanted yellow tint/
gradient rather than a neutral frost, and asked for white instead. Fixed
by: (1) changing `--color-list-header-bg` to `rgba(255, 255, 255, 0.72)`
— same alpha, white base; (2) removing the fade-tail element entirely,
along with the now-unused `isScrolled` state that only ever drove its
opacity — not recoloring it, since the user said "remove." The tail
existed to blend a *flat* header color into scrolled content; now that
the header itself is translucent and blurred, that blend already happens
via the backdrop-filter, so the tail was redundant on top of it once
reconsidered, not just recolored away. `--blur-list-header` (16px)
unchanged. Both remaining values are still starting guesses, not
measured — the user's own framing ("if it doesn't work out, I'll design
something") already anticipated another look being needed.

Verified in-browser (fresh dev-server + browser-tab restart, after an
unrelated stale-HMR console error briefly resurrected the just-deleted
`isScrolled` reference — confirmed gone from source via a full-repo grep,
and gone from a clean reload): `background-color: rgba(255, 255, 255,
0.72)`, `backdrop-filter: blur(16px)`, no `.top-full.h-8` tail element in
the DOM, no console errors, hide/show + `inert` behavior (including the
desktop wheel-scroll path fixed in item 1) all still check out together.

**Second same-day correction: the frost should only apply once scrolled.**
The previous pass made the frost always-on, including at rest (scrollTop
0) — but at rest the header is the first thing in the document, nothing's
scrolled up underneath it yet, so a permanent translucent-white wash there
just read as a flat haze over the page's own gradient background, not a
glass effect over content. Fixed by reintroducing `isScrolled` (`scrollTop
> 0`, same trigger the old fade-tail used before it was removed) and
gating both `background` and `backdropFilter` on it: transparent + no blur
at rest, `--color-list-header-bg` + `blur(--blur-list-header)` once
scrolled. The off-state blur is `blur(0px)`, not `none` — both render
identically, but only the former lets `backdrop-filter` actually animate
in the transition (`none` and a `blur()` function aren't interpolatable,
so it would snap instead of fade). `background-color`/`backdrop-filter`
added to the wrapper's existing transition alongside `transform`/`opacity`
so the frost fades in/out smoothly rather than popping. Verified: computed
styles show `rgba(0, 0, 0, 0)` / `blur(0px)` at `scrollTop: 0` and
`rgba(255, 255, 255, 0.72)` / `blur(16px)` once scrolled, returning
cleanly to transparent on scrolling back to the top; no console errors.

**Third same-day correction: frost color, again.** After testing white
live, the user switched their mind: `--color-list-header-bg` is now
`rgba(249, 243, 235, 0.72)` — not an arbitrary pick, it's exactly
`--gradient-bg-list`'s *second*, settled-flat stop (`#f9f3eb`, what the
page background actually is everywhere past its top ~53px fade), so the
frost now tints toward the same color the content behind it already sits
on. Same 72% alpha as both prior passes.

**Fourth: stray rounded corner visible while scrolling — DONE, real bug
introduced by the hide/show feature.** Reported as "I see top rounded
corners to the header or to the top background sometimes while scrolling
down or up." Root cause: `HEADER_HIDE_MIN_SCROLL` (64px, "roughly one
header height") was sized to the header's own height but not checked
against what comes right after it in document flow — the white card,
whose own rounded top corner (`--radius-card`, 20px) starts immediately
following the header with no gap. That put the corner's document position
(~64-92px) *inside* the range where hiding was already allowed. Hiding is
a `translateY`, not a layout change, so whatever the document actually has
at y=0 once the header's box slides away is whatever's really there — if
that happened to be the card's curved corner, it would poke up at the top
of the viewport, read as a rendering glitch. This could only happen once
the header could move at all, i.e. it's a direct side effect of adding
hide/show, not a pre-existing issue. Fixed by raising
`HEADER_HIDE_MIN_SCROLL` to 120px, comfortably past the corner's range on
both breakpoints (mobile header ~64px tall, desktop ~72px) with a safety
margin. Verified: forcing `scrollTop` to 80 (inside the old danger zone,
below the new threshold) after scrolling past it and back keeps the header
fully visible (`opacity: 1`, identity transform) — it can no longer hide
at that position at all — while hiding at `scrollTop: 300` (well past the
new threshold) still works as before.
