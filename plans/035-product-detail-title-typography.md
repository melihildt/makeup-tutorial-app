# 035 — ProductDetailOverlay's title: same stale pattern plan 030 already fixed everywhere else

- **Status**: DONE
- **Severity**: MEDIUM
- **Category**: Cohesion & tokens (design-source sync)
- **Estimated scope**: 1 file (`src/components/ProductDetailOverlay.tsx`),
  1 element.
- **Source**: Figma file `6Mr7K0RONTS8SltZRJtqYj`, section "New", node
  `896:10461` — a second "Home/About" duplicate repurposed to demo this
  overlay (its Top Header reads "Product Detail", not "About" — the
  underlying "Home/About" background content behind it is stale/
  irrelevant per the user's own call, only the foreground overlay matters
  here). Not pulled during the original 6-plan pass, which only checked
  Account/My Products/Bookmarks/About's shared title — this file has the
  exact same pattern and was simply missed.

## Problem

```tsx
/* ProductDetailOverlay.tsx:74-80 — current */
<div className="flex shrink-0 items-start justify-between px-[--space-sm] pt-[--space-2xs]">
  <p
    className="text-[20px] tracking-[-0.4px]"
    style={{ color: 'var(--color-info-overlay-heading)', fontWeight: 'var(--font-weight-medium)' }}
  >
    Product Detail
  </p>
```

This is verbatim the same pattern plan 030 already moved
Account/My Products/Bookmarks/About onto EB Garamond for — this file's own
module comment even says so ("identical shape/tokens to InfoOverlay's
own... and to AccountScreen/MyProductsScreen's own title row"), which is
exactly why it should have been included in that plan and wasn't. Figma's
pull confirms: `font-['EB_Garamond:Regular'] text-[24px] tracking-[-0.24px]`
on this exact "Product Detail" title (node `896:10481`).

## Target

```tsx
/* ProductDetailOverlay.tsx:74-80 — target */
<div className="flex shrink-0 items-start justify-between px-[--space-sm] pt-[--space-2xs]">
  <p
    style={{
      fontFamily: 'var(--font-family-serif-card)',
      fontSize: 'var(--font-size-title-serif)',
      letterSpacing: 'var(--letter-spacing-title-serif)',
      color: 'var(--color-info-overlay-heading)',
      fontWeight: 'var(--font-weight-medium)',
    }}
  >
    Product Detail
  </p>
```

(Same `--font-family-serif-card`/`--font-size-title-serif`/
`--letter-spacing-title-serif` tokens plan 030 already added — no new
tokens needed here, just this one more call site.)

## Repo conventions to follow

- Exactly the same pattern as plan 030's four call sites — this is that
  plan's fifth, just discovered after the fact.

## Steps

1. Update `ProductDetailOverlay.tsx:75-78`'s title `<p>` to match the
   target above (drop the `text-[20px] tracking-[-0.4px]` className, add
   the three typography properties to the inline style).
2. Run `npx tsc -b`.

## Boundaries

- Do NOT touch the "Close product detail" button or anything else in this
  header row.
- Do NOT touch this file's product-name typography (see plan 036 — that's
  a separate, larger finding on the same file).
- If the current lines don't match what's quoted above, STOP and report.

## Verification

- **Mechanical**: `npx tsc -b` — expect no errors.
  `grep -n "font-size-title-serif" src/components/ProductDetailOverlay.tsx` — expect one hit.
- **Visual**: open a product's detail overlay (My Products → tap a
  product row) — its "Product Detail" title should now read in the same
  serif as Account/My Products/Bookmarks/About's own headers.
- **Done when**: every one of the app's five overlay/screen headers using
  this shared title pattern is confirmed on EB Garamond — none left on the
  old plain-Inter 20px style.
