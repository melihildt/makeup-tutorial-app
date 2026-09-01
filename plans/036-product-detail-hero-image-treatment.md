# 036 — ProductDetailOverlay's hero image: bigger card, new shadow value

- **Status**: DONE
- **Severity**: MEDIUM
- **Category**: Cohesion & tokens (design-source sync)
- **Estimated scope**: 2 files — `src/styles/tokens.css` (one new
  token), `src/components/ProductDetailOverlay.tsx` (one element).
- **Source**: Figma file `6Mr7K0RONTS8SltZRJtqYj`, section "New", node
  `896:10461` (see plan 035 for why this node — a "Home/About" duplicate
  repurposed to demo this overlay).

## Problem

```tsx
/* ProductDetailOverlay.tsx:123-134 — current */
<motion.div
  className="relative size-[238px] shrink-0 overflow-hidden rounded-[24px] border border-solid"
  style={{
    borderColor: 'var(--color-border-hairline)',
    // --shadow-filter-chip's own exact value (code review
    // finding), hand-copied as a raw literal instead of
    // referencing the token — same value HomeScreen.tsx's
    // filter chips and InfoOverlay's own card already
    // reference by name.
    boxShadow: 'var(--shadow-filter-chip)',
    background: 'var(--color-image-placeholder)',
  }}
```

Figma's pull shows this same hero card (node `896:10485`) at a larger
`282px` (was `238px`) with a shadow that matches neither
`--shadow-filter-chip` (`0px 0px 8px rgba(14,11,6,0.03)`, tokens.css) nor
either shadow token this round already introduced
(`--shadow-card`/`--shadow-card-elevated`, both `2px`/`6px` spread):
`0px 0px 24px 0px rgba(14,11,6,0.03)` — 24px blur, **zero** spread. A
genuinely new value, not a rounding of an existing token.

`borderColor: 'var(--color-border-hairline)'` is already correct and needs
no change here — plan 034 updates that token's own value; this file just
inherits it.

## Target

Add a new token to `tokens.css`, near the other shadow tokens:

```css
/* tokens.css — target, near --shadow-filter-chip */
--shadow-product-detail-image: 0px 0px 24px 0px rgba(14, 11, 6, 0.03); /* V6
  — Figma's "New" section (node 896:10461/896:10485), Product Detail
  overlay's own hero image card. Same color as --shadow-card family, but a
  distinct blur/spread (24px blur, 0 spread) — not a rounding of
  --shadow-filter-chip or --shadow-card-elevated. See
  plans/036-product-detail-hero-image-treatment.md. */
```

```tsx
/* ProductDetailOverlay.tsx:123-134 — target */
<motion.div
  className="relative size-[282px] shrink-0 overflow-hidden rounded-[24px] border border-solid"
  style={{
    borderColor: 'var(--color-border-hairline)',
    boxShadow: 'var(--shadow-product-detail-image)',
    background: 'var(--color-image-placeholder)',
  }}
```

## Repo conventions to follow

- One token per meaning even at a similar-but-not-identical value — this
  file's own established pattern (`--shadow-card` vs.
  `--shadow-tutorial-card`, `--shadow-card` vs. `--shadow-card-elevated`).
  Don't reuse `--shadow-filter-chip` or `--shadow-card-elevated` for a
  value that's actually different from both.

## Steps

1. Add `--shadow-product-detail-image` to `tokens.css`, exactly as shown
   in **Target**.
2. Update `ProductDetailOverlay.tsx`'s hero image `motion.div`: change
   `size-[238px]` to `size-[282px]` and `boxShadow` to
   `var(--shadow-product-detail-image)`.
3. Run `npx tsc -b`.

## Boundaries

- Do NOT change `--shadow-filter-chip`'s own value — it's still correct
  for whatever else uses it (HomeScreen's filter chips, InfoOverlay's
  card).
- Do NOT touch this element's animation (`initial`/`animate`/`exit`
  transitions) — this plan only touches size and shadow, not motion.
- Do NOT touch the product name/brand typography inside this same
  overlay — that's a separate, larger finding (raised alongside this one
  but not yet planned; the product name moving to a 28px EB Garamond
  treatment, plus a new "Shade/Category/Purchase on" info-row section,
  needs a data-model decision before it can be planned — see the
  conversation that produced this plan).
- If the current markup at `ProductDetailOverlay.tsx:123-134` doesn't
  match what's quoted above, STOP and report.

## Verification

- **Mechanical**: `npx tsc -b` — expect no errors.
  `grep -n "shadow-product-detail-image" src/styles/tokens.css src/components/ProductDetailOverlay.tsx` — expect the token definition plus one usage.
- **Visual**: open a product's detail overlay — the hero image card should
  read noticeably larger (282px vs. 238px) with a softer, more spread-out
  shadow than before.
- **Done when**: the hero image card matches Figma's size and shadow
  exactly, with no change to its border color (already correct) or its
  entrance/exit animation.
