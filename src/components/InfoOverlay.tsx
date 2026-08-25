import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { EASE_OUT_QUART } from './TutorialCard'
import infoCardTexture from '../assets/home/InfoCard.png'

// Local mirror of tokens.css's --ease-in-out, same "CSS var + JS-array
// mirror" pattern EASE_OUT_QUART (imported above) uses for its own
// --ease-out-quart token — kept local rather than exported from
// TutorialCard.tsx since this file is currently the only consumer; promote
// it to a shared location the same way EASE_OUT_QUART itself was only once
// a second file actually needed it (see plans/006, plans/README.md).
const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const

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

// ---- Tweak knobs: how much of the live Home screen shows through ----
// Two independent dials, both trending the same direction (turn either one
// down to reveal more of Home behind the overlay, up to hide more of it):
//   - BACKDROP_TINT_OPACITY: the cream gradient's own alpha. 0 = fully
//     see-through tint (blur only), 1 = fully opaque (Home invisible).
//   - BACKDROP_BLUR_PX: the backdrop-filter blur radius. 0 = Home shows
//     sharp behind the tint, higher = softer/less legible.
// Went 0.9/23px (literal Figma numbers, which bake in an extra opaque layer
// Figma's own mock doesn't need to fake blur — see comment above) → 0.45/
// 12px (too little tint, Home read as distracting rather than "behind
// glass") → these values, tuned by feel each round rather than re-derived
// from Figma (there's no literal source value for "a real backdrop-filter
// blurring real content," only for the duplicated-layer trick Figma used).
const BACKDROP_TINT_OPACITY = 0.68
const BACKDROP_BLUR_PX = 18

type InfoOverlayProps = {
  open: boolean
  onClose: () => void
}

function CloseIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        fill="currentColor"
        fillOpacity={0.8}
        d="M11.7676 9.99981L15.0001 6.76398C15.2099 6.52544 15.3211 6.21594 15.311 5.89839C15.3008 5.58083 15.1701 5.27905 14.9455 5.05439C14.7208 4.82973 14.419 4.69905 14.1015 4.68891C13.7839 4.67878 13.4744 4.78994 13.2359 4.99981L10.0001 8.23231L6.75839 4.98981C6.64228 4.8737 6.50443 4.7816 6.35273 4.71876C6.20102 4.65592 6.03843 4.62358 5.87422 4.62358C5.71002 4.62358 5.54742 4.65592 5.39571 4.71876C5.24401 4.7816 5.10616 4.8737 4.99005 4.98981C4.87394 5.10592 4.78184 5.24377 4.719 5.39547C4.65616 5.54718 4.62382 5.70977 4.62382 5.87398C4.62382 6.03818 4.65616 6.20078 4.719 6.35249C4.78184 6.50419 4.87394 6.64203 4.99005 6.75814L8.23255 9.99981L5.00005 13.2348C4.87328 13.3481 4.77096 13.4861 4.69936 13.6404C4.62775 13.7946 4.58837 13.9618 4.58361 14.1318C4.57885 14.3017 4.60882 14.4709 4.67169 14.6289C4.73456 14.7869 4.829 14.9304 4.94924 15.0506C5.06947 15.1709 5.21298 15.2653 5.37097 15.3282C5.52896 15.391 5.69812 15.421 5.86809 15.4163C6.03806 15.4115 6.20528 15.3721 6.35951 15.3005C6.51373 15.2289 6.65173 15.1266 6.76505 14.9998L10.0001 11.7673L13.2317 14.9998C13.4662 15.2343 13.7843 15.366 14.1159 15.366C14.4475 15.366 14.7656 15.2343 15.0001 14.9998C15.2346 14.7653 15.3663 14.4473 15.3663 14.1156C15.3663 13.784 15.2346 13.466 15.0001 13.2315L11.7676 9.99981Z"
      />
    </svg>
  )
}

// fi-br-link — unlike every other icon in this file/app (currentColor tied
// to --color-tutorial-card-text), this one's baked gold (#E3B345) in the
// source asset, same gold as --color-look-card-... family's Day tint
// elsewhere in tokens.css. Kept as a literal fill rather than swapped to an
// ink token: it's a real, intentional accent color in the design (matching
// the About card's own gold texture, InfoCard.png), not an oversight.
function LinkIcon() {
  return (
    <svg width={20} height={19.9581} viewBox="0 0 20 19.9581" fill="none" aria-hidden="true">
      <path
        fill="#E3B345"
        d="M8.67446 16.3012C7.35108 17.6735 5.19591 17.8001 3.72103 16.5921C2.84266 15.8316 2.39398 14.6881 2.5208 13.5332C2.63063 12.6817 3.02859 11.8934 3.64852 11.2994L6.04564 8.90065C6.5337 8.41244 6.5337 7.62104 6.04564 7.13282C5.55743 6.64476 4.76603 6.64476 4.27781 7.13282L1.93155 9.47994C0.862056 10.5113 0.187593 11.8846 0.0253363 13.3615C-0.277728 16.6878 2.17308 19.63 5.49941 19.9331C7.28572 20.0958 9.05214 19.4572 10.3214 18.1899L12.8286 15.6836C13.3166 15.1953 13.3166 14.404 12.8286 13.9157C12.3403 13.4277 11.5489 13.4277 11.0607 13.9157L8.67446 16.3012Z"
      />
      <path
        fill="#E3B345"
        d="M17.6345 1.20131C15.1455 -0.627395 11.6892 -0.3407 9.53551 1.87311L7.17589 4.23356C6.68783 4.72177 6.68783 5.51317 7.17589 6.00139C7.66411 6.48945 8.4555 6.48945 8.94372 6.00139L11.3409 3.60676C12.6353 2.26795 14.7297 2.11714 16.2026 3.25669C17.7186 4.49982 17.9399 6.73652 16.6967 8.25255C16.624 8.34128 16.547 8.42641 16.466 8.50768L13.9588 11.0148C13.4707 11.503 13.4707 12.2944 13.9588 12.7827C14.447 13.2707 15.2384 13.2707 15.7266 12.7827L18.2338 10.2755C20.5941 7.90764 20.588 4.0747 18.2201 1.71437C18.0362 1.53098 17.8405 1.35962 17.6345 1.20131Z"
      />
      <path
        fill="#E3B345"
        d="M7.17582 11.0168L11.0603 7.13228C11.5486 6.64403 12.3402 6.64403 12.8284 7.13228C13.3167 7.62054 13.3167 8.41213 12.8284 8.90039L8.94392 12.7849C8.45567 13.2732 7.66407 13.2732 7.17582 12.7849C6.68756 12.2967 6.68756 11.5051 7.17582 11.0168Z"
      />
    </svg>
  )
}

// fi-br-at — same baked-gold convention as LinkIcon above. The source SVG
// wraps this in a clipPath, but the clip rect (0,0,20,20) exactly matches
// the viewBox, so it never actually crops anything — dropped rather than
// carried over as dead markup.
function AtIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        fill="#E3B345"
        d="M10 -6.35783e-06C7.34871 0.00286121 4.80684 1.05735 2.9321 2.93209C1.05736 4.80684 0.00286709 7.34871 -4.75577e-07 9.99999C-0.104167 17.9783 9.29917 22.8575 15.75 18.1808C15.8852 18.0867 16.0005 17.9668 16.0892 17.828C16.1779 17.6893 16.2383 17.5343 16.2669 17.3721C16.2955 17.2099 16.2918 17.0436 16.256 16.8828C16.2201 16.7221 16.1529 16.57 16.058 16.4353C15.9632 16.3006 15.8427 16.186 15.7034 16.098C15.5642 16.01 15.4089 15.9505 15.2465 15.9227C15.0841 15.895 14.9179 15.8996 14.7573 15.9363C14.5967 15.973 14.445 16.0411 14.3108 16.1367C9.51667 19.6517 2.38583 15.955 2.5 9.99999C2.89333 0.0583267 17.1075 0.0599933 17.5 9.99999V11.25C17.5 11.5815 17.3683 11.8995 17.1339 12.1339C16.8995 12.3683 16.5815 12.5 16.25 12.5C15.9185 12.5 15.6005 12.3683 15.3661 12.1339C15.1317 11.8995 15 11.5815 15 11.25V9.99999C14.79 3.39249 5.20917 3.39333 5 9.99999C5.00832 10.969 5.29726 11.9149 5.83186 12.7231C6.36646 13.5314 7.12381 14.1674 8.0123 14.5542C8.90079 14.9411 9.88234 15.0622 10.8382 14.9029C11.7941 14.7436 12.6833 14.3107 13.3983 13.6567C13.8947 14.238 14.5569 14.6537 15.2961 14.8481C16.0353 15.0426 16.8163 15.0065 17.5345 14.7447C18.2527 14.4829 18.8737 14.0079 19.3143 13.3833C19.7549 12.7587 19.9942 12.0144 20 11.25V9.99999C19.9971 7.34871 18.9426 4.80684 17.0679 2.93209C15.1932 1.05735 12.6513 0.00286121 10 -6.35783e-06V-6.35783e-06ZM10 12.5C9.33696 12.5 8.70107 12.2366 8.23223 11.7678C7.76339 11.2989 7.5 10.663 7.5 9.99999C7.5 9.33695 7.76339 8.70107 8.23223 8.23223C8.70107 7.76339 9.33696 7.49999 10 7.49999C10.663 7.49999 11.2989 7.76339 11.7678 8.23223C12.2366 8.70107 12.5 9.33695 12.5 9.99999C12.5 10.663 12.2366 11.2989 11.7678 11.7678C11.2989 12.2366 10.663 12.5 10 12.5Z"
      />
    </svg>
  )
}

const EMAIL = 'melhildt@gmail.com'

// Shared by the Portfolio <a> and the Email <button> below so the two rows
// stay visually identical (same chip-less "icon + underlined text" link
// style) despite being genuinely different elements now — Portfolio still
// navigates, Email no longer does (see CopyEmailButton's own comment).
const LINK_ROW_CLASS = 'flex items-center gap-3 py-3 cursor-pointer active:scale-[0.97]'
const LINK_ROW_STYLE = { transition: 'transform var(--duration-instant) var(--ease-out-quart)' } as const
const LINK_LABEL_CLASS = 'text-[20px] tracking-[-0.4px]'
const LINK_LABEL_STYLE = { color: '#2c2926', fontWeight: 'var(--font-weight-semibold)' } as const
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
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
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

  const label = status === 'copied' ? 'Copied!' : status === 'failed' ? EMAIL : 'Email'
  // Only the *first* time a given mount lands on 'failed' plays the shake —
  // see plans/024's own Boundaries for the accepted repeat-tap limitation.
  const shakeOnFailure = status === 'failed' && !reduceMotion

  return (
    <button type="button" onClick={handleCopy} className={LINK_ROW_CLASS} style={LINK_ROW_STYLE}>
      <AtIcon />
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={label}
          className={`${LINK_LABEL_CLASS} ${status === 'idle' ? 'underline' : ''}`}
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
                  opacity: { duration: 0.2, ease: EASE_OUT_QUART },
                  transform: { duration: 0.3, ease: EASE_IN_OUT },
                }
              : { duration: 0.2, ease: EASE_OUT_QUART }
          }
        >
          {label}
        </motion.span>
      </AnimatePresence>
      <TrailingSpacer />
      <span className="sr-only" aria-live="polite">
        {status === 'copied'
          ? 'Email address copied to clipboard'
          : status === 'failed'
            ? `Could not copy automatically. Email address: ${EMAIL}`
            : ''}
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-20 flex flex-col overflow-hidden md:rounded-2xl"
          style={{
            background: `linear-gradient(0deg, rgba(249,243,235,${BACKDROP_TINT_OPACITY}) 25.235%, rgba(247,233,202,${BACKDROP_TINT_OPACITY}) 84.117%)`,
            backdropFilter: `blur(${BACKDROP_BLUR_PX}px)`,
            WebkitBackdropFilter: `blur(${BACKDROP_BLUR_PX}px)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.35, ease: EASE_OUT_QUART }}
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
              buttons, HomeScreen's info/user icons). */}
          <div className="flex shrink-0 items-center justify-between px-[--space-sm] pt-[--space-2xs]">
            <p
              className="text-[20px] tracking-[-0.4px]"
              style={{ color: 'rgba(44, 41, 38, 0.5)', fontWeight: 'var(--font-weight-medium)' }}
            >
              About
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="header-icon-button flex size-[40px] shrink-0 items-center justify-center rounded-[--radius-filter-chip] border-[0.5px] border-solid"
              style={{ background: 'var(--color-header-icon-bg)', borderColor: 'var(--color-header-icon-border)', color: 'var(--color-tutorial-card-text)' }}
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
              style={{ borderColor: 'rgba(44, 41, 38, 0.1)', boxShadow: '0px 0px 8px rgba(14, 11, 6, 0.03)' }}
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
                transition: { duration: reduceMotion ? 0.2 : 0.35, ease: EASE_OUT_QUART, delay: reduceMotion ? 0 : 0.06 },
              }}
              exit={
                reduceMotion
                  ? { opacity: 0, transition: { duration: 0.2, ease: EASE_OUT_QUART, delay: 0 } }
                  : {
                      opacity: 0,
                      transform: 'scale(0.96)',
                      transition: { duration: 0.35, ease: EASE_OUT_QUART, delay: 0 },
                    }
              }
            >
              {/* No rounding class here, unlike an earlier pass — the
                  parent's own overflow-hidden + rounded-[24px] is the only
                  clip source. Rounding both independently (this app's own
                  CardBehind in TutorialCard.tsx never does) let the two
                  antialiased corners land a hair apart, reading as a
                  cropped/double edge right at the rounding — not a source
                  image problem, and InfoCard.png is still the right asset. */}
              <img
                src={infoCardTexture}
                alt=""
                className="pointer-events-none absolute inset-0 size-full object-cover"
              />
              <p className="relative text-[15px] tracking-[-0.15px]" style={{ color: '#2c2926' }}>
                <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Beauty Notes</span> is a small app
                designed and built by Melisa Hildt using Figma and Claude Code and optimized for a mobile
                experience.
              </p>
              <p
                className="relative text-[14px] tracking-[-0.14px]"
                style={{ color: 'rgba(44, 41, 38, 0.8)', fontWeight: 'var(--font-weight-medium)' }}
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
