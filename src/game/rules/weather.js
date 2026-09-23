/** Deterministic daily weather from the day index. */

const RAIN_CHANCE = [0.25, 0.15, 0.25, 0.3];

function hash(n) {
  n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  n ^= n >>> 13;
  n = Math.imul(n, 0xc2b2ae35);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

/** "sun" | "rain" | "snow". Day 1 of each season is always sunny. */
export function rollWeather(day, season, seed = 0) {
  if (day % 28 === 0) return "sun";
  if (hash(day * 31 + seed) >= RAIN_CHANCE[season]) return "sun";
  return season === 3 ? "snow" : "rain";
}
