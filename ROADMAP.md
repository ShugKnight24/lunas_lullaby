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
| Animals | ~~No eggs~~ done: feed + eggs. Still no per-hen friendship, egg quality, or barn |
| Fishing | Stub: 3 fish, one timing bar, no location/season/time tables |
| Social | 3 villagers; heart events are a single 2-heart stub; schedules are by hour only (no day/weather variation) |
| Winter | No winter crops, so the season has nothing to do |
| Progression | No tool upgrades, crafting, cooking, or a long-term goal |
| Audio | None |
| Saves | ~~No migrations~~ done: v2 with a migration chain and a frozen v1 fixture |
| Tests | ~~Rules only~~ done: Playwright day-loop and coop specs |

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

1. **Animal care.** ✅ Coops take hay or fiber and hens lay eggs daily
   (`rules/animals.js`). Next: petting and friendship per hen, egg quality,
   a Barn (cow → milk), and hay from cutting grass once a silo exists.
2. **Fishing v2.** Fish table keyed by location (pond/river/sea) × season ×
   time × weather, rarity-weighted. Difficulty maps to bar speed and zone
   size. Add a fishing log to the journal.
3. **Winter content.** Winter forage is already in; add winter seeds
   (greenhouse-only or a hardy crop), ice fishing, and a winter festival hook.
4. **Crop quality.** Normal/silver/gold, driven by fertilizer and a farming
   skill. Sell multipliers flow through `rules/shipping.js`.

## Phase 2: progression

1. **Skills.** Farming, foraging, fishing, and ranching XP with level-up
   perks (energy discount, quality chance, recipes unlocked).
2. **Crafting.** A recipe table plus a craft panel: sprinkler tiers, fertilizer,
   bait, chests, and preserves jars/kegs (artisan goods, which Harvest Moon and
   Stardew both use as the mid-game money curve).
3. **Cooking.** Kitchen upgrade to the farmhouse; recipes from villagers at
   heart milestones; buff foods.
4. **Tool upgrades.** Copper/iron/gold tiers at a blacksmith: larger area
   hoe/can, fewer axe hits. Needs ore, see Phase 3.
5. **Long-term goal.** Something like a Community Center: a "Lullaby Board"
   of bundles that restore parts of the town and unlock areas. This gives the
   game its spine.

## Phase 3: world and people

1. **Villager schedules.** Hourly waypoints already exist. Add weekday and
   weather variants (rainy days indoors, a market day) on top of
   `world/path.js`. This is the biggest liveliness win.
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

1. Fishing v2 (Phase 1.2): fish tables by location, season, time and weather
2. Crop quality (Phase 1.4), which unlocks meaningful fertilizer and skills later
3. Hen friendship and egg quality (rest of Phase 1.1)
