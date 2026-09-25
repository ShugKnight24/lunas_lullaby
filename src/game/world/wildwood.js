/**
 * The Wildwood: an old forest north of Lullaby Hollow, reached through the
 * arch at the top of the forest clearing. Deterministic from a seed, and
 * plain data like map.js: ground grid, object specs, monster spawn tiles per
 * zone, named places and the exit.
 *
 * Zones run south to north: the Mossy Edge by the entrance (easy), the
 * Bramble Thicket (boars, ironwood), Wisp Hollow in the north-east, and the
 * Moon Shrine at the top, where the Gloomroot waits.
 */

import { SeededRNG } from "../../engine/seeded-rng.js";
import { GR } from "./map.js";

export const WILD_W = 72;
export const WILD_H = 60;

/** The arch in the town forest clearing leads here, and back. */
export const WILD_GATE = { world: [[52, 1], [53, 1]], wild: [[35, 59], [36, 59]] };
export const WILD_SPAWN = { tx: 35, ty: 55 };
export const WORLD_FROM_WILD = { tx: 52, ty: 3 };

/** Named places (quest goals, discovery toasts). Rects in tiles. */
export const PLACES = {
  glade: { name: "Mossy Glade", x0: 8, y0: 40, x1: 17, y1: 48 },
  thicket: { name: "Bramble Thicket", x0: 4, y0: 18, x1: 40, y1: 38 },
  hollow: { name: "Wisp Hollow", x0: 46, y0: 6, x1: 68, y1: 24 },
  shrine: { name: "the Moon Shrine", x0: 27, y0: 2, x1: 44, y1: 13 },
};

/** Which zone a tile belongs to (monster tables in data/monsters.js). */
export function zoneAt(x, y) {
  if (inRect(PLACES.shrine, x, y)) return "shrine";
  if (inRect(PLACES.hollow, x, y)) return "hollow";
  if (y >= 39) return "edge";
  return "thicket";
}

/** Where the boss stands, and the arena it can't leave. */
export const BOSS_HOME = { tx: 35.5, ty: 8.5 };

const inRect = (r, x, y) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;

/** Chest loot tables; `rare` chests sit off the beaten path. Contents re-roll weekly. */
export const CHEST_LOOT = {
  common: [["healing_salve", 1, 2], ["amber", 1, 2], ["iron_ore", 2, 4], ["trail_jerky", 1, 2], ["pet_treat", 1, 1], ["gold", 40, 120]],
  rare: [["moonstone", 1, 2], ["gold", 200, 400], ["star_shard", 1, 1], ["healing_salve", 2, 3], ["swift_boots", 1, 1], ["tusk_pendant", 1, 1], ["iron_helm", 1, 1]],
};
export const CHEST_DAYS = 7;
export const ORE_DAYS = 5;
export const HERB_DAYS = 3;

export function buildWildwood(seed = 11) {
  const W = WILD_W;
  const H = WILD_H;
  const rng = new SeededRNG(seed);
  const ground = new Uint8Array(W * H).fill(GR.FOREST);
  const solid = new Uint8Array(W * H);
  const keep = new Uint8Array(W * H);
  const objects = [];
  const idx = (x, y) => y * W + x;
  const ok = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const set = (x, y, g) => ok(x, y) && (ground[idx(x, y)] = g);
  const keepAt = (x, y) => ok(x, y) && (keep[idx(x, y)] = 1);
  const add = (kind, tx, ty, o = {}) => {
    objects.push({ kind, tx, ty, ...o });
    keepAt(tx, ty);
  };
  const disc = (cx, cy, rx, ry, fn) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      if (ok(x, y) && ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) fn(x, y);
    }
  };

  // Deep moss through the thicket and the hollow.
  for (let i = 0; i < 16; i++) disc(rng.nextInt(4, W - 5), rng.nextInt(4, 38), rng.nextInt(3, 6), rng.nextInt(2, 4), (x, y) => set(x, y, GR.MOSS));
  disc(57, 15, 11, 9, (x, y) => set(x, y, GR.MOSS));

  // A stream from the hollow down the east side, with a pool.
  for (let y = 4; y < H - 1; y++) {
    const x = 60 - Math.round(y * 0.18) + Math.round(Math.sin(y / 5) * 1.6);
    for (let dx = 0; dx < 2; dx++) set(x + dx, y, GR.WATER);
    set(x - 1, y, GR.SAND);
    set(x + 2, y, GR.SAND);
  }
  disc(54, 50, 4.5, 3.2, (x, y) => set(x, y, GR.WATER));

  // Clearings: the entrance, the glade, the arena.
  disc(35.5, 54, 6, 4, (x, y) => (set(x, y, GR.GRASS), keepAt(x, y)));
  disc(12.5, 44, 5.5, 4.5, (x, y) => (set(x, y, GR.GRASS), keepAt(x, y)));
  disc(35.5, 7.5, 9, 5.5, (x, y) => (set(x, y, GR.GRASS), keepAt(x, y)));
  disc(58, 14, 4, 3, (x, y) => keepAt(x, y));

  // Paths: entrance north to the shrine, with branches to the glade, the hollow and the thicket.
  const trail = (pts) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[i + 1];
      const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
      for (let k = 0; k <= n; k++) {
        const x = Math.round(ax + ((bx - ax) * k) / n);
        const y = Math.round(ay + ((by - ay) * k) / n);
        for (const [dx, dy] of [[0, 0], [1, 0]]) {
          if (ground[idx(x + dx, y + dy)] === GR.WATER) set(x + dx, y + dy, GR.WOOD);
          else set(x + dx, y + dy, GR.PATH);
          keepAt(x + dx, y + dy);
          keepAt(x + dx - 1, y + dy);
          keepAt(x + dx + 1, y + dy);
        }
      }
    }
  };
  trail([[35, 59], [35, 52], [33, 45], [36, 38], [34, 30], [36, 22], [35, 14]]);
  trail([[33, 45], [24, 46], [17, 44]]);
  trail([[36, 38], [44, 36], [52, 30], [56, 22], [58, 16]]);
  trail([[34, 30], [24, 28], [14, 24], [8, 20]]);

  // Border is solid, except the gate.
  for (let x = 0; x < W; x++) for (const y of [0, H - 1]) solid[idx(x, y)] = 1;
  for (let y = 0; y < H; y++) for (const x of [0, W - 1]) solid[idx(x, y)] = 1;
  for (const [x, y] of WILD_GATE.wild) {
    solid[idx(x, y)] = 0;
    set(x, y, GR.PATH);
  }
  for (let i = 0; i < W * H; i++) if (ground[i] === GR.WATER || ground[i] === GR.SAND) keep[i] = 1;

  // ── Landmarks ──
  add("shrine", 34, 4, { w: 3, h: 2 });
  add("arch", 35, 57, { w: 2, h: 1 });
  for (const [x, y] of [[34, 50], [37, 42], [33, 34], [37, 26], [34, 18]]) add("lamp", x, y, { wild: true });

  // Chests: common ones along the way, rare ones tucked away.
  const chests = [[20, 47, false], [8, 20, false], [45, 36, false], [26, 28, false], [63, 44, true], [5, 30, true], [66, 8, true], [44, 10, false]];
  chests.forEach(([x, y, rare], i) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) keepAt(x + dx, y + dy);
    set(x, y, GR.GRASS);
    add("chest", x, y, { chest: i, rare });
  });

  // ── Trees: dense jittered grid; ironwood grows dark in the thicket ──
  const canTree = (x, y) => ok(x, y) && !keep[idx(x, y)] && !solid[idx(x, y)] && (ground[idx(x, y)] === GR.FOREST || ground[idx(x, y)] === GR.MOSS || ground[idx(x, y)] === GR.GRASS);
  const tree = (x, y, variant, o = {}) => {
    if (!canTree(x, y)) return;
    add("tree", x, y, { variant, seed: rng.nextInt(1, 3), ...o });
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) keepAt(x + dx, y + dy);
  };
  for (let x = 1; x < W - 1; x += 2) tree(x, 1, "pine");
  for (let x = 2; x < W - 1; x += 2) if (x < 33 || x > 38) tree(x, H - 2, "oak");
  for (let y = 3; y < H - 2; y += 2) (tree(1, y, "pine"), tree(W - 2, y, "pine"));
  for (let gy = 3; gy < H - 3; gy += 2) for (let gx = 3; gx < W - 3; gx += 3) {
    if (rng.next() > 0.72) continue;
    const x = gx + rng.nextInt(0, 1);
    const y = gy + rng.nextInt(0, 1);
    const z = zoneAt(x, y);
    const iron = z === "thicket" && rng.next() < 0.18;
    tree(x, y, iron ? "ironwood" : rng.next() < 0.6 ? "pine" : "oak");
  }

  // Ore stones, herbs, bushes, weeds and flowers on what's left.
  const scatter = (n, x0, y0, x1, y1, fn) => {
    for (let i = 0, tries = 0; i < n && tries < n * 30; tries++) {
      const x = rng.nextInt(x0, x1);
      const y = rng.nextInt(y0, y1);
      if (!canTree(x, y)) continue;
      fn(x, y);
      i++;
    }
  };
  scatter(10, 3, 18, 44, 40, (x, y) => add("ore", x, y, { ore: "amber" }));
  scatter(8, 3, 40, W - 4, H - 4, (x, y) => add("ore", x, y, { ore: "iron" }));
  scatter(6, 3, 14, 44, 38, (x, y) => add("ore", x, y, { ore: "iron" }));
  scatter(5, 44, 4, W - 4, 26, (x, y) => add("ore", x, y, { ore: "moonstone" }));
  scatter(14, 3, 3, W - 4, H - 4, (x, y) => add("herb", x, y));
  scatter(40, 3, 3, W - 4, H - 4, (x, y) => add("bush", x, y, { seed: x + y, berry: (x * y) % 7 === 0 }));
  scatter(60, 3, 3, W - 4, H - 4, (x, y) => add("weed", x, y, { wild: true }));
  for (let i = 0; i < 80; i++) {
    const x = rng.nextInt(2, W - 3);
    const y = rng.nextInt(2, H - 3);
    if (canTree(x, y)) add("flowers", x, y, { seed: i });
  }

  // Monster spawn tiles per zone: open, walkable, away from the entrance.
  const spawns = { edge: [], thicket: [], hollow: [] };
  const taken = new Set(objects.map((o) => idx(o.tx, o.ty)));
  for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) {
    const i = idx(x, y);
    if (taken.has(i) || solid[i] || ground[i] === GR.WATER || ground[i] === GR.WOOD) continue;
    if (Math.abs(x - 35.5) < 7 && y > 49) continue;
    const z = zoneAt(x, y);
    if (spawns[z] && (x + y * 3) % 5 === 0) spawns[z].push([x, y]);
  }

  return { w: W, h: H, ground, solid, objects, spawns };
}
