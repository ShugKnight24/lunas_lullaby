/**
 * Structure placement. `q` answers questions about the level so this stays
 * pure: `q.buildable(x, y)` (inside the farm, walkable ground), `q.blocked(x, y)`
 * (an object is there), `q.tilled(x, y)`.
 */

export function footprint(def, tx, ty) {
  const out = [];
  for (let y = 0; y < def.h; y++) for (let x = 0; x < def.w; x++) out.push([tx + x, ty + y]);
  return out;
}

export function canPlace(def, tx, ty, q) {
  for (const [x, y] of footprint(def, tx, ty)) {
    if (!q.buildable(x, y) || q.blocked(x, y)) return false;
    if (q.tilled(x, y) && !def.onSoil) return false;
  }
  return true;
}

/** Tiles a sprinkler at (tx, ty) waters: the four neighbours. */
export const sprinklerTiles = (tx, ty) => [[tx, ty - 1], [tx + 1, ty], [tx, ty + 1], [tx - 1, ty]];

/**
 * What a structure really costs at a Building level: materials shrink 3% a
 * level (a quarter more for a Carpenter), never below 1; from `diyLevel` the
 * gold fee is waived because you build it yourself.
 */
export function buildCost(cost, level = 0, { carpenter = false, diyLevel = 6 } = {}) {
  const k = (1 - level * 0.03) * (carpenter ? 0.75 : 1);
  const out = {};
  for (const id in cost) {
    if (id === "gold") {
      if (level < diyLevel) out.gold = cost.gold;
    } else out[id] = Math.max(1, Math.ceil(cost[id] * k));
  }
  return out;
}

/** Can the wallet `{ gold, wood, stone }` pay `cost`? */
export function affordable(cost, wallet) {
  for (const k in cost) if ((wallet[k] ?? 0) < cost[k]) return false;
  return true;
}

/** Half of the materials come back when a structure is removed. */
export function refund(cost) {
  const out = {};
  for (const k in cost) if (k !== "gold") out[k] = Math.floor(cost[k] / 2);
  return out;
}
