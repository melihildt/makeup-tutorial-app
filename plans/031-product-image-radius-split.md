# 031 — Split product-image corner radius: AllStepsView/My Products want 12px, StepScreen stays 8px

- **Status**: DONE
- **Severity**: MEDIUM
- **Category**: Cohesion & tokens (design-source sync)
- **Estimated scope**: 3 files — `src/styles/tokens.css` (one new token),
  `ProductCard.tsx` (new optional prop), `AllStepsView.tsx` (pass the new
  prop at its one call site), `MyProductsScreen.tsx` (its own inline
  duplicate image block, not via `ProductCard`).
- **Source**: Figma file `6Mr7K0RONTS8SltZRJtqYj`, section "New" (node
  `906:12628`).

## Problem

`ProductCard.tsx` is shared by both `StepScreen.tsx` and `AllStepsView.tsx`
and hardcodes one radius token for its image:

```tsx
/* ProductCard.tsx:34 — current */
<div className="h-[--size-product-image-h] w-[--size-product-image-w] shrink-0 overflow-hidden rounded-[--radius-image] border-[0.5px] border-[--color-border-hairline] bg-[--color-image-placeholder]">
```

`--radius-image` is `8px` (tokens.css:75), "confirmed on Step 1 and Step
7's pulls" per that token's own comment. This round's fresh pull confirms
Step 7's own product image (`896:9743`) is still `rounded-[8px]` —
unchanged. But **All Steps'** product images (`896:9851` and every other
`Product N` node in that frame) and **My Products'** own inline product
images (`896:10211`/`896:10221`/etc., a separate hand-copied block, not
`ProductCard`) both now show `rounded-[12px]`.

Because `ProductCard.tsx` is genuinely shared, bumping `--radius-image`
itself to `12px` would silently break StepScreen (still correctly `8px`)
to fix AllStepsView — the two callers now want different values.

## Target

Add a second radius token to `tokens.css`, immediately after
`--radius-image` (current line 75):

```css
/* tokens.css — target, inserted after --radius-image */
--radius-image: 8px;   /* unchanged — StepScreen's own product row, confirmed still correct this pass */
--radius-image-list: 12px; /* V6 — AllStepsView's per-step-group product
  image and My Products' own product image both confirmed at 12px this
  pass (node 896:9851, 896:10211), distinct from StepScreen's 8px on the
  exact same shared ProductCard component. See
  plans/031-product-image-radius-split.md. */
```

Give `ProductCard.tsx` an optional prop, defaulting to the existing
behavior so StepScreen's call site needs no change:

```tsx
/* ProductCard.tsx:3-19 — target */
type ProductCardProps = {
  image?: string
  brand: string
  name: string
  shade?: string
  checked: boolean
  animate?: boolean
  /** Image corner radius variant. 'default' (--radius-image, 8px) is
   *  StepScreen's own per-step product row. 'list' (--radius-image-list,
   *  12px) is AllStepsView's per-step-group list — a real, confirmed
   *  difference in the current Figma file even though both call this same
   *  shared component, not a rounding of one value into the other. */
  imageRadius?: 'default' | 'list'
  onToggleChecked?: () => void
}
```

```tsx
/* ProductCard.tsx:31-36 — target */
export function ProductCard({ image, brand, name, shade, checked, animate = true, imageRadius = 'default', onToggleChecked }: ProductCardProps) {
  const radiusVar = imageRadius === 'list' ? '--radius-image-list' : '--radius-image'
  return (
    <div className="flex w-full items-start gap-4">
      <div
        className="h-[--size-product-image-h] w-[--size-product-image-w] shrink-0 overflow-hidden border-[0.5px] border-[--color-border-hairline] bg-[--color-image-placeholder]"
        style={{ borderRadius: `var(${radiusVar})` }}
      >
        {image && <img src={image} alt="" className="size-full object-cover" />}
      </div>
      {/* ...rest unchanged */}
```

Update AllStepsView's one call site to pass the new prop:

```tsx
/* AllStepsView.tsx:400-408 — target */
<ProductCard
  key={key}
  image={product.image}
  brand={product.brand}
  name={product.name}
  shade={product.shade}
  checked={checked}
  animate={justToggledKeys.has(key)}
  imageRadius="list"
  onToggleChecked={() => onToggleChecked(key, product.checked, step)}
/>
```

`MyProductsScreen.tsx`'s own inline image block (not `ProductCard`) just
changes its token directly:

```tsx
/* MyProductsScreen.tsx:64 — target */
<div className="h-[--size-product-image-h] w-[--size-product-image-w] shrink-0 overflow-hidden rounded-[--radius-image-list] border-[0.5px] border-[--color-border-hairline] bg-[--color-image-placeholder]">
```

`StepScreen.tsx`'s `ProductCard` call site needs **no change** —
`imageRadius` defaults to `'default'`, preserving its current `8px`.

## Repo conventions to follow

- New variant props default to whatever preserves existing behavior at
  every current call site that doesn't explicitly opt in — same pattern as
  `ProductCard`'s own `animate = true` default.
- One token per meaning even when a rounding-off might look tempting —
  `--radius-image`/`--radius-image-list` stay separate, matching this
  file's established convention elsewhere.
- `MyProductsScreen.tsx`'s inline duplicate of `ProductCard`'s image markup
  is a known, already-deferred reuse gap (see the Bookmarks-era code
  review notes) — this plan does NOT fix that dedup; it only updates the
  one token value inside the existing duplicate, same as any other
  token-only change would.

## Steps

1. Add `--radius-image-list` to `tokens.css` immediately after
   `--radius-image`, exactly as shown in **Target**.
2. Update `ProductCard.tsx`'s props type and function signature to add
   `imageRadius`, and switch the image `<div>` from a `rounded-[...]`
   class to an inline `borderRadius` style driven by the prop.
3. Update `AllStepsView.tsx`'s one `<ProductCard>` call site to pass
   `imageRadius="list"`.
4. Update `MyProductsScreen.tsx:64`'s `rounded-[--radius-image]` to
   `rounded-[--radius-image-list]`.
5. Run `npx tsc -b` — confirm no type errors, and that `StepScreen.tsx`'s
   `ProductCard` call site still compiles unchanged (it should, since the
   new prop is optional).

## Boundaries

- Do NOT change `StepScreen.tsx`'s `ProductCard` call site — it must keep
  the default `8px` radius, confirmed still correct this pass.
- Do NOT change `--radius-image`'s own value.
- Do NOT touch `BookmarksScreen.tsx`'s own product-thumbnail radius
  (`--radius-image`, line 139) — Bookmarks wasn't pulled this round; leave
  it as-is until a future pass confirms it one way or the other.
- Do NOT use this plan as an opportunity to deduplicate
  `MyProductsScreen.tsx`'s inline image markup into `ProductCard` — that's
  a separate, already-known reuse gap, out of scope here.
- If `ProductCard.tsx`'s current markup or either call site no longer
  matches what's quoted above, STOP and report.

## Verification

- **Mechanical**: `npx tsc -b` — expect no errors.
  `grep -n "radius-image-list" src/styles/tokens.css src/components/ProductCard.tsx src/components/AllStepsView.tsx src/components/MyProductsScreen.tsx` — expect the token definition plus 3 usages.
- **Visual**: open a step screen's product checklist — images should look
  unchanged (still 8px corners). Open All Steps and My Products — their
  product images should now read with a slightly rounder, more pronounced
  corner (12px) than before, distinct from StepScreen's.
- **Done when**: StepScreen's product images are pixel-for-pixel unchanged,
  and All Steps'/My Products' product images match the fresh Figma pull's
  12px radius.
