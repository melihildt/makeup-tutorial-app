# Handoff — makeup tutorial app

Written to carry context into a fresh session. Read this first, then
`docs/figma-v2-redesign.md` for the full Figma V2 diff if you touch
anything illustration- or copy-related.

## What this app is

A 7-step makeup tutorial flow ("90s inspired smoky eye"), built from a
Figma file (`Tech-Experimentation`, file key `6Mr7K0RONTS8SltZRJtqYj`).
Each step shows: header (back/search/widget/done), a progress badge, a
layered SVG eye illustration that builds up across steps, a title +
instruction sentence, a product checklist, and a next/finish button.
There's also an "All Steps" list view (all 7 steps' products in one
scrollable card) and a terminal "You're done!" screen after Finish.

Stack: Vite + React + TypeScript + Tailwind CSS v3. No routing library —
everything is local component state. No backend, no persistence (state is
in-memory, resets on reload).

Run it: `npm run dev` (or via the Browser pane's `preview_start` with name
`makeup-tutorial-dev`, defined in `.claude/launch.json`).

## Design history — two passes

1. **V1**: original Figma flow, fully implemented (all 7 steps' real
   illustration + copy + products).
2. **V2**: the user redesigned the whole flow in Figma (new section "V2",
   node `513:9189` in the same file) — new header, new button style, new
   progress badge, new copy, resized illustration, a new All Steps list
   view. This is a near-total visual redesign, tracked in
   **`docs/figma-v2-redesign.md`** (full diff + a 5-phase plan). That file
   has the node-ID reference table — use it before making any new Figma
   calls, to avoid re-discovering IDs already on file.

## Current state (what's done)

**V2 phases 1, 2, and 4 are complete and verified in-browser:**

- **Phase 1** (shell): new header (`ScreenHeader.tsx`), static "N/7 steps"
  badge, new title+description copy for all 8 states (7 steps +
  "You're done!"), restyled next/Finish button, new background gradient +
  radial noise texture, token updates in `tokens.css`.
- **Phase 2** (product card): image resized 80×90→64×72, real `shade` prop
  on `ProductCard` (was string-concatenated before), `CheckIndicator`
  rebuilt from the actual downloaded V2 check assets (not guessed).
- **Phase 4** (All Steps view): new `AllStepsView.tsx`, shared step data
  extracted to `src/data/stepContent.ts`, view toggle (`step` ⇄ `list`)
  wired in `TutorialFlow.tsx` via the header's Search/Widget icons.
- **Header selector fix** (post-phase-4, user-reported): the Search/Widget
  toggle used to shift both icons sideways when swapping which one was
  active (naive flex resize). Fixed by pinning each icon to a fixed center
  point (`left`/`top` + `translate(-50%,-50%)`, independent of flexbox) so
  only the circle's diameter changes, never its position. Verified with
  exact coordinate math, not just a screenshot — see `ScreenHeader.tsx`'s
  comment above the pill for the reasoning if it needs touching again.

**Not yet touched: `EyeIllustration.tsx` is still 100% V1 data.** Every
illustration currently shown on the V2-styled screens is using the old
V1 proportions/layers. This is exactly phase 3, described next.

## Pending work

### 1. Phase 3 — re-pull the eye illustration for V2 (blocked on Figma rate limit)

`EyeIllustration.tsx`'s `STEP_LAYOUTS` data is 100% V1. V2 resized the
`MakeUp` instance ~10% bigger on every step and shifted every layer's
percentage insets. Worse, the layer *set itself* may differ: V1 had a
`[Change]/[Add] Above Crease` system reused across steps; V2's step 1
dropped that entirely in favor of a step-specific `[Add] Concealer` layer.
**Don't assume steps 2-7 share layers with step 1 or with V1 — each needs
its own real fetch.**

**Step 1's V2 data is already fetched and preserved here** (from earlier
in this project, before the rate limit hit) — use it directly, no need to
re-fetch step 1:

```
Node: 509:7141 (MakeUp instance inside Step_1 frame 509:7122)
Canvas: width=217.305px height=168.923px

Paint order (back to front):
1. [Add] Concealer (NEW layer, step-1-specific — rotated cream blob near inner corner/brow)
   box: inset(top/right/bottom/left) = 2.82% 57.27% 60.43% 2.33%
   rotated inner: height=hypot(-8.19572cqw,81.5415cqh) width=hypot(91.8043cqw,18.4585cqh) rotate=8.09deg
   bleed: -2.19% -1.07% -1.61% -1.05%
   asset var: imgAddConcealer
2. Sclera — inset 62% 3.89% 0.7% 17.58% — no bleed (direct img fill)
3. Basic_LowerUnderline — inset 79.19% 3.89% 0.42% 17.59% — bleed -0.37% 0% -3.42% 0%
4. Basic_UpperUnderline — inset 62% 3.89% 6.49% 16.48% — bleed -5% 0% 0% 0%
5. Crease — inset 44.09% 14.47% 35.85% 8.13% — bleed -2.35% 0% -0.72% 0% — mix-blend-mode: multiply
6. iris (base) — inset 62% 33.41% 9.01% 38.75% — bleed -0.86% -1.02% -1.77% -0.92%
7. Pupil — inset 62% 37.86% 16.51% 44.32% — bleed -1.55% -0.96% -1.63% -2.3%
8. iris (highlight, 2nd occurrence) — inset 67.73% 37.3% 23.68% 56.01% — bleed -1.36% -7.66% -6.96% -4.74%
9. [Add] Lashes (rotated) — box inset 49.72% 58.17% 20.48% 0%
   rotated inner: height=hypot(2.07007cqw,92.8816cqh) width=hypot(97.9299cqw,-7.11842cqh) rotate=-2.3deg
   bleed: 0% 0% -3.91% -0.15%
10. Brow — inset -0.42% 0% 79.55% 2% — bleed -19.76% 0% -12.9% -0.32%
11. Unnamed small highlight ellipse (asset var imgEllipse67, no layer name in Figma —
    small dot near lower-right, likely a highlight/product-texture accent)
    box (rotated): inset 93.56% -5.82% -22.7% 85.51%
    rotated inner: height=hypot(-38.4737cqw,74.4651cqh) width=hypot(61.5263cqw,25.5349cqh) rotate=24.85deg
    bleed: -1.39% -1.42% -1.47% -3.01%
```

Asset URLs for step 1's layers were captured but **not downloaded to
disk** (unlike the header/check icons) and have likely expired (Figma
asset URLs last ~7 days; phase 3 was deferred past that window). You'll
need a fresh `get_design_context` call on node `509:7141` to get live
URLs before `download_assets`/`curl`-ing them — the layout math above
should still be correct (percentages don't expire), just re-grab the
image URLs.

**Steps 2-7**: not fetched at all yet. Node IDs for each step's `MakeUp`
instance are in `docs/figma-v2-redesign.md`'s reference table — use those
directly rather than re-deriving them from a fresh metadata scan (saves a
call). Budget ~6 more `get_design_context` calls (one per step), same
shape as what hit the rate limit last time — if it happens again, that's
expected, not a bug; just pick up the remaining steps in a later pass.

Once all 7 (plus step 1, done) are fetched: rebuild `STEP_LAYOUTS` in
`EyeIllustration.tsx` following the same brow-anchoring approach already
in place (each step's Brow layer anchors a shared scale/position so the
eyebrow renders at a consistent size across steps regardless of each
step's own canvas padding — see the comments in `EyeIllustration.tsx`
above `STEP_ALIGNMENT` for the full reasoning, that part doesn't need to
change, just the underlying per-step numbers). Also decide what step 8
("You're done!") should show — it currently reuses step 7's illustration
as a placeholder (`StepScreen.tsx` has `EyeIllustration step={isDoneScreen
? 7 : step}`); V2's Step_8 frame uses the same larger canvas as steps 6-7
(226.39×179.77) so it may just be step 7's exact same illustration by
design, but that's not confirmed from real data.

### 2. Phase 5 — motion (expanded scope, per latest request)

Two distinct animation asks, both currently unimplemented (everything is
an instant content swap right now):

- **Step-to-step transitions**: when `next`/`back` changes `step` in
  `TutorialFlow`, the whole `StepScreen` just re-renders instantly. Add a
  real transition (e.g. crossfade, or slide in the direction of travel).
  Needs a decision on approach — CSS transitions keyed on `step`, or a
  library (Framer Motion / `react-transition-group`) — nothing is
  installed yet, so factor in the "don't add a dependency without asking"
  norm if reaching for a library.
- **Finish fade-out**: per the original Figma spec, clicking Finish on
  step 7 should fade the product card out before/while transitioning to
  the step-8 "done" screen (rather than the instant swap it does now,
  handled in `TutorialFlow.handleFinish`).

### 3. Known gaps / minor details worth a look

- **All Steps view checkboxes aren't live-synced** with the per-step
  screens' toggles — `AllStepsView` shows each product's static Figma
  default, `StepScreen` keeps its own local `checkedOverrides` state. If
  you want one source of truth, checked-state needs lifting from
  `StepScreen` up into `TutorialFlow`.
- **Header's Done and Back icon buttons have no `aria-label`** — icon-only
  buttons with no accessible name. Quick a11y fix in `ScreenHeader.tsx`.
- **"Done" button is fully unwired** — no `onDone` handler exists anywhere
  in `TutorialFlow`. Needs a decision on what it should actually do (exit
  the tutorial? confirm first, given unsaved progress?).
- **Product photography is still placeholder** — `ProductCard` renders a
  flat `--color-image-placeholder` box for every product; real photo URLs
  from Figma are ephemeral and were never downloaded-and-committed the way
  the eye-illustration and icon SVGs were.
- **No home page / look selector** — still fully out of scope. Worth
  remembering that `stepContent.ts` and `EyeIllustration.tsx` are both
  hardcoded to this one look; supporting multiple looks later means
  restructuring both to be keyed by look, not just by step.
- **No automated tests** — every check so far has been manual (`tsc -b` +
  browser verification).
- **State doesn't persist** across a page reload (step, view, and checked
  overrides are all plain `useState`, no storage).
- Status bar / home indicator chrome from Figma's frames was deliberately
  left out as out-of-scope (assumed to live in a native shell). Worth
  reconfirming that's still the right call before shipping anywhere real.

## Testing notes

Browser automation was noticeably flaky in the phase-3/4 session (the
`computer` tool's clicks sometimes silently no-op'd or timed out, and a
`scale()` CSS transform used for visual zoom-inspection turned out to
distort based on the element's page position rather than acting as a true
zoom — don't trust it for pixel-level layout checks). What worked
reliably: `javascript_tool` clicks + an explicit `wait` before reading
state back, and direct `getBoundingClientRect()` coordinate math for
anything position-sensitive (that's how the header selector fix was
actually verified, not a screenshot).

## Quick file map

```
docs/figma-v2-redesign.md   Full V2 Figma diff + node-ID reference + 5-phase plan
docs/handoff.md             This file

src/data/stepContent.ts     Shared step copy + product data (STEP_CONTENT, TOTAL_STEPS)
src/styles/tokens.css       Design tokens; V1 values marked, V2 replacements marked in place

src/components/
  CheckIndicator.tsx        36x36 check control (checked/unchecked), V2 assets
  ProductCard.tsx           Product row: image, brand/name/shade, CheckIndicator
  ScreenHeader.tsx          Back / Search-Widget toggle / Done — shared by StepScreen + AllStepsView
  ActionButton.tsx          Shared default/final bottom button
  EyeIllustration.tsx       Layered SVG eye composite — STILL V1 DATA, this is phase 3
  StepScreen.tsx            One step's full screen
  AllStepsView.tsx          All-steps list screen

src/TutorialFlow.tsx        Owns `step` + `view` state, wires everything together
src/App.tsx                 Just renders <TutorialFlow />

src/assets/eyes/Step_N/     V1 eye illustration layer SVGs (downloaded, committed)
src/assets/icons/           V1 Checked/Unchecked (superseded by icons/v2/check-*.svg, kept for reference)
src/assets/icons/v2/        V2 header icons, check assets, radial noise texture (downloaded, committed)
```
