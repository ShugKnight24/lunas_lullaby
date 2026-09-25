/**
 * Hawthorn Ranch's herd: cows and sheep that graze and amble inside the
 * Sunridge pasture fence. Decoration with a little life; drawn like chickens.
 */

import { TILE } from "../config.js";
import { PASTURE } from "../world/sunridge.js";
import { moveBox } from "../world/collide.js";
import { drawSvgSprite } from "../../engine/sprite.js";
import { DEFS, animalSpr } from "../art/index.js";

const OPT = { alpha: 1, flip: false, cap: 512 };
const HERD = [["cow", 8, 20], ["cow", 13, 24], ["cow", 20, 21], ["sheep", 10, 26], ["sheep", 17, 17], ["sheep", 23, 27], ["sheep", 25, 22]];

export function createHerd() {
  return HERD.map(([kind, tx, ty]) => {
    const x = tx * TILE + TILE / 2;
    const y = ty * TILE + TILE / 2;
    return { kind, x, y, tx: x, ty: y, flip: Math.random() < 0.5, graze: 0, wait: Math.random() * 3, dk: "herd" };
  });
}

export function updateHerd(herd, lv, dt) {
  const x0 = (PASTURE.x0 + 1.5) * TILE;
  const x1 = (PASTURE.x1 - 1) * TILE;
  const y0 = (PASTURE.y0 + 1.5) * TILE;
  const y1 = (PASTURE.y1 - 0.5) * TILE;
  for (const a of herd) {
    a.wait -= dt;
    if (a.wait <= 0) {
      a.tx = Math.min(x1, Math.max(x0, a.x + (Math.random() - 0.5) * TILE * 5));
      a.ty = Math.min(y1, Math.max(y0, a.y + (Math.random() - 0.5) * TILE * 3));
      a.wait = 4 + Math.random() * 5;
      a.graze = Math.random() < 0.5 ? 2 + Math.random() * 3 : 0;
    }
    if (a.graze > 0) {
      a.graze -= dt;
      continue;
    }
    const dx = a.tx - a.x;
    const dy = a.ty - a.y;
    const d = Math.hypot(dx, dy);
    if (d < 3) continue;
    const sp = TILE * (a.kind === "cow" ? 0.7 : 0.9) * dt;
    moveBox(lv, a, (dx / d) * sp, (dy / d) * sp, a.kind === "cow" ? 14 : 10, 5);
    if (Math.abs(dx) > 2) a.flip = dx < 0;
  }
}

export function drawHerd(ctx, a, sx, sy, z, t) {
  const r = animalSpr(a.kind, a.graze > 0 ? 1 : 0);
  OPT.flip = a.flip;
  drawSvgSprite(ctx, r.key, r.spr, DEFS, Math.round(sx), Math.round(sy), z, t, OPT);
}
