import { useEffect, useRef, type CSSProperties } from 'react'
import manifest from '../../eye-illustration-manifest.json'

type EyeIllustrationProps = {
  step: number
}

type ManifestStepEntry = Record<string, string>
const manifestSteps = manifest.steps as unknown as Record<string, ManifestStepEntry>

// Mirrors the slugify() in download-assets.js — must stay identical, since
// it's how the manifest's layer names map to the filenames actually saved
// under src/assets/eyes/Step_N/.
const slugify = (s: string) =>
  s.toLowerCase().replace(/[^\w]+/g, '-').replace(/(^-|-$)/g, '')

// Eagerly resolve every layer SVG to its bundled URL, keyed by the same
// relative path download-assets.js wrote them to.
const eyeAssetUrls = import.meta.glob('../assets/eyes/*/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

function resolveLayerUrl(step: number, layerKey: string): string | undefined {
  const filename = `${slugify(layerKey)}.svg`
  return eyeAssetUrls[`../assets/eyes/Step_${step}/${filename}`]
}

function getManifestStepLayers(step: number): string[] {
  const entry = manifestSteps[`Step_${step}`]
  if (!entry) return []
  return Object.keys(entry).filter((key) => !key.startsWith('_'))
}

type Inset = { top: string; right: string; bottom: string; left: string }

type LayerLayout = {
  box: Inset
  /** Inner wrapper inset, relative to box — negative values let the image
   *  bleed past its layout box (feathered/blurred shapes in the source). */
  bleed?: Inset
  blend?: 'multiply'
}

// A layer rotated in the source design (Lashes, Highlight). Figma expresses
// its true render size via container-query hypot() math rather than a
// plain bleed inset, since a rotated box's on-screen footprint isn't the
// same as its unrotated width/height.
type RotatedLayerLayout = {
  box: Inset
  width: string
  height: string
  rotateDeg: number
  bleed: Inset
}

type StepLayout = {
  /** Instance's natural canvas size, in raw Figma px. */
  canvasWidth: number
  canvasHeight: number
  /** Manifest layer keys in Figma's real paint order, back to front. */
  paintOrder: string[]
  layers: Record<string, LayerLayout>
  rotated?: Record<string, RotatedLayerLayout>
}

// All percentage layout below was read via Figma's get_design_context on
// each step's "MakeUp" instance (file 6Mr7K0RONTS8SltZRJtqYj):
//   Step 1: 545:1793 (V2 re-pull)   Step 2: 316:4454   Step 3: 316:4363
//   Step 4: 316:4272   Step 5: 316:4011   Step 6: 313:3823   Step 7: 313:3793
//
// Step 1 is on its own 217.31x168.92 instance — a genuine V2 re-pull (see
// eye-illustration-manifest.json's Step_1._note), not the V1 data steps
// 2-4 below still use. Steps 2-4 share one 197.55x153.57 instance
// (identical base-layer percentages). Step 5 uses a slightly taller
// 197.55x155.10 instance (percentages shift a little). Steps 6-7 switch to
// a larger 205.81x163.43 instance per the manifest's own note, with
// different padding throughout.
//
// Paint order is NOT "base layers, then variants on top" — it mirrors
// Figma's actual DOM/z-order per step, which varies: e.g. Above Crease
// sits behind the base eye in every step, Add Highlight (steps 6-7) sits
// behind the base eye too, while Add Top-Eyeliner (step 7) sits inside the
// eye group between the base eye and the lashes.
const STEP_LAYOUTS: Record<number, StepLayout> = {
  1: {
    // V2 re-pull (node 545:1793) — replaces the V1 placeholder this used to
    // hold. This step doesn't render from these per-layer assets directly
    // (see EyeIllustration's own doc comment for the historical reason:
    // the V2 redesign was originally only reachable as one flattened SVG
    // export, before Dev Mode access was available) — real per-layer data
    // is now the actual rendering source, same as every other step.
    canvasWidth: 217.30465698242188,
    canvasHeight: 168.9226531982422,
    paintOrder: [
      '[Add] Concealer',
      'Sclera',
      'Basic_LowerUnderline',
      'Basic_UpperUnderline',
      'Crease',
      'iris',
      'Pupil',
      'iris-highlight',
      '[Add] Lashes',
      'Brow',
      'Concealer Highlight',
    ],
    layers: {
      Sclera: { box: { top: '62%', right: '3.89%', bottom: '0.7%', left: '17.58%' } },
      Basic_LowerUnderline: {
        box: { top: '79.19%', right: '3.89%', bottom: '0.42%', left: '17.59%' },
        bleed: { top: '-0.37%', right: '0%', bottom: '-3.42%', left: '0%' },
      },
      Basic_UpperUnderline: {
        box: { top: '62%', right: '3.89%', bottom: '6.49%', left: '16.48%' },
        bleed: { top: '-5%', right: '0%', bottom: '0%', left: '0%' },
      },
      Crease: {
        box: { top: '44.09%', right: '14.47%', bottom: '35.85%', left: '8.13%' },
        bleed: { top: '-2.35%', right: '0%', bottom: '-0.72%', left: '0%' },
        blend: 'multiply',
      },
      iris: {
        box: { top: '62%', right: '33.41%', bottom: '9.01%', left: '38.75%' },
        bleed: { top: '-0.86%', right: '-1.02%', bottom: '-1.77%', left: '-0.92%' },
      },
      Pupil: {
        box: { top: '62%', right: '37.86%', bottom: '16.51%', left: '44.32%' },
        bleed: { top: '-1.55%', right: '-0.96%', bottom: '-1.63%', left: '-2.3%' },
      },
      'iris-highlight': {
        box: { top: '67.73%', right: '37.3%', bottom: '23.68%', left: '56.01%' },
        bleed: { top: '-1.36%', right: '-7.66%', bottom: '-6.96%', left: '-4.74%' },
      },
      Brow: {
        box: { top: '-0.42%', right: '0%', bottom: '79.55%', left: '2%' },
        bleed: { top: '-19.76%', right: '0%', bottom: '-12.9%', left: '-0.32%' },
      },
    },
    rotated: {
      '[Add] Concealer': {
        box: { top: '2.82%', right: '57.27%', bottom: '60.43%', left: '2.33%' },
        width: 'hypot(91.8043cqw, 18.4585cqh)',
        height: 'hypot(-8.19572cqw, 81.5415cqh)',
        rotateDeg: 8.09,
        bleed: { top: '-2.19%', right: '-1.07%', bottom: '-1.61%', left: '-1.05%' },
      },
      '[Add] Lashes': {
        box: { top: '49.72%', right: '58.17%', bottom: '20.48%', left: '0%' },
        width: 'hypot(97.9299cqw, -7.11842cqh)',
        height: 'hypot(2.07007cqw, 92.8816cqh)',
        rotateDeg: -2.3,
        bleed: { top: '0%', right: '0%', bottom: '-3.91%', left: '-0.15%' },
      },
      'Concealer Highlight': {
        // The unlabeled mole/highlight ellipse near the outer corner —
        // Figma gave it no layer name, so this key is our own (kept
        // distinct from steps 6-7's unrelated "[Add] Highlight" layer,
        // which is a different shape at a different position — reusing
        // that name would make EyeIllustration's key-based continuity
        // logic wrongly treat them as the same persisting layer if a user
        // ever jumps from step 1 straight to 6/7 via the All Steps list).
        box: { top: '93.56%', right: '-5.82%', bottom: '-22.7%', left: '85.51%' },
        width: 'hypot(61.5263cqw, 25.5349cqh)',
        height: 'hypot(-38.4737cqw, 74.4651cqh)',
        rotateDeg: 24.85,
        bleed: { top: '-1.39%', right: '-1.42%', bottom: '-1.47%', left: '-3.01%' },
      },
    },
  },

  2: {
    // Identical layout to Step 1 — same component instance, only the
    // image fills differ per step.
    canvasWidth: 197.54978942871094,
    canvasHeight: 153.56625366210938,
    paintOrder: [
      '[Change] Above Crease',
      'Sclera',
      'Basic_LowerUnderline',
      'Basic_UpperUnderline',
      'Crease',
      'iris',
      'Pupil',
      'iris-highlight',
      '[Add] Lashes',
      'Brow',
    ],
    layers: {
      Sclera: { box: { top: '62.42%', right: '3.9%', bottom: '0.29%', left: '17.58%' } },
      Basic_LowerUnderline: {
        box: { top: '79.61%', right: '3.9%', bottom: '0%', left: '17.59%' },
        bleed: { top: '-0.37%', right: '0%', bottom: '-3.42%', left: '0%' },
      },
      Basic_UpperUnderline: {
        box: { top: '62.42%', right: '3.9%', bottom: '6.07%', left: '16.48%' },
        bleed: { top: '-5%', right: '0%', bottom: '0%', left: '0%' },
      },
      Crease: {
        box: { top: '44.51%', right: '14.48%', bottom: '35.43%', left: '8.13%' },
        bleed: { top: '-2.35%', right: '0%', bottom: '-0.72%', left: '0%' },
        blend: 'multiply',
      },
      iris: {
        box: { top: '62.42%', right: '33.41%', bottom: '8.59%', left: '38.75%' },
        bleed: { top: '-0.86%', right: '-1.02%', bottom: '-1.77%', left: '-0.92%' },
      },
      Pupil: {
        box: { top: '62.42%', right: '37.86%', bottom: '16.09%', left: '44.32%' },
        bleed: { top: '-1.55%', right: '-0.96%', bottom: '-1.63%', left: '-2.3%' },
      },
      'iris-highlight': {
        box: { top: '68.15%', right: '37.31%', bottom: '23.26%', left: '56.01%' },
        bleed: { top: '-1.36%', right: '-7.66%', bottom: '-6.96%', left: '-4.74%' },
      },
      Brow: {
        box: { top: '0%', right: '0%', bottom: '79.13%', left: '2%' },
        bleed: { top: '-19.76%', right: '0%', bottom: '-12.9%', left: '-0.32%' },
      },
      '[Change] Above Crease': {
        box: { top: '20.84%', right: '4.45%', bottom: '4.63%', left: '2%' },
        bleed: { top: '-15.38%', right: '-9.52%', bottom: '-15.38%', left: '-9.52%' },
      },
    },
    rotated: {
      '[Add] Lashes': {
        box: { top: '50.14%', right: '58.17%', bottom: '20.06%', left: '0%' },
        width: 'hypot(97.9299cqw, -7.11838cqh)',
        height: 'hypot(2.07008cqw, 92.8816cqh)',
        rotateDeg: -2.3,
        bleed: { top: '0%', right: '0%', bottom: '-3.91%', left: '-0.15%' },
      },
    },
  },

  3: {
    canvasWidth: 197.54978942871094,
    canvasHeight: 153.56625366210938,
    paintOrder: [
      '[Change] Above Crease v1',
      '[Change] Above Crease v2',
      'Sclera',
      'Basic_LowerUnderline',
      'Basic_UpperUnderline',
      'Crease',
      'iris',
      'Pupil',
      'iris-highlight',
      '[Add] Lashes',
      'Brow',
    ],
    layers: {
      Sclera: { box: { top: '62.42%', right: '3.9%', bottom: '0.29%', left: '17.58%' } },
      Basic_LowerUnderline: {
        box: { top: '79.61%', right: '3.9%', bottom: '0%', left: '17.59%' },
        bleed: { top: '-0.37%', right: '0%', bottom: '-3.42%', left: '0%' },
      },
      Basic_UpperUnderline: {
        box: { top: '62.42%', right: '3.9%', bottom: '6.07%', left: '16.48%' },
        bleed: { top: '-5%', right: '0%', bottom: '0%', left: '0%' },
      },
      Crease: {
        box: { top: '44.51%', right: '14.48%', bottom: '35.43%', left: '8.13%' },
        bleed: { top: '-2.35%', right: '0%', bottom: '-0.72%', left: '0%' },
        blend: 'multiply',
      },
      iris: {
        box: { top: '62.42%', right: '33.41%', bottom: '8.59%', left: '38.75%' },
        bleed: { top: '-0.86%', right: '-1.02%', bottom: '-1.77%', left: '-0.92%' },
      },
      Pupil: {
        box: { top: '62.42%', right: '37.86%', bottom: '16.09%', left: '44.32%' },
        bleed: { top: '-1.55%', right: '-0.96%', bottom: '-1.63%', left: '-2.3%' },
      },
      'iris-highlight': {
        box: { top: '68.15%', right: '37.31%', bottom: '23.26%', left: '56.01%' },
        bleed: { top: '-1.36%', right: '-7.66%', bottom: '-6.96%', left: '-4.74%' },
      },
      Brow: {
        box: { top: '0%', right: '0%', bottom: '79.13%', left: '2%' },
        bleed: { top: '-19.76%', right: '0%', bottom: '-12.9%', left: '-0.32%' },
      },
      '[Change] Above Crease v1': {
        box: { top: '20.84%', right: '4.45%', bottom: '4.63%', left: '2%' },
        bleed: { top: '-30.75%', right: '-19.05%', bottom: '-30.75%', left: '-19.05%' },
      },
      '[Change] Above Crease v2': {
        box: { top: '21.53%', right: '58.47%', bottom: '11.01%', left: '2%' },
        bleed: { top: '-12.74%', right: '-16.9%', bottom: '-12.74%', left: '-16.9%' },
      },
    },
    rotated: {
      '[Add] Lashes': {
        box: { top: '50.14%', right: '58.17%', bottom: '20.06%', left: '0%' },
        width: 'hypot(97.9299cqw, -7.11838cqh)',
        height: 'hypot(2.07008cqw, 92.8816cqh)',
        rotateDeg: -2.3,
        bleed: { top: '0%', right: '0%', bottom: '-3.91%', left: '-0.15%' },
      },
    },
  },

  4: {
    canvasWidth: 197.54978942871094,
    canvasHeight: 153.56625366210938,
    paintOrder: [
      '[Change] Above Crease v1',
      '[Change] Above Crease v2',
      '[Add] Above Crease',
      'Sclera',
      'Basic_LowerUnderline',
      'Basic_UpperUnderline',
      'Crease',
      'iris',
      'Pupil',
      'iris-highlight',
      '[Add] Lashes',
      'Brow',
    ],
    layers: {
      Sclera: { box: { top: '62.42%', right: '3.9%', bottom: '0.29%', left: '17.58%' } },
      Basic_LowerUnderline: {
        box: { top: '79.61%', right: '3.9%', bottom: '0%', left: '17.59%' },
        bleed: { top: '-0.37%', right: '0%', bottom: '-3.42%', left: '0%' },
      },
      Basic_UpperUnderline: {
        box: { top: '62.42%', right: '3.9%', bottom: '6.07%', left: '16.48%' },
        bleed: { top: '-5%', right: '0%', bottom: '0%', left: '0%' },
      },
      Crease: {
        box: { top: '44.51%', right: '14.48%', bottom: '35.43%', left: '8.13%' },
        bleed: { top: '-2.35%', right: '0%', bottom: '-0.72%', left: '0%' },
        blend: 'multiply',
      },
      iris: {
        box: { top: '62.42%', right: '33.41%', bottom: '8.59%', left: '38.75%' },
        bleed: { top: '-0.86%', right: '-1.02%', bottom: '-1.77%', left: '-0.92%' },
      },
      Pupil: {
        box: { top: '62.42%', right: '37.86%', bottom: '16.09%', left: '44.32%' },
        bleed: { top: '-1.55%', right: '-0.96%', bottom: '-1.63%', left: '-2.3%' },
      },
      'iris-highlight': {
        box: { top: '68.15%', right: '37.31%', bottom: '23.26%', left: '56.01%' },
        bleed: { top: '-1.36%', right: '-7.66%', bottom: '-6.96%', left: '-4.74%' },
      },
      Brow: {
        box: { top: '0%', right: '0%', bottom: '79.13%', left: '2%' },
        bleed: { top: '-19.76%', right: '0%', bottom: '-12.9%', left: '-0.32%' },
      },
      '[Change] Above Crease v1': {
        box: { top: '20.84%', right: '4.45%', bottom: '4.63%', left: '2%' },
        bleed: { top: '-30.75%', right: '-19.05%', bottom: '-30.75%', left: '-19.05%' },
      },
      '[Change] Above Crease v2': {
        box: { top: '21.53%', right: '58.47%', bottom: '11.01%', left: '2%' },
        bleed: { top: '-42.47%', right: '-56.34%', bottom: '-42.47%', left: '-56.34%' },
      },
      '[Add] Above Crease': {
        box: { top: '21.53%', right: '58.47%', bottom: '11.01%', left: '2%' },
        bleed: { top: '-63.71%', right: '-84.51%', bottom: '-63.71%', left: '-84.51%' },
      },
    },
    rotated: {
      '[Add] Lashes': {
        box: { top: '50.14%', right: '58.17%', bottom: '20.06%', left: '0%' },
        width: 'hypot(97.9299cqw, -7.11842cqh)',
        height: 'hypot(2.07007cqw, 92.8816cqh)',
        rotateDeg: -2.3,
        bleed: { top: '0%', right: '0%', bottom: '-3.91%', left: '-0.15%' },
      },
    },
  },

  5: {
    // Slightly taller instance (197.55x155.10 vs 153.57) — every
    // percentage below is shifted a little from steps 1-4.
    canvasWidth: 197.54978942871094,
    canvasHeight: 155.0973663330078,
    paintOrder: [
      '[Add] Lower Lid-Shadow',
      '[Change] Above Crease v1',
      '[Change] Above Crease v2',
      '[Add] Above Crease',
      'Sclera',
      'Basic_LowerUnderline',
      'Basic_UpperUnderline',
      'Crease',
      'iris',
      'Pupil',
      'iris-highlight',
      '[Add] Lashes',
      'Brow',
    ],
    layers: {
      Sclera: { box: { top: '61.8%', right: '3.9%', bottom: '1.27%', left: '17.58%' } },
      Basic_LowerUnderline: {
        box: { top: '78.82%', right: '3.9%', bottom: '0.99%', left: '17.59%' },
        bleed: { top: '-0.37%', right: '0%', bottom: '-3.42%', left: '0%' },
      },
      Basic_UpperUnderline: {
        box: { top: '61.8%', right: '3.9%', bottom: '6.99%', left: '16.48%' },
        bleed: { top: '-5%', right: '0%', bottom: '0%', left: '0%' },
      },
      Crease: {
        box: { top: '44.07%', right: '14.48%', bottom: '36.07%', left: '8.13%' },
        bleed: { top: '-2.35%', right: '0%', bottom: '-0.72%', left: '0%' },
        blend: 'multiply',
      },
      iris: {
        box: { top: '61.8%', right: '33.41%', bottom: '9.49%', left: '38.75%' },
        bleed: { top: '-0.86%', right: '-1.02%', bottom: '-1.77%', left: '-0.92%' },
      },
      Pupil: {
        box: { top: '61.8%', right: '37.86%', bottom: '16.92%', left: '44.32%' },
        bleed: { top: '-1.55%', right: '-0.96%', bottom: '-1.63%', left: '-2.3%' },
      },
      'iris-highlight': {
        box: { top: '67.47%', right: '37.31%', bottom: '24.01%', left: '56.01%' },
        bleed: { top: '-1.36%', right: '-7.66%', bottom: '-6.96%', left: '-4.74%' },
      },
      Brow: {
        box: { top: '0%', right: '0%', bottom: '79.33%', left: '2%' },
        bleed: { top: '-19.76%', right: '0%', bottom: '-12.9%', left: '-0.32%' },
      },
      '[Add] Lower Lid-Shadow': {
        box: { top: '73.86%', right: '3.34%', bottom: '0%', left: '12.02%' },
        bleed: { top: '-22.95%', right: '-5.26%', bottom: '-39.63%', left: '-6.97%' },
      },
      '[Change] Above Crease v1': {
        box: { top: '20.63%', right: '4.45%', bottom: '5.58%', left: '2%' },
        bleed: { top: '-30.75%', right: '-19.05%', bottom: '-30.75%', left: '-19.05%' },
      },
      '[Change] Above Crease v2': {
        box: { top: '21.32%', right: '58.47%', bottom: '11.89%', left: '2%' },
        bleed: { top: '-42.47%', right: '-56.34%', bottom: '-42.47%', left: '-56.34%' },
      },
      '[Add] Above Crease': {
        box: { top: '21.31%', right: '58.47%', bottom: '11.89%', left: '2%' },
        bleed: { top: '-63.71%', right: '-84.51%', bottom: '-63.71%', left: '-84.51%' },
      },
    },
    rotated: {
      '[Add] Lashes': {
        box: { top: '49.65%', right: '58.17%', bottom: '20.85%', left: '0%' },
        width: 'hypot(97.9299cqw, -7.11838cqh)',
        height: 'hypot(2.07008cqw, 92.8816cqh)',
        rotateDeg: -2.3,
        bleed: { top: '0%', right: '0%', bottom: '-3.91%', left: '-0.15%' },
      },
    },
  },

  6: {
    // Larger instance (205.81x163.43) with different padding throughout,
    // per the manifest's own note.
    canvasWidth: 205.8099822998047,
    canvasHeight: 163.43162536621094,
    paintOrder: [
      '[Add] Lower Lid-Shadow',
      '[Change] Above Crease v1',
      '[Change] Above Crease v2',
      '[Add] Above Crease',
      '[Add] Highlight',
      'Sclera',
      'Basic_LowerUnderline',
      'Basic_UpperUnderline',
      'Crease',
      'iris',
      'Pupil',
      'iris-highlight',
      '[Add] Lashes',
      'Brow',
    ],
    layers: {
      Sclera: { box: { top: '58.65%', right: '7.75%', bottom: '6.31%', left: '16.87%' } },
      Basic_LowerUnderline: {
        box: { top: '74.8%', right: '7.75%', bottom: '6.04%', left: '16.89%' },
        bleed: { top: '-0.37%', right: '0%', bottom: '-3.42%', left: '0%' },
      },
      Basic_UpperUnderline: {
        box: { top: '58.65%', right: '7.75%', bottom: '11.74%', left: '15.82%' },
        bleed: { top: '-5%', right: '0%', bottom: '0%', left: '0%' },
      },
      Crease: {
        box: { top: '41.82%', right: '17.91%', bottom: '39.33%', left: '7.8%' },
        bleed: { top: '-2.35%', right: '0%', bottom: '-0.72%', left: '0%' },
        blend: 'multiply',
      },
      iris: {
        box: { top: '58.65%', right: '36.08%', bottom: '14.11%', left: '37.2%' },
        bleed: { top: '-0.86%', right: '-1.02%', bottom: '-1.77%', left: '-0.92%' },
      },
      Pupil: {
        box: { top: '58.65%', right: '40.36%', bottom: '21.16%', left: '42.54%' },
        bleed: { top: '-1.55%', right: '-0.96%', bottom: '-1.63%', left: '-2.3%' },
      },
      'iris-highlight': {
        box: { top: '64.03%', right: '39.82%', bottom: '27.89%', left: '53.76%' },
        bleed: { top: '-1.36%', right: '-7.66%', bottom: '-6.96%', left: '-4.74%' },
      },
      Brow: {
        box: { top: '0%', right: '4.01%', bottom: '80.39%', left: '1.92%' },
        bleed: { top: '-19.76%', right: '0%', bottom: '-12.9%', left: '-0.32%' },
      },
      '[Add] Lower Lid-Shadow': {
        box: { top: '70.09%', right: '7.22%', bottom: '5.1%', left: '11.54%' },
        bleed: { top: '-22.95%', right: '-5.26%', bottom: '-39.63%', left: '-6.97%' },
      },
      '[Change] Above Crease v1': {
        box: { top: '19.58%', right: '8.29%', bottom: '10.39%', left: '1.92%' },
        bleed: { top: '-30.75%', right: '-19.05%', bottom: '-30.75%', left: '-19.05%' },
      },
      '[Change] Above Crease v2': {
        box: { top: '20.23%', right: '60.13%', bottom: '16.38%', left: '1.92%' },
        bleed: { top: '-42.47%', right: '-56.34%', bottom: '-42.47%', left: '-56.34%' },
      },
      '[Add] Above Crease': {
        box: { top: '20.23%', right: '60.13%', bottom: '16.38%', left: '1.92%' },
        bleed: { top: '-63.71%', right: '-84.51%', bottom: '-63.71%', left: '-84.51%' },
      },
    },
    rotated: {
      '[Add] Lashes': {
        box: { top: '47.11%', right: '59.85%', bottom: '24.89%', left: '0%' },
        width: 'hypot(97.9299cqw, -7.11838cqh)',
        height: 'hypot(2.07008cqw, 92.8816cqh)',
        rotateDeg: -2.3,
        bleed: { top: '0%', right: '0%', bottom: '-3.91%', left: '-0.15%' },
      },
      '[Add] Highlight': {
        box: { top: '73.46%', right: '0%', bottom: '0%', left: '73.54%' },
        width: 'hypot(81.85cqw, 37.3987cqh)',
        height: 'hypot(-18.15cqw, 62.6013cqh)',
        rotateDeg: 20,
        bleed: { top: '-91.35%', right: '-55.65%', bottom: '-91.35%', left: '-55.65%' },
      },
    },
  },

  7: {
    // Same instance as Step 6 — base-eye layout is identical.
    canvasWidth: 205.8099822998047,
    canvasHeight: 163.43162536621094,
    paintOrder: [
      '[Add] Lower Lid-Shadow',
      '[Change] Above Crease v1',
      '[Change] Above Crease v2',
      '[Add] Above Crease',
      '[Add] Highlight',
      'Sclera',
      'Basic_LowerUnderline',
      'Basic_UpperUnderline',
      'Crease',
      'iris',
      'Pupil',
      'iris-highlight',
      '[Add] Top-Eyeliner',
      '[Add] Lashes',
      '[Add] Above-Eyeliner',
      'Brow',
    ],
    layers: {
      Sclera: { box: { top: '58.65%', right: '7.75%', bottom: '6.31%', left: '16.87%' } },
      Basic_LowerUnderline: {
        box: { top: '74.8%', right: '7.75%', bottom: '6.04%', left: '16.89%' },
        bleed: { top: '-0.37%', right: '0%', bottom: '-3.42%', left: '0%' },
      },
      Basic_UpperUnderline: {
        box: { top: '58.65%', right: '7.75%', bottom: '11.74%', left: '15.82%' },
        bleed: { top: '-5%', right: '0%', bottom: '0%', left: '0%' },
      },
      Crease: {
        box: { top: '41.82%', right: '17.91%', bottom: '39.33%', left: '7.8%' },
        bleed: { top: '-2.35%', right: '0%', bottom: '-0.72%', left: '0%' },
        blend: 'multiply',
      },
      iris: {
        box: { top: '58.65%', right: '36.08%', bottom: '14.11%', left: '37.2%' },
        bleed: { top: '-0.86%', right: '-1.02%', bottom: '-1.77%', left: '-0.92%' },
      },
      Pupil: {
        box: { top: '58.65%', right: '40.36%', bottom: '21.16%', left: '42.54%' },
        bleed: { top: '-1.55%', right: '-0.96%', bottom: '-1.63%', left: '-2.3%' },
      },
      'iris-highlight': {
        box: { top: '64.03%', right: '39.82%', bottom: '27.89%', left: '53.76%' },
        bleed: { top: '-1.36%', right: '-7.66%', bottom: '-6.96%', left: '-4.74%' },
      },
      Brow: {
        box: { top: '0%', right: '4.01%', bottom: '80.39%', left: '1.92%' },
        bleed: { top: '-19.76%', right: '0%', bottom: '-12.9%', left: '-0.32%' },
      },
      '[Add] Lower Lid-Shadow': {
        box: { top: '70.09%', right: '7.22%', bottom: '5.1%', left: '11.54%' },
        bleed: { top: '-22.95%', right: '-5.26%', bottom: '-39.63%', left: '-6.97%' },
      },
      '[Change] Above Crease v1': {
        box: { top: '19.58%', right: '8.29%', bottom: '10.39%', left: '1.92%' },
        bleed: { top: '-30.75%', right: '-19.05%', bottom: '-30.75%', left: '-19.05%' },
      },
      '[Change] Above Crease v2': {
        box: { top: '20.23%', right: '60.13%', bottom: '16.38%', left: '1.92%' },
        bleed: { top: '-42.47%', right: '-56.34%', bottom: '-42.47%', left: '-56.34%' },
      },
      '[Add] Above Crease': {
        box: { top: '20.23%', right: '60.13%', bottom: '16.38%', left: '1.92%' },
        bleed: { top: '-63.71%', right: '-84.51%', bottom: '-63.71%', left: '-84.51%' },
      },
      '[Add] Top-Eyeliner': {
        box: { top: '57.3%', right: '8.29%', bottom: '12.41%', left: '10.47%' },
        bleed: { top: '-7.9%', right: '0%', bottom: '0%', left: '-1.08%' },
      },
      '[Add] Above-Eyeliner': {
        box: { top: '72.78%', right: '31.81%', bottom: '5.4%', left: '16.35%' },
        bleed: { top: '-0.7%', right: '0%', bottom: '-2.51%', left: '-0.46%' },
      },
    },
    rotated: {
      '[Add] Lashes': {
        // Bleed differs from Step 6 — the lash shape overflows further at
        // this step (more mascara volume), per Figma.
        box: { top: '47.11%', right: '59.85%', bottom: '24.89%', left: '0%' },
        width: 'hypot(97.9299cqw, -7.11838cqh)',
        height: 'hypot(2.07008cqw, 92.8816cqh)',
        rotateDeg: -2.3,
        bleed: { top: '0%', right: '0%', bottom: '-8.6%', left: '-0.49%' },
      },
      '[Add] Highlight': {
        box: { top: '73.46%', right: '0%', bottom: '0%', left: '73.54%' },
        width: 'hypot(81.85cqw, 37.3987cqh)',
        height: 'hypot(-18.15cqw, 62.6013cqh)',
        rotateDeg: 20,
        bleed: { top: '-91.35%', right: '-55.65%', bottom: '-91.35%', left: '-55.65%' },
      },
    },
  },
}

type RawBox = { x: number; y: number; w: number; h: number }

/** Brow's box, in raw Figma px within that step's own canvas. */
function getBrowBoxRaw(step: number): RawBox | undefined {
  const layout = STEP_LAYOUTS[step]
  const brow = layout?.layers.Brow
  if (!brow) return undefined
  const pct = (value: string) => parseFloat(value) / 100
  const top = pct(brow.box.top)
  const right = pct(brow.box.right)
  const bottom = pct(brow.box.bottom)
  const left = pct(brow.box.left)
  return {
    x: left * layout.canvasWidth,
    y: top * layout.canvasHeight,
    w: (1 - left - right) * layout.canvasWidth,
    h: (1 - top - bottom) * layout.canvasHeight,
  }
}

// Every step's Brow is close to the same *absolute* size in Figma
// (~193-213 x 32-35px depending on step) — what actually differs per step is
// how much padding surrounds it in that step's MakeUp canvas (steps 6-7
// use a visibly larger canvas with more padding, per the manifest's own
// note). Scaling each step's whole canvas to fit the same box therefore
// makes steps with more padding render their eye smaller, and shifts its
// position, even though nothing about the eye itself changed. Fix: anchor
// every step so Brow renders at one fixed size/position, then size and
// place the rest of that step's canvas around it.
const REFERENCE_STEP = 1
const REFERENCE_RENDER_WIDTH = 220 // px — matches the old fixed size for steps 1-4

const referenceLayout = STEP_LAYOUTS[REFERENCE_STEP]
const referenceBrow = getBrowBoxRaw(REFERENCE_STEP)
if (!referenceLayout || !referenceBrow) {
  throw new Error(`EyeIllustration: reference step ${REFERENCE_STEP} has no Brow layout`)
}
const referenceScale = REFERENCE_RENDER_WIDTH / referenceLayout.canvasWidth
const browTarget: RawBox = {
  x: referenceBrow.x * referenceScale,
  y: referenceBrow.y * referenceScale,
  w: referenceBrow.w * referenceScale,
  h: referenceBrow.h * referenceScale,
}

type RawStepAlignment = {
  offsetX: number
  offsetY: number
  canvasRenderWidth: number
  canvasRenderHeight: number
}

const rawAlignment: Record<number, RawStepAlignment> = {}
for (const stepKey of Object.keys(STEP_LAYOUTS)) {
  const step = Number(stepKey)
  const layout = STEP_LAYOUTS[step]
  const brow = getBrowBoxRaw(step)
  if (!layout || !brow) continue
  const scale = browTarget.w / brow.w
  rawAlignment[step] = {
    offsetX: browTarget.x - brow.x * scale,
    offsetY: browTarget.y - brow.y * scale,
    canvasRenderWidth: layout.canvasWidth * scale,
    canvasRenderHeight: layout.canvasHeight * scale,
  }
}

// A shared viewport sized to fit every step's aligned canvas without
// clipping — steps with more canvas padding (6-7) need a larger viewport
// than steps 1-4 to keep Brow the same rendered size. Guards against a
// negative offset too (none currently occur, but a future step's Brow
// could sit further right/down than the reference and push others
// negative).
const rawAlignmentValues = Object.values(rawAlignment)
const minOffsetX = Math.min(0, ...rawAlignmentValues.map((a) => a.offsetX))
const minOffsetY = Math.min(0, ...rawAlignmentValues.map((a) => a.offsetY))
const VIEWPORT_WIDTH = Math.max(
  ...rawAlignmentValues.map((a) => a.offsetX - minOffsetX + a.canvasRenderWidth),
)
const VIEWPORT_HEIGHT = Math.max(
  ...rawAlignmentValues.map((a) => a.offsetY - minOffsetY + a.canvasRenderHeight),
)

type StepAlignment = { leftPct: number; topPct: number; widthPct: number; heightPct: number }

// Deliberately relative to the shared VIEWPORT_HEIGHT (whichever step ends
// up tallest once every step's Brow is matched to the same target size)
// rather than each step's own height. An
// earlier version cropped each step's outer box to just its own content
// to avoid dead space below shorter steps' artwork — but that made every
// step's title/description sit at a *different* absolute height (each
// one 52px below wherever its own, differently-sized, illustration
// happened to end). Matching step 1's title/description position across
// every step means all of them need to share one box height instead, so
// the 52px gap measures from the same fixed point every time — shorter
// steps just end up with empty space of their own below their artwork,
// which is the explicit trade-off asked for here.
const STEP_ALIGNMENT: Record<number, StepAlignment> = {}
for (const [stepKey, raw] of Object.entries(rawAlignment)) {
  const step = Number(stepKey)
  STEP_ALIGNMENT[step] = {
    leftPct: ((raw.offsetX - minOffsetX) / VIEWPORT_WIDTH) * 100,
    widthPct: (raw.canvasRenderWidth / VIEWPORT_WIDTH) * 100,
    topPct: ((raw.offsetY - minOffsetY) / VIEWPORT_HEIGHT) * 100,
    heightPct: (raw.canvasRenderHeight / VIEWPORT_HEIGHT) * 100,
  }
}

// Per-layer entrance — 25ms stagger between each *newly-added* layer,
// following the same paintOrder they're actually drawn in (STEP_LAYOUTS
// above), so the eye visibly gains one piece at a time — base shadow, then
// crease, then lashes, etc. Only layers that are actually new to this step
// animate at all (see `animate` below, and EyeIllustration's own diffing
// against the previously-rendered step) — a layer that already existed
// just updates its asset/color in place with no motion. Earlier this
// stagger ran on *every* layer on *every* step (via a forced remount key
// in StepScreen), which replayed the whole illustration's build-up even
// for parts that hadn't actually changed — it read as the illustration
// resetting rather than gaining something new, which is the opposite of
// the intent. `both` fill mode holds the "from" (invisible) keyframe state
// through the stagger delay, so a later new layer doesn't flash at full
// opacity before its own turn. Applied via the outermost box div, not the
// inner "bleed" div or the rotated inner div (RotatedEyeLayer) — those
// already carry their own position/rotation transforms, and scale+opacity
// here is purely a paint-time visual effect layered on top, not a layout
// change.
const LAYER_STAGGER_MS = 25

function layerEntranceStyle(staggerIndex: number): CSSProperties {
  return {
    animation: 'illustration-layer-in var(--duration-base) var(--ease-out-quart) both',
    animationDelay: `${staggerIndex * LAYER_STAGGER_MS}ms`,
  }
}

function EyeLayer({
  layerKey,
  step,
  staggerIndex,
  animate,
}: {
  layerKey: string
  step: number
  staggerIndex: number
  animate: boolean
}) {
  const layout = STEP_LAYOUTS[step]?.layers[layerKey]
  const url = resolveLayerUrl(step, layerKey)
  if (!layout || !url) return null

  const boxStyle: CSSProperties = {
    ...layout.box,
    mixBlendMode: layout.blend,
    ...(animate ? layerEntranceStyle(staggerIndex) : null),
  }

  if (!layout.bleed) {
    return (
      <div className="absolute" style={boxStyle}>
        <img src={url} alt="" className="absolute inset-0 block size-full max-w-none" />
      </div>
    )
  }

  return (
    <div className="absolute" style={boxStyle}>
      <div className="absolute" style={layout.bleed}>
        <img src={url} alt="" className="block size-full max-w-none" />
      </div>
    </div>
  )
}

function RotatedEyeLayer({
  layerKey,
  step,
  staggerIndex,
  animate,
}: {
  layerKey: string
  step: number
  staggerIndex: number
  animate: boolean
}) {
  const layout = STEP_LAYOUTS[step]?.rotated?.[layerKey]
  const url = resolveLayerUrl(step, layerKey)
  if (!layout || !url) return null

  return (
    <div
      className="absolute flex items-center justify-center"
      style={{ ...layout.box, containerType: 'size', ...(animate ? layerEntranceStyle(staggerIndex) : null) }}
    >
      <div
        className="flex-none"
        style={{
          width: layout.width,
          height: layout.height,
          transform: `rotate(${layout.rotateDeg}deg)`,
        }}
      >
        <div className="relative size-full">
          <div className="absolute" style={layout.bleed}>
            <img src={url} alt="" className="block size-full max-w-none" />
          </div>
        </div>
      </div>
    </div>
  )
}

function StepStub({ step }: { step: number }) {
  return (
    <div
      className="relative flex w-full items-center justify-center rounded-lg border border-dashed border-black/20 text-xs text-black/40"
      style={{ maxWidth: VIEWPORT_WIDTH, aspectRatio: `${VIEWPORT_WIDTH} / ${VIEWPORT_HEIGHT}` }}
    >
      Step {step} — not wired up yet
    </div>
  )
}

function getOrderedKeysForStep(step: number | null): string[] {
  if (step === null) return []
  const manifestLayers = getManifestStepLayers(step)
  const layout = STEP_LAYOUTS[step]
  if (!layout || manifestLayers.length === 0) return []
  return layout.paintOrder.filter((key) => manifestLayers.includes(key))
}

/**
 * Composites the layered eye illustration for a given tutorial step (1-7).
 * Base layers (Sclera, Crease, iris, Brow, etc.) render for every step;
 * the [Add]/[Change] layers listed for that step in
 * eye-illustration-manifest.json render alongside them, in Figma's real
 * paint order — see the comment on STEP_LAYOUTS for why that's not simply
 * "base layers then variants on top".
 *
 * Step 1 uses its own V2 data (STEP_LAYOUTS[1], re-pulled from Figma once
 * Dev Mode access was available — see eye-illustration-manifest.json's
 * Step_1._note) but otherwise renders through this exact same per-layer
 * path as steps 2-7; it used to be a special case rendered from one
 * flattened 1.6MB SVG export (Figma's plain "Export as SVG" doesn't
 * preserve layer names, which is all that was available at the time), which
 * also meant every layer looked "new" the moment step 2 loaded — nothing
 * persisted across the 1→2 transition. Now that step 1's layers share real
 * names with step 2 (Sclera, Crease, iris, Brow, etc.), the diffing below
 * correctly treats those as continuing, not rebuilding.
 *
 * EyeIllustration itself is never remounted between steps (StepScreen just
 * passes it a new `step` prop) — that's what lets React's own per-layer
 * `key={layerKey}` reconciliation do the right thing on its own: a layer
 * whose key persists across a step change (e.g. "Sclera", present in every
 * step 2-7) is the *same* DOM node the whole time, its `<img src>` just
 * updates to that step's asset with no motion; a layer whose key is new
 * this step gets freshly created, and *that's* what plays the stagger
 * entrance below. See EyeLayer/RotatedEyeLayer's `animate` prop, computed
 * a few lines down by diffing this step's layer keys against the
 * previously-rendered step's.
 */
export function EyeIllustration({ step }: EyeIllustrationProps) {
  // Which step was rendered last, purely to know which of *this* step's
  // layers are actually new (see `animate` below) — read during render
  // (safe), written in an effect after commit (writing directly during
  // render risks divergence under Concurrent React's double-invoke
  // behavior). Same pattern as StepScreen's own direction-tracking ref,
  // and works for the same reason: this component doesn't remount between
  // steps, so the ref survives every step change on its own.
  const prevStepRef = useRef<number | null>(null)
  const previousStep = prevStepRef.current
  useEffect(() => {
    prevStepRef.current = step
  }, [step])

  const manifestLayers = getManifestStepLayers(step)
  const stepLayout = STEP_LAYOUTS[step]
  const alignment = STEP_ALIGNMENT[step]

  if (!stepLayout || !alignment || manifestLayers.length === 0) {
    return <StepStub step={step} />
  }

  const orderedKeys = stepLayout.paintOrder.filter((key) => manifestLayers.includes(key))
  const previousOrderedKeys = getOrderedKeysForStep(previousStep)
  // Stagger only counts *new* layers against each other — not their raw
  // position in orderedKeys — so e.g. two new layers that happen to sit
  // far apart in paint order (mixed in among several persisting,
  // non-animating ones) still stagger tightly against one another instead
  // of inheriting a large, arbitrary gap from layers that aren't moving at
  // all this step.
  let newLayerCount = 0

  return (
    // Fixed shared viewport (see STEP_ALIGNMENT above) so every step's
    // Brow renders at the same size *and* every step's title/description
    // lands at the same height, regardless of how tall that step's own
    // illustration content is.
    <div
      className="relative w-full mx-auto"
      style={{ maxWidth: VIEWPORT_WIDTH, aspectRatio: `${VIEWPORT_WIDTH} / ${VIEWPORT_HEIGHT}` }}
    >
      <div
        // pointer-events-none: layers bleed past this box's edges (negative
        // insets for feathered/blurred shapes), so without this their
        // transparent-but-present <img> bounding boxes intercept clicks
        // meant for whatever's rendered below the illustration.
        className="absolute pointer-events-none"
        style={{
          left: `${alignment.leftPct}%`,
          top: `${alignment.topPct}%`,
          width: `${alignment.widthPct}%`,
          height: `${alignment.heightPct}%`,
        }}
      >
        {orderedKeys.map((layerKey) => {
          // previousStep === null: nothing has rendered yet (this is the
          // very first mount, e.g. initial page load on step 1) — treat
          // every layer as new so the full build-up plays once, as a
          // page-load entrance rather than a step-to-step one.
          const isNewLayer = previousStep === null || !previousOrderedKeys.includes(layerKey)
          const staggerIndex = isNewLayer ? newLayerCount++ : 0
          return stepLayout.rotated?.[layerKey] ? (
            <RotatedEyeLayer
              key={layerKey}
              layerKey={layerKey}
              step={step}
              staggerIndex={staggerIndex}
              animate={isNewLayer}
            />
          ) : (
            <EyeLayer
              key={layerKey}
              layerKey={layerKey}
              step={step}
              staggerIndex={staggerIndex}
              animate={isNewLayer}
            />
          )
        })}
      </div>
    </div>
  )
}
