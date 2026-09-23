/**
 * Crafting against a bag (slot array, mutated in place like rules/inventory).
 * `levels` maps skill id → level, for recipe unlocks.
 */

import { addItem, countItem, removeItem } from "./inventory.js";

export const unlocked = (recipe, levels) => !recipe.skill || levels[recipe.skill[0]] >= recipe.skill[1];

/** Ingredients still missing: `[{ id, have, need }]` (empty when craftable). */
export function missing(recipe, inv) {
  const out = [];
  for (const id in recipe.in) {
    const have = countItem(inv, id);
    if (have < recipe.in[id]) out.push({ id, have, need: recipe.in[id] });
  }
  return out;
}

/**
 * Craft once: `{ ok: true }`, or `{ error }` with nothing changed. Checks the
 * product fits before taking anything.
 */
export function craft(recipe, inv, levels) {
  if (!unlocked(recipe, levels)) return { error: "You haven't learned that yet." };
  if (missing(recipe, inv).length) return { error: "You're missing ingredients." };
  const trial = inv.map((s) => s && { ...s });
  for (const id in recipe.in) removeItem(trial, id, recipe.in[id]);
  if (addItem(trial, recipe.out[0], recipe.out[1]) > 0) return { error: "Your bag is full!" };
  for (let i = 0; i < inv.length; i++) inv[i] = trial[i];
  return { ok: true };
}
