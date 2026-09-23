/**
 * Axis-separated box movement against a level's blocked tiles. Actors are
 * a small box around their feet (hw × hh half-extents). Brushing a corner
 * nudges the actor sideways so trunks and fence ends do not snag.
 */

import { TILE } from "../config.js";

function hits(lv, x, y, hw, hh, mounted) {
  const x0 = Math.floor((x - hw) / TILE);
  const x1 = Math.floor((x + hw - 0.01) / TILE);
  const y0 = Math.floor((y - hh) / TILE);
  const y1 = Math.floor((y + hh - 0.01) / TILE);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (lv.blocked(tx, ty, mounted)) return true;
  return false;
}

/** Move `a` ({x, y}) by (dx, dy); returns true if it was stopped on any axis. */
export function moveBox(lv, a, dx, dy, hw = 8, hh = 5, mounted = false) {
  let stopped = false;
  if (dx) {
    if (!hits(lv, a.x + dx, a.y, hw, hh, mounted)) a.x += dx;
    else {
      stopped = true;
      const n = Math.abs(dx) * 0.8;
      if (!dy && !hits(lv, a.x + dx, a.y - hh * 1.6, hw, hh, mounted) && !hits(lv, a.x, a.y - n, hw, hh, mounted)) a.y -= n;
      else if (!dy && !hits(lv, a.x + dx, a.y + hh * 1.6, hw, hh, mounted) && !hits(lv, a.x, a.y + n, hw, hh, mounted)) a.y += n;
    }
  }
  if (dy) {
    if (!hits(lv, a.x, a.y + dy, hw, hh, mounted)) a.y += dy;
    else {
      stopped = true;
      const n = Math.abs(dy) * 0.8;
      if (!dx && !hits(lv, a.x - hw * 1.6, a.y + dy, hw, hh, mounted) && !hits(lv, a.x - n, a.y, hw, hh, mounted)) a.x -= n;
      else if (!dx && !hits(lv, a.x + hw * 1.6, a.y + dy, hw, hh, mounted) && !hits(lv, a.x + n, a.y, hw, hh, mounted)) a.x += n;
    }
  }
  return stopped;
}

export const boxFree = (lv, x, y, hw = 8, hh = 5) => !hits(lv, x, y, hw, hh, false);
