# Makeup Tutorial App

A mobile-first makeup tutorial app built from a Figma design (`Tech-Experimentation`,
file key `6Mr7K0RONTS8SltZRJtqYj`). A home screen with a swipeable stack of
tutorial cards (filterable by Day/Night/Glam) leads into a 7-step "90s inspired
smoky eye" tutorial flow, with bookmarks, an account/products area, and an
About overlay alongside it.

Only one tutorial ("Soft Smokey Eye") has real step content behind it right
now — the rest are wired up (real photos, bookmarks, filtering) but show a
"Coming soon" state when opened. See [docs/README.md](docs/README.md) for
what's built vs. still open, area by area.

## Stack

Vite + React 19 + TypeScript + Tailwind CSS, with Framer Motion for
animation. No routing library (local component state), no backend (state is
in-memory — nothing persists across a reload). Storybook is set up for
isolated component work.

## Running it

```bash
npm install
npm run dev
```

Opens on `http://localhost:5173`. Other scripts: `npm run build` (typecheck +
production build), `npm run lint`, `npm run storybook`.

### Testing on a phone

The dev server already binds to all interfaces (`vite.config.ts`'s
`server.host: true`), so a phone on the same WiFi can reach it directly —
no extra config needed:

```bash
npm run dev
ipconfig getifaddr en0   # your Mac's LAN IP
```

Open `http://<that-ip>:5173` on the phone. If it doesn't load, it's almost
always the Mac's firewall — allow the connection when macOS prompts, or check
System Settings → Network → Firewall.

## Documentation

Start at **[docs/README.md](docs/README.md)** — it indexes every doc in
`docs/` and `plans/`, with a one-line description and current-vs-historical
status for each, so you don't have to guess which one is still accurate.

## No automated tests

There are none yet (`npm run build`'s typecheck plus manual browser
verification is the current safety net). Worth knowing before assuming CI
coverage exists.
