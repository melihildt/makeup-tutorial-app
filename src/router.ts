// URL <-> app-state mapping for App.tsx's hand-rolled router (see App.tsx's
// own comment on why this is hand-rolled against the History API rather
// than a routing library: every screen transition is already driven by a
// bespoke AnimatePresence slide keyed on a plain `screen` string, and a
// library's own navigation/animation model would fight that rather than
// drive it). Kept in its own module — not inlined in App.tsx — because
// both directions (path -> state, state -> path) need to agree on exactly
// the same route table, and that's easiest to keep true with one source of
// two small, side-effect-free pure functions.

export type Screen = 'home' | 'tutorial' | 'account' | 'my-products' | 'bookmarks'

// The terminal "You're done!" screen (TutorialFlow's own DONE_STEP) is
// step 8 here too — it's still one stop in the same /stepN sequence from
// the URL's point of view, not a separate route.
const FIRST_TUTORIAL_STEP = 1
const LAST_TUTORIAL_STEP = 8

export type RouteState = {
  screen: Screen
  /** Only meaningful while `screen === 'tutorial'`; ignored otherwise. */
  tutorialStep: number
  /** Only meaningful while `screen === 'home'`; ignored otherwise. Mirrors
   *  HomeScreen's About/credits overlay (InfoOverlay.tsx), which opens
   *  in-place over Home rather than as its own screen. */
  aboutOpen: boolean
}

export const HOME_ROUTE: RouteState = { screen: 'home', tutorialStep: FIRST_TUTORIAL_STEP, aboutOpen: false }

const STEP_PATH_PATTERN = new RegExp(`^/step([1-8])$`)

/** Parses a `location.pathname` into the route it names. Any path this app
 *  doesn't recognize (a typo, a stale/removed link, `/index.html`, etc.)
 *  falls back to Home rather than throwing or rendering nothing — same
 *  "degrade to a sane default, don't crash" call as the rest of this
 *  app's own parsing (see e.g. App.tsx's readSavedTutorialIds). */
export function parseRoute(pathname: string): RouteState {
  // Strip a trailing slash (but not the root path itself) so '/profile' and
  // '/profile/' resolve the same way.
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname

  const stepMatch = STEP_PATH_PATTERN.exec(path)
  if (stepMatch) {
    const step = Math.min(LAST_TUTORIAL_STEP, Math.max(FIRST_TUTORIAL_STEP, Number(stepMatch[1])))
    return { screen: 'tutorial', tutorialStep: step, aboutOpen: false }
  }

  switch (path) {
    case '/profile':
      return { screen: 'account', tutorialStep: FIRST_TUTORIAL_STEP, aboutOpen: false }
    case '/my-products':
      return { screen: 'my-products', tutorialStep: FIRST_TUTORIAL_STEP, aboutOpen: false }
    case '/bookmarks':
      return { screen: 'bookmarks', tutorialStep: FIRST_TUTORIAL_STEP, aboutOpen: false }
    case '/about':
      return { screen: 'home', tutorialStep: FIRST_TUTORIAL_STEP, aboutOpen: true }
    default:
      return HOME_ROUTE
  }
}

/** The inverse of parseRoute: the canonical path for a given app state.
 *  Every field that isn't relevant to `route.screen` is ignored, so
 *  callers don't need to zero them out themselves (see RouteState's own
 *  field comments). */
export function pathForRoute(route: RouteState): string {
  switch (route.screen) {
    case 'tutorial':
      return `/step${route.tutorialStep}`
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
