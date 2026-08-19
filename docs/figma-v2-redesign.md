# Figma V2 redesign — diff & implementation plan

Source: https://www.figma.com/design/6Mr7K0RONTS8SltZRJtqYj/Tech-Experimentation
Section: `V2` (node `513:9189`), file key `6Mr7K0RONTS8SltZRJtqYj`.

This documents the diff between the current app (built from the original
Figma flow) and the redesigned "V2" flow, plus the implementation plan.
Written down here rather than left only in chat so it survives context
summarization and isn't re-derived from scratch in a future session.

## Node ID reference (for future targeted fetches — avoid re-pulling the whole section)

| Frame | Node ID |
|---|---|
| V2 section (all steps + list view) | `513:9189` |
| Step_1 | `509:7122` |
| Step_2 | `513:8119` |
| Step_3 | `513:8442` |
| Step_4 | `513:8565` |
| Step_5 | `513:8688` |
| Step_6 | `513:8839` |
| Step_7 | `513:9060` |
| Step_8 (finish/clean state — see below) | `517:10995` |
| All_Steps--View (new list screen) | `516:10107` |

Full design context (code + screenshot) already pulled for: **Step_1**,
**All_Steps--View**. Everything else is metadata-only (structure/positions,
no real text content or exact styling) — treat per-step copy and per-step
illustration details as unconfirmed until fetched individually.

## Confirmed changes

### Global
- Background: flat `--color-bg` → gradient `#e6d6d1 → #f5e7de (35.56%) →
  #fbf7f5 (77.86%)`, top to bottom.
- New "Radial Noise" soft-light-blended texture image behind the illustration.
- Color system shift: most "pure black" colors (`#000`, `rgba(0,0,0,X)`) are
  now based on a warm dark brown `#0e0b06`. Affects `--color-text-primary`,
  `--color-border-hairline`, `--check-stroke-checked`, and others —
  candidates for a tokens.css update, not just per-component overrides.

### Top header (per-step and All Steps view, same pattern)
- "90s inspired / smoky eye" caption: **removed entirely**.
- New Back button (arrow-left, 40×40 circle) — real back navigation now
  exists in the design.
- New Search icon + Widget/grid icon, grouped in a pill. Confirmed via
  opacity states: **the Widget icon toggles between the per-step screen and
  the All Steps list view** (whichever is active is the highlighted one).
  Search icon's purpose is unconfirmed/likely out of scope for now.
- "Done" pill-with-text → icon-only round button (checkmark glyph).

### Step progress ("paginator")
- New `"N/7"` badge + `"steps"` label under the header, e.g. `"1/7 steps"`.
- **Confirmed non-interactive** — a static hint of progress, not a tappable
  step-jump control. No routing/state implications beyond rendering it.

### Step title + description
- Old: two-line "Step 1" / "Add Concealer or Prime" (both 18px).
- New: shorter title ("Add Concealer", 15px semibold, 50% opacity) + a
  **brand-new description sentence** (12px, 40% opacity), e.g.: *"Dab
  concealer under the brow and inner corner, then pat gently to blend.
  Don't rub, just press it in."*
- The All Steps list view uses a **third, even shorter title** per step
  group ("Concealer", "Base Shadow", "Depth Shadow", "Blend", "Lower Lash
  Line", "Highlight", "Eyeliner and Mascara") — distinct from both the old
  and new per-step titles. Three tiers of naming now exist per step.

### Eye illustration
- `MakeUp` instance resized ~10% bigger across the board (e.g.
  197.5×153.6 → 217.3×168.9 for steps 1-4). All percentage insets shifted.
  `EyeIllustration.tsx`'s `STEP_LAYOUTS` is stale for the new design and
  needs re-pulling per step (not just a uniform scale factor).
- Step 1 has a **new layer**, `[Add] Concealer` (rotated blob near the
  inner corner/brow), plus an unlabeled small highlight ellipse. Neither
  existed before. Other steps not yet checked for similar additions.

### Product cards
- Image: 80×90 → **64×72px**. Border color: `rgba(0,0,0,0.1)` →
  `rgba(14,11,6,0.05)`.
- Card background: gradient (`--gradient-card`) → flat `bg-white`, softer
  shadow, no visible stroke.
- Some products show a **third text line** (shade, e.g. "79 - Spices", 12px
  50%-opacity) as a distinct design element — currently folded into
  ProductCard's `name` string; should become a real `shade` prop.
- Check indicator built from different, flatter assets (one flat asset for
  checked, two layered assets for unchecked) than our current
  stroke+checkmark `CheckIndicator`. Not yet downloaded/inspected — don't
  assume visual parity with the current component.

### Bottom button
- Full-width footer bar → small `12px`-radius button **inset inside the
  card's padding** (346px, same width as product rows), centered text, **no
  arrow icon** (hidden in the design).
- Default: `rgba(14,11,6,0.04)` background, lowercase `"next"` label.
- Final variant likely flat `#0e0b06` bg / `#f9f1ec` text (confirmed on the
  All Steps view's Finish button) rather than our current gradient — not
  yet confirmed on the actual Step_7/8 button itself.

### New screen: All Steps list view
- One scrollable card with all 7 steps' products grouped by step: short
  title + "N/7 steps" badge + that step's product rows (same row layout).
- Single "Finish" button at the very bottom of the whole list (flat dark
  style, see above).
- White fade-out gradient overlay at the bottom (scroll affordance).
- Reached via the header's Widget icon toggle — not necessarily a separate
  route, more a view-mode swap.

### Step_8 — resolved
- **Not a real 8th step in the makeup sequence — a real "done" screen.**
  After tapping Finish, the product card fades out (motion — phase 5) and
  the screen shows a genuine completion state: title **"You're done!"**,
  description **"Remember to apply settling spray to make the look last
  longer."** No products, no button. Same illustration instance size as
  steps 6-7 (226.39×179.77) — likely reuses step 7's completed illustration
  rather than needing new art, to be confirmed in phase 3.
- Maps cleanly onto `step` going 1→8 in `TutorialFlow`/`StepScreen`, with 8
  as a terminal state (no Next/Finish action). `onFinish` now advances to
  step 8 rather than only logging; the card fade-out transition itself is
  still phase 5.

### Per-step title + description copy (all 8, confirmed)

| Step | Title | Description |
|---|---|---|
| 1 | Add Concealer | Dab concealer under the brow and inner corner, then pat gently to blend. Don't rub, just press it in. |
| 2 | Set a Soft Base | Sweep a neutral shade across the lid side to side. |
| 3 | Add Depth with a Dark Shade | Using a smaller brush, sweep a darker shade into the outer corner and crease with a back-and-forth motion. |
| 4 | Blend and Soften the Edges | Discharge the powder residue of the brush onto a tissue, then buff the edges in small circular motions so there's no harsh line between the shades. |
| 5 | Define the Lower Lash Line | Apply a bit of the dark shade using the smaller side of the brush, moving from the outer corner inward. |
| 6 | Highlight the Inner Corner | Tap a light shimmer shade onto the inner corner with your fingertip or a small brush to open up the eye. |
| 7 | Finish with Eyeliner and Mascara | Line the upper lash line close to the roots, then finish with a few coats of mascara. |
| 8 (done) | You're done! | Remember to apply settling spray to make the look last longer. |

### Search/Widget header icons — resolved (not ambiguous)

Compared the exact classNames between Step_1 and All_Steps--View: whichever
view is active gets a bigger touch target (40px vs 34px), a highlighted
`rgba(255,255,255,0.4)` pill background, and full opacity; the inactive one
is smaller, no background, `opacity-30`. This is a real two-way tab control
— Search icon = step view, Widget icon = list view — not a search feature.
Both are functionally wired in phase 1's `ScreenHeader`, even though the
list view itself doesn't exist until phase 4 (`onSelectListView` is an
optional no-op prop until then).

## Explicitly NOT addressed by this redesign pull

- **Home page / look selector** (original list item #3) — the All Steps
  view is a list of one look's steps, not a selector across multiple looks.
  Still fully open; the current data model (`STEP_CONTENT`,
  `STEP_LAYOUTS`) is still hardcoded to this single "90s smoky eye" look.
- **Product images** (original list item #6) — new mock images in Figma are
  still ephemeral asset URLs, same constraint as before, no change.

## Implementation plan

Phased so each piece ships independently and Figma-call cost is front-loaded
into the phases that actually need it.

1. **StepScreen shell**: header (back button, search/widget icons, round
   Done button), static progress badge, new title+description copy, button
   restyle, background gradient, radial noise texture, token color updates.
   Copy for steps 2-7 (new title + new description sentence) is plain text —
   cheapest to have pasted directly rather than spending Figma calls on it,
   the way steps 5-7's original product copy was handled last time.
2. **ProductCard**: resize image, border color, add a real `shade` prop,
   rebuild `CheckIndicator` from the actual downloaded check assets (one
   `download_assets` call, not full design-context fetches).
3. **Eye illustration re-pull**: one full `get_design_context` call per step
   (7 calls) — this is the expensive phase, see below.
4. **All Steps list view**: new component. Full design context + screenshot
   already captured for this one — no further Figma calls needed to start.
5. **Finish transition**: card fade-out on step 7/8, wired to
   `TutorialFlow.onFinish`. Primarily a motion/CSS task from the
   plain-language spec above; revisit against Figma only if the result
   doesn't match intent.

### On Figma's rate limit
Real constraint — hit it once already this session. Phase 3 is the highest
risk (7 individual full-context calls, same shape as what triggered the
limit last time). Mitigations: reserve Figma calls for things that
genuinely need pixel data (layout percentages, icon shapes); get copy via
paste where possible (near-zero cost, and worked cleanly last time); if the
limit is hit mid-phase-3, stop and pick up the remaining steps in a later
pass rather than blocking everything else.

### On context length
Also worth watching — this conversation already carries several large
Figma dumps. That's the reason this file exists: the plan and diff live
here, not only in chat history, so a context summarization (or a fresh
session, if you'd rather split phase 3 off into one) doesn't lose the
specifics. No need to preemptively split sessions — continuing here is
fine — but if this thread gets unwieldy, phase 3 (the illustration re-pull)
is the natural candidate to run as its own focused session, referencing
this file.
