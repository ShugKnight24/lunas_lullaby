# Luna's Lullaby

A cozy farming and life sim for the browser. You grow crops, build up your farm, make friends in town, and ride your horse around with your pet. Everything you see is SVG generated in code at runtime and rasterised to cached bitmaps. There are no image files. The drawing uses a warm plum ink with soft cel shading.

## Run

```sh
npm install
npm run dev      # http://localhost:3200
npm test         # vitest: tests/unit/**/*.test.js
npm run test:e2e # playwright: tests/e2e (starts the dev server if needed)
npm run build    # production bundle in dist/
```

If Playwright's bundled browser isn't installed, point `CHROME_PATH` at a local Chrome for `test:e2e` and `shot`. Headless screenshot of the running dev server: `node scripts/shot.mjs http://localhost:3200/ shots/x.png 2000`.

## CI and deploy

GitHub Actions runs the unit tests, the build and the Playwright specs on every pull request and on `master` (`.github/workflows/ci.yml`). The game is hosted on Vercel through its GitHub integration: `master` deploys to production and every pull request gets a preview URL. Build settings are pinned in `vercel.json` (Vite, `npm run build`, output `dist/`, long-lived caching for hashed assets).

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | Walk (or ride) |
| Space / left click | Use the selected tool or seeds toward the tile you face |
| E / right click | Talk, give a gift, pet, ride, ship, harvest, forage, sleep, shop, build |
| F | Mount / dismount the horse |
| B | Hop on / off the bicycle (outdoors) |
| M | Mute / unmute (volumes are in the pause menu) |
| N | Show / hide the minimap |
| Shift | Sprint |
| 1–9 / mouse wheel | Choose hotbar slot |
| J · R · I (Tab) · K | Journal · Friends tab · Bag tab · Craft tab |
| + / − | Zoom |
| Esc | Pause (controls list, save, quit to title, skip first-day tasks) |
| Click a hotbar slot | Select it |

Build mode opens from Theo's board by the carpenter shop, or from his workbench inside. WASD pans the view, click places, and right click or Esc exits. The bar at the top switches between Place, Move and Remove.

## Luna

*Luna's Lullaby* is dedicated to Luna. She's the default companion, and the story is hers: a new game opens in a starry dream where your companion asks to see you live the life you always talked about, and promises to stay beside you every step. **Journal → Wishes** tracks eight milestones your companion is waiting to see (a first harvest, a friend in town, the Moonfish, making the Hollow home…); each one that comes true is revealed on that night's summary card, and when all eight have, one last dream plays. Some nights the summary also says what your companion dreamed about.

Companions: an Anatolian shepherd (Luna, drawn from her photos, and the default), a pup, a cat, a bird, or Sawyer the chainsaw pup. The story lines use whatever name you give yours.

## First day

After the dream comes a letter from Rowan, the farm's previous keeper, and Mira walks over to welcome you. A task card (top left) then walks through the basics — till, plant, water, refill at the farm well, forage, ship, say hello in town, sleep — with an arrow over the well, bin and house when they matter. Finishing it earns a small gift; the pause menu can skip it. The Bag / Journal / Menu buttons sit above the card.

## How a day goes

- The clock runs from 6:00 to 2:00. Each 10-minute tick takes 7 real seconds (`TICK_SECONDS` in `src/game/config.js`).
- Sleeping in your bed ends the day. The shipping bin pays out, watered crops grow, and the day summary card appears. The game autosaves at this point.
- If you are still awake at 2:00 you pass out. You lose 10% of your gold (1000g at most) and wake up with half energy.
- A season lasts 28 days. Crops that don't belong to the new season wither. Rainy days water every crop for you, and sprinklers water the 4 tiles around them each morning.
- Tools cost energy, and Honey Loaves from the bakery restore it.
- A coop houses two named hens. Stock it with hay (from the bakery) or fiber, and each hen that finds feed eats one and lays an egg every morning. Press E at the coop to collect them. Pet each hen once a day; happier hens lay silver and gold eggs.
- Crops, fish and eggs come in normal, silver and gold quality (1×, 1.25×, 1.5× price). Fertilizer and never letting a crop go dry improve harvests; stopping the reel marker near the middle of the green zone improves fish.
- Fish depend on the water (river, pond, a hidden pool), season, hour and weather. The journal's Fish tab logs catches and hints at the rest.
- Winter has one crop, Moonbloom. Snow doesn't water it.
- Five skills (Journal → Skills) level 0–10 from XP: farming (harvests), foraging (pickups, felling trees), fishing (catches, more for hard fish and better quality), ranching (petting hens, collecting eggs) and building (constructing and crafting). Each level trims the energy that skill's tools cost, and each has a perk: better crop odds, double forage finds, a wider reel zone, more affection per pat.
- Crafting (K, or Journal → Craft): fertilizer, bait, an Egg Sandwich, Forager's Stew, a Lucky Lure, and two machines. Most recipes unlock with skill levels. Place a Preserves Jar or Mayo Machine on the farm from the hotbar, then load it with E: a crop becomes jam in 3 nights (twice the crop's price + 50), an egg becomes mayonnaise overnight. Quality carries through.
- At level 5 each skill offers a choice of two professions (e.g. Angler: fish sell for 25% more, or Patient Line: bites come twice as fast).
- Villagers keep routines: rainy days and some weekdays change where they go. Bram, Mira's grandfather, knows the Hollow's lullaby legend. Heart events unlock at 2 and 5 hearts.
- Building unlocks new things on Theo's board as it grows: a gate (walk-through), log fence, picket fence, stone wall and hedge — all fence styles join up — plus a planter, lamp post (it glows at night) and bench. Wooden and picket fences and gates take paint (pick a colour on the build bar). Materials get cheaper each level, and from level 6 you build it yourself with no gold fee. Build mode tints every open tile you can build on; the farm runs from the house down to the southern tree line.
- Get around faster: hold Shift to sprint, ride the horse (F), or craft a bicycle (Building 2) and press B.
- The farm well beside the field refills the watering can (face it and press Space), as do the town well and any water.

## Layout

```
index.html, style.css      page shell, cozy DOM theme (Fredoka + Nunito)
src/main.js                boot, input bindings, window.__game debug/test hooks
src/engine/                vendored from Clockwork Carnage (SVG raster cache, sprite blitter, loop, input, save…)
src/game/config.js         tuning constants
src/game/state.js          save state shape, SAVE_VERSION + MIGRATIONS chain
src/game/game.js           runtime: levels, actors, clock, transitions, sleep/day rollover, save/load
src/game/actions.js        tool use, E interactions, gifts/talk, mounting
src/game/progress.js       intro scene, skill XP awards, tutorial steps
src/game/build.js          build mode: ghost, place/move/remove, fence masks
src/game/fishing.js        cast → bite → timing-bar fishing (fish picked from data/fish.js)
src/game/render.js         frame composition, y-sort, day/night grade, glows, build ghost
src/game/rules/            pure rules (tested): clock, crops, inventory, shipping, quality, fishing, skills, tutorial, relationships, structures, animals, weather, dialogue, day
src/game/data/             items, crops, fish, structures, villagers, dialogue (incl. intro), tutorial, forage tables
src/game/art/              cozy-kit (ink/cel primitives), person, animals, crops, props, icons, sprite registry
src/game/world/            map layout, levels/collision, ground baking, camera, lighting, weather/fx, pathfinding
src/game/actors/           player, pet, horse, villagers, chickens
src/game/ui/               canvas HUD, DOM panels (dialogue, shop, build, journal, pause, summary), title + creator
tests/unit/                vitest suites for the rules and save migrations
tests/e2e/                 playwright specs driving window.__game
```

## Minimap

Bottom-left (above the hotbar on phones): the whole valley painted from the map — fields, paths, water, forest, buildings, your structures and tilled soil — with dots for you, your companion, the horse and villagers, a frame for what's on screen, and a star on the current first-day task. Secret places look like plain meadow until you find them. N shows or hides it (remembered per browser).

## Sound

All sound is synthesized with the Web Audio API — no audio files, like the art. It starts on your first click or key press (browsers require a gesture).

- **Music** (`src/game/audio/score.js`, `music.js`): each day gets its own gentle tune, generated from the day's seed in a scale and tempo for the season (spring music box in C, summer flute in F lydian, fall flute in A minor, winter bells in D dorian); after 8pm it slows into a music box. *Luna's Lullaby*, a hand-written theme, plays on the title screen, in the dream scenes and over the night summary. Indoors the music is muffled; it ducks under dialogue.
- **Effects** (`sfx.js`): a small synthesized sound for every action, varied slightly each time.
- **Ambience**: rain, birdsong by day, crickets at night.
- **Mixing** (`src/engine/audio.js`): music, effects and ambience buses into a master with a soft room reverb. Volumes are saved per browser (pause menu, or M to mute), and sound pauses when the tab is hidden.

## Art pipeline

Each sprite is `{ box, layers: [{ markup, anim? }] }` in art units (1 tile = 32 units). `src/engine/sprite.js` rasterises each layer once for every half-octave size bucket, then blits it after that. Motion such as sway, bob and float is applied as a canvas transform, so a sprite never needs to be re-rasterised to animate.

`src/game/art/cozy-kit.js` provides `part()`, which draws a shape in its shadow tone and then draws the base tone on top, shifted up and to the left and clipped to the shape. That leaves a lower-right shadow crescent. A dilate filter (`#ol`) adds the chunkier outer contour.

People and pets are built from their creator parameters and cached under a hash of those parameters (`lookKey`). The ground is painted with Canvas2D into 16×16-tile chunk canvases for each season. Only the water shimmer is drawn live.

## Debug hooks

`window.__game` exposes the runtime (`g`, `state`) and helpers for scripted checks: `newGame(profile, { intro: false })`, `teleport(tx, ty, level, dir)`, `select` (slot index), `selectItem(id)`, `give`, `use`, `interact`, `mount`, `setTime`, `setSeason`, `setWeather`, `sleep`, `save`, `openBuild`, `place`, `hover`, `query`.
