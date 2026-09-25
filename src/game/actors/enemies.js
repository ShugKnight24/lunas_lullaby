/**
 * Wildwood creatures: creation, per-kind behaviour (small state machines)
 * and drawing. Positions are world units at the feet, like every actor.
 * Combat outcomes (damage, drops, quests) live in combat.js; this module
 * only moves creatures and says when they attack, through `hooks`:
 *   hooks.shoot(e, kind, x, y, vx, vy)   an orb or spore cloud
 *   hooks.roots(e, n)                    boss: roots erupt under targets
 *   hooks.summon(e)                      boss: call slimes
 */

import { TILE } from "../config.js";
import { MONSTERS } from "../data/monsters.js";
import { moveBox } from "../world/collide.js";
import { drawSvgSprite } from "../../engine/sprite.js";
import { DEFS, enemySpr } from "../art/index.js";

const OPT = { alpha: 1, flip: false, cap: 512 };
const BOX = { slime: [8, 5], boar: [12, 6], shroom: [7, 5], wisp: [6, 4], gloomroot: [30, 14] };

let nextId = 1;

export function createEnemy(type, x, y) {
  const def = MONSTERS[type];
  const [hw, hh] = BOX[def.ai === "hop" ? "slime" : type] ?? [8, 5];
  return {
    id: nextId++,
    type,
    def,
    x,
    y,
    hx: x,
    hy: y,
    vx: 0,
    vy: 0,
    kx: 0,
    ky: 0,
    hw,
    hh,
    hp: def.hp,
    max: def.hp,
    state: "idle",
    t: Math.random() * 1.5,
    cd: 1 + Math.random(),
    dir: "down",
    flip: false,
    frame: 0,
    flash: 0,
    stun: 0,
    hitBy: -1,
    alive: true,
    dying: 0,
    phase: 0,
    hurtShow: 0,
  };
}

const dist2 = (a, x, y) => (a.x - x) ** 2 + (a.y - y) ** 2;

/** Nearest target (player or companion) the creature can see. */
function pickTarget(e, targets) {
  let best = null;
  let bd = (e.def.sight * TILE) ** 2;
  for (const t of targets) {
    if (!t.alive) continue;
    const d = dist2(e, t.x, t.y);
    if (d < bd) (bd = d), (best = t);
  }
  return best;
}

function face(e, dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) {
    e.dir = "side";
    e.flip = dx < 0;
  } else e.dir = dy < 0 ? "up" : "down";
}

/** One creature, one frame. `targets` are `{ x, y, alive }` (player, companion). */
export function updateEnemy(e, lv, targets, dt, hooks) {
  if (e.flash > 0) e.flash -= dt;
  if (e.squash > 0) e.squash -= dt;
  if (e.hurtShow > 0) e.hurtShow -= dt;
  if (!e.alive) {
    e.dying -= dt;
    return;
  }
  // Knockback always resolves first, and cancels a hop in flight.
  if (e.kx || e.ky) {
    moveBox(lv, e, e.kx * dt, e.ky * dt, e.hw, e.hh);
    const k = Math.exp(-dt * 10);
    e.kx *= k;
    e.ky *= k;
    if (Math.abs(e.kx) + Math.abs(e.ky) < 8) e.kx = e.ky = 0;
  }
  if (e.stun > 0) {
    e.stun -= dt;
    e.frame = 0;
    return;
  }
  const tgt = pickTarget(e, targets);
  switch (e.def.ai) {
    case "hop":
      return hop(e, lv, tgt, dt);
    case "charge":
      return charge(e, lv, tgt, dt);
    case "spore":
      return spore(e, lv, tgt, dt, hooks);
    case "shoot":
      return shoot(e, lv, tgt, dt, hooks);
    case "boss":
      return boss(e, lv, tgt, targets, dt, hooks);
  }
}

/** Is it in the air (only then does a slime deal full contact damage)? */
export const airborne = (e) => e.state === "air";

/** Slimes: rest, squash, leap toward you (or somewhere random), land. */
function hop(e, lv, tgt, dt) {
  e.t -= dt;
  if (e.state === "idle") {
    e.frame = 0;
    if (e.t > 0) return;
    e.state = "wind";
    e.t = 0.22;
    return;
  }
  if (e.state === "wind") {
    e.frame = 1;
    if (e.t > 0) return;
    let dx;
    let dy;
    if (tgt) (dx = tgt.x - e.x), (dy = tgt.y - e.y);
    else (dx = e.hx + (Math.random() - 0.5) * TILE * 4 - e.x), (dy = e.hy + (Math.random() - 0.5) * TILE * 4 - e.y);
    const d = Math.hypot(dx, dy) || 1;
    const sp = e.def.speed * TILE * (tgt ? 1 : 0.5);
    e.vx = (dx / d) * sp;
    e.vy = (dy / d) * sp;
    e.flip = dx < 0;
    e.state = "air";
    e.t = 0.36;
    return;
  }
  if (e.state === "air") {
    e.frame = 2;
    moveBox(lv, e, e.vx * dt, e.vy * dt, e.hw, e.hh);
    if (e.t > 0) return;
    e.state = "land";
    e.t = 0.1;
    return;
  }
  e.frame = 1;
  if (e.t > 0) return;
  e.state = "idle";
  e.t = tgt ? 0.35 + Math.random() * 0.4 : 1 + Math.random() * 1.5;
}

/** Thornbacks: amble, spot you, lower the head, charge in a straight line; a wall stuns them. */
function charge(e, lv, tgt, dt) {
  e.t -= dt;
  e.cd -= dt;
  if (e.state === "charge") {
    e.frame = 2;
    const stopped = moveBox(lv, e, e.vx * dt, e.vy * dt, e.hw, e.hh);
    if (stopped || e.t <= 0) {
      e.state = "idle";
      e.t = 0.8;
      e.cd = 1.4;
      if (stopped) {
        e.stun = 1.6;
        e.bonked = 0.4;
      }
    }
    return;
  }
  if (e.state === "wind") {
    e.frame = 2;
    if (e.t > 0) return;
    e.state = "charge";
    e.t = 1.3;
    return;
  }
  if (tgt && e.cd <= 0) {
    const dx = tgt.x - e.x;
    const dy = tgt.y - e.y;
    // Charges run along the main axis, so there's always a clean step aside.
    const horiz = Math.abs(dx) > Math.abs(dy);
    const sp = TILE * 7.2;
    e.vx = horiz ? Math.sign(dx) * sp : 0;
    e.vy = horiz ? 0 : Math.sign(dy) * sp;
    face(e, e.vx, e.vy);
    e.state = "wind";
    e.t = 0.65;
    return;
  }
  walk(e, lv, tgt, dt, tgt ? 0.8 : 0.5);
}

/** Wander near home, or step toward a target. */
function walk(e, lv, tgt, dt, mult) {
  if (e.t <= 0) {
    e.t = 1.2 + Math.random() * 1.6;
    const a = Math.random() * Math.PI * 2;
    e.wx = Math.cos(a);
    e.wy = Math.sin(a);
    if (dist2(e, e.hx, e.hy) > (TILE * 5) ** 2) {
      const d = Math.sqrt(dist2(e, e.hx, e.hy));
      e.wx = (e.hx - e.x) / d;
      e.wy = (e.hy - e.y) / d;
    }
    e.pause = Math.random() < 0.3;
  }
  let dx = e.wx ?? 0;
  let dy = e.wy ?? 0;
  if (tgt) {
    const d = Math.sqrt(dist2(e, tgt.x, tgt.y)) || 1;
    dx = (tgt.x - e.x) / d;
    dy = (tgt.y - e.y) / d;
  } else if (e.pause) {
    e.frame = 0;
    return;
  }
  const sp = e.def.speed * TILE * mult * dt;
  moveBox(lv, e, dx * sp, dy * sp, e.hw, e.hh);
  face(e, dx, dy);
  e.walkT = (e.walkT ?? 0) + dt;
  e.frame = Math.floor(e.walkT * 6) % 2;
}

/** Shroomlings: waddle closer, puff a spore cloud when you're near. */
function spore(e, lv, tgt, dt, hooks) {
  e.t -= dt;
  e.cd -= dt;
  if (e.state === "puff") {
    e.frame = 2;
    if (e.t > 0) return;
    hooks.shoot(e, "spore", e.x, e.y - 8, 0, 0);
    e.state = "idle";
    e.cd = 2.2;
    return;
  }
  if (tgt && e.cd <= 0 && dist2(e, tgt.x, tgt.y) < (TILE * 2.2) ** 2) {
    e.state = "puff";
    e.t = 0.5;
    return;
  }
  walk(e, lv, tgt, dt, tgt ? 1 : 0.4);
}

/** Wisps: drift at arm's length and throw gloom. They float over brambles and roots. */
function shoot(e, lv, tgt, dt, hooks) {
  e.t -= dt;
  e.cd -= dt;
  e.bob = (e.bob ?? Math.random() * 6) + dt;
  if (e.state === "aim") {
    e.frame = 2;
    if (e.t > 0) return;
    if (tgt) {
      const d = Math.sqrt(dist2(e, tgt.x, tgt.y)) || 1;
      const sp = TILE * 5;
      hooks.shoot(e, "gloom", e.x, e.y - 18, ((tgt.x - e.x) / d) * sp, ((tgt.y - e.y) / d) * sp);
    }
    e.state = "idle";
    e.cd = 2.2 + Math.random() * 0.6;
    return;
  }
  e.frame = Math.floor(e.bob * 4) % 2;
  if (!tgt) return walk(e, lv, null, dt, 0.5);
  const d = Math.sqrt(dist2(e, tgt.x, tgt.y)) || 1;
  const ux = (tgt.x - e.x) / d;
  const uy = (tgt.y - e.y) / d;
  // Keep 3–5 tiles away, circling.
  const want = d < TILE * 3 ? -1 : d > TILE * 5 ? 1 : 0;
  const sp = e.def.speed * TILE * dt;
  const nx = e.x + (ux * want - uy * 0.6) * sp;
  const ny = e.y + (uy * want + ux * 0.6) * sp;
  if (lv.inside(Math.floor(nx / TILE), Math.floor(ny / TILE)) && !lv.wall[Math.floor(ny / TILE) * lv.w + Math.floor(nx / TILE)]) (e.x = nx), (e.y = ny);
  e.flip = ux < 0;
  if (e.cd <= 0) {
    e.state = "aim";
    e.t = 0.55;
  }
}

/**
 * The Gloomroot: rooted in place. Cycles root spikes, an orb volley and
 * summoning slimes; below half health it's enraged: faster and more of each.
 */
function boss(e, lv, tgt, targets, dt, hooks) {
  e.t -= dt;
  e.cd -= dt;
  e.enraged = e.hp < e.max / 2;
  if (!tgt) {
    e.frame = 0;
    return;
  }
  if (!e.awake) {
    e.awake = true;
    e.cd = 1.5;
    hooks.roar?.(e);
  }
  e.flip = tgt.x < e.x;
  if (e.state === "cast") {
    e.frame = 1;
    if (e.t > 0) return;
    const move = e.phase % 3;
    if (move === 0) hooks.roots(e, e.enraged ? 5 : 3);
    else if (move === 1) {
      const n = e.enraged ? 7 : 5;
      const base = Math.atan2(tgt.y - (e.y - 60), tgt.x - e.x);
      const sp = TILE * (e.enraged ? 5.5 : 4.5);
      for (let i = 0; i < n; i++) {
        const a = base + (i - (n - 1) / 2) * 0.22;
        hooks.shoot(e, "gloom", e.x, e.y - 60, Math.cos(a) * sp, Math.sin(a) * sp);
      }
    } else hooks.summon(e);
    e.phase++;
    e.state = "idle";
    e.cd = e.enraged ? 1.3 : 2.1;
    return;
  }
  e.frame = 0;
  if (e.cd <= 0) {
    e.state = "cast";
    e.t = e.enraged ? 0.45 : 0.7;
  }
}

// ── Drawing ─────────────────────────────────────────────────────────────────

export function drawEnemy(ctx, e, sx, sy, z, t) {
  const alpha = e.alive ? 1 : Math.max(0, e.dying / 0.4);
  const r = enemySpr(e.type, e.dir, e.frame, !!e.enraged);
  let lift = 0;
  if (e.def.ai === "hop" && e.state === "air") lift = Math.sin((1 - e.t / 0.36) * Math.PI) * 12;
  if (e.def.ai === "shoot") lift = Math.sin((e.bob ?? 0) * 2.4) * 2;
  // Dying creatures swell, then shrink away.
  const d = e.alive ? 1 : Math.max(0, e.dying / 0.4);
  const k = e.alive ? 1 : d > 0.7 ? 1 + (1 - d) * 1.2 : 0.2 + d * 1.1;
  // A hit squashes them flat and wide for a moment.
  const sq = e.squash > 0 ? e.squash / 0.16 : 0;
  OPT.alpha = alpha;
  OPT.flip = e.dir === "side" && e.flip;
  OPT.cap = e.def.boss ? 1024 : 512;
  ctx.save();
  ctx.translate(Math.round(sx), Math.round(sy - lift * z));
  ctx.scale(k * (1 + sq * 0.28), k * (1 - sq * 0.22));
  drawSvgSprite(ctx, r.key, r.spr, DEFS, 0, 0, z, t, OPT);
  // White flash on a hit: the same sprite again, added on top.
  if (e.flash > 0 && e.alive) {
    ctx.globalCompositeOperation = "lighter";
    OPT.alpha = Math.min(1, e.flash / 0.1);
    drawSvgSprite(ctx, r.key, r.spr, DEFS, 0, 0, z, t, OPT);
    drawSvgSprite(ctx, r.key, r.spr, DEFS, 0, 0, z, t, OPT);
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.restore();
  if (e.stun > 0 && e.alive) drawStars(ctx, sx, sy - (e.def.boss ? 150 : 38) * z, z, t);
  // A small health bar once hurt (the boss has its own on the HUD).
  if (e.alive && !e.def.boss && e.hurtShow > 0 && e.hp < e.max) {
    const w = 26 * z;
    const x = sx - w / 2;
    const y = sy - 44 * z - lift * z;
    ctx.fillStyle = "rgba(58,37,48,0.75)";
    ctx.fillRect(x - 1, y - 1, w + 2, 5 * z + 2);
    ctx.fillStyle = "#f0706a";
    ctx.fillRect(x, y, (w * e.hp) / e.max, 5 * z);
  }
}

function drawStars(ctx, x, y, z, t) {
  ctx.fillStyle = "#f6d25a";
  for (let i = 0; i < 3; i++) {
    const a = t * 5 + (i * Math.PI * 2) / 3;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * 10 * z, y + Math.sin(a) * 3 * z, 2.4 * z, 0, 6.283);
    ctx.fill();
  }
}
