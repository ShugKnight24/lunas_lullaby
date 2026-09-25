/**
 * Painted ground. The world is baked into CHUNK×CHUNK-tile canvases per
 * season (soft grass variation, rounded paths, sandy shores, water) and
 * blitted every frame; only the water shimmer is drawn live. Interiors bake
 * one canvas for the whole room.
 */

import { TILE, CHUNK, BAKE_PX } from "../config.js";
import { GR } from "./map.js";

const PAL = [
  { grass: "#a6d77c", g2: "#92c96c", g3: "#bfe597", moss: "#5f9e5a", forest: "#84bf66", field: "#c4a07a", path: "#ecd6a6", pathEdge: "#cdb087", sand: "#f3e0ae", water: "#74c1dc", deep: "#5eaed0", foam: "#e9f7f6", plaza: "#e2d8cf", grout: "#cfc2ba", dots: ["#ffffff", "#f7b3c8", "#fff2a0"] },
  { grass: "#82c763", g2: "#6fb656", g3: "#9ad676", moss: "#4a8a4c", forest: "#63a955", field: "#bc9870", path: "#ead3a0", pathEdge: "#c9a97d", sand: "#f3dfa8", water: "#69bcdc", deep: "#52a6cf", foam: "#e6f7f6", plaza: "#e2d8cf", grout: "#cfc2ba", dots: ["#fff2a0", "#ffffff"] },
  { grass: "#c9c46e", g2: "#d7aa5c", g3: "#bdb964", moss: "#8a7a44", forest: "#b8994f", field: "#b48e68", path: "#e6cc9c", pathEdge: "#c4a47a", sand: "#eed8a4", water: "#6ab2cc", deep: "#5698bd", foam: "#e6f2f0", plaza: "#ddd2c8", grout: "#c9bcb3", dots: ["#e8763a", "#f0b040", "#c8502e"] },
  { grass: "#edf3fa", g2: "#dde7f2", g3: "#ffffff", moss: "#cfdce6", forest: "#e2eaf4", field: "#e6e0e2", path: "#e8dfd6", pathEdge: "#d2c8c2", sand: "#f3ede2", water: "#9cc8de", deep: "#88b8d4", foam: "#ffffff", plaza: "#e4e0e2", grout: "#c8c0c4", dots: ["#ffffff", "#cfe0f0"] },
];

function hash(x, y, s) {
  let n = Math.imul(x * 374761393 + y * 668265263 + s * 2147483647, 1274126177);
  n ^= n >>> 13;
  n = Math.imul(n, 1103515245);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
}

const RADII = [0, 0, 0, 0];
/**
 * Tile blob for a ground type: a rounded rect grown by `pad`, rounded only
 * at convex outer corners so neighbouring tiles join without gaps.
 */
function blob(g, G, type, x, y, px, py, pad, r) {
  const L = G(x - 1, y) === type;
  const R = G(x + 1, y) === type;
  const U = G(x, y - 1) === type;
  const D = G(x, y + 1) === type;
  RADII[0] = L || U ? 0 : r;
  RADII[1] = R || U ? 0 : r;
  RADII[2] = R || D ? 0 : r;
  RADII[3] = L || D ? 0 : r;
  const x0 = px - (L ? 0.5 : pad);
  const y0 = py - (U ? 0.5 : pad);
  g.beginPath();
  g.roundRect(x0, y0, px + TILE + (R ? 0.5 : pad) - x0, py + TILE + (D ? 0.5 : pad) - y0, RADII);
  g.fill();
}

/**
 * Round the concave corners of a blob type: wherever a tile of another type
 * has `type` on two orthogonal sides and the diagonal, fill the corner with
 * a quarter-circle fillet so shores and path junctions curve.
 */
function fillets(g, G, type, x0, y0, x1, y1, pad, r) {
  const T = TILE;
  g.beginPath();
  for (let y = y0 - 1; y <= y1; y++) for (let x = x0 - 1; x <= x1; x++) {
    if (G(x, y) === type) continue;
    for (let c = 0; c < 4; c++) {
      const sx = c & 1 ? 1 : -1;
      const sy = c & 2 ? 1 : -1;
      if (G(x + sx, y) !== type || G(x, y + sy) !== type || G(x + sx, y + sy) !== type) continue;
      const cx = x * T + (sx > 0 ? T - pad : pad);
      const cy = y * T + (sy > 0 ? T - pad : pad);
      const ax = cx - sx * r;
      const ay = cy - sy * r;
      g.moveTo(ax, cy);
      g.lineTo(cx, cy);
      g.lineTo(cx, ay);
      g.arc(ax, ay, r, sx > 0 ? 0 : Math.PI, sy > 0 ? Math.PI / 2 : -Math.PI / 2, (sx > 0) !== (sy > 0));
      g.closePath();
    }
  }
  g.fill();
}

/** Paint tiles [x0, x1) × [y0, y1) of `lv` (world units) into `g`. */
function paintWorld(g, lv, season, x0, y0, x1, y1) {
  const p = PAL[season];
  const W = lv.w;
  const G = (x, y) => (x < 0 || y < 0 || x >= W || y >= lv.h ? GR.GRASS : lv.ground[y * W + x]);
  const T = TILE;
  const each = (type, fn) => {
    for (let y = y0 - 1; y <= y1; y++) for (let x = x0 - 1; x <= x1; x++) if (G(x, y) === type) fn(x * T, y * T, x, y);
  };
  g.fillStyle = p.grass;
  g.fillRect(x0 * T, y0 * T, (x1 - x0) * T, (y1 - y0) * T);
  // Forest floor: darker grass painted as soft blobs.
  g.fillStyle = p.forest;
  each(GR.FOREST, (px, py, x, y) => blob(g, G, GR.FOREST, x, y, px, py, 4, 14));
  // Deep moss (the Wildwood): darker still.
  g.fillStyle = p.moss;
  each(GR.MOSS, (px, py, x, y) => blob(g, G, GR.MOSS, x, y, px, py, 5, 15));
  // Grass variation: overlapping soft blotches, tufts and seasonal dots.
  for (let y = y0 - 1; y <= y1; y++) for (let x = x0 - 1; x <= x1; x++) {
    const t = G(x, y);
    if (t !== GR.GRASS && t !== GR.FOREST && t !== GR.MOSS) continue;
    const px = x * T;
    const py = y * T;
    for (let k = 0; k < 2; k++) {
      const h = hash(x, y, k + 1);
      g.globalAlpha = 0.45;
      g.fillStyle = h < 0.5 ? p.g2 : p.g3;
      g.beginPath();
      g.ellipse(px + hash(x, y, k + 7) * T, py + hash(x, y, k + 9) * T, 6 + h * 10, 4 + h * 6, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 0.55;
    g.strokeStyle = p.g2;
    g.lineWidth = 1.3;
    g.lineCap = "round";
    if (hash(x, y, 3) < 0.6) {
      const tx = px + hash(x, y, 4) * 26 + 3;
      const ty = py + hash(x, y, 5) * 26 + 4;
      g.beginPath();
      g.moveTo(tx - 3, ty - 4);
      g.lineTo(tx - 1, ty);
      g.lineTo(tx + 1, ty - 5);
      g.moveTo(tx + 1, ty);
      g.lineTo(tx + 4, ty - 3);
      g.stroke();
    }
    g.globalAlpha = 1;
    if (hash(x, y, 6) < (season === 3 ? 0.25 : 0.12)) {
      const d = p.dots[Math.floor(hash(x, y, 8) * p.dots.length)];
      const dx = px + hash(x, y, 10) * 24 + 4;
      const dy = py + hash(x, y, 11) * 24 + 4;
      g.fillStyle = d;
      g.beginPath();
      if (season === 2) g.ellipse(dx, dy, 2.6, 1.4, hash(x, y, 12) * 3, 0, Math.PI * 2);
      else g.arc(dx, dy, season === 3 ? 1.2 : 1.8, 0, Math.PI * 2);
      g.fill();
      if (season === 0 || season === 1) {
        g.fillStyle = "#f6c048";
        g.beginPath();
        g.arc(dx, dy, 0.7, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
  // Field soil.
  g.fillStyle = p.field;
  each(GR.FIELD, (px, py, x, y) => blob(g, G, GR.FIELD, x, y, px, py, 2, 12));
  fillets(g, G, GR.FIELD, x0, y0, x1, y1, 2, 10);
  g.fillStyle = "rgba(90,50,30,0.12)";
  each(GR.FIELD, (px, py, x, y) => {
    g.beginPath();
    g.arc(px + hash(x, y, 2) * T, py + hash(x, y, 3) * T, 1.6, 0, Math.PI * 2);
    g.arc(px + hash(x, y, 4) * T, py + hash(x, y, 5) * T, 1.2, 0, Math.PI * 2);
    g.fill();
  });
  // Sand, then foam ring, then water.
  g.fillStyle = p.sand;
  each(GR.SAND, (px, py, x, y) => blob(g, G, GR.SAND, x, y, px, py, 5, 16));
  fillets(g, G, GR.SAND, x0, y0, x1, y1, 5, 12);
  each(GR.WATER, (px, py, x, y) => blob(g, G, GR.WATER, x, y, px, py, 6, 16));
  fillets(g, G, GR.WATER, x0, y0, x1, y1, 6, 12);
  g.fillStyle = p.foam;
  each(GR.WATER, (px, py, x, y) => blob(g, G, GR.WATER, x, y, px, py, 1, 14));
  fillets(g, G, GR.WATER, x0, y0, x1, y1, 1, 12);
  g.fillStyle = p.water;
  each(GR.WATER, (px, py, x, y) => blob(g, G, GR.WATER, x, y, px, py, -2, 12));
  fillets(g, G, GR.WATER, x0, y0, x1, y1, -2, 12);
  g.fillStyle = p.deep;
  each(GR.WATER, (px, py, x, y) => {
    if (G(x - 1, y) === GR.WATER && G(x + 1, y) === GR.WATER && G(x, y - 1) === GR.WATER && G(x, y + 1) === GR.WATER) rr(g, px - 6, py - 4, T + 12, T + 8, 14);
  });
  // Paths: darker edge then the lighter walking surface and pebbles.
  g.fillStyle = p.pathEdge;
  each(GR.PATH, (px, py, x, y) => blob(g, G, GR.PATH, x, y, px, py, 3, 13));
  fillets(g, G, GR.PATH, x0, y0, x1, y1, 3, 10);
  g.fillStyle = p.path;
  each(GR.PATH, (px, py, x, y) => blob(g, G, GR.PATH, x, y, px, py, 0, 11));
  fillets(g, G, GR.PATH, x0, y0, x1, y1, 0, 10);
  g.fillStyle = p.pathEdge;
  each(GR.PATH, (px, py, x, y) => {
    if (hash(x, y, 20) < 0.5) {
      g.beginPath();
      g.ellipse(px + 6 + hash(x, y, 21) * 20, py + 6 + hash(x, y, 22) * 20, 2.2, 1.5, 0, 0, Math.PI * 2);
      g.fill();
    }
  });
  // Plaza stones.
  g.fillStyle = p.grout;
  each(GR.PLAZA, (px, py, x, y) => blob(g, G, GR.PLAZA, x, y, px, py, 2, 10));
  each(GR.PLAZA, (px, py, x, y) => {
    for (let k = 0; k < 4; k++) {
      const sx = px + (k & 1) * 16 + 1.5;
      const sy = py + (k >> 1) * 16 + 1.5;
      const h = hash(x, y, 30 + k);
      g.fillStyle = h < 0.33 ? p.plaza : h < 0.66 ? "#e8dfd7" : "#dbd0c7";
      if (season === 3) g.fillStyle = "#eeeaec";
      rr(g, sx, sy, 14, 14, 5);
    }
  });
  // Wooden bridge / pier planks.
  each(GR.WOOD, (px, py, x, y) => {
    g.fillStyle = "#b98553";
    g.fillRect(px - 0.5, py - 0.5, T + 1, T + 1);
    g.fillStyle = "#cf9a63";
    const along = G(x - 1, y) === GR.WOOD || G(x + 1, y) === GR.WOOD;
    for (let k = 0; k < 4; k++) {
      if (along && G(x, y - 1) !== GR.WOOD && G(x, y + 1) !== GR.WOOD) g.fillRect(px + k * 8 + 1, py + 1, 6.5, T - 2);
      else if (along) g.fillRect(px + k * 8 + 1, py, 6.5, T);
      else g.fillRect(px, py + k * 8 + 1, T, 6.5);
    }
    if (season === 3) {
      g.fillStyle = "rgba(255,255,255,0.55)";
      g.fillRect(px, py + hash(x, y, 40) * 20, T, 5);
    }
  });
  // Winter: pale ice sheen on the water.
  if (season === 3) {
    g.strokeStyle = "rgba(255,255,255,0.6)";
    g.lineWidth = 1.2;
    each(GR.WATER, (px, py, x, y) => {
      if (hash(x, y, 50) < 0.3) {
        g.beginPath();
        g.moveTo(px + 6, py + 10 + hash(x, y, 51) * 12);
        g.lineTo(px + 16, py + 8 + hash(x, y, 52) * 16);
        g.lineTo(px + 26, py + 12 + hash(x, y, 53) * 10);
        g.stroke();
      }
    });
  }
}

/** Chunk cache for one outdoor level and season. */
export class GroundCache {
  constructor(lv) {
    this.lv = lv;
    this.season = -1;
    this.chunks = new Map(); // chunk index -> { canvas, used, version }
    this.cw = Math.ceil(lv.w / CHUNK);
  }

  setSeason(s) {
    if (s === this.season) return;
    this.season = s;
    this.release();
  }

  release() {
    for (const c of this.chunks.values()) c.canvas.width = 0;
    this.chunks.clear();
  }

  /** Force re-bake of the chunk holding tile (tx, ty) (ground edits). */
  dirty(tx, ty) {
    const k = Math.floor(ty / CHUNK) * this.cw + Math.floor(tx / CHUNK);
    const c = this.chunks.get(k);
    if (c) c.stale = true;
  }

  get(cx, cy, now) {
    const k = cy * this.cw + cx;
    let c = this.chunks.get(k);
    if (!c || c.stale) {
      const px = CHUNK * TILE * BAKE_PX;
      const canvas = c?.canvas ?? document.createElement("canvas");
      canvas.width = canvas.height = px;
      const g = canvas.getContext("2d");
      g.setTransform(BAKE_PX, 0, 0, BAKE_PX, -cx * CHUNK * TILE * BAKE_PX, -cy * CHUNK * TILE * BAKE_PX);
      paintWorld(g, this.lv, this.season, cx * CHUNK, cy * CHUNK, (cx + 1) * CHUNK, (cy + 1) * CHUNK);
      c = { canvas, used: now, stale: false };
      this.chunks.set(k, c);
      if (this.chunks.size > 28) this.evict();
    }
    c.used = now;
    return c.canvas;
  }

  evict() {
    let oldK = -1;
    let old = Infinity;
    for (const [k, c] of this.chunks) if (c.used < old) (old = c.used), (oldK = k);
    const c = this.chunks.get(oldK);
    c.canvas.width = 0;
    this.chunks.delete(oldK);
  }
}

/** Whole-room bake for an interior: floorboards, papered back wall, window, mat. */
export function bakeInterior(lv) {
  const r = lv.room;
  const T = TILE;
  const c = document.createElement("canvas");
  c.width = lv.w * T * BAKE_PX;
  c.height = lv.h * T * BAKE_PX;
  const g = c.getContext("2d");
  g.scale(BAKE_PX, BAKE_PX);
  g.fillStyle = "#3a2530";
  g.fillRect(0, 0, lv.w * T, lv.h * T);
  // Floor
  for (let y = 2; y < lv.h - 1; y++) for (let x = 1; x < lv.w - 1; x++) {
    for (let k = 0; k < 2; k++) {
      const h = hash(x, y, k);
      g.fillStyle = h < 0.33 ? r.floor : h < 0.66 ? shade(r.floor, 8) : shade(r.floor, -8);
      g.fillRect(x * T, y * T + k * 16, T, 15);
    }
    g.fillStyle = "rgba(58,37,48,0.25)";
    g.fillRect(x * T + ((y * 13) % 24) + 4, y * T, 1, 15);
    g.fillRect(x * T + ((y * 7) % 20) + 8, y * T + 16, 1, 15);
  }
  // Back wall: wallpaper stripes, trim, baseboard.
  const wy = T * 0.5;
  g.fillStyle = r.wall;
  g.fillRect(T, wy, (lv.w - 2) * T, 1.5 * T);
  g.fillStyle = "rgba(255,255,255,0.35)";
  for (let x = T; x < (lv.w - 1) * T; x += 12) g.fillRect(x, wy, 5, 1.5 * T);
  g.fillStyle = r.trim;
  g.fillRect(T, 2 * T - 7, (lv.w - 2) * T, 7);
  g.fillRect(T, wy, (lv.w - 2) * T, 5);
  // Windows on the back wall.
  for (const wx of [2.5, lv.w - 3.5]) {
    g.fillStyle = "#fff8ec";
    g.beginPath();
    g.roundRect(wx * T - 3, wy + 9, 30, 26, 5);
    g.fill();
    g.fillStyle = "#a8daf0";
    g.beginPath();
    g.roundRect(wx * T, wy + 12, 24, 20, 4);
    g.fill();
    g.fillStyle = "rgba(255,255,255,0.6)";
    g.fillRect(wx * T + 3, wy + 14, 4, 16);
    g.fillStyle = "#fff8ec";
    g.fillRect(wx * T + 11, wy + 12, 2, 20);
  }
  // Floor shading under the wall and a door mat at the exit.
  const grad = g.createLinearGradient(0, 2 * T, 0, 2 * T + 18);
  grad.addColorStop(0, "rgba(58,37,48,0.3)");
  grad.addColorStop(1, "rgba(58,37,48,0)");
  g.fillStyle = grad;
  g.fillRect(T, 2 * T, (lv.w - 2) * T, 18);
  g.fillStyle = "#c8664f";
  g.beginPath();
  g.roundRect(r.exit.tx * T - 6, r.exit.ty * T - 10, T + 12, T - 6, 8);
  g.fill();
  g.fillStyle = "#e8a08a";
  g.fillRect(r.exit.tx * T, r.exit.ty * T - 4, T, 3);
  return c;
}

function shade(hex, d) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, v + d));
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

/** Live water shimmer over visible water tiles. */
export function drawShimmer(ctx, lv, x0, y0, x1, y1, ox, oy, z, t, season) {
  ctx.strokeStyle = season === 3 ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.55)";
  ctx.lineWidth = Math.max(1, 1.4 * z);
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (!lv.isWater(x, y)) continue;
    const h = hash(x, y, 60);
    const ph = t * (0.8 + h * 0.6) + h * 20;
    const a = Math.sin(ph);
    if (a < 0.2) continue;
    const sx = ox + (x * TILE + 6 + h * 14 + Math.sin(ph * 0.5) * 3) * z;
    const sy = oy + (y * TILE + 8 + hash(x, y, 61) * 16) * z;
    const len = (4 + a * 6) * z;
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx + len / 2, sy - 2 * z, sx + len, sy);
  }
  ctx.stroke();
}
