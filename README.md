# The Void

A quiet pixel-art space exploration game. You start as a small astronaut next to your ship on a pixel Earth.
Walk around the planet as long as you like (each world wraps all the way around), then board the ship and fly
through a randomly generated galaxy. Every planet, moon, asteroid, gas giant, station, wreck and ruin can be landed on,
and each one is a full world on foot with its own sky, weather, plants and creatures to scan.

Static site: plain HTML + vanilla JS + `<canvas>`, no build step, relative paths. Open `index.html`
(or serve the folder) — intended home: https://landrcy.github.io/the-void/ (not published).

All art is procedural, drawn on one integer-scaled pixel grid (no smoothing, no partial alpha; dithering instead of blending).
Motion uses delta time with fixed 1/120 s physics substeps, so it plays the same at 30, 60 or 144 Hz.

## Controls
| | On foot | In space |
|---|---|---|
| Move | ← → / A D | ← → turn, ↑ / W thrust, ↓ / S brake |
| Jump / boost | Space | Shift (boost) |
| Interact | E (scan creature or monolith, board ship) | E (land on the nearby body) |
| Map | — | M or Tab (Esc closes) |

Top-right buttons: mute music, galaxy map, new random galaxy (dice), fullscreen, back to title.
Touch devices get an on-screen pad (force it with `?touch`). Progress (seed, place, discoveries) saves to localStorage
and resumes after the title. `prefers-reduced-motion` turns off screen shake and fast effects.

## Debug URL parameters
- `?seed=12345` — galaxy seed (default 20241)
- `?planet=<type>` — start on the surface of the nearest body of that type: earth, desert, lava, ice, crystal, gas, icegas, venus, jungle, ocean, moon, asteroid, station, wreck, ruins, bh
- `?space` — start in space at home
- `?fps` — fps counter (bottom right)
- `?night` / `?day` — freeze time of day; `?weather` — force weather
- `?reduced` — reduced motion; `?fresh` — ignore the save; `?nomusic`; `?sim` — paused loop for scripted tests (`VOID.stepSim(sec, fps)`)
- `?s=N` — force pixel scale

## Music
- "Persistence" by cinameng (James Gargette) — CC0 — https://opengameart.org/content/persistence
- "Cathedral in the forest (ambient loop)" by congusbongus — CC0 — https://opengameart.org/content/cathedral-in-the-forest-ambient-loop

The music starts on first interaction, fades in, crossfades between the two tracks, pauses when the tab is hidden and
remembers mute. See `assets/music/CREDITS.txt`. No sound effects.

## Tests
Requires Node and puppeteer-core with Chrome (`PUPPETEER=/path/to/puppeteer-core CHROME=/path/to/chrome`).
- `node tests/run-all.js` — console errors at 1280/1920/390, no horizontal overflow, fps in title/Earth/space/gas giant/black hole,
  determinism per seed, frame-rate independence (30/60/144), reduced motion, land/takeoff loop, save/load, size < 8 MB. Writes `tests/last-report.json`.
- `node tests/screenshots.js [outdir]` — renders the preview screenshot set and refreshes `assets/og.png`.
