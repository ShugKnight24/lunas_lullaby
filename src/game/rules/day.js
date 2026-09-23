/**
 * End-of-day rollover on a plain save state: ship the bin, grow crops,
 * advance the calendar, wither out-of-season crops, roll weather, water by
 * rain and sprinklers, respawn forage and restore energy. Pure: returns a
 * new state plus a report for the summary card.
 */

import { MAX_ENERGY } from "../config.js";
import { settle } from "./shipping.js";
import { grow, seasonChange, morning } from "./crops.js";
import { nextDay, dayIndex } from "./clock.js";
import { rollWeather } from "./weather.js";
import { sprinklerTiles } from "./structures.js";

/** Tile indices watered this morning by sprinklers. */
export function sprinklerCoverage(structures, w) {
  const wet = new Set();
  for (const s of structures) {
    if (s.kind !== "sprinkler") continue;
    for (const [x, y] of sprinklerTiles(s.tx, s.ty)) wet.add(y * w + x);
  }
  return wet;
}

function hash(a, b) {
  let n = Math.imul(a * 73856093 ^ b * 19349663, 0x9e3779b1);
  n ^= n >>> 15;
  return (n >>> 0) / 4294967296;
}

/**
 * Respawn empty forage spots whose timer ran out. `spots` is
 * `[{ id, rare }]`; `forage` maps spot id → `{ item, next }`.
 */
export function respawnForage(forage, spots, day, season, table, rareTable) {
  const out = { ...forage };
  for (const sp of spots) {
    const cur = out[sp.id];
    if (cur && (cur.item || cur.next > day)) continue;
    const list = (sp.rare ? rareTable : table)[season];
    out[sp.id] = { item: list.length ? list[Math.floor(hash(sp.id, day) * list.length)] : null, next: day };
  }
  return out;
}

/**
 * @param {object} s save state
 * @param {{ crops, items, w, spots, forage, rareForage, passedOut? }} o
 */
export function endDay(s, o) {
  const { total, lines } = settle(s.bin, o.items);
  let gold = s.gold + total;
  const { clock, seasonChanged } = nextDay(s.clock);
  const weather = rollWeather(dayIndex(clock), clock.season, s.seed);
  const wet = sprinklerCoverage(s.structures, o.w);
  const soil = {};
  let withered = 0;
  for (const k in s.soil) {
    let t = s.soil[k];
    const def = t.crop && o.crops[t.crop.id];
    if (def) t = grow(t, def);
    if (def && seasonChanged) {
      const was = t.crop.dead;
      t = seasonChange(t, def, clock.season);
      if (!was && t.crop.dead) withered++;
    }
    soil[k] = morning(t, weather === "rain" || wet.has(+k));
  }
  let penalty = 0;
  if (o.passedOut) {
    penalty = Math.min(1000, Math.floor(gold * 0.1));
    gold -= penalty;
  }
  const forage = respawnForage(s.forage, o.spots, dayIndex(clock), clock.season, o.forage, o.rareForage);
  return {
    state: {
      ...s,
      gold,
      clock,
      weather,
      soil,
      forage,
      bin: [],
      energy: o.passedOut ? Math.floor(MAX_ENERGY / 2) : MAX_ENERGY,
    },
    report: { total, lines, seasonChanged, withered, weather, penalty, passedOut: !!o.passedOut },
  };
}
