/**
 * Frame composition: baked ground → water shimmer → flat decals (soil,
 * paths, rugs) → y-sorted sprites (objects, crops, forage, actors) → effects
 * → weather → day/night multiply grade → additive glows → build ghost → HUD
 * → fade. Draws in CSS pixels; world units map through the camera zoom.
 */

import { TILE, CHUNK } from "./config.js";
import { drawSvgSprite } from "../engine/sprite.js";
import { DEFS, soilSpr, iconSpr, iconKey, sparkleSpr, resolveObject } from "./art/index.js";
import { buildingWindows } from "./art/props.js";
import { STRUCTURES } from "./data/structures.js";
import { bakeInterior, drawShimmer } from "./world/ground.js";
import { lightAt, glowSprite } from "./world/lighting.js";
import { drawWeather, drawFx } from "./world/weather.js";
import { drawPlayer, drawPet, drawHorse, drawVillager, drawChicken } from "./actors/actors.js";
import { smoothMinute } from "./game.js";
import { drawHud } from "./ui/hud.js";

const OPT = { alpha: 1, flip: false, cap: 512 };
const list = [];
const byY = (a, b) => a.y - b.y;
/** Fertilizer fleck positions within a soil tile (art units). */
const FLECKS = [[7, 9], [20, 6], [13, 17], [24, 21], [6, 24]];
const WEATHER = ["petals", null, "leaves", null];
const ghostObj = { kind: "structure", type: "", mask: 0, key: "", spr: null };
let VW = 0;
let VH = 0;
let lastT = 0;

function vis(o, ox, oy, z) {
  const b = o.spr.box;
  const x = ox + o.x * z;
  const y = oy + o.y * z;
  return x + (b[0] + b[2]) * z > 0 && x + b[0] * z < VW && y + (b[1] + b[3]) * z > 0 && y + b[1] * z < VH;
}

// CSS colour strings cached by value so the grade and fade do not build strings every frame.
const rgbCache = new Map();
function rgb(r, g, b) {
  const k = (r << 16) | (g << 8) | b;
  let s = rgbCache.get(k);
  if (!s) {
    if (rgbCache.size > 4096) rgbCache.clear();
    s = `rgb(${r},${g},${b})`;
    rgbCache.set(k, s);
  }
  return s;
}
const FADES = Array.from({ length: 101 }, (_, i) => `rgba(44,28,38,${i / 100})`);

function blit(ctx, key, spr, x, y, z, t, alpha = 1, cap = 512) {
  OPT.alpha = alpha;
  OPT.flip = false;
  OPT.cap = cap;
  drawSvgSprite(ctx, key, spr, DEFS, Math.round(x), Math.round(y), z, t, OPT);
}

function roomCanvas(g, lv) {
  let c = g.rooms.get(lv.id);
  if (!c) {
    c = bakeInterior(lv);
    g.rooms.set(lv.id, c);
  }
  return c;
}

export function renderGame(ctx, view, g, t) {
  g.view.w = view.w;
  g.view.h = view.h;
  g.view.k = view.k;
  const wdt = Math.min(0.05, Math.max(0, t - (lastT || t)));
  lastT = t;
  const lv = g.lv;
  const z = g.cam.z;
  const T = TILE * z;
  const ox = Math.round(view.w / 2 - g.cam.x * z);
  const oy = Math.round(view.h / 2 - g.cam.y * z);
  const season = g.s.clock.season;
  ctx.fillStyle = lv.outdoor ? "#8cc06c" : "#2c1c26";
  ctx.fillRect(0, 0, view.w, view.h);

  const tx0 = Math.max(0, Math.floor(-ox / T) - 1);
  const ty0 = Math.max(0, Math.floor(-oy / T) - 1);
  const tx1 = Math.min(lv.w - 1, Math.ceil((view.w - ox) / T) + 1);
  const ty1 = Math.min(lv.h - 1, Math.ceil((view.h - oy) / T) + 1);

  // Ground
  if (lv.outdoor) {
    const cs = CHUNK * T;
    for (let cy = Math.floor(ty0 / CHUNK); cy <= Math.floor(ty1 / CHUNK); cy++) {
      for (let cx = Math.floor(tx0 / CHUNK); cx <= Math.floor(tx1 / CHUNK); cx++) {
        const c = g.ground.get(cx, cy, t);
        const x = Math.round(ox + cx * cs);
        const y = Math.round(oy + cy * cs);
        ctx.drawImage(c, x, y, Math.round(ox + (cx + 1) * cs) - x, Math.round(oy + (cy + 1) * cs) - y);
      }
    }
    drawShimmer(ctx, lv, tx0, ty0, tx1, ty1, ox, oy, z, t, season);
  } else {
    const c = roomCanvas(g, lv);
    ctx.drawImage(c, ox, oy, Math.round(lv.w * T), Math.round(lv.h * T));
  }

  // Flat decals: soil, paths, rugs, flowers, lilies.
  VW = view.w;
  VH = view.h;
  if (lv.id === "world") {
    for (const d of g.cropDraw.values()) {
      if (d.tx < tx0 || d.tx > tx1 || d.ty < ty0 || d.ty > ty1) continue;
      const wet = g.s.soil[d.idx].watered;
      blit(ctx, wet ? "soil:1" : "soil:0", soilSpr(wet), ox + d.tx * T, oy + d.ty * T, z, t);
      const fert = g.s.soil[d.idx].fert;
      if (fert) {
        // Fertilizer flecks: violet for basic, gold for deluxe.
        ctx.fillStyle = fert === 2 ? "rgba(246,198,60,0.85)" : "rgba(160,120,210,0.8)";
        for (const [fx, fy] of FLECKS) ctx.fillRect(ox + (d.tx * TILE + fx) * z, oy + (d.ty * TILE + fy) * z, 2.5 * z, 2.5 * z);
      }
    }
  }
  for (const o of lv.objects) {
    if (o.gone || !o.spr) continue;
    const flat = o.flat || o.kind === "flowers" || o.kind === "lily";
    if (!flat || !vis(o, ox, oy, z)) continue;
    if (o.flat && o.kind === "structure") blit(ctx, o.key, o.spr, ox + o.tx * T, oy + o.ty * T, z, t);
    else blit(ctx, o.key, o.spr, ox + o.x * z, oy + o.y * z, z, t);
  }
  // Target cursor for tools and seeds.
  if (g.mode === "play" && !g.player.mounted && g.s.inv[g.s.sel] && lv.inside(g.target[0], g.target[1])) {
    ctx.strokeStyle = "rgba(255,248,230,0.75)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(ox + g.target[0] * T + 2, oy + g.target[1] * T + 2, T - 4, T - 4, 8 * z);
    ctx.stroke();
  }

  // Y-sorted sprites
  list.length = 0;
  for (const o of lv.objects) {
    if (o.gone || !o.spr || o.flat || o.kind === "flowers" || o.kind === "lily") continue;
    if (vis(o, ox, oy, z)) list.push(o);
  }
  if (lv.id === "world") {
    for (const d of g.cropDraw.values()) if (d.spr && d.tx >= tx0 && d.tx <= tx1 && d.ty >= ty0 && d.ty <= ty1) list.push(d);
    for (const sp of g.spots) {
      if (sp.tx < tx0 || sp.tx > tx1 || sp.ty < ty0 || sp.ty > ty1) continue;
      const f = g.s.forage[sp.id];
      if (!f || !f.item) continue;
      sp.dk = "forage";
      sp.x = sp.tx * TILE + TILE / 2;
      sp.y = sp.ty * TILE + TILE / 2 + 6;
      sp.item = f.item;
      list.push(sp);
    }
    for (const c of g.chickens) (c.dk = "chick"), list.push(c);
    if (!g.player.mounted && g.horse.level === "world") (g.horse.dk = "horse"), list.push(g.horse);
  }
  for (const v of g.villagers) if (v.level === lv.id) (v.dk = "npc"), list.push(v);
  // In build mode the view shows the farm while the player may be indoors.
  if (g.mode !== "build" || g.build.prevLevel === lv) {
    g.pet.dk = "pet";
    g.player.dk = "player";
    list.push(g.pet, g.player);
  }
  list.sort(byY);

  const p = g.player;
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    const sx = ox + e.x * z;
    const sy = oy + e.y * z;
    switch (e.dk) {
      case "player":
        drawPlayer(ctx, e, g.horse, sx, sy, z, t);
        break;
      case "pet":
        drawPet(ctx, e, sx, sy, z, t);
        break;
      case "horse":
        drawHorse(ctx, e, sx, sy, z, t);
        break;
      case "npc":
        drawVillager(ctx, e, sx, sy, z, t);
        break;
      case "chick":
        drawChicken(ctx, e, sx, sy, z, t);
        break;
      case "crop": {
        const k = e.pop > 0 ? 1 + Math.sin((1 - e.pop / 0.4) * Math.PI) * 0.25 : 1;
        blit(ctx, e.key, e.spr, sx, sy, z * k, t);
        break;
      }
      case "forage": {
        const bob = Math.sin(t * 2.4 + e.id) * 1.5;
        ctx.fillStyle = "rgba(58,37,48,0.18)";
        ctx.beginPath();
        ctx.ellipse(sx, sy, 8 * z, 3 * z, 0, 0, 6.283);
        ctx.fill();
        blit(ctx, iconKey(e.item), iconSpr(e.item), sx, sy - (12 + bob) * z, z * 0.72, t);
        blit(ctx, "sparkle", sparkleSpr(), sx + 9 * z, sy - 22 * z, z * 0.8, t + e.id);
        break;
      }
      default: {
        let x = sx;
        if (e.shake > 0) x += Math.sin(e.shake * 60) * e.shake * 10 * z;
        let a = 1;
        // See the player through canopies and roofs they walk behind.
        if ((e.kind === "tree" && !e.stump) || e.kind === "building" || e.type === "coop") {
          const hw = e.kind === "tree" ? 40 : e.w * 16;
          const top = e.kind === "tree" ? 120 : e.h * 32 + 60;
          if (p.y < e.y - 4 && p.y > e.y - top && Math.abs(p.x - e.x) < hw) a = 0.5;
        }
        blit(ctx, e.key, e.spr, x, sy, z, t, a, e.kind === "building" || e.type === "coop" ? 1024 : 512);
      }
    }
  }

  drawFx(ctx, ox, oy, z);
  if (g.mode === "fishing") drawBobber(ctx, g, ox, oy, z, t);

  // Weather and grade (outdoors).
  if (lv.outdoor) {
    const w = g.s.weather;
    drawWeather(ctx, view, w === "rain" ? "rain" : w === "snow" || season === 3 ? "snow" : WEATHER[season], wdt, t, g.cam.x, g.cam.y, z);
  }
  const L = lightAt(smoothMinute(g));
  let r = L.r;
  let gg = L.g;
  let b = L.b;
  let dark = L.dark;
  if (!lv.outdoor) {
    r = 255;
    gg = 238 - dark * 20;
    b = 222 - dark * 40;
    dark = 0.25 + dark * 0.4;
  } else if (g.s.weather === "rain") {
    r *= 0.82;
    gg *= 0.86;
    b *= 0.95;
    dark = Math.max(dark, 0.12);
  }
  if (r < 254 || gg < 254 || b < 254) {
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = rgb(r | 0, gg | 0, b | 0);
    ctx.fillRect(0, 0, view.w, view.h);
    ctx.globalCompositeOperation = "source-over";
  }
  if (dark > 0.1) drawGlows(ctx, g, lv, ox, oy, z, t, dark);

  if (g.mode === "build") drawGhost(ctx, g, ox, oy, z, t);
  drawHud(ctx, view, g, t, ox, oy, z);

  if (g.fade.a > 0.001) {
    ctx.fillStyle = FADES[Math.round(g.fade.a * 100)];
    ctx.fillRect(0, 0, view.w, view.h);
  }
}

function drawGlows(ctx, g, lv, ox, oy, z, t, dark) {
  const gs = glowSprite();
  const panes = dark * 0.9;
  ctx.globalCompositeOperation = "lighter";
  for (const o of lv.objects) {
    if (o.gone) continue;
    let x = 0;
    let y = 0;
    let r = 0;
    if (o.kind === "lamp") {
      x = o.x;
      y = o.y - 52;
      r = 90;
    } else if (o.kind === "furniture" && o.name === "fireplace") {
      x = o.x;
      y = o.y - 10;
      r = 110 + Math.sin(t * 9) * 6;
    } else if (o.kind === "building" || o.type === "coop") {
      if (!o.windows) o.windows = buildingWindows(o.style);
      for (let i = 0; i < o.windows.length; i++) {
        const win = o.windows[i];
        const ww = win[2];
        const wh = win[3];
        const sx = ox + (o.x + win[0]) * z;
        const sy = oy + (o.y + win[1]) * z;
        if (sx > g.view.w + 100 || sx < -100 || sy < -100 || sy > g.view.h + 100) continue;
        ctx.globalAlpha = panes * 0.8;
        ctx.fillStyle = "#ffcf7a";
        ctx.fillRect(sx, sy, ww * z, wh * z);
        ctx.globalAlpha = dark * 0.55;
        const rr = 46 * z;
        ctx.drawImage(gs, sx + (ww * z) / 2 - rr, sy + (wh * z) / 2 - rr * 0.6, rr * 2, rr * 1.6);
      }
      continue;
    } else continue;
    const sx = ox + x * z;
    const sy = oy + y * z;
    const rr = r * z;
    if (sx < -rr || sx > g.view.w + rr || sy < -rr || sy > g.view.h + rr) continue;
    ctx.globalAlpha = Math.min(1, dark * 1.1);
    ctx.drawImage(gs, sx - rr, sy - rr, rr * 2, rr * 2);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

function drawGhost(ctx, g, ox, oy, z, t) {
  const b = g.build;
  const T = TILE * z;
  if (b.mode !== "place" && !b.moving) {
    ctx.fillStyle = b.valid ? "rgba(240,90,110,0.35)" : "rgba(255,255,255,0.18)";
    ctx.fillRect(ox + b.tx * T, oy + b.ty * T, T, T);
    return;
  }
  const type = b.moving ? b.moving.type : b.type;
  const def = STRUCTURES[type];
  ctx.fillStyle = b.valid ? "rgba(120,220,140,0.35)" : "rgba(240,90,110,0.4)";
  ctx.strokeStyle = b.valid ? "rgba(60,150,80,0.9)" : "rgba(190,50,70,0.9)";
  ctx.lineWidth = 2;
  for (let y = 0; y < def.h; y++) for (let x = 0; x < def.w; x++) {
    ctx.beginPath();
    ctx.roundRect(ox + (b.tx + x) * T + 2, oy + (b.ty + y) * T + 2, T - 4, T - 4, 6);
    ctx.fill();
    ctx.stroke();
  }
  if (ghostObj.type !== type) {
    ghostObj.type = type;
    ghostObj.mask = 3;
    resolveObject(ghostObj, g.s.clock.season);
  }
  const gx = def.floor ? ox + b.tx * T : ox + (b.tx + def.w / 2) * T;
  const gy = def.floor ? oy + b.ty * T : oy + (b.ty + def.h) * T - (def.w === 1 ? 6 : type === "well" ? 4 : 2) * z;
  blit(ctx, ghostObj.key, ghostObj.spr, gx, gy, z, t, 0.7, type === "coop" ? 1024 : 512);
}

function drawBobber(ctx, g, ox, oy, z, t) {
  const f = g.fishing;
  const p = g.player;
  const bx = ox + f.bx * z;
  const by = oy + (f.by + (f.phase === "bite" ? Math.sin(t * 30) * 2 : Math.sin(t * 3) * 1.2)) * z;
  const hx = ox + (p.x + (p.dir === "left" ? -22 : p.dir === "right" ? 22 : 8)) * z;
  const hy = oy + (p.y - 40) * z;
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.quadraticCurveTo((hx + bx) / 2, Math.max(hy, by) + 10 * z, bx, by);
  ctx.stroke();
  if (f.phase === "cast") return;
  ctx.fillStyle = "#e8566a";
  ctx.strokeStyle = "#3a2530";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(bx, by, 3.5 * z, 0, 6.283);
  ctx.fill();
  ctx.stroke();
}

