import concealerImg from '../assets/product-images/Product_Concealer.png'
import concealerBrushImg from '../assets/product-images/Product_Concealer-Bush.png'
import eyeshadowImg from '../assets/product-images/Product_Eyeshadow.png'
import meritBrushImg from '../assets/product-images/Product_Merit-Brush.png'
import highlightImg from '../assets/product-images/Product_Highlight.png'
import eyelinerImg from '../assets/product-images/Product_Eyeliner.png'
import mascaraImg from '../assets/product-images/Product_Mascara.png'

export type Product = {
  brand: string
  name: string
  /** Optional shade/variant line, e.g. "79 - Spices". */
  shade?: string
  checked: boolean
  image?: string
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
      { brand: 'MERIT', name: 'The Minimalist', checked: true, image: concealerImg },
      { brand: 'Hourglass', name: 'Concealer Brush', checked: false, image: concealerBrushImg },
    ],
  },
  2: {
    title: 'Set a Soft Base',
    listTitle: 'Base Shadow',
    description: 'Sweep a neutral shade across the lid side to side.',
    products: [
      { brand: 'Chanel', name: 'Les 4 Ombres', shade: '79 - Spices', checked: true, image: eyeshadowImg },
      { brand: 'Merit', name: 'Brush No. 2', checked: false, image: meritBrushImg },
    ],
  },
  3: {
    title: 'Add Depth with a Dark Shade',
    listTitle: 'Depth Shadow',
    description:
      'Using a smaller brush, sweep a darker shade into the outer corner and crease with a back-and-forth motion.',
    products: [
      { brand: 'Chanel', name: 'Les 4 Ombres', shade: '79 - Spices', checked: true, image: eyeshadowImg },
      { brand: 'Merit', name: 'Brush No. 2', checked: false, image: meritBrushImg },
    ],
  },
  4: {
    title: 'Blend and Soften the Edges',
    listTitle: 'Blend',
    description:
      "Discharge the powder residue of the brush onto a tissue, then buff the edges in small circular motions so there's no harsh line between the shades.",
    products: [{ brand: 'Merit', name: 'Brush No. 2', checked: false, image: meritBrushImg }],
  },
  5: {
    title: 'Define the Lower Lash Line',
    listTitle: 'Lower Lash Line',
    description:
      'Apply a bit of the dark shade using the smaller side of the brush, moving from the outer corner inward.',
    products: [
      { brand: 'Chanel', name: 'Les 4 Ombres', shade: '79 - Spices', checked: true, image: eyeshadowImg },
      { brand: 'Merit', name: 'Brush No. 2', checked: false, image: meritBrushImg },
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
      },
    ],
  },
  7: {
    title: 'Finish with Eyeliner and Mascara',
    listTitle: 'Eyeliner and Mascara',
    description: 'Line the upper lash line close to the roots, then finish with a few coats of mascara.',
    products: [
      { brand: 'Westman Atelier', name: 'Eye Pencil', checked: true, image: eyelinerImg },
      { brand: 'Westman Atelier', name: 'Eye Want You Mascara', checked: false, image: mascaraImg },
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
