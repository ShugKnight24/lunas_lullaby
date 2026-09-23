# Luna's Lullaby

A cozy farming and life sim for the browser. You grow crops, build up your farm, make friends in town, and ride your horse around with your pet. Everything you see is SVG generated in code at runtime and rasterised to cached bitmaps. There are no image files. The drawing uses a warm plum ink with soft cel shading.

## Run

```sh
npm install
npm run dev      # http://localhost:3200
npm test         # vitest: tests/unit/**/*.test.js
npm run build    # production bundle in dist/
```

Headless screenshot of the running dev server: `node scripts/shot.mjs http://localhost:3200/ shots/x.png 2000`.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | Walk (or ride) |
| Space / left click | Use the selected tool or seeds toward the tile you face |
| E / right click | Talk, give a gift, pet, ride, ship, harvest, forage, sleep, shop, build |
| F | Mount / dismount the horse |
| 1–9 / mouse wheel | Choose hotbar slot |
| J · R · I (Tab) | Journal · Friends tab · Bag tab |
| + / − | Zoom |
| Esc | Pause (controls list, save, quit to title) |

Build mode opens from Theo's board by the carpenter shop, or from his workbench inside. WASD pans the view, click places, and right click or Esc exits. The bar at the top switches between Place, Move and Remove.

## How a day goes

- The clock runs from 6:00 to 2:00. Each 10-minute tick takes 7 real seconds (`TICK_SECONDS` in `src/game/config.js`).
- Sleeping in your bed ends the day. The shipping bin pays out, watered crops grow, and the day summary card appears. The game autosaves at this point.
- If you are still awake at 2:00 you pass out. You lose 10% of your gold (1000g at most) and wake up with half energy.
- A season lasts 28 days. Crops that don't belong to the new season wither. Rainy days water every crop for you, and sprinklers water the 4 tiles around them each morning.
- Tools cost energy, and Honey Loaves from the bakery restore it.

## Layout

```
index.html, style.css      page shell, cozy DOM theme (Fredoka + Nunito)
src/main.js                boot, input bindings, window.__game debug/test hooks
src/engine/                vendored from Clockwork Carnage (SVG raster cache, sprite blitter, loop, input, save…)
src/game/config.js         tuning constants
src/game/state.js          save state shape, createSave("luna_save", 1)
src/game/game.js           runtime: levels, actors, clock, transitions, sleep/day rollover, save/load
src/game/actions.js        tool use, E interactions, gifts/talk, mounting
src/game/build.js          build mode: ghost, place/move/remove, fence masks
src/game/fishing.js        cast → bite → timing-bar fishing stub
src/game/render.js         frame composition, y-sort, day/night grade, glows, build ghost
src/game/rules/            pure rules (tested): clock, crops, inventory, shipping, relationships, structures, weather, dialogue, day
src/game/data/             items, crops, structures, villagers, dialogue, forage tables
src/game/art/              cozy-kit (ink/cel primitives), person, animals, crops, props, icons, sprite registry
src/game/world/            map layout, levels/collision, ground baking, camera, lighting, weather/fx, pathfinding
src/game/actors/           player, pet, horse, villagers, chickens
src/game/ui/               canvas HUD, DOM panels (dialogue, shop, build, journal, pause, summary), title + creator
tests/unit/                vitest suites for the rules
```

## Art pipeline

Each sprite is `{ box, layers: [{ markup, anim? }] }` in art units (1 tile = 32 units). `src/engine/sprite.js` rasterises each layer once for every half-octave size bucket, then blits it after that. Motion such as sway, bob and float is applied as a canvas transform, so a sprite never needs to be re-rasterised to animate.

`src/game/art/cozy-kit.js` provides `part()`, which draws a shape in its shadow tone and then draws the base tone on top, shifted up and to the left and clipped to the shape. That leaves a lower-right shadow crescent. A dilate filter (`#ol`) adds the chunkier outer contour.

People and pets are built from their creator parameters and cached under a hash of those parameters (`lookKey`). The ground is painted with Canvas2D into 16×16-tile chunk canvases for each season. Only the water shimmer is drawn live.

## Debug hooks

`window.__game` exposes the runtime (`g`, `state`) and helpers for scripted checks: `newGame`, `teleport(tx, ty, level, dir)`, `select`, `give`, `use`, `interact`, `mount`, `setTime`, `setSeason`, `setWeather`, `sleep`, `save`, `openBuild`, `place`, `hover`, `query`.
