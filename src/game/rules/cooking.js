/**
 * Cooking and buffs. Pure: `cook` works on a copy of the bag and only
 * commits when the dish fits; `activeBuff` reads today's buff from the save.
 */

import { addItem } from "./inventory.js";

/** Bag slots that can pay for ingredient `key` ("egg", or "kind:fish"), cheapest first. */
function sources(inv, items, key) {
  const kind = key.startsWith("kind:") ? key.slice(5) : null;
  return inv
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s && (kind ? items[s.id]?.kind === kind : s.id === key))
    .sort((a, b) => (items[a.s.id].sell ?? 0) - (items[b.s.id].sell ?? 0) || (a.s.q ?? 0) - (b.s.q ?? 0));
}

export const have = (inv, items, key) => sources(inv, items, key).reduce((a, { s }) => a + s.n, 0);

/** Ingredients you're short of: `[{ key, have, need }]`. */
export function shortOf(recipe, inv, items) {
  return Object.entries(recipe.in)
    .map(([key, need]) => ({ key, have: have(inv, items, key), need }))
    .filter((x) => x.have < x.need);
}

/** Cook `recipe`: mutates `inv` on success. Returns `{ ok }` or `{ error }`. */
export function cook(recipe, inv, items) {
  if (shortOf(recipe, inv, items).length) return { error: "You're missing ingredients." };
  const trial = inv.map((s) => s && { ...s });
  for (const [key, need] of Object.entries(recipe.in)) {
    let n = need;
    for (const { i } of sources(trial, items, key)) {
      const k = Math.min(n, trial[i].n);
      trial[i].n -= k;
      n -= k;
      if (!trial[i].n) trial[i] = null;
      if (!n) break;
    }
  }
  if (addItem(trial, recipe.out, 1) > 0) return { error: "Your bag is full!" };
  for (let i = 0; i < inv.length; i++) inv[i] = trial[i];
  return { ok: true };
}

/** Today's buff definition, or null. `s.buff` is `{ id, day }`. */
export const activeBuff = (s, day, buffs) => (s.buff && s.buff.day === day ? buffs[s.buff.id] ?? null : null);
