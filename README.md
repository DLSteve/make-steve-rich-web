# The Make Steve Rich Foundation

A satirical charity landing page dedicated to the financial enrichment of people named Steve. Single-page site built with vanilla TypeScript, Vite, and Tailwind CSS.

## Highlights

- **Rotating Earth dot-cloud hero** — 25,000 dots sampled from a NASA Blue Marble land mask, rendered on a 2D canvas with per-frame projection, graticule overlay, and pulsing event markers at real-world city coordinates.
- **Dark mode** — class-based via Tailwind with OS-preference detection, a sun/moon toggle in the nav, `localStorage` persistence, and a pre-paint inline script to avoid theme flash.
- **Stripe-inspired styling** — white surfaces, vibrant blue/green accents, generous whitespace, dark CTA pills.
- **Live donation ticker** — increments by random amounts at random intervals.
- **Real portraits** — Steve Jobs, Carell, Irwin, Martin, and Harvey are featured in the success stories section.

## Stack

- [Vite](https://vitejs.dev) 6
- [TypeScript](https://www.typescriptlang.org) 5.7 (strict)
- [Tailwind CSS](https://tailwindcss.com) 3.4 (with `darkMode: 'class'`)
- Google Fonts: Slabo 27px (display), Source Sans 3 (body), Crimson Pro (logo wordmark)

## Scripts

```bash
npm run dev       # start the Vite dev server
npm run build     # type-check + production build to dist/
npm run preview   # preview the production build locally
```

## Project layout

```
.
├── index.html              # the entire page (single document, Tailwind utility classes)
├── src/
│   ├── main.ts             # globe animation, donation ticker, theme toggle, smooth scroll
│   ├── style.css           # @tailwind directives only
│   └── vite-env.d.ts
├── public/
│   ├── world-mask.jpg      # NASA Blue Marble equirectangular composite (2048×1024)
│   └── steves/             # Wikimedia portraits of the famous Steves
├── tailwind.config.js      # darkMode: 'class', content globs
├── postcss.config.js
├── tsconfig.json
└── vite.config.ts
```

## Notes

- After changing `tailwind.config.js`, restart the dev server — Vite's HMR does not reload the Tailwind config.
- All globe coordinates use a flipped-z spherical projection so east-of-front-center renders to the right of the globe (matches a satellite view).
- Steve event markers are pinned to real lat/lng for 18 cities, so they land on their actual continents.

## Disclaimer

The Make Steve Rich Foundation is not a real 501(c)(3). It is also not real in any other respect.
