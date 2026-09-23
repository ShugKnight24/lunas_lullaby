# Roadmap

Where the game stands and what to build next. Phases are ordered so each one
ships something playable and later phases build on earlier ones.

## Current state (v0.1)

Working end to end: character creator, farm/town/forest map with interiors,
clock and day rollover, till/plant/water/harvest for 6 crops, regrowing crops,
seasons with wither, weather (rain waters crops), sprinklers, shipping bin and
day summary, foraging, 3 villagers with talk/gifts/hearts, seed shop and
bakery, build mode (fence, path, scarecrow, sprinkler, coop, well), horse and
pet, autosave on sleep. 25 unit tests on the pure rules.

Thin or missing:

| Area | Gap |
| --- | --- |
| Animals | ~~No eggs~~ done: feed, eggs, named hens with affection and egg quality. Still no barn |
| Fishing | ~~Stub~~ done: 12 fish by water/season/hour/weather, difficulty, quality, log |
| Social | 3 villagers; heart events are a single 2-heart stub; schedules are by hour only (no day/weather variation) |
| Winter | ~~No winter crops~~ Moonbloom grows in winter; winter fish. Still no festival |
| Progression | Skills (5, incl. Building), professions, crafting, machines, fence styles/paint done. No tool upgrades or long-term goal yet |
| Audio | None |
| Saves | ~~No migrations~~ done: v2 with a migration chain and a frozen v1 fixture |
| Tests | ~~Rules only~~ done: Playwright day-loop, coop, fishing, onboarding and well specs |
| Onboarding | ~~None~~ done: intro letter + Mira's welcome, 8-step first-day task card with world arrows |
| HUD | ~~Minimal~~ done: Bag/Journal/Menu buttons, bin payout chip, energy number, clickable hotbar, phone-width layout |

## Phase 0: foundations ✅

Also fixed along the way: sprinklers never watered in the real game (`sprinklerCoverage`
read `kind`, while saved structures use `type`), and the shop showed "Restores
undefined energy" for non-food items.

- **Save migrations.** Give `createSave` a real migration chain and a test that
  loads a v1 fixture. Every later phase adds state, so this pays for itself immediately.
- **E2E smoke test.** Playwright is already a dependency. Add one spec that
  drives `window.__game`: new game → till → plant → water → sleep → dismiss
  summary → assert `crop.days === 1`. Run it with `npm run test:e2e`.
- **Debug hook fix.** `__game.select` takes a slot index; add
  `selectItem(id)` so scripts don't depend on hotbar order.

## Phase 1: finish the core loop

1. **Animal care.** ✅ Coops take hay or fiber; named hens are petted daily
   and their affection sets egg quality (`rules/animals.js`). Next: a Barn
   (cow → milk) and hay from cutting grass once a silo exists.
2. **Fishing v2.** ✅ 12 fish keyed by water (river, pond, hidden pool) ×
   season × hour × weather (`data/fish.js`, `rules/fishing.js`). Difficulty
   sets the bar; stopping near the middle gives silver/gold; journal log.
3. **Winter content.** ✅ Moonbloom (winter-only crop) and winter fish. Next:
   a winter festival hook.
4. **Quality.** ✅ Normal/silver/gold stacks (`rules/quality.js`) for crops
   (fertilizer + never-dry bonus), fish and eggs. Farming skill feeds in
   once Phase 2.1 lands.

## Phase 2: progression

1. **Skills.** ✅ Farming, foraging, fishing and ranching XP, levels 0–10;
   each level trims tool energy, plus one perk per skill (`rules/skills.js`).
   Next: recipe unlocks at levels 3/6/9 once crafting exists.
2. **Crafting.** ✅ Recipe table + Craft tab with skill unlocks; Preserves Jar
   and Mayo Machine as placeable machines (`rules/crafting.js`,
   `rules/machines.js`); level-5 professions. Next: chests, sprinkler tiers.
3. **Cooking.** Kitchen upgrade to the farmhouse; recipes from villagers at
   heart milestones; buff foods.
4. **Tool upgrades.** Copper/iron/gold tiers at a blacksmith: larger area
   hoe/can, fewer axe hits. Needs ore, see Phase 3.
5. **Long-term goal.** Something like a Community Center: a "Lullaby Board"
   of bundles that restore parts of the town and unlock areas. This gives the
   game its spine.

## Phase 3: world and people

1. **Villager schedules.** ✅ Rain and weekday routines (`rules/schedule.js`),
   a fourth villager (Bram), heart events at 2 and 5 hearts.
2. **More villagers.** Grow from 3 to about 8, each with gift tastes, 2/4/6/8-heart
   events, and birthdays. Author dialogue as data (consider Ink or Yarn if
   the branching gets deep).
3. **Festivals.** One per season, as a special level state with its own mini-game.
4. **Mine.** Procedural floors (seeded RNG is already in `engine/`) with ore,
   gems, and light combat or puzzles, which feed tool upgrades.
5. **Marriage/partner** once heart events reach 10.

## Phase 4: polish

- **Audio.** Web Audio with no asset files, which fits the code-generated art:
  procedural ambient music per season/time, footstep/tool/harvest SFX, and
  rain ambience. Add a mixer with a music/SFX split in the pause menu.
- **Game feel.** Harvest pop, tool hit-stop, crop wiggle on water, and eased HUD numbers.
- **Accessibility and input.** Gamepad support, rebinding, a text-size option,
  and a slower-clock option.
- **Multiple save slots and export/import.**
- **Performance.** Budget check on low device tiers (`engine/device-tier.js`)
  once schedules and more actors land.

## Suggested next three tasks

1. Audio (Phase 4): procedural ambient music and tool SFX — the game is
   silent, and it's the biggest remaining feel gap
