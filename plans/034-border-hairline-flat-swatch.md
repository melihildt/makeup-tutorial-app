# 034 — --color-border-hairline: alpha approximation → flat Figma swatch

- **Status**: DONE
- **Severity**: LOW-MEDIUM (small value delta, but a real 6-file cascade)
- **Category**: Cohesion & tokens (design-source sync)
- **Estimated scope**: 1 file, 1 token value (`src/styles/tokens.css`,
  `--color-border-hairline`) — cascades to every consumer via `var(...)`,
  no per-component edits needed.
- **Source**: Figma file `6Mr7K0RONTS8SltZRJtqYj`, section "New" — same
  finding independently confirmed on Bookmarks (node `896:10571`) and the
  Product Detail overlay (node `896:10485`).

## Problem

Plan 032 fixed `--color-header-icon-border` — `rgba(44,41,38,0.2)` → the
flat `#dad8d7` swatch Figma's current file actually defines — but scoped it
narrowly to header icon buttons. The exact same alpha value is also used
for every product image's hairline border:

```css
/* tokens.css:40 — current */
--color-border-hairline: rgba(44, 41, 38, 0.2); /* V5 (was rgba(14,11,6,0.05)) — real contrast increase, not just a recolor */
```

Bookmarks' product images (node `896:10571`) and the Product Detail
overlay's hero image (node `896:10485`) both show this exact border as
flat `#dad8d7` — the same "BeNoApp/Borders and Separators/1" swatch plan
032 already identified, just a different token carrying the same old
alpha value.

**Why it matters**: this is the same migration as plan 032, just missed on
a second token that happened to share the pre-migration value. One fix
here cascades correctly to every consumer.

## Target

```css
/* tokens.css:40 — target */
--color-border-hairline: #dad8d7; /* V6 (was rgba(44,41,38,0.2)) — same
  migration as --color-header-icon-border (plan 032): Figma's "New"
  section defines this as the flat "BeNoApp/Borders and Separators/1"
  swatch, not an alpha derivation of the ink color. Confirmed on
  Bookmarks' product images (896:10571) and the Product Detail overlay's
  hero image (896:10485). See plans/034-border-hairline-flat-swatch.md. */
```

No other line changes. Consumers (`ProductCard.tsx`, `MyProductsScreen.tsx`,
`BookmarksScreen.tsx`, `AccountScreen.tsx`, `Toast.tsx`,
`ProductDetailOverlay.tsx`, all confirmed via
`grep -rln "color-border-hairline"`) pick up the new value automatically.

## Repo conventions to follow

- Versioned in place with a `V6` comment, same convention as every other
  token in this file, and explicitly cross-references plan 032 since it's
  the same underlying migration on a sibling token.

## Steps

1. In `src/styles/tokens.css`, change line 40's value and comment as shown
   in **Target**.
2. Run `npx tsc -b` (no errors expected — CSS-only change).

## Boundaries

- Do NOT touch `--color-header-icon-border` — already fixed by plan 032.
- Do NOT touch `--color-image-placeholder`, `--color-badge-bg`, or any
  other token — only this one line.
- `AccountScreen.tsx`'s own consumer of this token is its row-icon boxes
  (`ROW_ICON_STYLE`) — confirm this still reads correctly after the change
  (same value, same visual weight expected) rather than assuming it's
  unaffected just because it wasn't explicitly cited above.
- If the current value at `tokens.css:40` doesn't match what's quoted in
  Problem (drift since this plan was written), STOP and report.

## Verification

- **Mechanical**: `npx tsc -b` — expect no errors.
  `grep -n "color-border-hairline:" src/styles/tokens.css` — expect
  `#dad8d7`.
- **Visual**: compare a product image's border (StepScreen, All Steps, My
  Products, Bookmarks) and Account's row-icon boxes before/after — expect
  no perceptible difference at normal viewing distance, same as plan 032's
  own verification note.
- **Done when**: the token holds the flat Figma swatch value, and no
  product image or icon box using it looks visibly different.
