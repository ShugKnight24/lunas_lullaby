/**
 * Sunridge: the farmland south of town, down the meadow road. Two working
 * neighbours share it: Hawthorn Ranch (Dale's cattle and sheep) to the west
 * and Willow's orchard and hives to the east, with market fields between.
 * Plain data like map.js; deterministic.
 */

import { SeededRNG } from "../../engine/seeded-rng.js";
import { GR } from "./map.js";

export const SUN_W = 70;
export const SUN_H = 46;

/** The meadow road's south end in town leads here, and back. */
export const SUN_GATE = { world: [[51, 70], [52, 70]], sun: [[35, 0], [36, 0]] };
export const SUN_SPAWN = { tx: 35, ty: 2 };
export const WORLD_FROM_SUN = { tx: 51, ty: 68 };

/** Pasture fence rectangle (animals wander inside). */
export const PASTURE = { x0: 4, y0: 14, x1: 28, y1: 30 };
/** Crops grown on the market fields, per season. */
const FIELD_CROPS = [["turnip", "strawberry"], ["tomato", "sunflower"], ["pumpkin", "cranberry"], []];

export function buildSunridge(seed = 23) {
  const W = SUN_W;
  const H = SUN_H;
  const rng = new SeededRNG(seed);
  const ground = new Uint8Array(W * H);
  const solid = new Uint8Array(W * H);
  const keep = new Uint8Array(W * H);
  const objects = [];
  const idx = (x, y) => y * W + x;
  const ok = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const set = (x, y, g) => ok(x, y) && (ground[idx(x, y)] = g);
  const rect = (x0, y0, x1, y1, g) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, g);
  };
  const keepRect = (x0, y0, x1, y1) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (ok(x, y)) keep[idx(x, y)] = 1;
  };
  const add = (kind, tx, ty, o = {}) => {
    objects.push({ kind, tx, ty, ...o });
    if (ok(tx, ty)) keep[idx(tx, ty)] = 1;
  };

  // Roads: north–south from the gate, east–west lane between the farms.
  rect(35, 0, 36, H - 3, GR.PATH);
  rect(3, 32, W - 4, 33, GR.PATH);
  rect(12, 9, 13, 13, GR.PATH);
  rect(14, 11, 34, 12, GR.PATH);
  rect(46, 9, 47, 13, GR.PATH);
  rect(37, 11, 45, 12, GR.PATH);

  // A creek along the south, with a little footbridge.
  for (let x = 1; x < W - 1; x++) {
    const y = 40 + Math.round(Math.sin(x / 6) * 1.2);
    set(x, y, GR.WATER);
    set(x, y + 1, GR.WATER);
    set(x, y - 1, GR.SAND);
    set(x, y + 2, GR.SAND);
  }
  for (let y = 36; y < H - 2; y++) if (ground[idx(35, y)] === GR.WATER || ground[idx(36, y)] === GR.WATER) (set(35, y, GR.WOOD), set(36, y, GR.WOOD));

  // Market fields west and east of the road, south of the lane.
  rect(5, 34, 30, 37, GR.FIELD);
  rect(41, 34, 64, 37, GR.FIELD);

  // Borders.
  for (let x = 0; x < W; x++) for (const y of [0, H - 1]) solid[idx(x, y)] = 1;
  for (let y = 0; y < H; y++) for (const x of [0, W - 1]) solid[idx(x, y)] = 1;
  for (const [x, y] of SUN_GATE.sun) solid[idx(x, y)] = 0;
  for (let i = 0; i < W * H; i++) if (ground[i] !== GR.GRASS) keep[i] = 1;

  // ── Hawthorn Ranch ──
  add("building", 4, 4, { style: "ranch", id: "ranch" });
  keepRect(3, 2, 11, 9);
  add("building", 17, 3, { style: "barn", id: "barn" });
  keepRect(16, 1, 24, 10);
  add("silo", 25, 6, { w: 2, h: 2 });
  keepRect(24, 4, 28, 9);
  add("shopsign", 11, 10, { shop: "dale" });
  for (let x = PASTURE.x0; x <= PASTURE.x1; x++) for (const y of [PASTURE.y0, PASTURE.y1]) if (!(y === PASTURE.y0 && (x === 16 || x === 17))) add("fence", x, y);
  for (let y = PASTURE.y0 + 1; y < PASTURE.y1; y++) for (const x of [PASTURE.x0, PASTURE.x1]) add("fence", x, y);
  keepRect(PASTURE.x0, PASTURE.y0, PASTURE.x1, PASTURE.y1);
  for (const [x, y] of [[8, 17], [22, 26], [14, 27]]) add("trough", x, y);
  for (const [x, y] of [[25, 17], [26, 18], [6, 25], [20, 18]]) add("haybale", x, y);

  // ── Willow's orchard ──
  add("building", 44, 4, { style: "cottage2", id: "willow_home" });
  keepRect(43, 2, 49, 8);
  add("stall", 38, 14, { w: 2, h: 1, color: "#e8566a", shop: "willow" });
  keepRect(37, 13, 40, 15);
  for (let y = 15; y <= 28; y += 3) for (let x = 43; x <= 64; x += 3) add("appletree", x + ((y / 3) % 2 ? 1 : 0), y, { seed: x + y });
  keepRect(42, 14, 66, 30);
  for (let x = 44; x <= 60; x += 4) add("beehive", x, 30);

  // Decorative crops on the market fields.
  let fi = 0;
  for (let y = 34; y <= 37; y++) for (let x = 5; x <= 64; x++) {
    if (ground[idx(x, y)] !== GR.FIELD || (x + y) % 2) continue;
    add("decocrop", x, y, { i: fi++ });
  }

  // Trees round the edges, a few in the meadows.
  const canTree = (x, y) => ok(x, y) && !keep[idx(x, y)] && !solid[idx(x, y)] && ground[idx(x, y)] === GR.GRASS;
  const tree = (x, y, variant) => {
    if (!canTree(x, y)) return;
    add("tree", x, y, { variant, seed: rng.nextInt(1, 3) });
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (ok(x + dx, y + dy)) keep[idx(x + dx, y + dy)] = 1;
  };
  for (let x = 1; x < W - 1; x += 2) if (x < 33 || x > 38) tree(x, 1, "oak");
  for (let x = 2; x < W - 1; x += 2) tree(x, H - 2, "oak");
  for (let y = 3; y < H - 2; y += 2) (tree(1, y, y % 4 ? "oak" : "pine"), tree(W - 2, y, "pine"));
  for (let i = 0; i < 26; i++) tree(rng.nextInt(3, W - 4), rng.nextInt(3, H - 4), rng.next() < 0.35 ? "cherry" : "oak");
  for (let i = 0; i < 60; i++) {
    const x = rng.nextInt(2, W - 3);
    const y = rng.nextInt(2, H - 3);
    if (canTree(x, y)) add("flowers", x, y, { seed: i });
  }
  for (let i = 0; i < 16; i++) {
    const x = rng.nextInt(3, W - 4);
    const y = rng.nextInt(3, H - 4);
    if (canTree(x, y)) add("bush", x, y, { seed: i, berry: i % 4 === 0 });
  }
  return { w: W, h: H, ground, solid, objects };
}

/** The crop a decorative field plant shows this season (null in winter). */
export function fieldCrop(i, season) {
  const list = FIELD_CROPS[season];
  return list.length ? list[i % list.length] : null;
}
