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
