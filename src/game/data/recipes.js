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
];
