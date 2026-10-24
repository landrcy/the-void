# The Void

A quiet pixel-art space exploration game. You start as a small astronaut next to your ship on a pixel Earth.
Walk around the planet as long as you like (each world wraps all the way around), then board the ship and fly
through a randomly generated galaxy. Every planet, moon, asteroid, gas giant, station, wreck and ruin can be landed on,
and each one is a full world on foot with its own sky, weather, plants and creatures to scan.

Static site: plain HTML + vanilla JS + `<canvas>`, no build step, relative paths. Open `index.html`
(or serve the folder) — intended home: https://landrcy.github.io/the-void/ (not published).

All art is procedural, drawn on one integer-scaled pixel grid (no smoothing, no partial alpha; dithering instead of blending).
Motion uses delta time with fixed 1/120 s physics substeps, so it plays the same at 30, 60 or 144 Hz.

## Story (v2)
1. **Crash** — a new game opens on a falling ship over Earth's limb and a crash landing (skippable with any key/tap once seen; `?skipintro`).
2. **Repair** — pick up scrap around the wreck (icon bar under the ship shows 8 needed), press E at the wreck to repair.
3. **The solar system** — the real Sun, Mercury → Neptune, the Moon, Ganymede, Titan, Europa, Io, the belts. A soft boundary
   (icon hint + gentle push) keeps you home until you build the **Universal Drive** (scrap, ore, crystal, tech and 3 drive parts
   found on Ganymede, Titan and from the Mars mechanic / the derelict ark).
4. **Warp** — with the drive, cross the boundary (or jump from the map) for the warp cinematic into the seeded universe:
   huge planets, Dyson swarms, ringworlds, shattered planets, multi-ring planets, black holes and more.

Inhabitants talk in pictogram bubbles (the translator upgrade adds words) and offer trades, gifts and small quests.
Peaceful alien ships: mothership (trade), drone swarm (follow it to a cache), crystalline vessel (territorial escort — it nudges
you away; cloak ignores it), derelict ark (salvage).

## Controls
| | On foot | In space |
|---|---|---|
| Move | ← → / A D | ← → turn, ↑ / W thrust, ↓ / S brake |
| Jump / boost | Space (double jump / jetpack with upgrades) | Shift (boost, uses fuel) |
| Interact | E (talk / accept, mine deposits by holding, repair, board) | E (land, hail aliens) |
| Scanner pulse | Q | Q (pings bodies, shows edge markers) |
| Upgrades | U | U |
| Extras | R hoverboard, G grapple | F mining laser, C cloak, T time slow |
| Map | — | M or Tab: wheel/± zoom system → sector → galaxy, drag to pan, click to select, Enter to go |
| Admin | L, or 5 quick taps in the top-left corner | same |

The upgrade screen is three icon grids (ship easy, ship advanced, suit) with costs and hover tooltips; hull upgrades change the
ship's look (4 cosmetic tiers) and suit upgrades change the astronaut. The admin panel adds resources/parts/upgrades, god mode,
infinite fuel, skip story, teleport (Earth, Mars, Jupiter, generated system, huge, ringworld, Dyson, black hole…), reveal map,
warp now, spawn aliens / inhabitants, weather, time of day and game speed.

Top-right buttons: mute music, galaxy map, upgrades, scan, new random galaxy (dice), fullscreen, back to title.
The title has a reset icon (bottom left) with a ✓ / ✗ confirm. Touch devices get an on-screen pad (force it with `?touch`).
Progress saves to localStorage (`void:v2`; an old `void:v1` save is migrated with the story marked done).
`prefers-reduced-motion` turns off screen shake and fast effects.

## Debug URL parameters
- `?seed=12345` — galaxy seed (default 20241)
- `?planet=<type|name>` — start on the nearest body of that type or name: earth, mars, europa, titan, desert, lava, ice, crystal,
  gas, icegas, venus, jungle, ocean, moon, asteroid, station, wreck, ruins, huge, hugegas, ringworld, dyson, shattered, multiring
- `?space` — start in space at home; `?nocrash` — new game without the crash intro; `?skipintro`
- `?res=N` — N of every resource + drive parts; `?up=all` or `?up=thrust,gear,…`; `?tier=0..4`; `?god`; `?speed=0.5..4`
- `?fps` — fps counter; `?night` / `?day`; `?weather=rain|snow|…`
- `?reduced`; `?fresh` — ignore the save; `?nomusic`; `?sim` — paused loop for scripted tests (`VOID.stepSim(sec, fps)`)
- `?s=N` — force pixel scale

## Music
- "Persistence" by cinameng (James Gargette) — CC0 — https://opengameart.org/content/persistence
- "Cathedral in the forest (ambient loop)" by congusbongus — CC0 — https://opengameart.org/content/cathedral-in-the-forest-ambient-loop

The music starts on first interaction, fades in, crossfades between the two tracks, pauses when the tab is hidden and
remembers mute. See `assets/music/CREDITS.txt`.

## Tests
Requires Node and puppeteer-core with Chrome (`PUPPETEER=/path/to/puppeteer-core CHROME=/path/to/chrome`).
- `node tests/run-all.js` — console errors at 1280/1920/390, no horizontal overflow, fps in title/Earth/space/gas giant/black hole,
  (also with the galaxy map, admin and upgrade panels open), determinism per seed, frame-rate independence (30/60/144), reduced
  motion, land/takeoff loop, the full story loop (crash → scrap → repair → launch → solar system → universal drive → warp → land
  on a generated world, `tests/loop2-snippet.js`), save/load with progression, v1 → v2 migration and reset, skippable intro,
  size < 8 MB. Writes `tests/last-report.json`.
- `node tests/screenshots-v2.js [outdir]` — v2 preview set at 1280/1920/390 (default `/workspace/preview/the-void/v2`).
- `node tests/screenshots.js [outdir]` — renders the preview screenshot set and refreshes `assets/og.png`.

## Tooltips (v3)
Hover any icon (or long-press it on touch, or Tab/arrow to it with the keyboard) to get a short description in a dark pixel panel set in VT323 (`assets/tips.js`, `#tip` in `style.css`). The panel shows the name, a one-line description, what state it's in, the cost with resource icons (anything you can't afford is red), and what it needs (for example which upgrade or drive part). Tooltips cover upgrades, admin controls, the top-right buttons, HUD resources, fuel and status icons, galaxy map systems and pins, inhabitant trades and alien ships. They appear after a short delay, move to stay on screen at 390 px wide, and only redraw when their content changes. The scene itself stays free of text.
Preview: `node tests/screenshots-v3.js` writes to `/workspace/preview/the-void/v3/`.
