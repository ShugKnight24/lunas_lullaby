/** Follow camera with a deadzone, smoothing and level-bounds clamping. */

import { TILE } from "../config.js";

export function createCamera() {
  return { x: 0, y: 0, z: 1.5, dzx: 36, dzy: 24 };
}

/** Snap onto a target (level change, load). */
export function snapCamera(cam, lv, tx, ty, view) {
  cam.x = tx;
  cam.y = ty;
  clampCamera(cam, lv, view);
}

export function updateCamera(cam, lv, tx, ty, view, dt) {
  let gx = cam.x;
  let gy = cam.y;
  if (tx < cam.x - cam.dzx) gx = tx + cam.dzx;
  else if (tx > cam.x + cam.dzx) gx = tx - cam.dzx;
  if (ty < cam.y - cam.dzy) gy = ty + cam.dzy;
  else if (ty > cam.y + cam.dzy) gy = ty - cam.dzy;
  const k = 1 - Math.exp(-dt * 8);
  cam.x += (gx - cam.x) * k;
  cam.y += (gy - cam.y) * k;
  clampCamera(cam, lv, view);
}

function clampCamera(cam, lv, view) {
  const hw = view.w / cam.z / 2;
  const hh = view.h / cam.z / 2;
  const W = lv.w * TILE;
  const H = lv.h * TILE;
  cam.x = W <= hw * 2 ? W / 2 : Math.min(W - hw, Math.max(hw, cam.x));
  cam.y = H <= hh * 2 ? H / 2 : Math.min(H - hh, Math.max(hh, cam.y));
}
