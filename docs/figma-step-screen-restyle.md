# Figma step-screen restyle — diff & implementation plan

**STATUS: DONE AND SHIPPED (2026-08-24).** Everything below the original
plan (tokens, `ScreenHeader`, `ProductCard`, `ActionButton`,
`CheckIndicator`, `StepScreen`) is implemented and verified — see the nine
numbered "follow-up round" sections further down for what actually needed
correcting after the initial diff/implementation (there were real gaps;
don't treat the top-level "Confirmed changes" section as the final word on
its own — the `### Header` section specifically is superseded twice over,
see its own inline warning). **If you just need current values, not
history**: final noise mask is top-58px/h-250px/w-300px/opacity-0.4/
soft-light/0.9x grain scale (`StepScreen.tsx`); header icons are inline SVG
path data at native size, no external files (`ScreenHeader.tsx`); eye
illustration render size tracks `EyeIllustration.tsx`'s
`REFERENCE_RENDER_WIDTH = 195.5742950439453`; the Search/Widget toggle is
one persistent sliding highlight using an inset `box-shadow` (not
`border`), animated across the Search⇄Widget screen swap via the browser's
View Transitions API (`TutorialFlow.tsx`'s `switchViewWithTransition`) —
see the ninth follow-up round for the full current picture, not the
"### Header" section above it. `AllStepsView.tsx` was never touched by
this pass — was still on V2 styling until a later, dedicated pass closed
that gap; see `docs/figma-allsteps-restyle.md`, which also documents
several of the later header-toggle rounds' user-facing impact on that
screen specifically.

Source: https://www.figma.com/design/6Mr7K0RONTS8SltZRJtqYj/Tech-Experimentation
File key `6Mr7K0RONTS8SltZRJtqYj`.

This documents a new Figma iteration over the tutorial step screens — sizing,
spacing, and color refinements the user made on top of the shipped V2 shell +
its later V3 spacing pass (`docs/figma-v2-redesign.md`, `docs/handoff.md`).
Written down here rather than left only in chat, same reasoning as
`figma-v2-redesign.md`'s own opening note.

**Scope, confirmed before writing this plan** (see chat): this is a shell/
token restyle, not a content redesign. Copy and eye-illustration data are
unchanged (verified below) — every real diff lives in shared components
(`ScreenHeader`, `ProductCard`, `CheckIndicator`, `ActionButton`,
`StepScreen`) and `tokens.css`, all of which every step already routes
through. **The All Steps list view is explicitly out of scope for this
pass** — the user wants to look at it separately later; don't extend any of
this plan's changes to `AllStepsView.tsx` without a fresh Figma pull to
confirm it matches (its card/button/header all reuse the same shared
components this plan touches, so it will inherit some of this automatically,
but its own layout hasn't been re-verified).

## Node ID reference

| Frame | Node ID | Pulled |
|---|---|---|
| Step_1 | `685:4149` | Full design context |
| Step_7 | `693:6908` | Full design context |
| Step_8 (done screen) | `693:7162` | Full design context |
| Steps 2-6 | not pulled | Not needed for this pass — see "Why steps 2-6 weren't pulled" below |
| All_Steps--View | not pulled | Explicitly deferred by the user |

## Why steps 2-6 weren't pulled initially (later fully pulled — see below)

Two independent checks against Step 1 confirmed this is a global shell
pass, not per-step content changes, so three sample frames (1, 7, 8 —
first, last-with-products, and the terminal state) were treated as enough
to be confident the *shell/token* diff (colors, spacing, header, card
shape) generalizes:

1. **Copy is byte-identical** to what's already in `stepContent.ts` and to
   `figma-v2-redesign.md`'s own per-step copy table (e.g. Step 7's title
   "Finish with Eyeliner and Mascara" and its full description sentence
   match exactly).
2. **Eye illustration data is unchanged.** Step 1's pulled percentages match
   `docs/handoff.md`'s historical V2 capture (e.g. Sclera inset `62% 3.89%
   0.7% 17.58%`) almost to the decimal. Step 7/8's pulled layer names
   (`[Change] Above Crease`, `[Add] Above-Eyeliner`, etc.) and percentages
   are new data neither previously captured nor part of this pass's scope —
   noted as a bonus under "Out of scope" below, not something this plan
   touches.

**Update — steps 2-6 were pulled anyway**, after the user linked the whole
"Tutorial" section (node `693:7331`) and reported not seeing an expected
change, suspecting the product-sheet copy. All five (`687:5055`, `688:5464`,
`691:6171`, `693:6367`, `693:6649`) were fetched and diffed against
`stepContent.ts`:

- **Titles, descriptions, brand/name/shade text all matched exactly** — the
  hand-pasted copy (see that file's own comment) was correct. Not what the
  user was seeing.
- **The real mismatch was `checked`, not copy.** Figma shows the first
  product pre-checked on every step that has one (1, 2, 3, 5, 7 — steps 4
  and 6 only have a single product, sitting in the design's own "Product 2"
  layout slot, and that slot is never pre-checked). `stepContent.ts` only
  had this reflected for steps 1 and 7 (the two frames originally sampled)
  — steps 2/3/5's first product was `checked: false`, wrong. Fixed directly
  in `stepContent.ts`, all three now `checked: true`; verified in the
  browser preview on all three steps.

This also means the shell-generalization claim above is now fully
confirmed by direct pull, not just inferred from three samples — every
step's colors/spacing/header/card-shape structure matches what Steps 1/7/8
showed (same `#2c2926` tokens, same edge-to-edge top-corner-only card, same
header chrome throughout).

## Confirmed changes

### Global color — bring the tutorial flow onto the V4 ink token

The step screens are still on the V2 ink color (`#0e0b06`) and its
`--color-*` tokens. This pass moves them onto **`#2c2926`** — the same ink
color the home screen already adopted in its own V4 pass
(`--color-tutorial-card-text` in `tokens.css`). Most of the new colors below
aren't new tokens to invent; they're existing V4 tokens (or the same base
hex at a new alpha) that the step screens simply haven't been using yet.

| Token | Current | New |
|---|---|---|
| `--color-text-primary` | `#0e0b06` | `#2c2926` — reuse `--color-tutorial-card-text` rather than duplicate the hex |
| `--color-badge-bg` | `rgba(14, 11, 6, 0.07)` | `rgba(44, 41, 38, 0.05)` |
| `--color-border-hairline` | `rgba(14, 11, 6, 0.05)` | `rgba(44, 41, 38, 0.2)` — real contrast increase, not just a recolor |
| `--color-action-button` | `rgba(14, 11, 6, 0.04)` | `rgba(44, 41, 38, 0.05)` |
| `--color-action-button-border` | `rgba(14, 11, 6, 0.05)` | `rgba(44, 41, 38, 0.2)` |
| `--color-action-button-final-bg` | `#0e0b06` | `#2c2926` |
| `--color-action-button-final-text` | `#f9f1ec` | `#ffffff` (Step 7's Finish button is literally `text-white`, not the old off-white) |

**Not touched**: `--shadow-card`'s color stays `rgba(14, 11, 6, 0.03)` — the
pulled product-card shadow keeps the old ink base even though everything
else moved to `#2c2926` (confirmed on both Step 1 and Step 7 — same value
both places, so not a fluke). See "Product card" below for the shadow's
actual value change (blur/spread only, not color).

### Screen background gradient — missed in the first pass, caught in implementation

All three pulled frames' background is `linear-gradient(180deg, #f7e9ca 0%,
#f9f3eb 7.179%)` — a completely different 2-stop gradient family from the
current `--gradient-bg-screen` (`#e6d6d1 0% → #f5e7de 35.561% → #fbf7f5
77.86%`, 3-stop). This is **exactly** `--gradient-bg-home`, the token the
home screen's own V4 pass already defined — another value to reuse, not
invent.

`--gradient-bg-screen` is shared with `AllStepsView.tsx`, which also
hardcodes that token's start color (`#e6d6d1`) into its sticky header as a
separate literal — repointing the shared token itself would silently break
that (deferred, unreviewed) screen. Fix applied at the consumer, not the
token: `StepScreen.tsx`'s own inline `style` now reads `var(--gradient-bg-home)`
directly instead of `var(--gradient-bg-screen)`.

> **⚠ The last sentence here was wrong, and stayed wrong for a while.**
> "`--gradient-bg-screen` itself is untouched, still exactly what
> `AllStepsView` expects" turned out not to be true: when `AllStepsView`
> finally got its own fresh Figma pull (`docs/figma-allsteps-restyle.md`),
> it needed the *cream* family too, not this pink one — the same move
> just made here for `StepScreen`, independently discovered later without
> either doc cross-referencing the other at the time. `--gradient-bg-screen`
> has had zero real consumers since this pass shipped; see its own
> `deprecated` comment in tokens.css.

### Title + description contrast — DONE

Real legibility change, not just recoloring:

- Title: `opacity-50` → **full opacity**, color `#2c2926`.
- Description: `opacity-40` → **`opacity-80`** (`rgba(44,41,38,0.8)`), color
  `#2c2926`.

Confirmed identically on Step 1, Step 7, Step 8, and (once steps 2-6 were
pulled — see the "Why steps 2-6 weren't pulled" update above) every other
step too.

**Two more real misses caught only once this was actually implemented**
(the user reported the text still reading faded after step 1's token work
landed, which is what surfaced these — they weren't visible from the
tokens-only diff, only once `StepScreen.tsx`'s own hardcoded classes were
checked against the pull):
- Description font-size was `--font-size-step-description: 14px`, Figma is
  `12px`.
- Description font-weight was hardcoded to `--font-weight-regular` (400) —
  wrong; Figma's title and description share one `Inter Medium` (500)
  wrapper, so the description was never actually meant to be Regular.

Both fixed: the token dropped to `12px` (confirmed unused by `AllStepsView`
via grep, safe to change directly — unlike `--font-size-step-title`, which
that deferred screen still shares, so its own `opacity-50` there was left
untouched on purpose), and `StepScreen.tsx`'s description now reads
`--font-weight-medium`. Verified via computed-style check in the browser:
title `opacity:1, 16px, 500, rgb(44,41,38)`; description `opacity:0.8,
12px, 500, rgb(44,41,38)` — exact match.

### "Graph + Step" spacing — DONE

- Outer padding: `p-[24px]` — unchanged from the current V3 spacing pass
  (node `615:3037`).
- **Gap between badge / illustration / title block: `28px` → `40px`.** A
  real increase back toward the pre-V3 number, not a revert to V3's own
  tighter value — don't assume this is V3 being undone entirely, just this
  one gap.

Verified via computed style (`row-gap: 40px`) and visually across steps 1,
2 (shade-line layout), 7, and 8.

### Header — DONE

- **Back and Done buttons gain visible chrome.** Currently bare icon-only
  buttons (`rounded-[--radius-pill]`, no background). New: a frosted circle
  — `background: rgba(255, 255, 255, 0.6)`, `border: 0.5px solid rgba(44,
  41, 38, 0.2)`, `border-radius: 12px` (not fully round — a rounded square,
  same radius as the toggle buttons below). These are exactly
  `--color-header-icon-bg` / `--color-header-icon-border`, the tokens the
  home screen's V4 header icons already use — reuse them here rather than
  add new ones.
- **Search/Widget toggle is restructured, not just recolored** (confirmed
  by chat — rebuild, don't reskin). Current: a `rounded-full` 85×40 pill
  with one 40px circle that *slides* between two fixed centers on toggle (a
  CSS `animation`, since `ScreenHeader` remounts on every view switch — see
  its own long comment on why `transition` doesn't work here). New: **two
  adjacent `rounded-[12px]` (not round) buttons**, each 40×40, sitting
  inside a `rounded-[12px]` container with `background: rgba(255, 255,
  255, 0.6)` (not the current pill's `rgba(255,255,255,0.2)`). The *active*
  button gets its own `rgba(255,255,255,0.6)` bg + `0.5px
  rgba(44,41,38,0.2)` border (identical chrome to the Back/Done buttons
  above); the inactive one has no bg/border at all — same
  `opacity-30`-when-inactive pattern already documented in
  `figma-v2-redesign.md`, just a different container shape.

  This is a real rebuild of `ScreenHeader.tsx`'s toggle, not a token swap —
  executed as such. `header-toggle-slide`/`header-toggle-fade` (index.css)
  are gone; each button now conditionally renders its own active-state
  chip as a separate absolutely-positioned overlay `<span>`, reusing
  `check-ring-in` directly (CheckIndicator's own "ring settling in"
  keyframe — same shape of motion, no new keyframe needed) rather than the
  icon-fade approach speculated here originally. **One real correction
  made during implementation**: this section originally assumed the old
  `opacity-30`-when-inactive icon treatment (figma-v2-redesign.md) would
  carry over — it doesn't. None of this pass's pulls show an opacity class
  on the inactive CTA (checked across Step 1, 2, 3, 5, 6, 7), so both icons
  now render at full opacity regardless of active state; only the frosted
  chip's presence/absence signals which is active. Chrome for all
  standalone/active buttons (Back, Done, active Search/Widget) reuses
  `--color-header-icon-bg`/`--color-header-icon-border`/
  `--radius-filter-chip` directly via a shared `HEADER_CHIP_STYLE` constant
  — the exact same tokens `HomeScreen.tsx` already uses for its own header
  icons, not new values.

  Verified in the browser: toggling Search⇄Widget correctly animates the
  chip in on the newly-active button and removes it instantly (no exit
  animation, matching the "chip only ever enters" design) from the other;
  Back button reappears/disappears correctly across the toggle; Back and
  Done both still fire their real handlers (return to Home, confirmed both
  ways). `tsc -b` shows no new errors (pre-existing `TutorialCard.tsx`
  errors only, unrelated to this file).

  **⚠ Superseded — this whole toggle description is now historical, not
  current.** Everything above (two independently-mounting active-state
  `<span>` chips, `check-ring-in` reused directly, "chip only ever enters,
  removes instantly") describes the toggle as it shipped in *this* pass —
  it went through a full second rebuild later, across the sixth through
  ninth follow-up rounds below, into a completely different architecture:
  one persistent sliding highlight `<div>` (not two conditionally-mounted
  spans), an inset `box-shadow` instead of a real `border` (a rendering
  bug, not a style choice), press-feedback scaling only the icon glyph
  instead of the whole button, and — because Search/Widget turned out to
  switch entire mounted screens, not toggle state within one — the actual
  cross-screen slide is driven by the browser's View Transitions API
  (`TutorialFlow.tsx`), not a CSS `transition` on the toggle itself. If
  you need to know how the toggle actually works today, skip straight to
  the ninth follow-up round; nothing in this section reflects the current
  code.

### Product card container — DONE

- **Corner radius: all 4 corners `20px` → top corners only, `32px`.**
  `rounded-t-[32px]` (Tailwind's `rounded-t` sets both top corners in one
  utility). Kept inline rather than promoted to a shared token, since
  `AllStepsView.tsx` still legitimately uses `--radius-card` (20px, all 4
  corners) as-is — grep-confirmed, untouched.
- **Bottom gap dropped, but sides are NOT edge-to-edge — a correction from
  how this was originally written above.** The original diff said "drop
  the `px-[--space-xs] pb-4` wrapper" as if both were going away; Figma's
  actual pulled markup only drops the *bottom* padding (`pb-4` → nothing,
  card is flush with the wrapper's own bottom edge) — the wrapper's
  `px-[--space-xs]` (12px each side) is **unchanged**, confirmed present in
  every pulled step's "Products" node. Caught before implementing, not
  after — the code only removes `pb-4`. Verified via `getBoundingClientRect`
  in the browser: `gapBelowCard: 0`, `sideInset: 12` (px) on the live card.
- **Shadow: blur/spread shrinks.** `0px 0px 16px 4px rgba(14,11,6,0.03)` →
  `0px 0px 8px 2px rgba(14,11,6,0.03)` — color unchanged (see "Not touched"
  above). Done in step 1 (tokens.css), now identical to
  `--shadow-tutorial-card`.
- **Padding: `p-4` (16px all sides) → `pt-[20px] px-[16px] pb-[16px]`**
  (`pt-5 px-4 pb-4` in Tailwind's default scale) — top padding grows 4px,
  sides/bottom unchanged. Verified via computed style: exact match.
- **Gap between product rows: `12px` (`gap-3`) → `16px` (`gap-4`).**
  Verified via computed style: `row-gap: 16px`.

Also verified: the Finish (step 7→8) card-exit transition and the
step-to-step card entrance spring still play correctly with the new
shape/padding — no regressions from the shape change.

### Product row — DONE

- Image size: pulled `57×64`, current tokens already `56×63`
  (`--size-product-image-w/h`, V3 pass) — within a rounding error, **no
  change needed**.
- Image border color: `rgba(14,11,6,0.05)` → `rgba(44,41,38,0.2)` (already
  covered by `--color-border-hairline` above).
- **Two more real misses, caught only in implementation step 3** (the
  original diff checked border color but not radius or text color on this
  row): `--radius-image` was `12px`, Figma is `8px` on both Step 1 and
  Step 7's pulls; `--color-text-product` (brand/name text) was still
  `rgba(0,0,0,0.8)`, never migrated off pure black to the `#2c2926` ink
  family like everything else in this pass. Both tokens are used only by
  `ProductCard.tsx` (grep-confirmed), safe to change directly. Verified via
  computed-style check: `border-radius: 8px`, `border-color: rgba(44, 41,
  38, 0.2)`, `color: rgba(44, 41, 38, 0.8)` on the live product row —
  exact match.

### Check indicator — DONE

Visually close to what's already built — the checked state is still a ring
+ checkmark glyph, the unchecked state is still a dashed/outline ring — but
a couple of numbers look adjusted:

- Checked ring stroke: `3px` → **`2px`** (`--check-stroke-checked-width`,
  matching Figma's `border-2`). Tried and compared visually against the
  Figma screenshot (implementation step 4) — reads cleanly at `2px`, not
  washed out. Verified via computed style (`stroke-width: 2px`) and by
  actually toggling a checkbox to confirm the draw-in/pop animation still
  plays correctly at the new weight.
- Both `--check-stroke-checked` and `--check-stroke-unchecked` recolored to
  the `#2c2926` family (done in step 1's tokens.css pass, confirmed still
  correct here).

**Recommendation: keep the current hand-drawn SVG implementation** (ring +
traced checkmark path, themeable via `--check-*` tokens) rather than
switching to the raster/asset-based check icons the Figma pull references
(`fi-br-check` group asset for checked, a dashed-circle image asset for
unchecked). `CheckIndicator.tsx`'s own doc comment already explains why —
"reproduced here as plain SVG shapes rather than embedded images... since
they're simple enough to redraw exactly and stay themeable via tokens" —
and nothing in this pull's screenshots suggests the shape has changed
enough to invalidate that. Recolor via tokens; don't re-derive the asset
shapes unless a visual check after implementation shows a real mismatch.

### Action button

- Height: `40px` → `44px` (`--height-action-button` already exists at
  `40px`, marked "V3, unused until now" in `tokens.css` — this pass is what
  actually starts using a non-default height, so bump the value itself).
- Colors: see the Global color table above (default bg/border,
  final bg/border/text all change).
- Label text: unchanged — `"Next"` / `"Finish"`, already capitalized
  correctly in the current code (`ActionButton`'s callers in
  `StepScreen.tsx`). No change needed here despite `figma-v2-redesign.md`'s
  old note about a lowercase `"next"` — that was already superseded before
  this pass.
- **Label typography — missed in the first pass, caught during
  implementation (step 2):** both pulls use `16px` / Inter Medium (500),
  not the current `--font-size-button: 15px` / `--font-weight-semibold`
  (600). Fixed by bumping `--font-size-button` to `16px` (used nowhere else
  — safe to change the token itself) and pointing `ActionButton`'s own
  `fontWeight` at `--font-weight-medium` directly rather than the shared
  `--font-weight-semibold` token (which other components, e.g.
  `ProductCard`'s brand name, still legitimately use at 600 — not touched).

## Out of scope for this pass (noted, not touched)

- **All Steps list view** — deferred by the user, see top of this doc.
- **Steps 2-6's eye illustration data** — still the real open item from
  `docs/handoff.md`'s "Pending work" (V1 data, needs re-pulling). This pass
  doesn't touch `EyeIllustration.tsx` at all.
- **Bonus data captured incidentally**: Step 7 and Step 8's pulls happened
  to include their real current per-layer illustration data (layer names,
  insets, node IDs) as a side effect of pulling those frames for the
  button/shell diff. That's useful groundwork for the pending Phase 3 work
  in `docs/figma-v2-redesign.md`, but implementing it is a separate task —
  don't fold it into this restyle pass.

## Implementation plan

Ordered so each step is independently testable in the browser preview.

1. **`tokens.css`**: apply every token change in the Global color table,
   plus `--shadow-card` and `--height-action-button`. Add a version-marker
   comment (this file already increments `V2`/`V3`/`V4` per pass — this is
   the next one) citing this doc and the three node IDs above, same style
   as existing comments.
2. **`ActionButton.tsx`** — DONE. Colors/height were already fully
   token-driven, as expected. One real miss found and fixed during this
   step (not anticipated by the original diff above): label typography —
   see "Action button" section above. Verified via computed-style checks in
   the browser preview on both the default ("Next", step 1) and final
   ("Finish", step 7) variants — exact match on height, background, border,
   text color, border-radius, font-size, and font-weight.
3. **`ProductCard.tsx`** — DONE. No structural/JSX change needed, as
   expected — but two real token misses found and fixed (see "Product row"
   above): `--radius-image` (12px→8px) and `--color-text-product`
   (rgba(0,0,0,0.8)→rgba(44,41,38,0.8)). Verified via computed-style check
   in the browser preview.
4. **`CheckIndicator.tsx`** — DONE. Colors were already handled by step 1's
   tokens.css pass. `--check-stroke-checked-width` tried at `2px` and kept
   — matches Figma, verified visually and via computed style, plus a real
   click-to-toggle to confirm the draw-in/pop animation still plays
   correctly at the new stroke weight.
5. **`ScreenHeader.tsx`** — DONE (see "Header" above for the full
   writeup, including the opacity-30 correction made mid-implementation).
   Back/Done buttons now use the frosted-chip chrome; the toggle is
   rebuilt as two independent buttons with a mount-animated active chip,
   `header-toggle-slide`/`header-toggle-fade` removed from `index.css`.
6. **`StepScreen.tsx`** — DONE (see "Graph + Step spacing" and "Product
   card container" above, including the sides-stay-inset correction made
   before implementing). Gap bumped to 40px; card's `pb-4` outer padding
   dropped (sides kept); card radius `rounded-t-[32px]`; card padding
   `pt-5 px-4 pb-4`; products gap `gap-4`. All verified via computed
   style/`getBoundingClientRect`, plus a full step 1→7→Finish→8 click-
   through confirming no motion regressions.
7. **Full click-through**: step through all 8 states (1→8) in the browser
   preview, plus Back navigation, confirming color/spacing/header/card
   changes look consistent on every step — not just the three pulled
   frames — since the shared components now drive every step identically.

## Boundaries

- Do not touch `EyeIllustration.tsx`, `stepContent.ts`, or any per-step
  illustration data — confirmed unchanged, out of scope regardless.
- Do not extend any of this to `AllStepsView.tsx` — explicitly deferred.
- Do not invent new hex values where an existing V4 token already matches —
  reuse `--color-tutorial-card-text`, `--color-header-icon-bg`,
  `--color-header-icon-border`, `--shadow-tutorial-card` rather than
  duplicating their values under new names.
- If the check-indicator visual comparison in step 4 shows a real shape
  mismatch (not just color/stroke-width), stop and report rather than
  guessing at a redraw — that would mean the "keep the SVG approach"
  recommendation above was wrong, worth a fresh look rather than patching
  around it.

## Follow-up round — user-reported gaps after the plan above shipped

Found via direct user review of the running app against Figma, after every
numbered step above was already DONE. Each of these was missed by the
original diff/implementation and is now fixed and verified:

1. **Eye illustration size** (`EyeIllustration.tsx`). The user resized
   every step's `MakeUp` instance in Figma — Step 1 to exactly 90% (a
   real correction, landing it on the same size as steps 2-4's own
   instance), steps 2-7 to exactly 99% each (confirmed via `get_metadata`
   on the resized instances, not just the truncated `get_design_context`
   px values — the initial ~1% reading on steps 2-7 was wrongly dismissed
   as rounding noise; re-checking with precise numbers showed it's an
   exact, deliberate ratio too). None of this showed up in the app,
   because `REFERENCE_RENDER_WIDTH` (the only constant in that file that
   actually sets pixel size — every other value, including every step's
   own `canvasWidth`/`canvasHeight`, cancels out of the render math by
   design, algebraically confirmed) was still anchored to the *old* Step 1
   size. Fixed by updating that one constant to the new Step 1 instance
   width (195.5742950439453, from `get_metadata`); `STEP_LAYOUTS[1]`'s
   `canvasWidth`/`canvasHeight` updated too for documentation accuracy
   (provably inert to rendering, but was stale and confusing). Verified by
   measuring the live rendered artwork on both Step 1 (195.57×152.02,
   matches Figma's 195.574×152.031) and Step 7 (203.74×161.79, matches
   Figma's 203.752×161.797) — confirms the single constant fix correctly
   resizes every step, not just the reference one.

2. **Header icons** (`ScreenHeader.tsx`). The four icons (Back, Search,
   Widget/list-check, Done) were still the old hand-decomposed multi-layer
   shapes from an earlier Figma pull — never re-derived against this
   pass's actual icon assets. Downloaded the real flat SVGs directly
   (`download_assets` on nodes 685:4155/4158/4160/4162) and rebuilt all
   four as inline path-data SVG components (`fill="currentColor"`,
   `preserveAspectRatio="none"` matching the source), replacing the old
   imported asset files (deleted from `src/assets/icons/v2/`, confirmed
   unused elsewhere via grep first). **Also caught in the process**: the
   downloaded assets have `fill-opacity` baked in — 0.8 for
   Back/Search/Done, 0.5 for Widget (the one inactive in the pulled
   frame) — real evidence the inactive toggle icon *is* dimmed, reversing
   this doc's own earlier "Header" section conclusion (no dimming, chip-
   only signal) from the step 5 rebuild. That conclusion was based on
   `get_design_context`'s Tailwind-className scan, which doesn't surface
   an opacity baked into a referenced asset rather than a wrapper
   className — a real gap in that check, not a subsequent design change.
   Fixed: `SearchIcon`/`WidgetIcon` now take an `active` prop and render
   at 0.8/0.5 opacity accordingly; Back/Done always render at 0.8.
   Verified visually both toggle directions.

3. **Skin-tone radial gradient behind the eye** (`StepScreen.tsx`). Figma
   has a "Background-eye-radial" layer — a warm off-white radial wash
   (`rgba(245,231,222,1)` → `rgba(251,247,245,0)`, decoded from the source
   SVG's `gradientTransform` matrix into a `326.64×258` ellipse) sitting
   behind the eye, replacing flat background color right in that area —
   that was **entirely missing**, not implemented at all before this
   round. Added as a `radial-gradient` CSS background on a new absolutely
   -positioned div, first child of the scrollable region (so it paints
   behind everything). Sized/positioned by measuring the *live* "Graph +
   Step" block's height and applying Figma's own bleed ratios (measured
   via `get_metadata`: the wash extends ~8% of that block's height above
   it and ~17% below), rather than reusing Figma's absolute 516px height
   directly — our DOM doesn't have the same fixed header chrome Figma's
   mockup canvas does, so an absolute px value would be oversized relative
   to our actual content.

4. **Noise texture position/size** (`StepScreen.tsx`, the existing
   "Radial Noise" mask) — the user flagged this as worth double-checking
   too. It was stale on two counts: height was `273px` (Figma is `264px`,
   confirmed identical across every pulled step) and its `top-[74px]`
   offset was inherited via "shift by the known delta" reasoning through
   two earlier spacing passes — both this pass's `REFERENCE_RENDER_WIDTH`
   fix (#1 above) and its own 28px→40px "Graph + Step" gap bump (see
   "Graph + Step spacing" above) moved the illustration's real position
   enough that the inherited delta was no longer trustworthy. Re-derived
   directly instead: measured the live illustration's real center via
   `getBoundingClientRect` (164.6px) and centered a 264px-tall mask on it
   (`top-[33px]`), rather than continuing to shift a number nobody had
   re-verified against the actual current layout.

5. **Product sheet sizing vs. Figma, and phone fit** — re-verified
   directly (not re-guessed): brand text 14px/600, name 14px/500 — both
   match; product image 56×63 (Figma 57×64, sub-pixel rounding, already
   established in step 3 above); check indicator 36×36; row gap 16px —
   all confirmed via computed style, exact matches. Fit-tested at 375×667
   (iPhone SE, the smallest common real device) and a deliberately
   aggressive 375×560 (simulating heavy mobile browser chrome overhead) on
   Step 7 (2 products + longest description — the worst case): the product
   card and action button stay fully visible, pinned to the bottom, at
   both sizes — only the illustration/title area scrolls internally, which
   is this screen's actual documented design (see StepScreen.tsx's own
   root-div comment). No clipping or overlap at either size.

## Second follow-up round — user review of the fixes above

Reviewed item-by-item; two needed correction:

- **Eye size, product sheet sizing** — confirmed good as shipped, no
  further changes.
- **Header icons — distortion caught on Back/Check.** The `download_assets`
  fix above used `preserveAspectRatio="none"` on all four icons, copying
  the source SVGs' own export attribute (and Figma's `size-full` `<img>`
  treatment) at face value without questioning whether it actually applied
  — wrong. That attribute is just Figma's generic export boilerplate, not
  a signal that non-square icons are meant to stretch non-uniformly into a
  square slot. Search (20.0164x20.0164) and Widget (20.0007x18.3142) are
  close enough to square that the distortion wasn't obvious; Back
  (11.67x9.99) and Check (20.0017x13.6703) are genuinely wide glyphs and
  visibly squashed. Fixed: `preserveAspectRatio="xMidYMid meet"` instead —
  each icon now scales to fit (not fill) its 20x20 slot, centered,
  aspect ratio preserved. The 20x20 SVG viewport itself is unchanged (that
  box still matters for consistent spacing/touch-target); only how the
  path content fills it changed.
- **Noise texture reverted — the "more Figma-accurate" re-derivation made
  it look worse.** The earlier follow-up round re-measured the noise
  mask's position/size against the live illustration center
  (top-[33px]/h-[264px], numerically matching Figma's 322x264 almost
  exactly). On review it read *worse*: smaller and higher, making the
  illustration itself feel more cramped/lower-quality, not more accurate.
  Reverted to the original top-[74px]/h-[273px] on that direct feedback —
  the mask is a soft decorative grain layer, not a spec to hit exactly;
  how it actually reads matters more than matching Figma's raw geometry
  here. The new skin-tone radial wash (previous round, item 3) was
  confirmed good and is untouched.

Both fixes verified in-browser: icons render undistorted (screenshot +
computed viewBox check), noise texture back to its previous visual
presence, no console errors.

## Third follow-up round — header icon size, noise tuner

- **Header icons — Back still read oversized vs. Figma even after the
  distortion fix.** Root cause was the *previous* fix's own remaining
  assumption: forcing every icon's `<svg>` to a hardcoded `width={20}
  height={20}` and letting `preserveAspectRatio="xMidYMid meet"` scale the
  native glyph *up* to fill that box. Per `get_metadata`, each icon's
  Figma instance frame is genuinely 20x20, but the exported glyph's tight
  bounding box (Back: 11.67x9.99) is already expressed in that same local
  coordinate space — it's the glyph sitting with real padding inside its
  own frame (Back only fills ~58% of its frame's width), not a smaller
  shape meant to be scaled up. Fixed by sizing each `<svg>` to its own
  native dimensions (no scaling at all) and letting the parent button's
  `flex items-center justify-center` center it — reproduces Figma's
  padding directly. Search/Widget (both close to square already) barely
  moved either way; this only mattered visibly for Back/Check.
- **Noise texture — added a dev-only live tuning panel instead of another
  one-shot guess.** After two rounds of picking top/height by hand (a
  Figma-matched re-derivation, then a revert to the pre-V5 values) still
  didn't land right — the revert was reported as "almost not noticeable"
  on the next review — the actual position/size/opacity/blend-mode moved
  into `noiseTuning` React state (`StepScreen.tsx`), with a small floating
  panel (portaled to `document.body`, gated behind
  `import.meta.env.DEV` so none of it ships in a production build) with
  live sliders for top/height/width/opacity and a blend-mode `<select>`,
  plus Reset and "Log values" buttons. Defaults match the current shipped
  values, so nothing changes until a slider actually moves. Verified the
  panel renders inside the real step screen, sliders update the mask live
  (tested opacity), Reset restores defaults, and no console errors survive
  past the edit itself (server log timeline confirmed the only errors seen
  were transient, from mid-edit intermediate states, not the current
  code). **Once the right values are found, delete the whole tuner block**
  (state, panel JSX, the fragment wrapper it required) and bake the final
  numbers back into the plain Tailwind classes they replaced — this is
  explicitly a temporary tool, not a permanent feature, same status as the
  project's earlier (now-deleted) MotionTuner panel.

## Fourth follow-up round — noise values chosen, grain-scale knob added

User picked final noise values via the tuner panel: **top 58px, height
250px, width 300px, opacity 0.35, blend mode overlay**. Baked in as the
new defaults in `noiseTuning`'s initial state (was top 74/height
273/width 322/opacity 1/soft-light) and in the panel's Reset button — this
is the shipped look now, not a temporary experiment value.

Also added a **grain-scale slider** (0.3x-3x) on request ("is there a way
I can make the noise bigger or smaller too") — a `scale` field in
`noiseTuning`, applied as `transform: scale(...)` directly on the noise
`<img>`, independent of the mask box's own top/height/width (which only
control the box's position/coverage area, not how large each individual
grain fleck reads — stretching the box already changes apparent grain
size as an entangled side effect, this is the decoupled, purpose-built
control). Default `1` (no change from current). Verified via computed
style: setting the slider to `2` produces `transform: matrix(2, 0, 0, 2,
0, 0)` on the actual noise image element — confirmed working, then reset
back to default.

The tuner panel (`StepScreen.tsx`) is still explicitly a temporary dev
tool per its own code comment — delete the whole block (state, panel JSX,
fragment wrapper) once no further tweaking of these values is expected,
baking the final numbers into plain styles instead.

**One more round after trying the grain-scale knob**: opacity 0.35→0.60,
blend mode overlay→soft-light, grain scale 1→0.9 — top/height/width
(58/250/300) stayed put.

## Fifth follow-up round — final noise value, tuner removed

Last adjustment: opacity 0.60→**0.40** (final). With no further tweaking
expected, the whole dev tuner was deleted per its own code comment's
instruction — `noiseTuning` state, the portaled panel JSX, the
`createPortal` import, and the fragment wrapper it required all removed;
the mask div and its `<img>` now use plain Tailwind classes and a static
inline `transform: scale(0.9)`, no component state involved. **Final
shipped values**: top-[58px], h-[250px], w-[300px], `opacity-40`,
soft-light blend, 0.9x grain scale. Verified via computed style (exact
match on all six values) and a full step 1→7 click-through — no console
errors, `tsc -b` and `oxlint` both clean on the file.

## Sixth follow-up round — toggle chip's hairline border sometimes missing an edge

Reported via `AllStepsView.tsx` testing (the Search/Widget toggle lives in
`ScreenHeader.tsx`, shared with `StepScreen`, so the bug affects both):
the active button's frosted chip — the border+background overlay `<span>`
that plays a "settling in" animation on mount — would sometimes render
with one of its four border edges missing after switching between
Search and Widget.

**First attempt (wrong root cause):** assumed it was the mount animation.
The chip reused `check-ring-in` (also used by `CheckIndicator`'s ring),
which animates `transform: scale(0.92 → 1)`. On a 0.5px hairline border
that scales down to ~0.46px — right at the sub-device-pixel threshold
where a browser can round an edge of a rounded-rect *border* away
entirely, differently per edge. `CheckIndicator`'s own ring never hits
this (2px SVG stroke, ~1.84px even at 0.92 scale). Fixed by adding a new
opacity-only `header-chip-in` keyframe (index.css) and pointing both chip
spans at it instead of `check-ring-in`. This was a real, legitimate fix
for a real problem — but not the *only* problem.

**Second report, more specific: "always the left border."** A
consistent, position-specific pattern rules out pure animation-timing
flakiness (that would drop a random edge, not the same one every time) —
this was a static rendering issue that coexisted with the animation one,
not caused by it. Plain CSS `border` at sub-1px widths is rasterized as
four independent side rectangles; depending on the box's exact sub-pixel
position in the layout, a browser can consistently round *one specific
side* away, not randomly. **Fix:** replaced `border-[0.5px] border-solid`
+ `borderColor` with `boxShadow: inset 0 0 0 0.5px var(--color-header-
icon-border)` on both chip spans (Search's and Widget's) — an inset
box-shadow renders the same 0.5px hairline as one continuous stroke
around the box rather than four independent sides, which doesn't have
this per-side rounding failure mode. `HEADER_CHIP_STYLE`'s `border`-based
version is left alone on Back/Done (plain, non-overlay, non-animated
buttons — not reported as affected, and no reason to touch what isn't
broken).

Scope: `ScreenHeader.tsx` + `index.css` only — the fix applies to both
the per-step screens and AllStepsView, since they share this header.
Verified: computed `box-shadow` on both spans reads
`rgba(44, 41, 38, 0.2) 0px 0px 0px 0.5px inset` with `border-width: 0px`
(confirming no border is applied at all anymore, only the shadow), full
border visible in a screenshot after toggling either direction, no
console errors, `tsc -b` and `oxlint` both clean.

## Seventh follow-up round — box-shadow chip moving/cutting on tap

Reported immediately after the sixth round shipped: "when I tap on each
icon, the selected icon moves slightly and cuts a bit." A new symptom
introduced by that round's own fix, not a leftover of the original
missing-border bug.

**Cause:** `.header-icon-button:active { transform: scale(0.93) }` (and
`:hover { scale(1.05) }`) is old, pre-existing press feedback — but it
was applied to the *button element*, and the Search/Widget toggle's
active chip `<span>` (now using `box-shadow: inset` instead of `border`,
per the sixth round) is a child of that same button. Scaling the button
scales its child span right along with it — and unlike a plain `border`
(painted in the same box layer as the element it's on, always in perfect
sync with any transform applied to that element), an inset `box-shadow`'s
rounded-corner clip isn't guaranteed to stay composited in lockstep with
a *live* transform. During the ~100ms press transition specifically, this
read as the chip "moving slightly and cutting a bit" — exactly the report,
and exactly why the sixth round's own static screenshot check didn't
catch it (a transform-in-progress artifact, not a resting-state one).

**Fix:** retargeted the scale from the button to its `svg` child —
`.header-icon-button:active svg` / `:hover svg` instead of
`.header-icon-button:active` / `:hover`. The button (and therefore its
child chip span, box-shadow included) never transforms at all now; only
the icon glyph scales for press feedback. This sidesteps the desync
entirely rather than chasing the exact compositing timing — there's
nothing for the box-shadow to fall out of sync *with*. Applied to all
four header buttons for consistency (Back/Done's `border`-based chips
were never actually at risk, since real `border` doesn't have this
failure mode — but a glyph-only press now reads the same across all four
rather than three matching and one different).

Verified: the stylesheet now contains `.header-icon-button svg` and
`.header-icon-button:active svg` rules (confirmed via
`document.styleSheets`), no rule targeting the bare button's `transform`
remains, screenshot after toggling looks correct, no console errors,
`tsc -b` and `oxlint` both clean.

## Eighth follow-up round — same symptom persisted after the seventh round's fix

User re-tested on their actual phone and reported it was "still happening,
very slightly but noticeable" — with screenshots pinpointing it further:
happens right on tap, not specific to one particular icon.

**Reconsidered cause, this time a sequencing mismatch, not a rendering
one:** the icon's `opacity` (0.5 inactive → 0.8 active, `ScreenHeader.tsx`'s
`ICON_OPACITY_*` constants) is set via an inline style keyed directly off
React state — it has *no* CSS transition covering it (only `transform` was
listed in `.header-icon-button svg`'s `transition` property), so it snaps
to its new value the instant React re-renders. The chip's own background/
border (`header-chip-in`), by contrast, fades in over `--duration-base`
(~200ms). Tap the inactive icon and both things kick off at once: the
icon jumps to full "selected" darkness (0.8) *immediately*, while the
frosted chip behind it is still mostly transparent and only catches up
over the next ~200ms — the icon reading as "arrived" well before its own
background has, which plausibly reads as it "moving" or "cutting" against
a container that hasn't caught up to it yet. Nothing was actually
mis-sized or mis-positioned this time (confirmed via `getBoundingClientRect`
on both buttons/spans at rest — pixel-perfect 40×40, no asymmetry) — this
is a timing gap between two differently-paced updates, not a layout or
compositing bug like the sixth and seventh rounds' were.

**Fix:** added `opacity` to `.header-icon-button svg`'s transition list at
`--duration-base` (matching `header-chip-in`'s own duration), alongside
the existing `transform` at `--duration-instant` (kept fast — that one's
still press feedback, wants to feel immediate, not the same concern).
Icon darkness and chip appearance now settle on the same timescale instead
of one snapping ahead of the other.

Verified: computed `transition-property: transform, opacity` /
`transition-duration: 0.15s, 0.2s` on the icon `svg`, no console errors,
`tsc -b` and `oxlint` clean. **Caveat, stated plainly:** unlike the sixth
and seventh rounds, this one couldn't be confirmed by forcing a static
end-state and screenshotting it — the actual symptom only exists *during*
a ~200ms live transition, which this tooling can't frame-capture. The
diagnosis (a real, verifiable timing gap between an untransitioned opacity
snap and an animated chip fade) is solid and the fix directly closes that
gap, but real on-device confirmation after this round is still the
deciding check, not a screenshot.

## Ninth follow-up round — still off; user asked for a real sliding toggle instead

The eighth round's fix didn't resolve it (user: "still off"). Rather than
chase a fourth theory on the mount/unmount-chip approach, the user asked
for a structurally different interaction: one highlight box that visibly
*slides* from one icon to the other, like a real segmented-control toggle,
instead of two independent chips each fading in/out on their own selection.

**Rebuilt the toggle as a single persistent element.** `ScreenHeader.tsx`'s
Search/Widget group now renders exactly one highlight `<div>` (not two
conditionally-rendered chip spans), absolutely positioned at the track's
own left edge, sized `size-[40px]`, translated via
`transform: translateX(isListView ? '100%' : '0')` — `100%` of its own
width, not a hardcoded `40px`, so it can't drift out of sync with the
button size. This is structurally immune to the whole class of bug the
sixth/seventh/eighth rounds kept re-encountering (border scale-animation,
box-shadow/transform desync, opacity/fade timing mismatch) — there's only
ever one element, it never mounts or unmounts on selection, and it has
nothing else to fall out of sync *with*.

**The real blocker: Search/Widget isn't a same-screen toggle at all.**
Tracing `TutorialFlow.tsx` turned up something not previously accounted
for: tapping either icon doesn't flip a boolean within one mounted
screen — it switches which of `StepScreen`/`AllStepsView` TutorialFlow
renders, two entirely separate component trees, each with its *own*
`<ScreenHeader>`. A plain CSS `transition` cannot animate across a
mount — the freshly-mounted highlight in the new screen has no "old
position" to interpolate from, it just appears at its final spot,
instantly, no matter how the transition is authored. This is *why* every
previous round's fix, even when technically correct, could never actually
produce a visible slide.

Surfaced this to the user directly rather than guessing at a resolution,
since it's a real fork with a real tradeoff: hoist `ScreenHeader` to a
shared parent (guarantees the slide, but conflicts with AllStepsView's
scroll-hide/frosted header, which depends on the header living inside its
own scrollable region) vs. the browser's View Transitions API (keeps
today's structure exactly as-is, animates across the mount anyway). User
picked View Transitions.

**Implementation:**
- `index.css`: `.header-toggle-highlight { view-transition-name:
  header-toggle-highlight; }` on the highlight div — this is what lets
  the browser match the element across the two separate mounts and morph
  between their captured positions, which is genuinely different
  machinery from a CSS `transition` on the real element (that still runs,
  for any hypothetical same-instance update, but isn't what drives the
  cross-screen slide). `::view-transition-group(header-toggle-highlight)`
  overrides the browser's default ~250ms ease with `--duration-base`/
  `--ease-out-quart`, matching this app's own motion language.
  `::view-transition-group/old/new(root) { animation: none; }` suppresses
  the API's *other* default behavior — cross-fading the entire old/new
  page — so only the highlight visibly moves; every other Search/Widget
  switch stays the instant, un-animated screen swap it always was.
- `TutorialFlow.tsx`: new `switchViewWithTransition(updateState)` helper
  wraps `updateState` in `document.startViewTransition(() =>
  flushSync(updateState))` — `flushSync` is required so React commits the
  state change synchronously inside the transition callback; without it,
  the browser would capture its "after" snapshot before React had
  actually re-rendered. Falls back to a plain, un-wrapped `updateState()`
  when `startViewTransition` isn't available (older Safari/Firefox — the
  same instant swap as before, no breakage) or under
  `prefers-reduced-motion` (checked directly via `matchMedia`, not
  Framer Motion's `useReducedMotion` — this file has no other Motion
  usage). Wraps both directions: `handleSelectStepView` (Widget → Search)
  and the inline `onSelectListView` handler on `StepScreen` (Search →
  Widget) — the *entire* set of state changes each already made (not just
  `setView`), inside the same callback, so they land as one synchronous
  commit rather than relying on batching semantics across two calls.

Verified: `document.startViewTransition` confirmed present and invoked
exactly once per tap (instrumented via a temporary wrapper), the DOM
correctly reflects the new screen afterward, highlight's
`getBoundingClientRect()` matches the newly-active button's rect exactly
post-transition, `view-transition-name` confirmed via computed style, no
console errors across a full reload + toggle cycle, `tsc -b` and `oxlint`
clean. Same caveat as the eighth round: the *animation itself* — whether
it genuinely reads as a slide rather than a cut, on a real device — needs
on-device confirmation, not a static screenshot; what's verified here is
that the correct API is being invoked correctly and lands on the correct
end state, not the felt motion.

## Verification

- **Mechanical**: `tsc -b` (no new errors), existing lint baseline
  unchanged.
- **Visual**: browser-preview screenshot of steps 1, 7, and 8 side by side
  with the Figma screenshots already captured in this doc's source pulls —
  colors, header chrome, card shape, and spacing should match. Also check
  a step with no `shade` line and one with one (per `ProductCard`'s
  existing two layout modes) to confirm the row gap/padding changes didn't
  break either.
- **Interaction**: step/list toggle still switches views correctly post-
  rebuild (even though `AllStepsView` itself isn't being restyled, the
  toggle still needs to work); Back/Done buttons still fire their
  handlers; check/uncheck animation still plays correctly on click and
  stays suppressed on view-switch remounts (`animate` prop, unchanged
  logic — only color/stroke-width should differ).
- **Done when**: all three pulled frames (1, 7, 8) visually match their
  Figma screenshots, the header toggle is the new two-button shape with no
  leftover sliding-pill code/CSS, the product card is edge-to-edge with
  top-corner-only radius, and a full click-through of all 8 steps shows no
  regressions in existing motion (step transitions, card entrance/exit,
  check animations).
