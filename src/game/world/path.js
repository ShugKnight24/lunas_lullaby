/**
 * Breadth-first tile paths for villagers and a stuck pet. Runs only when a
 * goal changes, so its small allocations stay off the frame loop.
 */

const DIRS = [1, 0, -1, 0, 0, 1, 0, -1];

/** Tile path from (sx, sy) to (gx, gy) as a flat [x0, y0, x1, y1, …] or null. */
export function findPath(lv, sx, sy, gx, gy, limit = 6000) {
  if (sx === gx && sy === gy) return [];
  const w = lv.w;
  const prev = new Int32Array(w * lv.h).fill(-1);
  const start = sy * w + sx;
  const goal = gy * w + gx;
  prev[start] = start;
  const q = [start];
  for (let head = 0; head < q.length && head < limit; head++) {
    const c = q[head];
    if (c === goal) break;
    const cx = c % w;
    const cy = (c / w) | 0;
    for (let d = 0; d < 8; d += 2) {
      const nx = cx + DIRS[d];
      const ny = cy + DIRS[d + 1];
      if (!lv.inside(nx, ny)) continue;
      const n = ny * w + nx;
      if (prev[n] !== -1) continue;
      if (n !== goal && lv.blocked(nx, ny)) continue;
      prev[n] = c;
      q.push(n);
    }
  }
  if (prev[goal] === -1) return null;
  const out = [];
  for (let c = goal; c !== start; c = prev[c]) out.push(c % w, (c / w) | 0);
  const path = [];
  for (let i = out.length - 2; i >= 0; i -= 2) path.push(out[i], out[i + 1]);
  return path;
}
