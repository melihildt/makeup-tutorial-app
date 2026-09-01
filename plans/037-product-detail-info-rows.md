# 037 — Add the Shade/Category/Purchase-on info rows to ProductDetailOverlay

- **Status**: DONE
- **Severity**: MEDIUM-HIGH (new content section, not just a token value)
- **Category**: Missing feature / design-source sync
- **Estimated scope**: 3 files — `src/data/stepContent.ts` (new
  `Product.purchasedAt` field + dummy values), `src/styles/tokens.css`
  (new token section), `src/components/ProductDetailOverlay.tsx` (new
  markup).
- **Source**: Figma file `6Mr7K0RONTS8SltZRJtqYj`, section "New", node
  `896:10461` (see plan 035 for why this node). Raised alongside plans
  035/036 but deliberately not planned then — it needed a data-model
  decision (real category/purchase-date data, or placeholder?) the user
  hadn't made yet. Answered directly: "can you ad dd the categories
  missing in this page? put dummy data if needed."

## Problem

Figma's Product Detail overlay shows the product name as its own
headline, followed by three bordered info rows — Shade, Category,
Purchase on:

```tsx
/* node 896:10486-896:10501 — current design, not yet in code */
<p font-EB_Garamond text-28px>The Minimalist</p>
<row label="SHADE" value="Ochre" />
<row label="CATEGORY" value="Concealer" />
<row label="PURCHASE ON" value="06/2025" />
```

Before this plan, `ProductDetailOverlay.tsx` only showed brand + name (both
small, matching each other) and, optionally, a single muted shade line —
no Category or Purchase-on content at all, even though `Product.category`
already existed in the data model and was simply never surfaced on this
screen.

## What was actually built

**`Product.category` is real data** — every product already has one
(`ProductCategory` union, `src/data/stepContent.ts`), just never rendered
here. No placeholder needed for this field.

**`Product.purchasedAt?: string`** — genuinely new, added to the `Product`
type with a doc comment marking it as placeholder data (no real
purchase-tracking feature exists). Dummy values assigned per distinct
product (same value at every repeated occurrence of that product across
steps, not re-randomized each time):

| Product | `purchasedAt` |
| --- | --- |
| MERIT — The Minimalist | `06/2025` (matches Figma's own example exactly) |
| Hourglass — Concealer Brush | `04/2025` |
| Chanel — Les 4 Ombres | `11/2024` |
| Merit — Brush No. 2 | `03/2025` |
| Charlotte Tilbury — Highlighter | `09/2024` |
| Westman Atelier — Eye Pencil | `01/2025` |
| Westman Atelier — Eye Want You Mascara | `01/2025` |

**New tokens** (`tokens.css`, "Product Detail overlay" section, right
after "Account / My Products"): `--font-size-product-detail-title` (28px)
+ `--letter-spacing-product-detail-title` (-0.28px) for the product-name
headline; `--font-size-detail-row-label`/`--letter-spacing-detail-row-label`
(12px/+0.24px, positive tracking — confirmed on the pull, not a typo) for
the uppercase row labels; `--font-size-detail-row-value`/
`--letter-spacing-detail-row-value` (13px/-0.13px) for row values;
`--color-detail-row-border` (`rgba(44,41,38,0.1)`, kept distinct from
`--color-border-hairline` per this file's one-token-per-meaning
convention). Row label/value colors reuse existing tokens
(`--color-info-overlay-heading` / `--color-tutorial-card-text`) rather
than new ones — same two values confirmed on the pull.

**`ProductDetailOverlay.tsx`**: the brand line moved off
`--font-size-product-name`/`--color-text-product` (which it used to share
with the product-name line) onto its own inline style
(`--font-size-product-name`/semibold/`0.14px` tracking/
`--color-tutorial-card-text`) — a genuinely different positive-tracking
value from `--letter-spacing-tight` (-0.14px), not a sign-flip typo. The
product name became its own headline: `--font-family-serif-card` /
`--font-size-product-detail-title` / `--letter-spacing-product-detail-title`
/ `--color-tutorial-card-text`. A `detailRows` array
(`[shade?, category, purchasedAt?].filter(...)`) replaces the old
single-line shade paragraph, rendered as bordered rows (first row gets a
top border, every row gets a bottom border) — built as a filtered list
rather than three hand-written conditional blocks so "is this the first
row" doesn't need separate tracking per block. The info-block's
`max-w-[238px]` also became `max-w-[282px]` to match the hero image's new
width (plan 036).

## Repo conventions to follow

- Reused existing tokens for colors (`--color-info-overlay-heading`,
  `--color-tutorial-card-text`) rather than inventing new ones for the
  same two values — same discipline as every prior plan in this round.
- New typography values got their own tokens even where a value might
  look reusable (`--font-size-product-detail-title` vs. the existing
  `--font-size-title-serif`) — 28px is a distinct size from the 24px
  shared screen-title treatment, not a rounding of it.
- Placeholder/dummy data gets an explicit doc comment saying so
  (`Product.purchasedAt`'s own comment) rather than reading as real
  tracked data to a future reader of this file.

## Verification

- **Mechanical**: `npx tsc -b` clean.
  `grep -n "font-size-product-detail-title\|font-size-detail-row" src/styles/tokens.css` — all four new tokens present.
- **Visual, live-verified**: opened MERIT "The Minimalist" (no shade) —
  renders brand, headline name, Category ("Concealer") and Purchase on
  ("06/2025") rows, no Shade row (correctly skipped, no data). Opened
  Chanel "Les 4 Ombres" (has a shade) — renders all three rows: Shade
  ("79 - Spices"), Category ("Eye Shadows"), Purchase on ("11/2024").
  Screenshot confirms visual match to the Figma pull: serif headline,
  bordered rows, correct spacing. No console errors.
- **Done when**: every product's detail overlay shows Category (real
  data) and, where available, Shade and Purchase-on (the latter
  placeholder) in the bordered row layout — confirmed on two different
  products, one with a shade and one without.
