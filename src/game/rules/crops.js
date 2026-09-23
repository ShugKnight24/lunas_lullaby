/**
 * Soil and crop rules on plain tile records `{ watered, crop }` where
 * `crop = { id, days, dead }`. Every function returns a new tile (or a
 * result object) and never mutates its input.
 */

import { SEASONS } from "../config.js";

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

/** Overnight growth: watered, living crops advance one day. */
export function grow(tile, def) {
  if (!tile.crop || tile.crop.dead || !tile.watered) return tile;
  const max = totalDays(def);
  if (tile.crop.days >= max) return tile;
  return { ...tile, crop: { ...tile.crop, days: tile.crop.days + 1 } };
}

/** Morning reset: soil dries unless rain or a sprinkler waters it. */
export const morning = (tile, wet) => (tile.watered === wet ? tile : { ...tile, watered: wet });

/** Crops that cannot live in the new season wither. */
export function seasonChange(tile, def, season) {
  if (!tile.crop || tile.crop.dead || inSeason(def, season)) return tile;
  return { ...tile, crop: { ...tile.crop, dead: true } };
}

/** Harvest a ripe crop: `{ tile, item, qty }` or null when not ripe. */
export function harvest(tile, def) {
  if (!tile.crop || !isRipe(tile.crop, def)) return null;
  const crop = def.regrow ? { ...tile.crop, days: totalDays(def) - def.regrow } : null;
  return { tile: { ...tile, crop }, item: def.produce, qty: def.yield };
}

/** Clear a dead crop with the scythe or hoe. */
export const clearDead = (tile) => (tile.crop?.dead ? { ...tile, crop: null } : tile);
