/**
 * Fishing rules: which fish bite where and when, how hard the reel bar is,
 * catch quality and the fishing log. Rolls take `r` in [0, 1).
 */

import { SEASONS } from "../config.js";

/** Fish that can bite for `{ where, season, min, weather }`, as `[{ id, weight }]`. */
export function fishPool(table, { where, season, min, weather }) {
  const out = [];
  for (const id in table) {
    const f = table[id];
    if (!f.where.includes(where)) continue;
    if (f.seasons.length && !f.seasons.includes(SEASONS[season])) continue;
    if (min < f.hours[0] || min >= f.hours[1]) continue;
    if (f.weather === "rain" && weather !== "rain") continue;
    if (f.weather === "sun" && weather !== "sun") continue;
    out.push({ id, weight: f.weight });
  }
  return out;
}

export function pickFish(pool, r) {
  let total = 0;
  for (const f of pool) total += f.weight;
  let x = r * total;
  for (const f of pool) if ((x -= f.weight) < 0) return f.id;
  return pool.length ? pool[pool.length - 1].id : null;
}

/** Reel bar tuning: marker speed, green zone width and the bite reaction window (s). */
export const barParams = (diff) => ({ vel: 0.9 + diff * 1.5, zoneW: 0.26 - diff * 0.14, bite: 0.9 - diff * 0.35 });

/**
 * Where the marker stopped relative to the zone: null (missed), or a quality
 * — gold for the middle fifth, silver for the middle half, else normal.
 */
export function catchQuality(pos, zone, zoneW) {
  if (pos < zone || pos > zone + zoneW) return null;
  const off = Math.abs(pos - (zone + zoneW / 2)) / (zoneW / 2);
  return off <= 0.2 ? 2 : off <= 0.5 ? 1 : 0;
}

/** Record a catch: log is `{ [id]: { n, best } }` (best = highest quality). */
export function logCatch(log, id, q) {
  const cur = log[id] ?? { n: 0, best: 0 };
  return { ...log, [id]: { n: cur.n + 1, best: Math.max(cur.best, q) } };
}
