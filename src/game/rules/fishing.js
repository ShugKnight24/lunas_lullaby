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

/** Reel bar tuning: marker speed, green zone width (+ skill `zone` bonus) and the bite reaction window (s). */
export const barParams = (diff, zone = 0) => ({ vel: 0.9 + diff * 1.5, zoneW: 0.26 - diff * 0.14 + zone, bite: 0.9 - diff * 0.35 });

/** Gold and silver bands as fractions of the zone's half-width; a Lucky Lure widens them. */
export const qualityBands = (lucky = false) => (lucky ? [0.35, 0.7] : [0.2, 0.5]);

/**
 * Where the marker stopped relative to the zone: null (missed), or a quality
 * — gold in the middle band, silver in the next, else normal.
 */
export function catchQuality(pos, zone, zoneW, lucky = false) {
  if (pos < zone || pos > zone + zoneW) return null;
  const off = Math.abs(pos - (zone + zoneW / 2)) / (zoneW / 2);
  const [gold, silver] = qualityBands(lucky);
  return off <= gold ? 2 : off <= silver ? 1 : 0;
}

/** Record a catch: log is `{ [id]: { n, best } }` (best = highest quality). */
export function logCatch(log, id, q) {
  const cur = log[id] ?? { n: 0, best: 0 };
  return { ...log, [id]: { n: cur.n + 1, best: Math.max(cur.best, q) } };
}
