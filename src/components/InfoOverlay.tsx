import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { DURATION, EASE_IN_OUT, EASE_OUT_QUART, heroEntranceTransition } from './TutorialCard'
import { HEADER_CHIP_STYLE } from './ScreenHeader'
import { AtIcon, CloseIcon, LinkIcon } from './icons'
import { useEscapeToClose } from './useEscapeToClose'
import infoCardTexture from '../assets/home/about-image@2x.png'

// Figma: node 730:5706 ("Home/Info"), file Tech-Experimentation — shown when
// the home screen's info icon (HomeScreen.tsx) is tapped. The source frame
// is 402px wide, matching App.tsx's own max-w-[402px] column exactly, so
// this reuses Figma's pixel values directly rather than needing the usual
// mobile-rescaling pass other screens in this app went through.
//
// Real backdrop-blur over the live HomeScreen instead of Figma's own
// "Background" layer (a separately-positioned, blurred *copy* of the card
// stack + header): that layer only exists in Figma because a static design
// tool has no way to blur "whatever's actually behind this," so it fakes it
// by duplicating the frame and blurring the duplicate. A real overlay
// doesn't need that trick — `backdrop-filter: blur()` blurs whatever's
// genuinely rendered underneath, which is simpler and can't drift out of
// sync with HomeScreen's real content (card art, filter selection, etc.)
// the way a hand-copied duplicate could. Same reasoning as this app's other
// backdrop-blur usage (AllStepsView's sticky header, the iOS chrome mockups
// in the raw Figma pull) — just applied here for the first time to a real
// full-screen modal rather than a thin nav bar.
//
// The gradient tint on top of the blur (--Background-blur in Figma) is kept
// as literal Figma values (linear-gradient stops at 15.883%/74.765%) since
// it's a real design decision (warming the blur toward the app's cream
// palette), not a device-chrome artifact like the layers this skips.
//
// Tweak knobs for how much of the live Home screen shows through
// (--color-info-overlay-tint-top/-bottom, --blur-info-overlay-backdrop —
// tokens.css's own "Info/About overlay" section) live there now, not as
// local JS constants — code review finding #5: the same kind of
// tuned-by-feel, not-Figma-sourced frosted-glass pair already has a home in
// tokens.css (--color-list-header-bg/--blur-list-header, AllStepsView's
// sticky header), so this pair belongs there too rather than as a
// one-off local exception. See that section's own comment for the tuning
// history (0.9/23px → 0.45/12px → the current values) and why two colors,
// not one bare alpha number.

type InfoOverlayProps = {
  open: boolean
  onClose: () => void
}

// Exported: AccountScreen.tsx and MyProductsScreen.tsx reuse this same
// close-chip glyph for their own header ✕ buttons rather than each
// re-authoring the identical path data a third/fourth time (this app
// already treats that kind of duplication as a code-review finding worth
// fixing — see HEADER_CHIP_STYLE's own history, ScreenHeader.tsx).
const EMAIL = 'melhildt@gmail.com'

type CopyStatus = 'idle' | 'copied' | 'failed'

// Single source of truth for everything CopyEmailButton's `status` drives —
// code review finding #8: the visible label, the underline, and the
// sr-only announcement used to be three independent ternary chains over
// the same three cases, kept in sync by hand. A status that's missing from
// this map is a TypeScript error (Record<CopyStatus, ...> requires all
// three keys), not a silently-forgotten branch.
const STATUS_CONTENT: Record<CopyStatus, { label: string; underline: boolean; srText: string }> = {
  idle: { label: 'Email', underline: true, srText: '' },
  copied: { label: 'Copied!', underline: false, srText: 'Email address copied to clipboard' },
  // Label is the literal address itself, not a generic message — see
  // CopyEmailButton's own doc comment (findings #3/#8) for why.
  failed: { label: EMAIL, underline: false, srText: `Could not copy automatically. Email address: ${EMAIL}` },
}

// Shared by the Portfolio <a> and the Email <button> below so the two rows
// stay visually identical (same chip-less "icon + underlined text" link
// style) despite being genuinely different elements now — Portfolio still
// navigates, Email no longer does (see CopyEmailButton's own comment).
const LINK_ROW_CLASS = 'flex items-center gap-3 py-3 cursor-pointer active:scale-[0.97]'
const LINK_ROW_STYLE = { transition: 'transform var(--duration-instant) var(--ease-out-quart)' } as const
const LINK_LABEL_CLASS = 'text-[20px] tracking-[-0.4px]'
const LINK_LABEL_STYLE = { color: 'var(--color-tutorial-card-text)', fontWeight: 'var(--font-weight-semibold)' } as const
// Trailing size-[20px] spacer mirrors the icon's own width, so gap-3 puts
// equal space on both sides of the *text* — icon + gap-3 + text + gap-3 +
// spacer. Without it, `items-center` centers the icon+text block as a
// whole, and since only the icon sits outside the text, the text itself
// reads visibly right-of-center (worse the shorter the label). The icon
// ends up left of true-center as a result, but that reads as correct
// because it's attached to the text, not floating on its own.
function TrailingSpacer() {
  return <span aria-hidden="true" className="size-[20px]" />
}

// `navigator.clipboard` only exists in a secure context (https, or the
// special-cased `localhost`) — a phone hitting this app's dev server over
// plain http on the LAN (the normal way to test on a real device during
// dev) doesn't qualify, so `navigator.clipboard` is simply `undefined`
// there and the modern path can never run, no matter how it's called. This
// is confirmed as the real-device failure (not a permissions prompt the
// user missed, not an iOS-Safari-specific gesture-timing issue — those
// would still leave `navigator.clipboard` defined). `document.execCommand
// ('copy')` is deprecated but still works in that same insecure context on
// every browser this app targets, so it's the fallback rather than the
// primary path — kept second so the modern API (async, no visible focus
// hack) still runs first wherever it's actually available, i.e. on the
// deployed https build.
function copyText(text: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  // Off-screen but still focusable/selectable — execCommand('copy') only
  // copies the current selection, so the element needs to actually be in
  // the layout and focused, just not visible.
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '0'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  textarea.setSelectionRange(0, text.length) // iOS Safari needs an explicit range, select() alone isn't always enough
  let succeeded = false
  try {
    succeeded = document.execCommand('copy')
  } catch {
    succeeded = false
  }
  document.body.removeChild(textarea)
  return succeeded
}

async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Falls through to the legacy path below — e.g. permission denied
      // even though the API exists.
    }
  }
  return copyText(text)
}

// Copies the email to the clipboard instead of a mailto: link — per the
// user's own follow-up ask, since mailto hands off to whatever mail client
// (or none) happens to be configured rather than just letting someone grab
// the address directly. Feedback is the label swapping to "Copied!" on
// success (auto-reverts after a beat, --duration-base fade, this app's own
// "small state change" pace — tokens.css) or, on a genuine failure, to the
// literal address itself — silently doing nothing when both copy paths
// fail reads as a dead button, and a generic "Couldn't copy" message is
// still a dead end (code review, 2026-08-25 pass, findings #3/#8): if
// scripted copying is blocked (a locked-down in-app WebView is the
// realistic case — see copyToClipboard's own comment), showing the address
// as plain selectable text is the only remaining way to actually get it,
// so the failure state does NOT auto-revert like the success one does —
// reverting it on a timer would yank away the one fallback that exists
// right when someone's trying to long-press-select it. It only clears once
// the user retries (taps again) or leaves the screen (fresh mount). No
// toast/snackbar component exists elsewhere in this app to reuse, and one
// felt like more machinery than this needs. The underline is dropped for
// both non-"Email" states so they read as status messages/content, not a
// second, different link.
function CopyEmailButton() {
  const [status, setStatus] = useState<CopyStatus>('idle')
  const timeoutRef = useRef<number | undefined>(undefined)
  // Two independent guards checked together after the `await` below, not
  // one: `isMountedRef` covers the component having unmounted entirely
  // (overlay closed mid-copy — code review finding #2); `requestIdRef`
  // covers a *second* tap starting before the first one's async copy
  // resolves (finding #1) — each call captures its own id and only the
  // call whose id still matches the ref when it resolves is allowed to
  // apply its result, so a slow first tap can never clobber a fresher
  // second tap's outcome (or its aria-live announcement) after the fact.
  const isMountedRef = useRef(true)
  const requestIdRef = useRef(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    // The setup body has to re-arm `isMountedRef.current = true`, not just
    // rely on the `useRef(true)` initializer above — React StrictMode
    // double-invokes effects in dev (setup → cleanup → setup again) without
    // actually discarding the component's refs between those steps. With
    // no reset here, that first simulated cleanup would leave the ref
    // permanently `false` after the very first render, silently no-op'ing
    // every real copy attempt for the component's actual lifetime.
    // (Caught by exactly that behavior while verifying this fix.)
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      window.clearTimeout(timeoutRef.current)
    }
  }, [])

  async function handleCopy() {
    const requestId = ++requestIdRef.current
    const succeeded = await copyToClipboard(EMAIL)
    // Stale: either this component is gone, or a later tap already started
    // (and will apply its own result when it resolves) — either way, this
    // call's result is no longer the one that should reach the screen.
    if (!isMountedRef.current || requestId !== requestIdRef.current) return
    window.clearTimeout(timeoutRef.current)
    if (succeeded) {
      setStatus('copied')
      timeoutRef.current = window.setTimeout(() => setStatus('idle'), 1600)
    } else {
      // No revert timeout here — see this function's own doc comment above.
      setStatus('failed')
    }
  }

  const { label, underline, srText } = STATUS_CONTENT[status]
  // Only the *first* time a given mount lands on 'failed' plays the shake —
  // see plans/024's own Boundaries for the accepted repeat-tap limitation.
  const shakeOnFailure = status === 'failed' && !reduceMotion

  return (
    <button type="button" onClick={handleCopy} className={LINK_ROW_CLASS} style={LINK_ROW_STYLE}>
      <AtIcon />
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={label}
          className={`${LINK_LABEL_CLASS} ${underline ? 'underline' : ''}`}
          style={LINK_LABEL_STYLE}
          initial={{ opacity: 0 }}
          animate={
            shakeOnFailure
              ? {
                  opacity: 1,
                  transform: [
                    'translateX(0px)',
                    'translateX(-4px)',
                    'translateX(4px)',
                    'translateX(-3px)',
                    'translateX(3px)',
                    'translateX(0px)',
                  ],
                }
              : { opacity: 1 }
          }
          exit={{ opacity: 0 }}
          transition={
            shakeOnFailure
              ? {
                  opacity: { duration: DURATION.base, ease: EASE_OUT_QUART },
                  transform: { duration: 0.3, ease: EASE_IN_OUT },
                }
              : { duration: DURATION.base, ease: EASE_OUT_QUART }
          }
        >
          {label}
        </motion.span>
      </AnimatePresence>
      <TrailingSpacer />
      <span className="sr-only" aria-live="polite">
        {srText}
      </span>
    </button>
  )
}

/**
 * About/credits overlay — HomeScreen's info icon opens this over the live
 * home screen (backdrop-blur, see module comment above) rather than
 * navigating to a separate App.tsx `Screen`: it behaves like a modal (a
 * close button, not a back-stack entry) and Home's own content staying
 * mounted underneath is what makes the blur read as "this app, blurred,"
 * not a blank/generic backdrop.
 *
 * Motion: same fade + `--duration-layout`/`EASE_OUT_QUART` pairing as
 * App.tsx's own screen transitions (the nearest precedent for "a whole
 * screen's worth of content entering/exiting"), reduced to a plain
 * opacity-only fade under `prefers-reduced-motion` the same way App.tsx's
 * own transition does. The card gets its own slightly-offset scale+fade
 * (nested AnimatePresence-driven variants via the parent's `animate` prop
 * isn't needed here — a plain CSS-less two-layer motion.div, parent for the
 * blur/backdrop, child for the card, is enough since both mount/unmount
 * together) so the content reads as settling into place rather than the
 * whole screen just materializing flatly.
 */
export function InfoOverlay({ open, onClose }: InfoOverlayProps) {
  const reduceMotion = useReducedMotion()
  // Accessibility audit (2026-09-02, finding #7) — see useEscapeToClose's
  // own doc comment for why this is a shared hook, not a local effect.
  useEscapeToClose(onClose, open)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="About"
          // md:py-6 — without it, this overlay's header sits flush at the
          // very top on desktop instead of matching HomeScreen's own
          // 24px inset (the whole reason HomeScreen has md:py-6 at all —
          // see its own comment). `inset-0` on an absolutely positioned
          // element resolves against the ancestor's *padding box*, which
          // already includes that padding, so this element fills right
          // through it regardless of the ancestor's own md:py-6 — the two
          // never actually stack, this has to carry its own copy. Confirmed
          // via a real ≥768px viewport (getBoundingClientRect: header sat
          // 8px from the frame top instead of HomeScreen's 32px) — not
          // visible below md, where HomeScreen's own py-6 is 0 too, which
          // is why this went unnoticed until now.
          className="absolute inset-0 z-20 flex flex-col overflow-hidden md:rounded-2xl md:py-6"
          style={{
            background:
              // 180deg, not 0deg — 0deg ("to top") puts the *first*-listed
              // color at the bottom and the *last* at the top, which had
              // tint-top/tint-bottom backwards from both their own names
              // and Figma's "Background-blur" layer (gold at the bottom,
              // fading to white by mid-screen). Verified in-browser: a
              // plain `linear-gradient(0deg, red, blue)` renders blue on
              // top. Same colors/stops, just the corrected direction.
              'linear-gradient(180deg, var(--color-info-overlay-tint-top) 25.235%, var(--color-info-overlay-tint-bottom) 84.117%)',
            backdropFilter: 'blur(var(--blur-info-overlay-backdrop))',
            WebkitBackdropFilter: 'blur(var(--blur-info-overlay-backdrop))',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? DURATION.base : DURATION.layout, ease: EASE_OUT_QUART }}
        >
          {/* Header row — same px-[--space-sm] pt-[--space-2xs] inset as
              every other screen's header now (see tokens.css's own note,
              Figma node 738:8822 — this overlay mirrors HomeScreen's own
              header, which uses the same values); "About" sits at the same
              50%-opacity muted weight get_design_context pulled
              (rgba(44,41,38,0.5)), the close button reuses the exact chip
              chrome + hover/press feedback every other header icon button
              in this app already shares (.header-icon-button,
              --color-header-icon-bg/border — ScreenHeader.tsx's own icon
              buttons, HomeScreen's info/user icons).

              items-start, not items-center — code review finding #4: this
              row was still on items-center, the exact thing HomeScreen.tsx's
              own header row (see its comment there) was deliberately
              changed away from after finding it pushes a 40px icon button's
              top edge below the intended --space-2xs inset whenever a
              sibling's line-box exceeds 40px. Harmless today (the "About"
              label's own line-box stays under 40px), but left on
              items-center this file would silently reproduce that exact
              bug the moment the label ever grows — matching HomeScreen's
              fix now closes that gap instead of leaving it latent. */}
          <div className="flex shrink-0 items-start justify-between px-[--space-sm] pt-[--space-2xs]">
            <p
              style={{
                fontFamily: 'var(--font-family-serif-card)',
                fontSize: 'var(--font-size-title-serif)',
                letterSpacing: 'var(--letter-spacing-title-serif)',
                color: 'var(--color-info-overlay-heading)',
                // --font-weight-regular, not --font-weight-medium (verify
                // pass, 2026-09-01) — a fresh pull of this title (896:10025)
                // shows 'EB_Garamond:Regular'/font-normal, matching
                // BookmarksScreen's own title (already on -regular, see its
                // own comment) — this one just hadn't been re-checked since.
                fontWeight: 'var(--font-weight-regular)',
              }}
            >
              About
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="header-icon-button flex size-[44px] shrink-0 items-center justify-center rounded-[--radius-filter-chip] border-[0.5px] border-solid"
              // Spreads the shared chip style (code review finding #7)
              // rather than substituting it outright — this button also
              // needs `color` set (CloseIcon's path uses fill="currentColor"),
              // which HEADER_CHIP_STYLE itself doesn't carry since
              // ScreenHeader.tsx's own buttons set their icon color directly
              // on each path instead. --color-info-overlay-heading, not
              // --color-tutorial-card-text — Figma's own close-chip asset
              // (node 896:10026) bakes a flat #656462, the muted heading
              // ink, not the darker body-text ink (was mismatched app-wide
              // pre-V6; see icons.tsx's own CloseIcon comment).
              style={{ ...HEADER_CHIP_STYLE, color: 'var(--color-info-overlay-heading)' }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Card + links, vertically centered in the remaining space —
              same flex-1 items-center justify-center centering technique
              HomeScreen.tsx already uses for the tutorial stack, rather
              than reproducing Figma's literal absolute top offsets (which
              were measured against its device-chrome frame, not this app's
              real header height). */}
          <div className="flex flex-1 flex-col items-center justify-center gap-8 overflow-y-auto px-6 py-6">
            <motion.div
              className="relative flex w-full max-w-[282px] flex-col items-start gap-4 overflow-hidden rounded-[24px] border border-solid px-10 py-12"
              // borderColor: --color-filter-chip-border's own exact value —
              // HomeScreen.tsx's filter chips already use this token for the
              // same "unselected chip/card" look, still confirmed correct
              // on this card's own node (896:10013) in a fresh pull.
              //
              // boxShadow: verify pass (2026-09-01) — was --shadow-filter-
              // chip (0px 0px 8px, no spread), which undersold this card's
              // real effect. A fresh pull of 896:10013 names it
              // "BeautyNotes/Shadow_1" (blur 8, spread 2), i.e. bit-for-bit
              // --shadow-card below, not --shadow-filter-chip.
              style={{ borderColor: 'var(--color-filter-chip-border)', boxShadow: 'var(--shadow-card)' }}
              // transition is embedded per-target (animate/exit) rather than
              // passed once as a shared prop: Framer Motion applies a
              // component-level `transition` prop to *both* the entrance
              // (animate) and the exit, so a plain shared delay meant to
              // stagger the card behind the backdrop on open also delayed
              // the card's own close — confirmed live via
              // element.getAnimations()[].effect.getComputedTiming(), which
              // showed the exit animation carrying the same 60ms delay,
              // making the card visibly linger after the backdrop had
              // already faded. Embedding `transition` inside `animate` and
              // `exit` separately (each target's own `transition` key
              // overrides the shared one for that target) keeps the 60ms
              // stagger on open only, per plans/023's own Boundaries.
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.96)' }}
              animate={{
                opacity: 1,
                transform: 'scale(1)',
                transition: heroEntranceTransition(!!reduceMotion).animateTransition,
              }}
              exit={heroEntranceTransition(!!reduceMotion).exit}
            >
              {/* No rounding class here, unlike an earlier pass — the
                  parent's own overflow-hidden + rounded-[24px] is the only
                  clip source. Rounding both independently (this app's own
                  CardBehind in TutorialCard.tsx never does) let the two
                  antialiased corners land a hair apart, reading as a
                  cropped/double edge right at the rounding — not a source
                  image problem.

                  InfoCard.png replaced (verify pass, 2026-09-01) — the prior
                  asset (a solid gold/mustard photo) didn't match this
                  "New"-section pull at all; the real texture is the faint
                  sepia illustration at node 911:12808 ("about-image").
                  Figma's flat PNG-fill export for that node comes back
                  fully transparent (0 alpha every pixel — a broken export
                  on Figma's end, confirmed on both this node and the
                  card's own 896:10013) — a first pass here worked around
                  that with get_screenshot's rendered capture instead, but
                  the user then exported real about-image@2x.png/@3x.png
                  directly from Figma (same src/assets/home/ folder as
                  every other image import in this app), which is what's
                  used now — full-strength/full-detail, not get_screenshot's
                  faint, already-composited-at-~30%-opacity capture. @2x
                  (564×474) is the one actually imported, matching this
                  app's existing single-flat-import convention (no
                  <img srcSet> anywhere else in src/); @3x is only a bit
                  crisper on a 3x device for a background texture already
                  sitting at 30% opacity, not worth the ~2x extra bytes
                  size-for-size, but it's in the same folder if that
                  changes. `opacity-30` is NOT applied below (verify pass,
                  2026-09-01, reverses the previous pass's own claim that
                  "this source is unfaded") — reading the actual exported
                  file's alpha channel (PIL: `Image.open(...).convert
                  ('RGBA')`, checking the alpha band's min/max) shows a
                  uniform 77/255 (≈30%) across the whole image, i.e. the
                  export already baked in the Figma layer's own 30%
                  opacity — confirmed by get_design_context's own reference
                  code for this exact node also showing a plain `opacity-30`
                  Tailwind class on this same img, a single application,
                  not two. Applying opacity-30 here on top of that
                  compounded to ~9% effective visibility (0.3×0.3), not the
                  ~30% Figma actually shows — the "still looks like a lot
                  of opacity" (i.e. too faded) report after the first pass
                  here was this compounding, not the white backdrop below.
                  `object-bottom` matches Figma's own markup for this node.

                  --color-surface backdrop (verify pass, 2026-09-01, code
                  review follow-up): Figma's own markup puts a `bg-white`
                  div directly behind the texture (with a
                  `mix-blend-color-burn`, which is a mathematical no-op for
                  a pure-white blend source — confirmed via the CSS
                  compositing spec's own formula — so it isn't doing any
                  actual burning, just occupying the white layer's spot).
                  This card had neither: the texture sat directly over
                  whatever this overlay's own real backdrop-blur was
                  showing through (the live, warm-toned HomeScreen behind
                  it), not a flat white base. Sampling pixels from both a
                  get_screenshot render of the real card (896:10013) and
                  this app's own screenshot at the same position confirmed
                  it: Figma's card reads as a mostly-white/cream surface
                  with a faint gray imprint of the photo, this app's read
                  as a visibly warm sepia card — the about-image asset
                  itself is neutral gray (confirmed by sampling the PNG
                  file directly), so the extra warmth was coming entirely
                  from the live blurred backdrop bleeding through where
                  Figma's card has an opaque-ish white one instead. Every
                  other card-shaped container in this app already has a
                  real background for the same reason (BigCard, My
                  Products' list container, etc.) — this was the one
                  exception. */}
              <div className="absolute inset-0" style={{ background: 'var(--color-surface)' }} />
              <img
                src={infoCardTexture}
                alt=""
                className="pointer-events-none absolute inset-0 size-full object-bottom"
              />
              <p className="relative text-[15px] tracking-[-0.15px]" style={{ color: 'var(--color-tutorial-card-text)' }}>
                {/* fontWeight was --font-weight-semibold (600) — a fresh
                    pull of this span (896:10014) shows "Inter 18pt:Bold",
                    distinct from the paragraph's own Medium base weight;
                    see --font-weight-bold's own tokens.css comment. */}
                <span style={{ fontWeight: 'var(--font-weight-bold)' }}>Beauty Notes</span> is a small app
                designed and built by Melisa Hildt using Figma and Claude Code and optimized for a mobile
                experience.
              </p>
              <p
                className="relative text-[14px] tracking-[-0.14px]"
                style={{ color: 'var(--color-info-overlay-body-secondary)', fontWeight: 'var(--font-weight-medium)' }}
              >
                Inspired by fashion magazines and Kevin Aucoin books.
              </p>
            </motion.div>

            <div className="flex flex-col items-center gap-3">
              <a
                href="https://melisahildt.com"
                target="_blank"
                rel="noreferrer"
                className={LINK_ROW_CLASS}
                style={LINK_ROW_STYLE}
              >
                <LinkIcon />
                <span className={`${LINK_LABEL_CLASS} underline`} style={LINK_LABEL_STYLE}>
                  Portfolio
                </span>
                <TrailingSpacer />
              </a>
              <CopyEmailButton />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
