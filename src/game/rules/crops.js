/**
 * Soil and crop rules on plain tile records `{ watered, crop, fert? }` where
 * `crop = { id, days, dead, missed? }` (missed counts dry days while growing)
 * and `fert` is the fertilizer tier worked into the soil. Every function
 * returns a new tile (or a result object) and never mutates its input.
 */

import { SEASONS } from "../config.js";
import { rollQuality, cropOdds } from "./quality.js";

const inSeason = (def, season) => def.seasons.includes(SEASONS[season]);

export const emptySoil = () => ({ watered: false, crop: null });

export const totalDays = (def) => def.stages.reduce((a, b) => a + b, 0);

/** Growth stage 0..stages.length; the last value means ripe. */
export function cropStage(crop, def) {
  let d = crop.days;
  for (let i = 0; i < def.stages.length; i++) {
    if (d < def.stages[i]) return i;
    d -= def.stages[i];
  }
  return def.stages.length;
}

/** Visual stage 0 seed, 1 sprout, 2 young, 3 grown, 4 ripe. */
export function visualStage(crop, def) {
  const s = cropStage(crop, def);
  const n = def.stages.length;
  return s >= n ? 4 : Math.min(3, Math.floor((s * 4) / n));
}

export const isRipe = (crop, def) => !crop.dead && crop.days >= totalDays(def);

/** Plant seeds of `def` into tilled soil; returns `{ tile }` or `{ error }`. */
export function plant(tile, def, id, season) {
  if (!tile) return { error: "Till the soil first." };
  if (tile.crop) return { error: "Something is already growing here." };
  if (!inSeason(def, season)) return { error: "These seeds won't grow this season." };
  return { tile: { ...tile, crop: { id, days: 0, dead: false } } };
}

export const water = (tile) => (tile.watered ? tile : { ...tile, watered: true });

/** Overnight growth: watered, living crops advance one day; dry ones remember it. */
export function grow(tile, def) {
  if (!tile.crop || tile.crop.dead) return tile;
  const max = totalDays(def);
  if (tile.crop.days >= max) return tile;
  if (!tile.watered) return { ...tile, crop: { ...tile.crop, missed: (tile.crop.missed ?? 0) + 1 } };
  return { ...tile, crop: { ...tile.crop, days: tile.crop.days + 1 } };
}

/** Work fertilizer of `tier` into tilled soil, before the seeds sprout. */
export function fertilize(tile, tier) {
  if (!tile) return { error: "Till the soil first." };
  if (tile.crop && tile.crop.days > 0) return { error: "Too late — fertilize before the seeds sprout." };
  if ((tile.fert ?? 0) >= tier) return { error: "This soil is already fertilized." };
  return { tile: { ...tile, fert: tier } };
}

/** Morning reset: soil dries unless rain or a sprinkler waters it. */
export const morning = (tile, wet) => (tile.watered === wet ? tile : { ...tile, watered: wet });

/** Crops that cannot live in the new season wither. */
export function seasonChange(tile, def, season) {
  if (!tile.crop || tile.crop.dead || inSeason(def, season)) return tile;
  return { ...tile, crop: { ...tile.crop, dead: true } };
}

/**
 * Harvest a ripe crop: `{ tile, item, qty, q }` or null when not ripe. `r`
 * rolls the quality from the soil's fertilizer, whether it never went dry
 * and the farming skill `bonus`.
 */
export function harvest(tile, def, r = 1, bonus = [0, 0]) {
  if (!tile.crop || !isRipe(tile.crop, def)) return null;
  const q = rollQuality(cropOdds(tile.fert ?? 0, !tile.crop.missed, bonus), r);
  const crop = def.regrow ? { id: tile.crop.id, days: totalDays(def) - def.regrow, dead: false } : null;
  return { tile: { ...tile, crop }, item: def.produce, qty: def.yield, q };
}

/** Clear a dead crop with the scythe or hoe. */
export const clearDead = (tile) => (tile.crop?.dead ? { ...tile, crop: null } : tile);
