/**
 * Playable levels: a ground grid, terrain walls, and objects indexed by the
 * tiles they occupy. The outdoor world comes from map.js; interiors are small
 * rooms with furniture and one exit.
 */

import { TILE } from "../config.js";
import { GR, BUILDING_SPOTS, INTERIORS } from "./map.js";
import { BUILDINGS } from "../art/props.js";

/** Tile footprint (w, h) and whether the object blocks movement, per kind. */
const KINDS = {
  tree: [1, 1, true], rock: [1, 1, true], weed: [1, 1, true], twig: [1, 1, true], stump: [1, 1, true],
  bush: [1, 1, true], flowers: [1, 1, false], lily: [1, 1, false], bin: [1, 1, true], board: [1, 1, true],
  lamp: [1, 1, true], bench: [1, 1, true], barrel: [1, 1, true], planter: [1, 1, true], fence: [1, 1, true],
  well: [2, 2, true], building: [0, 0, true], furniture: [1, 1, true],
  structure: [1, 1, true],
};

export class Level {
  constructor(id, w, h, outdoor) {
    this.id = id;
    this.w = w;
    this.h = h;
    this.outdoor = outdoor;
    this.ground = new Uint8Array(w * h);
    this.wall = new Uint8Array(w * h);
    this.occ = new Array(w * h).fill(null);
    this.objects = [];
    this.doors = new Map(); // tile index -> { to, tx, ty, dir, building }
    this.version = 0; // bumps when ground or objects change (chunk re-bake)
  }

  inside(tx, ty) {
    return tx >= 0 && ty >= 0 && tx < this.w && ty < this.h;
  }

  at(tx, ty) {
    return this.inside(tx, ty) ? this.occ[ty * this.w + tx] : null;
  }

  /** Can nothing walk onto this tile? `mounted` also blocks doors. */
  blocked(tx, ty, mounted = false) {
    if (!this.inside(tx, ty)) return true;
    const i = ty * this.w + tx;
    if (this.wall[i]) return true;
    if (this.doors.has(i)) return mounted;
    const g = this.ground[i];
    if (this.outdoor && g === GR.WATER) return true;
    const o = this.occ[i];
    return !!(o && o.solid && !o.gone);
  }

  isWater(tx, ty) {
    return this.inside(tx, ty) && this.outdoor && this.ground[ty * this.w + tx] === GR.WATER;
  }

  add(o) {
    this.objects.push(o);
    this.index(o, o);
    this.version++;
    return o;
  }

  remove(o) {
    const i = this.objects.indexOf(o);
    if (i >= 0) this.objects.splice(i, 1);
    this.index(o, null);
    this.version++;
  }

  index(o, v) {
    for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) {
      if (!this.inside(o.tx + x, o.ty + y)) continue;
      const i = (o.ty + y) * this.w + o.tx + x;
      if (v === null && this.occ[i] !== o) continue;
      this.occ[i] = v;
    }
  }
}

/** Runtime object from a map spec. Position (x, y) is the draw/sort origin. */
export function makeObject(spec, id) {
  const [w0, h0, solid] = KINDS[spec.kind] ?? [1, 1, true];
  let w = spec.w ?? w0;
  let h = spec.h ?? h0;
  if (spec.kind === "building") {
    const b = BUILDINGS[spec.style];
    w = b.w;
    h = b.d;
  }
  const o = { ...spec, id, w, h, solid, gone: false, shake: 0, key: "", spr: null };
  o.x = (spec.tx + w / 2) * TILE;
  o.y = (spec.ty + h) * TILE - (w === 1 && h === 1 ? 6 : 2);
  if (spec.kind === "flowers" || spec.kind === "lily") o.y -= 8;
  if (spec.kind === "tree") o.hp = 6;
  if (spec.kind === "rock") o.hp = spec.small ? 1 : 4;
  if (spec.kind === "stump") o.hp = 3;
  if (spec.kind === "weed" || spec.kind === "twig") o.hp = 1;
  return o;
}

export function createWorldLevel(data) {
  const lv = new Level("world", data.w, data.h, true);
  lv.ground.set(data.ground);
  lv.wall.set(data.solid);
  data.objects.forEach((spec, i) => lv.add(makeObject(spec, i + 1)));
  for (const b of BUILDING_SPOTS) {
    if (!b.interior) continue;
    const st = BUILDINGS[b.style];
    const dx = b.tx + (st.w >> 1);
    const dy = b.ty + st.d - 1;
    const room = INTERIORS[b.interior];
    lv.doors.set(dy * lv.w + dx, { to: b.interior, tx: room.spawn.tx, ty: room.spawn.ty, dir: "up", building: b.id });
  }
  return lv;
}

export function createInterior(id) {
  const r = INTERIORS[id];
  const lv = new Level(id, r.w, r.h, false);
  lv.room = r;
  for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) {
    const edge = y < 2 || x === 0 || x === r.w - 1 || y === r.h - 1;
    if (edge) lv.wall[y * r.w + x] = 1;
  }
  lv.wall[r.exit.ty * r.w + r.exit.tx] = 0;
  const b = BUILDING_SPOTS.find((s) => s.interior === id);
  const st = BUILDINGS[b.style];
  lv.doors.set(r.exit.ty * r.w + r.exit.tx, { to: "world", tx: b.tx + (st.w >> 1), ty: b.ty + st.d, dir: "down", building: b.id });
  r.furniture.forEach(([name, tx, ty, o = {}], i) => {
    const spec = { kind: "furniture", name, tx, ty, w: o.w ?? 1, h: o.h ?? 1, ...o };
    const obj = lv.add(makeObject(spec, i + 1));
    if (name === "rug") {
      obj.solid = false;
      obj.flat = true;
    }
  });
  return lv;
}
