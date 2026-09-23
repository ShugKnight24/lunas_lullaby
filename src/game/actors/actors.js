/**
 * Player, pet companion, horse, villagers and coop chickens: movement,
 * animation state and drawing. Positions are world units at the feet.
 */

import { TILE, WALK_SPEED, RIDE_MULT } from "../config.js";
import { personFrames, USE_HAND } from "../art/person.js";
import { RIDE_OFFSET } from "../art/animals.js";
import { DEFS, petSpr, horseSpr, chickenSpr, iconSpr, iconKey } from "../art/index.js";
import { drawSvgSprite } from "../../engine/sprite.js";
import { moveBox, boxFree } from "../world/collide.js";
import { findPath } from "../world/path.js";
import { WAYPOINTS, BUILDING_SPOTS, INTERIORS } from "../world/map.js";
import { BUILDINGS } from "../art/props.js";

const OPT = { alpha: 1, flip: false, cap: 512 };
const WALK_CYCLE = [1, 0, 2, 0];
// Precomputed cache keys so drawing never builds strings per frame.
const HK = {};
for (const d of ["side", "down", "up"]) HK[d] = [0, 1, 2].map((f) => ({ m: `horse:${d}:${f}:m`, o: `horse:${d}:${f}:o` }));
const CK = ["chick:0", "chick:1"];
const HS = { side: [], down: [], up: [] };
const CS = [];
const horseFrame = (sd, fr) => (HS[sd][fr] ??= horseSpr(sd, fr));
const spriteDir = (d) => (d === "left" || d === "right" ? "side" : d);

function shadow(ctx, x, y, rx, ry, z) {
  ctx.fillStyle = "rgba(58,37,48,0.2)";
  ctx.beginPath();
  ctx.ellipse(x, y, rx * z, ry * z, 0, 0, 6.283);
  ctx.fill();
}

function blit(ctx, key, spr, x, y, z, t, flip = false, alpha = 1) {
  OPT.flip = flip;
  OPT.alpha = alpha;
  drawSvgSprite(ctx, key, spr, DEFS, Math.round(x), Math.round(y), z, t, OPT);
}

export function dirFrom(dx, dy, cur) {
  if (Math.abs(dx) > Math.abs(dy) * 1.1) return dx < 0 ? "left" : "right";
  if (Math.abs(dy) > 0.001) return dy < 0 ? "up" : "down";
  return cur;
}

// ── Player ──────────────────────────────────────────────────────────────────

export function createPlayer(look) {
  return { x: 0, y: 0, dir: "down", moving: false, walkT: 0, useT: 0, useMax: 0.32, useItem: null, mounted: false, frames: personFrames(look, "p"), bumpDoor: false, idleT: 0, vx: 0, vy: 0 };
}

/** Move from input axes; returns true if movement was attempted. */
export function movePlayer(p, lv, ax, ay, dt) {
  p.moving = false;
  p.vx = p.vy = 0;
  if (p.useT > 0 || (!ax && !ay)) {
    p.idleT += dt;
    return false;
  }
  const len = Math.hypot(ax, ay);
  const sp = WALK_SPEED * (p.mounted ? RIDE_MULT : 1) * dt;
  const dx = (ax / len) * sp;
  const dy = (ay / len) * sp;
  p.dir = dirFrom(ax, ay, p.dir);
  const bx = p.x;
  const by = p.y;
  moveBox(lv, p, dx, dy, p.mounted ? 12 : 8, 5, p.mounted);
  p.vx = (p.x - bx) / dt;
  p.vy = (p.y - by) / dt;
  p.moving = true;
  p.idleT = 0;
  p.walkT += dt * (p.mounted ? 1.25 : 1);
  return true;
}

/** Tile the player faces (tool / interaction target). */
export function facingTile(p, out) {
  const tx = Math.floor(p.x / TILE);
  const ty = Math.floor((p.y - 4) / TILE);
  out[0] = tx + (p.dir === "left" ? -1 : p.dir === "right" ? 1 : 0);
  out[1] = ty + (p.dir === "up" ? -1 : p.dir === "down" ? 1 : 0);
  return out;
}

export function drawPlayer(ctx, p, horse, sx, sy, z, t) {
  const sd = spriteDir(p.dir);
  const flip = p.dir === "left";
  if (p.mounted) {
    const fr = p.moving ? 1 + (Math.floor(p.walkT * 7) % 2) : 0;
    const hs = horseFrame(sd, fr);
    const bob = p.moving ? Math.abs(Math.sin(p.walkT * 11)) * 2.2 : 0;
    shadow(ctx, sx, sy, sd === "side" ? 30 : 16, 6, z);
    blit(ctx, HK[sd][fr].m, hs.main, sx, sy, z, t, flip);
    const off = RIDE_OFFSET[sd];
    const rider = p.frames[sd][4];
    blit(ctx, rider.key, rider.sprite, sx + (flip ? -off[0] : off[0]) * z, sy + (off[1] - bob) * z, z, t, flip);
    if (hs.over) blit(ctx, HK[sd][fr].o, hs.over, sx, sy, z, t, flip);
    return;
  }
  const using = p.useT > 0;
  const fi = using ? 3 : p.moving ? WALK_CYCLE[Math.floor(p.walkT * 8) % 4] : 0;
  const bob = !using && p.moving && fi !== 0 ? 1.4 : 0;
  const breathe = !p.moving && !using ? Math.sin(t * 2.2) * 0.4 : 0;
  shadow(ctx, sx, sy, 11, 4, z);
  const f = p.frames[sd][fi];
  if (using && p.dir === "up") drawTool(ctx, p, sx, sy, z, t);
  blit(ctx, f.key, f.sprite, sx, sy - (bob + breathe) * z, z, t, flip);
  if (using && p.dir !== "up") drawTool(ctx, p, sx, sy, z, t);
}

/** Held tool swinging through an arc during the use animation. */
function drawTool(ctx, p, sx, sy, z, t) {
  const id = p.useItem;
  if (!id) return;
  const k = 1 - p.useT / p.useMax;
  const sd = spriteDir(p.dir);
  const hand = USE_HAND[sd];
  const flip = p.dir === "left" ? -1 : 1;
  let ang = 0;
  if (id === "can") ang = sd === "side" ? 0.6 + Math.sin(k * Math.PI) * 0.5 : 0.3;
  else ang = -1.4 + k * 2.2;
  ctx.save();
  ctx.translate(Math.round(sx + hand[0] * flip * z), Math.round(sy + hand[1] * z));
  ctx.scale(flip, 1);
  ctx.rotate(sd === "down" ? ang * 0.6 + 0.4 : ang);
  const ic = iconSpr(id);
  OPT.flip = false;
  OPT.alpha = 1;
  drawSvgSprite(ctx, iconKey(id), ic, DEFS, Math.round(8 * z), Math.round(-8 * z), z * 0.85, t, OPT);
  ctx.restore();
}

// ── Pet ─────────────────────────────────────────────────────────────────────

export function createPet(pet) {
  const keys = [0, 1, 2, 3].map((f) => `pet:${pet.kind}:${pet.coat}:${f}`);
  return { ...pet, keys, sprs: [], x: 0, y: 0, vx: 0, vy: 0, dir: "right", walkT: 0, state: "follow", stateT: 0, stuckT: 0, path: null, pi: 0, hop: 0, sniffX: 0, sniffY: 0, moving: false };
}

/** Arrive-steer toward a point behind the player; path-find or teleport when stuck/far. */
export function updatePet(a, pl, lv, dt, t) {
  // Trail a little behind and to the side so the pet never hides the player.
  const back = 28;
  const vert = pl.dir === "up" || pl.dir === "down";
  let tx = pl.x - (pl.dir === "right" ? back : pl.dir === "left" ? -back : 0) + (vert ? 28 : 0);
  let ty = pl.y - (pl.dir === "down" ? 10 : pl.dir === "up" ? -6 : -4);
  const dx0 = pl.x - a.x;
  const dy0 = pl.y - a.y;
  const far = Math.hypot(dx0, dy0);
  if (far > TILE * 16) return teleportPet(a, pl, lv);
  a.stateT -= dt;
  if (pl.moving || far > TILE * 4) {
    if (a.state !== "follow" && a.state !== "path") a.state = "follow";
  } else if (a.state === "follow" && pl.idleT > 1.8 && a.stateT <= 0) {
    a.state = Math.random() < 0.5 ? "sit" : "sniff";
    a.stateT = 3 + Math.random() * 4;
    a.sniffX = pl.x + (Math.random() - 0.5) * TILE * 3;
    a.sniffY = pl.y + (Math.random() - 0.3) * TILE * 2;
  } else if ((a.state === "sit" || a.state === "sniff") && a.stateT <= 0) {
    a.state = "follow";
    a.stateT = 1 + Math.random() * 2;
  }
  if (a.state === "sniff") {
    tx = a.sniffX;
    ty = a.sniffY;
  }
  if (a.state === "path") {
    if (!a.path || a.pi >= a.path.length) a.state = "follow";
    else {
      tx = a.path[a.pi] * TILE + TILE / 2;
      ty = a.path[a.pi + 1] * TILE + TILE / 2 + 4;
      if (Math.hypot(tx - a.x, ty - a.y) < 8) a.pi += 2;
    }
  }
  const dx = tx - a.x;
  const dy = ty - a.y;
  const d = Math.hypot(dx, dy);
  const maxSp = WALK_SPEED * (pl.mounted ? RIDE_MULT * 1.05 : 1.1) * (a.state === "sniff" ? 0.35 : 1);
  const slow = 40;
  const want = a.state === "sit" || d < 6 ? 0 : Math.min(maxSp, (maxSp * d) / slow);
  const wx = d > 0.01 ? (dx / d) * want : 0;
  const wy = d > 0.01 ? (dy / d) * want : 0;
  const k = 1 - Math.exp(-dt * 10);
  a.vx += (wx - a.vx) * k;
  a.vy += (wy - a.vy) * k;
  const bx = a.x;
  const by = a.y;
  const flier = a.kind === "bird";
  if (flier && (Math.abs(a.vx) + Math.abs(a.vy)) * dt > 0) {
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    if (!boxFree(lv, a.x, a.y, 5, 3) && !a.airborne) a.airborne = true;
  } else moveBox(lv, a, a.vx * dt, a.vy * dt, 6, 4);
  const moved = Math.hypot(a.x - bx, a.y - by);
  a.moving = moved > 0.3;
  if (a.moving) {
    a.walkT += dt;
    if (Math.abs(a.x - bx) > 0.2) a.dir = a.x > bx ? "right" : "left";
  }
  // Stuck against something while it wants to move: path round it.
  if (!flier && want > 20 && moved < want * dt * 0.25) a.stuckT += dt;
  else a.stuckT = Math.max(0, a.stuckT - dt);
  if (a.stuckT > 0.8 && a.state !== "path") {
    const p = findPath(lv, Math.floor(a.x / TILE), Math.floor(a.y / TILE), Math.floor(pl.x / TILE), Math.floor(pl.y / TILE), 3000);
    a.stuckT = 0;
    if (p && p.length) {
      a.path = p;
      a.pi = 0;
      a.state = "path";
    } else teleportPet(a, pl, lv);
  }
  if (flier) {
    a.airborne = a.moving && d > 20;
    a.hop = a.airborne ? 10 + Math.sin(t * 6) * 2 : a.state === "sniff" || a.state === "sit" ? Math.max(0, Math.sin(t * 7 + a.x)) * 4 : 0;
  }
}

export function teleportPet(a, pl, lv) {
  const offs = [[-1, 0], [1, 0], [0, 1], [0, -1], [-1, 1], [1, 1]];
  for (const [ox, oy] of offs) {
    const x = pl.x + ox * TILE;
    const y = pl.y + oy * TILE;
    if (boxFree(lv, x, y, 6, 4)) {
      a.x = x;
      a.y = y;
      break;
    }
  }
  a.vx = a.vy = 0;
  a.state = "follow";
  a.path = null;
}

export function drawPet(ctx, a, sx, sy, z, t) {
  let fr = 0;
  if (a.kind === "bird") fr = a.airborne ? 3 : a.hop > 1 ? 1 : 0;
  else if (a.state === "sit" && !a.moving) fr = 3;
  else if (a.moving) fr = 1 + (Math.floor(a.walkT * 9) % 2);
  const spr = (a.sprs[fr] ??= petSpr(a.kind, a.coat, fr));
  const lift = a.kind === "bird" ? a.hop : 0;
  shadow(ctx, sx, sy, a.kind === "bird" ? 6 : 10, 3, z);
  const breathe = !a.moving ? Math.sin(t * 3) * 0.3 : 0;
  blit(ctx, a.keys[fr], spr, sx, sy - (lift + breathe) * z, z, t, a.dir === "left");
}

// ── Horse (unmounted) ───────────────────────────────────────────────────────

export function drawHorse(ctx, h, sx, sy, z, t) {
  const sd = spriteDir(h.dir);
  const hs = horseFrame(sd, 0);
  shadow(ctx, sx, sy, sd === "side" ? 30 : 16, 6, z);
  blit(ctx, HK[sd][0].m, hs.main, sx, sy, z, t, h.dir === "left");
  if (hs.over) blit(ctx, HK[sd][0].o, hs.over, sx, sy, z, t, h.dir === "left");
}

// ── Villagers ───────────────────────────────────────────────────────────────

export function createVillager(id, def) {
  return { id, def, level: "world", x: 0, y: 0, dir: "down", walkT: 0, moving: false, path: null, pi: 0, goal: "", hop: null, pause: 0, frames: personFrames(def.look, `v${id}`) };
}

export function currentWaypoint(def, min) {
  const sch = def.schedule;
  let wp = sch[0][1];
  for (let i = 0; i < sch.length; i++) if (min >= sch[i][0]) wp = sch[i][1];
  return wp;
}

export const doorOf = (levelId) => {
  const b = BUILDING_SPOTS.find((s) => s.interior === levelId);
  const st = BUILDINGS[b.style];
  return [b.tx + (st.w >> 1), b.ty + st.d - 1];
};

/** Put a villager straight at its scheduled waypoint (load / new day). */
export function placeVillager(v, min) {
  const wp = WAYPOINTS[currentWaypoint(v.def, min)];
  v.level = wp.level;
  v.x = wp.tx * TILE + TILE / 2;
  v.y = wp.ty * TILE + TILE / 2 + 6;
  v.goal = currentWaypoint(v.def, min);
  v.path = null;
  v.hop = null;
  v.dir = "down";
}

/** Walk the schedule; `levels` maps id → Level. */
export function updateVillager(v, min, levels, dt) {
  const name = currentWaypoint(v.def, min);
  if (name !== v.goal) {
    v.goal = name;
    v.path = null;
    v.hop = null;
  }
  if (v.pause > 0) {
    v.pause -= dt;
    v.moving = false;
    return;
  }
  const wp = WAYPOINTS[v.goal];
  const lv = levels[v.level];
  if (!v.path) {
    let gx = wp.tx;
    let gy = wp.ty;
    if (wp.level !== v.level) {
      if (v.level === "world") [gx, gy] = doorOf(wp.level);
      else {
        const ex = INTERIORS[v.level].exit;
        gx = ex.tx;
        gy = ex.ty;
      }
      v.hop = v.level === "world" ? wp.level : "world";
    }
    v.path = findPath(lv, Math.floor(v.x / TILE), Math.floor((v.y - 4) / TILE), gx, gy) ?? [];
    v.pi = 0;
  }
  if (v.pi >= v.path.length) {
    v.moving = false;
    if (v.hop && v.hop !== v.level) {
      // Arrived at a door: step through to the other level.
      const to = v.hop;
      if (to === "world") {
        const [dx, dy] = doorOf(v.level);
        v.x = dx * TILE + TILE / 2;
        v.y = (dy + 1) * TILE + TILE / 2 + 6;
      } else {
        const sp = INTERIORS[to].spawn;
        v.x = sp.tx * TILE + TILE / 2;
        v.y = sp.ty * TILE + TILE / 2 + 6;
      }
      v.level = to;
      v.path = null;
      v.hop = null;
    } else if (v.hop) {
      v.hop = null;
      v.path = null;
    } else v.dir = "down";
    return;
  }
  const tx = v.path[v.pi] * TILE + TILE / 2;
  const ty = v.path[v.pi + 1] * TILE + TILE / 2 + 6;
  const dx = tx - v.x;
  const dy = ty - v.y;
  const d = Math.hypot(dx, dy);
  const sp = WALK_SPEED * 0.55 * dt;
  if (d <= sp) {
    v.x = tx;
    v.y = ty;
    v.pi += 2;
  } else {
    v.x += (dx / d) * sp;
    v.y += (dy / d) * sp;
  }
  v.dir = dirFrom(dx, dy, v.dir);
  v.moving = true;
  v.walkT += dt;
}

export function drawVillager(ctx, v, sx, sy, z, t) {
  const sd = spriteDir(v.dir);
  const fi = v.moving ? WALK_CYCLE[Math.floor(v.walkT * 7) % 4] : 0;
  const bob = v.moving && fi ? 1.2 : Math.sin(t * 2 + v.x) * 0.35;
  shadow(ctx, sx, sy, 11, 4, z);
  const f = v.frames[sd][fi];
  blit(ctx, f.key, f.sprite, sx, sy - bob * z, z, t, v.dir === "left");
}

// ── Chickens ────────────────────────────────────────────────────────────────

export function createChicken(x, y) {
  return { x, y, hx: x, hy: y, tx: x, ty: y, dir: "right", peck: 0, wait: Math.random() * 2 };
}

export function updateChicken(c, lv, dt) {
  c.wait -= dt;
  if (c.wait <= 0) {
    c.tx = c.hx + (Math.random() - 0.5) * TILE * 4;
    c.ty = c.hy + Math.random() * TILE * 2.5;
    c.wait = 2 + Math.random() * 3;
    c.peck = Math.random() < 0.4 ? 1.2 : 0;
  }
  if (c.peck > 0) {
    c.peck -= dt;
    return;
  }
  const dx = c.tx - c.x;
  const dy = c.ty - c.y;
  const d = Math.hypot(dx, dy);
  if (d > 2) {
    const sp = TILE * 1.2 * dt;
    moveBox(lv, c, (dx / d) * sp, (dy / d) * sp, 5, 3);
    if (Math.abs(dx) > 1) c.dir = dx > 0 ? "right" : "left";
  }
}

export function drawChicken(ctx, c, sx, sy, z, t) {
  const fr = c.peck > 0 && Math.sin(t * 14) > 0 ? 1 : 0;
  shadow(ctx, sx, sy, 7, 2.5, z);
  blit(ctx, CK[fr], (CS[fr] ??= chickenSpr(fr)), sx, sy, z, t, c.dir === "left");
}
