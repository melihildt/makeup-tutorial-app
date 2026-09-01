# 032 — Header icon-button border: alpha approximation → flat Figma swatch

- **Status**: DONE
- **Severity**: LOW
- **Category**: Cohesion & tokens (design-source sync)
- **Estimated scope**: 1 file, 1 token value (`src/styles/tokens.css`,
  `--color-header-icon-border`) — cascades via `HEADER_CHIP_STYLE`
  (`ScreenHeader.tsx`) to every consumer, no per-component edits needed.
- **Source**: Figma file `6Mr7K0RONTS8SltZRJtqYj`, section "New" (node
  `906:12628`).

## Problem

```css
/* tokens.css:167 — current */
--color-header-icon-border: rgba(44, 41, 38, 0.2); /* V4: 0.5px hairline on those same boxes */
```

This token was originally derived as an alpha value on top of the app's
ink color. The current Figma file has a real named swatch for this exact
border instead — `BeNoApp/Borders and Separators/1: #DAD8D7` (flat, not
alpha) — confirmed on Step 7's header buttons (`896:9719`/`896:9722`/
`896:9726`), All Steps' header (`896:9828`/`896:9833`/`896:9835`), and
Home/DaySelected's header icons (`903:12165`/`903:12167` and the newest
duplicate, `906:12637`/`906:12639`).

**Why it matters less than the others in this round**: `rgba(44,41,38,0.2)`
composited over this app's white/cream surfaces already renders very
close to `#dad8d7` — this is a cohesion cleanup (moving from an
alpha-derived approximation to Figma's actual defined swatch) rather than
a value most users would consciously notice changed. Lowest priority of
this batch; safe to defer if time is short.

## Target

```css
/* tokens.css:167 — target */
--color-header-icon-border: #dad8d7; /* V6 (was rgba(44,41,38,0.2)) —
  Figma's "New" section (node 906:12628) defines this as a flat named
  swatch, "BeNoApp/Borders and Separators/1", not an alpha derivation of
  the ink color. Visually near-identical to the old value over this app's
  white/cream surfaces — a cohesion correction, not a visible redesign.
  See plans/032-header-icon-border-flat-swatch.md. */
```

No other line changes. `HEADER_CHIP_STYLE` (`ScreenHeader.tsx`) already
reads `var(--color-header-icon-border)` and needs no edit — every
consumer (`ScreenHeader.tsx`, `HomeScreen.tsx`, `InfoOverlay.tsx`,
`AccountScreen.tsx`, `MyProductsScreen.tsx`, `BookmarksScreen.tsx`,
`ProductDetailOverlay.tsx`, all confirmed via `grep -rn "HEADER_CHIP_STYLE"`)
picks up the new value automatically.

## Repo conventions to follow

- Versioned in place with a `V6` comment, same convention as every other
  token in this file.
- `HEADER_CHIP_STYLE` was specifically exported (per its own comment in
  `ScreenHeader.tsx`) so every consumer shares one definition instead of
  re-typing the object literal — this plan is exactly the kind of change
  that payoff exists for for; don't touch any individual call site.

## Steps

1. In `src/styles/tokens.css`, change line 167's value and comment as
   shown in **Target**.
2. Run `npx tsc -b` (no errors expected — CSS-only change).

## Boundaries

- Do NOT touch `--color-header-icon-bg` (tokens.css:166,
  `rgba(255,255,255,0.6)`) — not part of this finding; the fresh pulls
  show that value unchanged (still an alpha white, matches
  `White / 60%: #FFFFFF` in Figma's own variable list, which is itself
  alpha-flavored, not a flat swatch).
- Do NOT touch `HEADER_CHIP_STYLE`'s own definition beyond what the token
  cascade already handles — it should need zero edits.
- If the current value at `tokens.css:167` doesn't match what's quoted in
  Problem (drift since this plan was written), STOP and report.

## Verification

- **Mechanical**: `npx tsc -b` — expect no errors.
  `grep -n "color-header-icon-border:" src/styles/tokens.css` — expect
  `#dad8d7`.
- **Visual**: side-by-side comparison of any header icon button
  (back/search/checklist/done/info/user/close) before and after — expect
  no perceptible difference at normal viewing distance; zoom in devtools
  if you want to confirm the exact pixel value changed.
- **Done when**: the token holds the flat Figma swatch value, and every
  header icon button across the app still reads with the same subtle
  hairline border it always had.
