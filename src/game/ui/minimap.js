/**
 * Minimap (bottom-left; above the hotbar on narrow screens). The valley is
 * painted from the map data into a small offscreen canvas — ground, trees,
 * buildings, your structures and tilled soil — and rebuilt only when those
 * change. Live dots show you, your companion, the horse and villagers, with
 * a frame for what's on screen and a star for the current tutorial target.
 * Hidden places look like plain meadow until you've found them. N toggles it.
 */

import { TILE } from "../config.js";
import { GR, HIDDEN, ALL_SPOTS } from "../world/map.js";
import { BUILDINGS } from "../art/props.js";
import { STRUCTURES } from "../data/structures.js";

const INK = "#3a2530";
const GROUND = {
  [GR.GRASS]: ["#9ccc78", "#a8cc70", "#c8a860", "#e8eef4"],
  [GR.PATH]: "#e2c48e",
  [GR.PLAZA]: "#e8dccc",
  [GR.WATER]: "#6cb4dc",
  [GR.SAND]: "#ecd8a4",
  [GR.FIELD]: "#b98a5e",
  [GR.WOOD]: "#b07a4a",
  [GR.FOREST]: ["#5f9a64", "#6aa05a", "#9a8a4a", "#b8ccd4"],
  [GR.MOSS]: ["#4a8452", "#478a4c", "#86763e", "#a8bcc6"],
};
const SETTINGS_KEY = "luna_minimap";

let visible = true;
try {
  visible = localStorage.getItem(SETTINGS_KEY) !== "off";
} catch {}

export function toggleMinimap() {
  visible = !visible;
  try {
    localStorage.setItem(SETTINGS_KEY, visible ? "on" : "off");
  } catch {}
  return visible;
}

const base = { canvas: null, key: "" };

/** What the painted base depends on. */
function baseKey(g, lv) {
  const s = g.s;
  if (lv.id !== "world") return `${lv.id}|${s.clock.season}|${lv.version}`;
  const found = HIDDEN.map((h) => (s.flags.found[h.id] ? 1 : 0)).join("");
  return `${s.clock.season}|${found}|${s.structures.length}:${s.uid}|${Object.keys(s.soil).length}`;
}

function paintBase(g, lv) {
  const c = (base.canvas ??= document.createElement("canvas"));
  c.width = lv.w;
  c.height = lv.h;
  const ctx = c.getContext("2d");
  const season = g.s.clock.season;
  for (let y = 0; y < lv.h; y++)
    for (let x = 0; x < lv.w; x++) {
      const col = GROUND[lv.ground[y * lv.w + x]] ?? GROUND[GR.GRASS];
      ctx.fillStyle = Array.isArray(col) ? col[season] : col;
      ctx.fillRect(x, y, 1, 1);
    }
  // Trees and hedges as dark dots, tilled soil, then your structures.
  for (const o of lv.objects) {
    if (o.gone) continue;
    if (o.kind === "tree" || o.kind === "bush") (ctx.fillStyle = "rgba(40,90,50,0.55)"), ctx.fillRect(o.tx, o.ty, 1, 1);
    else if (o.kind === "fence") (ctx.fillStyle = "#8a5a3a"), ctx.fillRect(o.tx, o.ty, 1, 1);
  }
  if (lv.id !== "world") {
    for (const o of lv.objects) {
      if (o.kind !== "building") continue;
      const st = BUILDINGS[o.style];
      ctx.fillStyle = st.roof;
      ctx.fillRect(o.tx, o.ty, st.w, st.d);
    }
    return;
  }
  ctx.fillStyle = "#7a5238";
  for (const k in g.s.soil) ctx.fillRect(k % lv.w, Math.floor(k / lv.w), 1, 1);
  for (const st of g.s.structures) {
    const d = STRUCTURES[st.type];
    ctx.fillStyle = d.fence ? "#8a5a3a" : d.floor ? "#d4c8b8" : "#e8a25a";
    ctx.fillRect(st.tx, st.ty, d.w, d.h);
  }
  for (const b of ALL_SPOTS) {
    const st = BUILDINGS[b.style];
    ctx.fillStyle = st.roof;
    ctx.fillRect(b.tx, b.ty, st.w, st.d);
  }
  // Secrets stay secret: an unfound place is painted as ordinary meadow and trees.
  for (const h of HIDDEN) {
    if (g.s.flags.found[h.id]) continue;
    for (let y = h.y0 - 1; y <= h.y1 + 1; y++)
      for (let x = h.x0 - 1; x <= h.x1 + 1; x++) {
        ctx.fillStyle = GROUND[GR.GRASS][season];
        ctx.fillRect(x, y, 1, 1);
        if ((x * 7 + y * 13) % 9 === 0) (ctx.fillStyle = "rgba(40,90,50,0.55)"), ctx.fillRect(x, y, 1, 1);
      }
  }
}

/** The map shows whichever outdoor area you're in (or the valley, from indoors). */
export const mapLevel = (g) => (g.lv.outdoor ? g.lv : g.levels.world);

/** Screen rectangle and scale (px per tile) for the minimap. */
export function minimapRect(view, hotbar, lv) {
  const narrow = view.w < 640;
  const px = narrow ? 1.5 : 2;
  const w = Math.round(lv.w * px);
  const h = Math.round(lv.h * px);
  const y = narrow ? hotbar.y - h - 18 : view.h - h - 20;
  return { x: 16, y, w, h, px };
}

const dot = (ctx, x, y, r, fill) => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 6.283);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = INK;
  ctx.stroke();
};

/**
 * Draw it. `rect` from minimapRect, `panel(w, h, x, y)` draws the cozy frame,
 * `target` is the tutorial point in world units (or null).
 */
export function drawMinimap(ctx, g, t, rect, panel, target) {
  if (!visible) return;
  const lv = mapLevel(g);
  const key = baseKey(g, lv);
  if (key !== base.key || !base.canvas) {
    paintBase(g, lv);
    base.key = key;
  }
  const { x, y, w, h, px } = rect;
  panel(w + 12, h + 12, x - 6, y - 6);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.clip();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(base.canvas, x, y, w, h);
  const sx = (wx) => x + (wx / TILE) * px;
  const sy = (wy) => y + (wy / TILE) * px;
  const outdoors = g.lv === lv;
  // What's on screen.
  if (outdoors) {
    const vw = g.view.w / g.cam.z;
    const vh = g.view.h / g.cam.z;
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(sx(g.cam.x - vw / 2), sy(g.cam.y - vh / 2), (vw / TILE) * px, (vh / TILE) * px);
  }
  for (const v of g.villagers) if (v.level === lv.id) dot(ctx, sx(v.x), sy(v.y), 2.6, v.def.look.top);
  if (lv.id === "wildwood") for (const e of g.enemies) if (e.alive) (ctx.fillStyle = e.def.boss ? "#e8566a" : "rgba(200,70,90,0.85)"), ctx.fillRect(sx(e.x) - 1.5, sy(e.y) - 1.5, 3, 3);
  if (g.horse.level === lv.id && !g.player.mounted) dot(ctx, sx(g.horse.x), sy(g.horse.y), 2.4, "#8a5a3a");
  if (outdoors) dot(ctx, sx(g.pet.x), sy(g.pet.y), 2.2, "#f4ece0");
  if (target) {
    const tx = sx(target[0]);
    const ty = sy(target[1]);
    ctx.fillStyle = "#f6c63c";
    ctx.strokeStyle = INK;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 2 : 5;
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      ctx.lineTo(tx + Math.cos(a) * r, ty + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // You: at your door when you're indoors, pulsing gently.
  let [ptx, pty] = [g.player.x, g.player.y];
  if (!outdoors) {
    const spot = ALL_SPOTS.find((b) => b.interior === g.lv.id);
    if (spot) [ptx, pty] = [(spot.tx + BUILDINGS[spot.style].w / 2) * TILE, (spot.ty + BUILDINGS[spot.style].d) * TILE];
  }
  dot(ctx, sx(ptx), sy(pty), 3.4 + Math.sin(t * 4) * 0.6, "#e8566a");
  ctx.restore();
}
