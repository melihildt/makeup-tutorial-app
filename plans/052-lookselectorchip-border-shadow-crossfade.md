# 052 — LookSelectorChip: cross-fade the selected border/glow via opacity, not border-color/box-shadow

- **Status**: TODO
- **Commit**: 3ecf622
- **Severity**: MEDIUM
- **Category**: Performance (AUDIT.md §5)
- **Estimated scope**: 1 file, restructures one component's overlay layers (2 new `<div>`s, 1 existing layer relocated, no change to its own content)

## Problem

`LookSelectorChip` (`src/components/HomeScreen.tsx`) animates `border-color`
and `box-shadow` directly on the button element, alongside `transform`, on
every Day/Night/Glam selection tap:

```tsx
/* src/components/HomeScreen.tsx:194-230 — current */
<button
  type="button"
  onClick={() => {
    onClick()
    if (flash) setFlashCount((c) => c + 1)
  }}
  className="relative flex h-[46px] flex-1 select-none items-center justify-between overflow-hidden rounded-[--radius-filter-chip] border border-solid p-3 active:scale-[0.97]"
  style={{
    borderColor: selected ? borderSelected : 'var(--color-filter-chip-border)',
    boxShadow: selected ? `0px 0px 4px ${glow}, 0px 0px 16px 0px rgba(14, 11, 6, 0.03)` : 'var(--shadow-card-elevated)',
    transition:
      'border-color var(--duration-instant) var(--ease-out-quart), box-shadow var(--duration-instant) var(--ease-out-quart), transform var(--duration-instant) var(--ease-out-quart)',
  }}
>
  {/* Photo-texture background + two-layer colored tint ... */}
  {selected && (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-white" />
      <img alt="" src={texture} className="absolute inset-0 size-full object-cover object-bottom" />
      <div className="absolute inset-0" style={{ background: overlayTint, mixBlendMode: overlayBlend }} />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to left, ${gradient.from}, ${gradient.to})`,
          mixBlendMode: gradient.blend,
        }}
      />
    </div>
  )}
  {/* Press-flash sweep ... (already carries its own overflow-hidden +
      rounded-[--radius-filter-chip] — see its own comment, lines 299-307 —
      so it self-clips regardless of the button's own overflow-hidden) */}
  {flash && flashCount > 0 && (
    <div key={flashCount} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[--radius-filter-chip]">
      <div className="absolute inset-y-0 left-0 h-full" style={{ /* ...unchanged... */ }} />
    </div>
  )}
  {/* label/icon content follows, unchanged */}
```

`border-color` and `box-shadow` are both paint-triggering — every fast
Day/Night/Glam tap forces the browser to repaint rather than just
re-composite, unlike a `transform`/`opacity` change.

## Target

Split the border/shadow into two constant, non-animated layers — an
always-present "unselected" base and a "selected" overlay that cross-fades
in via `opacity` alone (compositor-only). The button itself stops animating
`border-color`/`box-shadow` and keeps only `transform` in its transition.
Because the border/glow layers now need to render *outward* past the chip's
rounded corners without being clipped, `overflow-hidden` moves off the
button itself and onto a new dedicated content-clip wrapper that holds just
the photo-texture/tint layer (the one child that actually relied on the
button's own clip — the press-flash sweep already self-clips, see its own
existing comment, and needs no change).

```tsx
/* src/components/HomeScreen.tsx:194-230 — target (button opening through
   end of the texture/tint layer; the press-flash sweep block and the
   label/icon content that follow it are unchanged) */
<button
  type="button"
  onClick={() => {
    onClick()
    if (flash) setFlashCount((c) => c + 1)
  }}
  className="relative flex h-[46px] flex-1 select-none items-center justify-between rounded-[--radius-filter-chip] p-3 active:scale-[0.97]"
  style={{ transition: 'transform var(--duration-instant) var(--ease-out-quart)' }}
>
  {/* Base (unselected) border/shadow — plans/052. Constant, never
      animated; the button used to animate border-color/box-shadow
      directly between this value and the selected one below, which are
      both paint-triggering (AUDIT.md's Performance category). Not
      overflow-hidden itself, unlike the content-clip wrapper further down
      — so this layer's own box-shadow can render outward past the chip's
      rounded corners instead of being cut off at them. */}
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 rounded-[--radius-filter-chip] border border-solid"
    style={{ borderColor: 'var(--color-filter-chip-border)', boxShadow: 'var(--shadow-card-elevated)' }}
  />
  {/* Selected-state border/glow overlay — same shape, carries the
      selected values as constants; only its own opacity cross-fades
      (compositor-only) instead of border-color/box-shadow animating
      directly. */}
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 rounded-[--radius-filter-chip] border border-solid"
    style={{
      borderColor: borderSelected,
      boxShadow: `0px 0px 4px ${glow}, 0px 0px 16px 0px rgba(14, 11, 6, 0.03)`,
      opacity: selected ? 1 : 0,
      transition: 'opacity var(--duration-instant) var(--ease-out-quart)',
    }}
  />
  {/* Content-clip layer — the photo-texture/tint layer below relies on
      being clipped to the chip's rounded rect, which used to come from
      the button's own overflow-hidden (removed above, so the border/glow
      layers can render past the corners). Gets its own overflow-hidden +
      rounded-[--radius-filter-chip] instead, same "give this its own
      explicit clip" pattern the press-flash sweep below already uses for
      the identical reason (see that element's own comment). */}
  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[--radius-filter-chip]">
    {selected && (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-white" />
        <img alt="" src={texture} className="absolute inset-0 size-full object-cover object-bottom" />
        <div className="absolute inset-0" style={{ background: overlayTint, mixBlendMode: overlayBlend }} />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to left, ${gradient.from}, ${gradient.to})`,
            mixBlendMode: gradient.blend,
          }}
        />
      </div>
    )}
  </div>
  {/* Press-flash sweep — UNCHANGED, stays exactly where it was, as a
      direct child of the button (not moved into the content-clip layer
      above) since it already carries its own overflow-hidden +
      rounded-[--radius-filter-chip]. */}
  {flash && flashCount > 0 && (
    <div key={flashCount} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[--radius-filter-chip]">
      {/* ...unchanged... */}
    </div>
  )}
  {/* label/icon content — UNCHANGED */}
```

## Repo conventions to follow

- Opacity-only cross-fades between two constant-valued layers, instead of
  animating a paint property directly, is the same fix this batch already
  applied to `AllStepsView`'s sticky header (`plans/051`) — same reasoning,
  same shape.
- "Give this layer its own explicit `overflow-hidden` + matching
  `rounded-[--radius-filter-chip]` instead of relying on a parent's clip" is
  already this exact file's own established fix for a mix-blend-mode bleed
  bug — see the press-flash sweep's own comment
  (`src/components/HomeScreen.tsx:299-307`, "Giving this element its own
  explicit radius (plus its own overflow-hidden, redundant with the parent
  in the well-behaved case but the actual fix in the buggy one) is the
  standard fix for that specific bleed") — the content-clip wrapper this
  plan adds follows that same precedent for the texture/tint layer.
- `aria-hidden="true"` + `pointer-events-none` on purely decorative
  absolutely-positioned layers is this file's own established pattern
  (the existing texture/tint layer and flash-sweep both already do this).

## Steps

1. In `src/components/HomeScreen.tsx`, on the `LookSelectorChip` button's
   `className` (currently line 223), remove `overflow-hidden`, `border`,
   and `border-solid` — leaving `"relative flex h-[46px] flex-1 select-none
   items-center justify-between rounded-[--radius-filter-chip] p-3
   active:scale-[0.97]"`.
2. Replace the button's `style` object (currently lines 224-229) with just
   `{ transition: 'transform var(--duration-instant) var(--ease-out-quart)' }`.
3. Immediately after the button's opening tag, insert the two new layers
   (base border/shadow, then selected-state overlay) exactly as shown in
   Target above.
4. Wrap the existing texture/tint layer (currently the `{selected && (...)}`
   block, lines 241-253) in the new content-clip `<div className="pointer-
   events-none absolute inset-0 overflow-hidden rounded-[--radius-filter-chip]">`
   shown in Target above — the texture/tint block's own internal JSX is
   otherwise unchanged.
5. Leave the press-flash sweep block (`{flash && flashCount > 0 && (...)}`,
   currently starting at line 308) exactly where it is, unmodified — do not
   move it inside the new content-clip wrapper from step 4.
6. Leave every remaining child (label/icon content) unmodified.

## Boundaries

- Do NOT change `selected`, `borderSelected`, `glow`, or any other prop/value
  this component receives — only how the border/shadow states are rendered.
- Do NOT touch the press-flash sweep's own internals (its keyframe, gradient,
  or comment) — it already self-clips and needs no change, only to stay
  outside the new content-clip wrapper.
- Do NOT touch `LOOK_TYPES`, any other component in this file, or any other
  file.
- If the current code doesn't match the Problem snippet above (drift since
  commit `3ecf622`), STOP and report instead of improvising — this fix
  depends on the exact current layering (texture layer relying on the
  button's own clip, flash sweep already self-clipping), so verify that
  hasn't changed before proceeding.

## Verification

- **Mechanical**: `npx tsc --noEmit` clean. `npm run build` clean.
- **Feel check**: on the Home screen, tap between Day/Night/Glam repeatedly.
  - Each chip's border and glow should still visually swap between
    unselected/selected exactly as before — same colors, same glow spread,
    same ~150ms speed.
  - Confirm the photo-texture/tint layer still renders correctly clipped to
    the chip's rounded corners (no square corners poking out) on whichever
    chip is currently selected.
  - Confirm the press-flash sweep still plays correctly on tap, still
    clipped to the rounded shape, with no visible bleed at the corners
    (this element's own clipping is unchanged, so this is a regression
    check, not a new behavior).
  - Confirm the selected-chip glow (the `boxShadow`'s soft outer glow) is
    still fully visible extending past the chip's edges, not clipped square
    at the corners — this is the main risk of this restructuring, since the
    border/glow layers are no longer inside an `overflow-hidden` ancestor,
    but also must not accidentally render past where the old version did.
  - In DevTools' Animations panel, set playback to 10% on a chip tap and
    confirm the selected-overlay's `opacity` animates smoothly with the
    `transform` press-scale, and no border/shadow *value* interpolation is
    visible (the swap should look like a clean cross-fade, not a color
    animating through intermediate hues).
  - Toggle `prefers-reduced-motion` and confirm the selected state still
    lands correctly, collapsed to the global near-instant timing.
- **Done when**: the button no longer animates `border-color`/`box-shadow`
  directly — only the new overlay's `opacity` does — and every chip's visual
  appearance (border, glow, texture clipping, flash sweep) is unchanged from
  before this edit.
