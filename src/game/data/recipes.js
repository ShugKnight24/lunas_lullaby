/**
 * Crafting recipes, in the order the Craft tab lists them. `out` is
 * `[item, count]`, `in` maps ingredient → count, and `skill` `[id, level]`
 * is when the recipe unlocks (null = known from the start).
 */

export const RECIPES = [
  { out: ["fertilizer", 2], in: { fiber: 3, stone: 1 }, skill: null },
  { out: ["bait", 5], in: { fiber: 2, wood: 1 }, skill: ["fishing", 1] },
  { out: ["egg_sandwich", 1], in: { egg: 1, bread: 1 }, skill: ["ranching", 1] },
  { out: ["mayo_machine", 1], in: { wood: 20, stone: 15, egg: 1 }, skill: ["ranching", 2] },
  { out: ["preserves_jar", 1], in: { wood: 30, stone: 10 }, skill: ["farming", 3] },
  { out: ["bicycle", 1], in: { wood: 20, stone: 25, fiber: 10 }, skill: ["building", 2] },
  { out: ["forager_stew", 1], in: { mushroom: 1, leek: 1 }, skill: ["foraging", 3] },
  { out: ["deluxe_fertilizer", 2], in: { fertilizer: 2, stone: 2, egg: 1 }, skill: ["farming", 4] },
  { out: ["lucky_lure", 1], in: { wood: 5, star_shard: 1 }, skill: ["fishing", 5] },
  // Gear from the Wildwood's loot (Combat unlocks the patterns).
  { out: ["healing_salve", 2], in: { slime_gel: 3, silverleaf: 1 }, skill: ["combat", 1] },
  { out: ["slime_charm", 1], in: { slime_gel: 8, fiber: 4 }, skill: ["combat", 1] },
  { out: ["bronze_sword", 1], in: { iron_ore: 5, amber: 1, wood: 5 }, skill: ["combat", 1] },
  { out: ["thornback_armor", 1], in: { boar_tusk: 4, fiber: 10, iron_ore: 2 }, skill: ["combat", 2] },
  { out: ["tusk_pendant", 1], in: { boar_tusk: 3, amber: 2 }, skill: ["combat", 2] },
  { out: ["iron_helm", 1], in: { iron_ore: 10, stone: 5 }, skill: ["combat", 3] },
  { out: ["swift_boots", 1], in: { wisp_essence: 3, fiber: 8, spore_cap: 2 }, skill: ["combat", 3] },
  { out: ["wisp_lantern", 1], in: { wisp_essence: 4, amber: 2, iron_ore: 2 }, skill: ["combat", 3] },
  { out: ["ironwood_mail", 1], in: { ironwood: 6, iron_ore: 8, fiber: 6 }, skill: ["combat", 5] },
  { out: ["ironwood_blade", 1], in: { ironwood: 4, iron_ore: 6, amber: 2 }, skill: ["combat", 5] },
  { out: ["moon_amulet", 1], in: { gloom_heart: 1, moonstone: 2 }, skill: ["combat", 6] },
];
