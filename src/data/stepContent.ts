// V2 (2026-09-01): swapped for bigger real photography (564x564, was
// 128x144) — same products, higher-res source. Matters most here:
// ProductDetailOverlay's own hero image is object-contain at a much
// larger display size than ProductCard's list-row thumbnail, so the old
// low-res source was visibly soft there.
import concealerImg from '../assets/product-images/Merit-Concealer.png'
import concealerBrushImg from '../assets/product-images/Hourglass-ConcealerBrush.png'
import eyeshadowImg from '../assets/product-images/Chanel-Les4ombres.png'
import meritBrushImg from '../assets/product-images/Merit-BrushNo2.png'
import highlightImg from '../assets/product-images/CharlotteTilbury-HollywoodGlow.png'
import eyelinerImg from '../assets/product-images/WA-EyePencil.png'
import mascaraImg from '../assets/product-images/WA-EyeWantYouMascara.png'

/** MyProductsScreen.tsx's own grouping — see that file and getMyProducts()
 *  below. Distinct from `listTitle`: several steps share the same
 *  underlying products (e.g. steps 2/3/5 all use the same eyeshadow palette
 *  + brush while covering different parts of the look), so `listTitle`
 *  alone would over-fragment the My Products view into one group per step
 *  instead of one group per real product category. */
export type ProductCategory = 'Concealer' | 'Eye Shadows' | 'Brushes' | 'Highlight' | 'Eyeliner and Mascara'

export type Product = {
  brand: string
  name: string
  /** Optional shade/variant line, e.g. "79 - Spices". */
  shade?: string
  checked: boolean
  image?: string
  category: ProductCategory
  /** "Purchased on" line shown in ProductDetailOverlay, e.g. "06/2025".
   *  Placeholder data — no real purchase-tracking feature exists yet, this
   *  just fills in the row Figma's Product Detail overlay shows (node
   *  896:10499). Optional so a product without one just skips the row. */
  purchasedAt?: string
}

export type StepContent = {
  /** Title shown on that step's own screen, e.g. "Add Concealer". */
  title: string
  /** Shorter title shown in the All Steps list view, e.g. "Concealer". */
  listTitle: string
  description: string
  products: Product[]
}

export const TOTAL_STEPS = 7

// Copy and product data from the Figma file (Tech-Experimentation,
// 6Mr7K0RONTS8SltZRJtqYj), V2 section (node 513:9189) — see
// docs/figma-v2-redesign.md for the full diff against V1 and the node IDs
// each step's design came from. Titles/descriptions for steps 2-8 and the
// All Steps list titles were originally supplied directly rather than
// fetched, to stay within Figma's rate limit.
//
// That copy has since been directly verified against real get_design_context
// pulls for every step (docs/figma-step-screen-restyle.md, "Why steps 2-6
// weren't pulled" — later revisited when the user asked to double-check the
// whole flow's product sheet): titles, descriptions, brand/name/shade text
// all matched exactly, byte for byte. The one real mismatch found was
// `checked`, not copy — Figma shows the *first* product pre-checked on
// every step that has one (1, 2, 3, 5, 7; steps 4 and 6 only have a single
// product, in the design's own "Product 2" layout slot, and that slot is
// never pre-checked), but only steps 1 and 7 had that reflected here.
// Steps 2/3/5's first product is now `checked: true` to match.
// Product photos live in src/assets/product-images (added directly, not
// fetched from Figma — those asset URLs expire in ~7 days). ProductCard
// falls back to its placeholder box for any product left without an
// `image`.
export const STEP_CONTENT: Record<number, StepContent> = {
  1: {
    title: 'Add Concealer',
    listTitle: 'Concealer',
    description:
      "Dab concealer under the brow and inner corner, then pat gently to blend. Don't rub, just press it in.",
    products: [
      {
        brand: 'MERIT',
        name: 'The Minimalist',
        checked: true,
        image: concealerImg,
        category: 'Concealer',
        purchasedAt: '06/2025',
      },
      {
        brand: 'Hourglass',
        name: 'Concealer Brush',
        checked: false,
        image: concealerBrushImg,
        category: 'Brushes',
        purchasedAt: '04/2025',
      },
    ],
  },
  2: {
    title: 'Set a Soft Base',
    listTitle: 'Base Shadow',
    description: 'Sweep a neutral shade across the lid side to side.',
    products: [
      {
        brand: 'Chanel',
        name: 'Les 4 Ombres',
        shade: '79 - Spices',
        checked: true,
        image: eyeshadowImg,
        category: 'Eye Shadows',
        purchasedAt: '11/2024',
      },
      {
        brand: 'Merit',
        name: 'Brush No. 2',
        checked: false,
        image: meritBrushImg,
        category: 'Brushes',
        purchasedAt: '03/2025',
      },
    ],
  },
  3: {
    title: 'Add Depth with a Dark Shade',
    listTitle: 'Depth Shadow',
    description:
      'Using a smaller brush, sweep a darker shade into the outer corner and crease with a back-and-forth motion.',
    products: [
      {
        brand: 'Chanel',
        name: 'Les 4 Ombres',
        shade: '79 - Spices',
        checked: true,
        image: eyeshadowImg,
        category: 'Eye Shadows',
        purchasedAt: '11/2024',
      },
      {
        brand: 'Merit',
        name: 'Brush No. 2',
        checked: false,
        image: meritBrushImg,
        category: 'Brushes',
        purchasedAt: '03/2025',
      },
    ],
  },
  4: {
    title: 'Blend and Soften the Edges',
    listTitle: 'Blend',
    description:
      "Discharge the powder residue of the brush onto a tissue, then buff the edges in small circular motions so there's no harsh line between the shades.",
    products: [
      {
        brand: 'Merit',
        name: 'Brush No. 2',
        checked: false,
        image: meritBrushImg,
        category: 'Brushes',
        purchasedAt: '03/2025',
      },
    ],
  },
  5: {
    title: 'Define the Lower Lash Line',
    listTitle: 'Lower Lash Line',
    description:
      'Apply a bit of the dark shade using the smaller side of the brush, moving from the outer corner inward.',
    products: [
      {
        brand: 'Chanel',
        name: 'Les 4 Ombres',
        shade: '79 - Spices',
        checked: true,
        image: eyeshadowImg,
        category: 'Eye Shadows',
        purchasedAt: '11/2024',
      },
      {
        brand: 'Merit',
        name: 'Brush No. 2',
        checked: false,
        image: meritBrushImg,
        category: 'Brushes',
        purchasedAt: '03/2025',
      },
    ],
  },
  6: {
    title: 'Highlight the Inner Corner',
    listTitle: 'Highlight',
    description:
      'Tap a light shimmer shade onto the inner corner with your fingertip or a small brush to open up the eye.',
    products: [
      {
        brand: 'Charlotte Tilbury',
        name: 'Hollywood Glow Glide Face Architect Highlighter',
        checked: false,
        image: highlightImg,
        category: 'Highlight',
        purchasedAt: '09/2024',
      },
    ],
  },
  7: {
    title: 'Finish with Eyeliner and Mascara',
    listTitle: 'Eyeliner and Mascara',
    description: 'Line the upper lash line close to the roots, then finish with a few coats of mascara.',
    products: [
      {
        brand: 'Westman Atelier',
        name: 'Eye Pencil',
        checked: true,
        image: eyelinerImg,
        category: 'Eyeliner and Mascara',
        purchasedAt: '01/2025',
      },
      {
        brand: 'Westman Atelier',
        name: 'Eye Want You Mascara',
        checked: false,
        image: mascaraImg,
        category: 'Eyeliner and Mascara',
        purchasedAt: '01/2025',
      },
    ],
  },
  // Terminal "done" screen shown after Finish — not one of the 7 makeup
  // steps, and not shown in the All Steps list. No products, no progress
  // badge, no bottom button.
  8: {
    title: "You're done!",
    listTitle: "You're done!",
    description: 'Remember to apply settling spray to make the look last longer.',
    products: [],
  },
}

export type ProductGroup = {
  category: ProductCategory
  products: Product[]
}

// Figma's own group order (node 734:7550, "Home/Profile-MyProducts") —
// fixed here rather than derived from first-appearance-across-steps order,
// since that would put "Eye Shadows" before "Concealer" (step 1's second
// product, the concealer brush, is tagged "Brushes"; step 2 is the first
// "Eye Shadows" product, but step 1's *own* "Concealer" product still
// belongs first).
const CATEGORY_ORDER: ProductCategory[] = ['Concealer', 'Eye Shadows', 'Brushes', 'Highlight', 'Eyeliner and Mascara']

/**
 * MyProductsScreen.tsx's data source: every product used across the
 * tutorial (steps 1-{@link TOTAL_STEPS}, excluding step 8's terminal "done"
 * screen, which has none), grouped by `category` and deduped by brand+name
 * within a group — several steps intentionally reuse the same eyeshadow
 * palette/brush while covering different parts of the look (see steps 2/3/5
 * above), and My Products shows each real product once, not once per step
 * that happens to use it.
 *
 * Figma's own pull of this screen shows "Hourglass Concealer Brush" listed
 * under *both* Concealer and Brushes — kept here as Brushes-only (its
 * `category` tag on the step 1 entry above): a product appearing in two
 * groups at once doesn't fit this screen's own "N products" per-group count,
 * and reads as a Figma authoring duplicate rather than an intentional
 * design decision, the same call already made for this screen's stray
 * "Finish" button and the "Chanel"-labeled highlighter.
 */
export function getMyProducts(): ProductGroup[] {
  const byCategory = new Map<ProductCategory, Map<string, Product>>()

  for (let step = 1; step <= TOTAL_STEPS; step++) {
    for (const product of STEP_CONTENT[step].products) {
      let seen = byCategory.get(product.category)
      if (!seen) {
        seen = new Map()
        byCategory.set(product.category, seen)
      }
      const key = `${product.brand}|${product.name}`
      if (!seen.has(key)) seen.set(key, product)
    }
  }

  return CATEGORY_ORDER.filter((category) => byCategory.has(category)).map((category) => ({
    category,
    products: [...byCategory.get(category)!.values()],
  }))
}
