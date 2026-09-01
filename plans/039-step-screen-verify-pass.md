# 039 — Step screen: header/badge/title/description/sheet color+typography+radius fixes

- **Status**: DONE
- **Severity**: MEDIUM (visible tone/size mismatches across every tutorial
  step screen, plus two long-standing "inferred, never confirmed" tokens)
- **Category**: Cohesion & tokens — same Figma file `6Mr7K0RONTS8SltZRJtqYj`,
  node `896:9714` ("Step_7", the "New" section's only step-screen frame).
- **Source**: User asked to re-verify the tutorial step screens against this
  Figma frame — "check header, background and product sheet, verify colors,
  sizing, typography, spacings, etc (same exercise as before but apply it to
  all steps). The eye illustration stays untouched."
- **Scope**: `src/components/ScreenHeader.tsx`, `src/components/StepScreen.tsx`,
  `src/components/ProductCard.tsx`, `src/styles/tokens.css`. The eye
  illustration (`EyeIllustration.tsx`) was not opened or touched, per the
  user's explicit constraint.

## Findings

A fresh `get_design_context`/`get_variable_defs` pull of node `896:9714`,
cross-checked against a `get_metadata` structural dump of the same frame and
two raw-asset `curl` downloads (same diagnostic technique as prior
`fillOpacity`-residue fixes), turned up seven real, confirmed mismatches.
Background itself (`--gradient-bg-home`, the radial skin-tone wash) was
re-checked and found already correct — no change there.

1. **Header's Search/Widget toggle-group wrapper had no border at all.**
   Figma (node 896:9721) strokes this outer wrapper at 0.5px `#E2E0DF`
   ("BeNoApp/Interactive Components/3") — a different value from the
   individual chip buttons' own `#DAD8D7` border. New token
   `--color-header-toggle-group-border`.
2. **StepScreen's own "N/7 steps" badge used alpha-derived color, not
   Figma's flat swatches.** Bg was `rgba(44,41,38,0.05)` (should be flat
   `#f1efee`), text was `--color-text-primary` + `opacity-50` (should be
   flat `#848281`) — the same "inferred alpha vs. flat Figma swatch" bug
   already fixed on every sibling badge (AllStepsView, My Products) except
   this one. Also had no letter-spacing at all (Figma: -0.12px, same shared
   `--letter-spacing-shade` token those siblings already reuse), and the
   "steps" label span was missing `font-weight: medium` entirely.
3. **Step title's font-size was 16px; Figma's own pull shows 15px**
   (BeautyNotes/p-18, node 896:9737) — plus no letter-spacing at all (should
   be -0.15px). New token `--letter-spacing-step-title`.
4. **Step description used `--color-text-primary` + `opacity-80`** (composites
   darker than Figma's own flat swatch) **instead of the flat `#656462`**
   (node 896:9738) — same bug class as #2, fixed the same way, reusing
   `--color-info-overlay-heading` (already that exact hex). Also missing
   -0.12px tracking.
5. **Product-sheet container's radius and border were both wrong.** V5
   (docs/figma-step-screen-restyle.md) had claimed a top-corners-only 32px
   radius; this pull's literal Figma output reads `rounded-tl-[20px]
   rounded-tr-[20px]` on the exact same node (896:9740) — treated as the
   design having moved since that earlier pull, not ambiguity, since it's a
   second independent node-specific pull directly contradicting the first.
   Border was also on all four sides; Figma only strokes top/left/right (no
   `border-b` — nothing to separate from, the sheet's bottom is flush with
   the screen edge), so the all-sides border was drawing a stray hairline at
   the viewport's bottom edge.
6. **ProductCard's brand/name text used the alpha-derived
   `--color-text-product` for StepScreen's own (`imageRadius="default"`)
   context**, deliberately left alone in plan 038 on the theory that node
   hadn't been re-pulled. This pass pulled it directly (nodes
   896:9746-9748/896:9756-9758) and found the same flat `#21201f`
   (`--color-tutorial-card-text`) AllStepsView's `imageRadius="list"`
   context already uses — not actually a different value, just never
   re-checked. Collapsed to one unconditional value.
7. **CheckIndicator's two "inferred, never confirmed" tokens were both
   wrong**, found by downloading the raw unchecked-ring SVG asset Figma
   serves (`fi-br-check`'s sibling "Group 4" asset, Product 2's check
   button) and reading its literal attributes: `--check-fill` was
   `rgba(255,255,255,0.7)` (should be `0.6`, confirmed on both the checked
   button's own bg and the raw unchecked asset's fill), and
   `--check-stroke-unchecked` was `rgba(44,41,38,0.3)` — its own comment
   admitted "exact V5 value wasn't in the pulled dump, inferred from the
   global migration" — the raw asset shows a flat `#CFCECC`
   ("BeNoApp/Borders and Separators/2"), the same swatch as
   `--color-menu-dots-icon`/`--color-chevron-icon`, not an alpha-derived ink
   color.

## What was actually built

- `tokens.css`: `--color-badge-bg` (was alpha, now flat `#f1efee`), new
  `--color-badge-text` (`#848281`), new `--color-header-toggle-group-border`
  (`#e2e0df`), `--font-size-step-title` (16px → 15px), new
  `--letter-spacing-step-title` (`-0.15px`), `--check-fill` (0.7 → 0.6),
  `--check-stroke-unchecked` (alpha → flat `#cfcecc`). Stale comments on
  `--color-text-product`/`--font-size-badge` updated to reflect current
  reality.
- `ScreenHeader.tsx`: toggle-group wrapper gained its own 0.5px border.
- `StepScreen.tsx`: badge pill + "steps" label now use flat color + tracking
  + medium weight on both spans; title gained tracking; description switched
  to flat `--color-info-overlay-heading` + tracking; product-sheet container
  radius corrected to 20px top-only, border restricted to top/left/right.
- `ProductCard.tsx`: `nameColorVar` collapsed to always
  `--color-tutorial-card-text` (was conditional on `imageRadius`).

## Boundaries — deliberately not touched

- **The eye illustration** (`EyeIllustration.tsx`) — not opened, not
  touched, per the user's own explicit instruction.
- **ProductCard's shade-line color** (`--color-text-muted-list` vs.
  `--color-text-primary` + `opacity-50` split) — Step 7's own two products
  have no shade line, so this pull has no evidence either way; left as the
  documented, still-deferred gap it already was.
- **WASH_TUNING's radial-wash values** — re-checked against this pull's own
  color stops (`rgba(245,231,222,1) 40%` → transparent) and found already
  correct; the position/radius numbers are a separately-documented, real
  on-device tuning pass (already narrower than Figma's raw numbers on
  purpose), not touched.
- **CheckIndicator's checked-state shape** (hand-drawn stroke/path vs.
  Figma's own generic `fi-br-check` icon asset) — an already-deliberate,
  previously-documented redraw (V2), not unwound; only the two color tokens
  underneath it were wrong.

## Verification

- `npx tsc -b`: clean.
- Live `getComputedStyle` checks on a real run through Step 7 (via the
  actual "Soft Smokey Eye" tutorial, the only seed data with real step
  content): badge bg `rgb(241,239,238)` / text `rgb(132,130,129)` / 12px /
  `-0.12px` / weight 500 on both spans; title 15px / `-0.15px` /
  `rgb(33,32,31)`; description 12px / `-0.12px` / `rgb(101,100,98)`;
  container `border-top/left-radius: 20px`, `border-bottom-radius: 0px`,
  `border-bottom-width: 0px`, `border-color: rgb(241,239,238)`;
  toggle-group `border-color: rgb(226,224,223)` at 0.5px; product brand/name
  `rgb(33,32,31)`; checked-circle fill `rgba(255,255,255,0.6)`; unchecked
  ring stroke `rgb(207,206,204)`. All match Figma exactly.
- Screenshot-confirmed against the Figma reference screenshot side-by-side.
- Spot-checked AllStepsView afterward (shares `CheckIndicator`/
  `--font-size-badge`/toggle-group header) — no regressions, unchecked rings
  now read as the intended lighter flat gray there too.
