/**
 * Lullaby Hollow layout: the farm (west), town (centre), forest (north),
 * river and pond (east), meadow (south). Deterministic from a seed; returns
 * plain data (ground grid, object specs, doors, waypoints, forage spots) that
 * world/level.js turns into a playable level.
 */

import { MAP_W as W, MAP_H as H } from "../config.js";
import { SeededRNG } from "../../engine/seeded-rng.js";

export const GR = { GRASS: 0, PATH: 1, PLAZA: 2, WATER: 3, SAND: 4, FIELD: 5, WOOD: 6, FOREST: 7 };

/** Farm area where tilling and building are allowed. */
export const FARM = { x0: 2, y0: 2, x1: 33, y1: 62 };
export const inFarm = (x, y) => x >= FARM.x0 && x <= FARM.x1 && y >= FARM.y0 && y <= FARM.y1;

/** Which body of water a water tile belongs to (for the fish table). */
export function waterKind(x, y) {
  if (x < 20) return "pool";
  return ((x - 87) / 6.5) ** 2 + ((y - 48) / 5.2) ** 2 < 1 ? "pond" : "river";
}

/** Building placements: top-left tile, style; door = bottom-centre tile. */
export const BUILDING_SPOTS = [
  { id: "house", style: "house", tx: 5, ty: 5, interior: "house" },
  { id: "stable", style: "stable", tx: 2, ty: 19 },
  { id: "bakery", style: "bakery", tx: 40, ty: 19, interior: "bakery" },
  { id: "carpenter", style: "carpenter", tx: 56, ty: 19, interior: "carpenter" },
  { id: "cabin", style: "cabin", tx: 84, ty: 23, interior: "cabin" },
];

export const WAYPOINTS = {
  bakery_counter: { level: "bakery", tx: 7, ty: 3 },
  bakery_home: { level: "bakery", tx: 2, ty: 3 },
  bakery_door: { level: "world", tx: 43, ty: 24 },
  bakery_front: { level: "world", tx: 45, ty: 25 },
  plaza_bench: { level: "world", tx: 47, ty: 30 },
  plaza_well: { level: "world", tx: 54, ty: 35 },
  carpenter_in: { level: "carpenter", tx: 8, ty: 4 },
  carpenter_door: { level: "world", tx: 59, ty: 24 },
  forest_edge: { level: "world", tx: 53, ty: 17 },
  cabin_in: { level: "cabin", tx: 4, ty: 3 },
  cabin_door: { level: "world", tx: 86, ty: 28 },
  pier_end: { level: "world", tx: 87, ty: 46 },
  bridge: { level: "world", tx: 78, ty: 35 },
};

export const PLAYER_START = { tx: 8, ty: 11 };
export const HORSE_START = { tx: 5, ty: 25 };
export const BOARD = { tx: 63, ty: 22 };
export const BIN = { tx: 12, ty: 8 };
export const HIDDEN = [
  { id: "hollow", name: "Whispering Hollow", x0: 86, y0: 3, x1: 92, y1: 8 },
  { id: "pool", name: "Moonlit Pool", x0: 4, y0: 63, x1: 12, y1: 68 },
];

const riverX = (y) => 76 + Math.round(Math.sin(y / 9) * 1.5);

export function buildWorld(seed = 7) {
  const rng = new SeededRNG(seed);
  const ground = new Uint8Array(W * H);
  const solid = new Uint8Array(W * H); // terrain walls (map border)
  const keep = new Uint8Array(W * H); // no random trees/debris here
  const objects = [];
  const spots = [];
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

  // Forest floor across the north.
  rect(22, 0, W - 1, 15, GR.FOREST);
  for (let x = 22; x < W; x++) if (rng.next() < 0.5) set(x, 16, GR.FOREST);

  // River from a spring in the north down to the south edge, sandy banks.
  for (let y = 10; y < H; y++) {
    const rx = riverX(y);
    for (let x = rx - 1; x <= rx + 4; x++) set(x, y, x === rx - 1 || x === rx + 4 ? GR.SAND : GR.WATER);
  }
  for (let y = 7; y <= 11; y++) for (let x = 73; x <= 81; x++) {
    const d = ((x - 77) / 3.6) ** 2 + ((y - 10) / 2.6) ** 2;
    if (d < 1) set(x, y, GR.WATER);
    else if (d < 1.6) set(x, y, GR.SAND);
  }

  // Pond with a sandy shore and a pier.
  for (let y = 38; y <= 58; y++) for (let x = 78; x < W - 1; x++) {
    const d = ((x - 87) / 6.5) ** 2 + ((y - 48) / 5.2) ** 2;
    if (d < 1) set(x, y, GR.WATER);
    else if (d < 1.45 && ground[idx(x, y)] !== GR.WATER) set(x, y, GR.SAND);
  }
  rect(86, 41, 87, 47, GR.WOOD);

  // Roads and paths.
  for (let y = 33; y <= 34; y++) for (let x = 3; x <= 90; x++) {
    const g = ground[idx(x, y)];
    set(x, y, g === GR.WATER || g === GR.SAND ? GR.WOOD : GR.PATH);
  }
  rect(8, 9, 8, 32, GR.PATH);
  rect(9, 9, 12, 9, GR.PATH);
  rect(43, 23, 43, 28, GR.PATH);
  rect(59, 23, 59, 28, GR.PATH);
  rect(86, 27, 86, 32, GR.PATH);
  rect(87, 35, 87, 40, GR.PATH);
  for (let y = 3; y <= 28; y++) {
    const x = 51 + Math.round(Math.sin(y / 4) * 1.2);
    rect(x, y, x + 1, y, GR.PATH);
    keepRect(x - 1, y, x + 2, y);
  }
  rect(51, 40, 52, 58, GR.PATH);
  rect(44, 58, 60, 59, GR.PATH);

  // Town plaza.
  for (let y = 27; y <= 41; y++) for (let x = 43; x <= 59; x++) {
    const cx = Math.max(0, Math.abs(x - 51) - 5.5);
    const cy = Math.max(0, Math.abs(y - 34) - 4.5);
    if (cx * cx + cy * cy < 9) set(x, y, GR.PLAZA);
  }

  // Farm field (pre-cleared soil).
  rect(14, 12, 31, 30, GR.FIELD);

  // Map border is solid.
  for (let x = 0; x < W; x++) for (const y of [0, H - 1]) solid[idx(x, y)] = 1;
  for (let y = 0; y < H; y++) for (const x of [0, W - 1]) solid[idx(x, y)] = 1;

  // Keep-clear zones: buildings (+1 apron), paths, plaza, field, clearings.
  for (const b of BUILDING_SPOTS) keepRect(b.tx - 1, b.ty - 2, b.tx + 7, b.ty + 5);
  keepRect(44, 1, 58, 9); // forest clearing at the top of the path
  keepRect(3, 23, 9, 28); // horse paddock
  for (let i = 0; i < W * H; i++) if (ground[i] !== GR.GRASS && ground[i] !== GR.FOREST) keep[i] = 1;

  // ── Buildings & fixed props ──
  for (const b of BUILDING_SPOTS) add("building", b.tx, b.ty, { id: b.id, style: b.style, interior: b.interior });
  add("bin", BIN.tx, BIN.ty);
  add("board", BOARD.tx, BOARD.ty);
  add("well", 50, 32, { town: true });
  for (const [x, y] of [[44, 28], [58, 28], [44, 40], [58, 40], [30, 32], [66, 32], [72, 35], [83, 32], [88, 40], [9, 12], [52, 16]]) add("lamp", x, y);
  for (const [x, y] of [[46, 29], [55, 29], [46, 39], [55, 39]]) add("bench", x, y);
  for (const [x, y] of [[48, 27], [54, 27], [42, 23], [45, 23], [57, 23], [61, 23], [4, 9], [11, 10]]) add("planter", x, y);
  for (const [x, y] of [[62, 20], [63, 20], [55, 22], [39, 22]]) add("barrel", x, y);
  for (const [x, y, s] of [[83, 46, 0], [90, 45, 1], [92, 50, 2], [84, 52, 3], [89, 53, 1], [8, 66, 1]]) add("lily", x, y, { seed: s });

  // Farm fence along the town side, open at the road.
  for (let y = 3; y <= 62; y++) if (y < 32 || y > 35) add("fence", 34, y, { fixed: true });
  // Paddock fence around the horse.
  for (let x = 2; x <= 9; x++) if (x !== 8) add("fence", x, 29, { fixed: true });

  // ── Trees ──
  const canTree = (x, y) => ok(x, y) && !keep[idx(x, y)] && (ground[idx(x, y)] === GR.GRASS || ground[idx(x, y)] === GR.FOREST);
  const tree = (x, y, variant) => {
    if (!canTree(x, y)) return;
    add("tree", x, y, { variant, seed: rng.nextInt(1, 3) });
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (ok(x + dx, y + dy)) keep[idx(x + dx, y + dy)] = 1;
  };
  // Border rows so the edge reads as woodland.
  for (let x = 1; x < W - 1; x += 2) tree(x, 1, x > 22 ? "pine" : "oak");
  for (let x = 2; x < W - 1; x += 2) tree(x, H - 2, "oak");
  for (let y = 3; y < H - 2; y += 2) tree(1, y, y % 4 ? "oak" : "pine");
  for (let y = 3; y < H - 2; y += 2) tree(W - 2, y, "pine");

  // Hidden areas: ring them in bushes with one gap, clear inside.
  for (const hid of HIDDEN) {
    keepRect(hid.x0, hid.y0, hid.x1, hid.y1);
    for (let x = hid.x0 - 1; x <= hid.x1 + 1; x++) for (const y of [hid.y0 - 1, hid.y1 + 1]) ringBush(x, y, hid);
    for (let y = hid.y0; y <= hid.y1; y++) for (const x of [hid.x0 - 1, hid.x1 + 1]) ringBush(x, y, hid);
  }
  function ringBush(x, y, hid) {
    const gap = hid.id === "hollow" ? x === hid.x0 - 1 && y === hid.y1 : x === hid.x1 + 1 && y === hid.y0 + 2;
    if (!ok(x, y) || gap || solid[idx(x, y)]) return;
    add("bush", x, y, { seed: x + y, dense: true });
  }
  set(8, 66, GR.WATER);
  for (const [x, y] of [[7, 66], [9, 66], [8, 65], [8, 67]]) set(x, y, GR.WATER);
  rect(6, 64, 10, 64, GR.SAND);
  rect(6, 68, 10, 68, GR.SAND);

  // Forest scatter: jittered grid so there is always room to walk between trunks.
  for (let gy = 3; gy <= 15; gy += 3) for (let gx = 23; gx < W - 3; gx += 3) {
    if (rng.next() < 0.78) tree(gx + rng.nextInt(0, 2), gy + rng.nextInt(0, 1), rng.next() < 0.55 ? "pine" : "oak");
  }
  // Meadow, farm edges, town greens, east bank.
  for (let i = 0; i < 70; i++) {
    const x = rng.nextInt(3, W - 4);
    const y = rng.nextInt(37, H - 4);
    tree(x, y, rng.next() < 0.3 ? "cherry" : x > 80 ? "pine" : "oak");
  }
  for (const [x, y] of [[3, 4], [13, 4], [3, 14], [12, 14], [36, 22], [38, 44], [64, 26], [66, 40], [62, 44], [70, 20], [68, 30], [36, 30]]) tree(x, y, (x + y) % 3 ? "oak" : "cherry");
  for (let i = 0; i < 24; i++) tree(rng.nextInt(81, W - 3), rng.nextInt(18, 60), "pine");

  // Bushes and flower patches (decor).
  for (let i = 0; i < 40; i++) {
    const x = rng.nextInt(3, W - 4);
    const y = rng.nextInt(17, H - 4);
    if (canTree(x, y) && !(x >= 36 && x <= 70 && y >= 18 && y <= 44 && rng.next() < 0.5)) add("bush", x, y, { seed: i, berry: i % 5 === 0 });
  }
  for (let i = 0; i < 90; i++) {
    const x = rng.nextInt(3, W - 4);
    const y = rng.nextInt(3, H - 4);
    if (canTree(x, y)) add("flowers", x, y, { seed: i });
  }

  // Rocks: river banks and a little quarry in the south-east.
  for (let i = 0; i < 26; i++) {
    const x = rng.nextInt(81, W - 4);
    const y = rng.nextInt(58, H - 4);
    if (canTree(x, y)) add("rock", x, y, { respawn: 4 });
  }
  for (let i = 0; i < 12; i++) {
    const y = rng.nextInt(14, H - 4);
    const x = riverX(y) + (rng.next() < 0.5 ? -3 : 7);
    if (canTree(x, y)) add("rock", x, y, { respawn: 4 });
  }
  for (let i = 0; i < 14; i++) {
    const x = rng.nextInt(24, W - 4);
    const y = rng.nextInt(3, 15);
    if (canTree(x, y)) add("rock", x, y, { respawn: 4 });
  }

  // Farm debris: weeds, stones and twigs across the field.
  for (let y = 12; y <= 30; y++) for (let x = 14; x <= 31; x++) {
    const r = rng.next();
    if (r < 0.14) add("weed", x, y);
    else if (r < 0.19) add("rock", x, y, { small: true });
    else if (r < 0.23) add("twig", x, y);
  }
  for (let i = 0; i < 40; i++) {
    const x = rng.nextInt(3, 33);
    const y = rng.nextInt(36, 61);
    if (canTree(x, y)) add(rng.next() < 0.6 ? "weed" : "rock", x, y, { small: true });
  }

  // Forage spots (on free ground).
  let sid = 0;
  const spot = (x, y, rare = false) => {
    if (!ok(x, y) || solid[idx(x, y)] || (!rare && inFarm(x, y))) return;
    if (ground[idx(x, y)] === GR.WATER) return;
    for (const o of objects) if (o.tx === x && o.ty === y && o.kind !== "flowers") return;
    spots.push({ id: ++sid, tx: x, ty: y, rare });
  };
  for (let i = 0; i < 18; i++) spot(rng.nextInt(36, W - 4), rng.nextInt(3, 15));
  for (let i = 0; i < 8; i++) spot(rng.nextInt(36, 75), rng.nextInt(44, H - 4));
  for (let i = 0; i < 4; i++) spot(rng.nextInt(81, W - 4), rng.nextInt(18, 36));
  spot(88, 5, true);
  spot(90, 7, true);
  spot(87, 4, true);
  spot(5, 65, true);
  spot(11, 66, true);

  return { w: W, h: H, ground, solid, objects, spots };
}

/** Interior layouts: size, wall/floor colours, furniture and the exit. */
export const INTERIORS = {
  house: {
    w: 12, h: 9, wall: "#f4d8c4", trim: "#c98a6a", floor: "#d8a878",
    exit: { tx: 6, ty: 8 }, spawn: { tx: 6, ty: 7 },
    furniture: [["bed", 2, 3, { w: 2, h: 2 }], ["rug", 6, 6], ["table", 8, 5], ["fireplace", 6, 1, { w: 2 }], ["plant", 10, 2], ["shelf", 9, 1], ["plant", 1, 7]],
  },
  bakery: {
    w: 14, h: 9, wall: "#f8dcd8", trim: "#d88a8a", floor: "#e0b890",
    exit: { tx: 7, ty: 8 }, spawn: { tx: 7, ty: 7 },
    furniture: [["counter", 5, 4, { w: 4, shop: true }], ["shelf", 3, 1], ["shelf", 11, 1], ["rug", 7, 7, { c: "#f0b0c0" }], ["table", 11, 6], ["plant", 1, 6], ["plant", 12, 3]],
  },
  carpenter: {
    w: 12, h: 9, wall: "#e8cca4", trim: "#9a6a48", floor: "#c89868",
    exit: { tx: 6, ty: 8 }, spawn: { tx: 6, ty: 7 },
    furniture: [["workbench", 4, 3, { w: 3, build: true }], ["shelf", 9, 1], ["barrel", 1, 3], ["barrel", 10, 5], ["rug", 6, 6, { c: "#a8c8a0" }]],
  },
  cabin: {
    w: 8, h: 7, wall: "#c8dcec", trim: "#6a8aa8", floor: "#c8a078",
    exit: { tx: 4, ty: 6 }, spawn: { tx: 4, ty: 5 },
    furniture: [["bed", 1, 3, { w: 2, h: 2 }], ["plant", 6, 2], ["rug", 4, 5, { c: "#9ac8d8" }]],
  },
};
