/**
 * Item quality: 0 normal, 1 silver, 2 gold. Stacks carry it as `q` (omitted
 * when 0) and it multiplies the sell price. Rolls take `r` in [0, 1) so the
 * rules stay deterministic under test.
 */

export const QUALITY = [
  { name: "", mult: 1, color: null },
  { name: "Silver", mult: 1.25, color: "#c8d4e0" },
  { name: "Gold", mult: 1.5, color: "#f6c63c" },
];

export const sellPrice = (sell, q = 0) => Math.round(sell * QUALITY[q].mult);

export const qualityName = (name, q = 0) => (q ? `${QUALITY[q].name} ${name}` : name);

/** Pick a quality from `[silverChance, goldChance]`. */
export function rollQuality([silver, gold], r) {
  if (r < gold) return 2;
  if (r < gold + silver) return 1;
  return 0;
}

/**
 * Harvest odds from fertilizer tier (0 none, 1 basic, 2 deluxe) and whether
 * the crop was watered every day it grew.
 */
export function cropOdds(fert = 0, tended = false) {
  const silver = [0.12, 0.3, 0.45][fert];
  const gold = [0.03, 0.1, 0.25][fert] + (tended ? 0.05 : 0);
  return [silver, gold];
}

/** Egg odds from a hen's affection (0..HEN_LOVE_MAX). */
export function eggOdds(love, max) {
  const k = love / max;
  return [0.6 * k, 0.35 * k * k];
}
