// URL <-> app-state mapping for App.tsx's hand-rolled router (see App.tsx's
// own comment on why this is hand-rolled against the History API rather
// than a routing library: every screen transition is already driven by a
// bespoke AnimatePresence slide keyed on a plain `screen` string, and a
// library's own navigation/animation model would fight that rather than
// drive it). Kept in its own module — not inlined in App.tsx — because
// both directions (path -> state, state -> path) need to agree on exactly
// the same route table, and that's easiest to keep true with one source of
// two small, side-effect-free pure functions.

import { TOTAL_STEPS } from './data/stepContent'

export type Screen = 'home' | 'tutorial' | 'account' | 'my-products' | 'bookmarks'

// The terminal "You're done!" screen (TutorialFlow's own DONE_STEP) is
// step TOTAL_STEPS + 1 here too — it's still one stop in the same /stepN
// sequence from the URL's point of view, not a separate route. Derived from
// TOTAL_STEPS (code review finding, was an independent `= 8` literal here)
// — see TutorialFlow.tsx's own LAST_MAKEUP_STEP/DONE_STEP for the sibling
// constants derived the same way.
const FIRST_TUTORIAL_STEP = 1
const LAST_TUTORIAL_STEP = TOTAL_STEPS + 1

/** Where exiting the tutorial should return to — mirrors App.tsx's own
 *  `tutorialOrigin` state (see its doc comment there for the full "same
 *  destination, two possible origins" reasoning). Round-tripped through the
 *  URL (a `?from=bookmarks` query param on `/stepN`, see pathForRoute)
 *  rather than living only in React state (code review finding): state
 *  alone meant a page reload mid-tutorial had no way to recover which
 *  origin was in play, and silently reset to 'home' — so reloading a
 *  `/step3` reached from Bookmarks, then tapping Exit, landed on Home
 *  instead of back on Bookmarks. */
export type TutorialOrigin = 'home' | 'bookmarks'

export type RouteState = {
  screen: Screen
  /** Only meaningful while `screen === 'tutorial'`; ignored otherwise. */
  tutorialStep: number
  /** Only meaningful while `screen === 'tutorial'`; ignored otherwise. */
  tutorialOrigin: TutorialOrigin
  /** Only meaningful while `screen === 'home'`; ignored otherwise. Mirrors
   *  HomeScreen's About/credits overlay (InfoOverlay.tsx), which opens
   *  in-place over Home rather than as its own screen. */
  aboutOpen: boolean
}

export const HOME_ROUTE: RouteState = {
  screen: 'home',
  tutorialStep: FIRST_TUTORIAL_STEP,
  tutorialOrigin: 'home',
  aboutOpen: false,
}

// Built from LAST_TUTORIAL_STEP (code review finding: yet another
// independent `8` right next to it, easy to miss since it's a regex
// character class rather than a plain number) — a single-digit `[1-N]`
// class only works while LAST_TUTORIAL_STEP stays a single digit; revisit
// this pattern (not just the number that feeds it) if the tutorial ever
// grows to 10+ steps.
const STEP_PATH_PATTERN = new RegExp(`^/step([1-${LAST_TUTORIAL_STEP}])$`)

/** Parses a `location.pathname + location.search` into the route it names
 *  (the search half only ever matters for `/stepN`'s `?from=` — see
 *  TutorialOrigin — every other route ignores it). Any path this app
 *  doesn't recognize (a typo, a stale/removed link, `/index.html`, etc.)
 *  falls back to Home rather than throwing or rendering nothing — same
 *  "degrade to a sane default, don't crash" call as the rest of this
 *  app's own parsing (see e.g. App.tsx's readSavedTutorialIds). */
export function parseRoute(pathnameAndSearch: string): RouteState {
  const [pathnameRaw, search = ''] = pathnameAndSearch.split('?')
  // Strip a trailing slash (but not the root path itself) so '/profile' and
  // '/profile/' resolve the same way.
  const path = pathnameRaw.length > 1 ? pathnameRaw.replace(/\/+$/, '') : pathnameRaw
  // Any value other than exactly 'bookmarks' (missing param, a typo, junk
  // from hand-editing the URL) degrades to the same 'home' default
  // TutorialOrigin already had before it was round-tripped through the URL
  // at all — same "sane default, don't throw" call as the rest of this
  // function.
  const tutorialOrigin: TutorialOrigin = new URLSearchParams(search).get('from') === 'bookmarks' ? 'bookmarks' : 'home'

  const stepMatch = STEP_PATH_PATTERN.exec(path)
  if (stepMatch) {
    const step = Math.min(LAST_TUTORIAL_STEP, Math.max(FIRST_TUTORIAL_STEP, Number(stepMatch[1])))
    return { screen: 'tutorial', tutorialStep: step, tutorialOrigin, aboutOpen: false }
  }

  switch (path) {
    case '/profile':
      return { screen: 'account', tutorialStep: FIRST_TUTORIAL_STEP, tutorialOrigin: 'home', aboutOpen: false }
    case '/my-products':
      return { screen: 'my-products', tutorialStep: FIRST_TUTORIAL_STEP, tutorialOrigin: 'home', aboutOpen: false }
    case '/bookmarks':
      return { screen: 'bookmarks', tutorialStep: FIRST_TUTORIAL_STEP, tutorialOrigin: 'home', aboutOpen: false }
    case '/about':
      return { screen: 'home', tutorialStep: FIRST_TUTORIAL_STEP, tutorialOrigin: 'home', aboutOpen: true }
    default:
      return HOME_ROUTE
  }
}

/** The inverse of parseRoute: the canonical path (+ query, for the tutorial
 *  route's origin) for a given app state. Every field that isn't relevant
 *  to `route.screen` is ignored, so callers don't need to zero them out
 *  themselves (see RouteState's own field comments). */
export function pathForRoute(route: RouteState): string {
  switch (route.screen) {
    case 'tutorial': {
      const base = `/step${route.tutorialStep}`
      // 'home' is the common case and stays query-string-free — only a
      // non-default origin needs to round-trip through the URL at all.
      return route.tutorialOrigin === 'bookmarks' ? `${base}?from=bookmarks` : base
    }
    case 'account':
      return '/profile'
    case 'my-products':
      return '/my-products'
    case 'bookmarks':
      return '/bookmarks'
    case 'home':
      return route.aboutOpen ? '/about' : '/'
  }
}
