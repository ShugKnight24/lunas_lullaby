# Luna's Lullaby

A cozy farming and life sim for the browser. You grow crops, build up your farm, make friends in town, and ride your horse around with your pet. Everything you see is SVG generated in code at runtime and rasterised to cached bitmaps. The only image files are the favicon and app icons, and those are exported from the same code (see Branding). The drawing uses a warm plum ink with soft cel shading.

## Run

```sh
npm install
npm run dev      # http://localhost:3200
npm test         # vitest: tests/unit/**/*.test.js
npm run test:e2e # playwright: tests/e2e (starts the dev server if needed)
npm run build    # production bundle in dist/
```

If Playwright's bundled browser isn't installed, point `CHROME_PATH` at a local Chrome for `test:e2e` and `shot`. Headless screenshot of the running dev server: `node scripts/shot.mjs http://localhost:3200/ shots/x.png 2000`.

## Branding

The logo (Luna asleep in a crescent-moon cradle, plus a sticker wordmark) lives in `src/game/art/brand.js`, and the title screen draws it from there. The letters are Fredoka Bold outlines baked into `src/game/art/brand-glyphs.js` by `node scripts/brand-glyphs.mjs`, so no font is needed to render them. `npm run brand` exports the lockups to `public/brand/`, the favicon (`public/favicon.svg`, `public/favicon.ico`), the app icons and `site.webmanifest`, plus a contact sheet at `branding/sheet.html`. It uses Playwright's Chromium, or `CHROME_PATH`.

## CI and deploy

GitHub Actions runs the unit tests, the build and the Playwright specs on every pull request and on `master` (`.github/workflows/ci.yml`). The game is hosted on Vercel through its GitHub integration: `master` deploys to production and every pull request gets a preview URL. Build settings are pinned in `vercel.json` (Vite, `npm run build`, output `dist/`, long-lived caching for hashed assets).

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | Walk (or ride) |
| Space / left click | Use the selected tool or seeds toward the tile you face (with an empty hand, swing your weapon). In the Wildwood it swings unless what you hold has work right there (an axe at ore, food, a salve). Use gear to put it on, the Squeaky Ball to throw it |
| Q | Swing your equipped weapon at any time; press again mid-swing to chain slash → backslash → thrust; hold, then release when it sparkles, for a spin |
| C | Gear and stats: equip and remove gear, spend stat points |
| E / right click | Talk, give a gift, pet, ride, ship, harvest, forage, sleep, shop, build |
| F | Mount / dismount the horse |
| B | Hop on / off the bicycle (outdoors) |
| M | Mute / unmute (volumes are in the pause menu) |
| N | Show / hide the minimap |
| Shift | Sprint |
| 1–9 / mouse wheel | Choose hotbar slot |
| J · R · I (Tab) · K | Journal (opens on the Diary) · Friends · Bag · Craft |
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

## The Wildwood, the town and Sunridge

- **The Wildwood.** The arch at the top of the forest clearing (north of town) leads into an old forest with four zones: the Mossy Edge, the Bramble Thicket, Wisp Hollow and the Moon Shrine. Bramble Slimes hop and lunge, Thornback boars charge in straight lines (and are stunned when they hit a tree), Shroomlings puff spore clouds, and Gloom Wisps keep their distance and throw orbs. Creatures come back slowly while you're there; there are more at night. Chests (refilled weekly), ore stones (amber, iron, moonstone; break them with the axe), silverleaf and dark ironwood trees reward exploring.
- **Combat.** Top-down action in the old Zelda style: a three-hit combo (slash, backslash, then a longer, harder thrust) with a small step into each swing, a charged spin, and a visible sword and smear. Hits flash creatures white and squash them, with impact stars, knockback, hit-stop, screen shake and popping damage numbers; you can still move slowly mid-swing. A Thornback about to charge paints its lane red on the ground. Health shows as hearts (10 each), with your weapon beside them, and grows with the Combat skill, Vigor, gear and your Adventurer rank. Food heals you as well as restoring energy, and sleeping heals fully. If you run out of health, Hazel carries you home: you lose 10% of your gold (500 at most) and two hours.
- **The journal** (J) is a leather-bound book with coloured chapter tabs down its edge: Diary, Quests, Friends, Bag, Craft, your companion, Skills, Careers, Fish, Wishes and Farm. Each chapter opens on a hand-written title page. The **Diary** writes itself as you play (quests taken and finished, places found, first catches and harvests, friends met, level-ups, the boss) and you can add your own note to any day.
- **Gear and stats** (C): what you wear shows on your character: helmets and hoods replace your hat, armour covers your top, boots swap your shoes, and your sword rides on your back until you swing it. five slots, Weapon, Head, Body, Feet and Charm. Gear comes off the bag when you wear it and goes back when you take it off, and the list compares every spare piece against what you're wearing. Better pieces need a Combat level. Hazel sells the basics; the rest is crafted from Wildwood loot (tusks, gel, wisp essence, ore, ironwood; Craft tab), found in rare chests, dropped now and then, or given as quest rewards. Each Combat level gives 2 stat points for Vigor (+8 health), Might (+1.5 attack), Guard (+1 defence) or Agility (+2% speed, +1% crit). Defence shaves every hit, never below 1.
- **Your companion fights too.** They run at whatever is near you and bite, gain levels (Sniff at 3 barks near treasure, Guard Howl at 5 stuns creatures when you're hurt, Fetch at 8 pulls loot from further away), take damage, and get hungry overnight. A hungry or hurt companion won't fight: hold food or a Companion Treat and press E by them.
- **Quests.** Hazel, the Warden (new Warden's Lodge east of Theo's), gives the Wildwood story: five quests ending at the Moon Shrine with the Gloomroot, a boss that erupts roots under you, throws orb volleys and summons slimes. Mira, Theo, Bram, Dale and Willow have side quests, and the notice board in the plaza posts three fresh jobs every morning. Journal → Quests tracks everything; the card at the top left shows the current goal.
- **A bigger town.** Pip's General Store (south of the plaza) sells salves, treats, jerky and the Farm Stand, and buys almost anything on the spot. Two cottages and market stalls fill out the square.
- **Sunridge.** The meadow road south of town runs to two working farms: Dale's Hawthorn Ranch (barn, silo, a pasture of cows and sheep; he sells milk, cheese and wool) and Willow's orchard and beehives (apples and honey from her stall).
- **Careers** (Journal → Careers): Farmer, Adventurer, Merchant, Angler and Rancher, each with five ranks measured from how you play and a perk per rank. Merchants run a **Farm Stand**: place it on the farm, stock it with E, and villagers buy up to a nightly cap at a markup that grows with your rank.

## Things to do besides farming

- **Fetch.** New games start with a Squeaky Ball (Pip sells more). Hold it and press Space; your companion runs it back. It cheers them up (a few times a day) and gives them a little XP.
- **Races.** The checkered flag by the stable starts the Hollow Loop: six gates through town and the meadow and back, on foot, by bike or on your horse. Bronze, silver and gold par times each pay once, and your best time is kept.
- **Cooking.** Press E at the farmhouse hearth. Seven dishes from farm, ranch, orchard and Wildwood ingredients each give a buff for the rest of the day: half-energy tools, +attack, a wider fishing zone, +speed, +defence and health, energy that trickles back, or faster friendships.
- **Starter quests** point you at the skills: Mira (Seeds of Something: harvest five crops), Theo (A Proper Fence: build six things from his board, lumber included) and Juniper (Three Quiet Casts). Journal → Skills says how every skill is trained.

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
src/game/combat.js         swings, creature populations, projectiles, the boss, companion fighting, drops, faint
src/game/quests.js         quest offers and turn-ins in conversation, the notice board
src/game/render.js         frame composition, y-sort, day/night grade, glows, build ghost
src/game/rules/            pure rules (tested): clock, crops, inventory, shipping, quality, fishing, skills, tutorial, relationships, structures, animals, weather, dialogue, day
src/game/data/             items, crops, fish, structures, villagers, dialogue (incl. intro), tutorial, forage tables
src/game/art/              cozy-kit (ink/cel primitives), person, animals, crops, props, icons, sprite registry
src/game/world/            map layout (plus wildwood.js, sunridge.js), levels/collision, ground baking, camera, lighting, weather/fx, pathfinding
src/game/actors/           player, pet, horse, villagers, chickens, enemies (Wildwood AI), herd (Sunridge animals)
src/game/ui/               canvas HUD, DOM panels (dialogue, build, journal, pause, summary), rpg-panels (shops, board, stand, quests, careers), title + creator
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

`window.__game` exposes the runtime (`g`, `state`) and helpers for scripted checks: `newGame(profile, { intro: false })`, `teleport(tx, ty, level, dir)`, `select` (slot index), `selectItem(id)`, `give`, `use`, `interact`, `mount`, `setTime`, `setSeason`, `setWeather`, `sleep`, `save`, `openBuild`, `place`, `hover`, `query`, `step(frames)` (run the simulation synchronously), `spawn(type, tx, ty)` and `clearEnemies()`.
