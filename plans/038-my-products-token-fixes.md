# 038 — My Products screen: icon/text color bugs + missing sheet-container border

- **Status**: DONE
- **Severity**: MEDIUM (visible tone mismatches across a whole screen +
  a missing stroke on four shared containers)
- **Category**: Design-token sync (colors, borders, spacing) —
  same Figma file `6Mr7K0RONTS8SltZRJtqYj`, node `896:10192`
  ("Home/Profile-MyProducts").
- **Source**: User asked to verify My Products against Figma — "Colors on
  typography, icons colors, backgrounds, shadows, borders colors and
  size, spacings, etc. Fix what's needed... apply these changes in each
  component (row, token, etc)."
- **Scope**: `src/components/icons.tsx`, `src/components/MyProductsScreen.tsx`,
  `src/components/AccountScreen.tsx`, `src/components/AllStepsView.tsx`,
  `src/components/StepScreen.tsx`, `src/styles/tokens.css`.

## Findings

A fresh `get_design_context`/`get_variable_defs` pull of node `896:10192`
(plus raw-asset `curl` checks on the icon SVGs Figma serves, and
`get_variable_defs` cross-checks on the other three `--shadow-card-elevated`
nodes) turned up five real, confirmed mismatches:

1. **PlusIcon (My Products' "Add" button) had a stale `fillOpacity={0.8}`.**
   Same bug class as CloseIcon (plan from the prior session): the raw
   `fi-br-plus-small` asset Figma serves bakes a flat `#656462` fill, not
   an opacity-reduced ink color. 0.8 opacity over `--color-tutorial-card-text`
   rendered visibly darker than the real color.
2. **MenuDotsIcon (every row's "⋮") had a stale `fillOpacity={0.5}`.**
   The raw `fi-br-menu-dots-vertical` asset bakes a flat `#CFCECC`
   ("BeNoApp/Borders and Separators/2") — a distinctly lighter, warmer
   gray than 0.5 opacity over the dark ink token produces. New token:
   `--color-menu-dots-icon`.
3. **Product brand/name text used `--color-text-product` (rgba(44,41,38,0.8),
   composites to ~`#565451`) instead of a flat `#21201f`.** Every one of
   the 7 product rows in the fresh pull shows flat `--color-tutorial-card-text`,
   not the alpha-derived token `MyProductRow` copied from `ProductCard.tsx`'s
   own (differently-confirmed, different-node) styling.
4. **The "N product(s)" badge text used the same wrong `--color-text-product`**
   instead of the flat `--color-info-overlay-heading` (`#656462`) the fresh
   pull shows on every one of the 5 badge instances.
5. **The sheet/list container (`--radius-card` + `--shadow-card-elevated`
   pattern) was missing its own 0.5px `#F1EFEE` hairline border everywhere.**
   `get_variable_defs` confirmed `"BeNoApp/Interactive Components/1": "#F1EFEE"`
   present on all four nodes `--shadow-card-elevated`'s own tokens.css
   comment already cites: Step 7 (`896:9740`), All Steps (`896:9838`), My
   Products (`896:10202`), Account (`896:10380`) — the shadow token was
   pulled from these before, the border on the same node just wasn't
   caught. New token: `--color-container-border`.

Also fixed alongside these while in the same container: My Products'
own container had `pt-[--space-sm]` (16px) where the fresh pull shows
`py-[8px]` — matching `--space-2xs`, and matching AccountScreen's own
card (which already had this right).

## What was actually built

- `icons.tsx`: `fillOpacity` removed from `PlusIcon` and `MenuDotsIcon`
  (both now flat `fill="currentColor"`, same fix shape as CloseIcon).
- `tokens.css`: two new tokens — `--color-container-border: #f1efee`,
  `--color-menu-dots-icon: #cfcecc`.
- `MyProductsScreen.tsx`: Add-button color → `--color-info-overlay-heading`;
  "⋮" button color → `--color-menu-dots-icon`; product brand/name color →
  `--color-tutorial-card-text`; "N product(s)" badge color →
  `--color-info-overlay-heading`; container gained
  `border-[0.5px] border-solid border-[--color-container-border]` and
  `pt-[--space-2xs]` (was `pt-[--space-sm]`).
- `AccountScreen.tsx`, `AllStepsView.tsx`, `StepScreen.tsx`: each sheet
  container gained the same `--color-container-border` hairline, since
  the design source confirms it on all four, not just My Products.

## Boundaries — deliberately not touched

- **Group header ("Concealer"/"Eye Shadows"/etc.) font-size and color
  varied across the fresh pull** (16px `#21201f`, 16px `#2c2926`, 15px
  `#21201f` — three different combinations across 5 headers in one
  frame). AllStepsView's own dedicated pull already settled this at 15px
  / `--letter-spacing-list-group-title: -0.15px` after real on-device
  tuning (see that token's own comment) — treated this noisier duplicate
  frame as the artifact, not a new signal, and left it alone.
- **Product image corner radius also varied** (12px on 3 of 5 groups, 8px
  on 2) and **one product image border used a stale
  `rgba(44,41,38,0.2)`** instead of the flat `#cfcecc`/`#dad8d7` the rest
  use — both read as leftover copy/paste artifacts in this duplicated
  frame, not real design intent, given `--radius-image-list` (12px) and
  `--color-border-hairline` were each already confirmed against their own
  dedicated, cleaner pulls (plans 031, 034).
- **`ProductCard.tsx`/`StepScreen`'s own use of `--color-text-product`
  was not touched by this pass** — that's a different Figma node from My
  Products' own list row, and this pass didn't re-pull it. (A separate,
  concurrent session fixed the equivalent bug in `ProductCard.tsx`'s own
  `imageRadius="list"` context — AllStepsView's badge/shade-line text and
  new `--color-badge-text-list`/`--color-text-muted-list` tokens — while
  this plan was being written; StepScreen's `imageRadius="default"` path
  was deliberately left as-is there too.)

## Verification

- `npx tsc -b`: clean.
- Live `getComputedStyle` checks (My Products, screenshot-confirmed too):
  Add/Close buttons `rgb(101,100,98)` (`#656462`); every "⋮" button
  `rgb(207,206,204)` (`#cfcecc`); product brand/name `rgb(33,32,31)`
  (`#21201f`); every "N product(s)" badge `rgb(101,100,98)`; container
  `border-color rgb(241,239,238)` (`#f1efee`), `padding-top: 8px`.
- Same border spot-checked live on StepScreen (in an actual tutorial run)
  and AllStepsView: both `rgb(241, 239, 238)` at `0.5px`.
