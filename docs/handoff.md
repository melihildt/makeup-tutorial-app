# Handoff — makeup tutorial app

**Current as of 2026-09-02** — re-verified against the actual code on that
date. Read this first, then `docs/figma-step-screen-restyle.md` for the
current (V5) visual diff if you're touching colors/spacing/sizing on any
step screen, or `docs/figma-v2-redesign.md` for the underlying V2
structural diff if you're touching illustration data or copy — V5 didn't
change either of those, see "Design history" below for how the two docs
relate.

Written to carry context into a fresh session. If you find a stale claim
after this point, fix it here in place rather than appending another dated
"update" note — see "History" at the bottom for why that convention was
dropped.

**Git/branch state**: this feature is merged to `main` (`9f1aa24`), no
open branch work remaining in its own scope. Run `git status` /
`git log --oneline -5` on a fresh session start regardless — this note is
a snapshot, not a live value.

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

## Design history — three passes

1. **V1**: original Figma flow, fully implemented (all 7 steps' real
   illustration + copy + products).
2. **V2**: the user redesigned the whole flow in Figma (new section "V2",
   node `513:9189` in the same file) — new header, new button style, new
   progress badge, new copy, resized illustration, a new All Steps list
   view. This is a near-total visual redesign, tracked in
   **`docs/figma-v2-redesign.md`** (full diff + a 5-phase plan). That file
   has the node-ID reference table — use it before making any new Figma
   calls, to avoid re-discovering IDs already on file.
3. **V5** (tokens.css's own version-marker numbering, shared across this
   feature and the home screen — there's no separate "V3"/"V4" pass
   specific to this file, those landed in the home screen and a spacing
   tweak, see `tokens.css`'s own comments): a further Figma iteration —
   sizing/spacing/color refinements plus an eye-instance resize — over the
   shipped V2 shell. Tracked in **`docs/figma-step-screen-restyle.md`**
   (full diff, node IDs, and every round of user review/correction that
   followed). Done and shipped; `AllStepsView.tsx` was excluded from this
   pass but got its own separate Figma pull and restyle afterward — see
   **`docs/figma-allsteps-restyle.md`**, also done and shipped.

## Current state (what's done)

**V5 (`StepScreen`/`ScreenHeader`/`ProductCard`/`ActionButton`/
`CheckIndicator`) and the separate `AllStepsView.tsx` restyle are both done
and shipped** — see `docs/figma-step-screen-restyle.md` and
`docs/figma-allsteps-restyle.md` respectively for the full diffs, node IDs,
and every follow-up correction round. Both docs lead with a "current
values" quick-reference if you just need the numbers, not the history.
Reading the V2 detail below is still useful for the underlying
structure/wiring, just not for current visual values.

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
  wired in `TutorialFlow.tsx` via the header's Search/Widget icons —
  now a single sliding-highlight segmented control, driven across the
  screen swap by the browser's View Transitions API
  (`TutorialFlow.tsx`'s `switchViewWithTransition`,
  `document.startViewTransition` + `flushSync`), not two independently
  fading buttons. Falls back to an instant swap without View Transitions
  support or under `prefers-reduced-motion`.
- **Header selector fix**: each toggle icon is pinned to a fixed center
  point (`left`/`top` + `translate(-50%,-50%)`, independent of flexbox) so
  only the circle's diameter changes when the selection swaps, never its
  position.

**Phase 3 is partial.** **Step 1 has real V2 per-layer data**
(`STEP_LAYOUTS[1]`, node `545:1793`) and renders through the same
per-layer path as every other step — no longer a flattened-SVG special
case. **Steps 2-7 are still V1 data**, confirmed directly in
`EyeIllustration.tsx`'s own module comment — real, unstarted work, see
"Pending work" below.

**Phase 5 (motion) is done.** `StepScreen.tsx` (check its own extensive
comments for full reasoning on each):
- **Step-to-step transitions**: title/description + progress badge
  slide/fade in on every Next/Back, direction-aware (from the right on
  Next, from the left on Back — standard push/pop convention), driven by
  a `prevStepRef`-based direction calculation, not a guess.
- **Finish fade-out**: clicking Finish on step 7 plays a real
  `AnimatePresence`-driven exit (`cardExitTransition`) on the product
  card before advancing to step 8's "done" screen — the
  `onExitComplete` callback is what actually triggers the step-8
  transition, not a guessed delay.
- **Illustration layer diffing**: the eye illustration is never
  remounted between steps — React's own `key={layerKey}` reconciliation
  means a layer whose name persists across a step change (e.g. "Sclera")
  is the same DOM node the whole time, no motion; a layer that's new this
  step gets a stagger entrance. This is also what made step 1's V2
  re-pull worth doing beyond correctness alone: sharing real layer names
  with step 2 (instead of one opaque flattened SVG) is what lets the 1→2
  transition diff correctly at all.

**Also done**: the home page / look selector (out of this doc's own
scope — see `docs/home-stack-handoff.md`; `App.tsx` routes between
`HomeScreen` and `TutorialFlow`, `TutorialFlow` takes an `onExit` prop);
the Done button (`onDone={onExit}`, returns to the home screen); All Steps
view checkboxes (`checkedOverrides` lives in `TutorialFlow`, shared with
both `StepScreen` and `AllStepsView` — one source of truth, not two);
real product photography throughout `src/data/stepContent.ts` (`ProductCard`
only falls back to a placeholder box when an `image` is actually omitted,
which no current product does); `aria-label`s on every icon-only header
button (`Back`/`Show step view`/`Show all steps`/`Exit tutorial`,
`ScreenHeader.tsx`).

## Pending work

### 1. Phase 3 — re-pull the eye illustration for V2, steps 2-7 (blocked on Figma rate limit)

**2026-08-24 note**: this is still open — don't assume V5 (above) closed
it. V5 only fixed the illustration's *render size* (`EyeIllustration.tsx`'s
`REFERENCE_RENDER_WIDTH`, corrected to track the user's Figma resize of
the `MakeUp` instance) — it never touched `STEP_LAYOUTS[2..7]`'s actual
per-layer data, which is exactly what this section is about and is
unchanged. See `docs/figma-step-screen-restyle.md`'s "Follow-up round"
item 1 for the render-size fix's own detail if it's ever unclear which
part of "the eye illustration" was and wasn't touched.

`EyeIllustration.tsx`'s `STEP_LAYOUTS[2..7]` are still 100% V1 —
confirmed directly in the file's own module comment. Step 1 is done (see
"Current state" above) and should NOT be re-fetched. V2 resized the
`MakeUp` instance ~10% bigger on every step and shifted every layer's
percentage insets. Worse, the layer *set itself* may differ: V1 had a
`[Change]/[Add] Above Crease` system reused across steps; V2's step 1
dropped that entirely in favor of a step-specific `[Add] Concealer` layer.
**Don't assume steps 2-7 share layers with step 1 or with V1 — each needs
its own real fetch.**

**Step 1's V2 data is already fetched, applied, and rendering live** — no
need to re-fetch step 1 or reference the old capture below for anything
but historical layout-math reference:

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

**Node-ID note, not re-verified this pass**: the capture above cites node
`509:7141`, but the code actually shipping for step 1 uses `545:1793`
(see `EyeIllustration.tsx`'s own module comment and `STEP_LAYOUTS[1]`) —
likely `509:7141` was an earlier draft/candidate node before the final
re-pull landed on `545:1793`. Since step 1 is done and shipping, this
historical capture is reference material only now, not something to
re-fetch — don't treat the node-ID mismatch as a bug to chase, just don't
trust `509:7141` if you ever do need to re-derive step 1's own math from
scratch (use `545:1793` instead).

Asset URLs for step 1's layers were captured but **not downloaded to
disk** at capture time and have likely expired (Figma asset URLs last ~7
days) — moot now since step 1's real assets are already downloaded and
committed under `src/assets/eyes/Step_1/` (confirmed via
`EyeIllustration.tsx`'s `import.meta.glob` on that path).

**Steps 2-7**: still not fetched — this is the one real chunk of
`docs/figma-v2-redesign.md`'s original 5-phase plan that's still open.
Node IDs for each step's `MakeUp` instance are in
`docs/figma-v2-redesign.md`'s reference table — use those directly rather
than re-deriving them from a fresh metadata scan (saves a call). Budget
~6 more `get_design_context` calls (one per step), same shape as what hit
the rate limit last time — if it happens again, that's expected, not a
bug; just pick up the remaining steps in a later pass.

Once all 7 (plus step 1, done) are fetched: rebuild `STEP_LAYOUTS[2..7]`
in `EyeIllustration.tsx` following the same brow-anchoring approach
already in place (each step's Brow layer anchors a shared scale/position
so the eyebrow renders at a consistent size across steps regardless of
each step's own canvas padding — see the comments in `EyeIllustration.tsx`
above `STEP_ALIGNMENT` for the full reasoning, that part doesn't need to
change, just the underlying per-step numbers). Also decide what step 8
("You're done!") should show — it currently reuses step 7's illustration
as a placeholder (`StepScreen.tsx` has `EyeIllustration step={isDoneScreen
? 7 : step}`); V2's Step_8 frame uses the same larger canvas as steps 6-7
(226.39×179.77) so it may just be step 7's exact same illustration by
design, but that's not confirmed from real data. One more thing worth
factoring in now that step 1 has real per-layer stagger diffing (see
"Current state" above): re-pulling steps 2-7 as real V2 data will also
be what makes every step-to-step illustration transition diff correctly,
not just 1→2 — right now steps 2-7 all share old V1 layer names/shapes,
so that part of the motion work is *already* fine step-to-step among
2-7, but each of those steps individually is still rendering stale V1
artwork.

### 2. Known gaps / minor details worth a look

Re-verified against current code 2026-09-02. Header icon-only buttons now
have `aria-label`s (`ScreenHeader.tsx`) — resolved, no longer listed here.
What's actually still open:

- **This tutorial's own content is still hardcoded to one look
  ("Soft Smokey Eye")** — `stepContent.ts` and `EyeIllustration.tsx` both
  assume a single flow, no `look`/tutorial-id keying anywhere. The home
  screen (`docs/home-stack-handoff.md`) filters and renders all 4 tutorial
  cards, but only this one has `hasContent: true` — the other three open
  a "Coming soon" state (a disabled `ComingSoonButton` on the card, a toast
  from Bookmarks) instead of a real `TutorialFlow`, by design, not as an
  unhandled gap. Restructuring `stepContent.ts`/`EyeIllustration.tsx` to be
  keyed by look, not just by step, is what unlocks the other three — real
  prerequisite work if "make the other 3 looks real" ever becomes the next
  ask, not this doc's own current task.
- **No automated tests** — confirmed still true (no `*.test.*` files, no
  `test` script in `package.json`). Every check so far has been manual
  (`tsc -b` + browser verification).
- **State doesn't persist** across a page reload — confirmed still true
  (no `localStorage`/`sessionStorage` calls anywhere in `src/`; step,
  view, and checked overrides are all plain `useState`).
- Status bar / home indicator chrome from Figma's frames was deliberately
  left out as out-of-scope (assumed to live in a native shell) — not
  re-verified this pass beyond confirming no status-bar-shaped component
  exists in `src/components/`; still worth reconfirming that's the right
  call before shipping anywhere real.

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
docs/README.md                      Index of every doc in this folder, with current-vs-historical status
docs/figma-v2-redesign.md          Full V2 Figma diff + node-ID reference + 5-phase plan
docs/figma-step-screen-restyle.md  Full V5 Figma diff + node IDs + every follow-up round (read this for anything V5-related — most of the interesting detail is in the follow-up rounds, not the original plan)
docs/figma-allsteps-restyle.md     Full AllStepsView Figma diff + node IDs + follow-up rounds
docs/handoff.md                     This file
docs/home-stack-handoff.md          Companion doc: the HomeScreen tutorial-card stack + its own motion — read that one for App.tsx/HomeScreen/TutorialCard.tsx questions, not this doc

src/data/stepContent.ts      Shared step copy + product data (STEP_CONTENT, TOTAL_STEPS) — real product photos, still single-look (Soft Smokey Eye) only, see "Known gaps"; `checked` values verified against Figma directly as of V5 (see figma-step-screen-restyle.md)
src/styles/tokens.css        Design tokens; V1 values marked, V2/V5 replacements marked in place

src/components/
  CheckIndicator.tsx        36x36 check control (checked/unchecked) — SVG shapes traced from V2 assets, colors/stroke-width updated for V5
  ProductCard.tsx           Product row: image, brand/name/shade, CheckIndicator — sizing/colors updated for V5
  ScreenHeader.tsx          Back / Search-Widget toggle / Done — shared by StepScreen + AllStepsView. Icons are inline SVG path data (frosted-chip chrome); the Search/Widget toggle is one persistent sliding highlight (inset `box-shadow`, not `border`), animated across the screen swap via the View Transitions API. All four icon-only buttons (Back/Show step view/Show all steps/Exit tutorial) carry an `aria-label`.
  ActionButton.tsx          Shared default/final bottom button — colors/height/typography updated for V5; takes an optional per-call-site `style` override (AllStepsView's own Finish button is a 24px-radius pill, StepScreen's stays the shared 12px default)
  EyeIllustration.tsx       Layered SVG eye composite — step 1 real V2 per-layer data + stagger diffing; steps 2-7 still V1 layer data (this is the still-open half of phase 3, see above) — render *size* corrected for V5's Figma resize (REFERENCE_RENDER_WIDTH)
  StepScreen.tsx            One step's full screen — owns the step-to-step direction-aware transition + Finish fade-out (Framer Motion, phase 5, done); V5 added the skin-tone radial-gradient wash and re-tuned the noise mask (final: top 58px/h 250px/w 300px/opacity 0.4/soft-light/0.9x grain scale)
  AllStepsView.tsx          All-steps list screen — checkedOverrides shared with StepScreen via TutorialFlow, not its own local state — fully restyled (own Figma pull, distinct from V5); see docs/figma-allsteps-restyle.md for the full diff, including its own scroll-driven frosted/hide-on-scroll header not present in any Figma pull

src/TutorialFlow.tsx        Owns `step`/`view`/`checkedOverrides` state, wires everything together; takes `onExit` (wired to the Done button, returns to Home)
src/App.tsx                 Routes HomeScreen ⇄ TutorialFlow — see docs/home-stack-handoff.md for the real detail on this file, out of this doc's own scope

src/assets/eyes/Step_1/     Real V2 per-layer SVGs (downloaded, committed) — step 1 only
src/assets/eyes/Step_2/ … Step_7/   V1 eye illustration layer SVGs (downloaded, committed) — still what steps 2-7 render from
src/assets/icons/           V1 Checked/Unchecked (superseded by icons/v2/check-*.svg, kept for reference)
src/assets/icons/v2/        radial-noise.svg (used, StepScreen.tsx) + check-*.svg (reference only — CheckIndicator.tsx traces these as inline paths, doesn't import the files). The old V2 header icon files (arrow-left.svg, done-check.svg, search-ellipse-*.svg, search-handle.svg, widget-bar-*.svg) were deleted during V5 — ScreenHeader.tsx's icons are inline SVG path data now, no image imports.
```

## History

Compact milestone list, newest first — full reasoning for each lives in
git history and `plans/README.md`, not repeated here. This replaces what
used to be a long, layered "2026-08-2x update" narrative at the top of
this doc; if that level of detail is ever needed, it's in this file's own
git history.

- **2026-09-02**: doc re-verified end-to-end and corrected in several
  places where it had drifted (aria-labels landed without this doc being
  updated; `AllStepsView.tsx`'s restyle status was stale; the "hardcoded
  to one look" gap is now a deliberate `hasContent`/`ComingSoonButton`
  design, not an unhandled edge).
- **`AllStepsView.tsx` restyled**; `ScreenHeader`'s Search/Widget toggle
  rebuilt into a single sliding highlight driven by the View Transitions
  API — see `docs/figma-allsteps-restyle.md`.
- **Third, whole-flow `improve-animations` audit** (plans 008-021) — see
  `plans/README.md`.
- **V5 restyle pass shipped** — see `docs/figma-step-screen-restyle.md`.
- **`feature/home-tutorial-stack` merged to `main`** (`9f1aa24`).
- **Step 1's eye illustration re-pulled as real V2 per-layer data**
  (`STEP_LAYOUTS[1]`, node `545:1793`) — steps 2-7 still V1, see
  "Pending work" above.
- **V2 redesign implemented** (phases 1, 2, 4, 5) — see
  `docs/figma-v2-redesign.md`.
